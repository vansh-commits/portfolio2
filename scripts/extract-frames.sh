#!/usr/bin/env bash
# Extract the hero-orbit frame sequence from the generated clip.
# Usage: scripts/extract-frames.sh <orbit.mp4> [fps] [width]
set -euo pipefail

SRC="${1:?usage: extract-frames.sh <orbit.mp4> [fps] [width]}"
FPS="${2:-24}"
WIDTH="${3:-1600}"
OUT="public/frames/hero"

rm -rf "$OUT"
mkdir -p "$OUT"

ffmpeg -hide_banner -loglevel error -i "$SRC" \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -q:v 4 "$OUT/frame_%04d.jpg"

COUNT=$(ls "$OUT" | grep -c '^frame_')
printf '{ "count": %d, "pad": 4, "ext": "jpg", "path": "/frames/hero" }\n' "$COUNT" > "$OUT/manifest.json"
echo "extracted $COUNT frames -> $OUT ($(du -sh "$OUT" | cut -f1))"
