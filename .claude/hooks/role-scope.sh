#!/usr/bin/env bash
set -uo pipefail

block() {
  echo "role-scope: BLOCKED: $*" >&2
  exit 2
}

mode=${1:-}
case "$mode" in
  docs|qc) ;;
  *) block "usage: role-scope.sh <docs|qc>" ;;
esac

command -v jq >/dev/null 2>&1 || block "jq not installed, cannot inspect tool input"

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null) || block "unreadable hook input"
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$path" ] || exit 0
[ -n "$cwd" ] && [ -d "$cwd" ] || cwd=$PWD

norm_path() {
  local part out=""
  local -a parts stack=()
  IFS=/ read -ra parts <<< "$1"
  for part in "${parts[@]}"; do
    case "$part" in
      ''|.) ;;
      ..) [ "${#stack[@]}" -gt 0 ] && unset 'stack[${#stack[@]}-1]' ;;
      *) stack+=("$part") ;;
    esac
  done
  for part in "${stack[@]+"${stack[@]}"}"; do
    out="$out/$part"
  done
  printf '%s' "${out:-/}"
}

root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || exit 0
root_real=$(cd -P "$root" 2>/dev/null && pwd -P) || root_real=$root
cwd_real=$(cd -P "$cwd" 2>/dev/null && pwd -P) || cwd_real=$cwd

case "$path" in
  /*) target=$(norm_path "$path") ;;
  *) target=$(norm_path "$cwd_real/$path") ;;
esac
head=$target
rest=""
while [ "$head" != "/" ] && [ ! -d "$head" ]; do
  rest="/${head##*/}$rest"
  head=${head%/*}
  [ -n "$head" ] || head=/
done
head_real=$(cd -P "$head" 2>/dev/null && pwd -P) || head_real=$head
target="${head_real%/}$rest"

case "$target" in
  "$root_real"/*) rel=${target#"$root_real"/} ;;
  "$root"/*) rel=${target#"$root"/} ;;
  *) exit 0 ;;
esac

case "$rel" in
  docs/features/*) exit 0 ;;
esac

if [ "$mode" = "qc" ]; then
  case "$rel" in
    *__tests__/*|*.test.ts|*.test.tsx|e2e/*.spec.ts|*/e2e/*.spec.ts) exit 0 ;;
  esac
  block "$rel is not a test file or docs/features/**; QC never edits source code. Record the defect in 04-qc-report.md for DEV instead"
fi

block "$rel is outside docs/features/**; this role only writes its document under docs/features/<slug>/"
