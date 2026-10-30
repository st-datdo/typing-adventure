#!/usr/bin/env bash
set -uo pipefail

block() {
  echo "guard-scope: BLOCKED: $*" >&2
  exit 2
}

command -v jq >/dev/null 2>&1 || block "jq not installed, cannot inspect tool input"

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || block "unreadable hook input"
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$path" ] || exit 0
[ -n "$cwd" ] && [ -d "$cwd" ] || cwd=$PWD

norm_path() {
  local p=$1 part out=""
  local -a parts stack=()
  IFS=/ read -ra parts <<< "$p"
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

resolve_path() {
  local p d rest real
  case "$1" in
    /*) p=$1 ;;
    *) p="$2/$1" ;;
  esac
  p=$(norm_path "$p")
  d=$p
  rest=""
  while [ "$d" != "/" ] && [ ! -d "$d" ]; do
    rest="/${d##*/}$rest"
    d=${d%/*}
    [ -n "$d" ] || d=/
  done
  real=$(cd -P "$d" 2>/dev/null && pwd -P) || real=$d
  [ "$real" = "/" ] && real=""
  printf '%s' "$real$rest"
}

root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || exit 0
root=$(cd -P "$root" 2>/dev/null && pwd -P) || exit 0

scope=${CLAUDE_SCOPE_FILE:-}
if [ -z "$scope" ] && [ -f "$root/.wt-scope" ]; then
  IFS= read -r scope < "$root/.wt-scope" || true
  scope=${scope%$'\r'}
  scope=${scope#"${scope%%[![:space:]]*}"}
  scope=${scope%"${scope##*[![:space:]]}"}
fi
[ -n "$scope" ] || exit 0

scope_abs=$(resolve_path "$scope" "$root")
[ -f "$scope_abs" ] || block "scope file '$scope' does not exist (from ${CLAUDE_SCOPE_FILE:+CLAUDE_SCOPE_FILE}${CLAUDE_SCOPE_FILE:-.wt-scope}); fix the scope or create the spec/plan first"

target=$(resolve_path "$path" "$cwd")
case "$target" in
  "$root"/*) rel=${target#"$root"/} ;;
  *) exit 0 ;;
esac

scope_rel=${scope_abs#"$root"/}
[ "$target" = "$scope_abs" ] && exit 0
case "$rel" in
  specs/*|docs/plans/*|docs/ai-levelup/*) exit 0 ;;
esac

glob_to_regex() {
  local g=$1 out="" c i=0 n=${#1}
  while [ "$i" -lt "$n" ]; do
    c=${g:$i:1}
    if [ "$c" = "*" ] && [ "${g:$((i + 1)):1}" = "*" ]; then
      if [ "${g:$((i + 2)):1}" = "/" ]; then
        out="$out(.*/)?"
        i=$((i + 3))
      else
        out="$out.*"
        i=$((i + 2))
      fi
      continue
    fi
    case "$c" in
      "*") out="${out}[^/]*" ;;
      "?") out="${out}[^/]" ;;
      [.+\(\)\|^\$\{\}\[\]] | "\\") out="${out}\\$c" ;;
      *) out="$out$c" ;;
    esac
    i=$((i + 1))
  done
  printf '%s' "$out"
}

extract_entries() {
  local line in_plan=0
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" =~ ^##[[:space:]] ]]; then
      if [[ "$line" =~ ^##[[:space:]]+File[[:space:]]+thay[[:space:]]+đổi ]]; then
        in_plan=1
      else
        in_plan=0
      fi
      continue
    fi
    if [ "$in_plan" = "1" ] || [[ "$line" =~ (File[[:space:]]+dự[[:space:]]+kiến|Test)\**: ]]; then
      while [[ "$line" =~ \`([^\`]+)\` ]]; do
        printf '%s\n' "${BASH_REMATCH[1]}"
        line=${line#*"${BASH_REMATCH[0]}"}
      done
    fi
  done < "$scope_abs"
}

while IFS= read -r entry; do
  [ -n "$entry" ] || continue
  case "$entry" in
    *" "*) continue ;;
    /*) continue ;;
  esac
  entry=$(norm_path "$entry")
  entry=${entry#/}
  [ -n "$entry" ] || continue
  [ "$rel" = "$entry" ] && exit 0
  case "$rel" in "$entry"/*) exit 0 ;; esac
  re=$(glob_to_regex "$entry")
  [[ "$rel" =~ ^${re}$ ]] && exit 0
done < <(extract_entries)

block "$rel is outside the scope of $scope_rel. If the change is really needed, add \`$rel\` to the 'File dự kiến:'/'Test:' line (spec) or '## File thay đổi' (plan), add a Lịch sử line explaining why, then retry"
