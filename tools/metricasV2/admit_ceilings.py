"""admit_ceilings: los techos de admisión y el motivo por el que una fila de sonda los pasa.

Por archivo, los dos de CODE_STANDARDS §7.3.1. Por función, el umbral del lenguaje (Metricas_final
§5.1): Go 7, Dart 4, y 10 en SQL y shell, que no están calibrados; no juzga la función que declara
el switch exhaustivo con `//nolint:cyclop`, y sobre 15 se divide antes de partir el archivo (§4.2).
Por componente, la calificación A (§7.1), con la CCE del componente, y D ≤ 0,7 si está definido
(§5.5); los dos, sólo para sus archivos de producción.
Trazabilidad: CODE_STANDARDS §7.1 y §7.3.1 · standards/Metricas_final.md §4.2, §5.1, §5.3 y §5.5
"""
import model

LOC_MAX = 150      # líneas sin comentario; las blancas cuentan
G_FILE_MAX = 9     # G sumado del archivo, menor que 10
G_FN_SPLIT = 15

UNMEASURED = {'loc': '—', 'g_sum': '—', 'g_max': '—'}
NO_PROBE = 'no se mide: no existe, o no es un archivo .js, .py, .go, .dart, .sql ni .sh'


def breaches(path, r, comp=None):
    """Los motivos por los que no entra; comp son las métricas de su componente, si tiene."""
    if r is UNMEASURED:
        return [NO_PROBE]
    lang, loc, g, gate = model.lang_of(path), int(r['loc']), int(r['g_sum']), int(r['g_gate'])
    comp = comp or {}
    ceiling, grade, d = model.fn_ceiling(lang), comp.get('rating'), comp.get('d')
    found = ((loc > LOC_MAX, f'{loc} líneas sin comentario: el techo es {LOC_MAX}'),
             (g > G_FILE_MAX, f'G sumado {g}: el techo es menor que {G_FILE_MAX + 1}'),
             (gate > ceiling, f'G {gate} en {r["g_gate_fn"]}: el techo por función en {lang} es {ceiling}'),
             (gate > G_FN_SPLIT, f'{r["g_gate_fn"]} pasa de {G_FN_SPLIT}: se divide antes de partir el archivo'),
             (grade not in (None, 'A'), f'calificación {grade} en `{comp.get("name")}`, con TDR '
                                        f'{model.num(comp.get("tdr"))} %: el techo es A, hasta {model.GRID[0][0]} %'),
             (d is not None and d > model.D_MAX,
              f'D {model.num(d)} en `{comp.get("name")}`: el techo es {model.num(model.D_MAX, 1)}'))
    return [msg for hit, msg in found if hit]


def line(path, r, why):
    state = 'no admitido' if why else 'admitido'
    head = f'{state:<12} {path}   LOC {r["loc"]} · G {r["g_sum"]} · G máx. {r["g_max"]}'
    return head + ''.join(f'\n{"":<13}· {w}' for w in why)
