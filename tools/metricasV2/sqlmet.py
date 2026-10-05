"""sqlmet: por archivo .sql/.sh -> total, comentario, blanco, LOC, unidades, G sumado, G máximo, la G de
cada unidad y la que juzga el techo por función, que acá es la máxima.

Comentario: línea cuyo único contenido es `--...` o está dentro de /* */ (fuera de literales).
G de PL/pgSQL, por rutina (cuerpo entre $tag$ ... $tag$): 1 + IF + ELSIF + WHEN + LOOP de apertura
+ AND + OR, menos el AND de un BETWEEN. No cuenta `END IF`, `END LOOP` ni lo que va fuera de una rutina.
Shell: comentario es la línea que empieza con `#`, y la G la calcula shmet.
"""
import os, re, sys

sys.dont_write_bytecode = True  # sin __pycache__ en tools/metricas/, que se versiona
import shmet

def classify(text):
    lines = text.replace('\r\n', '\n').split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    code = [False] * (len(lines) + 2)
    com = [False] * (len(lines) + 2)
    i, ln, n = 0, 1, len(text)
    src = text.replace('\r\n', '\n')
    n = len(src)
    state = None
    while i < n:
        ch = src[i]
        if ch == '\n':
            ln += 1; i += 1; continue
        if state == 'block':
            com[ln] = True
            if src.startswith('*/', i):
                state = None; i += 2
            else:
                i += 1
            continue
        if state == 'str':
            code[ln] = True
            if ch == "'":
                if src.startswith("''", i):
                    i += 2; continue
                state = None
            i += 1; continue
        if ch.isspace():
            i += 1; continue
        if src.startswith('--', i):
            while i < n and src[i] != '\n':
                com[ln] = True; i += 1
            continue
        if src.startswith('/*', i):
            state = 'block'; com[ln] = True; i += 2; continue
        if ch == "'":
            state = 'str'; code[ln] = True; i += 1; continue
        code[ln] = True; i += 1
    comment = blank = 0
    for k, l in enumerate(lines, 1):
        if not l.strip():
            blank += 1
        elif com[k] and not code[k]:
            comment += 1
    return len(lines), comment, blank

def strip_comments(src):
    src = re.sub(r'/\*.*?\*/', ' ', src, flags=re.S)
    return re.sub(r'--[^\n]*', '', src)

BODY = re.compile(r'(\$[A-Za-z_]*\$)(.*?)\1', re.S)
DEC = re.compile(r"\bELSIF\b|\bWHEN\b|(?<!END )\bIF\b|(?<!END )\bLOOP\b|\bOR\b|\bAND\b", re.I)
BETWEEN_AND = re.compile(r"\bBETWEEN\b[^;]*?\bAND\b", re.I | re.S)

def sh_metrics(src):
    src = src.replace('\r\n', '\n')
    lines = src.split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    comment = sum(1 for l in lines if l.strip().startswith('#'))
    blank = sum(1 for l in lines if not l.strip())
    return len(lines), comment, blank, [(n, g) for g, n in shmet.measure(src)]

def routines(src):
    out = []
    code = strip_comments(src)
    for m in BODY.finditer(code):
        body = re.sub(r"'(?:[^']|'')*'", "''", m.group(2))
        if not re.search(r'\bBEGIN\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b', body, re.I):
            continue
        head = code[max(0, m.start() - 600):m.start()]
        names = re.findall(r'(?:FUNCTION|PROCEDURE)\s+([\w.]+)\s*\(', head, re.I)
        name = names[-1] if names else ('DO' if re.search(r'\bDO\s*$', head, re.I) else '?')
        out.append((name, 1 + len(DEC.findall(body)) - len(BETWEEN_AND.findall(body))))
    return out

def sql_metrics(src):
    return classify(src) + (routines(src),)

def main(root):
    print('file\ttotal\tcomment\tblank\tloc\tfuncs\tg_sum\tg_max\tg_max_fn\tg_fns\tg_gate\tg_gate_fn')
    for dp, _, fs in os.walk(root):
        for f in sorted(fs):
            if not (f.endswith('.sql') or f.endswith('.sh')):
                continue
            p = os.path.join(dp, f)
            src = open(p, encoding='utf-8').read()
            t, c, b, rs = (sh_metrics if f.endswith('.sh') else sql_metrics)(src)
            gmax, gname = max(((g, n) for n, g in rs), default=(0, ''))
            gs = ','.join(str(g) for _, g in rs)
            rel = os.path.relpath(p, root).replace('\\', '/')
            print(f'{rel}\t{t}\t{c}\t{b}\t{t - c}\t{len(rs)}\t{sum(g for _, g in rs)}\t{gmax}\t{gname}'
                  f'\t{gs}\t{gmax}\t{gname}')

main(sys.argv[1])
