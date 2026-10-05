# tools/metricasV2 — Sondas de LOC, Complejidad, Acoplamiento y Deuda SQALE

Herramientas de aseguramiento arquitectónico y calidad matemática calibradas para **Pocket AntiGravity IDE** (`pocket-antigravity`), implementando el marco SQALE (Iteración 4), métricas de diseño de paquetes de Robert C. Martin ($C_a, C_e, I, A, D$), límites de complejidad ciclomática de McCabe ($CC \le 5$, umbral JS $= 7$) e índice de mantenibilidad ($MI \ge 75$).

---

## 1. Componentes de la Suite

| Herramienta | Descripción y Propósito |
|---|---|
| [`audit_project.py`](audit_project.py) | **Auditoría Integral del Proyecto:** Ejecuta el análisis completo de arquitectura, complejidad ciclomática, balance de componentes y modelo financiero de deuda técnica SQALE sobre `src/`. |
| [`jsmet.py`](jsmet.py) | **Sonda Nativa de JavaScript (`.js`):** Mide líneas totales, comentarios (`//`, `/* */`), blancos, LOC efectiva y complejidad ciclomática $G$ por función (decisiones `if`, `for`, `while`, `case`, `catch`, `&&`, `\|\|`, `??`, ternarios). Respeta `// nolint: cyclop`. |
| [`jscoup.py`](jscoup.py) | **Acoplamiento de Arquitectura Hexagonal:** Analiza las capas de `src/` (`core.domain`, `core.ports`, `core.usecases`, `infrastructure.*`, `interfaces.*`, `server`) calculando $N_c$ (tipos concretos), $N_a$ (puertos/contratos abstractos), $C_a$ (aferente), $C_e$ (eferente), Inestabilidad ($I$), Abstracción ($A$) y Distancia a la Secuencia Principal ($D$). |
| [`model.py`](model.py) | **Modelo Matemático y Financiero SQALE:** Calibración económico-tecnológica por lenguaje (JavaScript, Python, Go, Dart), cálculo de CCE ($CC = P + 1$), horas de remediación, Costo de Reparación ($CR$), Valor del Activo ($VA$), $TDR$ y Calificación SQALE A-E. |
| [`admit.py`](admit.py) | **Gate de Admisión de Código:** Evalúa si archivos nuevos o modificados en el disco cumplen los techos de LOC ($\le 150$), complejidad ciclomática ($G < 10$), techo por función ($G \le 7$) y salud del componente ($D \le 0.70$). |
| [`staged.py`](staged.py) | **Gate de Git Pre-Commit:** Mide la versión de los archivos en el stage de Git (o contra `HEAD`), bloqueando commits que violen los límites de calidad. |
| [`admit_ceilings.py`](admit_ceilings.py) | Definición formal de los techos y límites de admisión a producción. |
| [`admit_probe.py`](admit_probe.py) | Enrutador políglota de sondas por extensión (`.js`, `.py`, `.go`, `.dart`, `.sql`, `.sh`). |
| [`ver-metricas.bat`](ver-metricas.bat) | Script ejecutable en Windows: lanza la auditoría completa de métricas y la suite de pruebas automatizadas de regresión (`npm test`). |

---

## 2. Calibración Específica para JavaScript (Node.js)

Bajo la matriz de calibración estándar:
- **$CC_{umbral}$ (Decisiones base por función):** $7$ (Límite estricto de refactorización $CC \le 5$).
- **$K_{lenguaje}$ (Factor de remediación / CCE):** $0.35\text{ h } (21\text{ min})$.
- **$CDU_{lenguaje}$ (Costo de desarrollo / LOC):** $0.40\text{ h } (24\text{ min})$.
- **Tarifa Horaria Estimada:** $\$45/\text{h}$.
- **Fricción Sistémica ($FF_{base} / FF_{max}$):** $0.10 \,/\, 0.25$.
- **Límite de Distancia a la Secuencia Principal:** $D \le 0.70$.

---

## 3. Modo de Uso

### Ejecutar Auditoría desde Consola
```bash
# Vía NPM script
npm run metrics

# O directamente con Python
python tools/metricasV2/audit_project.py .
```

### Ejecutar con Verificación de Pruebas (Windows)
Doble clic en `tools/metricasV2/ver-metricas.bat` o desde la terminal:
```cmd
tools\metricasV2\ver-metricas.bat
```

### Verificar Admisión de un Archivo Individual
```bash
python tools/metricasV2/admit.py src/core/ports/config.port.js
```
