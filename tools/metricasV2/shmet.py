"""shmet: la métrica de un script de shell, con el awk que lleva adentro.

Unidades: el nivel superior del script, cada función de shell y cada función de awk. G de cada una
es 1 más sus decisiones, y la del archivo es la suma.

Lo que va entre comillas no es shell y no se cuenta, salvo el programa de awk: la cadena simple que
se le pasa a `awk`, o la que se asigna a una variable `AWK_*` para concatenarla en esa invocación.
Ese programa se mide como awk y su G es del script que lo contiene: las decisiones de sus reglas
van a la unidad de shell donde está escrito, y cada función de awk es una unidad propia.

Decisión de shell: `if`, `elif`, `for`, `while` y `until` en posición de orden, `&&` y `||`.
Decisión de awk: el patrón de una regla (no BEGIN ni END), `if`, `while`, `for`, `case`, `&&`, `||`
y el `?` del ternario, fuera de cadenas, expresiones regulares y comentarios.
"""
import re

SH_KW = re.compile(r"(?:^|(?<=[;&|(\s]))(?:if|elif|for|while|until)\b")
SH_OP = re.compile(r"&&|\|\|")
SH_FUNC = re.compile(r"(?m)^[ \t]*([\w-]+)[ \t]*\(\)[ \t]*\{")
AWK_DEC = re.compile(r"\b(?:if|while|for|case)\b|&&|\|\||\?")
AWK_OWNER = re.compile(r"\bawk\b[^|;]*$|\bAWK_\w*=$")


def blank_out(chars, start, end):
    for k in range(start, min(end, len(chars))):
        if chars[k] != '\n':
            chars[k] = ' '


def closing_double(src, i):
    j = i + 1
    while j < len(src) and src[j] != '"':
        j += 2 if src[j] == '\\' else 1
    return j


def is_awk_program(src, i):
    line = src[src.rfind('\n', 0, i) + 1:i]
    return AWK_OWNER.search(line) is not None and not re.search(r"-F\s*$", line)


def lex(src):
    """El código de shell con comentarios y cadenas en blanco, y los programas de awk con su posición."""
    out, programs = list(src), []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c == '\\':
            i += 2
        elif c == '#' and (i == 0 or src[i - 1] in ' \t\n;'):
            j = src.find('\n', i) % (n + 1)
            blank_out(out, i, j)
            i = j
        elif c == "'":
            j = src.find("'", i + 1) % (n + 1)
            if is_awk_program(src, i):
                programs.append((i, src[i + 1:j]))
            blank_out(out, i, j + 1)
            i = j + 1
        elif c == '"':
            j = closing_double(src, i)
            blank_out(out, i, j + 1)
            i = j + 1
        else:
            i += 1
    return ''.join(out), programs


def skip_regex(p, i):
    bracket = False
    while i < len(p) and (p[i] != '/' or bracket):
        if p[i] == '\\':
            i += 1
        elif p[i] in '[]':
            bracket = p[i] == '['
        i += 1
    return i + 1


def awk_code(prog):
    """El programa de awk sin comentarios, cadenas ni expresiones regulares."""
    out, prev, i = [], '', 0
    while i < len(prog):
        c = prog[i]
        if c == '#':
            i = prog.find('\n', i) % (len(prog) + 1)
            continue
        if c == '"':
            i, c = closing_double(prog, i) + 1, '""'
        elif c == '/' and not (prev and (prev.isalnum() or prev in '_)]')):
            i, c = skip_regex(prog, i + 1), '//'
        else:
            i += 1
        out.append(c)
        prev = c[-1] if c.strip() else prev
    return ''.join(out)


def block_end(p, i):
    depth = 0
    for k in range(i, len(p)):
        depth += {'{': 1, '}': -1}.get(p[k], 0)
        if depth == 0:
            return k + 1
    return len(p)


def awk_items(p):
    """Cada elemento del nivel superior del programa: (cabecera, cuerpo)."""
    i = 0
    while True:
        i = len(p) - len(p[i:].lstrip())
        if i >= len(p):
            return
        j = i
        while j < len(p) and p[j] not in '{\n':
            j += 1
        end = block_end(p, j) if j < len(p) and p[j] == '{' else j
        yield p[i:j], p[j:end]
        i = end


def awk_units(prog):
    """(decisiones de las reglas, [(nombre, G)] de las funciones)."""
    rules, funcs = 0, []
    for head, body in awk_items(awk_code(prog)):
        name = re.match(r"function\s+(\w+)", head)
        if name:
            funcs.append((name.group(1), 1 + len(AWK_DEC.findall(body))))
            continue
        if head.strip() and not re.match(r"(?:BEGIN|END)\b", head):
            rules += 1 + len(AWK_DEC.findall(head))
        rules += len(AWK_DEC.findall(body))
    return rules, funcs


def shell_units(code):
    """[nombre, G, inicio, fin] del nivel superior y de cada función de shell."""
    units = [['script', 1, 0, len(code)]]
    for m in SH_FUNC.finditer(code):
        units.append([m.group(1), 1, m.start(), block_end(code, m.end() - 1)])
    return units


def owner(units, pos):
    inner = [u for u in units[1:] if u[2] <= pos < u[3]]
    return inner[-1] if inner else units[0]


def measure(src):
    """[(G, unidad)] de un script de shell: el nivel superior, sus funciones y las de awk."""
    code, programs = lex(src)
    units = shell_units(code)
    for m in list(SH_KW.finditer(code)) + list(SH_OP.finditer(code)):
        owner(units, m.start())[1] += 1
    extra = []
    for pos, prog in programs:
        rules, funcs = awk_units(prog)
        owner(units, pos)[1] += rules
        extra += funcs
    return [(u[1], u[0]) for u in units] + [(g, n) for n, g in extra]
