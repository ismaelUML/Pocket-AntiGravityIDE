"""
jscoup.py: Análisis de acoplamiento de paquetes y componentes JavaScript / Node.js (Ca, Ce, I, A, D).

Para cada componente del proyecto (Arquitectura Hexagonal en src/):
- Nc: tipos concretos (clases y funciones exportadas/declaradas).
- Na: interfaces o clases abstractas / puertos (ports que declaran contratos o lanzan 'Method not implemented').
- Ce: acoplamiento eferente (componentes locales importados).
- Ca: acoplamiento aferente (componentes locales que lo importan).
- I: inestabilidad = Ce / (Ca + Ce).
- A: abstracción = Na / Nc.
- D: distancia de la secuencia principal = |A + I - 1|.
"""
from __future__ import annotations

import os
import re
import sys

sys.dont_write_bytecode = True

REQUIRE_RE = re.compile(r"""(?:require\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"])""")
CLASS_RE = re.compile(r"""class\s+([a-zA-Z0-9_$]+)""")
FUNC_RE = re.compile(r"""(?:async\s+)?function\s+([a-zA-Z0-9_$]+)""")
EXPORT_RE = re.compile(r"""module\.exports\s*=\s*\{([^}]+)\}""")
NOT_IMPLEMENTED_RE = re.compile(r"""(?:Method not implemented|not implemented)""", re.IGNORECASE)


def get_component_name(rel_path: str) -> str:
    """
    Determina el nombre canónico del componente a partir de la ruta relativa a la raíz del proyecto.
    Ej:
    src/core/domain/prompt.js -> core.domain
    src/core/ports/config.port.js -> core.ports
    src/core/usecases/send-prompt.usecase.js -> core.usecases
    src/infrastructure/automation/queue.js -> infrastructure.automation
    src/interfaces/http/routes/prompt.routes.js -> interfaces.http
    src/interfaces/websockets/websocket-server.js -> interfaces.websockets
    src/server.js -> server
    """
    clean_path = rel_path.replace("\\", "/")
    if clean_path.startswith("src/"):
        clean_path = clean_path[4:]

    parts = clean_path.split("/")
    if len(parts) == 1:
        # Archivo en la raíz de src (ej. server.js)
        return os.path.splitext(parts[0])[0]

    # Para interfaces/http/routes y interfaces/http/middleware, agrupar en interfaces.http
    if parts[0] == "interfaces" and len(parts) >= 2 and parts[1] == "http":
        return "interfaces.http"

    # Para infrastructure/* agrupar por subcarpeta directa (ej. infrastructure.automation)
    if parts[0] in ("core", "infrastructure") and len(parts) >= 2:
        return f"{parts[0]}.{parts[1]}"

    # Por defecto, primeras dos carpetas o carpeta padre
    if len(parts) > 2:
        return f"{parts[0]}.{parts[1]}"
    return parts[0]


def analyze_file(file_path: str, root_dir: str) -> tuple[int, int, set[str]]:
    """
    Analiza un archivo JavaScript y retorna (nc, na, imported_components).
    """
    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return 1, 0, set()

    nc = 0
    na = 0

    classes = CLASS_RE.findall(content)
    functions = FUNC_RE.findall(content)
    nc += len(classes) + len(functions)

    # Identificar si es abstracto / port
    is_abstract_file = False
    file_rel = os.path.relpath(file_path, root_dir).replace("\\", "/")

    if "port" in file_rel.lower() or "interface" in file_rel.lower():
        is_abstract_file = True

    if NOT_IMPLEMENTED_RE.search(content):
        is_abstract_file = True

    if is_abstract_file:
        na += max(1, len(classes))
    elif any(c.endswith("Port") or c.endswith("Interface") for c in classes):
        na += 1

    # Extraer exportaciones
    exports_match = EXPORT_RE.search(content)
    if exports_match:
        exported_items = [item.strip() for item in exports_match.group(1).split(",") if item.strip()]
        nc = max(nc, len(exported_items))

    nc = max(nc, 1)

    # Extraer imports locales
    imported_components = set()
    dir_of_file = os.path.dirname(file_path)

    for m in REQUIRE_RE.finditer(content):
        dep_path = m.group(1) or m.group(2)
        if not dep_path or not dep_path.startswith("."):
            continue  # Saltear dependencias externas como express, ws, etc.

        # Resolver ruta física
        resolved = os.path.normpath(os.path.join(dir_of_file, dep_path))
        resolved_rel = os.path.relpath(resolved, root_dir).replace("\\", "/")

        dep_comp = get_component_name(resolved_rel)
        imported_components.add(dep_comp)

    return nc, na, imported_components


def discover_components(root_dir: str):
    """
    Descubre todos los archivos .js de producción en src/ agrupados por componente.
    Retorna lista de (component_name, rel_path, full_path).
    """
    src_dir = os.path.join(root_dir, "src")
    if not os.path.isdir(src_dir):
        # Si se le pasa src directamente
        src_dir = root_dir

    js_files = []
    for dirpath, dirnames, filenames in os.walk(src_dir):
        # Ignorar node_modules, tests, coverage, assets
        dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".git", "coverage", "uploads", "public", "assets")]
        for f in sorted(filenames):
            if f.endswith(".js") and not f.endswith(".test.js") and not f.startswith("test-"):
                full = os.path.join(dirpath, f)
                rel = os.path.relpath(full, root_dir).replace("\\", "/")
                comp = get_component_name(rel)
                js_files.append((comp, rel, full))
    return js_files


def analyze_project(root_dir: str):
    """
    Analiza todos los módulos y componentes de producción en root_dir y genera métricas de Martin:
    component\tlang\tfiles\tnc\tna\tca\tce\ta\ti\td\tdeps
    """
    files_info = discover_components(root_dir)
    all_comps = sorted(list({comp for comp, _, _ in files_info}))

    comp_files: dict[str, list[tuple[str, str]]] = {c: [] for c in all_comps}
    for comp, rel, full in files_info:
        comp_files[comp].append((rel, full))

    comp_data = {}
    for comp, flist in comp_files.items():
        total_nc = 0
        total_na = 0
        all_imported_comps = set()

        for rel, path in flist:
            nc, na, raw_imports = analyze_file(path, root_dir)
            total_nc += nc
            total_na += na
            all_imported_comps.update(raw_imports)

        # Filtrar dependencias hacia otros componentes (eliminar auto-dependencias)
        ce_targets = {target for target in all_imported_comps if target in all_comps and target != comp}

        comp_data[comp] = {
            "nc": max(total_nc, 1),
            "na": total_na,
            "ce_targets": ce_targets,
            "files": len(flist),
        }

    # Calcular Ca
    ca_counts = {c: 0 for c in all_comps}
    for comp, data in comp_data.items():
        for target in data["ce_targets"]:
            if target in ca_counts:
                ca_counts[target] += 1

    rows = []
    for mod_name, data in comp_data.items():
        nc = data["nc"]
        na = min(data["na"], nc)
        ce = len(data["ce_targets"])
        ca = ca_counts[mod_name]
        total_c = ca + ce
        i = 1.0 if total_c == 0 else round(ce / total_c, 3)
        a = round(na / nc, 3) if nc > 0 else 0.0
        d = round(abs(a + i - 1.0), 3)

        rows.append({
            "component": mod_name,
            "lang": "JavaScript",
            "files": data["files"],
            "nc": nc,
            "na": na,
            "ca": ca,
            "ce": ce,
            "a": a,
            "i": i,
            "d": d,
            "deps": ",".join(sorted(data["ce_targets"])),
        })

    return rows


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    rows = analyze_project(root)
    print("component\tlang\tfiles\tnc\tna\tca\tce\ta\ti\td\tdeps")
    for r in rows:
        print(f"{r['component']}\t{r['lang']}\t{r['files']}\t{r['nc']}\t{r['na']}\t{r['ca']}\t{r['ce']}\t{r['a']}\t{r['i']}\t{r['d']}\t{r['deps']}")


if __name__ == "__main__":
    main()
