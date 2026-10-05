"""staged_report: el reporte de lo que staged.py frenó, para que quien lo frenó sepa qué partir y cómo.

staged.py lo escribe en .git/metricas/rechazo.md —git no lo versiona— sólo cuando frena, y lo
borra cuando pasa, para que nunca quede uno viejo describiendo otro cambio. En la integración
continua va además al resumen de la corrida, que es donde lo ve quien no tiene el clon. Por
archivo da los números, el techo que pasa y la salida que el estándar da para ese techo; en Go
agrega el desglose por declaración de outline/, que es con lo que se decide el corte.
Trazabilidad: CODE_STANDARDS §3.0.6, §7.1, §7.3 y §7.3.1 · standards/Metricas_final.md §4.3 y §5 ·
app/registro_metricas.md
"""
import datetime, os, subprocess

import admit_ceilings as ac
import coupling, model

HERE = os.path.dirname(os.path.abspath(__file__))

SPLIT_FILE = ('**Partir el archivo por responsabilidad**, en archivos con nombre dentro del mismo '
              'paquete (`CODE_STANDARDS` §7.3.1). Extraer funciones no baja la suma: cada función '
              'nueva arranca en 1.')
SPLIT_HOW = {
    '.go': ('El desglose de abajo sirve para elegir el corte, y `tools/metricas/gosplit` mueve '
            'declaraciones enteras a otro archivo sin tocar una línea de lógica.'),
    '.sql': ('El archivo original puede quedar como punto de entrada e incluir las partes con `\\ir`, '
             'como `app/bdd/fsm/transitions.sql`: así siguen ciertas las citas que lo nombran.'),
    '.sh': ('Si otro lo invoca por nombre, conserva el nombre e incluye sus fragmentos con `.`, como '
            'los scripts de gate de `app/bdd/test/`.'),
}
SPLIT_FN = ('**Bajar `{fn}`** con las cuatro salidas de §3.0.6, en ese orden: guarda en lógica '
            'negativa, tabla de casos, `switch` exhaustivo o polimorfismo, y extracción a función '
            'con nombre (`CODE_STANDARDS` §7.3).')
SPLIT_FN_FIRST = 'Pasa de G {max}: se divide la función antes de partir el archivo (`Metricas_final` §4.2).'
LOWER_CCE = ('**Bajar la CCE de `{comp}`**, que tiene calificación {grade} con TDR {tdr} %: la CC del componente '
             'es P + 1, con P los predicados de toda su producción —incluido el `switch` exhaustivo—, y lo que '
             'pasa del umbral del lenguaje se cobra sobre el costo de escribirlo (`Metricas_final` §5.2 y §5.3). '
             'Frena a todo archivo de producción del componente, no sólo a éste.')
FIX_STRUCTURE = ('**`{comp}` está fuera de la secuencia principal** —A {a}, I {i}, D {d}—: la estructura va '
                 'antes que la G (`Metricas_final` §4.3). Lo estable se vuelve abstracto, o lo concreto deja de '
                 'ser del que dependen: extraer la interfaz donde se consume o invertir la dependencia. Frena a '
                 'todo archivo de producción del componente, no sólo a éste (§5.5).')
EXCEPTION = ('Si el archivo necesita pasar el techo para subsistir —`switch` exhaustivo, composition '
             'root, migración aplicada—, la salida no es partirlo sino registrar su fila en '
             '«Excepciones» de `app/registro_metricas.md` —archivo, métrica, valor, razón y fecha de '
             'revisión— **en el mismo commit**: la tabla se lee de la misma versión que se mide (§7.3.1).')
FOOTER = ('Este control no cuenta el techo por función de §7.3 —3, o 6 con guardas—: ése lo '
          'cuentan `make cc-check` y el linter, y conviene correrlos antes de volver a commitear.')
SUMMARY = 'GITHUB_STEP_SUMMARY'


def git(*args):
    return subprocess.run(('git',) + args, stdout=subprocess.PIPE, encoding='utf-8').stdout.strip()


def target():
    """En un worktree .git es un archivo, así que la carpeta la dice git y no la ruta."""
    return os.path.join(git('rev-parse', '--git-dir'), 'metricas', 'rechazo.md')


def outlines(copies):
    """{copia: su desglose por declaración}, con una sola corrida de outline para todas."""
    if not copies:
        return {}
    out = subprocess.run(('go', 'run', '.') + tuple(copies), cwd=os.path.join(HERE, 'outline'),
                         stdout=subprocess.PIPE, encoding='utf-8')
    if len(copies) == 1:
        return {copies[0]: out.stdout if out.returncode == 0 else ''}
    found = {}
    for chunk in ('\n' + out.stdout).split('\n== ')[1:]:
        copy, _, text = chunk.partition('\n')
        found[copy] = text
    return {c: found.get(c, '') for c in copies}


def block(text):
    return f'```text\n{text.rstrip()}\n```' if text.strip() else ''


def advice(path, r, detail, comp):
    loc, g, gfn = int(r['loc']), int(r['g_sum']), int(r['g_gate'])
    steps = [SPLIT_FN.format(fn=r['g_gate_fn'])] if gfn > model.fn_ceiling(model.lang_of(path)) else []
    steps += [SPLIT_FN_FIRST.format(max=ac.G_FN_SPLIT)] if gfn > ac.G_FN_SPLIT else []
    how = SPLIT_HOW.get(os.path.splitext(path)[1])
    steps += [SPLIT_FILE] + ([how] if how else []) if loc > ac.LOC_MAX or g > ac.G_FILE_MAX else []
    comp = comp or {}
    if comp.get('rating') not in (None, 'A'):
        steps += [LOWER_CCE.format(comp=comp['name'], grade=comp['rating'], tdr=model.num(comp['tdr']))]
    if comp.get('d') is not None and comp['d'] > model.D_MAX:
        steps += [FIX_STRUCTURE.format(comp=comp['name'], a=model.num(comp['a']), i=model.num(comp['i']),
                                       d=model.num(comp['d']))]
    return steps + [EXCEPTION], block(detail)


def section(path, r, why, detail, comp):
    steps, detail = advice(path, r, detail, comp)
    head = [f'### `{path}`', '', f'LOC {r["loc"]} · G sumado {r["g_sum"]} · G máx. {r["g_max"]} '
            f'en `{r["g_max_fn"]}`', '', '**Qué techo pasa**', '']
    body = [f'- {w}' for w in why] + ['', '**Cómo actuar**', ''] + [f'{i}. {s}' for i, s in enumerate(steps, 1)]
    return '\n'.join(head + body + ([] if not detail else ['', '**Desglose por declaración**', '', detail]))


def summary(rows, why, free, comps):
    lines = ['| Archivo | LOC | G sumado | G máx. | Calificación del componente | D del componente | Resultado |',
             '|---|---:|---:|---:|---|---:|---|']
    for p, r in rows.items():
        comp = comps.get(p) or {}
        lines.append(f'| `{p}` | {r["loc"]} | {r["g_sum"]} | {r["g_max"]} | {comp.get("rating") or "—"} | '
                     f'{model.num(comp.get("d"))} | {"no admitido" if why[p] else "admitido"} |')
    return lines + [f'| `{p}` | — | — | — | — | — | exceptuado |' for p in free]


def dump(path, body, mode):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, mode, encoding='utf-8', newline='\n') as f:
        f.write(body)


def write(rows, why, free, copies, label, comps):
    """label dice qué se midió: el stage de quién, o qué revisión contra qué base. comps, las
    métricas del componente de cada archivo de producción."""
    when = datetime.datetime.now().astimezone().strftime('%Y-%m-%d %H:%M %z')
    langs = ', '.join(f'{lang} {cal.ccu}' for lang, cal in model.CAL.items())
    parts = ['# Frenado por métricas', '', f'{when} · se midió {label}', '',
             f'Techos (`CODE_STANDARDS` §7.1 y §7.3.1): por archivo, como máximo {ac.LOC_MAX} líneas sin '
             f'comentario y G sumado menor que {ac.G_FILE_MAX + 1}; por función, G ≤ {langs}, y {model.FN_MAX} '
             f'en SQL y shell; por componente, calificación A y D ≤ {model.num(model.D_MAX, 1)}.',
             '', '## Lo que se midió', '']
    mine = {p: comps.get(coupling.component_of(p)) for p in rows}
    parts += summary(rows, why, free, mine) + ['', '## Qué hacer con cada archivo frenado', '']
    detail = outlines([copies[p] for p in rows if why[p] and p.endswith('.go')])
    parts += [section(p, rows[p], why[p], detail.get(copies[p], ''), mine[p]) + '\n' for p in rows if why[p]]
    body, path = '\n'.join(parts + ['---', '', FOOTER, '']), target()
    dump(path, body, 'w')
    if os.environ.get(SUMMARY):
        dump(os.environ[SUMMARY], body, 'a')
    return os.path.abspath(path)


def clear():
    if os.path.exists(target()):
        os.remove(target())
