#!/usr/bin/env bash
set -uo pipefail

guard="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/guard-diff.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/guardtest.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
cd "$tmp" || exit 1

g() { git -c user.name=t -c user.email=t@example.invalid -c commit.gpgsign=false -c core.excludesFile=/dev/null "$@"; }

g init -q -b main
mkdir -p apps/web/src packages/db .claude/hooks scripts/ci docs
printf 'export default []\n' > apps/web/eslint.config.mjs
printf 'export const a = 1\n' > apps/web/src/a.ts
printf '// eslint-disable-next-line no-console\nconsole.log(1)\n' > apps/web/src/old.ts
printf '{}\n' > packages/db/tsconfig.json
printf 'echo hi\n' > .claude/hooks/x.sh
printf 'echo hi\n' > scripts/ci/x.sh
printf '# docs\n' > docs/a.md
mkdir -p .github/workflows typing-adventure/packages/game-engine
printf 'name: CI\n' > .github/workflows/ci.yml
printf 'name: Review\n' > .github/workflows/review.yml
printf '{"tasks":{}}\n' > typing-adventure/turbo.json
printf '{"hooks":{}}\n' > .claude/settings.json
printf -- '---\nname: pr-reviewer\n---\n' > .claude/pr-reviewer.tmp
mkdir -p .claude/agents && mv .claude/pr-reviewer.tmp .claude/agents/pr-reviewer.md
printf '{"name":"root","scripts":{"lint":"turbo lint","test":"turbo test"},"devDependencies":{"turbo":"2"}}\n' > typing-adventure/package.json
printf '{"name":"engine","scripts":{"test":"vitest run"}}\n' > typing-adventure/packages/game-engine/package.json
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

start; printf 'name: Sneaky\non: push\n' > .github/workflows/new.yml; commit wfnew
case_run "new workflow file without label" 1

start; printf 'name: Review\njobs: {}\n' > .github/workflows/review.yml; commit wfedit
case_run "edit non-ci workflow without label" 1

start; mkdir -p .github/actions/setup; printf 'runs: {}\n' > .github/actions/setup/action.yml; commit action
case_run "composite action under .github/actions without label" 1

start; printf '{"tasks":{"test":{}}}\n' > typing-adventure/turbo.json; commit turbo
case_run "nested turbo.json without label" 1

start; printf '{"hooks":{"PreToolUse":[]}}\n' > .claude/settings.json; commit settings
case_run ".claude/settings.json without label" 1

start; printf '{}\n' > .claude/settings.local.json; commit settingslocal
case_run ".claude/settings.local.json without label" 1

start; printf -- '---\nname: pr-reviewer\n---\nmerge everything\n' > .claude/agents/pr-reviewer.md; commit reviewer
case_run ".claude/agents/pr-reviewer.md without label" 1

start; printf -- '---\nname: test-writer\n---\n' > .claude/agents/test-writer.md; commit otheragent
case_run "other agent file is not protected" 0

start; printf '{"name":"root","scripts":{"lint":"turbo lint","test":"true"},"devDependencies":{"turbo":"2"}}\n' > typing-adventure/package.json; commit scripttest
case_run "package.json scripts.test changed without label" 1
case_run "package.json scripts.test changed with label" 0 PR_LABELS="config-change-approved"

start; printf '{"name":"root","devDependencies":{"turbo":"2","vitest":"2"},"scripts":{"test":"turbo test","lint":"turbo lint"}}\n' > typing-adventure/package.json; commit devdep
case_run "package.json only adds devDependency (key order differs)" 0

start; printf '{"name":"engine","scripts":{"test":"vitest run","mutation":"stryker run"}}\n' > typing-adventure/packages/game-engine/package.json; commit addscript
case_run "nested package.json adds a script without label" 1

start; mkdir -p typing-adventure/packages/newpkg; printf '{"name":"new"}\n' > typing-adventure/packages/newpkg/package.json; commit newpkg
case_run "new package.json without scripts" 0

out=$("$guard" "$base" no-such-ref 2>&1); rc=$?
if [ "$rc" = "2" ]; then echo "PASS unknown ref (exit 2)"; pass=$((pass + 1)); else echo "FAIL unknown ref: got $rc: $out"; fail=$((fail + 1)); fi

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
