#!/usr/bin/env bash
set -uo pipefail

block() {
  echo "guard-bash: BLOCKED: $*" >&2
  exit 2
}

command -v jq >/dev/null 2>&1 || block "jq not installed, cannot inspect the command"

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null) || block "unreadable hook input"
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$cmd" ] || exit 0

unquote() {
  local w=$1
  w=${w//\"/}
  w=${w//\'/}
  w=${w//\\/}
  printf '%s' "$w"
}

check_rm() {
  local recursive=0 force=0 seen=0 w
  for w in "$@"; do
    w=$(unquote "$w")
    if [ "$seen" = "0" ]; then
      case "$w" in rm|*/rm) seen=1 ;; esac
      continue
    fi
    case "$w" in
      --) break ;;
      --recursive) recursive=1 ;;
      --force) force=1 ;;
      --*) ;;
      -*)
        case "$w" in *[rR]*) recursive=1 ;; esac
        case "$w" in *f*) force=1 ;; esac
        ;;
    esac
  done
  if [ "$recursive" = "1" ] && [ "$force" = "1" ]; then
    block "recursive forced delete (rm -rf and variants) is not allowed for the agent; delete specific paths without -f or ask the user"
  fi
}

check_push() {
  local git_seen=0 push_seen=0 w
  for w in "$@"; do
    w=$(unquote "$w")
    if [ "$git_seen" = "0" ]; then
      case "$w" in git|*/git) git_seen=1 ;; esac
      continue
    fi
    if [ "$push_seen" = "0" ]; then
      [ "$w" = "push" ] && push_seen=1
      continue
    fi
    case "$w" in
      --force|--force-with-lease|--force-with-lease=*|--force-if-includes)
        block "git push $w rewrites remote history; the agent never force pushes (including --force-with-lease)"
        ;;
      --*) ;;
      -*f*) block "git push $w contains -f (force); the agent never force pushes" ;;
      +*) block "git push refspec starting with + forces the update; the agent never force pushes" ;;
    esac
  done
}

url_host() {
  local u q
  u=$(unquote "$1")
  q=""
  case "$u" in *\?*) q="&${u#*\?}" ;; esac
  if [[ "$q" =~ \&(host|hostaddr)= ]]; then
    printf '%s' "<query-host>"
    return
  fi
  u=${u%%\?*}
  case "$u" in *://*) u=${u#*://} ;; esac
  u=${u%%/*}
  u=${u##*@}
  if [ "${u:0:1}" = "[" ]; then
    u=${u#\[}
    u=${u%%\]*}
  else
    u=${u%%:*}
  fi
  printf '%s' "$u"
}

require_local() {
  local url=$1 source=$2 h
  h=$(url_host "$url")
  case "$h" in
    localhost|127.0.0.1|::1) ;;
    *) block "prisma/db write command but the database host from $source is not localhost/127.0.0.1/::1" ;;
  esac
}

check_prisma() {
  local found=0 root f line v rest
  if [[ "$cmd" =~ --url[=[:space:]]+(\"[^\"]*\"|\'[^\']*\'|[^[:space:]]+) ]]; then
    require_local "${BASH_REMATCH[1]}" "--url"
    found=1
  fi
  rest=$cmd
  while [[ "$rest" =~ DATABASE_URL=(\"[^\"]*\"|\'[^\']*\'|[^[:space:]\;\|]+) ]]; do
    require_local "${BASH_REMATCH[1]}" "an inline DATABASE_URL"
    found=1
    rest=${rest#*"${BASH_REMATCH[0]}"}
  done
  if [ -n "${DATABASE_URL:-}" ]; then
    require_local "$DATABASE_URL" "the DATABASE_URL environment variable"
    found=1
  fi
  if [ -n "$cwd" ] && root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null); then
    for f in typing-adventure/.env typing-adventure/apps/web/.env typing-adventure/packages/db/.env; do
      [ -f "$root/$f" ] || continue
      line=$(grep -m1 '^DATABASE_URL=' "$root/$f" 2>/dev/null) || continue
      v=${line#DATABASE_URL=}
      require_local "$v" "$f"
      found=1
    done
  fi
  [ "$found" = "1" ] || block "prisma/db write command but no DATABASE_URL could be read (inline, env or .env of the checkout at cwd); refusing"
}

if [[ "$cmd" =~ prisma[[:space:]]+(migrate|db[[:space:]]+(push|execute)) ]] || [[ "$cmd" =~ db:(migrate|push) ]]; then
  check_prisma
fi

segments=${cmd//[;&|()]/$'\n'}
while IFS= read -r seg; do
  [ -n "$seg" ] || continue
  read -ra words <<< "$seg" || true
  [ "${#words[@]}" -gt 0 ] || continue
  check_rm "${words[@]}"
  check_push "${words[@]}"
done <<< "$segments"

exit 0
