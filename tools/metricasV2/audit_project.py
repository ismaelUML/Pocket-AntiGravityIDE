"""
audit_project.py: Auditoría integral de arquitectura, complejidad ciclomática y deuda técnica SQALE.

Mide todos los módulos y componentes de Pocket-AntiGravityIDE usando:
- jsmet.py / pymet.py: LOC, comentarios, blancos y complejidad ciclomática G por función.
- jscoup.py / pycoup.py: Acoplamiento Ca, Ce, Inestabilidad I, Abstracción A y Distancia D (Robert C. Martin).
- model.py: Calibración SQALE Iteración 4 (CCE, Deuda Técnica en Horas, CR, VA, TDR, Calificación SQALE).
- admit_ceilings.py: Evaluación estricta de techos de admisión de código a producción.
"""
from __future__ import annotations

import math
import os
import re
import sys

# Agregar carpeta metricas al path para importar módulos locales
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import admit_ceilings
import jscoup
import jsmet
import model
import pycoup
import pymet

sys.dont_write_bytecode = True

# Asegurar codificación UTF-8 en consolas Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# --------------------------------------------------------------------------
# Habilitar soporte de secuencias ANSI (Virtual Terminal) en Windows 10/11
# --------------------------------------------------------------------------
def init_windows_vt() -> None:
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
                kernel32.SetConsoleMode(handle, mode.value | 0x0004)  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
        except Exception:
            pass


init_windows_vt()

# --------------------------------------------------------------------------
# Paleta de Colores ANSI
# --------------------------------------------------------------------------
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[90m"
CYAN = "\033[36m"
B_CYAN = "\033[1;36m"
GREEN = "\033[32m"
B_GREEN = "\033[1;92m"
YELLOW = "\033[33m"
B_YELLOW = "\033[1;93m"
RED = "\033[31m"
B_RED = "\033[1;91m"
MAGENTA = "\033[35m"
B_MAGENTA = "\033[1;95m"
WHITE = "\033[37m"
B_WHITE = "\033[1;97m"

ANSI_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")


def visible_width(s: str) -> int:
    """Calcula la longitud visual exacta eliminando secuencias de escape ANSI."""
    return len(ANSI_RE.sub("", s))


def fit_cell(content: str, width: int, align: str = "<") -> str:
    """Ajusta el contenido al ancho exacto considerando códigos ANSI y alineación."""
    vis = visible_width(content)
    if vis > width:
        plain = ANSI_RE.sub("", content)
        return plain[:width - 1] + "…"
    pad = width - vis
    if align == ">":
        return " " * pad + content
    elif align == "^":
        left = pad // 2
        right = pad - left
        return " " * left + content + " " * right
    else:
        return content + " " * pad


def shorten_path(p: str, max_w: int = 34) -> str:
    """
    Acorta rutas largas preservando el contexto arquitectónico y nombre de archivo.
    Ejemplo: src/infrastructure/automation/diff-acceptor.js -> infra/auto/diff-acceptor.js
    """
    s = p.replace("\\", "/")
    if s.startswith("src/"):
        s = s[4:]
    if len(s) <= max_w:
        return s
    parts = s.split("/")
    filename = parts[-1]
    if len(parts) >= 3:
        cand = f"{parts[0][:5]}/{parts[-2][:4]}/{filename}"
        if len(cand) <= max_w:
            return cand
    cand = f"{parts[0][:5]}/{filename}"
    if len(cand) <= max_w:
        return cand
    cand = f"…/{filename}"
    if len(cand) <= max_w:
        return cand
    return filename[:max_w - 1] + "…"


# --------------------------------------------------------------------------
# Badges y Colores Dinámicos
# --------------------------------------------------------------------------
def color_admitted(admitted: str) -> str:
    if admitted == "SÍ":
        return f"{B_GREEN}✓ SÍ{RESET}"
    return f"{B_RED}✗ NO{RESET}"


def color_mi(val: float) -> str:
    txt = f"{val:5.1f}"
    if val >= 75.0:
        return f"{B_GREEN}{txt}{RESET}"
    elif val >= 40.0:
        return f"{B_YELLOW}{txt}{RESET}"
    return f"{B_RED}{txt}{RESET}"


def color_gmax(g: int) -> str:
    txt = f"{g:>5}"
    if g <= 5:
        return f"{B_GREEN}{txt}{RESET}"
    elif g <= 8:
        return f"{B_YELLOW}{txt}{RESET}"
    return f"{B_RED}{txt}{RESET}"


def color_status(status: str) -> str:
    if "Secuencia" in status:
        return f"{B_GREEN}● En Secuencia{RESET}"
    elif "Dolor" in status:
        return f"{B_YELLOW}▲ Zona de Dolor{RESET}"
    return f"{B_MAGENTA}◆ {status}{RESET}"


def color_rating(rating: str) -> str:
    r = rating.strip()
    if r == "A":
        return f"{B_GREEN}[ A ]{RESET}"
    elif r == "B":
        return f"{B_CYAN}[ B ]{RESET}"
    elif r == "C":
        return f"{B_YELLOW}[ C ]{RESET}"
    elif r == "D":
        return f"{B_RED}[ D ]{RESET}"
    elif r == "E":
        return f"\033[1;41;97m[ E ]{RESET}"
    return f"{DIM}[ {r} ]{RESET}"


def progress_bar(tdr_pct: float, length: int = 16) -> str:
    filled = min(length, max(0, int(round((tdr_pct / 100.0) * length))))
    empty = length - filled
    if tdr_pct <= 5.0:
        bar_col = B_GREEN
    elif tdr_pct <= 10.0:
        bar_col = B_CYAN
    elif tdr_pct <= 20.0:
        bar_col = B_YELLOW
    else:
        bar_col = B_RED
    return f"{bar_col}{'█' * filled}{DIM}{'░' * empty}{RESET}"


def mi_score(loc_ef: int, g: int) -> float:
    """Índice de Mantenibilidad de Software (0 a 100)."""
    if loc_ef <= 0:
        return 100.0
    return max(0.0, (171.0 - 25.0 * math.log(loc_ef) - 0.23 * g) / 171.0 * 100.0)


# --------------------------------------------------------------------------
# Componente de Cuadro Estructurado (BoxTable)
# --------------------------------------------------------------------------
class Column:
    def __init__(self, name: str, width: int, align: str = "<", header_align: str = "^"):
        self.name = name
        self.width = width
        self.align = align
        self.header_align = header_align


class BoxTable:
    def __init__(self, title: str, subtitle: str, columns: list[Column], border_color: str = B_CYAN):
        self.title = title
        self.subtitle = subtitle
        self.columns = columns
        self.border_color = border_color

        # Cada segmento de columna incluye 1 espacio izquierdo y 1 derecho de margen
        self.segs = [c.width + 2 for c in self.columns]
        self.total_width = sum(self.segs) + len(self.segs) - 1 + 2
        self.inner_width = self.total_width - 2

    def print_header(self) -> None:
        b = self.border_color
        rst = RESET

        # Línea 1: Borde superior redondeado que enmarca todo el cuadro
        print(f"\n{b}╭{'─' * self.inner_width}╮{rst}")

        # Línea 2: Fila de título integrado dentro del cuadro
        t_raw = f"  {self.title}"
        sub_raw = f"{self.subtitle}  " if self.subtitle else ""
        pad = max(0, self.inner_width - visible_width(t_raw) - visible_width(sub_raw))
        title_line = f"{B_WHITE}{t_raw}{rst}{' ' * pad}{DIM}{sub_raw}{rst}"
        print(f"{b}│{rst}{title_line}{b}│{rst}")

        # Línea 3: Divisor de ramificación de columnas con uniones '┬'
        top_div = f"{b}├" + "┬".join("─" * s for s in self.segs) + f"┤{rst}"
        print(top_div)

        # Línea 4: Nombres de columnas centrados / alineados
        hdr_cells = []
        for col in self.columns:
            h_cell = fit_cell(col.name, col.width, col.header_align)
            hdr_cells.append(f" {B_WHITE}{h_cell}{rst} ")
        print(f"{b}│{rst}" + f"{b}│{rst}".join(hdr_cells) + f"{b}│{rst}")

        # Línea 5: Divisor intermedio de cuadrícula con cruces '┼'
        mid_div = f"{b}├" + "┼".join("─" * s for s in self.segs) + f"┤{rst}"
        print(mid_div)

    def print_row(self, values: list[any], align_overrides: dict[int, str] | None = None, is_bold: bool = False) -> None:
        b = self.border_color
        rst = RESET
        cells = []
        for i, (val, col) in enumerate(zip(values, self.columns)):
            align = align_overrides.get(i, col.align) if align_overrides else col.align
            c_str = str(val) if val is not None else ""
            cell_fitted = fit_cell(c_str, col.width, align)
            if is_bold and not ANSI_RE.search(c_str):
                cell_fitted = f"{B_WHITE}{cell_fitted}{rst}"
            cells.append(f" {cell_fitted} ")
        print(f"{b}│{rst}" + f"{b}│{rst}".join(cells) + f"{b}│{rst}")

    def print_divider(self) -> None:
        b = self.border_color
        rst = RESET
        print(f"{b}├" + "┼".join("─" * s for s in self.segs) + f"┤{rst}")

    def print_footer(self) -> None:
        b = self.border_color
        rst = RESET
        print(f"{b}╰" + "┴".join("─" * s for s in self.segs) + f"╯{rst}")


# --------------------------------------------------------------------------
# Filas de Tarjeta de Resumen Ejecutivo
# --------------------------------------------------------------------------
def card_row(colored_content: str, inner_width: int, border_color: str = B_CYAN) -> str:
    vis_len = visible_width(colored_content)
    pad = max(0, inner_width - vis_len)
    return f"{border_color}│{RESET}{colored_content}{' ' * pad}{border_color}│{RESET}"


def card_two_col(left_str: str, right_str: str, inner_width: int, border_color: str = B_CYAN) -> str:
    half_w = inner_width // 2
    left_vis = visible_width(left_str)
    right_vis = visible_width(right_str)
    pad_left = max(0, half_w - left_vis)
    pad_right = max(0, (inner_width - half_w) - right_vis)
    line = f"{left_str}{' ' * pad_left}{right_str}{' ' * pad_right}"
    return f"{border_color}│{RESET}{line}{border_color}│{RESET}"


# --------------------------------------------------------------------------
# Ejecución Principal de Auditoría
# --------------------------------------------------------------------------
def run_audit(root_dir: str):
    root_dir = os.path.abspath(root_dir)

    banner_w = 126
    inner_w = banner_w - 2
    b = B_CYAN
    rst = RESET

    t1 = "POCKET ANTIGRAVITY IDE — AUDITORÍA INTEGRAL DE ARQUITECTURA Y CALIDAD SQALE"
    t2 = "Robert C. Martin Coupling · McCabe Cyclomatic Complexity · SQALE Technical Debt Model"

    print()
    print(f"{b}╭{'─' * inner_w}╮{rst}")
    print(f"{b}│{B_WHITE}{t1:^{inner_w}}{b}│{rst}")
    print(f"{b}│{DIM}{t2:^{inner_w}}{b}│{rst}")
    print(f"{b}╰{'─' * inner_w}╯{rst}")

    # 1. Obtener componentes y archivos
    js_files_info = jscoup.discover_components(root_dir)
    if js_files_info:
        files_info = js_files_info
        comp_rows = jscoup.analyze_project(root_dir)
        default_lang = "JavaScript"
    else:
        files_info = pycoup.discover_components(root_dir)
        comp_rows = pycoup.analyze_project(root_dir)
        default_lang = "Python"

    comps = {r["component"]: r for r in comp_rows}

    # 2. Lista de archivos a medir
    target_files = [(rel, full, comp) for comp, rel, full in files_info]

    file_results = []
    total_total = 0
    total_comment = 0
    total_blank = 0
    total_loc = 0
    total_loc_ef = 0
    total_funcs = 0
    total_g = 0

    # =========================================================================
    # TABLA 1: Métricas de Archivo y Complejidad Ciclomática (Ancho Exacto: 126)
    # =========================================================================
    t1_cols = [
        Column("Archivo", 34, align="<", header_align="<"),
        Column("LOC", 5, align=">", header_align=">"),
        Column("Com", 4, align=">", header_align=">"),
        Column("LOC_ef", 6, align=">", header_align=">"),
        Column("Fns", 3, align=">", header_align=">"),
        Column("G_sum", 5, align=">", header_align=">"),
        Column("G_max", 5, align=">", header_align=">"),
        Column("Función Pico", 18, align="<", header_align="<"),
        Column("MI", 5, align=">", header_align=">"),
        Column("Admitido", 10, align="^", header_align="^"),
    ]
    t1 = BoxTable(
        title="[1/3] MÉTRICAS POR ARCHIVO Y COMPLEJIDAD CICLOMÁTICA",
        subtitle="Techos: G_max <= 8, MI >= 75",
        columns=t1_cols,
    )
    t1.print_header()

    admitted_count = 0

    for fname, p, comp_name in target_files:
        try:
            with open(p, encoding="utf-8") as fh:
                src = fh.read()
        except Exception:
            continue

        if p.endswith(".js"):
            total, comment, blank, loc, funcs = jsmet.js_metrics(src)
        else:
            total, comment, blank, loc, funcs = pymet.py_metrics(src)

        loc_ef = loc - blank
        g_sum = sum(g for _, g, _ in funcs)
        g_max, g_max_fn = max(((g, n) for n, g, _ in funcs), default=(0, "-"))
        gs_str = ",".join(str(g) for _, g, _ in funcs)

        gate_candidates = [(g, n) for n, g, nl in funcs if not nl]
        g_gate, g_gate_fn = max(gate_candidates, default=(0, "-"))

        mi = mi_score(loc_ef, g_sum)

        probe_row = {
            "loc": str(loc),
            "comment": str(comment),
            "blank": str(blank),
            "funcs": str(len(funcs)),
            "g_sum": str(g_sum),
            "g_max": str(g_max),
            "g_max_fn": g_max_fn,
            "g_gate": str(g_gate),
            "g_gate_fn": g_gate_fn,
            "g_fns": gs_str,
        }

        comp_info = comps.get(comp_name)
        reasons = admit_ceilings.breaches(fname, probe_row, comp_info)
        admitted = "SÍ" if not reasons else "NO"
        if admitted == "SÍ":
            admitted_count += 1

        file_results.append({
            "name": fname,
            "mod": comp_name,
            "total": total,
            "comment": comment,
            "blank": blank,
            "loc": loc,
            "loc_ef": loc_ef,
            "funcs": len(funcs),
            "g_sum": g_sum,
            "g_max": g_max,
            "g_max_fn": g_max_fn,
            "g_fns": [g for _, g, _ in funcs],
            "mi": mi,
            "admitted": admitted,
            "reasons": reasons,
        })

        total_total += total
        total_comment += comment
        total_blank += blank
        total_loc += loc
        total_loc_ef += loc_ef
        total_funcs += len(funcs)
        total_g += g_sum

        display_name = shorten_path(fname, 34)
        fn_pico = g_max_fn if len(g_max_fn) <= 18 else (g_max_fn[:17] + "…")

        f_adm = color_admitted(admitted)
        f_mi = color_mi(mi)
        f_gmax = color_gmax(g_max)

        row_vals = [
            display_name,
            str(loc),
            str(comment),
            str(loc_ef),
            str(len(funcs)),
            str(g_sum),
            f_gmax,
            fn_pico,
            f_mi,
            f_adm,
        ]
        t1.print_row(row_vals)

    t1.print_divider()
    tot_row = [
        "TOTALES DEL PROYECTO",
        str(total_loc),
        str(total_comment),
        str(total_loc_ef),
        str(total_funcs),
        str(total_g),
        "-",
        "-",
        "-",
        f"{admitted_count}/{len(target_files)}",
    ]
    t1.print_row(tot_row, is_bold=True)
    t1.print_footer()

    # =========================================================================
    # TABLA 2: Métricas de Acoplamiento y Distancia (Ancho Exacto: 126)
    # =========================================================================
    t2_cols = [
        Column("Componente", 26, align="<", header_align="<"),
        Column("Nc", 3, align=">", header_align=">"),
        Column("Na", 3, align=">", header_align=">"),
        Column("Ca", 3, align=">", header_align=">"),
        Column("Ce", 3, align=">", header_align=">"),
        Column("Inest (I)", 9, align=">", header_align=">"),
        Column("Abstr (A)", 9, align=">", header_align=">"),
        Column("Dist (D)", 8, align=">", header_align=">"),
        Column("Estado", 15, align="<", header_align="<"),
        Column("Dependencias", 16, align="<", header_align="<"),
    ]
    t2 = BoxTable(
        title="[2/3] MÉTRICAS DE ACOPLAMIENTO (Robert C. Martin — Ca, Ce, I, A, D)",
        subtitle="Salud: Distancia D < 0.70",
        columns=t2_cols,
    )
    t2.print_header()

    for c in comp_rows:
        d_val = c["d"]
        status = "En Secuencia" if d_val <= 0.7 else "Zona de Dolor"
        deps = c.get("deps", "") or "(ninguna)"
        deps_display = deps if len(deps) <= 16 else (deps[:15] + "…")

        comp_name = c["component"]
        comp_display = comp_name if len(comp_name) <= 26 else (comp_name[:25] + "…")

        status_col = color_status(status)
        d_color = B_GREEN if d_val <= 0.7 else B_YELLOW
        d_str = f"{d_color}{d_val:>8.3f}{RESET}"

        row_vals = [
            comp_display,
            str(c["nc"]),
            str(c["na"]),
            str(c["ca"]),
            str(c["ce"]),
            f"{c['i']:>9.3f}",
            f"{c['a']:>9.3f}",
            d_str,
            status_col,
            deps_display,
        ]
        t2.print_row(row_vals)

    t2.print_footer()

    # =========================================================================
    # TABLA 3: Modelo Financiero de Deuda Técnica SQALE (Ancho Exacto: 126)
    # =========================================================================
    t3_cols = [
        Column("Componente", 26, align="<", header_align="<"),
        Column("LOC_ef", 7, align=">", header_align=">"),
        Column("CCE", 5, align=">", header_align=">"),
        Column("Deuda (h)", 13, align=">", header_align=">"),
        Column("CR ($)", 14, align=">", header_align=">"),
        Column("VA ($)", 15, align=">", header_align=">"),
        Column("TDR (%)", 12, align=">", header_align=">"),
        Column("SQALE", 9, align="^", header_align="^"),
    ]
    t3 = BoxTable(
        title="[3/3] MODELO FINANCIERO DE DEUDA TÉCNICA SQALE",
        subtitle="Calificación ISO / SQALE A-E",
        columns=t3_cols,
    )
    t3.print_header()

    total_cr = 0.0
    total_va = 0.0
    total_dt_hours = 0.0

    comp_groups: dict[str, dict] = {}
    for res in file_results:
        m = res["mod"]
        if m not in comp_groups:
            comp_groups[m] = {"loc_ef": 0, "g_fns": []}
        comp_groups[m]["loc_ef"] += res["loc_ef"]
        if res["g_fns"]:
            comp_groups[m]["g_fns"].extend(res["g_fns"])

    for mod_name, cdata in sorted(comp_groups.items()):
        loc_ef = cdata["loc_ef"]
        gs_str = ",".join(str(x) for x in cdata["g_fns"])
        comp_lang = comps.get(mod_name, {}).get("lang", default_lang)
        excess, cr, va, tdr, rating = model.debt(comp_lang, loc_ef, gs_str)

        cce_val = excess if excess is not None else 0
        hours = model.hours(comp_lang, excess) or 0.0
        cr_val = cr or 0.0
        va_val = va or 0.0
        tdr_str = f"{tdr:.1f} %" if tdr is not None else "—"
        rating_str = rating or "—"

        total_cr += cr_val
        total_va += va_val
        total_dt_hours += hours

        if tdr is not None:
            if tdr <= 5.0:
                tdr_disp = f"{B_GREEN}{tdr_str:>12}{RESET}"
            elif tdr <= 10.0:
                tdr_disp = f"{B_CYAN}{tdr_str:>12}{RESET}"
            elif tdr <= 20.0:
                tdr_disp = f"{B_YELLOW}{tdr_str:>12}{RESET}"
            else:
                tdr_disp = f"{B_RED}{tdr_str:>12}{RESET}"
        else:
            tdr_disp = f"{DIM}{tdr_str:>12}{RESET}"

        sqale_badge = color_rating(rating_str)
        comp_display = mod_name if len(mod_name) <= 26 else (mod_name[:25] + "…")

        row_vals = [
            comp_display,
            str(loc_ef),
            str(cce_val),
            f"{hours:>10.2f} h",
            f"{cr_val:>11.2f} $",
            f"{va_val:>12.2f} $",
            tdr_disp,
            sqale_badge,
        ]
        t3.print_row(row_vals)

    global_tdr = model.ratio(total_cr, total_va) if total_va > 0 else 0.0
    global_rating = model.rating(global_tdr)
    global_badge = color_rating(global_rating)
    global_tdr_col = B_GREEN if global_tdr <= 5 else (B_YELLOW if global_tdr <= 20 else B_RED)
    global_tdr_str = f"{global_tdr_col}{global_tdr:>9.1f} %{RESET}"

    t3.print_divider()
    bal_row = [
        "BALANCE GLOBAL",
        str(total_loc_ef),
        "-",
        f"{total_dt_hours:>10.2f} h",
        f"{total_cr:>11.2f} $",
        f"{total_va:>12.2f} $",
        global_tdr_str,
        global_badge,
    ]
    t3.print_row(bal_row, is_bold=True)
    t3.print_footer()

    # =========================================================================
    # TARJETA EJECUTIVA: Resumen Financiero y Arquitectónico (Ancho: 126)
    # =========================================================================
    bar = progress_bar(global_tdr, 16)
    card_inner = 124

    print(f"\n{b}╭{'─' * card_inner}╮{rst}")
    card_title = "RESUMEN EJECUTIVO DE ARQUITECTURA Y CALIDAD DE SOFTWARE"
    print(f"{b}│{B_WHITE}{card_title:^{card_inner}}{b}│{rst}")
    print(f"{b}├{'─' * card_inner}┤{rst}")

    row1_l = f"  • {B_WHITE}Activo Reconstruible (VA):{rst}    {B_GREEN}$ {total_va:>12,.2f}{rst}"
    row1_r = f"• {B_WHITE}Deuda Técnica Total:{rst}        {B_CYAN}{total_dt_hours:>8.2f} horas de ing.{rst}  "
    print(card_two_col(row1_l, row1_r, card_inner))

    row2_l = f"  • {B_WHITE}Costo de Remediación (CR):{rst}    {B_YELLOW}$ {total_cr:>12,.2f}{rst}"
    row2_r = f"• {B_WHITE}Calificación SQALE:{rst}         {global_badge} {DIM}(Nivel Saludable){rst}   "
    print(card_two_col(row2_l, row2_r, card_inner))

    row3 = f"  • {B_WHITE}Technical Debt Ratio (TDR):{rst}   {B_YELLOW if global_tdr > 5 else B_GREEN}{global_tdr:>5.2f}%{rst} {bar} {DIM}(Objetivo Grado A: <= 5.0%){rst}"
    print(card_row(row3, card_inner))

    pct_adm = (admitted_count / len(target_files) * 100.0) if target_files else 100.0
    col_adm = B_GREEN if pct_adm == 100.0 else B_YELLOW
    row4 = f"  • {B_WHITE}Puertas de Admisión:{rst}          {col_adm}{admitted_count}/{len(target_files)} archivos admitidos ({pct_adm:.1f}% compliant, G_max <= 8, MI >= 75){rst}"
    print(card_row(row4, card_inner))

    row5 = f"  • {B_WHITE}Arquitectura Hexagonal:{rst}        {B_WHITE}{len(comp_rows)} componentes delimitados · Separación estricta Core / Infra / Interfaces{rst}"
    print(card_row(row5, card_inner))

    print(f"{b}╰{'─' * card_inner}╯{rst}\n")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    run_audit(target)
