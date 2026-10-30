# <ID> · <tên feature>

Trạng thái: draft
Lesson/PR: <LNN hoặc #PR> · BACKLOG: <#n hoặc "không">

## Bối cảnh
<2–3 dòng: vấn đề hiện tại, ai bị ảnh hưởng, vì sao làm bây giờ>

## Requirements
EARS: `WHEN <sự kiện> THE SYSTEM SHALL <phản hồi>` · `WHILE <trạng thái> …` · `WHERE <cấu hình> …` · `IF <điều kiện xấu> THEN THE SYSTEM SHALL …`. Mỗi dòng một hành vi đo được (số, status, chuỗi), tối đa 7 dòng.

| ID | EARS | Test |
|---|---|---|
| <ID>-01 | WHEN … THE SYSTEM SHALL … | `<file test>` |

File dự kiến: `<đường dẫn>` (thêm|sửa), … (spec có mục này thì không cần plan riêng)

## Ngoài phạm vi
- <thứ cố ý không làm>

## Hành vi không đổi
- <hành vi giữ nguyên> — test hồi quy: `<file test đang có>`

## Lịch sử
- v1 <`date '+%F %H:%M'` ngay trước commit spec>: bản đầu, approved.
