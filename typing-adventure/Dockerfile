FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/game-engine/package.json ./packages/game-engine/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @typing-adventure/db db:generate

ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    AUTH_SECRET="build-placeholder-not-used-at-runtime" \
    pnpm build

FROM builder AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN chown -R node:node /app/apps/web/.next
USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "--import", "tsx", "server.ts"]
