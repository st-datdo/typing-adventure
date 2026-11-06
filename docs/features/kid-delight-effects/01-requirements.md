# FX · Hiệu ứng "đã mắt" cho trẻ: juice từng phím, combo leo thang, ít lặp lại — Requirements

Trạng thái: draft
Slug: kid-delight-effects

## Bối cảnh
Trên màn chơi chính (`GameEngine`), hiệu ứng hiện tại đơn điệu: mỗi phím đúng chỉ có một kiểu pop chữ và một tiếng giống hệt nhau. Lời khen chuỗi (từ HF) hiện thành hai bản sao giống nhau ở hai mép gutter, xa chỗ trẻ đang nhìn, chỉ có 4 mốc và 4 câu cố định. Người dùng (phụ huynh/chủ sản phẩm) thấy "chán", không hợp, và muốn trẻ 5–12 tuổi thấy nhiều hiệu ứng, hình ảnh hơn, xuất hiện thường xuyên, ít lặp lại. Phạm vi gồm guest và user đăng nhập, `vi` và `en`. Hiệu ứng phải an toàn (WCAG 2.3.1, `prefers-reduced-motion`) và không làm chậm hay mất phím. Cơ sở là research `docs/features/kid-delight-effects/00-research.md`.

## Hiện trạng
- Mốc combo chỉ có `COMBO_MILESTONES = [5, 10, 20, 50]` (`typing-adventure/packages/game-engine/src/scoring.ts:5`), kiểm bằng `isComboMilestone` (`typing-adventure/packages/game-engine/src/engine.ts:171-173`). Gõ sai thì `combo = 0` (`engine.ts:141`). Mốc không ảnh hưởng điểm. Điểm tính theo `calculateCharScore(combo)` (`engine.ts:125`).
- Khi chạm mốc, `useGameEngine` gọi `celebration.celebrate(after.combo)`; ván kết thúc thì `finish()` (`typing-adventure/apps/web/src/hooks/useGameEngine.ts:95-98`). Phím đúng gọi `playCorrect()`, phím sai gọi `playWrong()` (`useGameEngine.ts:100-109`).
- `ComboBurstView` render 2 bản sao giống hệt nhau (`SIDES = ['left','right']`), mỗi bản có icon lửa, "x{mốc}", câu khen `comboPraise{mốc}` và `ComboFireworks` đối xứng gương. Tự xoá sau `COMBO_BURST_MS = 1200` (`typing-adventure/apps/web/src/components/game/ComboBurst.tsx:13-56`, `typing-adventure/apps/web/src/lib/kr/combo-celebration.ts:4`). Số hạt pháo hoa có trần `FIREWORK_MAX_NODES = 60` (`typing-adventure/apps/web/src/lib/hf/fireworks.ts:8`).
- Câu khen cố định 4 câu mỗi ngôn ngữ: `comboPraise5/10/20/50` (`typing-adventure/packages/i18n/src/vi.ts:332-335`, `en.ts:332-335`).
- Mascot khi chơi (`GameOwl`) chỉ đổi `happy`↔`idle`, size `sm` (`typing-adventure/apps/web/src/components/game/GameOwl.tsx:10-11`), dù `OwlMascot` đã có 8 mood: `idle, wave, happy, cheer, encourage, sad, thinking, sleep` (`typing-adventure/apps/web/src/components/mascot/OwlMascot.tsx:1-10`).
- Âm thanh: `sound-engine.ts` đã có `playNote` theo thang ngũ cung 10 nốt (`typing-adventure/apps/web/src/lib/audio/sound-engine.ts:12`, `54-58`), nhưng phím đúng ở màn chơi chính chỉ dùng `correct` cố định. `pop/boing/sparkle/sticker` chưa dùng ở màn chơi chính (research §1).
- Mọi `.kr-loop` dừng khi `data-playing='true'` (`typing-adventure/apps/web/src/styles/motion.css:18-19`, `GameEngine.tsx:344`), có e2e KR-16 kiểm (`typing-adventure/apps/web/e2e/kr-game.spec.ts:32-43`).
- Settings có `soundEnabled`, `fingerGuide`, `theme`, `ageGroup`… nhưng không có mức hiệu ứng (`typing-adventure/packages/game-engine/src/types.ts:160-171`). User đăng nhập lưu settings qua `PUT /api/users/me/settings`: Zod `.passthrough()`, merge vào cột JSON `settings` (`typing-adventure/apps/web/src/app/api/users/me/settings/route.ts:7-44`). Guest lưu bằng `persist` localStorage (`typing-adventure/apps/web/src/stores/settings-store.ts:50-141`).
- Không có thư viện animation nào. Hiệu ứng làm bằng CSS keyframes và DOM span (research §1).
- HF (chưa merge, nền của nhánh này) đã QC PASS các AC HF-05/06/07/10/11 về nhãn và pháo hoa hai bên (`docs/features/hand-hints-side-fireworks-streak/01-requirements.md:55-101`). Test liên quan: `apps/web/src/lib/__tests__/hf-fireworks.test.ts`, `apps/web/src/components/game/__tests__/ComboBurst.test.tsx`.

## AC HF bị thay thế / giữ lại
| AC HF | Trạng thái sau FX | Thay bằng |
|---|---|---|
| HF-01, HF-02, HF-03, HF-04 (tay gợi ý cạnh bàn phím) | Giữ nguyên | — |
| HF-05 (nhãn khen hai bên) | Thay thế | FX-01, FX-03 |
| HF-06 (pháo hoa hai bên mỗi mốc) | Thay thế | FX-04, FX-19 |
| HF-07 (mật độ theo 4 mốc) | Thay thế | FX-04, FX-17 |
| HF-08 (đứt chuỗi, thay thế hiệu ứng) | Thay thế | FX-02, FX-13, FX-18 |
| HF-09 (hiệu năng) | Thay thế, ngưỡng mới | FX-17 |
| HF-10 (reduced motion) | Thay thế | FX-15 |
| HF-11 (màn hẹp không che) | Thay thế | FX-19 |
| HF-12 (kết thúc ván, panel mở) | Giữ, mở rộng cho mọi hiệu ứng FX | FX-18 |
| HF-13 (theme, ngôn ngữ, guest/login) | Giữ, mở rộng | FX-20 |

## User stories
- **US-1**: Là trẻ đang luyện gõ, tôi muốn mỗi phím gõ đúng đều "nổ" ra hình và tiếng vui mắt, khác nhau mỗi lần, ngay tại chữ mình vừa gõ, để thấy mình đang làm tốt mà không phải rời mắt khỏi chữ.
- **US-2**: Là trẻ đang luyện gõ, tôi muốn chuỗi gõ đúng càng dài thì phần thưởng càng "to" và có thứ mới xuất hiện (lửa, pháo, nhân vật chạy ngang, bầu trời đổi màu, cú cú biến hình), để cố giữ chuỗi.
- **US-3**: Là trẻ đang luyện gõ, tôi muốn lời khen hiện ngay phía trên dòng chữ và cú cú phản ứng theo việc mình làm (vui, cổ vũ, động viên khi sai, ngủ gật khi mình dừng lâu), để thấy trò chơi "sống" và không bị la khi gõ sai.
- **US-4**: Là phụ huynh/giáo viên, tôi muốn chỉnh mức hiệu ứng (Nhiều/Vừa/Ít), đồng thời app tôn trọng cài đặt giảm chuyển động của hệ thống và không có nhấp nháy nguy hiểm, để phù hợp với từng trẻ và từng máy.
- **US-5**: Là trẻ dùng máy yếu hoặc máy tính bảng, tôi muốn hiệu ứng nhiều mà không làm mất phím hay che chữ, che phím, che tay gợi ý.

## Acceptance criteria

### FX-01 · Bỏ nhãn khen hai bên của HF (US-3)
- **Given** màn chơi `GameEngine`, mọi chế độ được phép, mọi viewport (375, 768, 1024, 1280, 1440px)
- **When** combo đạt bất kỳ tầng nào trong FX-02
- **Then** không còn phần tử nhãn/câu khen nào ở gutter trái hoặc phải (không còn hai bản sao `combo-side--left` / `combo-side--right`). Tại mọi thời điểm, DOM có tối đa **1** nhãn combo hiển thị.
- **And** gutter hai bên chỉ được dùng cho lớp nền không chứa chữ/số (mưa sticker FX-04 tầng 40, pháo hoa nền tầng 75/100).

### FX-02 · Thang tầng combo dày hơn, tách khỏi mốc điểm (US-2)
- **Given** một ván bất kỳ
- **When** combo tăng dần 1, 2, 3, …
- **Then** hiệu ứng tầng được kích hoạt đúng một lần khi combo **bằng** một trong các tầng `3, 5, 10, 15, 20, 30, 40, 50, 75, 100`, và sau 100 thì cứ mỗi +50 (150, 200, …) (giả định Q2/Q10). Combo ở giữa hai tầng (ví dụ 6, 7, 8, 9) không kích hoạt hiệu ứng tầng.
- **And** gõ sai (combo về 0) rồi gõ đúng lại thì tầng 3, 5… được kích hoạt lại từ đầu, không cộng dồn chuỗi trước.
- **And** hàm quyết định tầng là hàm thuần, có test đơn vị: `tier(3)`, `tier(5)`, …, `tier(100)`, `tier(150)` trả tầng tương ứng; `tier(4)`, `tier(51)`, `tier(101)` trả "không có tầng".
- **And** `COMBO_MILESTONES`, điểm, `maxCombo` và thông báo `ComboAnnouncer` (chỉ ở 5/10/20/50, "Chuỗi 10! Siêu quá!" / "10 combo! Super!") giữ nguyên như hiện tại.

### FX-03 · Nhãn combo căn giữa phía trên dòng chữ, bay lên rồi tan (US-2, US-3)
- **Given** mức hiệu ứng "Nhiều" hoặc "Vừa", `prefers-reduced-motion: no-preference`, viewport 375/768/1024/1280/1440px
- **When** combo đạt tầng ≥ 5
- **Then** hiện đúng 1 nhãn gồm "x{tầng}" và một câu khen (FX-05). Tâm ngang của nhãn lệch so với tâm ngang của `.word-display` không quá 24px. Mép dưới của nhãn ≤ mép trên của ký tự đầu tiên trong dòng chữ đang gõ (không giao ký tự nào).
- **And** nhãn nổi lên, bay lên rồi mờ dần, biến mất khỏi DOM hoặc `opacity: 0` trong ≤ 900ms kể từ lúc chạm tầng. Nhãn có `pointer-events: none`, `aria-hidden="true"`; focus vẫn ở input ẩn.
- **And** nếu chạm tầng mới khi nhãn cũ còn hiện, nhãn mới thay thế nhãn cũ ngay (không xếp hàng, không có 2 nhãn cùng lúc).
- **And** ở tầng 3 không có nhãn chữ. Chỉ có đồng hồ combo (FX-06) bắt đầu "cháy".

### FX-04 · Mỗi tầng thêm một "chất liệu" mới (US-2)
- **Given** mức "Nhiều", `no-preference`, một ván gõ đúng liên tục tới combo 100
- **When** lần lượt chạm từng tầng
- **Then** mỗi tầng có thành phần nhìn thấy được, kiểm được qua DOM hoặc qua test đơn vị của hàm cấu hình tầng:
  | Tầng | Thành phần bắt buộc | Âm (nếu `soundEnabled`) |
  |---|---|---|
  | 3 | Đồng hồ combo (FX-06) chuyển sang trạng thái "cháy" | `pop` |
  | 5 | Nhãn FX-03 + câu khen; owl mood `cheer` | `sparkle` |
  | 10 | Một chùm pháo giấy bắn từ ký tự vừa gõ (≥ 30 hạt, theo mức trần FX-17) | `sparkle` |
  | 15 | Một nhân vật phụ chạy ngang qua màn hình 1 lần (chọn ngẫu nhiên từ pool ≥ 3 nhân vật), xong trong ≤ 2500ms | `boing` |
  | 20 | Nền "thức dậy": bầu trời/khung đổi sang biến thể sáng hơn (chuyển một lần ≤ 1000ms, không lặp), owl đeo 1 phụ kiện ngẫu nhiên từ pool ≥ 3 | `fanfare` ngắn |
  | 30 | "Siêu cấp": caret có vệt màu, ký tự đã gõ có hiệu ứng lấp lánh tĩnh/chậm, giữ đến khi combo về 0 hoặc hết ván | — |
  | 40 | Mưa sticker ở hai gutter, nằm **sau** lớp chữ, opacity ≤ 0.6, xong trong ≤ 2500ms | `sticker` |
  | 50 | Owl "biến hình" (phát sáng/cánh lửa) một lần ≤ 2000ms rồi giữ phụ kiện | `fanfare` |
  | 75, 100, 150… | Pháo hoa nền toàn màn một lần ≤ 2500ms, nằm sau lớp chữ | `fanfare` |
- **And** các thành phần có trạng thái "giữ" (đồng hồ cháy, nền sáng, phụ kiện owl, vệt caret) trở về trạng thái ban đầu trong ≤ 600ms khi combo về 0 (FX-13) hoặc khi ván mới bắt đầu (FX-18).
- **And** mỗi tầng chỉ phát đúng 1 âm của tầng. Âm tầng thay cho nốt phím (FX-09) ở phím chạm tầng, không chồng lên nhau.

### FX-05 · Ít lặp lại: pool biến thể và chống lặp (US-1, US-2)
- **Given** hàm chọn biến thể thuần nhận bộ sinh ngẫu nhiên được inject (seed) và lịch sử các lần chọn gần nhất
- **When** chọn liên tiếp 100 lần từ một pool có kích thước `n ≥ 4` với cửa sổ chống lặp `k`
- **Then** không có phần tử nào xuất hiện lại trong `k` lần chọn gần nhất (`k = min(3, n-1)` cho biến thể hiệu ứng; `k = 5` cho câu khen). Với 2 seed khác nhau, chuỗi kết quả khác nhau. Cùng seed thì cho cùng chuỗi.
- **And** kích thước pool tối thiểu: câu khen combo ≥ 20 câu mỗi ngôn ngữ (`vi`, `en`); biến thể nhãn/hiệu ứng mỗi tầng ≥ 2; biến thể pop ký tự ≥ 4 (FX-07); biến thể hoàn thành từ ≥ 4 (FX-10); hình hạt ≥ 4 (FX-08).
- **And** mỗi lần phát hiệu ứng, các tham số nhỏ (góc, màu, số hạt trong khoảng ±20% quanh giá trị gốc nhưng không vượt trần FX-17) được ngẫu nhiên hoá. Trong 10 lần chạm cùng một tầng (với seed cố định) có ít nhất 2 bộ tham số khác nhau.
- **And** trong một ván chạm tầng 5 năm lần (gõ sai xen giữa), không có 2 lần liên tiếp hiện cùng một câu khen.

### FX-06 · Đồng hồ combo cạnh owl (US-2)
- **Given** màn chơi, ván đang chơi hoặc chưa bắt đầu, mọi mức hiệu ứng
- **When** combo thay đổi
- **Then** cạnh `GameOwl` luôn có một đồng hồ combo hiển thị số combo hiện tại. Số khớp với `gameState.combo` sau mỗi phím (kiểm ngay sau khi xử lý phím, trước frame kế tiếp).
- **And** đồng hồ có ít nhất 4 cấp hình ảnh khác nhau: combo 0–2 (tắt), 3–9, 10–29, ≥ 30, quan sát được qua thuộc tính/class trạng thái.
- **And** đồng hồ không giao ký tự của dòng chữ, `.key` hay tay gợi ý (`.hand-left`, `.hand-right`), không gây cuộn ngang ở 375–1440px, có `aria-hidden="true"` (thông tin cho trình đọc màn hình vẫn qua `ComboAnnouncer`).

### FX-07 · Pop ký tự nhiều kiểu (US-1)
- **Given** mức "Nhiều" hoặc "Vừa", `no-preference`
- **When** gõ đúng 20 phím liên tiếp
- **Then** ký tự vừa gõ chạy một hiệu ứng pop chọn từ pool ≥ 4 kiểu (ví dụ squash-stretch, lắc xoay, nhảy kèm bóng, lật nhẹ), không có 2 phím liên tiếp cùng một kiểu.
- **And** mỗi pop kết thúc trong ≤ 400ms và chỉ đổi `transform`/`opacity`/màu (không đổi kích thước layout: vị trí các ký tự còn lại không dịch chuyển, kiểm bằng `getBoundingClientRect` trước/sau).

### FX-08 · Hạt bắn ra từ chính ký tự vừa gõ (US-1)
- **Given** mức "Nhiều", `no-preference`
- **When** gõ đúng một ký tự không phải phím cách
- **Then** sinh 3–5 hạt có tâm xuất phát nằm trong bounding box của ký tự vừa gõ (nới ±8px). Hình hạt chọn từ pool ≥ 4 hình (sao, chấm, tim, bong bóng…), dùng hình SVG/vẽ thống nhất chứ không dùng emoji hệ điều hành.
- **And** mỗi hạt biến mất trong ≤ 600ms; tổng số node hạt DOM tại mọi thời điểm ≤ 60; hạt có `pointer-events: none`, `aria-hidden="true"`.
- **And** ở mức "Vừa" hoặc "Ít", hoặc khi reduced motion, không sinh hạt từng phím.

### FX-09 · Nốt nhạc leo cao theo combo (US-1, US-2)
- **Given** `soundEnabled === true`
- **When** gõ đúng một phím không chạm tầng
- **Then** phát 1 nốt thuộc thang ngũ cung có sẵn (10 nốt) thay cho tiếng `correct` cố định. Bậc nốt = `min(floor(combo / 5), 9)` (combo 1–4: bậc 0; 5–9: bậc 1; … ≥ 45: bậc 9). Có test đơn vị cho hàm tính bậc.
- **And** gõ sai làm combo về 0 thì phím đúng kế tiếp quay về bậc 0. Âm `wrong` giữ nguyên như hiện tại.
- **And** âm lượng (gain đỉnh) của mọi âm mới hoặc âm được dùng lại ≤ gain đỉnh của `correct` hiện tại. `soundEnabled === false` thì không phát âm nào. `soundMode` `character`/`word` vẫn đọc chữ/từ như hiện tại.

### FX-10 · Hoàn thành từ: nhiều kiểu, không lặp liền (US-1)
- **Given** mức "Nhiều" hoặc "Vừa", `no-preference`
- **When** hoàn thành một từ (`completedWord !== null`)
- **Then** từ vừa xong chạy một hiệu ứng chọn từ pool ≥ 4 kiểu (ví dụ chữ nhảy domino lệch nhịp, từ bay thành ngôi sao về phía đồng hồ combo/thanh tiến độ, nổ pháo giấy nhỏ, đóng dấu sticker ✓). Không có 2 từ liên tiếp cùng kiểu; xong trong ≤ 700ms.
- **And** trong suốt hiệu ứng, ký tự kế tiếp cần gõ (`text[currentIndex]`) vẫn là phần tử trên cùng tại tâm của nó (`document.elementFromPoint` trả về chính ký tự đó hoặc phần tử con).

### FX-11 · Owl thỉnh thoảng khen khi xong từ (US-3)
- **Given** mức "Nhiều" hoặc "Vừa", bộ sinh ngẫu nhiên inject được
- **When** hoàn thành một từ và không có nhãn tầng (FX-03) đang hiện
- **Then** với xác suất 1/6 (kiểm bằng seed: trong 600 lần mô phỏng, số lần khen nằm trong 70–130), owl hiện bong bóng thoại một câu từ pool ≥ 20 câu mỗi ngôn ngữ, không lặp câu trong 5 lần gần nhất.
- **And** bong bóng biến mất trong ≤ 1500ms, không giao ký tự dòng chữ, `.key` hay tay gợi ý, có `aria-hidden="true"`. Ở mức "Ít" không có bong bóng khen từ.

### FX-12 · Owl phản ứng theo sự kiện và khi dừng lâu (US-3)
- **Given** màn chơi, ván đã bắt đầu và chưa kết thúc, không có panel/modal mở
- **When** xảy ra lần lượt các sự kiện
- **Then** owl đổi mood như sau:
  | Sự kiện | Mood |
  |---|---|
  | Chạm tầng ≥ 5 | `cheer` trong ≤ 1200ms rồi về `idle` |
  | Gõ sai 1 phím | `thinking` trong ≤ 800ms (không bao giờ `sad`) |
  | Gõ sai 3 phím liên tiếp | `encourage` + bong bóng 1 câu động viên từ pool ≥ 5 câu mỗi ngôn ngữ (ví dụ "Không sao, lại nào!" / "No worries, try again!") |
  | 5 giây không gõ | `wave` (gợi ý gõ tiếp) |
  | 15 giây không gõ | `sleep` |
  | Gõ phím khi đang `sleep` | `happy` (giật mình tỉnh) trong ≤ 800ms rồi về `idle` |
- **And** khi ván chưa bắt đầu, đã kết thúc, hoặc panel/modal đang mở thì không chạy bộ đếm 5s/15s.

### FX-13 · Gõ sai và đứt chuỗi nhẹ nhàng (US-3)
- **Given** đang có combo ≥ 3
- **When** gõ sai một phím
- **Then** đồng hồ combo chạy hiệu ứng "xì hơi thành khói" ≤ 600ms rồi về trạng thái tắt; các trạng thái "giữ" của FX-04 bị gỡ trong ≤ 600ms; không sinh hạt, pháo hay nhãn mới.
- **And** không có rung toàn màn (phần tử `main`/`body` không có `transform` thay đổi), không có lớp phủ đỏ hay chớp toàn màn; hiệu ứng ký tự sai (màu + lắc) giữ như hiện tại; không phát thêm âm ngoài `wrong`.
- **And** combo < 3 thì gõ sai không có hiệu ứng khói.

### FX-14 · Cài đặt mức hiệu ứng Nhiều / Vừa / Ít (US-4)
- **Given** SettingsPanel mở, guest hoặc user đăng nhập, `lang` `vi` hoặc `en`
- **When** chọn một trong 3 mức (nhãn `vi`: "Nhiều" / "Vừa" / "Ít"; `en`: "Lots" / "Some" / "Few"; tiêu đề `vi` "Hiệu ứng", `en` "Effects")
- **Then** mức mới áp dụng ngay cho ván đang chơi, không cần tải lại. Giá trị mặc định khi chưa từng chọn là "Nhiều" (giả định Q1).
- **And** từng mức bật các nhóm sau:
  | Nhóm | Nhiều | Vừa | Ít |
  |---|---|---|---|
  | Pop ký tự FX-07 | có | có | không (chỉ đổi màu như hiện tại) |
  | Hạt từng phím FX-08 | có | không | không |
  | Hoàn thành từ FX-10 | có | có | không |
  | Owl khen từ FX-11 | có | có | không |
  | Tầng combo FX-04 | đủ bảng | chỉ tầng 3, 5, 10, 20, 50 (không nhân vật chạy, không mưa sticker, không pháo hoa nền) | chỉ đồng hồ combo + nhãn tĩnh FX-15 |
  | Đồng hồ combo FX-06, owl FX-12, âm thanh FX-09 | có | có | có |
- **And** guest: tải lại trang vẫn giữ mức đã chọn (localStorage). User đăng nhập: chọn mức thì `PUT /api/users/me/settings` gửi trường mức hiệu ứng, trả 200; đăng nhập trên trình duyệt khác thì `loadFromServer` khôi phục đúng mức. Gửi giá trị ngoài 3 mức trả 400 với envelope `{ success: false, error }`.
- **And** mất mạng/API lỗi khi lưu: mức vẫn áp dụng tại chỗ, không chặn chơi, không hiện lỗi chặn màn.

### FX-15 · prefers-reduced-motion (US-4)
- **Given** trình duyệt giả lập `prefers-reduced-motion: reduce`, mức bất kỳ
- **When** gõ đúng tới combo 50, gõ sai, hoàn thành từ
- **Then** hành vi như mức "Ít": không có hạt, không pháo, không nhân vật chạy, không mưa sticker, không bay. Nhãn tầng ≥ 5 hiện tĩnh ở vị trí FX-03 và biến mất trong ≤ 900ms. Owl đổi mood không có chuyển động dịch vị trí.
- **And** sau 500ms kể từ mỗi sự kiện, `document.getAnimations().filter(a => a.playState === 'running')` không chứa animation nào do FX tạo ra. Âm thanh và `ComboAnnouncer` vẫn hoạt động.

### FX-16 · An toàn nhấp nháy (US-4)
- **Given** mức "Nhiều", `no-preference`, ván đi qua mọi tầng tới 100
- **When** mọi hiệu ứng FX chạy
- **Then** không có hiệu ứng nào làm một vùng thay đổi độ sáng lặp lại (sáng→tối→sáng) nhiều hơn 3 lần trong 1 giây. Mọi keyframe lặp đổi `opacity`/độ sáng có chu kỳ ≥ 334ms (kiểm bằng test đọc CSS/cấu hình hiệu ứng).
- **And** không có lớp phủ toàn màn đổi độ sáng (flash). Lớp pháo hoa nền và mưa sticker có opacity ≤ 0.6 và nằm dưới lớp chữ. Không dùng nhấp nháy màu đỏ bão hoà.

### FX-17 · Hiệu năng và trần tài nguyên (US-5)
- **Given** màn chơi classic, mức "Nhiều", `no-preference`, văn bản ≥ 110 ký tự không lỗi, Chrome CPU throttle 4x
- **When** gõ tự động đúng toàn bộ, cách nhau 30ms, đi qua mọi tầng tới 100
- **Then** mọi phím được ghi nhận: ván kết thúc, `correctKeystrokes` bằng độ dài văn bản, `accuracy = 100`, `maxCombo ≥ 100`. Focus luôn ở input ẩn.
- **And** không có long task > 100ms (`PerformanceObserver` `longtask`). Tại mọi thời điểm: ≤ 60 node hạt DOM, ≤ 1 nhãn combo, ≤ 1 chùm/hiệu ứng canvas đang chạy, ≤ 200 hạt canvas còn sống.
- **And** First Load JS của route `/` (theo `next build`) tăng không quá 15 KB so với commit nền HF (`8b09368`), cho phép thư viện hiệu ứng được tải trễ (giả định Q5). Không phát sinh request mạng nào sau phím đầu tiên của ván.
- **And** khi tab bị ẩn (`visibilitychange` → hidden), mọi hiệu ứng canvas dừng.

### FX-18 · Kết thúc ván, ván mới, panel mở (US-5)
- **Given** đang có bất kỳ hiệu ứng FX nào hiển thị (nhãn, hạt, pháo, nhân vật chạy, mưa sticker, bong bóng owl, trạng thái "giữ")
- **When** ván kết thúc (hết chữ, hết giờ `timeAttack`, hết mạng `challenge`), bấm Chơi lại, hoặc đổi chế độ/cấp/bài trong SideNav
- **Then** mọi hiệu ứng FX bị gỡ trong ≤ 1 frame sau `finish()`/`clear()`, không còn gì đè lên `CelebrationModal`. Đồng hồ combo về 0. Confetti màn kết quả (KR-10) chạy như hiện tại.
- **And** khi `CelebrationModal`, SettingsPanel, HistoryPanel hoặc CustomTextModal đang mở, không tạo hiệu ứng FX mới.

### FX-19 · Không che chữ, phím, tay gợi ý; không cuộn ngang (US-5)
- **Given** viewport 375×667, 768×1024, 1024×768, 1280×720, 1440×900; mức "Nhiều"; `fingerGuide` bật và tắt
- **When** gõ đi qua mọi tầng tới 100 và lấy mẫu mỗi 100ms trong lúc hiệu ứng chạy
- **Then** tại tâm ký tự kế tiếp cần gõ, tâm mỗi `.key`, tâm `.hand-left` và `.hand-right` (nếu có), `document.elementFromPoint` trả về chính phần tử đó hoặc phần tử con (không phần tử FX nào nằm trên).
- **And** `document.documentElement.scrollWidth ≤ clientWidth` tại mọi mẫu. Mọi phần tử FX có `pointer-events: none`. Bấm phím ảo trên thiết bị cảm ứng vẫn ghi nhận phím trong lúc hiệu ứng chạy.

### FX-20 · Ngôn ngữ, theme, guest/đăng nhập (US-3, US-4)
- **Given** `lang` `vi` và `en`; theme light, dark, colorful; guest và user đăng nhập
- **When** chạm tầng 5, 10 và hiện bong bóng owl
- **Then** mọi câu khen/động viên/nhãn cài đặt mới có key ở cả `vi.ts` và `en.ts`. Pool `vi` có câu có dấu và hiển thị đủ dấu, không bị cắt ở 375px. Chữ nhãn đạt tương phản ≥ 4.5:1 (hoặc ≥ 3:1 với chữ lớn), axe `color-contrast` không vi phạm.
- **And** hành vi hiệu ứng giống nhau giữa guest và user đăng nhập. Ngoài trường mức hiệu ứng ở FX-14, không có API, model hay request mới.

## Edge cases
| # | Tình huống | Hành vi mong muốn | AC |
|---|---|---|---|
| E1 | Gõ rất nhanh, chạm tầng mới khi hiệu ứng tầng trước còn chạy | Nhãn mới thay nhãn cũ; canvas không chồng quá 1 chùm; giữ trần tài nguyên | FX-03, FX-17 |
| E2 | Combo vượt 100 (101…149, 151…) | Chỉ có hiệu ứng tầng ở 150, 200…; phím thường vẫn có pop/hạt/nốt (bậc 9) | FX-02, FX-09 |
| E3 | Tầng chạm đúng phím cuối văn bản | `finish()` chạy, không hiệu ứng nào đè `CelebrationModal` | FX-18 |
| E4 | Gõ sai khi đang có nhân vật chạy/mưa sticker | Hiệu ứng một lần đang chạy chạy nốt theo thời hạn của nó, không sinh mới; trạng thái "giữ" bị gỡ | FX-04, FX-13 |
| E5 | Văn bản ngắn (< 3 ký tự, chế độ `lesson`) | Không chạm tầng; vẫn có pop/hạt/nốt từng phím | FX-07, FX-08 |
| E6 | Phím cách | Có pop và nốt, không sinh hạt (FX-08); hoàn thành từ theo FX-10 | FX-08, FX-10 |
| E7 | `soundEnabled = false` | Không có âm nào; hình ảnh không đổi | FX-09 |
| E8 | Reduced motion của hệ thống + mức "Nhiều" | Reduced motion thắng, hành vi như "Ít" | FX-15 |
| E9 | Máy yếu (CPU 4x), tablet | Không mất phím, không long task > 100ms | FX-17 |
| E10 | Màn hẹp 375px: không còn gutter | Mưa sticker/pháo nền vẫn nằm sau chữ, không che tâm ký tự/phím/tay; không cuộn ngang | FX-19 |
| E11 | Không có bàn phím vật lý (bấm phím ảo) | Cùng hiệu ứng như gõ phím vật lý; hiệu ứng không chặn chạm | FX-19 |
| E12 | Panel/modal mở giữa ván; tab ẩn | Không tạo hiệu ứng mới; canvas dừng khi ẩn; bộ đếm idle không chạy | FX-12, FX-17, FX-18 |
| E13 | Mất mạng / API settings lỗi | Mọi hiệu ứng là client; mức hiệu ứng vẫn áp dụng tại chỗ | FX-14 |
| E14 | Body PUT settings có mức hiệu ứng sai (`"max"`, số, chuỗi rất dài) | 400, không ghi DB | FX-14 |
| E15 | Gõ chữ tiếng Việt có dấu qua IME (nhiều keydown cho 1 ký tự) | Hiệu ứng gắn với phím được engine chấm đúng/sai, không phát thêm cho phím trung gian | FX-07, FX-09 |
| E16 | Đổi ngôn ngữ giữa ván | Câu khen kế tiếp lấy theo ngôn ngữ mới; lịch sử chống lặp có thể reset | FX-05, FX-20 |
| E17 | Đua multiplayer `/race/[roomId]`, chế độ Little, `/games`, lobby | Không thay đổi | ngoài phạm vi |
| E18 | Màn kết quả (sao rơi lần lượt, hộp quà sticker, nhiều "màn chào") | Giữ như hiện tại | ngoài phạm vi |
| E19 | Easter egg hiếm (chim bay ngang 1/50 phiên) | Không làm | ngoài phạm vi |

## Ngoài phạm vi
- Đổi luật game, điểm, `COMBO_MILESTONES`, `calculateCharScore`, `maxCombo`, lưu lịch sử/kỷ lục.
- Màn kết quả (`CelebrationModal`): sao rơi lần lượt, hộp quà/sticker vào album, nhiều kiểu "màn chào", banner kỷ lục mới, toast achievement mới. Đề xuất cho vòng sau.
- Theme hiệu ứng theo bài/màn (biển, vũ trụ, rừng, kẹo, khủng long) và cho trẻ tự chọn theme. Vòng này dùng một bộ hình chung, xem Q4.
- Mascot Rive/Lottie, owl state machine bằng file animation ngoài. Cũng không dùng giọng đọc cho câu khen của owl.
- Bỏ cơ chế dừng `.kr-loop` khi `data-playing` (KR-16) hay làm nền chuyển động liên tục khi chơi. Tầng 20 chỉ là chuyển cảnh một lần.
- Mở khoá dần hiệu ứng theo số bài đã chơi; easter egg hiếm; rung thiết bị (vibration).
- Hiệu ứng ở multiplayer race, Little mode, `/games`, lobby, admin/classroom.
- Gợi ý phím đúng phát sáng trên bàn phím ảo khi gõ sai (nếu chưa có) và đổi màu ký tự sai.

## Hành vi không đổi
- HF-01..HF-04: tay gợi ý hai bên bàn phím ở ≥ 1024px, dưới bàn phím ở < 1024px, tô đúng ngón, tắt `fingerGuide` thì bàn phím căn giữa.
- Luật game, điểm, combo, `mistakeMap`, lưu record (localStorage cho guest, `saveSession` cho user đăng nhập).
- `ComboAnnouncer` (`aria-live="polite"`) thông báo đúng một lần ở mỗi mốc 5/10/20/50 với chuỗi `comboAnnounce`/`comboPraise*` hiện có.
- Âm `wrong` và hiệu ứng ký tự sai hiện có; `soundMode` `character`/`word` đọc chữ/từ như cũ.
- KR-10 (confetti màn kết quả), KR-14, KR-15, KR-16 (`.kr-loop` dừng khi `data-playing=true`), KR-20 (không cuộn ngang 375/768/1024/1440).
- Các setting hiện có và cách đồng bộ settings giữ nguyên. Chỉ thêm một trường mức hiệu ứng.

## Câu hỏi còn mở
| # | Câu hỏi | Giả định tạm đang dùng | Ảnh hưởng nếu sai |
|---|---|---|---|
| Q1 | Có làm toggle Nhiều/Vừa/Ít? Mặc định theo nhóm tuổi (`ageGroup`) hay chung? | Có toggle; mặc định "Nhiều" cho mọi nhóm tuổi (người dùng muốn nhiều hiệu ứng) | Đổi FX-14 (bảng mặc định), thêm AC theo `ageGroup` |
| Q2 | Thêm tầng bằng cách đổi `COMBO_MILESTONES` hay tách thang tầng FX riêng? | Tách thang tầng FX riêng; `COMBO_MILESTONES`, `comboPraise5/10/20/50` và `ComboAnnouncer` giữ nguyên để trình đọc màn hình không bị dồn thông báo | Nếu đổi `COMBO_MILESTONES` thì phải sửa FX-02, test KR/HF i18n và nội dung announcer |
| Q3 | Gỡ hẳn layout hai bên của HF-05/06 hay giữ gutter? | Gỡ nhãn/chữ khỏi gutter; gutter chỉ dùng làm lớp nền (mưa sticker tầng 40, pháo nền 75/100) | Nếu muốn bỏ luôn lớp nền gutter thì đổi FX-01, FX-04 |
| Q4 | Theme hiệu ứng theo bài hay cho trẻ chọn? Dùng chung album sticker với Little mode? | Vòng này một bộ hình chung, không theme theo bài, không album | Thêm AC theme/album, tăng phạm vi PR |
| Q5 | Được thêm thư viện canvas (`canvas-confetti`, ISC) không? Ngưỡng tăng First Load JS? | Được, tải trễ; trần +15 KB First Load JS cho `/`; trần 60 node DOM / 200 hạt canvas | Đổi FX-17; nếu cấm thư viện thì tầng 10/75/100 làm bằng DOM với trần 60 node |
| Q6 | Owl có nên dùng giọng đọc (`useLittleVoice`) cho câu khen? | Không (tránh chồng với `soundMode` đọc chữ/từ) | Thêm AC giọng đọc, xử lý xung đột với speech hiện có |
| Q7 | Xác suất owl khen khi xong từ 1/6 có phù hợp? | 1/6 | Đổi số ở FX-11 |
| Q8 | Sau 100, có hiệu ứng mỗi +50 hay mỗi +25? | Mỗi +50 (150, 200, …) | Đổi FX-02 |
| Q9 | Âm thanh cho tầng có cần mới hay dùng lại `pop/boing/sparkle/fanfare/sticker`? | Dùng lại âm có sẵn, không thêm file âm thanh | Thêm AC âm mới và tài nguyên tải |

## Lịch sử
- v1 2026-11-06 17:30: bản đầu, dựa trên `00-research.md`. Thay thế HF-05..HF-11 (nhãn/pháo hai bên), giữ HF-01..HF-04 và mở rộng HF-12/HF-13.
