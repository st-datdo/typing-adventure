# Hướng dẫn Tuần 0 + L1 · Basic setup

Tham chiếu: [PLAN.md](PLAN.md). Theo dõi kết quả: `metrics.md`, `mistakes.md`.

Bối cảnh project khi viết hướng dẫn:
- Route API dùng `ok/err/unauthorized` từ `@/lib/api-response`, `requireAdmin()` từ `@/lib/admin-guard`, Zod `safeParse`.
- Repo chỉ có branch `master`, chưa có remote.
- `.claude/settings.local.json` đang bị track trong git.

---

## Tuần 0 · Chuẩn bị

### 0.1 Cài công cụ
```bash
brew install gh
gh auth login
```

### 0.2 Dọn repo trước khi push
```bash
cd ~/Downloads/Blueasha/Project/Mine/keyboad_with_sound

git rm --cached .claude/settings.local.json
printf '.claude/settings.local.json\n.DS_Store\n*.tsbuildinfo\n' >> .gitignore

git add .gitignore docs/
git commit -m "chore: add level-up plan and gitignore local settings"
```
- `settings.local.json` là cấu hình cá nhân, không đưa lên repo. Cấu hình chung của repo sẽ nằm ở `.claude/settings.json` (tạo ở L5).
- **Bắt buộc** kiểm tra lịch sử commit có từng chứa `.env` hoặc secret không:
```bash
git log --all --diff-filter=A --name-only --format= | grep -iE '\.env$|secret|key' | sort -u
```
Nếu ra file nào khác `.env.example` thì dừng lại, xử lý (xoá khỏi history, rotate secret) trước khi push.

### 0.3 Tạo repo GitHub và push
```bash
git branch -m master main
gh repo create typing-adventure --private --source=. --remote=origin --push
```

### 0.4 Tạo file theo dõi
`docs/ai-levelup/metrics.md`:
```markdown
| Level | Metric | Target | PR | Đo được | Ngày |
|---|---|---|---|---|---|
| L1 | First agent PR | ≤1 ngày | | | |
| L1 | Comment convention / PR | <1 | | | |
```

`docs/ai-levelup/mistakes.md`:
```markdown
| Ngày | Lỗi agent | Lần thứ | Đã thành rule/skill? |
|---|---|---|---|
```

---

## L1 · Basic setup (Tuần 1)

**Target:** PR agent-assisted đầu tiên ≤1 ngày; comment review về convention <1/PR.

**Quy ước vị trí:** session Claude mở ở thư mục gốc `keyboad_with_sound/`, nên `CLAUDE.md` và `.claude/` đặt ở gốc. Mọi `paths` trong rules bắt đầu bằng `typing-adventure/...`.

### Bước 1 · `/init` rồi tự cắt (~45 phút)
1. Mở session mới ở thư mục gốc, gõ `/init`.
2. Đọc CLAUDE.md vừa sinh ra. **Xoá** những gì README hoặc code đã nói: danh sách feature, tech stack, cây thư mục.
3. **Giữ hoặc thêm** những gì agent không tự suy ra được. Khung gợi ý:

```markdown
# Typing Adventure

App chính ở `typing-adventure/` (Turborepo + pnpm). Code vanilla JS cũ ở root đã bỏ, không sửa.

## Lệnh (chạy trong typing-adventure/)
- `pnpm dev` — Next.js; `pnpm --filter web dev:ws` — kèm Socket.io (cần cho multiplayer)
- `pnpm test` — Vitest (hiện chỉ game-engine)
- `pnpm --filter @typing-adventure/db db:push` / `db:seed` — Postgres local qua docker-compose

## Ranh giới
- `packages/game-engine`: logic thuần, không import React/Next/DOM. Web chỉ gọi qua API public của package.
- `packages/db`: chỉ nơi này import Prisma schema; web dùng `prisma` từ `@typing-adventure/db`.
- `packages/i18n`: mọi text UI phải có cả `en.ts` và `vi.ts`.

## Quy ước
- API response chỉ qua `ok/err/unauthorized` trong `apps/web/src/lib/api-response`.
- Không dùng `as any` mới.
- Plan dài hạn: `docs/EXECUTION_PLAN.md`; plan level-up: `docs/ai-levelup/PLAN.md`.
```

Mục tiêu dài 40–60 dòng. Dòng nào không giải thích được lý do giữ thì xoá.

### Bước 2 · 3 scoped rules (~1 giờ)

`.claude/rules/api-routes.md`:
```markdown
---
paths:
  - "typing-adventure/apps/web/src/app/api/**/*.ts"
---
# API routes
- Validate mọi input (query, body, params) bằng Zod `safeParse`; lỗi trả `err(parsed.error.errors[0].message)`.
- Route cần đăng nhập: `getSessionUser()` → null thì `unauthorized()`.
- Route admin: `const { error } = await requireAdmin(); if (error) return error`.
- Bọc truy vấn Prisma trong try/catch, không trả message lỗi DB ra client.
- List endpoint: phân trang `page`/`limit` (max 100), trả `ok(data, { total, page, limit })`.
```

`.claude/rules/game-engine.md`, với `paths: typing-adventure/packages/game-engine/**`:
- Code phải là pure function. Không dùng DOM, timer hay `Math.random` trực tiếp; random và thời gian được inject từ ngoài vào để test được.
- Mọi logic mới đều kèm test trong `src/__tests__/`.
- Khi đổi type public, chạy build web để bắt chỗ hỏng.

`.claude/rules/multiplayer.md`, với `paths: typing-adventure/apps/web/src/lib/multiplayer/**` và `typing-adventure/apps/web/server.ts`:
- Server là nguồn sự thật cho điểm, thời gian và tiến độ.
- Mọi event từ client đều phải đi qua anti-cheat.
- Không broadcast dữ liệu user ra ngoài room.

> Trước khi viết, mở `lib/multiplayer/anti-cheat.ts` và `race-room.ts` để rule mô tả **đúng code hiện tại**. Mỗi rule nên ghi rõ lỗi mà nó ngăn chặn.

### Bước 3 · 3 skills (~1.5 giờ)

Cấu trúc: `.claude/skills/<tên>/SKILL.md`. Ví dụ:
```markdown
---
name: add-api-route
description: Use when creating a new Next.js API route under apps/web/src/app/api — scaffolds Zod schema, auth/admin guard, Prisma query and ok/err response following project conventions.
---
# Add API route
1. Đọc một route tương tự làm mẫu (vd `app/api/wordpacks/route.ts`).
2. Tạo `app/api/<resource>/route.ts`, export handler theo method.
3. Zod schema cho query/body ở đầu file.
4. Guard: `getSessionUser` hoặc `requireAdmin`.
5. Thêm client function trong `apps/web/src/lib/api/`.
6. Verify: `pnpm --filter web build` + gọi thử bằng curl localhost.
```

Hai skill còn lại:
- `add-game-mode-logic`: thêm logic vào engine → viết test trước → expose API của package → nối vào `stores/game` → thêm text i18n (cả `en` và `vi`).
- `prisma-change`: sửa `schema.prisma` → `prisma migrate dev --name <x>` → cập nhật seed → build lại các package.

**Mẹo:** description phải nói rõ **khi nào dùng** và chứa từ khoá người dùng hay gõ. Description mơ hồ khiến agent chọn sai skill hoặc không chọn skill nào.

### Bước 4 · Kiểm tra setup (~15 phút)
Mở session mới và thử:
- "Tôi cần thêm API GET /api/classrooms/mine" → agent có tự dùng skill `add-api-route` không?
- Bảo agent sửa một file trong `packages/game-engine` → agent có tuân theo rule "kèm test" không?

Nếu agent không làm đúng, sửa description hoặc paths cho đến khi đúng.

Commit:
```bash
git checkout -b chore/agent-init
git add CLAUDE.md .claude/rules .claude/skills
git commit -m "chore: add agent instructions, scoped rules and skills"
gh pr create --fill
```
Tự review PR này rồi merge.

### Bước 5 · PR agent-assisted đầu tiên: ESLint + Prettier (đo thời gian)
1. Ghi lại giờ bắt đầu.
2. Tạo issue:
   ```bash
   gh issue create -t "Add ESLint + Prettier config" -b "next lint hiện fail vì thiếu config; thêm .prettierrc"
   ```
3. Mở session mới với prompt:
   > Thêm ESLint (flat config, next/core-web-vitals + typescript) cho apps/web và `.prettierrc` ở typing-adventure/. Chạy `pnpm lint` phải pass; lỗi lint có sẵn thì sửa, không disable rule.
4. Đọc diff, chạy `pnpm lint && pnpm build && pnpm test`, rồi tạo PR có `Closes #<issue>`.
5. Ghi vào `metrics.md`: thời gian từ lúc bắt đầu đến khi PR merge, và số comment convention mà bạn phải nhắc agent.

---

## Điều kiện qua L1
- PR agent-assisted hoàn thành trong ≤1 ngày.
- Comment về convention <1/PR, giữ được trên **3 PR liên tiếp**. Hai PR còn lại lấy từ backlog, ví dụ thêm `vitest.config.ts` hoặc một API nhỏ.
- Mỗi khi phải nhắc agent cùng một điều lần thứ 2, ghi vào `mistakes.md`. Đây là nguyên liệu cho L2.

## Lỗi thường gặp
- CLAUDE.md dài và lặp lại README.
- Rule mâu thuẫn với CLAUDE.md: mỗi ý chỉ nên nằm ở một chỗ.
- Viết rule "phòng xa" cho lỗi chưa từng xảy ra. Hãy bắt đầu tối giản và chỉ thêm rule khi có bằng chứng.
