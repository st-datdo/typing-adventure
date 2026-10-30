#!/usr/bin/env bash
set -uo pipefail

hooks_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
repo_root=$(git -C "$hooks_dir" rev-parse --show-toplevel)
web="$repo_root/typing-adventure/apps/web"

tmp=$(mktemp -d "${TMPDIR:-/tmp}/hooktest.XXXXXX")
probe_fmt="$web/src/hooktest-fmt-$$.ts"
probe_lint="$web/src/hooktest-lint-$$.ts"
cleanup() {
  rm -f "$probe_fmt" "$probe_lint"
  rm -rf "$tmp"
}
trap cleanup EXIT

make_fake_repo() {
  local dir=$1 url=$2
  mkdir -p "$dir/typing-adventure/packages/db"
  git -C "$dir" init -q
  if [ -n "$url" ]; then
    printf 'DATABASE_URL="%s"\n' "$url" > "$dir/typing-adventure/packages/db/.env"
  fi
}
remote_repo="$tmp/remote"
local_repo="$tmp/local"
empty_repo="$tmp/empty"
make_fake_repo "$remote_repo" "postgresql://app:fakepw@db.example.invalid:5432/prod"
make_fake_repo "$local_repo" "postgresql://dev:fakepw@localhost:5432/typing_adventure?schema=public"
make_fake_repo "$empty_repo" ""

pass=0
fail=0
allowed=0
leaks=0

run_case() {
  local name=$1 hook=$2 expect=$3 json=$4 rc out
  shift 4
  out=$(printf '%s' "$json" | env -u DATABASE_URL "$@" "$hooks_dir/$hook" 2>&1)
  rc=$?
  if printf '%s' "$out" | grep -qE '://|fakepw'; then
    leaks=$((leaks + 1))
    echo "FAIL [$hook] $name: output leaks a URL or password"
    fail=$((fail + 1))
    return
  fi
  if [ "$rc" = "$expect" ]; then
    echo "PASS [$hook] $name (exit $rc)"
    pass=$((pass + 1))
    [ "$expect" = "0" ] && allowed=$((allowed + 1))
  else
    echo "FAIL [$hook] $name: expected exit $expect, got $rc"
    [ -n "$out" ] && printf '%s\n' "$out" | sed 's/^/    /'
    fail=$((fail + 1))
  fi
}

bash_json() {
  jq -cn --arg c "$1" --arg d "${2:-$repo_root}" '{tool_name:"Bash", tool_input:{command:$c}, cwd:$d}'
}
read_json() {
  jq -cn --arg p "$1" '{tool_name:"Read", tool_input:{file_path:$p}, cwd:"/"}'
}
edit_json() {
  jq -cn --arg p "$1" '{tool_name:"Edit", tool_input:{file_path:$p}, cwd:"/"}'
}

G=guard-bash.sh
run_case "rm -rf" $G 2 "$(bash_json 'rm -rf /tmp/x')"
run_case "rm -fr" $G 2 "$(bash_json 'rm -fr build')"
run_case "rm -r -f" $G 2 "$(bash_json 'rm -r -f build')"
run_case "rm --recursive --force" $G 2 "$(bash_json 'rm --recursive --force build')"
run_case "sudo rm -Rf after &&" $G 2 "$(bash_json 'ls && sudo /bin/rm -Rf /')"
run_case "rm dir -rf (flags after operand)" $G 2 "$(bash_json 'rm node_modules -rf')"
run_case "backslash \\rm -rf" $G 2 "$(bash_json '\rm -rf x')"
run_case "command rm -rf" $G 2 "$(bash_json 'command rm -rf x')"
run_case "/bin/rm -rf" $G 2 "$(bash_json '/bin/rm -rf x')"
run_case "quoted \"rm\" -rf" $G 2 "$(bash_json '"rm" -rf x')"
run_case "split quotes r''m -rf" $G 2 "$(bash_json "r''m -rf x")"
run_case "git push --force" $G 2 "$(bash_json 'git push --force origin main')"
run_case "git push -f" $G 2 "$(bash_json 'git push -f')"
run_case "git push -uf cluster" $G 2 "$(bash_json 'git push -uf origin lesson/x')"
run_case "git push +refspec" $G 2 "$(bash_json 'git push origin +main')"
run_case "git push --force-with-lease" $G 2 "$(bash_json 'git -C repo push --force-with-lease origin lesson/x')"
run_case "inline remote DATABASE_URL db:migrate" $G 2 "$(bash_json 'DATABASE_URL=postgresql://u:fakepw@db.example.invalid:5432/x pnpm --filter @typing-adventure/db db:migrate' "$local_repo")"
run_case "remote .env prisma migrate deploy" $G 2 "$(bash_json 'pnpm --filter @typing-adventure/db exec prisma migrate deploy' "$remote_repo/typing-adventure")"
run_case "remote .env db:push" $G 2 "$(bash_json 'pnpm --filter @typing-adventure/db db:push' "$remote_repo")"
run_case "no readable DATABASE_URL" $G 2 "$(bash_json 'npx prisma db push' "$empty_repo")"
run_case "prisma db execute --url remote" $G 2 "$(bash_json 'npx prisma db execute --url "postgresql://u:fakepw@10.0.0.5/x" --file a.sql' "$local_repo")"
run_case "localhost URL with ?host= override" $G 2 "$(bash_json 'DATABASE_URL="postgresql://u:fakepw@localhost/x?host=db.example.invalid" npx prisma migrate reset' "$local_repo")"
run_case "remote DATABASE_URL in hook env" $G 2 "$(bash_json 'pnpm --filter @typing-adventure/db db:migrate' "$local_repo")" DATABASE_URL=postgresql://u:fakepw@db.example.invalid/x
run_case "allow: git push origin lesson/x" $G 0 "$(bash_json 'git push -u origin lesson/x')"
run_case "allow: rm file.txt" $G 0 "$(bash_json 'rm file.txt')"
run_case "allow: rm -r without force" $G 0 "$(bash_json 'rm -r build')"
run_case "allow: db:migrate with localhost .env" $G 0 "$(bash_json 'pnpm --filter @typing-adventure/db db:migrate' "$local_repo")"
run_case "allow: inline 127.0.0.1 prisma migrate dev" $G 0 "$(bash_json 'DATABASE_URL="postgresql://u:fakepw@127.0.0.1:5432/x?schema=wt_a&connect_timeout=5" npx prisma migrate dev' "$local_repo")"
run_case "allow: inline [::1] db push" $G 0 "$(bash_json 'DATABASE_URL=postgresql://u:fakepw@[::1]:5432/x npx prisma db push' "$local_repo")"
run_case "allow: git status" $G 0 "$(bash_json 'git status --short')"
run_case "find -delete" $G 2 "$(bash_json "find . -name '*.tmp' -delete")"
run_case "find -exec rm" $G 2 "$(bash_json 'find /tmp/x -type f -exec rm {} \;')"
run_case "find -execdir /bin/rm" $G 2 "$(bash_json 'cd build && find . -execdir /bin/rm {} +')"
run_case "eval" $G 2 "$(bash_json "eval \"\$CMD\"")"
run_case "eval after assignment" $G 2 "$(bash_json 'X=1 eval ls')"
run_case "eval in \$( )" $G 2 "$(bash_json "out=\$(eval ls)")"
run_case "bash -c nested eval" $G 2 "$(bash_json "bash -c 'eval ls'")"
run_case "zsh -lc nested eval with escaped quotes" $G 2 "$(bash_json 'zsh -lc "echo \"a\"; eval x"')"
run_case "sh -c nested git push --force" $G 2 "$(bash_json '/bin/sh -c "git push --force origin main"')"
run_case "cat .env" $G 2 "$(bash_json 'cat typing-adventure/.env')"
run_case "head .env.local" $G 2 "$(bash_json 'head -n 3 apps/web/.env.local')"
run_case "less < .env.production" $G 2 "$(bash_json 'less < .env.production')"
run_case "bash -c cat .env" $G 2 "$(bash_json "bash -c 'bat ../.env'")"
run_case "allow: cat .env.example" $G 0 "$(bash_json 'cat typing-adventure/.env.example')"
run_case "allow: find -name" $G 0 "$(bash_json "find . -name '*.ts'")"
run_case "allow: eval inside commit message" $G 0 "$(bash_json 'git commit -m "docs: explain eval rule"')"
run_case "allow: bash -c harmless" $G 0 "$(bash_json "bash -c 'ls -la'")"
run_case "gh issue edit --add-label agent-ready" $G 2 "$(bash_json 'gh issue edit 12 --add-label agent-ready')"
run_case "gh pr edit --add-label=config-change-approved" $G 2 "$(bash_json 'gh pr edit 13 --add-label=config-change-approved')"
run_case "gh issue edit label in comma list with space" $G 2 "$(bash_json 'gh issue edit 12 --add-label "bug, agent-ready"')"
run_case "gh -R repo pr edit, label upper case" $G 2 "$(bash_json 'gh -R o/r pr edit 13 --title x --add-label Config-Change-Approved')"
run_case "gh pr create --label config-change-approved" $G 2 "$(bash_json 'gh pr create --draft --base main -l config-change-approved')"
run_case "/usr/bin/gh issue edit after &&" $G 2 "$(bash_json 'git push -u origin agent/issue-1-x && /usr/bin/gh issue edit 1 --add-label agent-ready')"
run_case "bash -c nested gh pr edit --add-label" $G 2 "$(bash_json "bash -c 'gh pr edit 5 --add-label agent-ready'")"
run_case "gh label create" $G 2 "$(bash_json 'gh label create agent-ready --color 0e8a16')"
run_case "gh label edit" $G 2 "$(bash_json 'gh label edit agent-ready --name x')"
run_case "gh label delete" $G 2 "$(bash_json 'gh label delete config-change-approved --yes')"
run_case "gh api POST issue labels" $G 2 "$(bash_json "gh api repos/o/r/issues/1/labels -f 'labels[]=agent-ready'")"
run_case "allow: gh issue edit --add-label bug" $G 0 "$(bash_json 'gh issue edit 12 --add-label bug')"
run_case "allow: gh issue edit --remove-label agent-ready" $G 0 "$(bash_json 'gh issue edit 12 --remove-label agent-ready')"
run_case "allow: gh label list" $G 0 "$(bash_json 'gh label list --search agent')"
run_case "allow: gh pr list -l agent-ready" $G 0 "$(bash_json 'gh pr list -l agent-ready --state open')"
run_case "allow: gh api GET issue labels" $G 0 "$(bash_json 'gh api repos/o/r/issues/1/labels')"
run_case "allow: commit message mentions gh label create" $G 0 "$(bash_json 'git commit -m "docs: never gh label create"')"

R=guard-read.sh
run_case "read .env" $R 2 "$(read_json "$repo_root/typing-adventure/.env")"
run_case "read .env.local" $R 2 "$(read_json "$repo_root/typing-adventure/apps/web/.env.local")"
run_case "read .env.production" $R 2 "$(read_json "/srv/app/.env.production")"
run_case "allow: read .env.example" $R 0 "$(read_json "$repo_root/typing-adventure/.env.example")"
run_case "allow: read README" $R 0 "$(read_json "$repo_root/CLAUDE.md")"

F=format-lint.sh
run_case "out of scope file is silent" $F 0 "$(edit_json "$repo_root/docs/plans/_template.md")"
silent=$(edit_json "$repo_root/docs/plans/_template.md" | "$hooks_dir/$F" 2>&1)
if [ -z "$silent" ]; then
  echo "PASS [$F] out of scope file prints nothing"
  pass=$((pass + 1))
else
  echo "FAIL [$F] out of scope file printed output"
  fail=$((fail + 1))
fi
run_case "missing file" $F 0 "$(edit_json "$tmp/nope.ts")"
printf 'export const hookProbe = {a:1,\n    b:"x"}\n' > "$probe_fmt"
before=$(cksum < "$probe_fmt")
run_case "unformatted ts is formatted, exit 0" $F 0 "$(edit_json "$probe_fmt")"
after=$(cksum < "$probe_fmt")
if [ "$before" != "$after" ] && grep -q "b: 'x'" "$probe_fmt"; then
  echo "PASS [$F] prettier rewrote the file"
  pass=$((pass + 1))
else
  echo "FAIL [$F] prettier did not rewrite the file"
  fail=$((fail + 1))
fi
printf 'export function hookProbe() {\n  let a = 1\n  return a\n}\n' > "$probe_lint"
run_case "eslint error blocks (exit 2)" $F 2 "$(edit_json "$probe_lint")"

check() {
  local name=$1
  shift
  if "$@"; then
    echo "PASS $name"
    pass=$((pass + 1))
  else
    echo "FAIL $name"
    fail=$((fail + 1))
  fi
}

scope_repo="$tmp/scope"
noscope_repo="$tmp/noscope"
mkdir -p "$scope_repo/specs/S" "$scope_repo/tasks" "$scope_repo/src/lib" "$scope_repo/src/sub" "$noscope_repo"
git -C "$scope_repo" init -q
git -C "$noscope_repo" init -q
cat > "$scope_repo/specs/S/spec.md" <<'EOF'
# Spec: S
Trạng thái: approved
File dự kiến: `src/app/api/auth/[...nextauth]/route.ts` (sửa), `src/lib/*.ts`, `deep/**/x.ts`, `src/gen/`. Test: `src/__tests__/s.test.ts`.
Không liên quan: `src/outside.ts`
EOF
cat > "$scope_repo/tasks/plan.md" <<'EOF'
# Plan
## File thay đổi (dự đoán)
- `src/only-plan.ts` (thêm)
## Verify
- `src/not-in-section.ts`
EOF
printf 'specs/S/spec.md\n' > "$scope_repo/.wt-scope"

scope_json() {
  jq -cn --arg p "$1" --arg d "${2:-$scope_repo}" '{tool_name:"Edit", tool_input:{file_path:$p}, cwd:$d}'
}

S=guard-scope.sh
run_case "no scope allows any file" $S 0 "$(scope_json "$noscope_repo/src/any.ts" "$noscope_repo")" CLAUDE_SCOPE_FILE=
run_case "file listed in spec" $S 0 "$(scope_json "$scope_repo/src/app/api/auth/[...nextauth]/route.ts")" CLAUDE_SCOPE_FILE=
run_case "file listed on Test:" $S 0 "$(scope_json "$scope_repo/src/__tests__/s.test.ts")" CLAUDE_SCOPE_FILE=
run_case "glob * matches one level" $S 0 "$(scope_json "$scope_repo/src/lib/rate.ts")" CLAUDE_SCOPE_FILE=
run_case "glob * does not cross /" $S 2 "$(scope_json "$scope_repo/src/lib/a/rate.ts")" CLAUDE_SCOPE_FILE=
run_case "glob ** matches deep path" $S 0 "$(scope_json "$scope_repo/deep/a/b/x.ts")" CLAUDE_SCOPE_FILE=
run_case "directory entry ending in /" $S 0 "$(scope_json "$scope_repo/src/gen/a/b.ts")" CLAUDE_SCOPE_FILE=
run_case "brackets are literal, not a class" $S 2 "$(scope_json "$scope_repo/src/app/api/auth/n/route.ts")" CLAUDE_SCOPE_FILE=
run_case "file not listed" $S 2 "$(scope_json "$scope_repo/src/other.ts")" CLAUDE_SCOPE_FILE=
run_case "backtick outside File dự kiến line" $S 2 "$(scope_json "$scope_repo/src/outside.ts")" CLAUDE_SCOPE_FILE=
run_case "relative path from cwd subdir" $S 2 "$(scope_json "other.ts" "$scope_repo/src/sub")" CLAUDE_SCOPE_FILE=
run_case "always allowed: specs/**" $S 0 "$(scope_json "$scope_repo/specs/x/spec.md")" CLAUDE_SCOPE_FILE=
run_case "always allowed: docs/ai-levelup/**" $S 0 "$(scope_json "$scope_repo/docs/ai-levelup/learner/L07/task-A.md")" CLAUDE_SCOPE_FILE=
run_case "always allowed: docs/plans/**" $S 0 "$(scope_json "$scope_repo/docs/plans/x.md")" CLAUDE_SCOPE_FILE=
run_case "always allowed: path outside repo" $S 0 "$(scope_json "$tmp/scratch/x.ts")" CLAUDE_SCOPE_FILE=
run_case "../ escapes the repo and comes back to an unlisted file" $S 2 "$(scope_json "$scope_repo/src/../../${scope_repo##*/}/src/other.ts")" CLAUDE_SCOPE_FILE=
run_case "../ inside the repo to an unlisted file" $S 2 "$(scope_json "$scope_repo/src/lib/../other.ts")" CLAUDE_SCOPE_FILE=
run_case "scope points to a missing file" $S 2 "$(scope_json "$scope_repo/src/lib/rate.ts")" CLAUDE_SCOPE_FILE=specs/NOPE/spec.md
run_case "CLAUDE_SCOPE_FILE wins over .wt-scope (plan allows)" $S 0 "$(scope_json "$scope_repo/src/only-plan.ts")" CLAUDE_SCOPE_FILE=tasks/plan.md
run_case "CLAUDE_SCOPE_FILE wins over .wt-scope (spec file blocked)" $S 2 "$(scope_json "$scope_repo/src/lib/rate.ts")" CLAUDE_SCOPE_FILE=tasks/plan.md
run_case "plan: backtick outside File thay đổi section" $S 2 "$(scope_json "$scope_repo/src/not-in-section.ts")" CLAUDE_SCOPE_FILE=tasks/plan.md
run_case "scope file itself is editable" $S 0 "$(scope_json "$scope_repo/tasks/plan.md")" CLAUDE_SCOPE_FILE="$scope_repo/tasks/plan.md"
scope_msg=$(scope_json "$scope_repo/src/other.ts" | env CLAUDE_SCOPE_FILE= "$hooks_dir/$S" 2>&1 >/dev/null)
check "[$S] block message names scope file and fix" grep -q 'specs/S/spec.md.*File dự kiến.*Lịch sử' <<< "$scope_msg"

stub_bin="$tmp/stub-bin"
no_osa_bin="$tmp/no-osa-bin"
mkdir -p "$stub_bin" "$no_osa_bin"
cat > "$stub_bin/osascript" <<EOF
#!/bin/sh
for a in "\$@"; do printf '%s\n' "\$a"; done > "$tmp/osa-argv"
EOF
chmod +x "$stub_bin/osascript"
for b in jq git dirname; do ln -s "$(command -v "$b")" "$no_osa_bin/$b"; done
jq_dir=$(dirname "$(command -v jq)")
notify_log="$tmp/notify.log"
N=notify.sh
evil='He said "hi" \ then; do shell script "touch /tmp/pwn"'

run_notify() {
  local json=$1 path=$2
  printf '%s' "$json" | env CLAUDE_NOTIFY_LOG="$notify_log" PATH="$path" "$hooks_dir/$N" 2>/dev/null
}
log_lines() { if [ -f "$notify_log" ]; then wc -l < "$notify_log" | tr -d ' '; else echo 0; fi; }
argv_has_line() { grep -qxF -- "$1" "$tmp/osa-argv"; }
no_payload_in_e() { ! awk 'p=="-e" && /touch \/tmp\/pwn/ {f=1} {p=$0} END {exit !f}' "$tmp/osa-argv"; }

evil_json=$(jq -cn --arg m "$evil" --arg d "$scope_repo" '{hook_event_name:"Notification", message:$m, cwd:$d}')
scope_branch=$(git -C "$scope_repo" symbolic-ref --short HEAD)
out=$(run_notify "$evil_json" "$stub_bin:$jq_dir:/usr/bin:/bin"); rc=$?
check "[$N] Notification exit 0" test "$rc" = 0
check "[$N] Notification stdout empty" test -z "$out"
check "[$N] message with quote, backslash, do shell script is one argv item" argv_has_line "$evil"
check "[$N] title has branch and event" argv_has_line "Claude · $scope_branch · Notification"
check "[$N] payload is not inside an -e script" no_payload_in_e
check "[$N] log line has event and message" grep -qF "Notification	$scope_branch	He said" "$notify_log"

before=$(log_lines)
out=$(run_notify "{\"hook_event_name\":\"Stop\",\"cwd\":\"$scope_repo\"}" "$no_osa_bin:/bin"); rc=$?
after=$(log_lines)
check "[$N] no osascript on PATH: exit 0, stdout empty" test "$rc:$out" = "0:"
check "[$N] no osascript on PATH: log gets a new line" test "$after" = "$((before + 1))"

before=$(log_lines)
out=$(run_notify '{"hook_event_name": "Stop", broken' "$stub_bin:$jq_dir:/usr/bin:/bin"); rc=$?
after=$(log_lines)
check "[$N] broken JSON: exit 0, stdout empty" test "$rc:$out" = "0:"
check "[$N] broken JSON: log gets a new line" test "$after" = "$((before + 1))"

long=$(printf 'x%.0s' $(seq 1 500))
long_json=$(jq -cn --arg m "line1
$long" '{hook_event_name:"Notification", message:$m, cwd:"/"}')
run_notify "$long_json" "$stub_bin:$jq_dir:/usr/bin:/bin" >/dev/null
last=$(tail -n 1 "$notify_log")
check "[$N] log message cut to 200 chars, one line" test "${#last}" -lt 260 -a "$(log_lines)" = "$((after + 1))"

out=$(printf '{"hook_event_name":"Stop"}' | env CLAUDE_NOTIFY_LOG=/dev/null/nope/notify.log PATH="$stub_bin:$jq_dir:/usr/bin:/bin" "$hooks_dir/$N" 2>/dev/null); rc=$?
check "[$N] unwritable log: exit 0, stdout empty" test "$rc:$out" = "0:"

total=$((pass + fail))
echo "---"
echo "cases: $total, passed: $pass, failed: $fail, allow-cases passed: $allowed, leaks: $leaks"
[ "$fail" = "0" ]
