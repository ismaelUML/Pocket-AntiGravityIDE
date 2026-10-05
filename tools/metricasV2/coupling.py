"""coupling: Ca, Ce, I, A y D por componente, con el grafo entero de cada superficie, y la
calificación de su producción.

Soporta JavaScript (Node.js en src/) y superficies políglotas.
Trazabilidad: standards/Metricas_final.md §3.1, §3.4, §5.2, §5.3 y §5.5 · CODE_STANDARDS §7.3.1
"""
import csv, os, shutil, subprocess, sys, tempfile
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import admit_probe, model

PROBES = (('app/backend', 'gocoup', ('go', 'run', '.'), 'backend'),
          ('app/frontend', 'dartmet', ('dart', 'run', 'bin/dartcoup.dart'), 'frontend'))
FILE_PROBES = (('app/backend/', 'backend', admit_probe.PROBES['.go']),
               ('app/frontend/', 'frontend', admit_probe.PROBES['.dart']))
GATES = 'app/backend/test/'
ENV = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONDONTWRITEBYTECODE='1')


def component_of(path):
    """El componente de un archivo de producción de src/ o app/, o None si no es de ninguno."""
    p = path.replace('\\', '/')
    if (p.startswith('src/') or not p.startswith('app/')) and p.endswith('.js') and not p.endswith('.test.js'):
        import jscoup
        return jscoup.get_component_name(p)
    head, name = os.path.split(path)
    if path.startswith('app/backend/') and name.endswith('.go') and not name.endswith('_test.go') \
            and '/testdata/' not in path + '/' and not path.startswith(GATES):
        return head
    return dart_package(path) if name.endswith('.dart') else None


def dart_package(path):
    """El paquete local de un archivo de su lib/: la raíz de app/frontend o uno de packages/."""
    parts = path.split('/')
    if parts[:3] == ['app', 'frontend', 'lib']:
        return 'app/frontend'
    if parts[:3] == ['app', 'frontend', 'packages'] and len(parts) > 5 and parts[4] == 'lib':
        return '/'.join(parts[:4])
    return None


def run(app):
    """{prefijo: filas de su sonda} medidas sobre la carpeta que se indica."""
    if os.path.isdir(os.path.join(app, 'src')) or os.path.basename(app) == 'src':
        import jscoup
        root = os.path.dirname(app) if os.path.basename(app) == 'src' else app
        return {'src': jscoup.analyze_project(root)}
    out = {}
    for prefix, sub, cmd, surface in PROBES:
        target_dir = os.path.join(app, surface)
        if not os.path.isdir(target_dir):
            continue
        text = subprocess.run(cmd + (target_dir,), cwd=os.path.join(HERE, sub), env=ENV,
                              stdout=subprocess.PIPE, encoding='utf-8', check=True).stdout
        out[prefix] = list(csv.DictReader(text.splitlines(), delimiter='\t'))
    return out


def load(d):
    """Lo mismo que run, leído de go_coup.tsv y dart_coup.tsv de measure.sh."""
    out = {}
    for (prefix, *_), fn in zip(PROBES, ('go_coup.tsv', 'dart_coup.tsv')):
        fpath = os.path.join(d, fn)
        if not os.path.isfile(fpath):
            continue
        with open(fpath, encoding='utf-8') as f:
            out[prefix] = list(csv.DictReader((l.rstrip('\r\n') for l in f), delimiter='\t'))
    return out


def name(prefix, rel):
    return prefix if rel in ('', '.') else f'{prefix}/{rel}'


def components(probed):
    """{componente: métricas}, con Ca contado sobre el grafo de su superficie."""
    comps = {}
    for prefix, found in probed.items():
        if prefix == 'src':
            for r in found:
                c = r['component']
                comps[c] = dict(name=c, lang=r.get('lang', 'JavaScript'), files=int(r['files']),
                                nc=int(r['nc']), na=int(r['na']), ca=int(r['ca']), ce=int(r['ce']),
                                a=float(r['a']), i=float(r['i']), d=float(r['d']))
            continue
        rows = [r for r in found if not (name(prefix, r['component']) + '/').startswith(GATES)]
        deps = {name(prefix, r['component']): {name(prefix, d) for d in r['deps'].split(',') if d} for r in rows}
        for r in rows:
            c = name(prefix, r['component'])
            ce = len(deps[c] & deps.keys())
            ca = sum(c in ds for ds in deps.values())
            a, i = model.abstractness(int(r['na']), int(r['nc'])), model.instability(ca, ce)
            comps[c] = dict(name=c, lang='Go' if prefix == 'app/backend' else 'Dart', files=int(r['files']),
                            nc=int(r['nc']), na=int(r['na']), ca=ca, ce=ce, a=a, i=i, d=model.distance(a, i))
    return comps


def subset(app, prefix, where, only, tmp):
    """Copia a tmp la producción de esos componentes, con la misma ruta relativa; None si no hay."""
    root, dest, hit = os.path.join(app, *where.split('/')), os.path.join(tmp, where), False
    for folder, _, files in os.walk(root):
        for f in files:
            rel = os.path.relpath(os.path.join(folder, f), root).replace(os.sep, '/')
            if component_of(prefix + rel) in only:
                os.makedirs(os.path.join(dest, os.path.dirname(rel)), exist_ok=True)
                shutil.copy(os.path.join(folder, f), os.path.join(dest, rel))
                hit = True
    return dest if hit else None


def probe(app, only=None):
    """{ruta: fila de sonda} de la producción de la carpeta indicada; con only, sólo la de esos componentes."""
    if os.path.isdir(os.path.join(app, 'src')) or os.path.basename(app) == 'src':
        import jscoup, jsmet
        root = os.path.dirname(app) if os.path.basename(app) == 'src' else app
        files_info = jscoup.discover_components(root)
        rows = {}
        for comp, rel, full in files_info:
            if only is not None and comp not in only:
                continue
            try:
                with open(full, encoding='utf-8') as f:
                    src = f.read()
            except Exception:
                continue
            total, comment, blank, loc, funcs = jsmet.js_metrics(src)
            g_sum = sum(g for _, g, _ in funcs)
            g_max, g_max_fn = max(((g, n) for n, g, _ in funcs), default=(0, ""))
            gs = ",".join(str(g) for _, g, _ in funcs)
            gate_cands = [(g, n) for n, g, nl in funcs if not nl]
            g_gate, g_gate_fn = max(gate_cands, default=(0, ""))
            rows[rel] = {
                'file': rel, 'total': str(total), 'comment': str(comment), 'blank': str(blank),
                'loc': str(loc), 'funcs': str(len(funcs)), 'g_sum': str(g_sum), 'g_max': str(g_max),
                'g_max_fn': g_max_fn, 'g_fns': gs, 'g_gate': str(g_gate), 'g_gate_fn': g_gate_fn
            }
        return rows

    rows = {}
    with tempfile.TemporaryDirectory() as tmp:
        for prefix, where, (sub, cmd) in FILE_PROBES:
            root = os.path.join(app, *where.split('/')) if only is None else subset(app, prefix, where, only, tmp)
            if root is None or not os.path.isdir(root):
                continue
            found = admit_probe.run(sub, cmd, root)
            rows.update({prefix + r['file']: r for r in found if component_of(prefix + r['file'])})
    return rows


def rate(comps, rows, only=None):
    """Suma a cada componente su CCE, CR, VA, TDR y calificación, con las filas de su producción; con
    only, sólo a esos componentes."""
    by = defaultdict(list)
    for p, r in rows.items():
        comp = component_of(p)
        if comp:
            by[comp].append(r)
    for c, m in comps.items():
        if only is not None and c not in only:
            continue
        loc = sum(int(r['loc']) - int(r['blank']) for r in by[c])
        gs = [g for r in by[c] for g in model.g_values(r['g_fns'])]
        m.update(zip(('cce', 'cr', 'va', 'tdr', 'rating'), model.debt(m['lang'], loc, gs)))
    return comps


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    app_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    for c, m in sorted(components(run(app_dir)).items()):
        print(c, m)
