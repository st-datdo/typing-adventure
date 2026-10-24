# Chế độ Bé (3–5 tuổi) và Hồ sơ theo độ tuổi — Thiết kế

Ngày: 2026-10-24 · Nhánh: `feat/little-mode`

## 1. Ý định

Typing Adventure hiện được làm cho trẻ đã biết đọc: màn hình đầy chỉ số (WPM, CPS, độ chính xác, điểm, combo, mạng, đồng hồ), từ tiếng Anh không có hình, giọng đọc chỉ tiếng Anh, âm thanh là tiếng "bíp" tổng hợp và tiếng rè khi gõ sai. Người dùng thực tế đầu tiên là một bé 4 tuổi chưa biết đọc; bé chơi khoảng 20 phút và cần bố mẹ ngồi cạnh đọc giúp và chỉ phím.

**Mục tiêu thành công (chủ dự án chốt):** bé háo hức quay lại mỗi ngày. Không phải giữ bé ngồi lâu.

**Học gì (chủ dự án chốt):** tiếng Anh — chữ cái và từ tiếng Anh.

**Mở rộng (chủ dự án đề xuất):** cài đặt theo độ tuổi để phân bổ chức năng phù hợp.

Chủ dự án giao toàn quyền quyết định thiết kế cho người làm; các mục đánh dấu *(quyết định của người làm)* là lựa chọn của người làm, chưa được chủ dự án duyệt riêng.

## 2. Mục tiêu / Không làm / Tuyệt đối tránh

**Mục tiêu đợt 1**
- Hồ sơ theo độ tuổi: `little` (3–5), `kid` (6–8), `big` (9+). Chọn một lần khi vào app, đổi được sau (qua khóa bố mẹ ở chế độ Bé, qua Cài đặt ở chế độ khác).
- Chế độ Bé: app tự nói, tự chỉ phím, có hình cho mỗi chữ; bé chơi được mà bố mẹ chỉ cần ngồi cổ vũ.
- Lượt chơi ngắn (3 chặng × 4 mục, khoảng 5–8 phút), kết thúc rõ ràng bằng sticker mới và lời hẹn ngày mai.
- Giới hạn số lượt mỗi ngày (mặc định 2), mở thêm qua khóa bố mẹ.
- Góc bố mẹ: chữ bé đã thuộc, số lượt hôm nay/tổng, giới hạn lượt/ngày, đổi độ tuổi, bật/tắt âm thanh, thử giọng đọc, xóa tiến độ.
- Âm thanh dịu hơn cho mọi chế độ: tiếng sai không còn gắt.
- Chế độ `kid`: ẩn chỉ số tốc độ (CPS/WPM/kỷ lục WPM), chỉ còn Cổ điển và Bài học, ẩn Bảng xếp hạng/Bạn bè/Đua nhiều người.

**Không làm trong đợt 1**
- Thú cưng lớn dần, thế giới/bản đồ nhiều đảo.
- Đồng bộ tiến độ chế độ Bé lên server (đợt 1 chỉ lưu localStorage, như guest mode). Không thay đổi schema Prisma.
- File hình/âm thanh thu sẵn. Đợt 1 dùng emoji + CSS/SVG, Web Audio tổng hợp, và giọng đọc có sẵn của trình duyệt *(quyết định của người làm: không phụ thuộc tải file, không vướng bản quyền; có thể thay bằng file thu âm ở đợt sau)*.
- Thay đổi multiplayer, admin, API ngoài việc thêm `ageGroup` vào schema settings.

**Tuyệt đối tránh (anti-goals)**
- Phạt lỗi: không mạng, không màn hình đỏ, không âm thanh gắt, không trừ điểm.
- Áp lực thời gian: không đồng hồ, không đếm ngược trong chế độ Bé.
- So sánh: không bảng xếp hạng, không điểm số trong chế độ Bé.
- Cơ chế gây nghiện: không phần thưởng ngẫu nhiên kiểu loot box, không "chơi thêm để nhận thưởng", không thông báo dụ quay lại, không nhân vật buồn/ốm khi bé nghỉ chơi.
- Màn hình rối: không chữ dài, không nhiều nút nhỏ.

## 3. Cơ sở tâm lý trẻ em áp dụng

| Nguyên tắc | Áp dụng |
|---|---|
| Thời lượng tập trung tuổi 4 ≈ 8–12 phút | Lượt 5–8 phút, 3 chặng có mốc rõ |
| Hỗ trợ đỡ dần (scaffolding, vùng phát triển gần) | Gợi ý tăng dần khi bé để yên: 4s nhắc lại + phím nhấp nháy mạnh, 8s hiện bàn tay chỉ vào phím |
| Trẻ mẫu giáo mê quan hệ nhân–quả | Mỗi phím đúng có hiệu ứng hình + âm thanh; mỗi phím chữ có nốt nhạc riêng |
| Học không lỗi (errorless learning) | Gõ sai chỉ có tiếng "boing" vui và gợi ý lại |
| Khen nỗ lực, không khen tài năng (Dweck) | Lời khen thay đổi: "Con kiên trì quá!", "Con tìm ra rồi!"; kết thúc nói số chữ đã tìm được |
| Lặp lại có giãn cách | Mỗi lượt ôn chữ cũ trước, giới thiệu 1–2 chữ mới, rồi trộn |
| Sưu tầm là động lực mạnh ở 4–6 tuổi | Album sticker, mỗi lượt 1 sticker xác định trước (không ngẫu nhiên kiểu cờ bạc) |
| Điểm dừng tự nhiên + hướng dẫn WHO ≤1h màn hình/ngày cho 3–4 tuổi | Nhân vật "đi ngủ"; giới hạn lượt/ngày; chơi thêm cần bố mẹ |
| Trẻ chưa biết đọc | Mọi chỉ dẫn bằng giọng nói + hình; chữ trên màn hình rất ít và to |

## 4. Trải nghiệm

### 4.1 Chọn độ tuổi (lần đầu)
Màn hình 3 thẻ to: 🐣 "3–5 tuổi · Bé mới tập", 🐥 "6–8 tuổi · Bé đã biết đọc", 🦅 "9+ tuổi · Tay đua". Bố mẹ chọn. Chưa chọn (`ageGroup === null`) thì luôn hiện màn này. Người dùng cũ (settings lưu từ trước) cũng thấy màn này một lần.

### 4.2 Chế độ Bé — các màn
- **Nhà:** cú Tí 🦉 vẫy chào, giọng nói "Chào con! Mình cùng đi tìm chữ nhé!". Nút ▶ rất to, nút 📒 album, nút 🔒 Bố mẹ nhỏ ở góc (giữ 3 giây để mở). Nếu đã hết lượt hôm nay: cú ngủ 💤, "Cú Tí ngủ rồi, mai mình chơi tiếp nhé!", chỉ còn album và khóa bố mẹ.
- **Chơi:** đường 3 chặng (⭐ đã xong, chặng hiện tại phát sáng, 🎁 cuối). Cú + bong bóng thoại. Thẻ to: emoji, chữ cái to, từ tiếng Anh với chữ đang tìm được tô màu. Bàn phím ảo to chỉ gồm 3 hàng chữ a–z (không số, không ký tự); phím cần bấm phóng to và phát sáng, các phím khác mờ. Bấm phím vật lý hoặc chạm phím ảo đều được.
  - Mục chữ cái: giọng "Con tìm chữ…" (vi) rồi "B. B for bear." (en).
  - Mục từ (chặng 3, khi đã có từ ghép được từ chữ bé đã thuộc): giọng "Mình gõ chữ…" rồi "cat"; gõ từng chữ; mỗi chữ đúng đọc tên chữ; xong từ đọc lại cả từ.
  - Đúng: nốt nhạc của chữ + emoji của mục bật ra bay lên (hiệu ứng burst), cuối mục thêm lời khen.
  - Sai: tiếng "boing", phím đúng rung/nhấp nháy, không đổi tiến độ.
  - Để yên: 4s → nói lại lời gợi ý + phím đúng nhấp nháy mạnh; 8s → bàn tay 👇 nhún nhảy trên phím đúng.
- **Kết thúc lượt:** pháo giấy, cú khen "Con giỏi quá! Con đã tìm được N chữ!", sticker mới bay vào album, hàng album nhỏ. Nút "Chơi lượt nữa" nếu còn lượt hôm nay; nếu hết lượt, cú đi ngủ và nút chơi thêm nằm sau khóa bố mẹ.
- **Album:** lưới tất cả sticker (đã có hiện emoji, chưa có hiện ô "?"); chạm sticker → đọc tên tiếng Anh.
- **Góc bố mẹ:** mở bằng giữ nút 3 giây (có vòng tiến độ). Nội dung như mục 2.

### 4.3 Giọng nói
- Lời dẫn theo `settings.lang` (vi mặc định), chữ/từ luôn tiếng Anh (`en-US`).
- Chọn voice theo ngôn ngữ (ưu tiên local). Không có voice tiếng Việt thì bỏ phần lời dẫn tiếng Việt, chỉ đọc phần tiếng Anh *(quyết định của người làm: voice tiếng Anh đọc tiếng Việt nghe rất tệ)*.
- Câu nói được xếp hàng (không cắt nhau) trong một lần gọi; lần gọi mới hủy hàng cũ.

### 4.4 Âm thanh (Web Audio tổng hợp)
- `note(letter)`: mỗi chữ một nốt trong thang ngũ cung (C D E G A qua 2 quãng tám) — bàn phím thành đàn.
- `pop` (đúng), `boing` (sai, sine trượt xuống nhẹ), `sparkle` (xong mục), `fanfare` (xong lượt), `sticker` (nhận sticker).
- `wrong` của chế độ thường đổi sang tiếng dịu (triangle, âm lượng thấp) cho mọi độ tuổi.

### 4.5 Hình ảnh
- Font bo tròn hỗ trợ tiếng Việt: Baloo 2 qua `next/font/google` (subset `latin`, `vietnamese`), chỉ áp dụng cho chế độ Bé và màn chọn tuổi.
- Bảng màu sáng ấm: nền trời xanh nhạt → vàng kem, nút cam/xanh lá, bóng đổ "nút kẹo" phía dưới. Độ tương phản chữ ≥ 4.5:1.
- Hiệu ứng ≤ 1s; tôn trọng `prefers-reduced-motion` (tắt bay/nhún, giữ đổi màu).
- Vùng chạm tối thiểu 56px.

## 5. Nội dung

- **26 thẻ chữ** (chữ, từ tiếng Anh, emoji): a apple 🍎, b bear 🐻, c cat 🐱, d dog 🐶, e egg 🥚, f fish 🐟, g grapes 🍇, h hat 🎩, i ice cream 🍦, j juice 🧃, k kite 🪁, l lion 🦁, m moon 🌙, n nose 👃, o orange 🍊, p pig 🐷, q queen 👑, r rabbit 🐰, s sun ☀️, t tiger 🐯, u umbrella ☂️, v van 🚐, w whale 🐳, x fox 🦊 (chữ x ở cuối), y yo-yo 🪀, z zebra 🦓.
- **Thứ tự học** *(quyết định của người làm, theo nhóm âm của Jolly Phonics)*: s a t p i n m d g o c k e u r h b f l j v w x y z q.
- **Từ ngắn có hình** (CVC, chỉ dùng khi mọi chữ trong từ đã thuộc): cat 🐱, dog 🐶, sun ☀️, hat 🎩, pig 🐷, bus 🚌, cup 🥤, bed 🛏️, hen 🐔, fox 🦊, box 📦, ant 🐜, bat 🦇, map 🗺️, pan 🍳, net 🥅, pin 📌, mop 🧹, cow 🐮, bee 🐝, owl 🦉, web 🕸️. Tiêu chí: từ 3 chữ, đồ vật/con vật bé nhận ra, emoji hiển thị tốt trên macOS/Windows/Android.
- **Sticker**: 30 emoji con vật/đồ vật dễ thương, cấp theo thứ tự cố định (sticker thứ N của bé luôn giống nhau) — không ngẫu nhiên.
- **Lời khen** (vi/en, i18n): ít nhất 6 câu khen nỗ lực, xoay vòng.

## 6. Quy tắc lượt chơi (thuộc `packages/game-engine`, pure, có test)

- **Tiến độ chữ** `LetterProgress = Record<letter, { seen, firstTry }>`. Chữ "thuộc" khi `firstTry >= 3`.
- **Tạo lượt** `buildLittleSession(progress, rng)` → 3 chặng × 4 mục:
  - Chặng 1 (ôn): chữ đã thuộc hoặc đã gặp; nếu chưa có chữ nào, dùng 2 chữ đầu trong thứ tự học.
  - Chặng 2 (mới): 1–2 chữ tiếp theo chưa thuộc trong thứ tự học, xen với chữ đã gặp; mỗi chữ mới xuất hiện ít nhất 2 lần.
  - Chặng 3 (trộn): nếu có từ CVC ghép được hoàn toàn từ chữ đã thuộc → 2 mục từ + 2 mục chữ; nếu không → 4 mục chữ trộn.
  - Không có hai mục liền nhau giống hệt.
  - `rng` được inject (quy tắc dự án: không gọi `Math.random` trực tiếp trong engine).
- **Máy trạng thái** `createLittleState(session)` / `littleKeypress(state, char)` → `{ state, outcome }`, outcome ∈ `wrong | char | item | stage | session`. Không phân biệt hoa/thường. Ký tự ngoài a–z bị bỏ qua (outcome `ignored`).
  - Mỗi mục ghi nhận "đúng ngay lần đầu" nếu không có lần sai nào trong mục; mục từ ghi nhận cho từng chữ.
- **Gợi ý** `getHintLevel(idleMs)` → 0 (<4000), 1 (<8000), 2.
- **Giới hạn ngày** `canStartLittleSession(daily, today, limit, unlockedExtra)`; `daily = { date, sessions }`; ngày đổi thì reset.
- **Sticker** `nextSticker(collectedCount)` theo thứ tự cố định; hết danh sách thì lặp lại từ đầu.
- **Lời khen** `pickPraiseIndex(count, rng)` tránh lặp câu vừa dùng.
- **Hồ sơ tuổi** `AGE_PROFILES[ageGroup]` = `{ allowedModes, showSpeedStats, social }`:
  - little: `[]`, false, false (dùng màn chế độ Bé)
  - kid: `['classic','lesson']`, false, false
  - big: tất cả mode, true, true

## 7. Ràng buộc kỹ thuật

- Engine thuần TS, không React/DOM/Node; mọi logic mới có test Vitest trong `src/__tests__/`.
- i18n: mọi key mới có ở cả `vi.ts` và `en.ts`.
- Lưu trạng thái chế độ Bé bằng Zustand `persist` (store mới `little-store`, key `typingAdventure_little`).
- `ageGroup` thêm vào `settings-store` (persist + sync server như các setting khác) và Zod schema của `PUT /api/users/me/settings`.
- Không thêm dependency npm mới (ngoài `next/font` đã có sẵn trong Next).
- Không thêm comment/Javadoc vào code (quy định của chủ dự án).
- Middleware bảo vệ route không đổi; ở `kid` chỉ ẩn link, không chặn route.
- Kiểm tra: `pnpm test`, `npx tsc --noEmit -p apps/web`, `pnpm lint` (0 lỗi), `pnpm build`.

## 8. Để người làm tự quyết

Cấu trúc component, tên file CSS/class, giá trị âm thanh cụ thể, câu chữ lời dẫn/lời khen, danh sách sticker, layout responsive, cách làm vòng tiến độ của nút giữ 3 giây.

## 9. Đợt sau (gợi ý)

Thú cưng lớn dần theo ngày (không bao giờ buồn/ốm), bản đồ đảo theo nhóm chữ, đồng bộ tiến độ Bé lên server, giọng đọc thu âm thật thay TTS, trò chơi nhỏ cho `kid` (bắt bóng chữ, từ có hình), báo cáo tuần cho bố mẹ.
