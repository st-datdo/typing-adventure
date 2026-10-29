# Plan: <tên task>

Trạng thái: draft
Lesson/PR: <LNN hoặc #PR>

## Mục tiêu
- <1-3 gạch: kết quả người dùng/hệ thống thấy được>

## Ngoài phạm vi
- <thứ cố ý không làm, để reviewer không hỏi>

## File thay đổi (dự đoán)
- `<đường dẫn từ gốc repo>` (thêm|sửa)

## Interface chạm tới
- Hàm export: `<chữ ký>`
- HTTP: <route, status, header>
- Env / dependency mới: <tên hoặc "không">

## Verify
```bash
<lệnh cụ thể, kết quả mong đợi>
```

## Tự review
1. Đoán được diff chưa? <có/không, file nào còn mơ hồ>
2. Interface nào người khác đang dùng? <caller hiện có>
3. Rollback thế nào? <revert commit / tắt cờ>

## Lịch sử
- v1 <giờ từ `date '+%F %H:%M'`, chạy ngay trước khi commit plan; không ước lượng>: bản đầu.
- v2 <`date '+%F %H:%M'`>: <đổi gì, vì sao> (sửa Lịch sử trước khi sửa code).

## Thực tế
<điền sau khi code: file thật, 3 nhóm khớp / dự đoán mà không đổi / đổi mà không dự đoán, tỉ lệ khớp, design round 2>
