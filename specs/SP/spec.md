# SP · Từ chối kết quả chơi đơn không thể đạt được

Trạng thái: approved
Lesson/PR: không · BACKLOG: không

## Bối cảnh
`POST /api/sessions` chỉ kiểm `wpm`, `score` ≥ 0, không có trần và không đối chiếu các số với nhau. Client gửi số nào cũng vào `GameSession`, `UserRecord.bestWpm/bestScore` và leaderboard (xếp theo `score`). E2E 2026-10-30: bot gõ 40 ms/ký tự được lưu 245 WPM. Multiplayer đã có anti-cheat (`MAX_WPM = 200`), chơi đơn thì không. Server không có keystroke nên chỉ chặn được kết quả **không thể** sinh ra bởi engine.

## Requirements
Ký hiệu: `nMax = floor((cps + 0.005) × (timeSeconds + 0.05)) + 1` (số ký tự đúng tối đa, bù làm tròn `cps` 2 chữ số, `timeSeconds` 1 chữ số, +1 cho phím đầu tiên trước khi timer chạy). `scoreMax = round(getAccuracyBonus(accuracy) × Σ_{c=1..nMax} (10 + min(c, maxCombo)))`. Hàm thuần `checkSessionPlausibility(result)` trong `packages/game-engine` trả `null` (hợp lệ) hoặc chuỗi lý do.

| ID | EARS | Test |
|---|---|---|
| SP-01 | IF `wpm > MAX_WPM` (200, dùng chung với anti-cheat multiplayer) THEN THE SYSTEM SHALL trả lý do khác `null` | `typing-adventure/packages/game-engine/src/__tests__/session-plausibility.test.ts` |
| SP-02 | IF `|wpm − 12 × cps| > 1` THEN THE SYSTEM SHALL trả lý do khác `null` | `session-plausibility.test.ts` |
| SP-03 | IF `maxCombo > nMax` THEN THE SYSTEM SHALL trả lý do khác `null` | `session-plausibility.test.ts` |
| SP-04 | IF `score > scoreMax` THEN THE SYSTEM SHALL trả lý do khác `null`; `score = scoreMax` thì hợp lệ | `session-plausibility.test.ts` |
| SP-05 | WHEN kết quả do `calculateResult` sinh ra từ một ván chơi thật bằng `processKeypress` (classic không lỗi, có lỗi giữa chừng, tốc độ ≤ 200 WPM) THE SYSTEM SHALL trả `null` | `session-plausibility.test.ts` |
| SP-06 | IF body `POST /api/sessions` vi phạm SP-01..04 THEN THE SYSTEM SHALL trả 400 `{ success: false, error: 'Implausible session result' }` và không ghi `gameSession` lẫn `userRecord` | `typing-adventure/apps/web/src/app/api/sessions/__tests__/sessions-plausibility.test.ts` |
| SP-07 | WHEN body hợp lệ và qua SP-01..04 THE SYSTEM SHALL lưu như cũ: 200, gọi `gameSession.create` một lần với đúng `wpm`, `score` | `sessions-plausibility.test.ts` |

File dự kiến: `typing-adventure/packages/game-engine/src/plausibility.ts` (thêm), `typing-adventure/packages/game-engine/src/index.ts` (sửa: export `checkSessionPlausibility`, `MAX_WPM`), `typing-adventure/apps/web/src/app/api/sessions/route.ts` (sửa: `superRefine` gọi engine), `typing-adventure/apps/web/src/lib/multiplayer/anti-cheat.ts` (sửa: lấy `MAX_WPM` từ engine thay vì hằng cục bộ). Test: 2 file ở bảng trên (thêm).

## Ngoài phạm vi
- Trần `timeSeconds` / độ dài văn bản: văn bản tuỳ chỉnh không giới hạn độ dài, server không biết văn bản, nên kẻ gian vẫn khai được kết quả "chậm mà lâu" trong biên độ con người. Chặn triệt để cần gửi keystroke log hoặc server cấp văn bản.
- Dọn dữ liệu đã lưu trước đây (vd 2 user e2e 245 WPM).
- Hiển thị lỗi 400 trên UI: client đã chuyển `syncStatus` sang `offline` khi lưu thất bại.

## Hành vi không đổi
- 401 khi chưa đăng nhập, 429 khi vượt 30 lần/phút, lỗi Zod cũ (vd `accuracy` > 100) vẫn trả message Zod đầu tiên — test hồi quy: SP-06/SP-07 dùng cùng route; `typing-adventure/apps/web/src/lib/__tests__/api-response.test.ts`.
- Anti-cheat multiplayer giữ ngưỡng 200 WPM, chỉ đổi nguồn hằng số.
- `GET /api/sessions` không đổi.

## Lịch sử
- v1 2026-10-30 22:44: bản đầu, approved.
