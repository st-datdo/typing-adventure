#!/usr/bin/env bash
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
risk="$here/risk.sh"
fmap="$here/feature-map.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/risk.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
tab=$'\t'
bt=$'\x60'

pass=0
fail=0

ok() {
  echo "PASS $1"
  pass=$((pass + 1))
}

ko() {
  echo "FAIL $1"
  fail=$((fail + 1))
}

expect_risk() {
  local name=$1 want=$2 input=$3 out rc
  shift 3
  out=$(printf '%b' "$input" | bash "$risk" 2>&1)
  rc=$?
  local good=1 p
  [ "$rc" = "0" ] || good=0
  [ "${out%%$'\n'*}" = "risk=$want" ] || good=0
  for p in "$@"; do
    grep -qF -- "$p" <<< "$out" || good=0
  done
  if [ "$good" = "1" ]; then
    ok "$name -> risk=$want"
  else
    ko "$name: expected risk=$want with [$*], got exit $rc:"
    printf '%s\n' "$out" | sed 's/^/    /'
  fi
}

pr10='docs/ai-levelup/learner/L07-parallel/task-A.md\nspecs/RG/spec.md\ntyping-adventure/apps/web/src/app/api/auth/register/__tests__/register-limit.test.ts\ntyping-adventure/apps/web/src/app/api/auth/register/route.ts\ntyping-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts\ntyping-adventure/apps/web/src/lib/rate-limit.ts\n'
pr11='docs/ai-levelup/learner/L07-parallel/task-B.md\nspecs/WM/spec.md\nspecs/WP/spec.md\ntyping-adventure/packages/game-engine/src/__tests__/moderation-v3.test.ts\ntyping-adventure/packages/game-engine/src/moderation.ts\n'
expect_risk "PR #10 file list (auth register + rate limit)" high "$pr10" \
  "typing-adventure/apps/web/src/app/api/auth/register/route.ts${tab}high: auth route" \
  "typing-adventure/apps/web/src/lib/rate-limit.ts${tab}high: rate limit" \
  "specs/RG/spec.md${tab}standard"
expect_risk "PR #11 file list (game-engine only)" standard "$pr11" \
  "typing-adventure/packages/game-engine/src/moderation.ts${tab}standard"

while IFS='|' read -r path why; do
  expect_risk "high path $path" high "docs/readme.md\n$path\n" "$path${tab}high: $why" "docs/readme.md${tab}standard"
done <<'EOF'
typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts|auth route
typing-adventure/apps/web/src/lib/auth.ts|auth config
typing-adventure/apps/web/src/lib/admin-guard.ts|admin guard
typing-adventure/apps/web/src/middleware.ts|route protection middleware
typing-adventure/apps/web/src/lib/multiplayer/anti-cheat.ts|multiplayer/anti-cheat
typing-adventure/apps/web/server.ts|socket server
typing-adventure/packages/db/prisma/migrations/20261030_x/migration.sql|prisma schema/migration
.github/workflows/ci.yml|github config/workflow
.github/ISSUE_TEMPLATE/agent-task.yml|github config/workflow
.claude/agents/issue-runner.md|agent config
.claude/rules/game-engine.md|agent config
scripts/agent/ready-gate.sh|repo scripts
lefthook.yml|git hooks
package.json|package manifest
typing-adventure/packages/game-engine/package.json|package manifest
typing-adventure/pnpm-lock.yaml|lockfile
EOF

expect_risk "near-miss paths stay standard" standard \
  "typing-adventure/apps/web/src/lib/auth-helpers.ts\ntyping-adventure/apps/web/src/app/api/authors/route.ts\ntyping-adventure/apps/web/scripts/voice-clips.ts\ntyping-adventure/apps/web/src/lib/rate-limit-store.ts\ndocs/scripts/notes.md\npackage.json.bak\n" \
  "typing-adventure/apps/web/scripts/voice-clips.ts${tab}standard" "package.json.bak${tab}standard"
expect_risk "case variants on case-insensitive FS" high ".GitHub/workflows/ci.yml\nTyping-Adventure/apps/web/src/Middleware.ts\n" \
  ".GitHub/workflows/ci.yml${tab}high: github config/workflow" "Typing-Adventure/apps/web/src/Middleware.ts${tab}high: route protection middleware"
expect_risk "./ prefix, CRLF, blank lines, no trailing newline" high "\r\n./.claude/hooks/guard-bash.sh\r\n\n  docs/a.md  \ndocs/b.md" \
  ".claude/hooks/guard-bash.sh${tab}high: agent config" "docs/a.md${tab}standard" "docs/b.md${tab}standard"
expect_risk "path escaping the repo root" high "typing-adventure/../.github/x\n../etc/passwd\n" \
  "typing-adventure/../.github/x${tab}high: path escapes repo root" "../etc/passwd${tab}high: path escapes repo root"
expect_risk "empty stdin fails closed" high "" "high: no paths on stdin"

out=$(printf 'a\n' | bash "$risk" extra 2>&1)
rc=$?
if [ "$rc" = "2" ] && grep -q usage <<< "$out"; then ok "argument given: exit 2"; else ko "argument given: got exit $rc '$out'"; fi

out=$(printf '%b' "$pr10" | bash "$risk")
if [ "$(printf '%s\n' "$out" | wc -l | tr -d ' ')" = "7" ] && [ "$(printf '%s\n' "$out" | tail -n +2 | grep -c "$tab")" = "6" ]; then
  ok "one line per path with a TAB after the risk line"
else
  ko "output format: $out"
fi

mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
d=${GH_STUB_DIR:?}
case "$1 $2" in
  "pr view") cat "$d/view.json" ;;
  "pr diff") cat "$d/diff.patch" ;;
  api\ *)
    case "$2" in
      */pulls/*/files) cat "$d/files.json" ;;
      */contents/*)
        p=${2#*/contents/}
        p=${p%%\?*}
        f="$d/contents/$(printf '%s' "$p" | tr '/' '_')"
        [ -f "$f" ] || { echo '{"message":"Not Found"}'; exit 1; }
        printf '{"content":"%s"}' "$(base64 < "$f" | tr -d '\n')"
        ;;
      *) exit 1 ;;
    esac
    ;;
  *) exit 1 ;;
esac
EOF
chmod +x "$tmp/bin/gh"

fm_case() {
  local d="$tmp/$1"
  mkdir -p "$d/contents"
  printf '%s' "$d"
}

view_json() {
  printf '{"number":5,"headRefOid":"0000000000000000000000000000000000000abc","statusCheckRollup":%s}\n' "$2" > "$1/view.json"
}

files_json() {
  local d=$1 sep="" out="["
  shift
  for pair in "$@"; do
    out="$out$sep{\"status\":\"${pair%%=*}\",\"filename\":\"${pair#*=}\"}"
    sep=","
  done
  printf '%s]\n' "$out" > "$d/files.json"
}

spec_zz() {
  cat <<EOF
# ZZ · test spec

Trạng thái: approved (issue #4)

| ID | EARS | Test |
|---|---|---|
| ZZ-01 | WHEN a THE SYSTEM SHALL b | ${bt}x.test.ts${bt} |
| ZZ-02 | IF c THEN THE SYSTEM SHALL d | ${bt}x.test.ts${bt} |

File dự kiến: ${bt}typing-adventure/packages/game-engine/src/zz.ts${bt} (thêm). Test: ${bt}typing-adventure/packages/game-engine/src/__tests__/zz.test.ts${bt} (thêm)

## Ngoài phạm vi
- ${bt}typing-adventure/apps/web/src/lib/auth.ts${bt}
EOF
}

expect_fm() {
  local name=$1 dir=$2 want=$3 out rc
  out=$(cd "$tmp" && GH_STUB_DIR="$dir" PATH="$tmp/bin:$PATH" bash "$fmap" 5 2>&1)
  rc=$?
  if [ "$rc" = "0" ] && [ "$out" = "$want" ]; then
    ok "feature-map $name: $out"
  else
    ko "feature-map $name: expected '$want', got exit $rc '$out'"
  fi
}

d=$(fm_case fm-clean)
spec_zz > "$d/contents/specs_ZZ_spec.md"
view_json "$d" '[{"name":"checks","status":"COMPLETED","conclusion":"SUCCESS"},{"name":"guard","status":"COMPLETED","conclusion":"SUCCESS"},{"name":"checks","status":"COMPLETED","conclusion":"SKIPPED"}]'
files_json "$d" added=specs/ZZ/spec.md added=typing-adventure/packages/game-engine/src/zz.ts added=typing-adventure/packages/game-engine/src/__tests__/zz.test.ts added=docs/ai-levelup/learner/L08-autonomous/issue-4.md
cat > "$d/diff.patch" <<'EOF'
diff --git a/typing-adventure/packages/game-engine/src/__tests__/zz.test.ts b/typing-adventure/packages/game-engine/src/__tests__/zz.test.ts
+++ b/typing-adventure/packages/game-engine/src/__tests__/zz.test.ts
@@ -0,0 +1,2 @@
+it('ZZ-01: a', () => {})
+it('ZZ-02: c', () => {})
EOF
expect_fm "all IDs cited, no deviation" "$d" "| #5 | specs/ZZ/spec.md | 2/2 | standard | checks:success, guard:success |  |"

d=$(fm_case fm-drift)
spec_zz > "$d/contents/specs_ZZ_spec.md"
view_json "$d" '[{"name":"checks","status":"COMPLETED","conclusion":"SUCCESS"},{"name":"checks","status":"COMPLETED","conclusion":"FAILURE"},{"name":"guard","status":"IN_PROGRESS","conclusion":null}]'
files_json "$d" modified=specs/WP/spec.md added=specs/ZZ/spec.md added=typing-adventure/packages/game-engine/src/zz.ts added=typing-adventure/packages/game-engine/src/__tests__/zz.test.ts modified=.github/workflows/ci.yml modified=typing-adventure/apps/web/src/lib/auth.ts
cat > "$d/diff.patch" <<'EOF'
+++ b/typing-adventure/packages/game-engine/src/zz.ts
+export const note = 'ZZ-02'
+++ b/typing-adventure/packages/game-engine/src/__tests__/zz.test.ts
+it('ZZ-01: a', () => {})
 it('ZZ-02: context line is not an added line', () => {})
EOF
expect_fm "uncited ID, out-of-scope files, failing and pending checks" "$d" \
  "| #5 | specs/ZZ/spec.md | 1/2 | high | checks:failure, guard:pending | ${bt}.github/workflows/ci.yml${bt}, ${bt}typing-adventure/apps/web/src/lib/auth.ts${bt} |"

d=$(fm_case fm-plan)
cat > "$d/contents/docs_plans_rule-await.md" <<EOF
# Plan: rule

Trạng thái: approved (issue #6)

## File thay đổi (dự đoán)
- ${bt}.claude/rules/game-engine.md${bt} (sửa)
- ${bt}typing-adventure/packages/game-engine/src/__tests__/little-content.test.ts${bt} (thêm)

## Verify
- ${bt}README.md${bt}
EOF
view_json "$d" '[]'
files_json "$d" added=docs/plans/rule-await.md modified=.claude/rules/game-engine.md added=typing-adventure/packages/game-engine/src/__tests__/little-content.test.ts modified=README.md
printf '+++ b/x\n+y\n' > "$d/diff.patch"
expect_fm "chore plan: criteria n/a, file outside plan list" "$d" "| #5 | docs/plans/rule-await.md | n/a | high | no checks | ${bt}README.md${bt} |"

d=$(fm_case fm-sigpipe)
spec_zz > "$d/contents/specs_ZZ_spec.md"
view_json "$d" '[{"name":"checks","status":"COMPLETED","conclusion":"SUCCESS"}]'
many=(added=specs/ZZ/spec.md added=typing-adventure/packages/game-engine/src/zz.ts added=typing-adventure/packages/game-engine/src/__tests__/zz.test.ts)
for i in $(seq 1 3000); do
  many+=("added=docs/ai-levelup/learner/L08-autonomous/many/notes-$i-padding-padding-padding.md")
done
files_json "$d" "${many[@]}"
printf '+++ b/typing-adventure/packages/game-engine/src/__tests__/zz.test.ts\n+ZZ-01 ZZ-02\n' > "$d/diff.patch"
out=$( (trap '' PIPE; cd "$tmp" && GH_STUB_DIR="$d" PATH="$tmp/bin:$PATH" bash "$fmap" 5) 2>"$tmp/sigpipe.err")
rc=$?
want="| #5 | specs/ZZ/spec.md | 2/2 | standard | checks:success |  |"
if [ "$rc" = "0" ] && [ "$out" = "$want" ] && [ ! -s "$tmp/sigpipe.err" ]; then
  ok "feature-map with SIGPIPE ignored and 3003 files: no broken pipe on stderr"
else
  ko "feature-map with SIGPIPE ignored: exit $rc '$out' stderr: $(sed -n '1,3p' "$tmp/sigpipe.err")"
fi

d=$(fm_case fm-gh-down)
out=$(cd "$tmp" && GH_STUB_DIR="$d" PATH="$tmp/bin:$PATH" bash "$fmap" 5 2>&1)
rc=$?
if [ "$rc" = "1" ] && grep -q "cannot read PR #5" <<< "$out"; then ok "feature-map gh failure: exit 1"; else ko "feature-map gh failure: got exit $rc '$out'"; fi

out=$(bash "$fmap" 'x; rm -rf /' 2>&1)
rc=$?
if [ "$rc" = "2" ]; then ok "feature-map bad PR number: exit 2"; else ko "feature-map bad PR number: got exit $rc '$out'"; fi

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
