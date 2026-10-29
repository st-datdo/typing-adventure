#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/keyboad_with_sound/typing-adventure

sudo chown -R node:node \
  node_modules apps/web/node_modules packages/*/node_modules /home/node/.claude

pnpm install --frozen-lockfile
pnpm --filter @typing-adventure/db db:generate
pnpm --filter @typing-adventure/db exec prisma migrate deploy
pnpm --filter @typing-adventure/db db:seed
