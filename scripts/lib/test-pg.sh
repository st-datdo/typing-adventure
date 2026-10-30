#!/usr/bin/env bash
set -uo pipefail

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/pg.sh"

tmp=$(mktemp -d "${TMPDIR:-/tmp}/pgtest.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin"
cat > "$tmp/bin/psql" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$@" > "$PG_STUB_OUT/argv"
ps -o args= -p "$$" > "$PG_STUB_OUT/ps-self"
ps -o args= -p "$PPID" > "$PG_STUB_OUT/ps-parent"
printf '%s' "$PGPASSWORD" > "$PG_STUB_OUT/password"
printf '%s' "${PGSSLMODE:-}" > "$PG_STUB_OUT/sslmode"
STUB
chmod +x "$tmp/bin/psql"
export PG_STUB_OUT="$tmp"

pass=0
fail=0
ok() { echo "PASS $1"; pass=$((pass + 1)); }
ko() { echo "FAIL $1"; fail=$((fail + 1)); }
check() {
  local name=$1
  shift
  if "$@"; then ok "$name"; else ko "$name"; fi
}
has_lines() {
  local f=$1 l
  shift
  for l in "$@"; do grep -qxF -- "$l" "$f" || return 1; done
}

run() {
  local url=$1
  printf 'DATABASE_URL="%s"\n' "$url" > "$tmp/env"
  rm -f "$tmp/argv" "$tmp/password" "$tmp/ps-self" "$tmp/ps-parent" "$tmp/sslmode"
  PATH="$tmp/bin:$PATH" pg_exec "$tmp/env" "select 1"
}

same_bytes() {
  local name=$1 expected=$2 got
  got=$(od -c < "$tmp/password")
  if [ "$got" = "$(printf '%s' "$expected" | od -c)" ]; then
    ok "$name"
    printf '%s\n' "$got" | sed 's/^/    /'
  else
    ko "$name: got $got"
  fi
}

no_secret_in_argv() {
  local name=$1 needle=$2
  if grep -qF -- "$needle" "$tmp/argv" "$tmp/ps-self" "$tmp/ps-parent"; then
    ko "$name: password found in argv"
  else
    ok "$name"
  fi
}

run 'postgresql://dev:S3cr\nT%5Cz%40q@localhost:5432/typing_adventure?schema=wt_a&sslmode=require'
same_bytes 'literal \n kept as backslash + n, %5C -> \, %40 -> @' 'S3cr\nT\z@q'
no_secret_in_argv 'stub psql argv / ps args have no password (raw)' 'S3cr'
check "sslmode -> PGSSLMODE" [ "$(cat "$tmp/sslmode")" = "require" ]
check "user/db passed as -U/-d" has_lines "$tmp/argv" -U dev -d typing_adventure

run 'postgresql://us%65r:tab%09and\tslash%2F@127.0.0.1/db%2Dx'
same_bytes '%09 -> TAB byte, literal \t kept, %2F -> /' "$(printf 'tab\tand')\\tslash/"
check "user and db are url-decoded" has_lines "$tmp/argv" user db-x
no_secret_in_argv 'no password in argv (case 2)' 'and\tslash'

if PATH="$tmp/bin:$PATH" pg_exec /dev/null "select 1"; then ko "missing DATABASE_URL returns non-zero"; else ok "missing DATABASE_URL returns non-zero"; fi

bs=$(printf '%s' '\\x' | cut -c1)
check "urldecode keeps double backslash" [ "$(urldecode "a${bs}${bs}b%5C%5c")" = "a${bs}${bs}b${bs}${bs}" ]

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
