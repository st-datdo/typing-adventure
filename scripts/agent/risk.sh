#!/usr/bin/env bash
set -uo pipefail

if [ "$#" -ne 0 ]; then
  echo "usage: <paths on stdin> | risk.sh" >&2
  exit 2
fi

shopt -s nocasematch

reason_of() {
  local p=$1
  case "$p" in
    apps/web/src/app/api/auth/*|*/apps/web/src/app/api/auth/*) echo "auth route" ;;
    lib/auth.ts|*/lib/auth.ts) echo "auth config" ;;
    lib/rate-limit.ts|*/lib/rate-limit.ts) echo "rate limit" ;;
    lib/admin-guard.ts|*/lib/admin-guard.ts) echo "admin guard" ;;
    middleware.ts|*/middleware.ts) echo "route protection middleware" ;;
    lib/multiplayer/*|*/lib/multiplayer/*) echo "multiplayer/anti-cheat" ;;
    server.ts|*/server.ts) echo "socket server" ;;
    packages/db/prisma/*|*/packages/db/prisma/*) echo "prisma schema/migration" ;;
    .github/*|*/.github/*) echo "github config/workflow" ;;
    .claude/*|*/.claude/*) echo "agent config" ;;
    scripts/*) echo "repo scripts" ;;
    lefthook.yml|*/lefthook.yml) echo "git hooks" ;;
    package.json|*/package.json) echo "package manifest" ;;
    pnpm-lock.yaml|*/pnpm-lock.yaml) echo "lockfile" ;;
    *) return 1 ;;
  esac
}

risk=standard
lines=()
count=0
while IFS= read -r raw || [ -n "$raw" ]; do
  p=${raw%$'\r'}
  p=${p#"${p%%[![:space:]]*}"}
  p=${p%"${p##*[![:space:]]}"}
  [ -n "$p" ] || continue
  while [[ "$p" == ./* ]]; do p=${p#./}; done
  p=${p#/}
  count=$((count + 1))
  if [[ "$p" == ..* || "$p" == */../* || "$p" == */.. ]]; then
    risk=high
    lines+=("$p"$'\t'"high: path escapes repo root")
  elif why=$(reason_of "$p"); then
    risk=high
    lines+=("$p"$'\t'"high: $why")
  else
    lines+=("$p"$'\t'"standard")
  fi
done

if [ "$count" = "0" ]; then
  echo "risk=high"
  printf '%s\t%s\n' "-" "high: no paths on stdin (diff unreadable or empty)"
  exit 0
fi

echo "risk=$risk"
printf '%s\n' "${lines[@]}"
