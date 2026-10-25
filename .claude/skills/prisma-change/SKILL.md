---
name: prisma-change
description: Use when changing the database schema — adding/altering a Prisma model, field, enum, relation or index in packages/db/prisma/schema.prisma — creating the migration, updating the seed and rebuilding dependent packages.
---
# Prisma schema change

1. Đọc `packages/db/prisma/schema.prisma` và migration gần nhất trong `prisma/migrations/` để theo style hiện có (tên model PascalCase, `@@index`, `@relation`, `createdAt/updatedAt`).
2. Kiểm tra `packages/db/.env` trỏ tới Postgres **local** (`localhost`/docker-compose). Không chạy migrate với DB khác local.
3. Sửa `schema.prisma`:
   - Field mới trên bảng có dữ liệu: cho nullable hoặc có `@default`, tránh migration fail.
   - Đổi tên/xoá field: cân nhắc dữ liệu cũ, ghi rõ trong PR.
4. Tạo migration (trong `typing-adventure/`):
   ```bash
   pnpm --filter @typing-adventure/db db:migrate --name <snake_case_mo_ta>
   ```
   Đọc lại `migration.sql` sinh ra, chắc chắn không có `DROP` ngoài ý muốn. Commit cả thư mục migration.
5. Cập nhật `packages/db/prisma/seed.ts` nếu model/field mới cần dữ liệu mẫu. Dùng `upsert` để seed chạy lại nhiều lần không lỗi.
   ```bash
   pnpm --filter @typing-adventure/db db:seed
   ```
6. Generate client và sửa code dùng model:
   ```bash
   pnpm --filter @typing-adventure/db db:generate
   ```
   Tìm chỗ dùng model trong `apps/web/src/app/api/**` và `lib/**`; cập nhật `select`, Zod schema và type liên quan.
7. Verify:
   - `pnpm --filter web build`
   - `pnpm test`
   - Gọi thử API bị ảnh hưởng bằng curl localhost hoặc mở `pnpm --filter @typing-adventure/db db:studio` kiểm tra dữ liệu.
