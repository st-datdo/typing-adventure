#!/usr/bin/env bash
set -uo pipefail

command -v jq >/dev/null 2>&1 || { echo "guard-read: BLOCKED: jq not installed, cannot inspect tool input" >&2; exit 2; }

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || {
  echo "guard-read: BLOCKED: unreadable hook input" >&2
  exit 2
}
[ -n "$path" ] || exit 0

name=${path##*/}
case "$name" in
  .env.example) exit 0 ;;
  .env|.env.*)
    echo "guard-read: BLOCKED: $name holds secrets; read .env.example for variable names instead" >&2
    exit 2
    ;;
esac
exit 0
