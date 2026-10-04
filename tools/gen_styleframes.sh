#!/usr/bin/env bash
# Erzeugt Figurenblätter und Styleframes (Weg 1, Schritt 3) über die Gemini API.
# Aufruf: bash tools/gen_styleframes.sh [modell]
# Voraussetzung: GEMINI_API_KEY gesetzt, Abrechnung im Google-AI-Studio-Projekt aktiv.
set -euo pipefail
cd "$(dirname "$0")/.."
MODEL="${1:-gemini-3-pro-image}"
OUT=ki-styleframes
TMP="$(mktemp -d)"
mkdir -p "$OUT"

gen() { # gen <promptdatei> <ausgabe> [referenzen...]
  local p="$1" o="$2"; shift 2
  cat prompts/stil.txt "prompts/$p" > "$TMP/prompt.txt"
  local refs=(); for r in "$@"; do refs+=(--ref "$r"); done
  python3 tools/gen_image.py --model "$MODEL" --prompt-file "$TMP/prompt.txt" --out "$OUT/$o" "${refs[@]}"
}

# 1. Figurenblätter: zuerst der Arzt, die Patientin übernimmt dessen Stil
gen 01-figurenblatt-arzt.txt       01-figurenblatt-arzt.png
gen 02-figurenblatt-patientin.txt  02-figurenblatt-patientin.png  "$OUT/01-figurenblatt-arzt.png"

# 2. Styleframes mit beiden Figurenblättern als Referenz (Konsistenz)
R=("$OUT/01-figurenblatt-arzt.png" "$OUT/02-figurenblatt-patientin.png")
gen 10-styleframe-morgen.txt   10-styleframe-morgen.png   "${R[@]}"
gen 11-styleframe-praxis.txt   11-styleframe-praxis.png   "${R[@]}"
gen 12-styleframe-auto.txt     12-styleframe-auto.png     "${R[@]}"

# 3. Gegenprobe: dieselbe Szene im klaren Flat-Stil mit Konturen (Stil B)
gen 13-styleframe-auto-stilB.txt 13-styleframe-auto-stilB.png "${R[@]}"
