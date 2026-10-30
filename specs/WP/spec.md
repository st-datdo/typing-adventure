# WP · Kiểm duyệt nội dung word pack

Trạng thái: approved
Lesson/PR: L06 · EX-5 · BACKLOG: không

## Bối cảnh
`POST/PUT /api/wordpacks` (chỉ admin) lưu nguyên danh sách từ, không lọc: từ thô tục, từ trùng, ký tự lạ, khoảng trắng thừa đi thẳng vào pack mà trẻ em sẽ gõ. Cần một bộ lọc pure trong engine, dùng lại được khi mở luồng cộng đồng gửi pack.

## Requirements
Hàm `moderateWords(words, blocklist = DEFAULT_BLOCKLIST)` trong `packages/game-engine/src/moderation.ts`, trả `{ accepted: string[], rejected: { word, reason }[] }`, `reason` ∈ `invalid_chars` | `too_long` | `blocked` | `duplicate`. `MAX_WORD_LENGTH = 30`. Mỗi từ chỉ nhận **một** lý do, xét theo thứ tự trong bảng (WP-02 → WP-04).

| ID | EARS | Test |
|---|---|---|
| WP-01 | WHEN nhận danh sách từ THE SYSTEM SHALL chuẩn hoá từng từ (Unicode NFC, trim, gộp chuỗi khoảng trắng bên trong thành 1 dấu cách) rồi trả `accepted` theo thứ tự vào, dạng đã chuẩn hoá; `rejected[].word` cũng là dạng đã chuẩn hoá | `packages/game-engine/src/__tests__/moderation.test.ts` |
| WP-02 | IF từ sau chuẩn hoá rỗng hoặc có ký tự ngoài chữ cái (`\p{L}`), dấu kết hợp (`\p{M}`), dấu cách, `'`, `-` THEN THE SYSTEM SHALL loại với `invalid_chars`; IF dài hơn 30 ký tự (code point, sau NFC) THEN loại với `too_long` | `moderation.test.ts` |
| WP-03 | IF từ khớp một mục blocklist sau khi gấp (lowercase, NFD bỏ dấu kết hợp `U+0300–U+036F`, `đ`/`Đ` → `d`) THEN THE SYSTEM SHALL loại với `blocked`. Khớp = cả từ bằng mục đó, hoặc một token (tách theo dấu cách) bằng mục đó; **không** khớp chuỗi con (`nguyen` không bị chặn bởi `ngu`). `DEFAULT_BLOCKLIST` = `stupid`, `idiot`, `dumb`, `đồ ngốc`, xuất qua `index.ts` | `moderation.test.ts` |
| WP-04 | IF từ (sau chuẩn hoá, so lowercase, **giữ dấu**: `ma` ≠ `mà`) đã có trong `accepted` THEN THE SYSTEM SHALL loại với `duplicate`, giữ lần xuất hiện đầu | `moderation.test.ts` |
| WP-05 | IF `POST /api/wordpacks` có từ bị loại với lý do khác `duplicate` THEN THE SYSTEM SHALL trả 400, `error` = `"<n> word(s) rejected by moderation"` (n = số từ bị loại khác `duplicate`) và không tạo bản ghi | `apps/web/src/app/api/__tests__/wordpacks-moderation.int.test.ts` |
| WP-06 | WHEN `POST /api/wordpacks` hợp lệ THE SYSTEM SHALL lưu `words` = `accepted` (đã chuẩn hoá, bỏ trùng theo WP-04, thứ tự vào) và trả 200 với pack đã lưu; từ trùng không làm request lỗi | `wordpacks-moderation.int.test.ts` |
| WP-07 | WHEN `PUT /api/wordpacks/[id]` có `words` THE SYSTEM SHALL áp cùng luật WP-05/WP-06: có từ bị loại (khác `duplicate`) → 400 và `words` trong DB không đổi; hợp lệ → lưu `accepted` | `wordpacks-moderation.int.test.ts` |

`đ/Đ`: NFD không tách `đ` (U+0111) thành `d` + dấu, nên gấp thay riêng `đ`/`Đ` → `d` trước khi bỏ dấu. Blocklist cũng được gấp cùng cách, nên mục `đần` khớp `Dần`, `DAN`, `dần`.

File dự kiến: `typing-adventure/packages/game-engine/src/moderation.ts` (thêm), `typing-adventure/packages/game-engine/src/index.ts` (sửa: export `moderateWords`, `DEFAULT_BLOCKLIST`, `MAX_WORD_LENGTH`, type `ModerationResult`, `ModerationReason`), `typing-adventure/apps/web/src/app/api/wordpacks/route.ts`, `typing-adventure/apps/web/src/app/api/wordpacks/[id]/route.ts` (sửa). Test: `typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts`, `typing-adventure/apps/web/src/app/api/__tests__/wordpacks-moderation.int.test.ts` (thêm).

## Ngoài phạm vi
- Người dùng thường gửi pack, trạng thái `PENDING/APPROVED/REJECTED`, migration Prisma, UI duyệt (Mở rộng `WP-C`).
- Trả danh sách từ bị loại chi tiết trong body 400 (envelope `err()` chỉ có `error`); UI admin hiển thị lý do.
- Blocklist cấu hình qua DB/env; lọc `name`/`description` của pack.

## Hành vi không đổi
- `GET /api/wordpacks`, `GET/DELETE /api/wordpacks/[id]`; `requireAdmin` (401/403) chạy trước mọi kiểm tra; Zod (`words` 1–500 phần tử, mỗi phần tử 1–50 ký tự) chạy trước moderation — test hồi quy: `apps/web/src/app/api/__tests__/auth-leaderboard.int.test.ts` (isolation `current_schema`), toàn bộ test engine hiện có (`pnpm --filter @typing-adventure/game-engine test`).
- `PUT` không có `words` → cập nhật các trường khác như cũ — test: `wordpacks-moderation.int.test.ts` (WP-07).

## Lịch sử
- v1 2026-10-30 09:42: bản đầu, approved.
- v2 2026-10-30 09:43: ghim `DEFAULT_BLOCKLIST` (test integration dùng `Stupid`, `IDIOT`). Gấp bỏ dấu làm từ tiếng Việt 1 âm tiết va nhau: `ngu` chặn cả `ngủ` (ngủ), `ngũ` (năm); `đần` chặn `đàn`, `dân`. Vì vậy danh sách mặc định không có mục tiếng Việt 1 âm tiết; blocklist tiếng Việt thật cần cụm từ hoặc so có dấu (ngoài phạm vi).
