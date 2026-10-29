#!/usr/bin/env bash
set -euo pipefail

die() { echo "wt-new: $*" >&2; exit 1; }
usage() { echo "usage: wt-new.sh <branch> [--base <ref>] [--no-install]" >&2; exit 2; }

branch=""
base="HEAD"
install=1
while [ $# -gt 0 ]; do
  case "$1" in
    --base) [ $# -ge 2 ] || usage; base="$2"; shift 2 ;;
    --no-install) install=0; shift ;;
    -h|--help) usage ;;
    -*) echo "wt-new: unknown option $1" >&2; usage ;;
    *) [ -z "$branch" ] || usage; branch="$1"; shift ;;
  esac
done
[ -n "$branch" ] || usage
git check-ref-format --branch "$branch" >/dev/null 2>&1 || die "invalid branch name: $branch"

common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || die "not inside a git checkout"
main_root=$(cd "$common_dir/.." && pwd -P)
app_rel="typing-adventure"
env_files=(".env" "apps/web/.env" "packages/db/.env")

slug=$(printf '%s' "$branch" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]/_/g' | cut -c1-60)
schema="wt_${slug}"
[[ "$schema" =~ ^wt_[a-z0-9_]{1,60}$ ]] || die "schema name not allowed: $schema"

wt_root="${WT_DIR:-$main_root/.worktrees}"
wt_path="$wt_root/$slug"

worktree_paths() {
  git -C "$main_root" worktree list --porcelain | sed -n 's/^worktree //p'
}

if git -C "$main_root" worktree list --porcelain | grep -qxF "branch refs/heads/$branch"; then
  die "branch $branch is already checked out in a worktree (see: git worktree list); nothing changed"
fi
[ ! -e "$wt_path" ] || die "path already exists: $wt_path; nothing changed"
for f in "${env_files[@]}"; do
  [ -f "$main_root/$app_rel/$f" ] || die "missing $app_rel/$f in main checkout"
  grep -q '^DATABASE_URL=' "$main_root/$app_rel/$f" || die "$app_rel/$f has no DATABASE_URL"
done

port_taken_by_worktree() {
  local p="$1" w
  while IFS= read -r w; do
    [ -f "$w/.wt-env" ] || continue
    if grep -qx "PORT=$p" "$w/.wt-env"; then return 0; fi
  done < <(worktree_paths)
  return 1
}

port=""
for n in $(seq 1 99); do
  p=$((3000 + n))
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then continue; fi
  if port_taken_by_worktree "$p"; then continue; fi
  port="$p"
  break
done
[ -n "$port" ] || die "no free port in 3001-3099"

mkdir -p "$wt_root"
exclude_file="$common_dir/info/exclude"
mkdir -p "$(dirname "$exclude_file")"
grep -qxF '.wt-env' "$exclude_file" 2>/dev/null || printf '.wt-env\n' >> "$exclude_file"

if git -C "$main_root" show-ref --verify --quiet "refs/heads/$branch"; then
  git -C "$main_root" worktree add --relative-paths "$wt_path" "$branch"
else
  git -C "$main_root" worktree add --relative-paths -b "$branch" "$wt_path" "$base"
fi

set_db_schema() {
  local file="$1" tmp
  tmp="$file.wt-tmp"
  awk -v s="$schema" '
    function with_schema(url,   q, base, n, i, parts, out) {
      q = index(url, "?")
      if (q == 0) return url "?schema=" s
      base = substr(url, 1, q - 1)
      n = split(substr(url, q + 1), parts, "&")
      out = ""
      for (i = 1; i <= n; i++) {
        if (parts[i] == "" || parts[i] ~ /^schema=/) continue
        out = out (out == "" ? "" : "&") parts[i]
      }
      return base "?" out (out == "" ? "" : "&") "schema=" s
    }
    /^DATABASE_URL=/ {
      v = substr($0, 14)
      gsub(/^"|"$/, "", v)
      print "DATABASE_URL=\"" with_schema(v) "\""
      next
    }
    { print }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
  chmod 600 "$file"
}

set_var() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$file.wt-tmp"
  awk -v k="$key" -v v="$value" '
    index($0, k "=") == 1 { print k "=\"" v "\""; done = 1; next }
    { print }
    END { if (!done) print k "=\"" v "\"" }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
  chmod 600 "$file"
}

url="http://localhost:$port"
for f in "${env_files[@]}"; do
  cp "$main_root/$app_rel/$f" "$wt_path/$app_rel/$f"
  set_db_schema "$wt_path/$app_rel/$f"
done
for f in ".env" "apps/web/.env"; do
  set_var "$wt_path/$app_rel/$f" NEXTAUTH_URL "$url"
  set_var "$wt_path/$app_rel/$f" NEXT_PUBLIC_WS_URL "$url"
done
printf 'PORT=%s\nWT_SCHEMA=%s\n' "$port" "$schema" > "$wt_path/.wt-env"

for f in "${env_files[@]}"; do
  [ "$(grep -c "schema=$schema" "$wt_path/$app_rel/$f")" = "1" ] || die "$f was not rewritten to schema $schema"
done
printf "wt-new: 3 env files set: db schema=%s, auth + ws url port %s\n" "$schema" "$port"

if [ "$install" = "1" ]; then
  (
    cd "$wt_path/$app_rel"
    pnpm install --frozen-lockfile --prefer-offline
    env -u DATABASE_URL pnpm --filter @typing-adventure/db db:generate
    env -u DATABASE_URL pnpm --filter @typing-adventure/db exec prisma db push --skip-generate
  ) || die "install/generate/db push failed; worktree kept at $wt_path (clean up: scripts/wt-prune.sh $branch)"
else
  echo "wt-new: --no-install: skipped pnpm install, db:generate, db push (schema $schema not created)"
fi

cat <<EOF

worktree: $wt_path
branch:   $branch
port:     $port
schema:   $schema
run:      cd "$wt_path/$app_rel" && set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web dev:ws
prune:    $main_root/scripts/wt-prune.sh $branch [--into <ref>] [--dry-run]
EOF
