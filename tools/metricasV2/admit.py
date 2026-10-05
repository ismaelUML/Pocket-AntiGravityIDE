"""admit.py <archivo>...: decide si código nuevo pasa a producción, con los techos de admit_ceilings.

Mide cada archivo en el disco con las sondas de measure.sh, y lo que no puede medir no entra. Si
alguno es de producción de Go o de Dart dentro de app/, mide además en el disco el acoplamiento de
su superficie entera, para D, y la producción de sus componentes, para la calificación: los dos
techos son del componente. Sale con 1 si algún archivo no entra, o si no recibe ninguno.

No reemplaza a los gates de §8: no compila, y el techo por función de §7.3 —3, o 6 con guardas—
lo cuentan cc-check y el linter. Tampoco lee las excepciones de app/registro_metricas.md: un
archivo con su fila ahí sale no admitido igual, y la fila la mira el revisor.
Trazabilidad: CODE_STANDARDS §7.1 y §7.3.1 · standards/Metricas_final.md §4.2 y §5
"""
import os, sys

sys.dont_write_bytecode = True  # sin __pycache__ en tools/metricas/, que se versiona
import admit_ceilings, admit_probe, coupling

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def measurable(path):
    return os.path.isfile(path) and admit_probe.probe_for(path) is not None


def repo_path(path):
    return os.path.relpath(os.path.abspath(path), ROOT).replace('\\', '/')


def main(paths):
    if not paths:
        sys.exit('admit.py: sin archivos no hay nada que admitir')
    sys.stdout.reconfigure(encoding='utf-8')
    owners = {p: coupling.component_of(repo_path(p)) for p in paths}
    only = set(owners.values()) - {None}
    app = os.path.join(ROOT, 'src') if os.path.isdir(os.path.join(ROOT, 'src')) else os.path.join(ROOT, 'app')
    comps = coupling.rate(coupling.components(coupling.run(app)), coupling.probe(app, only), only) if only else {}
    rows = admit_probe.measure([p for p in paths if measurable(p)])
    why = {p: admit_ceilings.breaches(p, rows.get(p, admit_ceilings.UNMEASURED), comps.get(owners[p]))
           for p in paths}
    print('\n'.join(admit_ceilings.line(p, rows.get(p, admit_ceilings.UNMEASURED), why[p]) for p in paths))
    sys.exit(any(why.values()))


main(sys.argv[1:])
