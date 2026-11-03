#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

dir=${BACKUP_DIR:-$HOME/backups}
keep=${BACKUP_KEEP:-7}
remote=${BACKUP_REMOTE:-}
remote_max_age=${BACKUP_REMOTE_MAX_AGE:-30d}

mkdir -p "$dir"
file="$dir/typing_adventure-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
trap 'rm -f "$file.tmp"' EXIT

docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U typing -d typing_adventure --no-owner --clean --if-exists \
  | gzip > "$file.tmp"
gzip -t "$file.tmp"
mv "$file.tmp" "$file"

ls -1t "$dir"/typing_adventure-*.sql.gz | tail -n +$((keep + 1)) | xargs -r rm --

if [ -n "$remote" ]; then
  rclone copy "$file" "$remote"
  rclone delete --min-age "$remote_max_age" "$remote"
fi

echo "backup ok: $file"
