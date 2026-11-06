# KD · Hiệu ứng "đã mắt" cho trẻ: Research

Trạng thái: research (chưa phải requirements). Nhánh: `feature/kid-delight-effects`, nền là HF (`docs/features/hand-hints-side-fireworks-streak/`).

## 1. Hiện trạng (đọc code, không sửa)

| Trigger | Hiện có | File |
|---|---|---|
| Mỗi phím đúng | Chữ `charPop` scale 1.6 rồi xoay nhẹ, gạch chân xanh; 1 tiếng sine 880→1320Hz **giống hệt nhau** mỗi lần | `components/game/WordDisplay.tsx`, `styles/game.css` (`charPop`), `lib/audio/sound-engine.ts` (`correct`) |
| Xong 1 từ | `wordBurst`: cả từ nảy lên 12px | `styles/game.css` |
| Phím sai | Chữ đỏ coral + `shake` 4px; tiếng triangle trầm nhỏ (gain 0.05, đã nhẹ nhàng) | `game.css`, `sound-engine.ts` |
| Chuỗi (combo) | Chỉ 4 mốc `[5,10,20,50]` (`packages/game-engine/src/scoring.ts`). `ComboBurst` vẽ **2 bản sao giống hệt** nhãn "🔥xN" + 1 câu khen cố định (`comboPraise5/10/20/50`) ở 2 gutter trái/phải, kèm pháo hoa CSS đối xứng gương (`fireworkPlan` vị trí cố định, 6–8 hạt chấm tròn). Hiện 1200ms | `components/game/ComboBurst.tsx`, `ComboFireworks.tsx`, `lib/hf/fireworks.ts`, `lib/kr/combo-celebration.ts`, `styles/decor.css` |
| Mascot khi chơi | `GameOwl` size `sm`, chỉ đổi `idle`↔`happy` (nhảy 10px) khi có mốc; khi đang gõ thì `still` | `components/game/GameOwl.tsx`, `styles/motion.css` |
| Hết bài | `CelebrationModal`: Owl `lg` theo mood, `Confetti` 24 mảnh chữ nhật CSS rơi, sao, `fanfare`/`complete` | `components/game/CelebrationModal.tsx`, `components/ui/Confetti.tsx`, `lib/kr/result-celebration.ts` |
| Nền | Mây trôi, `twinkle`, scene day/night/candy SVG, nhưng **mọi `.kr-loop` bị pause khi `data-playing=true`** | `styles/decor.css`, `styles/motion.css` |
| Little mode | `Burst` bắn 7 emoji theo quỹ đạo cố định, pet, sticker (`little-*` keyframes) | `components/little/Burst.tsx`, `styles/little*.css` |
| Âm thanh | Web Audio tổng hợp: `correct, wrong, complete, click, pop, boing, sparkle, fanfare, sticker`, `playNote` theo thang ngũ cung. Phần lớn (`pop/boing/sparkle/sticker`) **chưa dùng ở màn chơi chính** | `lib/audio/sound-engine.ts`, `hooks/useSound.ts` |
| Reduced motion | Hook `usePrefersReducedMotion` + `@media (prefers-reduced-motion)` toàn cục trong `motion.css` (ép duration 0.01ms), ẩn `.fw-burst` | `hooks/usePrefersReducedMotion.ts` |
| Thư viện | **Không có** lib animation nào (không framer-motion, canvas-confetti, lottie, rive). Toàn CSS keyframes + DOM span | `apps/web/package.json` |

### Vì sao streak "2 bên" thấy nhạt và lệch
1. **Sai chỗ nhìn**: trẻ đang nhìn chữ cần gõ ở giữa; nhãn nằm ở mép gutter ngoài vùng fovea, nên phải liếc đi mới thấy (lúc đó đã mất). Hai bản sao giống nhau chia đôi sự chú ý, đọc giống "banner quảng cáo" chứ không phải phần thưởng do chính hành động tạo ra (vi phạm `motion-meaning`: hiệu ứng phải bật ra từ chỗ gây ra nó).
2. **Lặp 100%**: cùng 4 câu, cùng icon lửa, cùng vị trí pháo, cùng tiếng. Sau 2–3 lần trẻ "quen" và bỏ qua (habituation).
3. **Thang leo quá thưa và phẳng**: 5→10→20→50, giữa 20 và 50 không có gì; chênh lệch giữa các mốc chỉ là thêm vài chấm tròn.
4. **Không có "juice" từng phím**: mỗi phím đúng chỉ có 1 pop chữ; không hạt, không trail, không đồng hồ chuỗi, âm thanh không leo cao theo combo.
5. **Mascot thụ động**: cú nhảy 10px của owl `sm` gần như không ai thấy; không có phản ứng khác nhau cho từng loại sự kiện.
6. Nền bị đóng băng khi chơi nên màn chơi "chết" về mặt thị giác.

## 2. Nguyên tắc rút ra

- **Juice = phản hồi nhiều lớp cho cùng một hành động** (Jonasson & Purho, "Juice it or lose it"): ghép tween/easing có overshoot, hạt, squash-stretch, âm thanh, rung nhẹ, màu. Không thêm cơ chế mới, chỉ làm hành động hiện có "sướng" hơn. Đối trọng (Folmer Kelly): juice phải phục vụ gameplay, không được che nội dung chính, tức là không che chữ cần gõ.
- **Hiệu ứng bật ra từ nguồn**: hạt bắn từ đúng ký tự vừa gõ, từ bay về thanh tiến độ, mascot quay đầu nhìn từ vừa xong. Mắt trẻ không phải rời khỏi dòng chữ.
- **Leo thang (escalation)**: Duolingo coi milestone như "power-up" và biến Duo thành phượng hoàng lửa; mốc lớn thì đổi hẳn hình thái chứ không chỉ "nhiều hơn". Mỗi tầng combo cần một **chất liệu mới** (hạt → nhân vật → đổi nền → sự kiện toàn màn).
- **Biến thiên có kiểm soát (variable reward)**: nghiên cứu với trẻ mẫu giáo–lớp 3 cho thấy lịch thưởng biến thiên/tăng dần duy trì động lực tốt hơn lịch cố định. Áp dụng: cố định *khi nào* có thưởng (mốc rõ ràng, công bằng) nhưng ngẫu nhiên hoá *thưởng là gì* (pool + không lặp lại liên tiếp + thỉnh thoảng "bất ngờ hiếm"). Tránh cơ chế giống cờ bạc (loot box, mất thưởng khi dừng).
- **Phản hồi trạng thái bằng nhân vật**: Duolingo/Brilliant/Khan Kids dùng state machine nhân vật (positive / negative / final success) tái sử dụng khắp app, truyền cảm xúc không cần chữ (hợp trẻ chưa đọc thạo). Khan Academy tuyển animator làm Rive state machine + đồng bộ hoạt hình với nhạc, SFX, giọng đọc.
- **Âm + hình đi đôi**: Dance Mat Typing (BBC) được khen nhờ nhân vật, bài hát, phản hồi tức thì; Nitro Type gắn tốc độ gõ vào chuyển động xe (gõ đúng = xe tăng tốc), tức là tiến độ hiển thị bằng chuyển động thay vì số.
- **Sai thì nhẹ nhàng**: không đỏ chói, không rung màn hình, không mất hết thưởng; mascot "nghiêng đầu khích lệ". Trẻ 5–8 tuổi dễ nản (đây chính là lời chê Dance Mat Typing).
- **Ít điểm chuyển động cùng lúc**: ui-ux-pro-max `excessive-motion`: 1–2 tiêu điểm chuyển động mỗi khoảnh khắc; `exit-faster-than-enter`; `no-blocking-animation`; `cancellable-state-transitions` (gõ nhanh phải thay thế hiệu ứng cũ, không xếp hàng).
- **Phong cách**: dữ liệu ui-ux-pro-max cho "Kids Learning": Claymorphism + Vibrant/Block-based + Micro-interactions; style "Tactile/Deformable": squash, bounce `cubic-bezier(0.34,1.56,0.64,1)`, ~400ms. Khớp với token `--kr-ease-back` hiện có.

## 3. Catalog hiệu ứng theo trigger

Quy ước: **[CSS]** transform/opacity thuần, **[CV]** canvas (canvas-confetti), **[SVG]** asset SVG/sticker, **[SND]** Web Audio có sẵn. Mỗi trigger có **pool** để chọn ngẫu nhiên, không lặp lại 2 lần liền (shuffle-bag).

### 3.1 Mỗi phím đúng (tần suất cao nhất, rẻ nhất)
- Pool "pop ký tự" (random 1/4): squash-stretch, xoay lắc, nhảy lên kèm bóng, lật nhẹ (rotateX). [CSS]
- Hạt nhỏ 3–5 hạt bắn ra từ chính ký tự: sao, chấm, tim, bong bóng; **theme** đổi theo màn (biển: bong bóng/cá; vũ trụ: sao/hành tinh; vườn: lá/hoa; kẹo: kẹo). [CSS hoặc CV pool]
- Nốt nhạc: thay `correct` cố định bằng `playNote` thang ngũ cung, **cao dần theo combo** (mỗi 5 phím lên 1 bậc) để tai "nghe thấy" chuỗi đang lên. Ngũ cung luôn nghe hay dù ngẫu nhiên. [SND]
- Phím ảo tương ứng: ripple màu + nảy 2px. [CSS]
- Con trỏ (caret) để lại vệt sáng ngắn (trail) khi combo ≥ 10. [CSS]

### 3.2 Hoàn thành 1 từ
- Từ "bay" thành 1 ngôi sao/đồng xu về thanh tiến độ hoặc túi mascot (hiệu ứng "collect", tạo cảm giác tích luỹ). [CSS FLIP]
- Pool hình thái (random): từ nổ thành pháo giấy nhỏ, từ biến thành bong bóng bay lên, các chữ nhảy domino (stagger 30ms), từ đóng dấu "✓" sticker. [CSS/CV]
- Thỉnh thoảng (≈1/6 từ, ngẫu nhiên) mascot nói 1 câu khen ngắn từ pool 20–30 câu vi/en, có giọng đọc `useLittleVoice` nếu bật. Không bao giờ lặp câu trong 5 lần gần nhất.
- Âm: arpeggio 2–3 nốt (`sparkle`), cao độ theo combo. [SND]

### 3.3 Combo tiers (thay cho nhãn 2 bên)
Thêm mốc **3/5/10/15/20/30/40/50/75/100** (mỗi tầng có chất liệu mới). Hiển thị ở **ngay trên dòng chữ, căn giữa, nổi rồi bay lên tan** (≤ 900ms, không che dòng đang gõ), cộng **thanh combo/đồng hồ lửa** cố định cạnh mascot luôn hiện số hiện tại.

| Tầng | Hình ảnh mới xuất hiện | Âm |
|---|---|---|
| 3 | Chấm lửa nhỏ cạnh số combo bắt đầu cháy | pop |
| 5 | Chữ số "x5" nảy giữa + 1 câu khen random; owl vỗ cánh | sparkle |
| 10 | Pháo giấy nhỏ bắn từ ký tự cuối (canvas, 30–40 hạt, emoji theo theme); viền khung chữ đổi gradient | sparkle + nốt cao |
| 15 | Nhân vật phụ chạy ngang dưới bàn phím (mèo, khủng long, tên lửa: random 1/N) | boing |
| 20 | Nền "thức dậy": mây trôi nhanh, cầu vồng mọc, sao băng; owl đội mũ/ đeo kính ngầu (phụ kiện random) | fanfare ngắn |
| 30 | "Chế độ siêu cấp": caret có vệt cầu vồng, chữ đã gõ sáng lấp lánh, nhạc nền nhẹ tăng tempo | — |
| 40 | Mưa sticker (sao, kẹo, trái tim) rơi 2 bên **phía sau** vùng chữ, mờ 60% | sticker |
| 50 | Mascot biến hình (kiểu phượng hoàng Duolingo): owl phát sáng, cánh lửa, bay vòng 1 lần | fanfare |
| 75/100 | Sự kiện hiếm: pháo hoa canvas toàn màn 1 lần + huy hiệu "Chuỗi huyền thoại" ghi vào album | fanfare dài |

Gãy chuỗi: lửa "xì hơi" thành khói nhỏ dễ thương, owl nói "Không sao, lại nào!"; không âm báo lỗi lớn.

### 3.4 Kỷ lục mới / lên cấp / sao
- Kỷ lục mới: banner "KỶ LỤC!" kiểu ruy băng thả từ trên, đồng hồ số lăn (count-up) + hiệu ứng `record-shine` đã có.
- Kết quả: sao **rơi vào từng ô lần lượt** (stagger 250ms, mỗi sao 1 nốt cao hơn), confetti canvas 1 lần với hình theo theme; mỗi lần mở kết quả random 1 trong 4–6 "màn chào" (owl nhảy dây, bắn pháo, mở hộp quà, giơ cúp).
- Hộp quà / sticker: hoàn thành bài ≥ 2 sao mở 1 sticker ngẫu nhiên đưa vào album (tái dùng `LittleAlbum`, sound `sticker`). Đây là "variable reward" lành mạnh: luôn có thưởng, chỉ *loại* thưởng là ngẫu nhiên.
- Achievement: toast huy hiệu xoay 3D nhẹ + lấp lánh, xếp hàng nếu nhiều cái.

### 3.5 Phím sai (nhẹ nhàng)
- Ký tự lắc 2 nhịp + đổi màu cam ấm (không đỏ gắt); phím đúng trên bàn phím ảo phát sáng gợi ý; tay gợi ý (HandGuide) chỉ ngón đúng.
- Mascot nghiêng đầu (`thinking`/`encourage`) thay vì buồn; sau 3 lỗi liên tiếp mới nói câu động viên.
- Tuyệt đối không rung toàn màn, không flash.

### 3.6 Idle / động viên
- 5s không gõ: owl ngáp, chỉ tay vào phím cần gõ; 15s: owl ngủ gật `sleep` + "zzz", gõ phím là owl giật mình tỉnh (khoảnh khắc buồn cười).
- Easter egg hiếm (1/50 phiên): chim bay ngang, cá nhảy khỏi mặt nước... tạo cảm giác "thế giới sống".

### 3.7 Nền ambient
- **Không pause toàn bộ** nền khi chơi; chỉ giữ chuyển động chậm, biên độ thấp, ở rìa (mây trôi 30–60s, lá rơi thưa), opacity thấp để không cạnh tranh với chữ. Nền **phản ứng theo combo** (trời sáng dần, thêm cầu vồng) để chuỗi được "nhìn thấy" bằng thế giới.
- Theme theo màn/bài: biển, vũ trụ, rừng, kẹo, khủng long, mỗi theme có bộ hạt, nhân vật chạy ngang, sticker riêng. 5 theme × pool 4–6 = hàng chục biến thể mà mỗi phiên chỉ gặp một phần.

### 3.8 Chống lặp: cơ chế
- `pickNonRepeating(pool, history, n=3)` (shuffle-bag) đặt trong `packages/game-engine` (thuần TS, test được bằng seed).
- Mỗi trigger có ≥ 4 biến thể; mỗi tầng combo có ≥ 2 biến thể; câu khen ≥ 20/ngôn ngữ (vi + en).
- Biến tham số ngẫu nhiên nhỏ (góc, màu, số hạt ±20%) để cùng một hiệu ứng không bao giờ giống hệt.
- Mở khoá dần: hiệu ứng mới xuất hiện theo số bài đã chơi, nên trẻ chơi lâu vẫn thấy cái mới.

## 4. Vị trí trên màn hình
- **Tâm điểm = dòng chữ đang gõ + mascot.** Hạt từ ký tự; nhãn combo căn giữa phía trên dòng chữ, bay lên rồi tan; thanh/ngọn lửa combo đặt cạnh mascot (vị trí cố định, luôn hiện, đổi kích cỡ theo tầng).
- 2 gutter chỉ dùng cho **lớp nền mờ** (mưa sticker, pháo hoa xa) ở tầng cao, không chứa chữ/số.
- Không đè chữ đang gõ, không đè phím được gợi ý, không đè HandGuide (giữ các AC HF-05/HF-12).

## 5. An toàn & hiệu năng
- **WCAG 2.3.1 (A)**: ≤ 3 lần chớp/giây; tránh nhấp nháy đỏ bão hoà; không flash toàn màn. **WCAG 2.3.3 (AAA)**: chuyển động do tương tác phải tắt được, nên dùng `prefers-reduced-motion` + **toggle "Hiệu ứng: Nhiều / Vừa / Ít" trong Settings** (phụ huynh chỉnh). Reduced-motion: giữ đổi màu/opacity, nhãn tĩnh, âm thanh, sticker; bỏ hạt, bay, rung.
- Không che chữ, không chặn input (`pointer-events:none`), hiệu ứng mới **thay thế** hiệu ứng cũ cùng loại (giới hạn đồng thời: ≤ 1 nhãn combo, ≤ 1 burst canvas, ≤ 60 node DOM hạt, như `FIREWORK_MAX_NODES` hiện có).
- Per-keystroke: chỉ transform/opacity, không layout; tái dùng node (pool) thay vì mount/unmount mỗi phím; không setState React theo từng hạt (dùng ref + class hoặc canvas). Ngân sách < 4ms/frame cho FX, input feedback < 100ms.
- Canvas: 1 canvas overlay dùng chung, `useWorker: true` (OffscreenCanvas), tự dừng khi `visibilitychange` hidden (như `Confetti` hiện tại).
- Âm lượng: giữ gain thấp, có trần; tránh âm chói tần số cao lặp lại liên tục; tôn trọng `soundEnabled`.
- Emoji làm hạt hiển thị khác nhau theo OS → ưu tiên `shapeFromPath`/SVG sticker riêng để thống nhất phong cách (ui-ux-pro-max `no-emoji-icons`).

## 6. Thư viện: khuyến nghị

| Lib | Kích thước | License | Hợp với | Ghi chú |
|---|---|---|---|---|
| **canvas-confetti** | ~7 KB min (số đo của bản fork; cần tự xác nhận) | ISC | Burst từ toạ độ ký tự, pháo hoa, mưa sticker | `origin`, `shapeFromText` (emoji), `shapeFromPath` (SVG), `useWorker`, `disableForReducedMotion`. **Đề xuất dùng.** |
| CSS keyframes (hiện có) | 0 KB | — | Pop ký tự, squash, nhãn combo, nền | Giữ cho mọi hiệu ứng per-keystroke |
| motion (framer-motion) | full ~43 KB, `LazyMotion`+`m` ~5 KB, `animate` mini ~3.3 KB | MIT | Spring, layout/FLIP (từ bay về thanh tiến độ), exit animation | Tuỳ chọn; chỉ thêm nếu cần FLIP/spring nhiều. `animate` mini đủ rẻ |
| dotLottie (`@lottiefiles/dotlottie-react`) | ~35 KB gz + WASM ~500 KB tải từ CDN | MIT (player); file free: Lottie Simple License (được dùng thương mại) | Cảnh ăn mừng lớn (cúp, hộp quà) | WASM nặng, ảnh hưởng LCP; chỉ lazy-load ở màn kết quả, self-host WASM |
| Rive (`@rive-app/canvas-lite`) | WASM ~261 KB brotli | MIT runtime | Mascot state machine (idle/happy/cheer/sad/biến hình) | Chất lượng nhất cho mascot nhưng cần designer làm file `.riv`; cân nhắc giai đoạn 2 |
| tsParticles | lớn hơn nhiều (engine + preset) | MIT | Nền hạt liên tục | Không cần; canvas-confetti + CSS đã đủ |

**Kết luận**: Giai đoạn 1 = CSS (hiện có) + `canvas-confetti` (thêm qua `pnpm --filter @typing-adventure/web add canvas-confetti`) + SVG sticker/nhân vật tự vẽ + Web Audio sẵn có; logic chọn biến thể và tầng combo nằm ở `packages/game-engine`. Giai đoạn 2 (tuỳ chọn) = Rive cho owl biến hình, Lottie lazy cho màn kết quả.

## 7. Câu hỏi mở cho BA
1. Có làm toggle mức hiệu ứng (Nhiều/Vừa/Ít) trong Settings không? Mặc định theo nhóm tuổi (`AGE_PROFILES`)?
2. Đổi `COMBO_MILESTONES` trong engine (ảnh hưởng `comboPraise*` i18n, test HF) hay tách mốc FX riêng khỏi mốc điểm?
3. Gỡ hẳn layout 2 bên của HF-05/HF-06 (đụng AC HF đã QC PASS) hay giữ gutter làm lớp nền?
4. Theme theo bài hay để trẻ chọn? Có sticker album chung với Little mode?

## Nguồn
- Duolingo, Streak milestone design & animation: https://blog.duolingo.com/streak-milestone-design-animation/
- Duolingo streak mechanics teardown: https://duolingo.deconstructoroffun.com/mechanics/streaks
- Rive: Brilliant motivates learners with Rive: https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations
- Duolingo-style mascot state animation (Rive): https://dev.to/uianimation/how-duolingo-style-character-animations-are-built-in-rive-and-how-product-teams-integrate-them-into-2k6l
- Juice it or lose it (GDC Vault): https://gdcvault.com/play/1016487/contactUs ; tóm tắt: https://roblog.co.uk/2024/03/juicy-games/ ; https://gamejuice.pages.dev/articles/juice-it-or-lose-it-lessons
- "Don't juice it or lose it" (phản biện): https://gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it-
- Reward allotment & children's motivation (UMN): https://experts.umn.edu/en/publications/efficacy-of-reward-allotment-on-childrens-motivation-and-learning/
- Varied vs constant reinforcement on tablet: https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_proquest_journals_2158067901
- Nitro Type review (Common Sense): https://www.commonsense.org/education/reviews/nitro-type
- Dance Mat Typing review: https://focusedresources.ca/en/k-12-evaluated-resource-collection/bitesize-dance-mat-typing
- Khan Academy Kids animator role (Rive, sync audio): https://www.edtech.com/jobs/animator-khan-kids-12-month-contract-60hour-40-hoursweek-8041
- WCAG 2.3.1: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- WCAG 2.3.3: https://w3.org/WAI/WCAG21/Understanding/animation-from-interactions
- canvas-confetti: https://github.com/catdad/canvas-confetti
- Motion bundle size: https://motion.dev/docs/react-reduce-bundle-size
- dotLottie WASM/LCP: https://forum.lottiefiles.com/t/how-to-reduce-dotlottie-initial-rendering-time-due-to-wasm/6802 ; license: https://help.lottiefiles.com/animation-licensing-basics-
- Rive web runtime/lite: https://rive.app/docs/runtimes/web/migration-guides ; https://npmjs.com/package/@rive-app/canvas
- ui-ux-pro-max local data: product "Kids Learning", style "Tactile Digital / Deformable UI", UX "Excessive Motion", "Reduced Motion"
