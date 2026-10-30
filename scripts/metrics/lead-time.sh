#!/usr/bin/env bash
set -uo pipefail

usage() {
  echo "usage: lead-time.sh <pr-number> <spec-path>" >&2
  exit 2
}

[ "$#" = "2" ] || usage
pr=$1
spec=${2#./}
[[ "$pr" =~ ^[0-9]+$ ]] || usage
[ -n "$spec" ] || usage

for bin in gh jq git; do
  command -v "$bin" >/dev/null 2>&1 || { echo "lead-time: $bin not found" >&2; exit 2; }
done

die() {
  echo "lead-time: $*" >&2
  exit 1
}

spec_at() {
  local sha=$1 body
  if git cat-file -e "$sha:$spec" 2>/dev/null; then
    git show "$sha:$spec"
    return
  fi
  body=$(gh api "repos/{owner}/{repo}/contents/$spec?ref=$sha" 2>/dev/null) || return 1
  printf '%s' "$body" | jq -r '.content // empty' | tr -d '\n' | base64 --decode 2>/dev/null
}

commits=$(gh api "repos/{owner}/{repo}/pulls/$pr/commits" --paginate) || die "cannot list commits of PR #$pr"
list=$(printf '%s' "$commits" | jq -rs 'add // [] | .[] | [.sha, .commit.author.date] | @tsv') || die "unexpected commits payload for PR #$pr"

start=""
start_sha=""
while IFS=$'\t' read -r sha date; do
  [ -n "$sha" ] || continue
  if spec_at "$sha" | grep -qE '^Trạng thái:[[:space:]]*approved'; then
    start=$date
    start_sha=$sha
    break
  fi
done <<< "$list"
[ -n "$start" ] || die "no commit of PR #$pr has $spec with 'Trạng thái: approved'"

timeline=$(gh api "repos/{owner}/{repo}/issues/$pr/timeline" --paginate) || die "cannot read timeline of PR #$pr"
ready=$(printf '%s' "$timeline" | jq -rs '[add // [] | .[] | select(.event == "ready_for_review") | .created_at] | last // empty')
merged=$(printf '%s' "$timeline" | jq -rs '[add // [] | .[] | select(.event == "merged") | .created_at] | last // empty')
if [ -z "$merged" ]; then
  merged=$(gh pr view "$pr" --json mergedAt 2>/dev/null | jq -r '.mergedAt // empty' 2>/dev/null)
fi
[ -n "$merged" ] || die "PR #$pr is not merged yet; lead time needs mergedAt"

epoch() {
  jq -rn --arg t "$1" '$t | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601'
}

fmt() {
  local s=$1
  [ "$s" -ge 0 ] || { printf 'n/a'; return; }
  printf '%dm%02ds' $((s / 60)) $((s % 60))
}

m=$(epoch "$merged") || die "bad merged time '$merged'"
s=$(epoch "$start") || die "bad commit time '$start'"
lead=$(fmt $((m - s)))
wait=n/a
if [ -n "$ready" ]; then
  r=$(epoch "$ready") || die "bad ready_for_review time '$ready'"
  wait=$(fmt $((m - r)))
fi

echo "spec approved in ${start_sha:0:8} at $start, ready ${ready:-none}, merged $merged" >&2
echo "lead=$lead wait=$wait"
