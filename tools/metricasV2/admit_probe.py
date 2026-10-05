"""admit_probe: mide archivos sueltos con las sondas de measure.sh y devuelve la fila de cada uno.

Las sondas recorren una carpeta, así que cada archivo se copia a una subcarpeta numerada de una
carpeta temporal, y su fila vuelve a la ruta original por ese número. Las columnas son las de
measure.sh: total, comment, blank, loc, funcs, g_sum, g_max, g_max_fn.
Trazabilidad: CODE_STANDARDS §7.3.1 · standards/Metricas_final.md §2.1 y §4.2
"""
import csv, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PROBES = {
    '.js': ('.', (sys.executable, 'jsmet.py')),
    '.py': ('.', (sys.executable, 'pymet.py')),
    '.go': ('gomet', ('go', 'run', '.')),
    '.dart': ('dartmet', ('dart', 'run', 'bin/dartmet.dart')),
    '.sql': ('.', (sys.executable, 'sqlmet.py')),
    '.sh': ('.', (sys.executable, 'sqlmet.py')),
}
ENV = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONDONTWRITEBYTECODE='1')


def probe_for(path):
    return PROBES.get(os.path.splitext(path)[1])


def stage(paths, tmp):
    for i, p in enumerate(paths):
        target_dir = os.path.join(tmp, str(i))
        os.mkdir(target_dir)
        shutil.copy(p, target_dir)


def run(sub, cmd, tmp):
    out = subprocess.run(cmd + (tmp,), cwd=os.path.join(HERE, sub), env=ENV, stdout=subprocess.PIPE,
                         encoding='utf-8', check=True).stdout
    return csv.DictReader(out.splitlines(), delimiter='\t')


def measure(paths):
    """{ruta: fila de su sonda}, para archivos que tienen sonda."""
    if not paths:
        return {}
    with tempfile.TemporaryDirectory() as tmp:
        stage(paths, tmp)
        probes = [p for p in set(map(probe_for, paths)) if p is not None]
        rows = [r for sub, cmd in probes for r in run(sub, cmd, tmp)]
    return {paths[int(r['file'].replace('\\', '/').split('/')[0])]: r for r in rows}
