# WM · Kiểm duyệt word pack v3: token, cụm từ, dấu kết hợp, trộn script

Trạng thái: approved
Lesson/PR: L07 · EX-7 · BACKLOG: #23

## Bối cảnh
`moderateWords` (WP-03) tách token chỉ theo dấu cách và chỉ bỏ dấu kết hợp U+0300–U+036F, nên người chấm L06 lọt 6 ca: `thằng đồ ngốc`, `dumb-dumb`, `idiot's`, `stup⃝id` (U+20DD), `stupid҉` (U+0489), `stυpid` (Hy Lạp U+03C5). Sửa trước khi mở luồng cộng đồng gửi pack (WP-C).

## Requirements
Thay phần khớp blocklist của WP-03. `ModerationReason` thêm `mixed_script`. Thứ tự xét một từ (mỗi từ một lý do): `invalid_chars` → `too_long` (WP-02) → `mixed_script` (WM-04) → `blocked` (WM-01..03) → `duplicate` (WP-04). "Gấp" = `đ`/`Đ` → `d`, NFD, bỏ dấu theo WM-03, lowercase. Mục blocklist được chuẩn hoá (WP-01), gấp và tách token cùng cách với từ.

| ID | EARS | Test |
|---|---|---|
| WM-01 | WHEN xét blocklist THE SYSTEM SHALL tách từ đã gấp thành token theo `[\s'-]+`, bỏ token rỗng; IF một token bằng một mục blocklist một token THEN loại với `blocked` (`dumb-dumb`, `idiot's`, `-stupid-` bị chặn) | `typing-adventure/packages/game-engine/src/__tests__/moderation-v3.test.ts` |
| WM-02 | IF dãy token của một mục blocklist (≥ 2 token) xuất hiện liên tiếp ở bất kỳ vị trí nào trong dãy token của từ THEN THE SYSTEM SHALL loại với `blocked` (`thằng đồ ngốc`, `đồ-ngốc`, `you're đồ ngốc nhé` bị chặn; `ngốc đồ`, `đồ chơi ngốc` không bị chặn bởi `đồ ngốc`) | `moderation-v3.test.ts` |
| WM-03 | WHEN gấp THE SYSTEM SHALL bỏ mọi ký tự `\p{M}` sau NFD, không chỉ U+0300–U+036F (`stup⃝id` U+20DD, `stupid҉` U+0489 bị chặn bởi `stupid`) | `moderation-v3.test.ts` |
| WM-04 | IF một từ có cả chữ cái (`\p{L}`) `\p{Script=Latin}` và chữ cái `\p{Script=Cyrillic}` hoặc `\p{Script=Greek}` THEN THE SYSTEM SHALL loại với `mixed_script` (`stυpid`, `cаt` có `а` Cyrillic); từ chỉ một script (`привет`, `αβγ`, `Việt`) không bị loại vì lý do này; dấu kết hợp không tính, kể cả U+0483/U+0489 có Script=Cyrillic (`stupid҉` là `blocked`, không phải `mixed_script`) | `moderation-v3.test.ts` |
| WM-05 | IF mục blocklist không còn token nào sau khi gấp (`''`, `' - '`) THEN THE SYSTEM SHALL bỏ qua mục đó (không chặn mọi từ) | `moderation-v3.test.ts` |
| WM-06 | WHEN dùng `DEFAULT_BLOCKLIST` THE SYSTEM SHALL chặn đủ 11 ca người chấm L06: `STUPID`, `stüpid`, `you stupid`, `Đồ Ngốc`, `đồ  ngốc`, `thằng đồ ngốc`, `dumb-dumb`, `idiot's`, `stup⃝id`, `stupid҉` (`blocked`) và `stυpid` (`mixed_script`) | `moderation-v3.test.ts` |

File dự kiến: `typing-adventure/packages/game-engine/src/moderation.ts` (sửa). Test: `typing-adventure/packages/game-engine/src/__tests__/moderation-v3.test.ts` (thêm), `typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts` (chỉ thêm dòng, nếu cần)

## Ngoài phạm vi
- Từ không có chữ Latin nhưng trông giống Latin (toàn Cyrillic `сат`, Cyrillic + Greek), chữ đồng hình trong cùng script Latin (`ı`), bảng confusables Unicode TR39. Chữ số (`0` thay `o`) đã bị WP-02 loại.
- So blocklist có dấu cho tiếng Việt một âm tiết (ghi ở WP v2), blocklist cấu hình qua DB/env.
- Sửa API `wordpacks`: `mixed_script` là lý do khác `duplicate`, nên tự được đếm vào 400 theo WP-05, không đổi code `apps/`.

## Hành vi không đổi
- WP-01, WP-02, WP-04..07 và WP-03 ngoại trừ cách tách token/gấp: khớp cả từ, không khớp chuỗi con (`nguyen`, `Nguyễn` không bị chặn bởi `ngu`; `badminton` không bị chặn bởi `bad`), `ngốc` một mình không bị chặn bởi `đồ ngốc`, `DEFAULT_BLOCKLIST` giữ 4 mục — test hồi quy: `typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts` (không sửa assertion), toàn bộ test engine.
- `moderation.ts` không có `import`, chỉ dùng API chuẩn của JS.

## Lịch sử
- v1 2026-10-30 20:25: bản đầu, approved. Thay phần khớp blocklist của WP-03 (xem Lịch sử `specs/WP/spec.md`).
- v2 2026-10-30 20:28: WM-04 chỉ xét chữ cái `\p{L}`. Lý do: U+0483, U+0489 là `\p{M}` nhưng có Script=Cyrillic, xét mọi ký tự thì `stupid҉` thành `mixed_script`, trái WM-06.
