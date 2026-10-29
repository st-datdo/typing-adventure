# L02 · Advanced setup — Báo cáo

Branch: `lesson/L02-advanced-setup` · PR: chưa mở (chờ teacher chấm)

## Điều đã học
- Devcontainer là môi trường khai báo bằng file: chỉ thêm 1 file override cho `docker-compose.yml` sẵn có, `node_modules` tách 5 named volume nên binary Linux không đè lên macOS. `ports: !reset []` cho phép chạy song song với Postgres Homebrew của host.
- An toàn MCP nằm ở quyền DB, không ở server: `mcp_ro` bị chặn 2 lớp — `default_transaction_read_only` và chỉ có `SELECT`. Mở `BEGIN READ WRITE` để lách lớp 1 thì vẫn `permission denied` ở lớp 2.
- `pnpm typecheck` qua turbo là 1 cổng chung cho L5; lỗi `process` của `packages/db` sửa bằng `@types/node` chứ không nới `strict`.
- Quy ước nằm trong `~/.claude` cá nhân không đi theo vào container, nên phải chuyển vào `CLAUDE.md` của repo.
- Đo build phải tránh cache: turbo replay log từ cache dùng chung qua bind mount, nên số đo có thể ảo nếu không `--force`.

## Bài tập
| EX | Việc đã làm | File |
|---|---|---|
| EX-1 | 4 file devcontainer theo GUIDE §1.3 + `ports: !reset []` cho `postgres`/`redis`; JSON thuần. Docker lên được nên chạy thật `devcontainers/cli up` + chain build trong container | `.devcontainer/{devcontainer.json,docker-compose.devcontainer.yml,Dockerfile,post-create.sh}`, `.gitignore` |
| EX-2 | Script role `mcp_ro` idempotent (`DO $$ ... IF NOT EXISTS`), `ALTER DEFAULT PRIVILEGES IN SCHEMA public` (không `FOR ROLE dev`); `.mcp.json` 2 server; mục `## MCP` trong `CLAUDE.md` | `.devcontainer/init-db/01-mcp-readonly.sql`, `.mcp.json`, `CLAUDE.md` |
| EX-3 | `vitest.config.ts` (`include src/__tests__/**/*.test.ts`, `environment: 'node'`), không sửa test | `typing-adventure/packages/game-engine/vitest.config.ts` |
| EX-4 | Task turbo `typecheck`, script ở root + 4 package; `pnpm --filter @typing-adventure/db add -D @types/node@^22.0.0`, `pnpm --filter @typing-adventure/i18n add -D typescript@^5.7.0`; cập nhật dòng typecheck trong `CLAUDE.md` | `typing-adventure/{turbo.json,package.json,pnpm-lock.yaml}`, `typing-adventure/apps/web/package.json`, `typing-adventure/packages/{game-engine,i18n,db}/package.json` |
| EX-5 | Sửa header bảng `mistakes.md`; 5 dòng L02, 3 dòng đã chuyển thành `CLAUDE.md`/`.gitignore`, 1 dòng "chờ L5 hook"; mục Conventions trong `CLAUDE.md`; Session hygiene + prune bên dưới | `docs/ai-levelup/mistakes.md`, `CLAUDE.md` |

## Tiêu chí
| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | `jq empty` → 0; `docker compose -f typing-adventure/docker-compose.yml -f .devcontainer/docker-compose.devcontainer.yml config -q` → 0; `bash -n .devcontainer/post-create.sh` → 0 |
| AC-2 | Đạt | `config \| grep -nE '\.ssh\|\.aws\|published'` → không dòng nào (exit 1); `grep -c 'target: .*node_modules'` → 5; Dockerfile `pnpm@9.15.0`, base `typescript-node:1-20-bookworm`; trong container `node -v` v20.19.2, `pnpm -v` 9.15.0, `ls ~/.ssh ~/.aws` → No such file or directory; `docker ps`: `postgres 5432/tcp`, `redis 6379/tcp` (không publish ra host) |
| AC-3 | Đạt | `metrics.md`: host ~2m40s (22:53 → 22:55:38); sandbox ~4m45s (22:53 → 22:57:46), ghi rõ chưa phải Rebuild Without Cache |
| AC-4 | Đạt | `jq '.mcpServers \| keys'` → `["context7","postgres-ro"]`; không key/token (URL mặc định chỉ chứa `mcp_ro:mcp_ro` local); `CLAUDE.md` có `## MCP` 2 dòng |
| AC-5 | Đạt | Host (user `postgres`, URL lấy từ `.env`, không in password): chạy 2 lần → `DO / GRANT x3 / ALTER DEFAULT PRIVILEGES / ALTER ROLE x2`, exit 0; `select count(*)` → 12; `delete` → `ERROR: cannot execute DELETE in a read-only transaction`; `begin read write; delete` → `ERROR: permission denied for table User`. Container (user `dev`): chạy 2 lần → ok, SELECT → 1, DELETE → read-only, `begin read write` → permission denied |
| AC-6 | Đạt | `vitest run` → `Test Files 12 passed (12)`, `Tests 137 passed (137)`; `git diff main...HEAD -- typing-adventure/packages/game-engine/src` và diff working tree đều rỗng |
| AC-7 | Đạt | `pnpm typecheck` → `Tasks: 4 successful, 4 total` (web, game-engine, i18n, db); `git diff \| grep -E '^\+.*(@ts-ignore\|@ts-expect-error\|skipLibCheck\|"strict")'` → không có |
| AC-8 | Đạt | Host: `(pnpm lint && pnpm typecheck && pnpm test && pnpm build) > log; echo rc=$?` → rc=0 (exit code của cả chain, không qua output bị RTK rewrite) (lint `0 errors, 37 warnings`, 137 test, `Compiled successfully`). Container: `pnpm lint --force`, `pnpm typecheck --force`, `pnpm test`, `pnpm build --force` exit 0 |
| AC-9 | Đạt | `mistakes.md` có `\|---\|---\|---\|---\|`; 5 dòng L02, cột cuối trỏ `CLAUDE.md` / `.gitignore` / "chờ L5 hook"; `wc -l CLAUDE.md` → 60 (sau khi thêm dòng trống cho `## MCP`) |
| AC-10 | Đạt | Mục Session hygiene + bảng prune bên dưới; `metrics.md` dòng quality L2 = 0 |

## Metric
| Metric | Giá trị |
|---|---|
| Bắt đầu phiên | 22:53 |
| First green host (`lint+typecheck+test+build`) | 22:55:38 (~2m40s) |
| `devcontainers/cli up` (build image + post-create: install, generate, migrate deploy, seed) | 22:53:53 → 22:55:51, 118s, không layer nào `CACHED` |
| Chain trong container | 22:56:42 → 22:57:46 (64s) |
| First green sandbox | 22:57:46 (~4m45s từ đầu phiên) |
| Số lần phải nhắc agent về điều đã có trong CLAUDE.md/rule/skill | 0 |
| Lỗi tự phát hiện trong phiên | 5 (ghi `mistakes.md`) |

## Vấn đề gặp phải và cách xử lý
- **`.pnpm-store/` 954 MB trong workspace**: pnpm trong container đặt store trên bind mount vì `node_modules` nằm ở volume khác. Thêm `.pnpm-store/` vào `.gitignore` gốc.
- **`mcp_ro` không tồn tại trong container**: volume `typing-adventure_postgres_data` tạo từ 2026-04-29 nên `docker-entrypoint-initdb.d` bị bỏ qua. Chạy tay `psql "$DATABASE_URL" -f .devcontainer/init-db/01-mcp-readonly.sql` 2 lần với user `dev` → ok (xác nhận không hardcode `FOR ROLE` là đúng). Thêm 1 dòng Gotchas vào `CLAUDE.md`.
- **Turbo cache dùng chung qua bind mount**: lần chạy đầu trong container `lint` báo `cache hit, replaying logs`, lần host thứ 2 build chỉ mất 4s do replay output build của container. Đo lại bằng `--force` (container: lint/typecheck/build; host: `pnpm build --force` → `cache bypass`, `Compiled successfully in 8.9s`).
- **Race lockfile**: `post-create.sh` chạy `pnpm install --frozen-lockfile` cùng lúc tôi thêm 2 devDep trên host. Chạy lại `pnpm install --frozen-lockfile` trong container sau đó → `Done`, typecheck 4/4.
- **Format `turbo.json`**: sửa bằng `JSON.stringify` làm mảng xuống dòng; chạy `prettier --write turbo.json` để diff chỉ còn 3 dòng.
- `claude mcp list` (host), nguyên văn:
  ```
  context7: https://mcp.context7.com/mcp (HTTP) - ⏸ Pending approval (run `claude` to approve)
  postgres-ro: npx -y @modelcontextprotocol/server-postgres ${MCP_PG_URL} - ⏸ Pending approval (run `claude` to approve)
  ```

## Session hygiene
- **Số session:** 1 (subagent learner, 1 task = lesson L02). Phiên ngắn (~15 phút), context không gần đầy.
- **`/clear`:** không cần trong phiên vì chỉ có 1 task; sẽ mở session mới khi chuyển sang sửa theo GRADE.
- **`/compact`:** không cần, context chưa dài.
- **`/rewind`:** không cần, không có lần đi sai hướng. Lỗi format `turbo.json` sửa bằng 1 lệnh prettier thay vì vá bằng prompt. Lưu ý: `pnpm add`, chạy SQL và `devcontainers up` là thay đổi qua Bash, `/rewind` không hoàn tác được.
- **Container sau khi đo:** đã `docker compose ... stop` (giữ volume).

### Prune (GUIDE §4.5)
| Mục | 1. Có dùng / ngăn lỗi tuần này? | 2. Trùng chỗ khác? | 3. Linter/hook kiểm được? |
|---|---|---|---|
| `.claude/rules/api-routes.md` | Không (lesson không đụng API route) | Trùng một phần pattern API ở `CLAUDE.md` Architecture | Một phần (Zod/response shape) → xem lại ở L5 |
| `.claude/rules/game-engine.md` | Có: nạp khi thêm `vitest.config.ts`; ý "không sửa test" được giữ | Trùng ý "logic mới kèm test" với `CLAUDE.md` | Không |
| `.claude/rules/multiplayer.md` | Không | Trùng "never trust client progress" với `CLAUDE.md` | Không → cân nhắc gộp |
| skill `add-api-route` | Không | Không | Không |
| skill `add-game-mode-logic` | Không | Không | Không |
| skill `prisma-change` | Không (không đổi schema; chỉ `migrate deploy` trong post-create) | Không | Không |
| `CLAUDE.md` Commands | Có (lệnh `--filter`, `pnpm typecheck`) | Không | Không |
| `CLAUDE.md` Conventions (mới) | Có: thay quy ước cá nhân khi vào container | Trùng `~/.claude/CLAUDE.md` trên host (chủ ý) | Comment: chỉ một phần, chưa có lint rule phù hợp |
| `CLAUDE.md` MCP (mới) | Chưa dùng (MCP pending approval) | Không | Không |
| `CLAUDE.md` Architecture | Có (cấu trúc package cho typecheck) | Xem 2 dòng rule trùng ở trên | Không |
| `CLAUDE.md` Gotchas | Có: dòng init-db mới | Không | Không |

Kết luận prune: chưa xoá gì trong 1 phiên; ứng viên gộp/xoá là `multiplayer.md` và các skill chưa dùng, quyết định sau 1 tuần theo GUIDE §2.5.

## Chưa verify runtime
- **Cold build chính thức** (`Rebuild Without Cache` + xoá volume `nm-*` và `postgres_data`): chưa làm. Lần đo này image không có layer `CACHED` nhưng base image có thể đã có sẵn trên máy và `postgres_data` là volume cũ.
- **SSH agent forward**: `ssh-add -l` trong container → `Could not open a connection to your authentication agent` (CLI không forward như VS Code). Chưa verify `ssh -T git@github.com`.
- **MCP chạy thật**: cả 2 server `Pending approval`; chưa approve, chưa thử Context7/`postgres-ro` qua agent (GUIDE §2.4).
- Claude Code login trong container (volume `claude-config`) chưa thử.
