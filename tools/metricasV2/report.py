"""report.py <dir>: imprime en Markdown el resumen, los componentes y la matriz por carpeta.

Lee rows.tsv y components.tsv de matrix.py. La salida reemplaza lo que hay entre las marcas
MATRIZ de app/registro_metricas.md. «—» es lo que no está definido: SQL y shell no están
calibrados (IE-103), D sin tipos (§5.5) y CO fuera del Core (IE-102). La CCE y la calificación son
del componente, y la calificación es la de admisión, sólo con la CCE; la deuda y el TDR totales
suman la de adentro de los umbrales (§5.7, IE-105).
Trazabilidad: CODE_STANDARDS §7.1 y §7.3.1 · standards/Metricas_final.md §2.1, §3.1 y §5
"""
import csv, os, sys
from collections import defaultdict

sys.dont_write_bytecode = True  # sin __pycache__ en tools/metricas/, que se versiona
import model

KINDS = ['producción', 'prueba', 'gate', 'migración']


def load(d, name):
    with open(os.path.join(d, name), encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def f(v):
    return None if v == '' else float(v)


def n(v, places=2):
    return model.num(f(v), places)


def count(rows, test):
    return sum(1 for r in rows if test(r))


def hours(rows, key):
    return model.num(sum(f(r[key]) or 0 for r in rows))


def head(cols):
    """Encabezado y fila separadora de una sola lista de (título, alineada a la derecha): no pueden
    quedar con distinta cantidad de celdas, que es lo que hace que Markdown no la muestre como tabla."""
    return ['| ' + ' | '.join(t for t, _ in cols) + ' |', '|' + ''.join('---:|' if r else '---|' for _, r in cols)]


def cols(left, right, *more):
    """Los títulos de `left` alineados a la izquierda y los de `right` a la derecha, y así en pares."""
    groups = (left, right) + more
    return [(t, i % 2 == 1) for i, g in enumerate(groups) for t in g]


def summary(files, comps):
    out = head(cols(['Tipo'], ['Archivos', 'No admitidos', 'LOC > 150', 'G sumado ≥ 10',
                               'G de una función sobre el techo', 'En componente peor que A',
                               'En componente con D > 0,7', 'MI < 20', 'Deuda de largo (h)']))
    for k in KINDS + ['total']:
        sub = files if k == 'total' else [r for r in files if r['kind'] == k]
        out.append(f"| {k} | {len(sub)} | {count(sub, lambda r: r['admitted'] == 'no')} | "
                   f"{count(sub, lambda r: int(r['loc_sc']) > 150)} | {count(sub, lambda r: int(r['g']) >= 10)} | "
                   f"{count(sub, lambda r: r['over_fn'] == '1')} | {count(sub, lambda r: r['below_a'] == '1')} | "
                   f"{count(sub, lambda r: r['red_d'] == '1')} | {count(sub, lambda r: float(r['mi']) < 20)} | "
                   f"{hours(sub, 'dt_in')} |")
    rate = {c['component']: model.RATE[c['lang']] for c in comps}
    usd = sum((f(c['dt']) + f(c['dt_d'] or '0')) * rate[c['component']] for c in comps)
    return out + ['', f"Por componente, sobre su producción: CCE {sum(int(c['cce']) for c in comps)}, deuda por CCE "
                      f"{hours(comps, 'dt')} h y deuda de D sobre el objetivo {hours(comps, 'dt_d')} h, con un costo "
                      f"de USD {model.num(usd)}. La deuda dentro de los umbrales —el largo y D— es un supuesto de "
                      f"calibración (§5.7, IE-105)."]


def mean_distance(comps, lang=None):
    rows = [c for c in comps if c['d'] and (lang is None or c['lang'] == lang)]
    weight = sum(int(c['loc_ef']) for c in rows)
    return model.ratio(sum(int(c['loc_ef']) * float(c['d']) for c in rows), weight, 1)


def components(comps):
    out = head(cols(['Componente'], ['Archivos', 'LOC efectivas', 'Nc', 'Na', 'A', 'Ce', 'Ca', 'I', 'D', 'CCE',
                                     'TDR (%)'],
                    ['Calificación'], ['Deuda dentro de los umbrales (h)', 'Deuda de D (h)', 'Deuda total (h)',
                                       'TDR total (%)', 'FF', 'α', 'CO (USD)', 'CNHN (USD)', 'ROI (%)']))
    for c in comps:
        out.append(f"| `{c['component']}` | {c['files']} | {c['loc_ef']} | {c['nc']} | {c['na']} | {n(c['a'])} | "
                   f"{c['ce']} | {c['ca']} | {n(c['i'])} | {n(c['d'])} | {c['cce']} | {n(c['tdr'])} | {c['rating']} | "
                   f"{n(c['dt_in'])} | {n(c['dt_d'])} | {n(c['dt_total'])} | {n(c['tdr_total'])} | "
                   f"{n(c['ff'], 3)} | {n(c['alpha'])} | {n(c['co'])} | {n(c['cnhn'])} | {n(c['roi'])} |")
    means = ' · '.join(f'{lang} {model.num(mean_distance(comps, lang), 3)}' for lang in model.CAL)
    return out + ['', f'D̄ ponderado por LOC efectivas, sobre los componentes con D definido: {means} · '
                      f'sistema {model.num(mean_distance(comps), 3)}.']


def folders(files):
    by_dir = defaultdict(list)
    for r in files:
        by_dir[os.path.dirname(r['path'])].append(r)
    out = []
    for d in sorted(by_dir):
        rs = by_dir[d]
        out += [f"\n#### `{d}/` — {count(rs, lambda r: r['admitted'] == 'no')} de {len(rs)} no admitidos\n"]
        out += head(cols(['Archivo', 'Tipo'], ['LOC', 'LOC efectivas', 'G', 'G máx.', 'MI', 'Deuda de largo (h)'],
                         ['Admitido']))
        out += [f"| `{os.path.basename(r['path'])}` | {r['kind']} | {r['loc_sc']} | {r['loc_ef']} | {r['g']} | {r['gmax']} | "
                f"{n(r['mi'])} | {n(r['dt_in'])} | {r['admitted']} |" for r in rs]
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    files, comps = load(sys.argv[1], 'rows.tsv'), load(sys.argv[1], 'components.tsv')
    print('\n'.join(summary(files, comps) + ['', '### Componentes', ''] + components(comps) + ['', '### Archivos']
                    + folders(files)))


main()
