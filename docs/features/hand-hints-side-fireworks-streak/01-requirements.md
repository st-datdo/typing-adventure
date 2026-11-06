# HF · Tay gợi ý hai bên bàn phím, lời khen chuỗi ra hai bên kèm pháo hoa — Requirements

Trạng thái: approved
Slug: hand-hints-side-fireworks-streak

## Bối cảnh
Trên màn chơi `GameEngine`, hai bàn tay gợi ý ngón nằm dưới bàn phím ảo nên thường bị đẩy xuống dưới mép màn hình, trẻ phải cuộn mới thấy. Nhãn ăn mừng chuỗi (combo) "x10 / Siêu quá!" hiện đè lên giữa vùng chữ cần gõ, che đúng chữ trẻ đang nhìn. Người dùng muốn đưa tay gợi ý ra hai bên bàn phím, đưa nhãn khen ra hai bên vùng chữ, và bắn pháo hoa hai bên mỗi lần đạt mốc chuỗi mới, mốc càng cao pháo hoa càng dày. Áp dụng cho cả guest và user đăng nhập, cả `vi` và `en` (thuần giao diện, không đổi dữ liệu).

## Hiện trạng
- Thứ tự khối trong `main`: StatsBar → `word-stage` (WordDisplay + ComboBurst) → Keyboard → HandGuide → GuestBanner, xếp dọc (`typing-adventure/apps/web/src/components/game/GameEngine.tsx:443-458`, `.main` flex-direction column, max-width 1000px ở `typing-adventure/apps/web/src/styles/game.css:172-180`).
- HandGuide là một khối riêng dưới bàn phím: 2 SVG tay trái/phải, nhãn tên ngón (`finger-label`) đặt giữa hai tay; ẩn hoàn toàn khi `settings.fingerGuide === false` (`typing-adventure/apps/web/src/components/game/HandGuide.tsx:25-76`; CSS `typing-adventure/apps/web/src/styles/game.css:633-651`, `716-735`; mobile ≤ 640px `game.css:1372-1382`).
- Ngón được tô sáng lấy từ `getFingerForKey(text[currentIndex])`; phím cách tô cả hai ngón cái (`HandGuide.tsx:31-42`).
- Bàn phím ảo max-width 820px, nằm giữa (`game.css:493-508`); khi `fingerGuide` tắt thì bàn phím thêm class `keyboard--hide-fingers` (`typing-adventure/apps/web/src/components/game/Keyboard.tsx:79`).
- Mốc combo là `COMBO_MILESTONES = [5, 10, 20, 50]` (`typing-adventure/packages/game-engine/src/scoring.ts:5`). Gõ sai đặt `combo = 0` (`typing-adventure/packages/game-engine/src/engine.ts:141`).
- Khi chạm mốc, `useGameEngine` gọi `celebrate(combo)`; khi ván kết thúc gọi `finish()` xoá nhãn; khi `startTime` về null (ván mới) gọi `clear()` (`typing-adventure/apps/web/src/hooks/useGameEngine.ts:42-44`, `95-98`). Trạng thái ở `typing-adventure/apps/web/src/stores/combo-celebration-store.ts`, logic thuần ở `typing-adventure/apps/web/src/lib/kr/combo-celebration.ts` (`COMBO_BURST_MS = 1200`).
- `ComboBurst` vẽ một nhãn "x{mốc}" + câu khen + 8 hạt `combo-spark` tại tâm `word-stage` (`position:absolute; top:50%; left:50%`), tức là đè lên chữ cần gõ (`typing-adventure/apps/web/src/components/game/ComboBurst.tsx:20-37`, `typing-adventure/apps/web/src/styles/decor.css:83-169`). Reduced motion thì bỏ hạt, giữ nhãn (`ComboBurst.tsx:24`, `decor.css:284-288`). Test hiện có khẳng định đúng 8 hạt (`typing-adventure/apps/web/src/components/game/__tests__/ComboBurst.test.tsx:7-18`).
- Câu khen: `comboPraise5/10/20/50` = "Giỏi lắm!/Siêu quá!/Cực đỉnh luôn!/Vô địch gõ phím!" và "Nice job!/Super!/Amazing!/Typing champion!" (`typing-adventure/packages/i18n/src/vi.ts:332-336`, `en.ts:332-336`). Đọc cho trình đọc màn hình qua `ComboAnnouncer` (`aria-live="polite"`, `ComboAnnouncer.tsx:17`).
- Yêu cầu nền từ KR còn hiệu lực: KR-09 (ăn mừng mốc), KR-14 (reduced motion), KR-15 (không mất phím), KR-16 (máy yếu), KR-20 (responsive) trong `docs/features/kid-friendly-ui-redesign/01-requirements.md:86-160`.
- Chế độ Little (`LittleMode`) và trang đua `/race/[roomId]` không dùng HandGuide hay ComboBurst (chỉ `GameEngine.tsx` import).

## User stories
- **US-1**: Là trẻ đang luyện gõ, tôi muốn thấy hai bàn tay gợi ý ngay hai bên bàn phím mà không phải cuộn, để biết dùng ngón nào trong lúc nhìn bàn phím.
- **US-2**: Là trẻ đang luyện gõ, tôi muốn lời khen chuỗi hiện ở hai bên chứ không đè lên chữ, để vẫn đọc được chữ cần gõ và không bị đứt chuỗi.
- **US-3**: Là trẻ đang luyện gõ, tôi muốn thấy pháo hoa bắn lên hai bên mỗi khi đạt mốc chuỗi mới, càng dài càng nhiều pháo hoa, để có động lực giữ chuỗi.
- **US-4**: Là phụ huynh/giáo viên dùng máy yếu, máy tính bảng hoặc trẻ nhạy cảm với chuyển động, tôi muốn hiệu ứng không làm chậm gõ, không tràn màn hình hẹp và tắt được chuyển động theo cài đặt hệ thống.

## Acceptance criteria

### HF-01 · Hai tay gợi ý nằm hai bên bàn phím trên màn rộng (US-1)
- **Given** màn chơi `GameEngine`, `fingerGuide === true`, viewport rộng ≥ 1024px (đo ở 1024×768, 1280×720, 1440×900), ván chưa bắt đầu hoặc đang chơi
- **When** trang render xong (sau khi animation vào màn kết thúc)
- **Then** SVG tay trái (`.hand-left`) nằm hoàn toàn bên trái bàn phím (`hand.right ≤ keyboard.left`) và SVG tay phải (`.hand-right`) nằm hoàn toàn bên phải (`hand.left ≥ keyboard.right`), theo `getBoundingClientRect()`.
- **And** khoảng dọc của mỗi tay giao với khoảng dọc của bàn phím (`hand.top < keyboard.bottom` và `hand.bottom > keyboard.top`), tức là cùng hàng với bàn phím, không còn khối tay riêng phía dưới.
- **And** ở 1280×720 và 1440×900 khi `window.scrollY === 0`, cả hai tay và toàn bộ bàn phím nằm trong viewport (`rect.bottom ≤ window.innerHeight`).
- **And** không có cuộn ngang (`document.documentElement.scrollWidth ≤ clientWidth`), hai tay không che phím nào (bounding box của tay không giao với bounding box của bất kỳ `.key`).

### HF-02 · Tay gợi ý vẫn tô đúng ngón và hiện tên ngón (US-1)
- **Given** như HF-01, văn bản cần gõ có ký tự kế tiếp là `f`, sau đó là `j`, sau đó là phím cách
- **When** gõ đúng lần lượt
- **Then** trước mỗi phím, đúng một ngón có class `finger--active` theo `getFingerForKey` (ví dụ `f` → `#finger-left-index`, `j` → `#finger-right-index`), phím cách → cả `#finger-thumb-left` và `#finger-thumb-right` như hiện tại.
- **And** nhãn tên ngón (`finger-label`) vẫn hiển thị đúng chuỗi i18n theo ngôn ngữ (`vi`: ví dụ key `fingerLeftIndex`; `en` tương ứng), nhìn thấy được trong viewport và không đè lên phím nào của bàn phím ảo hay ký tự của vùng chữ cần gõ.

### HF-03 · Màn hẹp: tay gợi ý không tràn, không che (US-1, US-4)
- **Given** màn chơi, `fingerGuide === true`, viewport rộng < 1024px (đo ở 375×667, 768×1024)
- **When** trang render
- **Then** không có cuộn ngang; bàn phím ảo hiển thị đủ mọi phím với kích thước không nhỏ hơn hiện tại ở cùng viewport (bề rộng `.keyboard` không giảm so với `main`); hai tay không giao với bất kỳ `.key` nào hay với vùng chữ cần gõ.
- **And** cả hai tay vẫn hiển thị (theo giả định Q1: rơi về bố cục dưới bàn phím như hiện tại) và ngón tô sáng vẫn đúng như HF-02.

### HF-04 · Tắt tay gợi ý thì bố cục bàn phím như cũ (US-1)
- **Given** `fingerGuide === false` (guest qua localStorage hoặc user đăng nhập đồng bộ từ API)
- **When** mở màn chơi ở 375, 1024, 1440px
- **Then** không render SVG tay nào và không còn khoảng trống dành cho tay; bàn phím căn giữa trong `main` (lệch tâm ≤ 2px) với bề rộng bằng hiện tại; class `keyboard--hide-fingers` vẫn được áp dụng như trước.
- **And** bật lại `fingerGuide` trong SettingsPanel thì hai tay hiện lại ngay theo HF-01/HF-03 mà không cần tải lại trang.

### HF-05 · Lời khen chuỗi hiện ở hai bên, không che chữ (US-2)
- **Given** màn chơi, mọi chế độ được phép, `prefers-reduced-motion: no-preference`, viewport 1024/1280/1440px
- **When** combo đạt một mốc trong `COMBO_MILESTONES` (5, 10, 20, 50)
- **Then** hiện nhãn "x{mốc}" và câu khen `comboPraise{mốc}` theo ngôn ngữ hiện tại (`vi`: "Siêu quá!" ở mốc 10; `en`: "Super!") ở vùng bên trái và/hoặc bên phải vùng chữ (theo giả định Q2: mỗi bên một bản giống nhau).
- **And** trong suốt thời gian nhãn hiện, bounding box của mọi phần tử ăn mừng (nhãn, câu khen) không giao với bounding box của bất kỳ ký tự nào trong vùng chữ cần gõ (`.word-display` và các ký tự con) và không giao với bất kỳ `.key` nào.
- **And** nhãn tự biến mất trong ≤ 1500ms kể từ lúc chạm mốc; `pointer-events: none`; focus vẫn ở input ẩn; phần tử trực quan có `aria-hidden="true"`; `ComboAnnouncer` vẫn thông báo đúng một lần mỗi mốc ("Chuỗi 10! Siêu quá!" / "10 combo! Super!").

### HF-06 · Pháo hoa hai bên khi đạt mốc mới (US-3)
- **Given** như HF-05
- **When** combo đạt một mốc
- **Then** xuất hiện pháo hoa ở cả hai bên trái và phải của khu vực chơi (mỗi bên ≥ 1 chùm), số hạt bên trái bằng số hạt bên phải.
- **And** các hạt pháo hoa không đè lên ký tự của vùng chữ cần gõ và không đè lên `.key` của bàn phím trong lúc bay (kiểm bằng cách lấy mẫu bounding box mỗi 100ms trong lúc hiệu ứng chạy), có `pointer-events: none`, `aria-hidden="true"`.
- **And** pháo hoa kết thúc hẳn (không còn phần tử hạt trong DOM hoặc mọi animation liên quan ở trạng thái `finished`) trong ≤ 2000ms kể từ lúc chạm mốc; không lặp vô hạn.
- **And** combo tăng giữa hai mốc (ví dụ 6, 7, 8, 9) không tạo pháo hoa mới.

### HF-07 · Mật độ pháo hoa tăng theo mốc (US-3)
- **Given** như HF-05
- **When** lần lượt đạt mốc 5, 10, 20, 50 trong cùng một ván
- **Then** tổng số hạt pháo hoa sinh ra ở mỗi mốc tăng ngặt: `n(5) < n(10) < n(20) < n(50)`.
- **And** `n(50) ≤ 60` (giới hạn trên, xem HF-09); `n(5) ≥ 8` (không ít hơn số hạt hiện có).
- **And** cùng một mốc luôn sinh cùng số hạt (đo được bằng test đơn vị trên hàm/thành phần quyết định mật độ).

### HF-08 · Chuỗi đứt và ăn mừng lại (US-3)
- **Given** đang có nhãn và pháo hoa của mốc 10 hiển thị
- **When** gõ sai một phím (combo về 0)
- **Then** không sinh thêm pháo hoa, hiệu ứng đang chạy không bị kéo dài (vẫn kết thúc trong giới hạn HF-05/HF-06), số liệu trên StatsBar cập nhật như hiện tại.
- **And** gõ đúng lại tới combo 5 thì ăn mừng mốc 5 lần nữa với mật độ của mốc 5 (không cộng dồn từ chuỗi trước).
- **And** nếu đạt mốc mới trong lúc hiệu ứng mốc trước còn chạy, hiệu ứng mốc mới thay thế: tại mọi thời điểm số hạt pháo hoa trong DOM ≤ 60.

### HF-09 · Hiệu năng và giới hạn tài nguyên (US-4)
- **Given** màn chơi classic, văn bản ≥ 55 ký tự không lỗi, `no-preference`, Chrome giới hạn CPU 4x (CDP `Emulation.setCPUThrottlingRate`)
- **When** gõ tự động đúng toàn bộ văn bản, cách nhau 30ms, đi qua mốc 5, 10, 20, 50
- **Then** mọi phím được ghi nhận: ván kết thúc, `correctKeystrokes` bằng độ dài văn bản, `accuracy = 100`, `maxCombo ≥ 50`.
- **And** không có long task > 100ms (`PerformanceObserver` kiểu `longtask`); số phần tử hạt pháo hoa trong DOM tại mọi thời điểm ≤ 60; focus luôn ở input ẩn.
- **And** First Load JS của route `/` (theo `next build`) tăng không quá 10 KB so với `main`; không thêm request mạng mới (ảnh, âm thanh, thư viện) khi bắn pháo hoa.

### HF-10 · prefers-reduced-motion (US-4)
- **Given** trình duyệt giả lập `prefers-reduced-motion: reduce`
- **When** đạt mốc 5 và 10
- **Then** không có hạt pháo hoa nào được render; sau 500ms kể từ khi chạm mốc, `document.getAnimations().filter(a => a.playState === 'running')` rỗng.
- **And** nhãn "x{mốc}" và câu khen vẫn hiện tĩnh ở vị trí hai bên như HF-05 (không che chữ, không che phím) và biến mất trong ≤ 1500ms; `ComboAnnouncer` vẫn thông báo.

### HF-11 · Màn hẹp: ăn mừng không che chữ và bàn phím (US-2, US-4)
- **Given** viewport 375×667 và 768×1024, `no-preference`
- **When** đạt mốc 5 và mốc 50
- **Then** không có cuộn ngang trong lúc hiệu ứng chạy; nhãn khen và mọi hạt pháo hoa không giao với ký tự của vùng chữ cần gõ và không giao với `.key` nào (lấy mẫu mỗi 100ms).
- **And** nhãn "x{mốc}" và câu khen vẫn nhìn thấy được trong viewport (ở vị trí còn trống mà designer chọn, xem Q3); số hạt vẫn tuân HF-07 và ≤ 60.

### HF-12 · Kết thúc ván, ván mới, đổi chế độ (US-3)
- **Given** đang có nhãn/pháo hoa hiển thị
- **When** ván kết thúc (gõ hết chữ, hết giờ ở `timeAttack`, hết mạng ở `challenge`), hoặc bấm Chơi lại, hoặc đổi chế độ/cấp/bài trong SideNav
- **Then** nhãn khen và pháo hoa bị gỡ ngay (≤ 1 frame sau khi `finish()`/`clear()` chạy), không còn hạt nào hiển thị đè lên `CelebrationModal`; confetti của màn kết quả (KR-10) chạy như hiện tại.
- **And** khi `CelebrationModal`, SettingsPanel, HistoryPanel hoặc CustomTextModal đang mở, không có pháo hoa nào được tạo.

### HF-13 · Theme, ngôn ngữ, guest/đăng nhập (US-2, US-3)
- **Given** lần lượt theme mặc định, dark, colorful; `lang` là `vi` và `en`; người chơi guest và đã đăng nhập
- **When** đạt mốc 10
- **Then** nhãn hiển thị đúng chuỗi của ngôn ngữ đang chọn (tiếng Việt có dấu hiển thị đủ, không bị cắt), chữ nhãn đạt tương phản ≥ 4.5:1 (hoặc ≥ 3:1 nếu là chữ lớn) trên nền của nó (axe `color-contrast` không vi phạm).
- **And** mọi chuỗi giao diện mới (nếu có) có key ở cả `vi.ts` và `en.ts`; hành vi giống nhau giữa guest và user đăng nhập, không có request API mới.

## Edge cases
| # | Tình huống | Hành vi mong muốn | AC |
|---|---|---|---|
| E1 | Viewport 1024px: `main` max 1000px, bàn phím 820px, không đủ chỗ cho hai tay ~120px mỗi bên | Bố cục phải đảm bảo tay ở hai bên, không cuộn ngang, không che phím (designer chọn thu nhỏ tay/bàn phím hoặc nới `main`) | HF-01 |
| E2 | Màn hẹp < 1024px (điện thoại, tablet dọc) | Tay về bố cục dưới bàn phím như hiện tại, không tràn | HF-03 |
| E3 | `fingerGuide` tắt | Không có tay, bàn phím căn giữa như cũ | HF-04 |
| E4 | Gõ sai làm combo về 0 khi pháo hoa đang bay | Không kéo dài, không bắn thêm; chạm mốc lại thì ăn mừng lại | HF-08 |
| E5 | Đạt mốc kế tiếp khi hiệu ứng trước chưa xong (gõ rất nhanh, 10→20 không thể trong 1.2s nhưng có thể với máy gõ tự động) | Hiệu ứng mới thay thế, tổng hạt ≤ 60 | HF-08 |
| E6 | Combo vượt 50 (51, 52, … 100) | Không có mốc mới, không pháo hoa (theo giả định Q4) | HF-06 |
| E7 | Mốc chạm đúng phím cuối cùng của văn bản | `finish()` chạy, không pháo hoa đè lên CelebrationModal | HF-12 |
| E8 | `prefers-reduced-motion: reduce` | Không hạt, nhãn tĩnh vẫn hiện | HF-10 |
| E9 | Máy yếu (CPU 4x) | Không mất phím, không long task > 100ms, ≤ 60 hạt | HF-09 |
| E10 | Theme dark/colorful, chữ tiếng Việt dài ("Vô địch gõ phím!") ở màn hẹp | Không cắt chữ, tương phản đạt | HF-11, HF-13 |
| E11 | Thiết bị cảm ứng không có bàn phím vật lý, bấm phím ảo | Bấm phím ảo vẫn đi qua `handleKeyClick`; tay và pháo hoa không chặn chạm vào phím (`pointer-events: none`, không giao `.key`) | HF-01, HF-06 |
| E12 | Panel/modal đang mở | Không tạo pháo hoa | HF-12 |
| E13 | Chế độ `lesson` với văn bản ngắn (< 5 ký tự) | Không bao giờ đạt mốc, không có hiệu ứng; tay vẫn ở hai bên | HF-01 |
| E14 | Mất mạng/API lỗi | Không ảnh hưởng: tính năng thuần client, không gọi API | HF-13 |
| E15 | Đua multiplayer `/race/[roomId]`, chế độ Little, trò `/games` | Không thay đổi | ngoài phạm vi |
| E16 | Âm thanh pháo hoa | Không thêm âm thanh mới | ngoài phạm vi |

## Ngoài phạm vi
- Thêm mốc combo mới hay đổi `COMBO_MILESTONES`, cách tính điểm/combo trong `packages/game-engine`.
- Âm thanh pháo hoa, rung (vibration).
- Tay gợi ý/pháo hoa ở chế độ Little, `/games`, `/race/[roomId]`, lobby.
- Cài đặt riêng để tắt pháo hoa (ngoài `prefers-reduced-motion` của hệ thống).
- Vẽ lại hình bàn tay (SVG mới) hay đổi màu tô ngón.

## Hành vi không đổi
- Luật game, điểm, combo, `maxCombo`, `mistakeMap`, lưu lịch sử/kỷ lục (localStorage cho guest, API `saveSession` cho user đăng nhập) giữ nguyên.
- Ánh xạ phím → ngón (`getFingerForKey`) và màu tô từng ngón giữ nguyên; phím cách tô hai ngón cái.
- Setting `fingerGuide` (mặc định `true`, đồng bộ qua `/api/users/me/settings` khi đăng nhập) giữ nguyên ý nghĩa: tắt thì ẩn tay và ẩn màu ngón trên phím.
- Câu khen và `comboAnnounce` giữ nguyên chuỗi `vi`/`en`; vùng `aria-live="polite"` vẫn thông báo mỗi mốc một lần.
- Nhãn ăn mừng tự biến mất trong ≤ 1500ms, `pointer-events: none`, không lấy focus khỏi input ẩn (KR-09); gõ sai không kéo dài hiệu ứng.
- KR-14, KR-15, KR-16, KR-20 vẫn đạt (reduced motion, không mất phím, tài nguyên, không cuộn ngang ở 375/768/1024/1440).
- Confetti màn kết quả (KR-10) và CelebrationModal giữ nguyên.

## Câu hỏi còn mở
| # | Câu hỏi | Giả định tạm đang dùng | Ảnh hưởng nếu sai |
|---|---|---|---|
| Q1 | Ngưỡng bề rộng để chuyển tay ra hai bên, và ở màn hẹp có muốn giữ tay hai bên (thu nhỏ) thay vì về dưới bàn phím? | ≥ 1024px: hai bên; < 1024px: giữ bố cục dưới bàn phím như hiện tại | Đổi HF-01/HF-03, test bố cục ở 768px |
| Q2 | "Đưa ra 2 bên": nhãn khen hiện ở cả hai bên (hai bản giống nhau), hay tách "x{mốc}" một bên và câu khen bên kia? | Mỗi bên một bản giống nhau (đối xứng), chỉ đọc 1 lần cho trình đọc màn hình | Đổi nội dung kiểm tra ở HF-05 |
| Q3 | Màn hẹp không còn chỗ hai bên vùng chữ: nhãn khen đặt ở đâu (ví dụ trên StatsBar, khoảng giữa vùng chữ và bàn phím)? | Designer chọn vị trí trống bất kỳ miễn không giao chữ và phím (HF-11) | Đổi HF-11 nếu người dùng muốn ẩn hẳn nhãn trên mobile |
| Q4 | "Mỗi khi đạt 1 streak mới": chỉ các mốc 5/10/20/50 hay muốn bắn tiếp sau 50 (ví dụ mỗi +25)? | Chỉ 4 mốc hiện có, không đổi game-engine | Nếu muốn thêm mốc phải đổi `COMBO_MILESTONES` và câu khen i18n (đang ngoài phạm vi) |
| Q5 | Giới hạn 60 hạt và tăng First Load JS ≤ 10 KB có phù hợp? | Có; không dùng thư viện pháo hoa ngoài | Đổi ngưỡng ở HF-07/HF-09 |
| Q6 | Pháo hoa bắn ở hai bên vùng chữ, hai bên toàn màn hình, hay hai bên bàn phím (nơi đang có tay gợi ý)? | Hai bên khu vực chơi, designer chọn, miễn không che chữ và phím (HF-06) và không che tay gợi ý quá thời gian hiệu ứng | Đổi vị trí kiểm tra ở HF-06 |

## Lịch sử
- v1 2026-11-06 10:00: bản đầu.
- 2026-11-06 15:45: approved by user.
