#!/usr/bin/env bash
# Builds out/10-jahre-alltag.mp4 from code: synthesised soundtrack + canvas animation.
# Requirements: node + playwright (Chromium), python3 + numpy + scipy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out

echo "1/3 soundtrack"
python3 src/soundtrack.py out/soundtrack.wav
ffmpeg -y -loglevel error -i out/soundtrack.wav -c:a aac -b:a 192k out/soundtrack.m4a   # for the live preview

echo "2/3 frames"
node render.cjs --fps "${FPS:-60}" --workers "${WORKERS:-3}"

echo "3/3 encode + mux"
ffmpeg -y -loglevel error -i out/video_silent.mp4 -i out/soundtrack.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 320k -shortest -movflags +faststart \
  out/10-jahre-alltag.mp4
rm -f out/video_silent.mp4 out/soundtrack.wav
echo "done -> out/10-jahre-alltag.mp4"
