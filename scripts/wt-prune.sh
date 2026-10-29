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
current_locked=0
locked=0
found=0
while IFS= read -r line; do
  case "$line" in
    "worktree "*) current_path="${line#worktree }"; current_branch=""; current_locked=0 ;;
    "branch refs/heads/"*) current_branch="${line#branch refs/heads/}" ;;
    locked|"locked "*) current_locked=1 ;;
    "")
      if [ -n "$current_path" ]; then
        resolved=$(cd "$current_path" 2>/dev/null && pwd -P || printf '%s' "$current_path")
        if { [ -n "$wt_path" ] && [ "$resolved" = "$wt_path" ]; } || { [ -z "$wt_path" ] && [ "$current_branch" = "$target" ]; }; then
          wt_path="$resolved"
          branch="$current_branch"
          locked="$current_locked"
          found=1
        fi
      fi
      current_path=""
      current_branch=""
      current_locked=0
      ;;
  esac
done < <(git -C "$main_root" worktree list --porcelain; echo)

[ "$found" = "1" ] || refuse "no worktree found for '$target' (see: git worktree list)"
[ "$wt_path" != "$main_root" ] || refuse "$wt_path is the main checkout"
[ "$branch" != "main" ] || refuse "branch is main"
[ "$locked" = "0" ] || refuse "worktree $wt_path is locked (git worktree unlock first)"
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

db_host_of() {
  awk '
    /^DATABASE_URL=/ {
      v = substr($0, 14)
      gsub(/^"|"$/, "", v)
      q = index(v, "?")
      query = (q == 0) ? "" : substr(v, q + 1)
      if (q > 0) v = substr(v, 1, q - 1)
      n = split(query, parts, "&")
      for (i = 1; i <= n; i++) if (parts[i] ~ /^(host|hostaddr)=/) { print "<query " parts[i] ">"; exit }
      sub(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "", v)
      slash = index(v, "/")
      if (slash > 0) v = substr(v, 1, slash - 1)
      while ((at = index(v, "@")) > 0) v = substr(v, at + 1)
      if (substr(v, 1, 1) == "[") {
        close_b = index(v, "]")
        print substr(v, 2, close_b - 2)
      } else {
        colon = index(v, ":")
        print (colon > 0) ? substr(v, 1, colon - 1) : v
      }
      exit
    }
  ' "$1"
}

urldecode() {
  printf '%b' "${1//%/\\x}"
}

pg_fields() {
  awk '
    /^DATABASE_URL=/ {
      v = substr($0, 14)
      gsub(/^"|"$/, "", v)
      sub(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "", v)
      q = index(v, "?")
      query = (q == 0) ? "" : substr(v, q + 1)
      if (q > 0) v = substr(v, 1, q - 1)
      slash = index(v, "/")
      db = (slash > 0) ? substr(v, slash + 1) : ""
      auth = (slash > 0) ? substr(v, 1, slash - 1) : v
      userinfo = ""
      at = 0
      for (i = length(auth); i > 0; i--) if (substr(auth, i, 1) == "@") { at = i; break }
      if (at > 0) { userinfo = substr(auth, 1, at - 1); auth = substr(auth, at + 1) }
      c = index(userinfo, ":")
      user = (c > 0) ? substr(userinfo, 1, c - 1) : userinfo
      pw = (c > 0) ? substr(userinfo, c + 1) : ""
      if (substr(auth, 1, 1) == "[") {
        cb = index(auth, "]")
        host = substr(auth, 2, cb - 2)
        rest = substr(auth, cb + 1)
        port = (substr(rest, 1, 1) == ":") ? substr(rest, 2) : ""
      } else {
        c = index(auth, ":")
        host = (c > 0) ? substr(auth, 1, c - 1) : auth
        port = (c > 0) ? substr(auth, c + 1) : ""
      }
      sslmode = ""
      ctimeout = ""
      n = split(query, parts, "&")
      for (i = 1; i <= n; i++) {
        if (parts[i] ~ /^sslmode=/) sslmode = substr(parts[i], 9)
        if (parts[i] ~ /^connect_timeout=/) ctimeout = substr(parts[i], 17)
      }
      print user; print pw; print host; print port; print db; print sslmode; print ctimeout
      exit
    }
  ' "$1"
}

pg_exec() {
  local env_file="$1" sql="$2" fields u pw h p d sm ct
  fields=$(pg_fields "$env_file")
  {
    IFS= read -r u
    IFS= read -r pw
    IFS= read -r h
    IFS= read -r p
    IFS= read -r d
    IFS= read -r sm
    IFS= read -r ct
  } <<< "$fields"
  [ -n "$h" ] && [ -n "$d" ] || return 1
  env -u PGHOSTADDR -u PGSERVICE -u PGSERVICEFILE -u PGOPTIONS -u PGPASSFILE \
    PGPASSWORD="$(urldecode "$pw")" \
    ${sm:+"PGSSLMODE=$sm"} ${ct:+"PGCONNECT_TIMEOUT=$ct"} \
    psql -X -h "$h" -p "${p:-5432}" -U "$(urldecode "$u")" -d "$(urldecode "$d")" \
    -v ON_ERROR_STOP=1 -qAt -c "$sql"
}

schema=""
db_env=""
for f in "${env_files[@]}"; do
  file="$wt_path/$app_rel/$f"
  [ -f "$file" ] || continue
  grep -q '^DATABASE_URL=' "$file" || continue
  h=$(db_host_of "$file")
  case "$h" in
    localhost|127.0.0.1|::1) ;;
    *) refuse "$app_rel/$f DATABASE_URL host '${h:-<empty>}' is not localhost/127.0.0.1/::1; will not drop schemas there" ;;
  esac
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
else
  tip=$(git -C "$main_root" rev-parse --verify --quiet "refs/heads/$branch")
  merged_oids=""
  gh_ok=1
  if [ -n "${WT_PRUNE_TEST_MERGED_OIDS+x}" ]; then
    merged_oids="$WT_PRUNE_TEST_MERGED_OIDS"
  elif command -v gh >/dev/null 2>&1; then
    merged_oids=$(cd "$main_root" && gh pr list --head "$branch" --base "${into#origin/}" --state merged --json headRefOid --jq '.[].headRefOid' 2>/dev/null) || gh_ok=0
  else
    gh_ok=0
  fi
  if [ "$gh_ok" = "0" ]; then
    branch_reason="$branch is not merged into $into (gh unavailable, squash merge not checked)"
  elif [ -z "$merged_oids" ]; then
    branch_reason="$branch is not merged into $into and has no merged PR"
  elif printf '%s\n' "$merged_oids" | grep -qxF "$tip"; then
    branch_action="force-delete"
    branch_reason="$branch tip ${tip:0:7} is the head of a PR merged into ${into#origin/} (squash merge)"
  else
    branch_reason="$branch has a merged PR into ${into#origin/} but its tip ${tip:0:7} differs from the merged head (commits after merge)"
  fi
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
  db_copy=$(mktemp "${TMPDIR:-/tmp}/wt-env.XXXXXX")
  trap 'rm -f "$db_copy"' EXIT
  grep '^DATABASE_URL=' "$db_env" > "$db_copy"
fi

git -C "$main_root" worktree remove "$wt_path" || refuse "git worktree remove failed; schema ${schema:-<none>} and branch kept"
echo "wt-prune: removed worktree $wt_path"

if [ -n "$schema" ]; then
  if pg_exec "$db_copy" "DROP SCHEMA IF EXISTS \"$schema\" CASCADE" >/dev/null 2>&1; then
    echo "wt-prune: dropped schema $schema"
  else
    echo "wt-prune: ERROR: worktree removed but could not drop schema $schema (psql failed); drop it by hand. Branch kept." >&2
    exit 1
  fi
fi

case "$branch_action" in
  delete) git -C "$main_root" branch -d "$branch" ;;
  force-delete)
    git -C "$main_root" update-ref -d "refs/heads/$branch" "$tip" || refuse "branch $branch moved since the check; kept"
    echo "Deleted branch $branch (was ${tip:0:7}, squash-merged head)."
    ;;
  keep) echo "wt-prune: kept branch ${branch:-<none>}: $branch_reason" ;;
esac
