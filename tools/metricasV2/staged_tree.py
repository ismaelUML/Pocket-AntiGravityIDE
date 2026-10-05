"""staged_tree: la producción en la versión que staged.py mide, para D y para la calificación.

D y la calificación son del componente y no del archivo, y Ca depende de todos los que lo
importan: por eso el grafo necesita la superficie entera, y en la misma versión que el resto —el
stage o HEAD, nunca el disco—. La calificación, en cambio, sólo necesita la producción de los
componentes que se juzgan. Copia sólo la producción y los manifiestos, con un único `git cat-file`.
Trazabilidad: CODE_STANDARDS §7.3.1 · standards/Metricas_final.md §5.3 y §5.5
"""
import os, subprocess

import coupling

SCOPE = ('src', 'package.json', 'app/backend', 'app/frontend/lib', 'app/frontend/packages', 'app/frontend/pubspec.yaml')
MANIFESTS = ('package.json', 'app/backend/go.mod', 'app/frontend/pubspec.yaml')


def manifest(p):
    """El package.json, go.mod, pubspec.yaml de la raíz, o el de un paquete local."""
    parts = p.split('/')
    return p in MANIFESTS or (parts[:3] == ['app', 'frontend', 'packages'] and parts[4:] == ['pubspec.yaml'])


def listed(rev):
    cmd = ('ls-tree', '-r', '-z', '--name-only', rev) if rev else ('ls-files', '-z')
    out = subprocess.run(('git',) + cmd + ('--',), stdout=subprocess.PIPE, check=True).stdout
    paths = [p for p in out.decode('utf-8').split('\0') if p]
    return [p for p in paths if manifest(p) or coupling.component_of(p)]


def read(rev, paths):
    """El contenido de cada ruta en la versión medida, en orden, con un único `git cat-file`."""
    if not paths:
        return []
    query = ''.join(f'{rev}:{p}\n' for p in paths).encode('utf-8')
    out = subprocess.run(('git', 'cat-file', '--batch'), input=query, stdout=subprocess.PIPE, check=True).stdout
    blobs, at = [], 0
    for _ in paths:
        head_end = out.index(b'\n', at)
        size = int(out[at:head_end].split()[2])
        blobs.append(out[head_end + 1:head_end + 1 + size])
        at = head_end + 1 + size + 1
    return blobs


def copy(rev, paths, dest):
    for p, blob in zip(paths, read(rev, paths)):
        target = os.path.join(dest, *p.split('/'))
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, 'wb') as f:
            f.write(blob)


def components(rev, tmp, only=None):
    """Las métricas de cada componente en la versión medida: rev vacía es el stage. Con only, la
    calificación sólo de esos componentes."""
    dest = os.path.join(tmp, 'tree')
    copy(rev, listed(rev), dest)
    app = dest
    return coupling.rate(coupling.components(coupling.run(app)), coupling.probe(app, only), only)
