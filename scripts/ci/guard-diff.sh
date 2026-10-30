#!/usr/bin/env bash
set -euo pipefail

approval_label="config-change-approved"

if [ $# -ne 2 ]; then
  echo "usage: guard-diff.sh <base> <head>  (env: PR_LABELS=a,b  GUARD_SKIP_LABEL=1)" >&2
  exit 2
fi
base=$1
head=$2
for ref in "$base" "$head"; do
  git rev-parse --verify --quiet "$ref^{commit}" >/dev/null || {
    echo "guard-diff: unknown commit $ref" >&2
    exit 2
  }
done
range="$base...$head"
failed=0

markers=$(git diff --no-color --no-ext-diff --unified=0 "$range" -- \
  '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs' | awk '
  /^\+\+\+ / { file = substr($0, 5); sub(/^b\//, "", file); next }
  /^@@/ { split($3, a, ","); line = substr(a[1], 2) + 0; next }
  /^\+/ {
    if ($0 ~ /eslint-disable|@ts-ignore|@ts-nocheck/) print file ":" line ": " substr($0, 2)
    line++
  }
')
if [ -n "$markers" ]; then
  echo "guard-diff: FAIL: added lines disable lint/type checks (eslint-disable, @ts-ignore, @ts-nocheck are not allowed; fix the code instead):"
  printf '%s\n' "$markers" | sed 's/^/  /'
  failed=1
fi

command -v jq >/dev/null 2>&1 || {
  echo "guard-diff: jq is required to compare package.json scripts" >&2
  exit 2
}
merge_base=$(git merge-base "$base" "$head")
scripts_of() {
  if ! git cat-file -e "$1:$2" 2>/dev/null; then
    echo null
    return
  fi
  git show "$1:$2" | jq -S '.scripts // null' 2>/dev/null || echo "unreadable"
}

protected=()
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in
    eslint.config.*|*/eslint.config.*|.prettierrc*|*/.prettierrc*|tsconfig*.json|*/tsconfig*.json|\
    lefthook.yml|.gitleaks.toml|.github/workflows/*|.github/actions/*|.github/rulesets/*|.github/ISSUE_TEMPLATE/*|\
    .github/*.yml|.github/*.yaml|scripts/ci/*|scripts/agent/*|scripts/metrics/*|.claude/hooks/*|.claude/agents/*|\
    turbo.json|*/turbo.json|.claude/settings*.json)
      protected+=("$f")
      ;;
    package.json|*/package.json)
      if [ "$(scripts_of "$merge_base" "$f")" != "$(scripts_of "$head" "$f")" ]; then
        protected+=("$f (scripts changed)")
      fi
      ;;
  esac
done < <(git diff --name-only --no-renames "$range")

if [ "${#protected[@]}" -gt 0 ]; then
  labels=",$(printf '%s' "${PR_LABELS:-}" | tr '\n' ',' | tr -d ' '),"
  if [ "${GUARD_SKIP_LABEL:-0}" = "1" ]; then
    echo "guard-diff: protected config changed (label check skipped, GUARD_SKIP_LABEL=1):"
    printf '  %s\n' "${protected[@]}"
  elif [[ "$labels" == *",$approval_label,"* ]]; then
    echo "guard-diff: protected config changed, approved by label $approval_label:"
    printf '  %s\n' "${protected[@]}"
  else
    echo "guard-diff: FAIL: protected config changed without label $approval_label (a human must review and add it):"
    printf '  %s\n' "${protected[@]}"
    failed=1
  fi
fi

if [ "$failed" = "0" ]; then
  echo "guard-diff: OK ($range)"
fi
exit "$failed"
