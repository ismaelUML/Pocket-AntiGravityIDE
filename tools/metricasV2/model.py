"""model: la iteración 4 de Metricas_final —el SQALE calibrado por lenguaje—, en un solo lugar.

La calibración de §5.1 y las fórmulas de §5.2 a §5.4, más la deuda dentro de los umbrales de §5.7,
que es un supuesto de calibración (IE-105) y no entra en ningún techo. La CCE es del componente:
su CC es P + 1, con P los predicados de toda su producción (§5.2). SQL y shell no están
calibrados (IE-103): para ellos las funciones devuelven None, que el informe muestra como «—». Un
cociente con denominador cero también es None: D sin tipos (§5.5), TDR sin código, ROI sin deuda.
El componente aislado tiene I = 1 (§3.1).
Trazabilidad: standards/Metricas_final.md §2.4 y §5 · CODE_STANDARDS §7.1, §7.3 y §7.3.1
"""
from collections import namedtuple

Cal = namedtuple('Cal', 'ccu k cdu ff_base ff_max')
CAL = {
    'Go': Cal(7, 0.35, 0.40, 0.10, 0.25),
    'Dart': Cal(4, 0.25, 0.25, 0.10, 0.30),
    'Python': Cal(5, 0.30, 0.35, 0.10, 0.25),
    'JavaScript': Cal(7, 0.35, 0.40, 0.10, 0.25),
}
RATE = {'Go': 46, 'Dart': 40, 'Python': 45, 'JavaScript': 45, 'SQL': 40, 'Shell': 40}
FN_MAX = 10          # techo por función de lo que no está calibrado (§4.2)
CORE = ('src/core', 'core', 'core.domain', 'core.ports', 'core.usecases')
CORE_DART = ('app/frontend/packages/', '_domain')   # el paquete local <módulo>_domain, §3.4
ALPHA_CORE = 1.5
D_MAX = 0.7
GRID = ((5, 'A'), (10, 'B'), (20, 'C'), (50, 'D'))
OBJ_LOC = 100     # objetivo de largo, CODE_STANDARDS §7.3.1
OBJ_D = 0.3        # objetivo de D, regla práctica 7
LANG = {'.go': 'Go', '.dart': 'Dart', '.py': 'Python', '.js': 'JavaScript', '.sql': 'SQL', '.sh': 'Shell'}


def num(x, places=2):
    """Un número con coma decimal, o «—» si no está definido."""
    return '—' if x is None else f'{x:.{places}f}'.replace('.', ',')


def lang_of(path):
    return LANG.get(path[path.rfind('.'):]) if '.' in path else None


def fn_ceiling(lang):
    return CAL[lang].ccu if lang in CAL else FN_MAX


def g_values(cell):
    return [int(g) for g in cell.split(',') if g]


def cce(lang, gs):
    """La del componente, con las G de sus funciones: CC = P + 1, y cada función aporta G − 1 predicados."""
    if isinstance(gs, str):
        gs = g_values(gs)
    if not gs or lang not in CAL:
        return 0
    return max(0, sum(int(g) - 1 for g in gs) + 1 - CAL[lang].ccu)




def hours(lang, excess):
    return None if excess is None else excess * CAL[lang].k


def asset(lang, loc_ef):
    return loc_ef * CAL[lang].cdu * RATE[lang] if lang in CAL else None


def ratio(num, den, scale=100):
    """El cociente, redondeado para que un borde exacto —D 0,7, TDR 5 %— no lo cruce la coma flotante."""
    return None if num is None or not den else round(num / den * scale, 12)


def rating(tdr):
    return None if tdr is None else next((r for top, r in GRID if tdr <= top), 'E')


def debt(lang, loc_ef, gs):
    """(CCE, CR, VA, TDR, calificación) de la producción de un componente."""
    excess = cce(lang, gs)
    cr = None if excess is None else hours(lang, excess) * RATE[lang]
    va = asset(lang, loc_ef)
    tdr = ratio(cr, va)
    return excess, cr, va, tdr, rating(tdr)


def within_length(lang, loc):
    """Horas de las líneas entre el objetivo y el techo: reescribir lo que sobra (§5.7)."""
    return max(0, loc - OBJ_LOC) * CAL[lang].cdu if lang in CAL else None


def structural(lang, d, nc):
    """Horas de lo que D pasa del objetivo: una remediación por tipo, en esa proporción (§5.7)."""
    return None if lang not in CAL or d is None else round(max(0.0, d - OBJ_D) * nc * CAL[lang].k, 12)


def instability(ca, ce):
    return 1.0 if ca + ce == 0 else ratio(ce, ca + ce, 1)


def abstractness(na, nc):
    return ratio(na, nc, 1)


def distance(a, i):
    return None if a is None or i is None else round(abs(a + i - 1), 12)


def friction(lang, ca):
    return CAL[lang].ff_base + CAL[lang].ff_max * ca / (ca + 1) if lang in CAL else None


def is_core(component):
    head, tail = CORE_DART
    if component.startswith(head) and component.endswith(tail):
        return '/' not in component[len(head):]
    return any(component == c or component.startswith(c + '/') or component.startswith(c + '.') for c in CORE)


def alpha(component, a, i):
    if not is_core(component) or a is None or i is None:
        return None
    return ALPHA_CORE + (1 - i) * (1 - a)


def opportunity(cr, al, d):
    return None if cr is None or al is None or d is None else cr * (al - 1) * (1 + d)


def do_nothing(cr, ff, co):
    return None if cr is None or ff is None or co is None else cr * ff + co
