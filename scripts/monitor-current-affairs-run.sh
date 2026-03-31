#!/bin/zsh

set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <out-dir> <process-pattern> [interval-seconds]" >&2
  exit 1
fi

OUT_DIR="$1"
PROCESS_PATTERN="$2"
INTERVAL_SECONDS="${3:-600}"
MODE="${4:-loop}"
LOG_FILE="$OUT_DIR/monitor.log"
STATE_FILE="$OUT_DIR/monitor.state"

notify() {
  local title="$1"
  local message="$2"
  /usr/bin/osascript -e "display dialog \"${message//\"/\\\"}\" with title \"${title//\"/\\\"}\" buttons {\"OK\"} default button \"OK\" giving up after 20" >/dev/null 2>&1 || true
}

append_log() {
  local line="$1"
  mkdir -p "$OUT_DIR"
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$line" >>"$LOG_FILE"
}

read_state() {
  if [[ -f "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
  fi
}

write_state() {
  local state="$1"
  mkdir -p "$OUT_DIR"
  printf '%s\n' "$state" >"$STATE_FILE"
}

latest_cache_progress() {
  if [[ ! -d "$OUT_DIR/cache" ]]; then
    echo "Cache directory not created yet."
    return
  fi

  local latest_file
  latest_file="$(
    find "$OUT_DIR/cache" -type f -exec stat -f '%m %N' {} \; 2>/dev/null \
      | sort -nr \
      | head -n 1 \
      | cut -d' ' -f2-
  )"

  if [[ -z "$latest_file" ]]; then
    echo "Cache exists but no files have been written yet."
    return
  fi

  local cache_dir="${latest_file#"$OUT_DIR/cache/"}"
  cache_dir="${cache_dir%%/*}"
  local pages_json="$OUT_DIR/cache/$cache_dir/pages.json"
  local total_pages="?"
  local ocr_pages="0"

  if [[ -f "$pages_json" ]]; then
    total_pages="$(jq '.pages | length' "$pages_json" 2>/dev/null || echo '?')"
  fi

  if [[ -d "$OUT_DIR/cache/$cache_dir/ocr" ]]; then
    ocr_pages="$(find "$OUT_DIR/cache/$cache_dir/ocr" -type f | wc -l | tr -d ' ')"
  fi

  echo "${cache_dir}: OCR ${ocr_pages}/${total_pages}"
}

run_check() {
  if [[ -f "$OUT_DIR/report.json" ]]; then
    local local_total
    local message
    local previous_state
    local_total="$(jq '.totalQuestions' "$OUT_DIR/report.json" 2>/dev/null || echo '?')"
    message="Batch complete. Final questions: ${local_total}. See report.json."
    previous_state="$(read_state)"
    if [[ "$previous_state" != "complete" ]]; then
      append_log "$message"
      notify "PT365 Batch Complete" "$message"
      write_state "complete"
    fi
    return 0
  fi

  if ! pgrep -f "$PROCESS_PATTERN" >/dev/null 2>&1; then
    local message
    local previous_state
    message="Generator process not running. Last known progress: $(latest_cache_progress)"
    previous_state="$(read_state)"
    if [[ "$previous_state" != "stopped" ]]; then
      append_log "$message"
      notify "PT365 Batch Stopped" "$message"
      write_state "stopped"
    fi
    return 0
  fi

  local message
  message="Batch active. $(latest_cache_progress)"
  append_log "$message"
  notify "PT365 Batch Update" "$message"
  write_state "active"
}

if [[ "$MODE" == "once" ]]; then
  run_check
  exit 0
fi

while true; do
  run_check
  sleep "$INTERVAL_SECONDS"
done
