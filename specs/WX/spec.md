# WX · Kiểm duyệt word pack: skeleton TR39 thu gọn cho chữ đồng hình Cyrillic/Greek

Trạng thái: approved (issue #14)
Lesson/PR: L08 · issue #14 · BACKLOG: #29

## Bối cảnh
WM-04 chỉ loại từ trộn Latin với Cyrillic/Greek. Từ toàn Cyrillic/Greek trông như Latin (`сат`, `ѕтυріԁ`) và chữ đồng hình trong Latin (`stupıd` với `ı` U+0131) vẫn lọt blocklist vì `fold` không đổi chúng sang Latin. Người chấm L07 ghi lại (BACKLOG #29); sửa trước khi mở luồng cộng đồng gửi pack.

## Requirements
"Skeleton" = bước thêm vào cuối `fold` (sau lowercase, trước tách token của WM-01), thay từng ký tự theo bảng thu gọn dưới đây; ký tự ngoài bảng giữ nguyên. Áp cho cả từ và mục blocklist. Thứ tự lý do của WM không đổi: `invalid_chars` → `too_long` → `mixed_script` → `blocked` → `duplicate`.

Bảng thu gọn (code point sau lowercase → Latin):
- Cyrillic: `а`→`a`, `в`→`b`, `с`→`c`, `ԁ`→`d`, `е`→`e`, `һ`→`h`, `н`→`h`, `і`→`i`, `ј`→`j`, `к`→`k`, `м`→`m`, `о`→`o`, `р`→`p`, `ѕ`→`s`, `т`→`t`, `у`→`y`, `х`→`x`
- Greek: `α`→`a`, `β`→`b`, `γ`→`y`, `ι`→`i`, `κ`→`k`, `ν`→`v`, `ο`→`o`, `ρ`→`p`, `τ`→`t`, `υ`→`u`, `χ`→`x`
- Latin: `ı`→`i`

| ID | EARS | Test |
|---|---|---|
| WX-01 | WHEN gấp một từ hoặc mục blocklist THE SYSTEM SHALL thay mỗi ký tự có trong bảng thu gọn bằng chữ Latin tương ứng sau lowercase và bỏ dấu (`СТ` → `ct`, `ύ` → `u`), ký tự ngoài bảng giữ nguyên | `typing-adventure/packages/game-engine/src/__tests__/moderation-skeleton.test.ts` |
| WX-02 | WHEN một từ có chữ cái chỉ thuộc Cyrillic và/hoặc Greek (không có chữ Latin) và dãy token skeleton của nó chứa một mục blocklist THE SYSTEM SHALL loại với `blocked` (`сат`, `САТ` bị chặn khi blocklist có `cat`; `ѕтυріԁ` gồm Cyrillic + Greek bị chặn bởi `DEFAULT_BLOCKLIST`) | `moderation-skeleton.test.ts` |
| WX-03 | WHEN từ chứa `ı` (U+0131) THE SYSTEM SHALL gấp về `i` trước khi so blocklist (`stupıd`, `ıdıot`, `you stupıd` bị chặn với `blocked`, không phải `mixed_script`) | `moderation-skeleton.test.ts` |
| WX-04 | WHERE từ thuần Cyrillic/Greek không trùng mục blocklist nào sau skeleton THE SYSTEM SHALL chấp nhận như hiện tại (`привет`, `мама`, `αβγ`, `сат` với `DEFAULT_BLOCKLIST` được chấp nhận) | `moderation-skeleton.test.ts` |
| WX-05 | WHEN kiểm tra `duplicate` THE SYSTEM SHALL vẫn so `word.toLowerCase()` không qua skeleton (`['cat', 'сат']` với blocklist rỗng: cả hai được chấp nhận) | `moderation-skeleton.test.ts` |

File dự kiến: `typing-adventure/packages/game-engine/src/moderation.ts` (sửa), `specs/WX/spec.md` (thêm). Test: `typing-adventure/packages/game-engine/src/__tests__/moderation-skeleton.test.ts` (thêm)

## Ngoài phạm vi
- Bảng confusables TR39 đầy đủ (chỉ dùng bảng thu gọn ở trên), chữ Armenian/Cherokee, chữ số đồng hình (đã bị WP-02 loại).
- Sửa API `wordpacks` hoặc code `apps/`.
- Đổi thứ tự lý do: từ trộn Latin với Cyrillic/Greek như `stυpid`, `cаt` vẫn là `mixed_script` (WM-04, WM-06), dù ví dụ trong issue #14 ghi `stυpid` cạnh luật `blocked`.

## Hành vi không đổi
- WM-01..06 (gồm `stυpid` → `mixed_script`, `stupid҉` → `blocked`) — test hồi quy: `typing-adventure/packages/game-engine/src/__tests__/moderation-v3.test.ts`.
- WP-01..07 (khớp cả từ, `nguyen`/`Nguyễn` không bị chặn bởi `ngu`, `badminton` không bị chặn bởi `bad`, `DEFAULT_BLOCKLIST` giữ 4 mục) — test hồi quy: `typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts` (không sửa assertion), toàn bộ test engine.
- `moderation.ts` không có `import`, chỉ dùng API chuẩn của JS; `ModerationReason` không thêm lý do mới.

## Lịch sử
- v1 2026-10-30 21:28: bản đầu, approved (issue #14). Ví dụ `stυpid` của issue có chữ Latin nên giữ `mixed_script` theo WM-04 (issue yêu cầu WM không đổi); ca `blocked` toàn Cyrillic/Greek dùng `ѕтυріԁ`.
