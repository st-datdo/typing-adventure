#!/usr/bin/env bash
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
bt=$'\x60'
header="| PR | spec | criteria met | risk | evidence | deviation |"

usage() {
  echo "usage: feature-map.sh [--header] <pr-number>" >&2
  exit 2
}

show_header=0
if [ "${1:-}" = "--header" ]; then
  show_header=1
  shift
fi
[ "$#" = "1" ] || usage
pr=$1
[[ "$pr" =~ ^[1-9][0-9]*$ ]] || usage

for bin in gh jq git awk; do
  command -v "$bin" >/dev/null 2>&1 || { echo "feature-map: $bin not found" >&2; exit 2; }
done

die() {
  echo "feature-map: $*" >&2
  exit 1
}

is_test_file() {
  case "$1" in
    *__tests__/*|*.test.ts|*.test.tsx|*.test.mjs|e2e/*.spec.ts|*/e2e/*.spec.ts|*/test/*.test.*|scripts/*/test-*.sh) return 0 ;;
  esac
  return 1
}

is_task_doc() {
  case "$1" in
    specs/*|docs/plans/*|docs/ai-levelup/learner/*) return 0 ;;
  esac
  return 1
}

cell() {
  printf '%s' "$1" | tr '\n' ' ' | sed -e 's/|/\\|/g' -e 's/[[:space:]]*$//'
}

view=$(gh pr view "$pr" --json number,headRefOid,statusCheckRollup 2>/dev/null) || die "cannot read PR #$pr"
head_sha=$(printf '%s' "$view" | jq -r '.headRefOid // empty')
[ -n "$head_sha" ] || die "PR #$pr has no head commit"

files_json=$(gh api "repos/{owner}/{repo}/pulls/$pr/files" --paginate 2>/dev/null) || die "cannot list files of PR #$pr"
file_list=$(printf '%s' "$files_json" | jq -rs 'add // [] | .[] | [.status, .filename] | @tsv') || die "unexpected files payload"
[ -n "$file_list" ] || die "PR #$pr has no files"
files=$(printf '%s\n' "$file_list" | cut -f2)

diff=$(gh pr diff "$pr" 2>/dev/null) || die "cannot read diff of PR #$pr"

doc_at() {
  local path=$1 body
  if git cat-file -e "$head_sha:$path" 2>/dev/null; then
    git show "$head_sha:$path"
    return
  fi
  body=$(gh api "repos/{owner}/{repo}/contents/$path?ref=$head_sha" 2>/dev/null) || return 1
  printf '%s' "$body" | jq -r '.content // empty' | tr -d '\n' | base64 --decode 2>/dev/null
}

spec=$(printf '%s\n' "$file_list" | awk -F'\t' '$1 == "added" && $2 ~ /^specs\/[^\/]+\/spec\.md$/ { print $2; exit }')
[ -n "$spec" ] || spec=$(printf '%s\n' "$file_list" | awk -F'\t' '$1 != "removed" && $2 ~ /^specs\/[^\/]+\/spec\.md$/ { print $2; exit }')
kind=spec
if [ -z "$spec" ]; then
  spec=$(printf '%s\n' "$file_list" | awk -F'\t' '$1 != "removed" && $2 ~ /^docs\/plans\/[^\/_][^\/]*\.md$/ { print $2; exit }')
  kind=plan
fi

expected=""
criteria="n/a"
if [ -n "$spec" ]; then
  doc=$(doc_at "$spec") || die "cannot read $spec at ${head_sha:0:8}"
  if [ "$kind" = "spec" ]; then
    expected=$(printf '%s\n' "$doc" | awk '
      /^File dự kiến:/ { on = 1 }
      on && /^[[:space:]]*$/ { exit }
      on { print }
    ' | grep -oE "${bt}[^${bt}]+${bt}" | tr -d "$bt")
    ids=$(printf '%s\n' "$doc" | grep -oE '^\|[[:space:]]*[A-Z][A-Z0-9]*-[0-9]+[[:space:]]*\|' | grep -oE '[A-Z][A-Z0-9]*-[0-9]+' | sort -u)
    cited=$(printf '%s\n' "$diff" | awk '
      /^\+\+\+ / { file = substr($0, 5); sub(/^b\//, "", file); next }
      /^\+/ { print file "\t" substr($0, 2) }
    ' | while IFS=$'\t' read -r f line; do
      is_test_file "$f" && printf '%s\n' "$line"
    done | grep -oE '[A-Z][A-Z0-9]*-[0-9]+' | sort -u)
    total=$(printf '%s\n' "$ids" | grep -c . || true)
    met=0
    if [ -n "$ids" ]; then
      met=$(comm -12 <(printf '%s\n' "$ids") <(printf '%s\n' "$cited") | grep -c . || true)
    fi
    criteria="$met/$total"
  else
    expected=$(printf '%s\n' "$doc" | awk '
      /^## / { on = ($0 ~ /^## File thay đổi/); next }
      on { print }
    ' | grep -oE "${bt}[^${bt}]+${bt}" | tr -d "$bt")
  fi
fi

deviation=()
while IFS= read -r f; do
  [ -n "$f" ] || continue
  is_task_doc "$f" && continue
  allowed=0
  while IFS= read -r tok; do
    [ -n "$tok" ] || continue
    tok=${tok%/}
    case "$f" in
      "$tok"|*/"$tok"|"$tok"/*) allowed=1; break ;;
    esac
  done <<< "$expected"
  [ "$allowed" = "1" ] || deviation+=("$f")
done <<< "$files"

risk=$(printf '%s\n' "$files" | bash "$here/risk.sh" | head -n 1)
risk=${risk#risk=}

evidence=$(printf '%s' "$view" | jq -r '
  def rank: if . == "FAILURE" or . == "CANCELLED" or . == "TIMED_OUT" or . == "ACTION_REQUIRED" or . == "STARTUP_FAILURE" or . == "ERROR" then 4
    elif . == "PENDING" then 3 elif . == "SUCCESS" or . == "NEUTRAL" then 2 else 1 end;
  [.statusCheckRollup // [] | .[] | {
    name: (.name // .context // "check"),
    c: (if (.status // "COMPLETED") != "COMPLETED" then "PENDING" else ((.conclusion // .state // "") | ascii_upcase) end)
  }] as $all
  | ($all | map(.name) | reduce .[] as $n ([]; if index([$n]) then . else . + [$n] end)) as $names
  | [$names[] as $n | ($all | map(select(.name == $n) | .c) | max_by(rank)) as $c | "\($n):\($c | ascii_downcase)"]
  | if length == 0 then "no checks" else join(", ") end
')

dev_cell=""
if [ "${#deviation[@]}" -gt 0 ]; then
  dev_cell=$(printf "$bt%s$bt, " "${deviation[@]}" | sed 's/, $//')
fi

[ "$show_header" = "1" ] && printf '%s\n|---|---|---|---|---|---|\n' "$header"
printf '| #%s | %s | %s | %s | %s | %s |\n' "$pr" "$(cell "${spec:--}")" "$criteria" "$risk" "$(cell "$evidence")" "$(cell "$dev_cell")"
