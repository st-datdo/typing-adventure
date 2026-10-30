#!/usr/bin/env bash
set -uo pipefail

trap 'exit 0' EXIT
exec 1>/dev/null 2>/dev/null

input=$(cat) || input=""
event=unknown
msg=""
cwd=""

if command -v jq >/dev/null 2>&1; then
  if parsed=$(printf '%s' "$input" | jq -r '[.hook_event_name // "unknown", .message // "", .cwd // ""] | map(tostring | gsub("[\\n\\r\\t\u001f]"; " ")) | join("\u001f")' 2>/dev/null); then
    IFS=$'\x1f' read -r event msg cwd <<< "$parsed" || true
  else
    event=invalid-input
    msg="unparsable hook input"
  fi
else
  event=no-jq
  msg=$input
fi

[ -n "$event" ] || event=unknown
if [ -z "$msg" ]; then
  case "$event" in
    Stop) msg="Session stopped, waiting for you" ;;
    Notification) msg="Session needs your attention" ;;
    *) msg="Hook event $event" ;;
  esac
fi

branch=-
if [ -n "$cwd" ] && [ -d "$cwd" ]; then
  branch=$(git -C "$cwd" symbolic-ref --short -q HEAD 2>/dev/null || git -C "$cwd" rev-parse --short HEAD 2>/dev/null) || branch=-
  [ -n "$branch" ] || branch=-
fi

title="Claude · $branch · $event"

log=${CLAUDE_NOTIFY_LOG:-$HOME/.claude/notify.log}
short=${msg//[$'\n\r\t']/ }
short=${short:0:200}
mkdir -p "$(dirname "$log")" 2>/dev/null
printf '%s\t%s\t%s\t%s\n' "$(date '+%F %H:%M:%S')" "$event" "$branch" "$short" >> "$log" 2>/dev/null

if command -v osascript >/dev/null 2>&1; then
  osascript -e 'on run argv' -e 'display notification (item 1 of argv) with title (item 2 of argv)' -e 'end run' -- "$msg" "$title" </dev/null
fi

exit 0
