#!/usr/bin/env bash
set -uo pipefail

check="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/check-tdd-commits.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/tddtest.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
cd "$tmp" || exit 1

g() { git -c user.name=t -c user.email=t@example.invalid -c commit.gpgsign=false -c core.excludesFile=/dev/null "$@"; }

g init -q -b main
mkdir -p apps/web/src/lib/__tests__ apps/web/e2e packages/game-engine/src
printf 'export const a = 1\n' > apps/web/src/lib/a.ts
printf 'it("x", () => {})\n' > apps/web/src/lib/__tests__/a.test.ts
printf 'test("y", () => {})\n' > apps/web/e2e/x.spec.ts
printf 'export const b = 1\n' > packages/game-engine/src/b.ts
g add -A && g commit -qm base
base=$(git rev-parse HEAD)

pass=0
fail=0
case_run() {
  local name=$1 expect=$2 rc out
  out=$(bash "$check" "$base" HEAD 2>&1)
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
start() { g checkout -q -B "case" "$base"; }
commit() { g add -A && g commit -qm "$1"; }

start; printf 'export const a = 2\n' > apps/web/src/lib/a.ts; commit "feat: change source only"
case_run "feat: only source" 0

start; printf 'it("x2", () => {})\n' > apps/web/src/lib/__tests__/a.test.ts; printf 'export const a = 2\n' > apps/web/src/lib/a.ts; commit "feat: edit test with code"
case_run "feat: touches __tests__" 1

start; printf 'test("y2", () => {})\n' > apps/web/e2e/x.spec.ts; commit "feat(web): tweak e2e"
case_run "feat(web): touches e2e/x.spec.ts" 1

start; printf 'it("x3", () => {})\n' > apps/web/src/lib/__tests__/a.test.ts; commit "test(web): RL-01 red"
case_run "test: touches test" 0

start; printf 'it("x4", () => {})\n' > apps/web/src/lib/__tests__/a.test.ts; printf 'export const a = 4\n' > apps/web/src/lib/a.ts; commit "fix(web): bug with regression test"
case_run "fix: touches test and source (allowed: regression test ships with the fix)" 0

start; printf 'export const b = 2\n' > packages/game-engine/src/b.ts; commit "feat!: breaking"; printf 'it("z", () => {})\n' > packages/game-engine/src/b.int.test.ts; commit "feat(engine)!: breaking with int test"
case_run "feat(engine)!: adds *.int.test.ts" 1

start; printf 'it("x", () => {})\n' > packages/game-engine/src/c.test.ts; commit "test(engine): WP-01 red"; printf 'export const c = 1\n' > packages/game-engine/src/c.ts; commit "feat(engine): WP-01 green"
case_run "test: then feat: in order" 0

start; g checkout -q -b side; printf 'it("m", () => {})\n' > apps/web/src/lib/__tests__/m.test.ts; commit "test: side"
g checkout -q case; printf 'export const a = 9\n' > apps/web/src/lib/a.ts; commit "chore: main side"
g -c core.editor=true merge -q --no-ff -m "feat: merge side with tests" side
case_run "merge commit with feat: subject is skipped" 0

start; printf 'export const a = 5\n' > apps/web/src/lib/a.ts; commit "featuring: not a feat type"; printf 'x\n' > apps/web/src/lib/__tests__/n.test.ts; commit "docs: feat: in body only"
case_run "subjects that only look like feat" 0

out=$(bash "$check" "$base" no-such-ref 2>&1); rc=$?
if [ "$rc" = "2" ]; then echo "PASS unknown ref (exit 2)"; pass=$((pass + 1)); else echo "FAIL unknown ref: got $rc: $out"; fail=$((fail + 1)); fi

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
