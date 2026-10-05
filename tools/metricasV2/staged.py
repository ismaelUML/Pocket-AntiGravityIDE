"""staged.py [--since <revisión>]: el control de admisión de los techos por archivo sobre lo que
entra al repositorio. Sin argumentos mide el stage, y lo invoca el hook .githooks/pre-commit; con
--since mide HEAD contra su base común con esa revisión, y lo invoca `make metrics-check` en la
integración continua.

Mide cada archivo de src/ o app/ agregado, copiado, modificado o renombrado —en la versión del stage o de
HEAD, nunca la del disco— con las sondas y los techos de admit.py, y exime a los que tienen fila en
«Excepciones» de registro_metricas.md.
Trazabilidad: CODE_STANDARDS §7.1 y §7.3.1 · registro_metricas.md, «Excepciones»
"""
import os, re, subprocess, sys, tempfile

sys.dont_write_bytecode = True  # sin __pycache__ en tools/metricas/, que se versiona
import admit_ceilings, admit_probe, coupling, staged_report, staged_tree

REGISTRY = 'registro_metricas.md'
RANGE = re.compile(r'\s*`([^`]+)` a `([^`]+)`')
USAGE = 'uso: staged.py [--since <revisión>]'


def git(*args):
    out = subprocess.run(('git',) + args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if out.returncode:
        sys.exit(f'staged.py: git {" ".join(args)}: {out.stderr.decode("utf-8", "replace").strip()}')
    return out.stdout


def text(*args):
    return git(*args).decode('utf-8').strip()


def scope(argv):
    """(revisión medida, argumentos de diff, rótulo del reporte). La revisión vacía es el stage."""
    if not argv:
        who = f'{text("config", "user.name")} sobre la rama `{text("branch", "--show-current")}`'
        return '', ('--cached',), f'el stage de {who}: la versión del stage, no la del disco'
    if len(argv) != 2 or argv[0] != '--since':
        sys.exit(USAGE)
    base = text('merge-base', argv[1], 'HEAD')
    return 'HEAD', (base, 'HEAD'), f'`{text("rev-parse", "--short", "HEAD")}`, con lo que cambió desde `{base[:12]}`'


def tracked(folder, rev):
    cmd = ('ls-tree', '-r', '--name-only', '-z', rev) if rev else ('ls-files', '-z')
    out = git(*cmd, '--', folder).decode('utf-8')
    return [p for p in out.split('\0') if p]


def changed(diff):
    out = git('diff', '--name-only', '-z', '--diff-filter=ACMR', *diff, '--', 'src/', 'app/')
    return [p for p in out.decode('utf-8').split('\0') if p and admit_probe.probe_for(p)]


def expand(cell, rev):
    """Las rutas que nombra la primera columna: una lista de `ruta`, o un rango `primera` a `última`."""
    m = RANGE.match(cell)
    tracked_files = set(tracked('src/', rev)) | set(tracked('app/', rev))
    if not m:
        matches = set()
        for t in re.findall(r'`([^`]+)`', cell):
            if t in tracked_files:
                matches.add(t)
            elif 'src/' + t in tracked_files:
                matches.add('src/' + t)
            elif 'app/' + t in tracked_files:
                matches.add('app/' + t)
        return matches
    first, last = m.groups()
    base_dir = os.path.dirname(first)
    folder = base_dir if base_dir.startswith(('src/', 'app/')) else ('src/' + base_dir if tracked('src/', rev) else 'app/' + base_dir)
    suffix = first.split('.', 1)[1] if '.' in first else ''
    names = (os.path.basename(p) for p in tracked_files if os.path.dirname(p) == folder)
    lo, hi = os.path.basename(first), os.path.basename(last)
    return {f'{folder}/{n}' for n in names if lo <= n <= hi and (not suffix or n.endswith('.' + suffix))}


def exempt(rev):
    out = subprocess.run(('git', 'show', f'{rev}:{REGISTRY}'), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if out.returncode != 0:
        return set()
    table = out.stdout.decode('utf-8', 'replace')
    if '\n## Excepciones' not in table:
        return set()
    table = table.split('\n## Excepciones', 1)[1].split('\n## ', 1)[0]
    rows = [r for r in table.splitlines() if r.startswith('|')][2:]
    cells = {r.split('|')[1]: expand(r.split('|')[1], rev) for r in rows if '|' in r}
    unread = [c.strip() for c, paths in cells.items() if not paths]
    if unread:
        sys.exit(f'staged.py: la fila de «Excepciones» que empieza con {unread[0]!r} no nombra '
                 f'ningún archivo versionado; corregila en {REGISTRY}')
    return set().union(*cells.values())


def copy_blobs(paths, rev, tmp):
    """{ruta: copia en tmp de su versión medida}, una subcarpeta por archivo como en admit_probe."""
    copies = {}
    for i, (p, blob) in enumerate(zip(paths, staged_tree.read(rev, paths))):
        os.mkdir(os.path.join(tmp, str(i)))
        copies[p] = os.path.join(tmp, str(i), os.path.basename(p))
        with open(copies[p], 'wb') as f:
            f.write(blob)
    return copies


def judge(paths, free, rev, label, tmp):
    """Mide, imprime y, si frena, escribe el reporte mientras las copias todavía existen."""
    copies = copy_blobs([p for p in paths if p not in free], rev, tmp)
    measured = admit_probe.measure(list(copies.values()))
    rows = {p: measured.get(c, admit_ceilings.UNMEASURED) for p, c in copies.items()}
    owners = set(map(coupling.component_of, rows)) - {None}
    comps = staged_tree.components(rev, tmp, owners) if owners else {}
    why = {p: admit_ceilings.breaches(p, r, comps.get(coupling.component_of(p))) for p, r in rows.items()}
    exempted = [p for p in paths if p in free]
    print('\n'.join([f'{"exceptuado":<12} {p}   fila en «Excepciones»' for p in exempted]
                    + [admit_ceilings.line(p, rows[p], why[p]) for p in rows]))
    return staged_report.write(rows, why, exempted, copies, label, comps) if any(why.values()) else None


def main(argv):
    os.chdir(text('rev-parse', '--show-toplevel'))
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    staged_report.clear()
    rev, diff, label = scope(argv)
    paths = changed(diff)
    if not paths:
        return
    free = exempt(rev)
    with tempfile.TemporaryDirectory() as tmp:
        report = judge(paths, free, rev, label, tmp)
    if report and rev:
        with open(report, encoding='utf-8') as f:
            print('\n' + f.read())
    if report:
        sys.exit(f'\nFrenado: hay archivos fuera de los techos de CODE_STANDARDS §7.1 y §7.3.1 '
                 f'sin fila en «Excepciones» de {REGISTRY}.\nQué hacer con cada uno: {report}')


main(sys.argv[1:])
