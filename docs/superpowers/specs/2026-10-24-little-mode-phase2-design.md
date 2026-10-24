# Chế độ Bé đợt 2 — Thú cưng, Bản đồ đảo, Giọng thu âm, Đồng bộ, Mini-game 6–8 tuổi

Ngày: 2026-10-24 · Nhánh: `feat/little-mode-phase2` · Tiếp nối `2026-10-24-little-mode-design.md`

Chủ dự án chọn bỏ qua phần hỏi đáp ("bắt tay làm luôn"). Mọi quyết định dưới đây là **quyết định của người làm**, chưa được chủ dự án duyệt riêng. Mọi anti-goal của đợt 1 vẫn giữ nguyên.

## 1. Phạm vi

| Tính năng | Dành cho | Ghi chú |
|---|---|---|
| Thú cưng lớn dần mỗi ngày | `little` | Không bao giờ buồn, ốm hay nhỏ lại |
| Bản đồ đảo theo nhóm chữ | `little` | Hiển thị tiến độ; không đổi thuật toán tạo lượt |
| Giọng thu âm thật | `little` + mini-game | Hạ tầng phát file + fallback TTS; file thu âm do chủ dự án cung cấp |
| Đồng bộ tiến độ lên server | `little` + mini-game | Chỉ khi đăng nhập; khách vẫn dùng localStorage |
| Mini-game | `kid` (cũng mở cho `big`) | Bắt bóng chữ, Từ có hình |

## 2. Thú cưng

- Lần đầu vào nhà, bé chọn 1 trong 3 quả trứng (🐱 mèo, 🐶 cún, 🦕 khủng long).
- `PetState = { kind, days, lastDay }`. Mỗi **ngày** có ít nhất một lượt chơi xong thì `days + 1` (tối đa 1 lần/ngày, chơi thêm lượt không lớn nhanh hơn, nên không thành "chơi thêm để nhận thưởng").
- Nghỉ chơi không bị trừ gì; thú cưng không có trạng thái buồn/đói/ốm. Khi hết lượt trong ngày, thú cưng ngủ cùng cú Tí.
- Giai đoạn theo số ngày: 0 trứng → 1 nở → 3, 5, 8, 12, 17, 23, 30 lớn dần (to hơn + phụ kiện 🎀 🎩 👑 ✨). Sau mốc cuối giữ nguyên.
- Chạm vào thú cưng thì nó nhún và kêu một tiếng vui.

## 3. Bản đồ đảo

Năm đảo theo đúng thứ tự `LETTER_ORDER` (nhóm Jolly Phonics):

| Đảo | Chữ |
|---|---|
| ☀️ Đảo Mặt Trời | s a t p i n |
| 🌳 Đảo Rừng Xanh | m d g o c k |
| 🍭 Đảo Kẹo Ngọt | e u r h b f |
| 🐳 Đảo Cá Voi | l j v w |
| ⭐ Đảo Ngôi Sao | x y z q |

- Đảo xong khi mọi chữ đã thuộc. Đảo hiện tại là đảo đầu tiên chưa xong (có thuyền ⛵). Đảo phía sau bị mây che, không có ổ khóa.
- Hết lượt mà mở được đảo mới: màn kết thúc có thêm lời "Con đã đến đảo mới!".
- Thuật toán tạo lượt không đổi, vì nó đã đi theo `LETTER_ORDER`.

## 4. Giọng thu âm

- Mỗi câu nói có `clip` id. File đặt ở `apps/web/public/voice/{vi|en}/{id}.mp3`; `public/voice/manifest.json` liệt kê id đã có (để không gọi 404).
- Có clip thì phát file, chưa có hoặc phát lỗi thì dùng giọng máy cho câu đó. Câu nói được xếp hàng tuần tự (file và TTS xen nhau được).
- Script `apps/web/scripts/voice-clips.ts`: in danh sách câu cần thu (CSV) và tạo lại `manifest.json` từ file có trong thư mục.
  - `pnpm --filter @typing-adventure/web voice:clips list > clips.csv` (249 câu: chữ cái, thẻ chữ, từ, lời dẫn vi/en)
  - Thả file `.mp3` vào `public/voice/vi|en/`, rồi chạy `pnpm --filter @typing-adventure/web voice:clips manifest`
- Góc bố mẹ hiện số câu đã có giọng thu âm.

## 5. Đồng bộ

- Model mới `ChildProgress { userId @unique, data Json }`. API `GET/PUT /api/users/me/progress`.
- `data = { little: { progress, stickers, daily, dailyLimit, pet }, games: { best, plays }, updatedAt }`.
- Gộp (thuần, có test, chạy ở cả client lẫn server): tiến độ chữ lấy max, sticker lấy danh sách dài hơn (thứ tự cố định), lượt trong ngày lấy ngày mới hơn hoặc max nếu cùng ngày, thú cưng lấy con nhiều ngày hơn, kỷ lục game lấy max, `dailyLimit` theo bản mới hơn.
- Đăng nhập: tải server → gộp với local → ghi lại. Mỗi thay đổi đẩy lên sau 1,5 giây. "Xóa tiến độ" ở góc bố mẹ ghi đè server (`replace: true`).
- Hạn chế đã biết: chơi cùng ngày trên 2 máy thì số lượt hôm nay lấy max, không cộng dồn.

## 6. Mini-game (6–8 tuổi)

Trang `/games`, link "🎮 Trò chơi" trong SideNav (ẩn ở `little`). Giao diện dùng lại phong cách sáng ấm của chế độ Bé.

- **Bắt bóng chữ:** bóng mang chữ bay lên; gõ đúng chữ thì bóng nổ (bóng cao nhất được ưu tiên). Bóng bay mất thì không bị phạt. Bắt đủ 20 bóng là xong. Tốc độ tăng nhẹ theo số bóng đã bắt. Sao: ≤2 bóng bay mất 3★, ≤6 2★, còn lại 1★.
- **Từ có hình:** hình + giọng đọc từ tiếng Anh, bé gõ từng chữ vào ô. 8 từ một lượt, xếp từ ngắn đến dài. Sai thì "boing", không chuyển ô. Để yên 5 giây hoặc sai 2 lần thì hiện mờ chữ cần gõ. Sao theo tỉ lệ từ đúng ngay lần đầu (≥85% 3★, ≥50% 2★).
- Không mạng, không đếm ngược, không bảng xếp hạng. Chỉ lưu kỷ lục sao và số lần chơi của chính bé.

## 7. Ràng buộc

Như đợt 1: engine thuần TS có test, i18n đủ vi/en, không thêm dependency, không comment trong code. Kiểm tra bằng `pnpm test`, `tsc`, `pnpm lint`, `pnpm build`.
