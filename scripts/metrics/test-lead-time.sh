#!/usr/bin/env bash
set -uo pipefail

script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lead-time.sh"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/leadtime.XXXXXX")
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
d=${GH_STUB_DIR:?}
case "$1 $2" in
  "pr view")
    cat "$d/pr.json"
    ;;
  api\ *)
    case "$2" in
      */pulls/*/commits) cat "$d/commits.json" ;;
      */issues/*/timeline) cat "$d/timeline.json" ;;
      */contents/*)
        sha=${2##*ref=}
        [ -f "$d/contents/$sha" ] || { echo '{"message":"Not Found"}'; exit 1; }
        printf '{"content":"%s"}' "$(base64 < "$d/contents/$sha" | tr -d '\n')"
        ;;
      *) exit 1 ;;
    esac
    ;;
  *) exit 1 ;;
esac
EOF
chmod +x "$tmp/bin/gh"

pass=0
fail=0

new_case() {
  local d="$tmp/$1"
  mkdir -p "$d/contents"
  printf '{"mergedAt":null}\n' > "$d/pr.json"
  printf '%s' "$d"
}

commit_json() {
  local sep="" sha date out="["
  for pair in "$@"; do
    sha=${pair%%=*}
    date=${pair#*=}
    out="$out$sep{\"sha\":\"$sha\",\"commit\":{\"author\":{\"date\":\"$date\"}}}"
    sep=","
  done
  printf '%s]' "$out"
}

spec_body() {
  printf '# Spec\n\nTrạng thái: %s\n' "$1"
}

run() {
  local name=$1 dir=$2 want_rc=$3 want_out=$4 out rc
  shift 4
  out=$(cd "$tmp" && GH_STUB_DIR="$dir" PATH="$tmp/bin:$PATH" "$script" "$@" 2>"$tmp/err")
  rc=$?
  if [ "$rc" = "$want_rc" ] && { [ -z "$want_out" ] || [ "$out" = "$want_out" ] || grep -qF "$want_out" "$tmp/err"; }; then
    echo "PASS $name (exit $rc) ${out:-$(head -n 1 "$tmp/err")}"
    pass=$((pass + 1))
  else
    echo "FAIL $name: expected exit $want_rc and '$want_out', got exit $rc stdout '$out' stderr '$(cat "$tmp/err")'"
    fail=$((fail + 1))
  fi
}

d=$(new_case normal)
commit_json a1=2026-10-30T02:35:21Z a2=2026-10-30T02:38:00Z a3=2026-10-30T02:40:18Z a4=2026-10-30T02:41:18Z > "$d/commits.json"
spec_body draft > "$d/contents/a2"
spec_body approved > "$d/contents/a3"
spec_body approved > "$d/contents/a4"
printf '[{"event":"committed"},{"event":"ready_for_review","created_at":"2026-10-30T03:17:59Z"}]\n[{"event":"merged","created_at":"2026-10-30T03:34:21Z"}]\n' > "$d/timeline.json"
run "first approved commit, paginated timeline" "$d" 0 "lead=54m03s wait=16m22s" 9 specs/RL/spec.md

d=$(new_case multi-ready)
commit_json b1=2026-10-30T10:00:00Z > "$d/commits.json"
spec_body approved > "$d/contents/b1"
printf '[{"event":"ready_for_review","created_at":"2026-10-30T10:10:00Z"},{"event":"convert_to_draft","created_at":"2026-10-30T10:12:00Z"},{"event":"ready_for_review","created_at":"2026-10-30T10:20:00Z"},{"event":"merged","created_at":"2026-10-30T10:30:05Z"}]\n' > "$d/timeline.json"
run "several ready_for_review: last one counts" "$d" 0 "lead=30m05s wait=10m05s" 12 specs/X/spec.md

d=$(new_case not-merged)
commit_json c1=2026-10-30T10:00:00Z > "$d/commits.json"
spec_body approved > "$d/contents/c1"
printf '[{"event":"ready_for_review","created_at":"2026-10-30T10:10:00Z"}]\n' > "$d/timeline.json"
run "not merged: exit 1 with message" "$d" 1 "is not merged yet" 13 specs/X/spec.md

d=$(new_case fallback)
commit_json e1=2026-10-30T09:00:00Z > "$d/commits.json"
spec_body approved > "$d/contents/e1"
printf '[]\n' > "$d/timeline.json"
printf '{"mergedAt":"2026-10-30T10:05:09Z"}\n' > "$d/pr.json"
run "merged from gh pr view, no ready: wait n/a" "$d" 0 "lead=65m09s wait=n/a" 14 specs/X/spec.md

d=$(new_case never-approved)
commit_json f1=2026-10-30T09:00:00Z > "$d/commits.json"
spec_body draft > "$d/contents/f1"
printf '[{"event":"merged","created_at":"2026-10-30T10:00:00Z"}]\n' > "$d/timeline.json"
run "spec never approved: exit 1" "$d" 1 "Trạng thái: approved" 15 specs/X/spec.md

d=$(new_case local-git)
repo="$tmp/local-git"
g() { git -C "$repo" -c user.name=t -c user.email=t@example.invalid -c commit.gpgsign=false "$@"; }
mkdir -p "$repo/specs/L"
git init -q "$repo"
spec_body draft > "$repo/specs/L/spec.md"
g add . && g commit -qm draft
sha1=$(g rev-parse HEAD)
spec_body approved > "$repo/specs/L/spec.md"
g commit -qam approved
sha2=$(g rev-parse HEAD)
commit_json "$sha1=2026-10-30T08:00:00Z" "$sha2=2026-10-30T08:01:00Z" > "$d/commits.json"
printf '[{"event":"ready_for_review","created_at":"2026-10-30T08:30:00Z"},{"event":"merged","created_at":"2026-10-30T08:45:30Z"}]\n' > "$d/timeline.json"
out=$(cd "$repo" && GH_STUB_DIR="$d" PATH="$tmp/bin:$PATH" "$script" 16 specs/L/spec.md 2>/dev/null)
if [ "$out" = "lead=44m30s wait=15m30s" ]; then
  echo "PASS spec read from local git objects (exit 0) $out"
  pass=$((pass + 1))
else
  echo "FAIL spec read from local git objects: got '$out'"
  fail=$((fail + 1))
fi

run "bad arguments: exit 2" "$tmp" 2 "usage:" abc
run "missing spec argument: exit 2" "$tmp" 2 "usage:" 9

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
