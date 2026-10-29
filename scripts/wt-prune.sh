#!/usr/bin/env bash
set -euo pipefail

refuse() { echo "wt-prune: REFUSED: $*" >&2; exit 1; }
usage() { echo "usage: wt-prune.sh <branch|path> [--into <ref>] [--dry-run]" >&2; exit 2; }

target=""
into="main"
dry_run=0
while [ $# -gt 0 ]; do
  case "$1" in
    --into) [ $# -ge 2 ] || usage; into="$2"; shift 2 ;;
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage ;;
    -*) echo "wt-prune: unknown option $1" >&2; usage ;;
    *) [ -z "$target" ] || usage; target="$1"; shift ;;
  esac
done
[ -n "$target" ] || usage

common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || refuse "not inside a git checkout"
main_root=$(cd "$common_dir/.." && pwd -P)
app_rel="typing-adventure"
env_files=(".env" "apps/web/.env" "packages/db/.env")

wt_path=""
branch=""
if [ -d "$target" ]; then
  wt_path=$(git -C "$target" rev-parse --show-toplevel 2>/dev/null) || refuse "$target is not inside a git worktree"
  wt_path=$(cd "$wt_path" && pwd -P)
fi

current_path=""
current_branch=""
found=0
while IFS= read -r line; do
  case "$line" in
    "worktree "*) current_path="${line#worktree }"; current_branch="" ;;
    "branch refs/heads/"*) current_branch="${line#branch refs/heads/}" ;;
    "")
      if [ -n "$current_path" ]; then
        resolved=$(cd "$current_path" 2>/dev/null && pwd -P || printf '%s' "$current_path")
        if { [ -n "$wt_path" ] && [ "$resolved" = "$wt_path" ]; } || { [ -z "$wt_path" ] && [ "$current_branch" = "$target" ]; }; then
          wt_path="$resolved"
          branch="$current_branch"
          found=1
        fi
      fi
      current_path=""
      current_branch=""
      ;;
  esac
done < <(git -C "$main_root" worktree list --porcelain; echo)

[ "$found" = "1" ] || refuse "no worktree found for '$target' (see: git worktree list)"
[ "$wt_path" != "$main_root" ] || refuse "$wt_path is the main checkout"
[ "$branch" != "main" ] || refuse "branch is main"
git -C "$main_root" rev-parse --verify --quiet "$into^{commit}" >/dev/null || refuse "--into ref not found: $into"

dirty=$(git -C "$wt_path" status --porcelain --untracked-files=all)
if [ -n "$dirty" ]; then
  echo "$dirty" | head -20 >&2
  refuse "worktree $wt_path has uncommitted or untracked files"
fi

schema_of() {
  awk '
    /^DATABASE_URL=/ {
      v = substr($0, 14)
      gsub(/^"|"$/, "", v)
      q = index(v, "?")
      if (q == 0) { print ""; exit }
      n = split(substr(v, q + 1), parts, "&")
      s = ""
      for (i = 1; i <= n; i++) if (parts[i] ~ /^schema=/) s = substr(parts[i], 8)
      print s
      exit
    }
  ' "$1"
}

schema=""
db_env=""
for f in "${env_files[@]}"; do
  file="$wt_path/$app_rel/$f"
  [ -f "$file" ] || continue
  grep -q '^DATABASE_URL=' "$file" || continue
  s=$(schema_of "$file")
  [ "$s" != "public" ] || refuse "$app_rel/$f points DATABASE_URL at schema public"
  [[ "$s" =~ ^wt_[a-z0-9_]{1,60}$ ]] || refuse "$app_rel/$f schema '${s:-<none>}' is not a wt_* schema"
  if [ -n "$schema" ] && [ "$s" != "$schema" ]; then
    refuse "env files disagree on schema ($schema vs $s)"
  fi
  schema="$s"
  db_env="$file"
done
if [ -f "$wt_path/.wt-env" ] && [ -n "$schema" ]; then
  wt_schema=$(sed -n 's/^WT_SCHEMA=//p' "$wt_path/.wt-env")
  [ -z "$wt_schema" ] || [ "$wt_schema" = "$schema" ] || refuse ".wt-env WT_SCHEMA=$wt_schema differs from env files ($schema)"
fi

branch_action="keep"
branch_reason=""
if [ -z "$branch" ]; then
  branch_reason="detached HEAD, no branch to delete"
elif git -C "$main_root" merge-base --is-ancestor "$branch" "$into"; then
  branch_action="delete"
  branch_reason="$branch is an ancestor of $into"
elif command -v gh >/dev/null 2>&1; then
  merged=$(cd "$main_root" && gh pr list --head "$branch" --state merged --json number --jq 'length' 2>/dev/null || true)
  if [ -n "$merged" ] && [ "$merged" != "0" ]; then
    branch_action="force-delete"
    branch_reason="$branch has a merged PR (squash merge)"
  elif [ -z "$merged" ]; then
    branch_reason="$branch is not merged into $into (gh pr list failed, squash merge not checked)"
  else
    branch_reason="$branch is not merged into $into and has no merged PR"
  fi
else
  branch_reason="$branch is not merged into $into (gh not installed, squash merge not checked)"
fi

echo "wt-prune plan:"
echo "  worktree: $wt_path (clean)"
echo "  branch:   ${branch:-<detached>} -> $branch_action ($branch_reason)"
if [ -n "$schema" ]; then
  echo "  schema:   $schema -> DROP SCHEMA IF EXISTS \"$schema\" CASCADE"
else
  echo "  schema:   <none> -> nothing to drop"
fi
if [ "$dry_run" = "1" ]; then
  echo "wt-prune: --dry-run, nothing changed"
  exit 0
fi

if [ -n "$schema" ]; then
  [[ "$schema" =~ ^wt_[a-z0-9_]{1,60}$ ]] || refuse "schema check failed"
  conn=$(awk '
    /^DATABASE_URL=/ {
      v = substr($0, 14)
      gsub(/^"|"$/, "", v)
      q = index(v, "?")
      if (q == 0) { print v; exit }
      base = substr(v, 1, q - 1)
      n = split(substr(v, q + 1), parts, "&")
      out = ""
      for (i = 1; i <= n; i++) {
        if (parts[i] == "" || parts[i] ~ /^(schema|connection_limit|pool_timeout|pgbouncer|statement_cache_size|socket_timeout)=/) continue
        out = out (out == "" ? "" : "&") parts[i]
      }
      print base (out == "" ? "" : "?" out)
      exit
    }
  ' "$db_env")
  psql "$conn" -v ON_ERROR_STOP=1 -qAt -c "DROP SCHEMA IF EXISTS \"$schema\" CASCADE" >/dev/null 2>&1 \
    || refuse "could not drop schema $schema (psql failed); worktree kept"
  echo "wt-prune: dropped schema $schema"
fi

git -C "$main_root" worktree remove "$wt_path"
echo "wt-prune: removed worktree $wt_path"

case "$branch_action" in
  delete) git -C "$main_root" branch -d "$branch" ;;
  force-delete) git -C "$main_root" branch -D "$branch" ;;
  keep) echo "wt-prune: kept branch ${branch:-<none>}: $branch_reason" ;;
esac
