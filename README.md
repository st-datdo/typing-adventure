# Typing Adventure

Website luyện gõ phím dành cho trẻ em. Giao diện nhiều màu sắc, hiệu ứng vui nhộn, hỗ trợ đa ngôn ngữ (Tiếng Việt / English).

## Tech Stack

- **Frontend**: Next.js 15, React 19, Zustand, CSS
- **Backend**: Next.js API Routes, NextAuth.js (JWT)
- **Database**: PostgreSQL + Prisma ORM
- **Monorepo**: Turborepo + pnpm workspaces

## Tính năng

### Chế độ chơi

| Chế độ | Mô tả |
|--------|--------|
| **Cổ điển** | Gõ danh sách từ theo 3 độ khó: Dễ / Vừa / Khó |
| **Bài học** | 5 bài theo nhóm phím: Home Row, Top Row, Bottom Row, Home+Top, Tất cả |
| **Đua tốc độ** | Gõ nhiều từ nhất trong 30s / 60s / 120s |
| **Thử thách** | Từ ngắn dần dài, tốc độ yêu cầu tăng, 3 mạng |

### Bàn phím & hướng dẫn

- Bàn phím ảo QWERTY với viền màu theo ngón tay
- Hình bàn tay SVG highlight ngón tay cần dùng
- Tùy chọn chữ hoa / chữ thường
- Flash animation khi gõ đúng/sai + particles

### Âm thanh

- 3 chế độ: Mặc định (beep/buzz) / Đọc chữ cái / Đọc từ
- Web Speech API đọc chữ cái và từ tiếng Anh
- Tốc độ đọc tuỳ chỉnh: Chậm / Vừa / Nhanh

### Hệ thống điểm

- Combo Streak + Score multiplier
- Đánh giá sao (1-3) dựa trên accuracy và WPM
- Adaptive Difficulty gợi ý level

### Tài khoản & Đồng bộ

- Đăng ký / đăng nhập (email + password, Google OAuth)
- Settings lưu DB — đăng nhập ở đâu cũng giống nhau
- Guest mode dùng localStorage
- Migrate dữ liệu guest → tài khoản

### Theo dõi tiến bộ

- Lịch sử lần chơi, biểu đồ WPM
- Streak ngày chơi liên tiếp
- 16 huy hiệu mở khoá

### Cá nhân hoá

- Hồ sơ: tên + avatar emoji
- 3 theme: Tối / Sáng / Sắc màu
- Số lượng từ tuỳ chỉnh (3-30)
- Nhập văn bản tuỳ chỉnh
- Đa ngôn ngữ: Tiếng Việt / English

## Cấu trúc dự án

```
keyboad_with_sound/
└── typing-adventure/          # Turborepo monorepo
    ├── apps/
    │   └── web/               # Next.js app
    │       └── src/
    │           ├── app/       # Pages + API routes
    │           ├── components/ # React components
    │           ├── hooks/     # Custom hooks
    │           ├── stores/    # Zustand stores
    │           ├── lib/       # Auth, API clients
    │           └── styles/    # CSS
    └── packages/
        ├── db/                # Prisma schema + client
        ├── game-engine/       # Game logic (pure TS)
        └── i18n/              # Translations
```

## Bắt đầu

```bash
cd typing-adventure

# Cài dependencies
pnpm install

# Setup database
cp .env.example .env   # Chỉnh DATABASE_URL
pnpm db:push
pnpm db:seed

# Chạy dev server
pnpm dev
```

Mở http://localhost:3000

## Responsive

- Desktop ưu tiên (bàn phím vật lý)
- Mobile breakpoints: 700px, 480px

## Trình duyệt hỗ trợ

- Chrome (khuyến nghị)
- Safari
- Firefox
