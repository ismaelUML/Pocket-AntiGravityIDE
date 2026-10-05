"""
pycoup.py: Análisis de acoplamiento de paquetes y módulos Python (Ca, Ce, I, A, D).

Para cada módulo Python del proyecto:
- Nc: tipos concretos (clases y funciones principales).
- Na: interfaces o clases abstractas (ABC, Protocol, abstractmethod).
- Ce: acoplamiento eferente (módulos locales importados).
- Ca: acoplamiento aferente (módulos locales que lo importan).
- I: inestabilidad = Ce / (Ca + Ce).
- A: abstracción = Na / Nc.
- D: distancia de la secuencia principal = |A + I - 1|.
"""
from __future__ import annotations

import ast
import os
import sys

sys.dont_write_bytecode = True


def analyze_module(path: str) -> tuple[int, int, set[str]]:
    """
    Retorna (nc, na, imported_modules).
    """
    try:
        with open(path, encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=path)
    except Exception:
        return 0, 0, set()

    nc = 0
    na = 0
    imports = set()

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            nc += 1
            is_abstract = False
            for base in node.bases:
                if isinstance(base, ast.Name) and base.id in ("ABC", "Protocol"):
                    is_abstract = True
                elif isinstance(base, ast.Attribute) and base.attr in ("ABC", "Protocol"):
                    is_abstract = True
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    for dec in item.decorator_list:
                        if isinstance(dec, ast.Name) and dec.id == "abstractmethod":
                            is_abstract = True
                        elif isinstance(dec, ast.Attribute) and dec.attr == "abstractmethod":
                            is_abstract = True
            if is_abstract:
                na += 1
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            # Solo funciones a nivel de módulo
            nc += 1
        elif isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.add(node.module.split(".")[0])

    return max(nc, 1), na, imports


def discover_components(root_dir: str):
    ignore_dirs = {".git", ".pytest_cache", "__pycache__", "venv", "tests", "metricas", "scripts", "docs", "tools"}
    py_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        for f in sorted(filenames):
            if f.endswith(".py") and not f.startswith("test_") and f != "bench_latency.py":
                full = os.path.join(dirpath, f)
                rel = os.path.relpath(full, root_dir).replace("\\", "/")
                # Nombre de componente: si está en subcarpeta, usar paquete padre o módulo
                parts = rel.split("/")
                if len(parts) > 1:
                    comp_name = ".".join(parts[:-1])
                else:
                    comp_name = os.path.splitext(parts[0])[0]
                py_files.append((comp_name, rel, full))
    return py_files


def analyze_project(root_dir: str):
    """
    Analiza todos los módulos y paquetes de producción en root_dir y genera métricas de Martin:
    component\tlang\tfiles\tnc\tna\tca\tce\ta\ti\td
    """
    files_info = discover_components(root_dir)
    all_comps = sorted(list({comp for comp, _, _ in files_info}))

    comp_files: dict[str, list[tuple[str, str]]] = {c: [] for c in all_comps}
    for comp, rel, full in files_info:
        comp_files[comp].append((rel, full))

    # Analizar tipos e imports por componente
    comp_data = {}
    for comp, flist in comp_files.items():
        total_nc = 0
        total_na = 0
        all_imports = set()
        for rel, path in flist:
            nc, na, raw_imports = analyze_module(path)
            total_nc += nc
            total_na += na
            all_imports.update(raw_imports)

        # Filtrar dependencias locales hacia otros componentes
        ce_targets = set()
        for imp in all_imports:
            for other in all_comps:
                if other != comp and (imp == other or imp == other.split(".")[0]):
                    ce_targets.add(other)

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
        na = data["na"]
        ce = len(data["ce_targets"])
        ca = ca_counts[mod_name]
        total_c = ca + ce
        i = 1.0 if total_c == 0 else round(ce / total_c, 3)
        a = round(na / nc, 3) if nc > 0 else 0.0
        d = round(abs(a + i - 1.0), 3)

        rows.append({
            "component": mod_name,
            "lang": "Python",
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
