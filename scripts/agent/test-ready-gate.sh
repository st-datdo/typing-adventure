#!/usr/bin/env bash
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
script="$here/ready-gate.sh"
template="$here/../../.github/ISSUE_TEMPLATE/agent-task.yml"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/readygate.XXXXXX")
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
d=${GH_STUB_DIR:?}
printf '%s\n' "$*" >> "$d/calls.log"
case "$1 $2" in
  "issue view") cat "$d/issue.json" ;;
  "repo view") cat "$d/repo.json" ;;
  "pr list") cat "$d/prs.json" ;;
  api\ *)
    case "$2" in
      */issues/*/timeline) cat "$d/timeline.json" ;;
      *) exit 1 ;;
    esac
    ;;
  *) exit 1 ;;
esac
EOF
chmod +x "$tmp/bin/gh"

pass=0
fail=0
bt=$'\x60'
fence="$bt$bt$bt"
dl=$'\x24'

full_body() {
  printf '### Loại\n\nfeature → spec\n\n### Spec ID\n\nWX\n\n### Criteria (EARS)\n\nWX-01: WHEN a THE SYSTEM SHALL b\n\n'
  printf '### File dự kiến\n\ntyping-adventure/packages/game-engine/src/moderation.ts\n\n### Ngoài phạm vi\n\nTR39 đầy đủ\n\n'
  printf '### Risk\n\nstandard\n\n### Cách verify\n\n%sbash\npnpm test\n%s\n' "$fence" "$fence"
}

new_case() {
  local d="$tmp/$1"
  mkdir -p "$d"
  : > "$d/calls.log"
  printf '{"owner":{"login":"st-datdo"}}\n' > "$d/repo.json"
  printf '[{"number":12,"headRefName":"lesson/L07-parallel"},{"number":20,"headRefName":"agent/issue-1-a"}]\n' > "$d/prs.json"
  printf '[{"event":"labeled","label":{"name":"agent-ready"},"actor":{"login":"st-datdo"}}]\n' > "$d/timeline.json"
  issue_json "$d" OPEN '["agent-ready"]' "$(full_body)"
  printf '%s' "$d"
}

issue_json() {
  local d=$1 state=$2 labels=$3 body=$4
  jq -n --arg s "$state" --argjson l "$labels" --arg b "$body" \
    '{number: 7, state: $s, labels: [$l[] | {name: .}], body: $b}' > "$d/issue.json"
}

run() {
  local name=$1 dir=$2 want_rc=$3 out rc
  shift 3
  out=$(cd "$tmp" && GH_STUB_DIR="$dir" PATH="$tmp/bin:$PATH" bash "$script" ${ARGS[@]+"${ARGS[@]}"} 2>&1)
  rc=$?
  local ok=1 p
  [ "$rc" = "$want_rc" ] || ok=0
  for p in "$@"; do
    grep -qF -- "$p" <<< "$out" || ok=0
  done
  if [ "$ok" = "1" ]; then
    echo "PASS $name (exit $rc) $(grep -E 'FAIL|usage' <<< "$out" | sed -n '1p')"
    pass=$((pass + 1))
  else
    echo "FAIL $name: expected exit $want_rc with [$*], got exit $rc:"
    printf '%s\n' "$out" | sed 's/^/    /'
    fail=$((fail + 1))
  fi
}

ARGS=(7)

d=$(new_case ok)
run "all 3 conditions met" "$d" 0 "gate[1] label+owner: PASS" "gate[2] open agent PRs < 3: PASS (1 open)" "gate[3] template sections: PASS (7/7)" "ready-gate: OK issue #7"

d=$(new_case no-label)
issue_json "$d" OPEN '["bug"]' "$(full_body)"
run "label agent-ready missing" "$d" 1 "gate[1] label+owner: FAIL (label agent-ready missing)" "gate[2] open agent PRs < 3: PASS" "gate[3] template sections: PASS"

d=$(new_case not-owner)
printf '[{"event":"labeled","label":{"name":"agent-ready"},"actor":{"login":"github-actions[bot]"}}]\n' > "$d/timeline.json"
run "labeler is not the owner" "$d" 1 "gate[1] label+owner: FAIL (latest agent-ready labeled by github-actions[bot], owner is st-datdo)"

d=$(new_case relabeled)
printf '[{"event":"labeled","label":{"name":"agent-ready"},"actor":{"login":"st-datdo"}},{"event":"unlabeled","label":{"name":"agent-ready"},"actor":{"login":"st-datdo"}}]\n[{"event":"labeled","label":{"name":"agent-ready"},"actor":{"login":"mallory"}},{"event":"labeled","label":{"name":"bug"},"actor":{"login":"st-datdo"}}]\n' > "$d/timeline.json"
run "latest agent-ready label (paginated) by non-owner wins" "$d" 1 "labeled by mallory, owner is st-datdo"

d=$(new_case no-event)
printf '[{"event":"labeled","label":{"name":"bug"},"actor":{"login":"st-datdo"}}]\n' > "$d/timeline.json"
run "label present but no labeled event" "$d" 1 "gate[1] label+owner: FAIL (no 'labeled agent-ready' event in timeline)"

d=$(new_case three-prs)
printf '[{"number":20,"headRefName":"agent/issue-1-a"},{"number":21,"headRefName":"agent/issue-2-b"},{"number":22,"headRefName":"agent/issue-3-c"},{"number":12,"headRefName":"lesson/L07-parallel"}]\n' > "$d/prs.json"
run "3 open agent/* PRs" "$d" 1 "gate[1] label+owner: PASS" "gate[2] open agent PRs < 3: FAIL (3 open agent/* PRs, limit 3)" "gate[3] template sections: PASS"

d=$(new_case two-prs)
printf '[{"number":20,"headRefName":"agent/issue-1-a"},{"number":21,"headRefName":"agent/issue-2-b"},{"number":23,"headRefName":"fix/agent/x"}]\n' > "$d/prs.json"
run "2 agent/* PRs plus non-agent heads" "$d" 0 "gate[2] open agent PRs < 3: PASS (2 open)"

d=$(new_case missing-section)
issue_json "$d" OPEN '["agent-ready"]' "$(full_body | awk '/^### File dự kiến/ { skip = 1; next } /^### / { skip = 0 } !skip')"
run "template section File dự kiến missing" "$d" 1 "gate[3] template sections: FAIL (missing or empty: File dự kiến)" "gate[1] label+owner: PASS"

d=$(new_case empty-section)
issue_json "$d" OPEN '["agent-ready"]' "$(full_body | sed 's/^TR39 đầy đủ$/_No response_/' | sed 's/^pnpm test$//')"
run "empty sections (_No response_, empty code block)" "$d" 1 "missing or empty: Ngoài phạm vi; Cách verify"

d=$(new_case closed)
issue_json "$d" CLOSED '["agent-ready"]' "$(full_body)"
run "issue closed" "$d" 1 "gate[1] label+owner: FAIL (issue state is CLOSED, must be OPEN)"

d=$(new_case all-fail)
issue_json "$d" OPEN '[]' "no template"
printf '[{"number":20,"headRefName":"agent/a"},{"number":21,"headRefName":"agent/b"},{"number":22,"headRefName":"agent/c"},{"number":24,"headRefName":"agent/d"}]\n' > "$d/prs.json"
run "every condition reported even when all fail" "$d" 1 "gate[1] label+owner: FAIL" "gate[2] open agent PRs < 3: FAIL (4 open" "gate[3] template sections: FAIL" "ready-gate: FAIL issue #7"

d=$(new_case injection)
payload="$(full_body)"$'\n\n'"<!-- ${dl}(touch $tmp/pwned) ${bt}touch $tmp/pwned2${bt} ; rm -rf / -->"$'\n### Risk\n\n'"${dl}(id)"$'\n'
issue_json "$d" OPEN '["agent-ready"]' "$payload"
run "body with shell payload is data" "$d" 0 "ready-gate: OK issue #7"
if [ -e "$tmp/pwned" ] || [ -e "$tmp/pwned2" ]; then
  echo "FAIL body payload was executed"
  fail=$((fail + 1))
else
  echo "PASS body payload not executed (no marker files)"
  pass=$((pass + 1))
fi

d=$(new_case gh-down)
rm "$d/issue.json"
run "gh cannot read the issue: other gates still reported" "$d" 1 "gate[1] label+owner: FAIL (cannot read issue #7)" "gate[2] open agent PRs < 3: PASS (1 open)" "gate[3] template sections: FAIL (cannot read issue body)" "ready-gate: FAIL issue #7"

d=$(new_case read-only)
run "only read-only gh calls" "$d" 0 "ready-gate: OK"
if grep -qvE '^(issue view|repo view|pr list|api repos/\{owner\}/\{repo\}/issues/7/timeline) ' "$d/calls.log"; then
  echo "FAIL unexpected gh call: $(grep -vE '^(issue view|repo view|pr list|api )' "$d/calls.log" | sed -n '1p')"
  fail=$((fail + 1))
else
  echo "PASS gh calls: $(cut -d' ' -f1-2 "$d/calls.log" | sort -u | tr '\n' ',' | sed 's/,$//')"
  pass=$((pass + 1))
fi

ARGS=(abc)
run "bad argument: exit 2" "$tmp" 2 "usage:"
ARGS=()
run "no argument: exit 2" "$tmp" 2 "usage:"

script_sections=$(sed -n 's/^sections=(\(.*\))$/\1/p' "$script" | grep -oE '"[^"]+"' | tr -d '"' | sort)
template_sections=$(grep -E '^      label: ' "$template" | sed 's/^      label: //' | sort)
if [ -n "$script_sections" ] && [ "$script_sections" = "$template_sections" ]; then
  echo "PASS gate sections match template labels ($(printf '%s\n' "$template_sections" | wc -l | tr -d ' '))"
  pass=$((pass + 1))
else
  echo "FAIL gate sections differ from template labels"
  diff <(printf '%s\n' "$script_sections") <(printf '%s\n' "$template_sections") | sed 's/^/    /'
  fail=$((fail + 1))
fi

if grep -nE '(^|[^[:alnum:]_])eval([^[:alnum:]_]|$)|\$\{?READY_GATE|SKIP' "$script"; then
  echo "FAIL ready-gate.sh has eval or a skip switch"
  fail=$((fail + 1))
else
  echo "PASS ready-gate.sh has no eval and no skip switch"
  pass=$((pass + 1))
fi

echo "---"
echo "cases: $((pass + fail)), passed: $pass, failed: $fail"
[ "$fail" = "0" ]
