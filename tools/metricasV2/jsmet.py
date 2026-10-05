"""
jsmet.py: Sonda nativa para JavaScript (.js) -> total, comentario, blanco, LOC, unidades, G sumado, G máximo, la G de
cada función y la que juzga el techo por función (respetando // nolint: cyclop o // nolint: complexity).

Formato de salida idéntico a las sondas de measure.sh / sqlmet / pymet / gomet:
file\ttotal\tcomment\tblank\tloc\tfuncs\tg_sum\tg_max\tg_max_fn\tg_fns\tg_gate\tg_gate_fn
"""
from __future__ import annotations

import os
import re
import sys

sys.dont_write_bytecode = True

KEYWORD_EXCLUSIONS = {"if", "for", "while", "do", "switch", "catch", "with", "return", "throw", "else"}

DECISION_PATTERNS = [
    re.compile(r"\bif\s*\("),
    re.compile(r"\bfor\s*\("),
    re.compile(r"\bfor\s+await\s*\("),
    re.compile(r"\bwhile\s*\("),
    re.compile(r"\bcase\b"),
    re.compile(r"\bcatch\s*[\({]"),
    re.compile(r"&&"),
    re.compile(r"\|\|"),
    re.compile(r"\?\?"),
    re.compile(r"\?(?!\.|\?)"),  # ternario ? pero no ?. ni ??
]


def count_lines(src: str) -> tuple[int, int, int]:
    """
    Cuenta (total, comentario, blanco).
    LOC = total - comentario (las líneas en blanco cuentan, según CODE_STANDARDS §7.3.1).
    """
    raw_lines = src.replace("\r\n", "\n").split("\n")
    if raw_lines and raw_lines[-1] == "":
        raw_lines.pop()
    total = len(raw_lines)
    blank = sum(1 for line in raw_lines if not line.strip())

    comment_lines = set()
    in_block_comment = False

    for idx, line in enumerate(raw_lines, 1):
        stripped = line.strip()
        if not stripped:
            continue

        if in_block_comment:
            comment_lines.add(idx)
            if "*/" in stripped:
                in_block_comment = False
                after = stripped.split("*/", 1)[1].strip()
                if after:
                    comment_lines.discard(idx)
            continue

        if stripped.startswith("//"):
            comment_lines.add(idx)
        elif stripped.startswith("/*"):
            comment_lines.add(idx)
            if "*/" not in stripped[2:]:
                in_block_comment = True
            else:
                after = stripped.split("*/", 1)[1].strip()
                if after:
                    comment_lines.discard(idx)

    comment = len(comment_lines)
    return total, comment, blank


def tokenize_clean_js(src: str):
    """
    Limpia cadenas, comentarios y expresiones regulares para análisis sintáctico.
    Retorna lista de tuplas (tipo, texto, lineno).
    """
    length = len(src)
    i = 0
    line = 1
    cleaned = []

    while i < length:
        ch = src[i]

        if ch == "\n":
            line += 1
            cleaned.append(("\n", "\n", line))
            i += 1
            continue

        # Comentario de una línea
        if ch == "/" and i + 1 < length and src[i + 1] == "/":
            end = src.find("\n", i)
            if end == -1:
                end = length
            comment_text = src[i:end]
            cleaned.append(("COMMENT", comment_text, line))
            i = end
            continue

        # Comentario de bloque
        if ch == "/" and i + 1 < length and src[i + 1] == "*":
            end = src.find("*/", i + 2)
            if end == -1:
                end = length
            else:
                end += 2
            comment_text = src[i:end]
            newlines = comment_text.count("\n")
            cleaned.append(("COMMENT", comment_text, line))
            line += newlines
            i = end
            continue

        # Template literal `...`
        if ch == "`":
            j = i + 1
            while j < length and src[j] != "`":
                if src[j] == "\\" and j + 1 < length:
                    j += 2
                elif src[j] == "\n":
                    line += 1
                    j += 1
                else:
                    j += 1
            cleaned.append(("STRING", "``", line))
            i = j + 1 if j < length else length
            continue

        # Cadenas simples o dobles '...' o "..."
        if ch in ("'", '"'):
            quote = ch
            j = i + 1
            while j < length and src[j] != quote:
                if src[j] == "\\" and j + 1 < length:
                    j += 2
                elif src[j] == "\n":
                    break
                else:
                    j += 1
            cleaned.append(("STRING", f"{quote}{quote}", line))
            i = j + 1 if j < length else length
            continue

        # Expresión regular /.../
        if ch == "/":
            prev_tokens = [(t, v, l) for t, v, l in cleaned if t not in ("\n", "COMMENT")]
            is_regex = False
            if not prev_tokens:
                is_regex = True
            else:
                _, last_val, _ = prev_tokens[-1]
                if last_val in ("=", "(", "[", ",", ":", ";", "!", "&", "|", "?", "{", "return"):
                    is_regex = True

            if is_regex:
                j = i + 1
                in_class = False
                while j < length:
                    if src[j] == "\\" and j + 1 < length:
                        j += 2
                    elif src[j] == "[":
                        in_class = True
                        j += 1
                    elif src[j] == "]":
                        in_class = False
                        j += 1
                    elif src[j] == "/" and not in_class:
                        j += 1
                        while j < length and src[j] in "gimsuy":
                            j += 1
                        break
                    elif src[j] == "\n":
                        break
                    else:
                        j += 1
                cleaned.append(("REGEX", "//", line))
                i = j
                continue

        cleaned.append(("CODE", ch, line))
        i += 1

    return cleaned


def measure_functions(src: str) -> list[tuple[str, int, bool]]:
    """
    Retorna lista de (nombre_función, complejidad_G, tiene_nolint).
    """
    raw_lines = src.splitlines()

    fn_header_re = re.compile(
        r"(?:async\s+)?(?:function\s+([a-zA-Z0-9_$]+)|"
        r"([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>|"
        r"([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?function|"
        r"(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{|"
        r"([a-zA-Z0-9_$]+)\s*:\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))"
    )

    funcs = []
    length = len(src)
    pos = 0

    while pos < length:
        match = fn_header_re.search(src, pos)
        if not match:
            break

        fn_name = match.group(1) or match.group(2) or match.group(3) or match.group(4) or match.group(5) or "anonymous"

        if fn_name in KEYWORD_EXCLUSIONS:
            pos = match.end()
            continue

        header_end = match.end()
        brace_pos = src.find("{", header_end - 1 if src[header_end - 1] == "{" else header_end)
        if brace_pos == -1 or brace_pos > header_end + 120:
            pos = match.end()
            continue

        line_num = src[:match.start()].count("\n") + 1
        has_nolint = False
        start_l = max(0, line_num - 3)
        end_l = min(len(raw_lines), line_num + 2)
        for l in raw_lines[start_l:end_l]:
            if "nolint" in l and ("cyclop" in l or "complexity" in l):
                has_nolint = True
                break

        body_start = brace_pos + 1
        depth = 1
        i = body_start
        in_str = False
        quote_char = ""
        in_sl_comment = False
        in_ml_comment = False

        while i < length and depth > 0:
            c = src[i]

            if in_sl_comment:
                if c == "\n":
                    in_sl_comment = False
                i += 1
                continue

            if in_ml_comment:
                if c == "*" and i + 1 < length and src[i + 1] == "/":
                    in_ml_comment = False
                    i += 2
                    continue
                i += 1
                continue

            if in_str:
                if c == "\\" and i + 1 < length:
                    i += 2
                    continue
                if c == quote_char:
                    in_str = False
                i += 1
                continue

            if c in ("'", '"', "`"):
                in_str = True
                quote_char = c
                i += 1
                continue

            if c == "/" and i + 1 < length:
                if src[i + 1] == "/":
                    in_sl_comment = True
                    i += 2
                    continue
                elif src[i + 1] == "*":
                    in_ml_comment = True
                    i += 2
                    continue

            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1

            i += 1

        body_end = i - 1
        func_body = src[body_start:body_end]

        body_cleaned_tokens = tokenize_clean_js(func_body)
        body_clean_code = "".join(v for t, v, l in body_cleaned_tokens if t == "CODE")

        decisions = 0
        for pat in DECISION_PATTERNS:
            decisions += len(pat.findall(body_clean_code))

        g = 1 + decisions

        if "nolint" in func_body and ("cyclop" in func_body or "complexity" in func_body):
            has_nolint = True

        funcs.append((fn_name, g, has_nolint))
        pos = header_end

    return funcs


def js_metrics(src: str):
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
            if "node_modules" in dp or ".git" in dp or "coverage" in dp or "uploads" in dp or "public" in dp:
                continue
            for f in sorted(fs):
                if f.endswith(".js"):
                    files_to_walk.append(os.path.join(dp, f))

    for p in sorted(files_to_walk):
        try:
            with open(p, encoding="utf-8") as fh:
                src = fh.read()
        except Exception:
            continue

        total, comment, blank, loc, funcs = js_metrics(src)
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
