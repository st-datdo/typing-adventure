#!/usr/bin/env bash
set -uo pipefail

command -v jq >/dev/null 2>&1 || { echo "format-lint: jq not installed, skipped" >&2; exit 1; }

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
[ -n "$path" ] && [ -f "$path" ] || exit 0

dir=$(cd "$(dirname "$path")" 2>/dev/null && pwd -P) || exit 0
file="$dir/${path##*/}"
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || exit 0
app="$root/typing-adventure"

case "$file" in
  "$app"/*) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/*|*/.next/*|*/.turbo/*) exit 0 ;;
esac

ext=${file##*.}
case "$ext" in
  ts|tsx|js|jsx|mjs|cjs|css|json) ;;
  *) exit 0 ;;
esac

prettier="$app/node_modules/.bin/prettier"
if [ ! -x "$prettier" ]; then
  echo "format-lint: $prettier missing (run pnpm install in typing-adventure), not formatted" >&2
  exit 1
fi
if ! out=$(cd "$app" && "$prettier" --write --log-level warn "$file" 2>&1); then
  echo "format-lint: prettier failed on ${file#"$root"/}:" >&2
  printf '%s\n' "$out" | head -20 >&2
  exit 2
fi

case "$file" in
  "$app/apps/web/"*) ;;
  *) exit 0 ;;
esac
case "$ext" in
  ts|tsx|js|jsx|mjs) ;;
  *) exit 0 ;;
esac

eslint="$app/apps/web/node_modules/.bin/eslint"
if [ ! -x "$eslint" ]; then
  echo "format-lint: $eslint missing (run pnpm install in typing-adventure), not linted" >&2
  exit 1
fi
out=$(cd "$app/apps/web" && "$eslint" --no-warn-ignored "$file" 2>&1)
rc=$?
case "$rc" in
  0) exit 0 ;;
  1)
    echo "format-lint: eslint errors in ${file#"$root"/}, fix them:" >&2
    printf '%s\n' "$out" | grep -E 'error|✖' | head -20 >&2
    exit 2
    ;;
  *)
    echo "format-lint: eslint could not run (exit $rc):" >&2
    printf '%s\n' "$out" | head -5 >&2
    exit 1
    ;;
esac
