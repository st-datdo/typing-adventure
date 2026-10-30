#!/usr/bin/env bash
set -uo pipefail

guard="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/guard-diff.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/guardtest.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
cd "$tmp" || exit 1

g() { git -c user.name=t -c user.email=t@example.invalid -c commit.gpgsign=false "$@"; }

g init -q -b main
mkdir -p apps/web/src packages/db .claude/hooks scripts/ci docs
printf 'export default []\n' > apps/web/eslint.config.mjs
printf 'export const a = 1\n' > apps/web/src/a.ts
printf '// eslint-disable-next-line no-console\nconsole.log(1)\n' > apps/web/src/old.ts
printf '{}\n' > packages/db/tsconfig.json
printf 'echo hi\n' > .claude/hooks/x.sh
printf 'echo hi\n' > scripts/ci/x.sh
printf '# docs\n' > docs/a.md
g add -A && g commit -qm base
base=$(git rev-parse HEAD)

pass=0
fail=0
case_run() {
  local name=$1 expect=$2 rc out
  shift 2
  out=$(env "$@" "$guard" "$base" HEAD 2>&1)
  rc=$?
  if [ "$rc" = "$expect" ]; then
    echo "PASS $name (exit $rc)"
    pass=$((pass + 1))
  else
    echo "FAIL $name: expected $expect, got $rc"
    printf '%s\n' "$out" | sed 's/^/    /'
    fail=$((fail + 1))
  fi
}
start() {
  g checkout -q -B "case" "$base"
}
commit() {
  g add -A && g commit -qm "$1"
}

start; printf 'export const a = 2\n' > apps/web/src/a.ts; commit plain
case_run "plain code change" 0

start; printf '// eslint-disable-next-line\nexport const a = 2\n' > apps/web/src/a.ts; commit disable
case_run "added eslint-disable in .ts" 1

start; printf 'export const a = 1\n// @ts-ignore\nexport const b: number = "x"\n' > apps/web/src/a.ts; commit tsignore
case_run "added @ts-ignore" 1

start; printf '// @ts-nocheck\nexport const C = () => null\n' > apps/web/src/c.tsx; commit nocheck
case_run "added @ts-nocheck in new .tsx" 1

start; printf '# docs\nNever add eslint-disable or @ts-ignore.\n' > docs/a.md; commit docs
case_run "markers in markdown are ignored" 0

start; printf 'console.log(1)\n' > apps/web/src/old.ts; commit remove
case_run "removing an existing eslint-disable" 0

start; printf 'export default [{}]\n' > apps/web/eslint.config.mjs; commit cfg
case_run "eslint.config.mjs without label" 1
case_run "eslint.config.mjs with approval label" 0 PR_LABELS="bug,config-change-approved"
case_run "eslint.config.mjs with other labels only" 1 PR_LABELS="config-change,approved"
case_run "eslint.config.mjs on push (label skipped)" 0 GUARD_SKIP_LABEL=1

start; printf 'echo bye\n' > .claude/hooks/x.sh; commit hook
case_run ".claude/hooks change without label" 1

start; printf '{"compilerOptions":{}}\n' > packages/db/tsconfig.json; commit ts
case_run "nested tsconfig.json without label" 1

start; g mv scripts/ci/x.sh scripts/y.sh; commit mv
case_run "rename out of scripts/ci without label" 1

start; printf '// @ts-ignore\nexport const a = 2\n' > apps/web/src/a.ts; printf 'export default [{}]\n' > apps/web/eslint.config.mjs; commit both
case_run "label does not excuse @ts-ignore" 1 PR_LABELS="config-change-approved"

out=$("$guard" "$base" no-such-ref 2>&1); rc=$?
if [ "$rc" = "2" ]; then echo "PASS unknown ref (exit 2)"; pass=$((pass + 1)); else echo "FAIL unknown ref: got $rc: $out"; fail=$((fail + 1)); fi

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
