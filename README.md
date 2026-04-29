# Typing Adventure

Website luyện gõ phím dành cho trẻ em, xây dựng bằng vanilla HTML/CSS/JS thuần. Giao diện nhiều màu sắc, hiệu ứng vui nhộn, hỗ trợ đa ngôn ngữ (Tiếng Việt / English).

## Demo nhanh

Mở `index.html` trong trình duyệt — không cần cài đặt, không cần server.

## Tính năng hiện có

### Chế độ chơi

| Chế độ | Mô tả |
|--------|--------|
| **Cổ điển** | Gõ danh sách từ theo 3 độ khó: Dễ / Vừa / Khó |
| **Bài học** | 5 bài theo nhóm phím: Home Row, Top Row, Bottom Row, Home+Top, Tất cả |
| **Đua tốc độ** | Gõ nhiều từ nhất trong 30s / 60s / 120s |
| **Thử thách** | Từ ngắn dần dài, tốc độ yêu cầu tăng, 3 mạng |

### Bàn phím & hướng dẫn

- Bàn phím ảo QWERTY với viền màu theo ngón tay
- Hình bàn tay SVG highlight ngón tay cần dùng cho phím hiện tại
- Tùy chọn chữ hoa / chữ thường trên bàn phím
- Bật/tắt hướng dẫn ngón tay trong cài đặt

### Âm thanh

- 3 chế độ: Mặc định (beep/buzz) / Đọc chữ cái / Đọc từ
- Oscillator cho phản hồi gõ đúng/sai
- Web Speech API đọc chữ cái và từ tiếng Anh
- Tốc độ đọc tuỳ chỉnh: Chậm / Vừa / Nhanh

### Hệ thống điểm & Engagement

- **Combo Streak**: gõ đúng liên tục tăng combo, gõ sai reset
- **Điểm số**: `correctChars × 10 × comboMultiplier × accuracyBonus`
- **Đánh giá sao** (1-3 sao) dựa trên accuracy và WPM
- **Adaptive Difficulty**: đề xuất lên/xuống level dựa trên 5 lần chơi gần nhất

### Màn hình kết quả

- So sánh với kỷ lục cá nhân (kỷ lục mới / còn bao nhiêu WPM nữa)
- Phân tích chữ cái hay sai nhất + gợi ý luyện tập
- Nút: Chơi lại / Thử level khó hơn / Luyện chữ yếu

### Theo dõi tiến bộ

- Lịch sử 20 lần chơi gần nhất (ngày, level, WPM, accuracy, sao)
- Biểu đồ WPM theo thời gian (SVG)
- Trend: đang tiến bộ / ổn định / cần cải thiện
- Streak ngày chơi liên tiếp

### Huy hiệu (Achievements)

16 huy hiệu mở khoá: lần đầu chơi, streak 3/7/30 ngày, WPM 20/40/60/80/100, accuracy 100%, combo 50, CPS 5, 3 sao tất cả level, 10/50/100 lượt chơi.

### Cá nhân hoá

- Hồ sơ: nhập tên + chọn avatar emoji
- 3 theme: Tối / Sáng / Sắc màu (CSS custom properties)
- Số lượng từ mỗi lượt: 5 / 10 / 15 / 20
- Nhập văn bản tuỳ chỉnh để luyện gõ
- Đa ngôn ngữ giao diện: Tiếng Việt / English

### Hiệu ứng

- Nền sao nhấp nháy
- Particles khi gõ đúng
- Confetti khi hoàn thành
- Animation combo, flash phím, celebration overlay

## Cấu trúc dự án

```
keyboad_with_sound/
├── index.html      (351 dòng)  — Cấu trúc HTML, panels, modals
├── style.css       (2151 dòng) — Toàn bộ CSS, 3 themes, responsive
├── app.js          (2199 dòng) — Logic game, i18n, storage, sound
├── plan.txt                    — Kế hoạch phát triển chi tiết
└── README.md                   — File này
```

## Dữ liệu lưu trữ

Tất cả dùng `localStorage`, không cần backend:

| Key | Nội dung |
|-----|----------|
| `typingAdventure_settings` | Theme, keyboard case, speech rate, word count, finger guide, profile |
| `typingAdventure_history` | Tối đa 100 records gần nhất |
| `typingAdventure_records` | Best WPM/accuracy theo level, tổng games/words, streak |

## Responsive

- Desktop ưu tiên (bàn phím vật lý)
- Mobile breakpoints: 700px, 480px
- Bàn phím ảo responsive, ẩn bớt stats trên màn nhỏ

## Trình duyệt hỗ trợ

- Chrome (khuyến nghị)
- Safari
- Firefox

## Kế hoạch phát triển

Xem chi tiết trong [plan.txt](plan.txt). Tóm tắt các giai đoạn:

1. **Nền tảng dữ liệu** — localStorage cho settings, history, records
2. **Điểm & Engagement** — Combo, scoring, đánh giá sao
3. **Kết quả chi tiết** — So sánh kỷ lục, phân tích lỗi
4. **Mở rộng Settings** — Speech rate, word count, themes
5. **Chế độ chơi** — Bài học, đua tốc độ, thử thách
6. **Theo dõi tiến bộ** — Lịch sử, biểu đồ, streak
7. **Hoàn thiện** — Huy hiệu, hồ sơ, adaptive difficulty, mobile

> Giai đoạn 1-6 đã hoàn thành. Giai đoạn 7 đã hoàn thành phần lớn (huy hiệu, hồ sơ, adaptive difficulty, hướng dẫn ngón tay nâng cao).

## Nguyên tắc kỹ thuật

- Vanilla HTML/CSS/JS — không framework, không build tool
- Mọi dữ liệu lưu client-side (localStorage)
- Ưu tiên trải nghiệm trẻ em: màu sắc, animation, âm thanh vui
- Mỗi giai đoạn triển khai độc lập, không phụ thuộc chéo

## Bắt đầu

```bash
# Clone repo
git clone <repo-url>

# Mở trong trình duyệt
open index.html
```

Không cần `npm install`, không cần server. Chỉ cần trình duyệt.
