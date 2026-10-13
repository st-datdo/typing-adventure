# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Typing Adventure: kids' typing-practice web app (Vietnamese/English). Turborepo + pnpm 9 monorepo, Node >= 20. Run all commands from `typing-adventure/`.

The main app is located in `typing-adventure/`, and `pnpm` commands are run within that directory.

## Commands

```bash
pnpm install
docker compose up -d                                  # Postgres 16 (dev/dev) + Redis; adjust DATABASE_URL in .env to match
cp .env.example .env
pnpm --filter @typing-adventure/db db:generate        # after any schema.prisma change
pnpm --filter @typing-adventure/db db:migrate         # create/apply migration (db:push for throwaway sync)
pnpm --filter @typing-adventure/db db:seed

pnpm dev                                              # next dev, NO Socket.IO (multiplayer pages won't work)
pnpm --filter @typing-adventure/web dev:ws            # custom server.ts: Next + Socket.IO on :3000
pnpm build
pnpm test                                             # only packages/game-engine has tests (Vitest)
pnpm --filter @typing-adventure/game-engine exec vitest run scoring        # single file
pnpm --filter @typing-adventure/game-engine exec vitest run -t "combo"   # single test by name
```

No ESLint/Prettier config is committed yet, so `pnpm lint` (`next lint`) will prompt for setup. Use `npx tsc --noEmit -p apps/web` for type checks.

## Architecture

- `packages/game-engine` — pure TS, the source of truth for game rules: state machine (`engine.ts`: `createInitialState`, `processKeypress`, `calculateResult`), scoring/combo/stars, word lists + lessons, achievements, keyboard finger map, shared types (`Settings`, `GameMode`, `Level`, `Lang`...). Must stay free of React/DOM/Node APIs. New logic goes here with a Vitest test in `src/__tests__/`.
- `packages/i18n` — `t(lang, key)` / `tReplace(lang, key, ...args)` with `{0}` placeholders. `vi.ts` defines the key set (`TranslationKey = keyof typeof vi`); add every key to both `vi.ts` and `en.ts`.
- `packages/db` — Prisma schema, migrations, seed, and a singleton `prisma` client re-exported with model types.
- Workspace packages ship raw TS (`main: src/index.ts`), compiled by Next via `transpilePackages` in `apps/web/next.config.ts`. There is no per-package build step.

### apps/web (Next.js 15 App Router, React 19)

- Client game flow: `components/game/GameEngine.tsx` → `hooks/useGameEngine.ts` (timer, sound, speech, achievements, records) → `stores/game-store.ts` (Zustand, wraps the pure engine functions). `settings-store` and `records-store` use Zustand `persist` to localStorage. This is how guest mode works; logged-in users sync to the API (`loadFromServer`).
- API routes (`app/api/**/route.ts`) follow one pattern: `getSessionUser()` from `lib/auth.ts` (or `requireAdmin()` from `lib/admin-guard.ts`), Zod `safeParse` of the body, `prisma` from `@typing-adventure/db`, and respond only through `ok()` / `err()` / `unauthorized()` in `lib/api-response.ts` (`{ success, data | error, meta? }` envelope). Client side calls go through the typed wrappers in `lib/api/*` built on `apiClient`.
- Auth: NextAuth v5 beta, JWT sessions, Google + Credentials (bcrypt) providers, Prisma adapter. `session.user.id` is injected in callbacks. `middleware.ts` protects `/friends`, `/admin`, `/lobby`, `/race`.
- Route groups: `(auth)`, `(social)`, `(multiplayer)`, plus `admin/`. Styling is mostly plain CSS files in `src/styles/` (Tailwind is configured but secondary).
- Multiplayer: `server.ts` attaches Socket.IO to the Next HTTP server. `lib/multiplayer/socket-gateway.ts` handles events, `race-room.ts` holds room state, `anti-cheat.ts` validates progress server-side. All of it is in-memory `Map`s (single instance, lost on restart; Redis is not wired in). Event contracts live in `lib/multiplayer/types.ts`. Clients connect via `socket-client.ts` (`NEXT_PUBLIC_WS_URL`). Never trust client-reported progress.
- Sentry is enabled only when `NEXT_PUBLIC_SENTRY_DSN` is set.

## Gotchas

- `Dockerfile` runs Next standalone `apps/web/server.js`, not the custom `server.ts`, so the container has no Socket.IO. Deploy notes are in `docs/DEPLOY_AWS.md`.
- Root `package.json` has no `db:*` scripts (the README is wrong). Use `--filter @typing-adventure/db`.
- Design and planning docs live one level up in `../docs/` (`FULLSTACK_ARCHITECTURE.md`, `EXECUTION_PLAN.md`, `ai-levelup/`).
