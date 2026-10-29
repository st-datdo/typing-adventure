# L02 · Advanced setup — Chấm điểm

Ngày chấm: 2026-10-29 · Branch: `lesson/L02-advanced-setup` · PR: #5 (đã merge)
Nguồn: [LESSON.md](LESSON.md), [REPORT.md](../../learner/L02-advanced-setup/REPORT.md), `git diff main` + `git status -uall` (chưa có commit nào, mọi thay đổi nằm ở working tree).

Phạm vi chạy lại: toàn bộ kiểm tra tĩnh, kiểm tra DB và chain build trên **host** do người chấm tự chạy. **Không** chạy lại `devcontainers/cli up` (stack đã dừng); phần runtime container dựa trên log trong REPORT cùng bằng chứng gián tiếp: 3 container `typing-adventure-{app,postgres,redis}-1` (Exited) và 5 volume `typing-adventure_nm-*` + `claude-config` có trên máy. Như vậy là đủ vì LESSON chỉ bắt buộc phần tĩnh + host cho AC-1/2/3/8.

| AC | Đạt/Chưa | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | 4 file + `init-db/` có trong `.devcontainer/`; `jq empty .devcontainer/devcontainer.json` → 0; `docker compose -f typing-adventure/docker-compose.yml -f .devcontainer/docker-compose.devcontainer.yml config -q` → 0; `bash -n .devcontainer/post-create.sh` → 0 |
| AC-2 | Đạt | `config \| grep -nE '\.ssh\|\.aws\|published'` → không dòng nào (exit 1); `grep -c 'target: .*node_modules'` → 5; bind mount chỉ có repo root và `.devcontainer/init-db`; `Dockerfile` base `typescript-node:1-20-bookworm`, `pnpm@9.15.0` |
| AC-3 | Đạt | `metrics.md` 2 dòng speed L2: host ~2m40s, sandbox ~4m45s, có giờ thật, ghi rõ chưa phải Rebuild Without Cache. Số sandbox lấy theo REPORT (không đo lại) |
| AC-4 | Đạt | `jq -c '.mcpServers\|keys' .mcp.json` → `["context7","postgres-ro"]`; `grep -iE 'key\|token\|secret' .mcp.json` → không có; `CLAUDE.md` có `## MCP` 2 dòng |
| AC-5 | Đạt | Host, `DATABASE_URL` từ `.env`: script chạy 2 lần với `ON_ERROR_STOP=1` → exit 0 cả 2; `mcp_ro` `select count(*) from "User"` → 12; `delete` → `cannot execute DELETE in a read-only transaction`; `begin read write; delete` → `permission denied for table User` |
| AC-6 | Đạt | `vitest.config.ts` có `include` + `environment: 'node'`; `vitest run` → `Test Files 12 passed (12)`, `Tests 137 passed (137)`; `git diff main -- typing-adventure/packages/game-engine/src` rỗng |
| AC-7 | Đạt | `pnpm typecheck --force` → `Tasks: 4 successful, 4 total`; `git diff main \| grep -E '^\+.*(@ts-ignore\|@ts-expect-error\|skipLibCheck\|"strict")'` → không có. Lỗi `process` của db sửa bằng `@types/node` qua `pnpm --filter` (lockfile +7 dòng, khớp 2 devDep) |
| AC-8 | Đạt | Host: `pnpm lint` exit 0 (`0 errors, 37 warnings`); `pnpm typecheck` 4/4; `pnpm test` 137 passed; `pnpm build --force` → `Compiled successfully`, `Tasks: 1 successful` |
| AC-9 | Đạt | `mistakes.md:2` `\|---\|---\|---\|---\|`; 5 dòng L02, 3 dòng trỏ `CLAUDE.md`/`.gitignore`, 1 dòng "chờ L5 hook"; `wc -l CLAUDE.md` → 59 |
| AC-10 | Đạt | REPORT có mục Session hygiene và bảng prune 11 mục (3 câu GUIDE §4.5); `metrics.md` dòng quality L2 = 0 |

**FEATURE_MAP:** section L02 có đủ 23 file mà `git status -uall` liệt kê (14 sửa + 9 mới). Chỉ còn thiếu `lessons/L02-advanced-setup/GRADE.md`; learner thêm dòng này khi commit.

## Nhận xét
- Làm vượt yêu cầu: Docker lên được nên đã chạy thật devcontainer và chain build trong container, kiểm cả 2 lớp chặn của `mcp_ro` (read-only transaction và quyền SELECT), phát hiện turbo cache dùng chung qua bind mount làm số đo sai và đo lại bằng `--force`.
- Vòng mistakes → rule có thật: `.pnpm-store/` vào `.gitignore` (đã kiểm `git check-ignore .pnpm-store`), gotcha init-db vào `CLAUDE.md`, quy ước không comment chuyển từ config cá nhân vào repo.
- Không chặn PASS, nên sửa:
  - `.pnpm-store/` nằm trong workspace chỉ được che bằng `.gitignore`; gọn hơn là đặt `store-dir` ra ngoài bind mount (vd thêm 1 named volume cho pnpm store trong override). Để lại cho L04 nếu cần.
  - `CLAUDE.md`: mục `## MCP` viết tiếng Việt trong khi phần còn lại tiếng Anh; `## Conventions` có dòng trống sau heading, `## MCP` thì không. Nên thống nhất.
  - Khi chạy `pnpm lint` qua hook RTK, output bị rewrite và báo exit 2 giả; người chấm phải dùng `rtk proxy pnpm lint` để có exit code thật. Nếu learner dùng số exit từ lệnh bị rewrite thì cần ghi rõ.
- Còn `chưa verify runtime` (đã ghi trong REPORT, được LESSON cho phép): cold build Rebuild Without Cache, SSH agent forward, MCP chạy thật (cả 2 server `Pending approval`), đăng nhập Claude Code trong container.

## Kết luận: PASS
Việc phải làm trước khi mở PR: thêm dòng `lessons/L02-advanced-setup/GRADE.md` vào section L02 của `FEATURE_MAP.md`, commit toàn bộ thay đổi (kể cả `.claude/agents/learner.md` còn tồn từ L00), push và mở PR.
