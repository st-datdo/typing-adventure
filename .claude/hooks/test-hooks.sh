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

total=$((pass + fail))
echo "---"
echo "cases: $total, passed: $pass, failed: $fail, allow-cases passed: $allowed, leaks: $leaks"
[ "$fail" = "0" ]
