#!/usr/bin/env bash
set -uo pipefail

ready_label="agent-ready"
max_open=3
sections=("Loại" "Spec ID" "Criteria (EARS)" "File dự kiến" "Ngoài phạm vi" "Risk" "Cách verify")

usage() {
  echo "usage: ready-gate.sh <issue-number>" >&2
  exit 2
}

[ "$#" = "1" ] || usage
issue=$1
[[ "$issue" =~ ^[1-9][0-9]*$ ]] || usage

for bin in gh jq awk; do
  command -v "$bin" >/dev/null 2>&1 || { echo "ready-gate: $bin not found" >&2; exit 2; }
done

failed=0
report() {
  local k=$1 name=$2 ok=$3 why=$4
  if [ "$ok" = "1" ]; then
    printf 'gate[%s] %s: PASS %s\n' "$k" "$name" "$why"
  else
    printf 'gate[%s] %s: FAIL %s\n' "$k" "$name" "$why"
    failed=1
  fi
}

issue_json=$(gh issue view "$issue" --json number,state,labels,body 2>/dev/null) || issue_json=""
readable=1
if [ -z "$issue_json" ] || ! printf '%s' "$issue_json" | jq -e 'type == "object"' >/dev/null 2>&1; then
  readable=0
  issue_json='{}'
fi

state=$(printf '%s' "$issue_json" | jq -r '.state // ""')
has_label=$(printf '%s' "$issue_json" | jq -r --arg l "$ready_label" '[.labels[]?.name] | index($l) != null')

owner=$(gh repo view --json owner 2>/dev/null | jq -r '.owner.login // empty' 2>/dev/null)
labeler=""
if timeline=$(gh api "repos/{owner}/{repo}/issues/$issue/timeline" --paginate 2>/dev/null); then
  labeler=$(printf '%s' "$timeline" | jq -rs --arg l "$ready_label" \
    '[add // [] | .[] | select(.event == "labeled" and .label.name == $l) | .actor.login] | last // empty' 2>/dev/null)
fi

if [ "$readable" = "0" ]; then
  report 1 "label+owner" 0 "(cannot read issue #$issue)"
elif [ "$state" != "OPEN" ]; then
  report 1 "label+owner" 0 "(issue state is ${state:-unknown}, must be OPEN)"
elif [ "$has_label" != "true" ]; then
  report 1 "label+owner" 0 "(label $ready_label missing)"
elif [ -z "$owner" ]; then
  report 1 "label+owner" 0 "(cannot resolve repository owner)"
elif [ -z "$labeler" ]; then
  report 1 "label+owner" 0 "(no 'labeled $ready_label' event in timeline)"
elif [ "$labeler" != "$owner" ]; then
  report 1 "label+owner" 0 "(latest $ready_label labeled by $labeler, owner is $owner)"
else
  report 1 "label+owner" 1 "(open, $ready_label labeled by owner $owner)"
fi

if prs=$(gh pr list --state open --limit 200 --json number,headRefName 2>/dev/null) &&
  open_agent=$(printf '%s' "$prs" | jq -r '[.[] | select(.headRefName | startswith("agent/"))] | length' 2>/dev/null); then
  if [ "$open_agent" -lt "$max_open" ]; then
    report 2 "open agent PRs < $max_open" 1 "($open_agent open)"
  else
    report 2 "open agent PRs < $max_open" 0 "($open_agent open agent/* PRs, limit $max_open)"
  fi
else
  report 2 "open agent PRs < $max_open" 0 "(cannot list open PRs)"
fi

missing=()
for s in "${sections[@]}"; do
  value=$(printf '%s' "$issue_json" | jq -r '.body // ""' | tr -d '\r' | awk -v want="### $s" '
    { line = $0; sub(/[ \t]+$/, "", line) }
    line ~ /^### / { inside = (line == want); if (inside) found = 1; next }
    inside && line != "" && line != "_No response_" && line !~ /^```/ { has = 1 }
    END { if (found && has) print "ok" }
  ')
  [ "$value" = "ok" ] || missing+=("$s")
done
if [ "$readable" = "0" ]; then
  report 3 "template sections" 0 "(cannot read issue body)"
elif [ "${#missing[@]}" = "0" ]; then
  report 3 "template sections" 1 "(${#sections[@]}/${#sections[@]})"
else
  report 3 "template sections" 0 "(missing or empty: $(printf '%s; ' "${missing[@]}" | sed 's/; $//'))"
fi

if [ "$failed" = "0" ]; then
  echo "ready-gate: OK issue #$issue"
else
  echo "ready-gate: FAIL issue #$issue"
fi
exit "$failed"
