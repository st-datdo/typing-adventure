# KR · Thiết kế lại giao diện thân thiện trẻ em — Requirements

Trạng thái: draft
Slug: kid-friendly-ui-redesign

## Bối cảnh
App đã có màu tươi và vài animation, nhưng các màn trẻ dùng nhiều nhất (chọn tuổi, màn chơi, màn kết quả, chọn bài/cấp độ) vẫn dựng bằng emoji, `<select>` và thẻ phẳng. Màn chơi gần như không có phản hồi ăn mừng ngoài hiệu ứng từng ký tự. Đối tượng chính là trẻ em (guest và user đăng nhập, `vi`/`en`). Phụ huynh và giáo viên cần app vẫn chạy mượt trên máy cũ ở trường. Mục tiêu: giao diện kiểu "đồ chơi" (claymorphism), có mascot và minh hoạ SVG, animation vui. Chỉ đổi phần trình bày: không đổi luật game, API hay DB.

## Hiện trạng
- Font: Baloo 2 đã nạp qua `next/font` với subset `vietnamese`, biến `--font-kid` (`typing-adventure/apps/web/src/app/layout.tsx:8-13`). `--font-ui` fallback sang Nunito/Comic Sans (`apps/web/src/styles/globals.css:31`).
- Token màu hiện tại (sky/sun/coral/leaf/berry…) và 3 theme `light`/`colorful`/`dark` nằm ở `apps/web/src/styles/globals.css:13-120`. Người dùng chọn theme trong Settings (`apps/web/src/components/settings/SettingsPanel.tsx:77-87`). Giá trị lưu trong `settings-store`, mặc định là `'light'` (`apps/web/src/stores/settings-store.ts:54,153-156`). Script boot đọc `typingAdventure_settings` để đặt `data-theme` trước khi hydrate (`apps/web/src/app/layout.tsx:20`).
- `/` hiển thị `AgePicker` khi `ageGroup === null`, `LittleMode` khi `little`, còn lại là `GameEngine` (`apps/web/src/app/page.tsx:30-32`). `AGE_PROFILES`: `little` không có mode thường, `kid` chỉ có classic/lesson, `big` có đủ mode và có social (`packages/game-engine/src/age.ts:3-7`).
- Mascot là emoji 🦉, không phải hình minh hoạ (`apps/web/src/components/little/Mascot.tsx:16-17`, `apps/web/src/components/age/AgePicker.tsx:28`). Thẻ chọn tuổi dùng emoji 🐣🐥🦅 (`AgePicker.tsx:8-12`).
- Các nút chức năng trên TopBar của màn chơi dùng emoji làm icon (☰ 🚪 🔃 🔊/🔇) và có `aria-label` (`apps/web/src/components/game/GameEngine.tsx:258-315`). Tiêu đề là chuỗi `"🦉 Typing Adventure"` (`GameEngine.tsx:273`). Icon trong StatsBar cũng là emoji (`apps/web/src/components/game/StatsBar.tsx:46-54`).
- Bấm vào vùng màn chơi (trừ nav/topbar/overlay/button/input) thì focus trả về input ẩn (`GameEngine.tsx:237-241`, `362-370`). Input được nhận qua sự kiện `input`/`keydown` (`GameEngine.tsx:131-163`).
- Phản hồi khi gõ: ký tự đúng có `charPop` 400ms, `wordBurst` chỉ chạy khi `soundMode==='word'`, ký tự sai có `shake` (`apps/web/src/styles/game.css:317-352`). Phím trên bàn phím ảo nháy đúng/sai (`apps/web/src/components/game/Keyboard.tsx:34-53,94-95`). Combo hiển thị dạng `x{n}` khi ≥ 2 (`apps/web/src/components/game/WordDisplay.tsx:99-103`).
- Mốc combo `[5, 10, 20, 50]` (`packages/game-engine/src/scoring.ts:5`) được tính thành `isMilestone` (`apps/web/src/stores/game-store.ts:61`) nhưng `useGameEngine` chưa dùng giá trị này cho UI (`apps/web/src/hooks/useGameEngine.ts:87-98`). Hiện chạm mốc combo không có ăn mừng nào.
- Màn kết quả `CelebrationModal`: emoji 🥳/😵/⏰, sao là chuỗi `★☆`, lưới số liệu, nút Chơi lại / Thử cấp / Luyện phím yếu (`apps/web/src/components/game/CelebrationModal.tsx:32-42,144-167`).
- Chọn chế độ/bài/thời gian/cấp độ/gói từ bằng `<select>` trong SideNav (`apps/web/src/components/layout/SideNav.tsx:109-188`). Icon bài học là emoji nằm trong `<option>` (`SideNav.tsx:134`).
- Games hub dùng emoji 🎈🖼️ (`apps/web/src/components/games/GamesHub.tsx:15-18`). Little mode có CSS và animation riêng (`apps/web/src/styles/little.css`, `little-world.css`).
- `prefers-reduced-motion` chỉ được xử lý rải rác: `game.css:1224-1231` chỉ tắt 4 class, ngoài ra có `little.css:918`, `ui.css:403`, `auth.css:204`, `multiplayer.css:751`.
- CSP: `img-src 'self' data: blob:`, `font-src 'self' data:` (`apps/web/src/lib/security-headers.ts:44-45`). Ảnh và font từ CDN ngoài sẽ bị chặn.
- `apps/web/public/` chưa có ảnh minh hoạ, chỉ có `voice/`.
- E2E hiện có: title chứa "Typing Adventure" và status 200 (`apps/web/e2e/smoke.spec.ts:3-7`), cùng `auth-guard.spec.ts`. Chưa có test component UI.
- Không có `specs/*` hay `docs/features/*` nào trùng tính năng này.

## User stories
- **US-1**: Là trẻ em, tôi muốn ứng dụng trông như một món đồ chơi nhiều màu, có bạn cú mascot và hình vẽ, để tôi muốn mở ra chơi.
- **US-2**: Là trẻ em đang gõ, tôi muốn có hiệu ứng vui khi gõ đúng, đạt combo hay hoàn thành bài, để tôi thấy mình giỏi và muốn gõ tiếp.
- **US-3**: Là trẻ em, tôi muốn chọn bài học, cấp độ và chế độ bằng thẻ có hình to, dễ bấm thay cho danh sách thả xuống, để tự chọn được mà không cần người lớn.
- **US-4**: Là trẻ em hoặc giáo viên dùng máy cũ ở trường, tôi muốn animation không làm chậm hay mất phím khi gõ, để kết quả luyện tập chính xác.
- **US-5**: Là trẻ nhạy cảm với chuyển động hoặc phụ huynh của trẻ, tôi muốn app tắt chuyển động khi hệ điều hành bật "giảm chuyển động", để trẻ dùng thoải mái.
- **US-6**: Là người dùng (guest hoặc đăng nhập, `vi` hoặc `en`), tôi muốn mọi tiến độ, cài đặt và luật chơi giữ nguyên sau khi đổi giao diện, để không mất dữ liệu và kết quả vẫn so sánh được.
- **US-7**: Là trẻ dùng tablet/điện thoại hoặc dùng bàn phím để điều hướng, tôi muốn nút đủ to, chữ đủ rõ và thấy được nút đang focus, để dùng được trên mọi thiết bị.

## Acceptance criteria

### KR-01 · Bảng màu claymorphism cho theme mặc định (US-1)
- **Given** người dùng có `theme = 'light'` (giá trị mặc định, gồm cả guest lần đầu)
- **When** mở `/` (AgePicker hoặc màn chơi)
- **Then** nền trang dùng tông `#EFF6FF` (có thể phủ lớp cảnh trang trí), thẻ/modal nền `#FFFFFF`, chữ chính `#0F172A`, chữ phụ `#475569`. Nút hành động chính dùng `#2563EB`, nút "chơi"/nhấn mạnh dùng `#F59E0B`, điểm nhấn vui dùng `#EC4899`, trạng thái lỗi/sai dùng `#DC2626`.
- **And** thẻ, nút và modal trên các màn trong phạm vi chính (KR-04…KR-12) có viền 3–4px, bo góc 16–24px (riêng nút tròn/pill được bo hết) và bóng kép mềm (một bóng ngoài và một bóng trong/nhấn).

### KR-02 · Theme dark và colorful vẫn dùng được (US-6)
- **Given** người dùng đã lưu `theme = 'dark'` hoặc `'colorful'`
- **When** tải lại `/`
- **Then** `<html data-theme>` vẫn đúng giá trị đã lưu trước khi hydrate. Các màn trong phạm vi hiển thị phong cách clay (viền dày, bo góc, bóng) theo bảng màu của theme đó, và chữ vẫn đạt độ tương phản ở KR-17.
- **And** đổi theme trong Settings áp dụng ngay, không cần tải lại trang (như hiện tại).

### KR-03 · Font hiển thị đúng tiếng Việt có dấu (US-1, US-6)
- **Given** `lang = 'vi'`
- **When** hiển thị tiêu đề và nội dung có dấu (ví dụ "Luyện gõ phím", "Tuyệt vời", "Chơi lại", "Ếch", "Ưu", "Ỷ")
- **Then** tiêu đề dùng Baloo 2. Thân bài dùng một font có subset tiếng Việt (xem Q1). Mọi ký tự có dấu render bằng cùng một font với phần chữ xung quanh, không có ký tự nào rơi về font fallback (kiểm bằng DevTools > Rendered Fonts trên chuỗi mẫu).
- **And** font tự host cùng origin (không request tới domain ngoài) và không vi phạm CSP hiện tại.

### KR-04 · Mascot minh hoạ SVG thay emoji 🦉 (US-1)
- **Given** bất kỳ màn nào trước đây hiện mascot 🦉 (AgePicker, TopBar màn chơi, các màn Little dùng `Mascot`, màn kết quả)
- **When** màn đó render
- **Then** mascot là hình minh hoạ vector (SVG hoặc ảnh cùng origin), không phải ký tự emoji. Mascot có tối thiểu các trạng thái `idle`, `wave`, `happy`, `sleep` và thêm `sad`/`encourage` cho màn kết quả khi thua (KR-10).
- **And** mascot trang trí có `aria-hidden="true"` hoặc `alt=""`, còn bong bóng thoại cạnh mascot giữ `role="status"` như hiện tại.

### KR-05 · Icon cấu trúc là SVG (US-1, US-7)
- **Given** các nút/nhãn chức năng trên màn trong phạm vi: TopBar (menu, đăng xuất, chơi lại, âm thanh bật/tắt), icon StatsBar, thẻ chọn tuổi, thẻ Games hub, thẻ chọn bài/cấp/chế độ (KR-11)
- **When** render
- **Then** icon là SVG, không phải emoji. `aria-label`/`title` của từng nút giữ đúng key i18n hiện có (`navMenu`, `btnSignOut`, `tipRestart`, `tipSound`…). Nút âm thanh có icon khác nhau cho bật/tắt và vẫn giữ `aria-pressed`.
- **And** avatar do người dùng chọn (`playerAvatar`, có thể là emoji) và emoji nằm trong nội dung/thông điệp không bị bắt buộc đổi.

### KR-06 · Cảnh trang trí có minh hoạ (US-1)
- **Given** màn AgePicker, màn chơi và Games hub
- **When** render ở viewport ≥ 768px
- **Then** có ít nhất một lớp cảnh minh hoạ (mây, đồi, sao, đồ vật…) ở nền hoặc viền, không che vùng chữ cần gõ, bàn phím ảo hay các nút.
- **And** lớp trang trí không nhận click: bấm lên vùng trang trí của màn chơi vẫn đưa focus về input ẩn như hiện tại (`GameEngine.tsx:237-241`). Phần tử trang trí không vào thứ tự Tab và bị trình đọc màn hình bỏ qua.

### KR-07 · Animation xuất hiện màn hình có stagger (US-1)
- **Given** `prefers-reduced-motion: no-preference`
- **When** mount AgePicker, màn chơi (lần đầu vào `/`), màn kết quả hoặc Games hub
- **Then** các khối chính (mascot, tiêu đề, thẻ/khối nội dung, nhóm nút) xuất hiện lần lượt. Mỗi khối chạy 300–450ms với easing kiểu back-out (có vượt nhẹ), khối sau bắt đầu trễ hơn khối trước 40–120ms.
- **And** sau 1000ms kể từ lúc mount, mọi khối có `opacity` bằng 1 và không còn transform lệch vị trí. Animation chỉ thay đổi `transform`/`opacity`.

### KR-08 · Phản hồi khi nhấn nút (US-1, US-7)
- **Given** một nút/thẻ bấm được trên màn trong phạm vi
- **When** nhấn giữ chuột/ngón tay (`:active`) hoặc nhấn Enter/Space khi nút đang focus
- **Then** nút co hoặc lún xuống bằng `transform` (scale 0.92–0.97 hoặc translateY 2–4px, bóng giảm) trong khoảng ≤ 200ms, và trở lại trạng thái cũ khi thả.
- **And** con trỏ chuột trên phần tử bấm được là `pointer`. Phần tử bị vô hiệu hoá không có hiệu ứng nhấn và có con trỏ `not-allowed` hoặc `default`.

### KR-09 · Ăn mừng mốc combo (US-2)
- **Given** đang chơi trên màn `GameEngine` (mọi chế độ được phép)
- **When** combo đạt đúng một mốc trong `COMBO_MILESTONES` (5, 10, 20, 50)
- **Then** hiện một hiệu ứng ăn mừng (ví dụ nhãn lớn "x{mốc}" kèm một câu khen lấy từ key i18n mới có ở cả `vi.ts` và `en.ts`, kèm hạt/sao bung) và mascot chuyển sang trạng thái `happy`. Hiệu ứng tự biến mất trong ≤ 1500ms.
- **And** trong lúc hiệu ứng đang hiện, mọi phím gõ tiếp vẫn được xử lý (xem KR-15), focus vẫn ở input ẩn, hiệu ứng không chặn click (`pointer-events: none`). Lời khen được thông báo qua vùng `aria-live="polite"`, mỗi mốc một lần.
- **And** khi gõ sai làm combo về 0, hiệu ứng đang hiện không bị kéo dài thêm. Chạm cùng một mốc lần nữa (sau khi combo về 0) thì ăn mừng lại.

### KR-10 · Màn kết quả có ăn mừng (US-2)
- **Given** một ván kết thúc và `CelebrationModal` mở
- **When** modal xuất hiện
- **Then** mascot SVG hiện theo kết quả: `happy` khi hoàn thành bài, `sad`/`encourage` khi hết mạng ở `challenge`, minh hoạ đồng hồ khi hết giờ ở `timeAttack`. Tiêu đề giữ đúng key hiện tại (`celExcellent`/`celOutOfLives`/`celTimeUp`).
- **And** số sao (0–3) hiển thị bằng hình sao SVG, sao đạt được bật ra lần lượt cách nhau 150–300ms, sao chưa đạt hiện dạng viền. Số sao đọc được qua văn bản thay thế (ví dụ `aria-label` "2/3").
- **And** khi `result.stars ≥ 1` có hiệu ứng confetti/hạt trang trí chạy ≤ 2500ms rồi dừng hẳn (không lặp vô hạn). Khi có kỷ lục mới (`celNewRecord` đang hiện), nhãn kỷ lục có animation nổi bật riêng.
- **And** mọi giá trị số (điểm, thời gian, CPS/WPM chỉ khi `showSpeedStats`, độ chính xác, max combo, số từ, mạng còn lại, tên bài) và các nút (Chơi lại, Thử cấp, Luyện phím yếu) hiển thị đúng như trước, với điều kiện hiển thị giữ nguyên.

### KR-11 · Chọn chế độ, bài học, cấp độ bằng thẻ hình (US-3)
- **Given** SideNav đang mở ở màn chơi
- **When** người dùng xem phần chế độ chơi, bài học (khi `gameMode==='lesson'`) và cấp độ
- **Then** mỗi lựa chọn là một thẻ/nút có icon SVG riêng kèm nhãn i18n hiện có: chế độ (`modeClassic`, `modeLesson`, `modeTimeAttack`, `modeChallenge`, chỉ những mode `isModeAllowed` theo tuổi), 5 bài học trong `LESSONS` (bài cuối dùng nhãn `lessonAll`), cấp độ `lvEasy`/`lvMedium`/`lvHard`.
- **And** lựa chọn đang chọn có `aria-pressed="true"` (hoặc `aria-checked` trong radiogroup) và có dấu hiệu ngoài màu sắc (ví dụ dấu tick hoặc viền đậm hơn). Mỗi nhóm dùng được bằng bàn phím (Tab vào nhóm, Enter/Space hoặc phím mũi tên để chọn).
- **And** chọn thẻ gọi đúng các hành vi như `<select>` hiện tại: `onModeChange`, `onLessonChange(index)`, `onLevelChange(level)`, bắt đầu ván mới với cùng tham số như trước.
- **And** các trường còn lại (ngôn ngữ, thời lượng time attack, gói từ, kiểu âm thanh) chỉ cần đổi sang style mới và được phép giữ dạng `<select>`.

### KR-12 · AgePicker có minh hoạ (US-1, US-3)
- **Given** `ageGroup === null`
- **When** mở `/`
- **Then** 3 thẻ tuổi (`ageLittle`/`ageKid`/`ageBig` kèm mô tả) mỗi thẻ có một minh hoạ SVG riêng thay cho emoji, có mascot SVG `wave`, nút đổi ngôn ngữ hoạt động như cũ.
- **And** bấm một thẻ gọi `setAgeGroup` với đúng giá trị như hiện tại, sau đó điều hướng tới `LittleMode` hoặc `GameEngine` như hiện tại.

### KR-13 · Các màn còn lại chỉ đổi theme (US-1, US-6)
- **Given** các trang `/login`, `/register`, `/leaderboard`, `/friends`, `/profile/[id]`, `/lobby`, `/race/[roomId]`, `/games` (cùng BalloonGame/PictureGame) và các màn Little (`LittleHome`, `LittlePlay`, `LittleEnd`, `LittleAlbum`, `LittleMap`, `ParentPanel`)
- **When** render
- **Then** các màn này dùng token màu, font, bo góc, viền và hiệu ứng nhấn nút mới (KR-01, KR-03, KR-08). Màn nào đang dùng `Mascot` thì có mascot SVG (KR-04). Bố cục, luồng, văn bản và hành vi giữ nguyên.
- **And** ở `/race/[roomId]`, tiến độ và thứ hạng vẫn chỉ lấy từ sự kiện server, không có animation nào làm thay đổi hay đoán trước tiến độ hiển thị.

### KR-14 · Tôn trọng prefers-reduced-motion (US-5)
- **Given** trình duyệt giả lập `prefers-reduced-motion: reduce`
- **When** mở AgePicker, màn chơi, gõ đủ để chạm mốc combo 5, hoàn thành ván để mở màn kết quả, rồi mở `/games` và các màn Little
- **Then** sau 500ms kể từ mỗi lần chuyển màn hoặc sự kiện, `document.getAnimations().filter(a => a.playState === 'running')` rỗng. Nội dung hiện ngay ở trạng thái cuối (opacity 1, đúng vị trí), không có confetti/hạt bay.
- **And** thông tin vẫn được truyền đạt mà không cần chuyển động: nhãn mốc combo, trạng thái đúng/sai của ký tự (màu và kiểu chữ), số sao, nhãn kỷ lục mới vẫn hiển thị.

### KR-15 · Animation không làm mất hay chậm phím (US-4)
- **Given** màn chơi chế độ classic, cấp easy, bật mọi hiệu ứng (`no-preference`), Chrome bị giới hạn CPU 4x (CDP `Emulation.setCPUThrottlingRate`)
- **When** gõ tự động đúng toàn bộ văn bản với khoảng cách 30ms giữa các phím (đi qua ít nhất mốc combo 5 và 10)
- **Then** mọi phím được ghi nhận: ván kết thúc, `correctKeystrokes` bằng độ dài văn bản, `totalKeystrokes` bằng số phím đã gõ, `accuracy = 100`.
- **And** trong suốt lúc gõ không có long task > 100ms (đo bằng `PerformanceObserver` kiểu `longtask`). Focus luôn ở input ẩn.

### KR-16 · Giới hạn tài nguyên cho máy yếu (US-4)
- **Given** build production
- **When** tải `/` lần đầu (chưa có cache)
- **Then** tổng dung lượng ảnh/SVG minh hoạ tải cho màn đầu ≤ 200 KB, và First Load JS của route `/` (số liệu từ `next build`) tăng không quá 20 KB so với `main` (xem Q4).
- **And** mọi ảnh, SVG và font được phục vụ cùng origin. Không có request nào bị CSP chặn (console không có lỗi CSP).
- **And** khi đang chơi (`isPlaying === true`), không còn animation lặp vô hạn nào của cảnh nền hoặc mascot ngoài vùng chữ (chúng tạm dừng và chạy lại khi ván kết thúc hoặc chưa bắt đầu gõ) (xem Q5).

### KR-17 · Độ tương phản chữ (US-7)
- **Given** các màn trong phạm vi chính (KR-04…KR-12) ở cả 3 theme
- **When** kiểm bằng axe-core (rule `color-contrast`) hoặc công cụ đo tương phản
- **Then** chữ thường có tỷ lệ ≥ 4.5:1, chữ lớn (≥ 24px hoặc ≥ 18.66px đậm) ≥ 3:1, kể cả chữ trên nút vàng `#F59E0B` và hồng `#EC4899`. Không có vi phạm `color-contrast`.

### KR-18 · Focus nhìn thấy được (US-7)
- **Given** người dùng điều hướng bằng Tab
- **When** focus vào bất kỳ nút, thẻ, link hay ô nhập nào trên màn trong phạm vi chính
- **Then** có vòng focus (outline hoặc ring) dày ≥ 2px, tương phản ≥ 3:1 với nền xung quanh, không bị hiệu ứng clay/bóng che mất.
- **And** input ẩn của màn chơi không bị đổi hành vi focus.

### KR-19 · Vùng chạm ≥ 44px (US-7)
- **Given** viewport 375×667
- **When** đo bounding box mọi phần tử bấm được trên AgePicker, màn chơi (TopBar, nút "Tự nhập chữ", SideNav), màn kết quả, Games hub
- **Then** mỗi phần tử có kích thước ≥ 44×44 CSS px. Riêng phím của bàn phím ảo được miễn (xem E7).

### KR-20 · Responsive 375/768/1024/1440 (US-7)
- **Given** viewport rộng 375, 768, 1024 và 1440px
- **When** mở AgePicker, màn chơi (cả khi SideNav mở), màn kết quả, Games hub, `/login`
- **Then** không có cuộn ngang (`document.documentElement.scrollWidth <= clientWidth`). Văn bản cần gõ, bàn phím ảo và các nút chính đều nhìn thấy được và không bị minh hoạ che. Màn kết quả cuộn dọc được nếu cao hơn viewport.

### KR-21 · Giữ nguyên luật, dữ liệu, API (US-6)
- **Given** cùng một chuỗi phím gõ vào cùng một văn bản
- **When** chạy trước và sau thay đổi
- **Then** `score`, `stars`, `combo`/`maxCombo`, `accuracy`, `mistakeMap` giống hệt nhau. `packages/game-engine`, `packages/db/prisma` và `apps/web/src/app/api/**` không đổi. `pnpm test`, `pnpm typecheck`, `pnpm lint` (0 error) và e2e hiện có đều pass.
- **And** user đăng nhập vẫn gọi `saveSession` đúng 1 lần mỗi ván với payload giữ nguyên. Guest không phát sinh request API mới. Key localStorage (`typingAdventure_settings` cùng các store persist khác) và cấu trúc dữ liệu giữ nguyên.

### KR-22 · Văn bản mới có đủ vi/en (US-6)
- **Given** có chuỗi hiển thị mới (lời khen combo, nhãn sao thay thế, nhãn trang trí cần đọc…)
- **When** chuyển `lang` giữa `vi` và `en`
- **Then** mọi chuỗi mới lấy qua `t()`/`tReplace()`, có ở cả `vi.ts` và `en.ts` (typecheck pass), không hard-code chuỗi trong component. Chuỗi tiếng Việt có đủ dấu.

## Edge cases
| # | Tình huống | Hành vi mong muốn | AC |
|---|---|---|---|
| E1 | Gõ rất nhanh, chạm liên tiếp 2 mốc (5 rồi 10) trong lúc hiệu ứng mốc 5 còn hiện | Hiệu ứng mốc 10 thay ngay hiệu ứng mốc 5, không xếp hàng, không mất phím | KR-09, KR-15 |
| E2 | Ván kết thúc đúng lúc hiệu ứng combo đang chạy | Hiệu ứng combo tắt hoặc nằm dưới modal kết quả, không đè lên nút của modal | KR-09, KR-10 |
| E3 | `stars = 0` (ví dụ hết mạng sớm ở challenge) | Không có confetti, 3 sao viền rỗng, mascot `sad`/`encourage` | KR-10 |
| E4 | Bật reduced-motion giữa chừng (đổi setting OS khi app đang mở) | Từ lần chuyển màn/sự kiện tiếp theo thì áp dụng KR-14, không cần tải lại | KR-14 |
| E5 | Theme `dark` với nút vàng/hồng | Chữ trên nút vẫn đạt tương phản | KR-02, KR-17 |
| E6 | Chuỗi dài: tên gói từ, tên người chơi dài, bản `en` dài hơn `vi` | Cắt bằng dấu "…" hoặc xuống dòng, không tràn thẻ, không cuộn ngang | KR-20 |
| E7 | Mobile 375px không có bàn phím vật lý, dùng bàn phím ảo của app | Phím ảo được miễn quy tắc 44px. Hiệu ứng nhấn phím ảo không làm mất phím, bấm phím ảo vẫn gọi `handleKeyClick` | KR-19 (miễn), KR-15 |
| E8 | Bàn phím ảo của hệ điều hành mobile bật lên và che nửa màn | Ngoài phạm vi (giữ hành vi hiện tại) | ngoài phạm vi |
| E9 | Ảnh/SVG minh hoạ tải lỗi (mạng chập chờn) | Màn vẫn dùng được, chữ và nút vẫn hiển thị. Ảnh `<img>` hỏng không để lộ icon vỡ (alt rỗng) | KR-06, KR-04 |
| E10 | Mất mạng hoặc API lỗi khi lưu kết quả (user đăng nhập) | Vẫn hiện ăn mừng ở màn kết quả, `SyncIndicator` hiện `offline` như hiện tại | KR-10, KR-21 |
| E11 | Admin (`/admin/**`) | Không thiết kế lại. Chỉ chịu ảnh hưởng gián tiếp từ token chung nhưng không được vỡ bố cục và không có lỗi tương phản mới | ngoài phạm vi (KR-17 không áp cho admin) |
| E12 | Tab bị ẩn rồi quay lại khi confetti đang chạy | Confetti không chạy dồn khi quay lại, tối đa chạy nốt phần còn lại trong giới hạn 2500ms | KR-10 |
| E13 | Người dùng mở SideNav hoặc Settings khi đang gõ | Hiệu ứng combo đang hiện không chặn panel. Đóng panel thì focus về input ẩn như cũ | KR-09, KR-18 |
| E14 | Ký tự tiếng Việt có dấu trong văn bản gõ (gói từ tuỳ chỉnh) | Hiển thị đúng font (KR-03). Hiệu ứng `charPop` không cắt dấu phía trên chữ | KR-03 |
| E15 | Máy có màn hình 1440px nhưng zoom 200% | Cư xử như viewport 720px, không cuộn ngang | KR-20 |

## Ngoài phạm vi
- Mọi thay đổi luật game, cách tính điểm, sao, combo, mốc combo, achievement (`packages/game-engine`).
- API, schema DB, migration, payload Socket.IO và luồng multiplayer.
- Thiết kế lại bố cục các trang `/admin/**` (dashboard, users, words, classroom, heatmap).
- Thiết kế lại bố cục các màn Little mode, mini-game, auth, social, lobby/race (chỉ đổi theme và mascot, xem KR-13).
- Âm thanh mới, giọng đọc mới, nhạc nền.
- Thêm theme mới hoặc đổi danh sách theme trong Settings.
- Hiệu ứng đếm số tăng dần cho điểm ở màn kết quả.
- Hành vi bàn phím ảo của hệ điều hành trên mobile (E8).
- Đổi avatar emoji do người dùng chọn sang ảnh.

## Hành vi không đổi
- Logic quyết định màn ở `/` (`page.tsx:26-32`): loading, rồi AgePicker, LittleMode hoặc GameEngine.
- Nhận phím qua input ẩn, Space qua `keydown`. Bấm vùng trống của màn chơi thì focus lại input. Panel đang mở thì không nhận phím.
- Danh sách chế độ theo tuổi (`isModeAllowed`), ẩn CPS/WPM/Best khi `showSpeedStats = false`, ẩn link social khi `social = false`.
- Âm thanh đúng/sai, đọc ký tự/từ theo `soundMode`, nháy phím đúng/sai trên bàn phím ảo, `charPop`/`wordBurst`/`shake` (được đổi style nhưng vẫn phân biệt được đúng/sai).
- Theme boot script và 3 giá trị theme. Key và migrate của `settings-store`.
- Đồng bộ server cho user đăng nhập (`loadFromServer`, `saveSession`, `useProfileSync`, `useChildProgressSync`), `GuestBanner`, `SyncIndicator`.
- Title trang chứa "Typing Adventure", metadata, CSP và security headers.
- Middleware bảo vệ `/friends`, `/admin`, `/lobby`, `/race`.
- Đăng xuất xoá store local như hiện tại.

## Câu hỏi còn mở
| # | Câu hỏi | Giả định tạm đang dùng | Ảnh hưởng nếu sai |
|---|---|---|---|
| Q1 | Comic Neue (font thân bài trong hướng thiết kế) không có subset `vietnamese` trên Google Fonts. Dùng font nào cho thân bài? | Giữ Baloo 2 (đã có subset `vietnamese`) cho cả thân bài, hoặc dùng một font tròn có hỗ trợ tiếng Việt do Designer chọn. Không dùng Comic Neue cho văn bản tiếng Việt. | Nếu bắt buộc Comic Neue thì chữ có dấu sẽ lẫn font fallback, vi phạm KR-03 |
| Q2 | Bảng màu mới thay theme `light` hay là theme thứ 4? | Thay giá trị của theme `light` (mặc định). `dark` và `colorful` giữ được nhưng áp phong cách clay | Nếu thành theme mới thì cần thêm giá trị `Theme`, i18n và migrate store, KR-01/KR-02 phải viết lại |
| Q3 | Có đổi `<select>` chọn chế độ/bài/cấp trong SideNav sang thẻ (KR-11) hay chỉ đổi style? | Đổi sang thẻ cho chế độ, bài học, cấp độ. Các trường khác giữ `<select>` | Nếu chỉ đổi style thì KR-11 thu hẹp thành "style mới cho select", US-3 đạt một phần |
| Q4 | Có được thêm thư viện animation (ví dụ framer-motion, lottie) không? Ngân sách JS +20 KB có hợp lý không? | Giới hạn First Load JS của `/` tăng ≤ 20 KB, ảnh màn đầu ≤ 200 KB | Ngân sách chặt hơn có thể phải bỏ bớt hiệu ứng, lỏng hơn có thể làm chậm máy trường học |
| Q5 | Cảnh nền và mascot có được chuyển động lặp trong lúc đang gõ không? | Không: tạm dừng khi `isPlaying`, để tránh phân tâm và tốn CPU (KR-16) | Nếu muốn động liên tục thì bỏ câu cuối KR-16, và KR-15 càng quan trọng |
| Q6 | Mascot vẫn là cú hay đổi nhân vật? Ai cung cấp minh hoạ (tự vẽ SVG hay lấy bộ có license)? | Giữ cú, minh hoạ SVG tự vẽ hoặc dùng nguồn license CC0/MIT, lưu trong repo | Nếu cần nhân vật/brand khác hoặc asset có bản quyền thì thay đổi tiến độ và dung lượng |
| Q7 | Có cần test tự động cho KR-14/15/17/19/20 (Playwright và axe) hay chấp nhận kiểm tay? | QC viết e2e Playwright cho KR-14, KR-15, KR-19, KR-20. KR-17 kiểm bằng axe nếu thêm được dev-dependency `@axe-core/playwright`, không thì kiểm tay | Không thêm được axe thì KR-17 chỉ có bằng chứng thủ công |
| Q8 | Admin có cần giữ nguyên hoàn toàn (cô lập khỏi token mới) không? | Không thiết kế lại admin. Token chung được phép ảnh hưởng nhưng không được vỡ bố cục (E11) | Nếu yêu cầu admin y hệt cũ thì PTL phải cô lập style admin |

## Lịch sử
- v1 2026-11-05 10:00: bản đầu.
