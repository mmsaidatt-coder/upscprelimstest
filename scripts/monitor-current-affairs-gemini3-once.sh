#!/bin/zsh

set -euo pipefail

exec /Users/mani/Desktop/upscprelimstest/scripts/monitor-current-affairs-run.sh \
  /Users/mani/Desktop/upscprelimstest/data/generated/current-affairs-2025-pt365-sections-gemini-3 \
  "generate-current-affairs-bank.ts --out-dir data/generated/current-affairs-2025-pt365-sections-gemini-3 --concurrency 3" \
  600 \
  once
