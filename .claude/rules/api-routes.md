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
