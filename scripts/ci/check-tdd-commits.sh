#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: check-tdd-commits.sh <base> <head>" >&2
  exit 2
fi
base=$1
head=$2
for ref in "$base" "$head"; do
  git rev-parse --verify --quiet "$ref^{commit}" >/dev/null || {
    echo "check-tdd-commits: unknown commit $ref" >&2
    exit 2
  }
done

is_test_file() {
  case "$1" in
    *__tests__/*|*.test.ts|*.test.tsx|e2e/*.spec.ts|*/e2e/*.spec.ts) return 0 ;;
  esac
  return 1
}

failed=0
checked=0
while IFS= read -r sha; do
  [ -n "$sha" ] || continue
  checked=$((checked + 1))
  subject=$(git log -1 --format=%s "$sha")
  [[ "$subject" =~ ^feat(\([^\)]*\))?!?: ]] || continue
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if is_test_file "$f"; then
      echo "$(git rev-parse --short=12 "$sha") $subject: $f"
      failed=1
    fi
  done < <(git diff-tree --no-commit-id --name-only -r --no-renames "$sha")
done < <(git rev-list --no-merges --reverse "$base..$head")

if [ "$failed" = "1" ]; then
  echo "check-tdd-commits: FAIL: feat: commits must not touch test files; commit tests first as test: (see specs/_template.md)" >&2
  exit 1
fi
echo "check-tdd-commits: OK ($checked commits in $base..$head)"
