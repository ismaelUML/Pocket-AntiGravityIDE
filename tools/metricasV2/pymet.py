"""
pymet.py: Sonda nativa para Python (.py) -> total, comentario, blanco, LOC, unidades, G sumado, G máximo, la G de
cada función y la que juzga el techo por función (respetando # nolint: cyclop).

Formato de salida idéntico a las sondas de measure.sh / sqlmet / gomet:
file\ttotal\tcomment\tblank\tloc\tfuncs\tg_sum\tg_max\tg_max_fn\tg_fns\tg_gate\tg_gate_fn
"""
from __future__ import annotations

import ast
import io
import os
import sys
import tokenize

sys.dont_write_bytecode = True


def count_lines(src: str) -> tuple[int, int, int]:
    """
    Cuenta (total, comentario, blanco).
    LOC = total - comentario (las líneas en blanco cuentan, según CODE_STANDARDS §7.3.1).
    """
    lines = src.replace("\r\n", "\n").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    total = len(lines)
    blank = sum(1 for line in lines if not line.strip())

    comment_lines = set()
    try:
        tokens = tokenize.tokenize(io.BytesIO(src.encode("utf-8")).readline)
        for tok in tokens:
            if tok.type == tokenize.COMMENT:
                comment_lines.add(tok.start[0])
            elif tok.type == tokenize.STRING:
                s_line, e_line = tok.start[0], tok.end[0]
                text_before = lines[s_line - 1][: tok.start[1]].strip()
                if not text_before or text_before.startswith(('"""', "'''")):
                    for l in range(s_line, e_line + 1):
                        comment_lines.add(l)
    except Exception:
        for idx, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("#"):
                comment_lines.add(idx)

    comment = sum(1 for l in comment_lines if l <= total and lines[l - 1].strip())
    return total, comment, blank


class CyclomaticVisitor(ast.NodeVisitor):
    """Calcula la complejidad ciclomática G = 1 + decisiones de un AST de Python."""

    def __init__(self):
        self.complexity = 1

    def visit_If(self, node: ast.If):
        self.complexity += 1
        self.generic_visit(node)

    def visit_IfExp(self, node: ast.IfExp):
        self.complexity += 1
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        self.complexity += 1
        self.generic_visit(node)

    def visit_AsyncFor(self, node: ast.AsyncFor):
        self.complexity += 1
        self.generic_visit(node)

    def visit_While(self, node: ast.While):
        self.complexity += 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        self.complexity += 1
        self.generic_visit(node)

    def visit_BoolOp(self, node: ast.BoolOp):
        self.complexity += max(0, len(node.values) - 1)
        self.generic_visit(node)

    def visit_comprehension(self, node: ast.comprehension):
        self.complexity += 1 + len(node.ifs)
        self.generic_visit(node)

    def visit_Match(self, node):
        cases = getattr(node, "cases", [])
        self.complexity += max(0, len(cases))
        self.generic_visit(node)

    def visit_Assert(self, node: ast.Assert):
        self.complexity += 1
        self.generic_visit(node)


def measure_functions(src: str) -> list[tuple[str, int, bool]]:
    """
    Retorna lista de (nombre_función, complejidad_G, tiene_nolint).
    """
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return []

    lines = src.splitlines()
    routines = []

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            fn_name = node.name
            has_nolint = False
            start_l = max(0, node.lineno - 3)
            end_l = min(len(lines), node.lineno + 1)
            for l in lines[start_l:end_l]:
                if "nolint" in l and ("cyclop" in l or "complexity" in l):
                    has_nolint = True
                    break

            visitor = CyclomaticVisitor()
            for child in node.body:
                if not isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    visitor.visit(child)

            routines.append((fn_name, visitor.complexity, has_nolint))

    return routines


def py_metrics(src: str):
    total, comment, blank = count_lines(src)
    loc = total - comment
    funcs = measure_functions(src)
    return total, comment, blank, loc, funcs


def main(root: str):
    print("file\ttotal\tcomment\tblank\tloc\tfuncs\tg_sum\tg_max\tg_max_fn\tg_fns\tg_gate\tg_gate_fn")
    
    if os.path.isfile(root):
        files_to_walk = [root]
        base_dir = os.path.dirname(root) or "."
    else:
        files_to_walk = []
        base_dir = root
        for dp, _, fs in os.walk(root):
            # Ignorar entornos virtuales y caches
            if "venv" in dp or ".pytest_cache" in dp or "__pycache__" in dp:
                continue
            for f in sorted(fs):
                if f.endswith(".py"):
                    files_to_walk.append(os.path.join(dp, f))

    for p in sorted(files_to_walk):
        try:
            with open(p, encoding="utf-8") as fh:
                src = fh.read()
        except Exception:
            continue

        total, comment, blank, loc, funcs = py_metrics(src)
        g_sum = sum(g for _, g, _ in funcs)
        g_max, g_max_fn = max(((g, n) for n, g, _ in funcs), default=(0, ""))
        gs = ",".join(str(g) for _, g, _ in funcs)

        gate_candidates = [(g, n) for n, g, nl in funcs if not nl]
        g_gate, g_gate_fn = max(gate_candidates, default=(0, ""))

        rel = os.path.relpath(p, base_dir).replace("\\", "/")
        print(f"{rel}\t{total}\t{comment}\t{blank}\t{loc}\t{len(funcs)}\t{g_sum}\t{g_max}\t{g_max_fn}\t{gs}\t{g_gate}\t{g_gate_fn}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        main(".")
