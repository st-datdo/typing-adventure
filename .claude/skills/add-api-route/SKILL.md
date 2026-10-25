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
