"""matrix.py <dir>...: junta las salidas de measure.sh, escribe rows.tsv y components.tsv e imprime el resumen.

Por archivo (Metricas_final): LOC sin comentario y efectivas, G sumado y máxima, el MI de §2.1 como
dato informativo, el largo sobre el objetivo y si el archivo entra en los techos de admit_ceilings.
Por componente: A, I y D (§3.1 y §5.5), y la iteración 4 sobre su producción —CCE, deuda, CR, VA,
TDR y calificación (§5.2 y §5.3), y la Fase C (§5.4)—. SQL y shell no están calibrados: «—» (IE-103).

La deuda dentro de los umbrales (§5.7, IE-105) se suma aparte: el largo sobre el objetivo, por
archivo, y D sobre el objetivo, por componente. Entra en la deuda total y en la Fase C, nunca en
un techo.
Trazabilidad: CODE_STANDARDS §7.1 y §7.3.1 · standards/Metricas_final.md §2.1, §3.1 y §5
"""
import csv, math, os, sys
from collections import defaultdict

sys.dont_write_bytecode = True  # sin __pycache__ en tools/metricas/, que se versiona
import admit_ceilings, coupling, model

SOURCES = (('go.tsv', 'app/backend/'), ('dart.tsv', 'app/frontend/'), ('sqlsh.tsv', 'app/'))
FILE_COLS = ('path lang kind component total comment blank loc_sc loc_ef units g gmax gmax_fn g_fns g_gate '
             'g_gate_fn mi dt_in over_fn below_a red_d admitted').split()
COMP_COLS = ('component lang files loc_ef nc na ca ce a i d cce dt cr va tdr rating dt_in dt_d dt_total cr_total '
             'tdr_total ff core alpha co cnhn roi').split()


def kind(p):
    if '/migrations/0000' in p:
        return 'migración'
    if p.endswith('_test.go') or '/frontend/test/' in p or '/bdd/test/' in p and p.endswith('.sql'):
        return 'prueba'
    if p.endswith('.sh') or '/test/cc_check/' in p:
        return 'gate'
    return 'producción'


def mi(loc_ef, g):
    return 100.0 if loc_ef <= 0 else max(0.0, (171 - 25 * math.log(loc_ef) - 0.23 * g) / 171 * 100)


def file_row(path, r, comps):
    lang, loc_ef = model.lang_of(path), int(r['loc']) - int(r['blank'])
    comp = comps.get(coupling.component_of(path)) or {}
    grade, d = comp.get('rating'), comp.get('d')
    return dict(path=path, lang=lang, kind=kind(path), component=comp.get('name', ''),
                total=r['total'], comment=r['comment'], blank=r['blank'], loc_sc=r['loc'], loc_ef=loc_ef,
                units=r['funcs'], g=r['g_sum'], gmax=r['g_max'], gmax_fn=r['g_max_fn'], g_gate=r['g_gate'],
                g_gate_fn=r['g_gate_fn'], g_fns=r['g_fns'], mi=mi(loc_ef, int(r['g_sum'])),
                dt_in=model.within_length(lang, int(r['loc'])),
                over_fn=int(int(r['g_gate']) > model.fn_ceiling(lang)), below_a=int(grade not in (None, 'A')),
                red_d=int(d is not None and d > model.D_MAX),
                admitted='sí' if not admit_ceilings.breaches(path, r, comp) else 'no')


def comp_row(c, m, files):
    """Las fases B y C del componente; la C, sobre el costo total, con lo de adentro de los umbrales."""
    lang, loc_ef = m['lang'], sum(f['loc_ef'] for f in files)
    dt_in, dt_d = sum(f['dt_in'] for f in files), model.structural(lang, m['d'], m['nc'])
    dt_total = model.hours(lang, m['cce']) + dt_in + (dt_d or 0)
    cr_total = dt_total * model.RATE[lang]
    ff, al = model.friction(lang, m['ca']), model.alpha(c, m['a'], m['i'])
    co = model.opportunity(cr_total, al, m['d'])
    cnhn = model.do_nothing(cr_total, ff, co)
    return dict(m, component=c, loc_ef=loc_ef, dt=model.hours(lang, m['cce']), dt_in=dt_in, dt_d=dt_d,
                dt_total=dt_total, cr_total=cr_total, tdr_total=model.ratio(cr_total, m['va']), ff=ff,
                core=int(model.is_core(c)), alpha=al, co=co, cnhn=cnhn, roi=model.ratio(cnhn, cr_total))


def load(d):
    probed = []
    for fn, prefix in SOURCES:
        with open(os.path.join(d, fn), encoding='utf-8') as f:
            probed += [(prefix + r['file'], r) for r in csv.DictReader((l.rstrip('\r\n') for l in f), delimiter='\t')]
    comps = coupling.rate(coupling.components(coupling.load(d)), dict(probed))
    files = sorted((file_row(p, r, comps) for p, r in probed), key=lambda x: x['path'])
    by_comp = defaultdict(list)
    for f in files:
        by_comp[f['component']].append(f)
    return files, [comp_row(c, m, by_comp[c]) for c, m in sorted(comps.items())]


def cell(v):
    return '' if v is None else f'{v:.6f}'.rstrip('0').rstrip('.') if isinstance(v, float) else v


def dump(path, cols, rows):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter='\t')
        w.writerow(cols)
        w.writerows([cell(r[c]) for c in cols] for r in rows)


def total(rows, key):
    return sum(r[key] or 0 for r in rows)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    for d in sys.argv[1:]:
        files, comps = load(d)
        dump(os.path.join(d, 'rows.tsv'), FILE_COLS, files)
        dump(os.path.join(d, 'components.tsv'), COMP_COLS, comps)
        red = [c['component'] for c in comps if c['d'] is not None and c['d'] > model.D_MAX]
        below = [c['component'] for c in comps if c['rating'] not in (None, 'A')]
        print(f'{d}: {len(files)} archivos · no admitidos {sum(f["admitted"] == "no" for f in files)} · '
              f'>150: {sum(int(f["loc_sc"]) > 150 for f in files)} · G fn sobre el techo: {total(files, "over_fn")} · '
              f'en componente peor que A: {total(files, "below_a")} · CCE {total(comps, "cce")} · '
              f'deuda por CCE {total(comps, "dt"):.2f} h · dentro de los umbrales {total(files, "dt_in"):.2f} h · '
              f'de D {total(comps, "dt_d"):.2f} h · '
              f'total {total(comps, "dt") + total(files, "dt_in") + total(comps, "dt_d"):.2f} h · {len(comps)} componentes, '
              f'peor que A: {len(below)} · D > 0,7: {", ".join(red) or "ninguno"}')
