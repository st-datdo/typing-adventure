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

check_find() {
  local seen=0 prev="" w
  for w in "$@"; do
    w=$(unquote "$w")
    if [ "$seen" = "0" ]; then
      case "$w" in find|*/find) seen=1 ;; esac
      continue
    fi
    case "$w" in
      -delete) block "find -delete removes files in bulk; list the files first and delete specific paths, or ask the user" ;;
    esac
    case "$prev" in
      -exec|-execdir|-ok|-okdir)
        case "$w" in rm|*/rm) block "find $prev rm removes files in bulk; list the files first and delete specific paths, or ask the user" ;; esac
        ;;
    esac
    prev=$w
  done
}

check_env_read() {
  local seen="" w name
  for w in "$@"; do
    w=$(unquote "$w")
    if [ -z "$seen" ]; then
      case "$w" in cat|head|tail|less|more|bat|*/cat|*/head|*/tail|*/less|*/more|*/bat) seen=${w##*/} ;; esac
      continue
    fi
    w=${w#<}
    name=${w##*/}
    case "$name" in
      .env.example) ;;
      .env|.env.*) block "$seen $name prints secrets; read .env.example for variable names, or compare names with grep -o '^[A-Z_]*='" ;;
    esac
  done
}

check_eval() {
  local w
  for w in "$@"; do
    w=$(unquote "$w")
    case "$w" in
      eval) block "eval runs a string the guard cannot inspect; run the command directly" ;;
      sudo|command|builtin|exec|env|nohup|time|nice|xargs|then|do|else|if|while|until|'{'|'!'|-*) ;;
      [A-Za-z_]*=*) ;;
      *) return ;;
    esac
  done
}

gate_label() {
  local l
  l=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case ",$l," in
    *,agent-ready,*|*,config-change-approved,*) return 0 ;;
  esac
  return 1
}

check_gh() {
  local seen=0 prev="" adding=0 api_write=0 api_labels=0 gate=0 w lw
  local -a pos=()
  for w in "$@"; do
    w=$(unquote "$w")
    if [ "$seen" = "0" ]; then
      case "$w" in
        gh|*/gh) seen=1 ;;
        sudo|command|builtin|exec|env|nohup|time|nice|xargs|then|do|else|if|while|until|'{'|'!'|-*) ;;
        [A-Za-z_]*=*) ;;
        *) return 0 ;;
      esac
      continue
    fi
    lw=$(printf '%s' "$w" | tr '[:upper:]' '[:lower:]')
    case "$w" in
      --add-label=*|--label=*)
        adding=0
        gate_label "${w#*=}" && gate=1
        ;;
      --add-label|--label|-l) adding=1 ;;
      -X|--method|-R|--repo) adding=0 ;;
      -X*|--method=*)
        adding=0
        case "$lw" in -xget|--method=get) ;; *) api_write=1 ;; esac
        ;;
      -f|-F|--field|--raw-field|--input|-f*|-F*|--field=*|--raw-field=*|--input=*) adding=0; api_write=1 ;;
      -*) adding=0 ;;
      *)
        if [ "$adding" = "1" ]; then
          gate_label "$(printf '%s' "$w" | tr -d ' ')" && gate=1
        fi
        case "$prev" in
          -X|--method)
            [ "$lw" = "get" ] || api_write=1
            ;;
          -R|--repo) ;;
          *) [ "$adding" = "1" ] || pos+=("$lw") ;;
        esac
        case "$lw" in *labels*) api_labels=1 ;; esac
        ;;
    esac
    prev=$w
  done
  [ "$seen" = "1" ] && [ "${#pos[@]}" -gt 0 ] || return 0
  case "${pos[0]}:${pos[1]:-}" in
    issue:edit|pr:edit|issue:create|pr:create)
      [ "$gate" = "1" ] && block "gh ${pos[0]} ${pos[1]} with label agent-ready/config-change-approved: these labels are the human gate; only the repo owner adds them"
      ;;
    label:create|label:edit|label:delete|label:clone)
      block "gh label ${pos[1]} changes repo labels (including the agent-ready/config-change-approved gates); ask the user"
      ;;
    api:*)
      [ "$api_labels" = "1" ] && [ "$api_write" = "1" ] && block "gh api write to a labels endpoint; labels are the human gate, ask the user"
      ;;
  esac
  return 0
}

check_segments() {
  local c=$1 depth=$2 segments seg
  local -a words
  segments=${c//[;&|()\`]/$'\n'}
  while IFS= read -r seg; do
    [ -n "$seg" ] || continue
    read -ra words <<< "$seg" || true
    [ "${#words[@]}" -gt 0 ] || continue
    check_rm "${words[@]}"
    check_push "${words[@]}"
    check_find "${words[@]}"
    check_env_read "${words[@]}"
    check_eval "${words[@]}"
    check_gh "${words[@]}"
  done <<< "$segments"
  [ "$depth" = "0" ] && check_nested "$c"
}

check_nested() {
  local rest=$1 sq="'" dq='"' re inner
  re="(^|[[:space:];&|(\`])([^[:space:];&|()\`]*/)?(bash|sh|zsh|dash|ksh)[[:space:]]+(-[[:alnum:]]*[[:space:]]+)*-[[:alpha:]]*c[[:alpha:]]*[[:space:]]+(${sq}[^${sq}]*${sq}|${dq}([^${dq}\\]|\\\\.)*${dq}|[^[:space:]]+)"
  while [[ "$rest" =~ $re ]]; do
    inner=${BASH_REMATCH[5]}
    rest=${rest#*"${BASH_REMATCH[0]}"}
    case "$inner" in
      "$sq"*) inner=${inner#"$sq"}; inner=${inner%"$sq"} ;;
      "$dq"*) inner=${inner#"$dq"}; inner=${inner%"$dq"}; inner=${inner//\\\"/\"} ;;
    esac
    check_segments "$inner" 1
  done
}

check_segments "$cmd" 0

exit 0
