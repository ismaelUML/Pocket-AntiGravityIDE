#!/bin/sh
# measure.sh <salida> [<app>]: mide app/ entero —o la copia de app/ que se le indique— y deja
# go.tsv, dart.tsv y sqlsh.tsv —por archivo— y go_coup.tsv y dart_coup.tsv —por componente— en
# <salida>. Después: python tools/metricas/matrix.py <salida>, que escribe rows.tsv y components.tsv.
# Trazabilidad: CODE_STANDARDS §7.3.1 · standards/Metricas_final.md §2.1, §3.1, §4.2 y §5
set -e
T="$(cd "$(dirname "$0")" && pwd)"
A="${2:-$T/../../app}"
mkdir -p "$1"
(cd "$T/gomet" && go run . "$A/backend") > "$1/go.tsv"
(cd "$T/gocoup" && go run . "$A/backend") > "$1/go_coup.tsv"
(cd "$T/dartmet" && dart pub get --offline >/dev/null && dart run bin/dartmet.dart "$A/frontend") > "$1/dart.tsv"
(cd "$T/dartmet" && dart run bin/dartcoup.dart "$A/frontend") > "$1/dart_coup.tsv"
python "$T/sqlmet.py" "$A" > "$1/sqlsh.tsv"
