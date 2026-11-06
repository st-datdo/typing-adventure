# HF · Tay gợi ý hai bên bàn phím, lời khen chuỗi ra hai bên kèm pháo hoa — Design

Trạng thái: draft
Nguồn: 01-requirements.md

Kế thừa hệ thiết kế KR (`docs/features/kid-friendly-ui-redesign/02-design.md`, `styles/tokens.css`). Không thêm màu, font, ảnh, âm thanh hay thư viện mới. Chỉ dùng token `--kr-*` sẵn có.

## Luồng người dùng
1. Mở `/` (guest hoặc user), `fingerGuide` bật, màn ≥ 1024px → màn chơi: hai tay đứng hai bên bàn phím, tên ngón dưới bàn tay đang dùng (HF-01, HF-02).
2. Màn < 1024px → hai tay vẫn ở dưới bàn phím như hiện tại (HF-03). `fingerGuide` tắt → không có tay, bàn phím căn giữa như cũ (HF-04).
3. Gõ đúng liên tiếp tới mốc 5/10/20/50 → hai bên vùng chữ (màn rộng) hoặc phía trên vùng chữ, đè lên StatsBar (màn hẹp) hiện nhãn "x{mốc}" + lời khen, kèm pháo hoa hai bên. Mốc càng cao càng nhiều chùm và hạt (HF-05, HF-06, HF-07, HF-11).
4. Gõ sai → combo về 0, hiệu ứng đang chạy vẫn tự hết đúng giờ, không bắn thêm. Chạm mốc lại thì ăn mừng lại (HF-08).
5. Ván kết thúc, Chơi lại, đổi chế độ, hoặc mở panel/modal → gỡ ngay nhãn và pháo hoa (HF-12).

```mermaid
flowchart TD
  A[Mở màn chơi] --> B{fingerGuide?}
  B -- tắt --> K0[Bàn phím căn giữa, không tay]
  B -- bật --> C{viewport >= 1024px?}
  C -- có --> K1[Tay trái | Bàn phím | Tay phải]
  C -- không --> K2[Bàn phím, dưới là 2 tay như cũ]
  K0 & K1 & K2 --> G[Gõ phím]
  G --> M{combo chạm mốc 5/10/20/50?}
  M -- không --> G
  M -- có --> R{reduced motion?}
  R -- có --> L1[Nhãn tĩnh hai bên, không pháo hoa]
  R -- không --> L2[Nhãn hai bên + pháo hoa hai bên theo mật độ của mốc]
  L1 & L2 --> T[Tự gỡ sau 1200ms]
  L2 -- mốc mới khi chưa xong --> L2
  G -- hết văn bản / hết giờ / hết mạng / Chơi lại / mở panel --> X[Gỡ ngay, mở CelebrationModal hoặc panel]
```

## Màn hình

### S1 · Màn chơi — route `/` (sửa `components/game/GameEngine.tsx`)
- Mục đích: gõ phím. Ai thấy: guest và user đăng nhập, mọi chế độ trong `GameEngine` (không gồm Little, `/games`, `/race`).
- Thay đổi bố cục `main`:
  - Ở ≥ 1024px, `.main` nới `max-width` từ 1000px lên 1240px để có chỗ cho hai cột tay và hai lề khen. Dưới 1024px giữ nguyên 1000px.
  - Keyboard và HandGuide được bọc trong một khối mới `.kb-stage` (thay cho 2 khối `kr-enter` riêng). Khi `fingerGuide` bật thì thêm modifier `.kb-stage--hands`.
  - `.word-stage` ở ≥ 1024px có lề trong hai bên `--hf-gutter` + 12px. Hai lề này luôn được giữ, kể cả khi chưa có mốc, để vùng chữ không nhảy khi nhãn hiện.

Bố cục ≥ 1024px (`fingerGuide` bật):
```
 ┌ TopBar ────────────────────────────────────────────────────────────────────────┐
 └────────────────────────────────────────────────────────────────────────────────┘
 ┌ StatsBar ──────────────────────────────────────────────────────────────────────┐
 └────────────────────────────────────────────────────────────────────────────────┘
  lề trái (--hf-gutter)  ┌ Vùng chữ (WordDisplay) ──────────────┐  lề phải (--hf-gutter)
   ✦  ·  ✦               │  the quick brown fox jumps ...        │      ✦ · ✦
  ╭──────────╮           │  [=====tiến độ=====-------]  [Tự nhập]│   ╭──────────╮
  │ (lửa)x10 │           └───────────────────────────────────────┘   │ (lửa)x10 │
  ╰──────────╯                                                       ╰──────────╯
   Siêu quá!                                                           Siêu quá!
  ┌─────┐ ┌ Bàn phím ảo (giữ nguyên, 772–820px) ─────────────────┐ ┌─────┐
  │ tay │ │ ` 1 2 3 4 5 6 7 8 9 0 - = ⌫                          │ │ tay │
  │trái │ │ Tab q w e r t y u i o p [ ] \                        │ │phải │
  │ SVG │ │ Caps a s d f g h j k l ; ' Enter                     │ │ SVG │
  └─────┘ │ Shift z x c v b n m , . / Shift                      │ └─────┘
 [Ngón trỏ│            [        Space        ]                   │
  trái]   └──────────────────────────────────────────────────────┘
   GuestBanner
```
(Nhãn khen và pháo hoa chỉ hiện khi chạm mốc, trong khoảng 1200ms. Nhãn tên ngón nằm dưới bàn tay có ngón đang tô sáng.)

Bố cục < 1024px (768 và 375):
```
 ┌ TopBar ───────────────────────────┐
 ┌ StatsBar ─────────────────────────┐   <- lúc chạm mốc: dải khen đè lên phần dưới StatsBar
 │ ✦·✦ [(lửa)x10]   ║  [(lửa)x10] ✦·✦ │      (trái và phải mỗi bên 1 bản, trong 92px ngay trên vùng chữ)
 │      Siêu quá!   ║    Siêu quá!     │
 └───────────────────────────────────┘
 ┌ Vùng chữ (full width như hiện tại) ┐
 └───────────────────────────────────┘
 ┌ Bàn phím ảo (như hiện tại) ───────┐
 └───────────────────────────────────┘
 ┌ HandGuide (như hiện tại) ─────────┐
 │  [tay trái]  Ngón trỏ trái  [tay phải] │
 └───────────────────────────────────┘
```

- Tương tác bàn phím: không thêm phần tử focus được, Tab order giữ nguyên như KR (menu → đăng xuất → chơi lại → âm thanh → "Tự nhập chữ" → phím ảo). Focus vẫn luôn ở input ẩn. Nhãn khen, pháo hoa và tay đều `pointer-events: none`, nên bấm vào đó vẫn rơi về `.ta-screen` và focus lại input ẩn như hiện tại. Không thêm phím tắt.
- Stagger vào màn (KR-07): TopBar (0) → StatsBar (1) → vùng chữ (2) → `.kb-stage` (3, gồm bàn phím và tay). Vị trí số 4 cũ của HandGuide bị gộp vào 3. Ở màn hẹp, PTL có thể giữ `kr-enter` với `--i: 4` riêng cho `.hands-guide` nếu muốn.
- AC: HF-01, HF-02, HF-03, HF-04, HF-05, HF-06, HF-07, HF-08, HF-09, HF-10, HF-11, HF-12, HF-13.

#### C-KbStage · Bàn phím + hai tay (trong S1)
- ≥ 1024px và `.kb-stage--hands`: lưới 3 cột `[tay trái] [bàn phím] [tay phải]`, `column-gap: 12px`, `justify-content: center`.
  - Cột tay: `minmax(84px, 160px)`. Cột bàn phím: `minmax(772px, 820px)`. 772px là bề rộng tối thiểu tự nhiên của bàn phím hiện tại (hàng số: 13 phím × 44 + ⌫ 72 + 13 khe × 7 + padding 36), nên bàn phím không bị bóp.
  - Lưới có 2 hàng: hàng 1 là SVG tay (`align-self: end`), hàng 2 là nhãn ngón (`align-self: start`). Bàn phím chiếm cả 2 hàng. Hai tay luôn giao theo chiều dọc với bàn phím (HF-01).
  - `.hands-guide` dùng `display: contents` để `.hand-left`, `.hand-right`, `.finger-label` thành ô của lưới, bỏ nền card của khối tay cũ. SVG rộng 100% cột (84–160px, cao 97–185px). Tay to ra theo màn: 1024 → ~86px, 1280 → ~150px, 1440 → 160px.
  - Kiểm tra ở 1024 có thanh cuộn dọc (clientWidth khoảng 1009): nội dung 969px − 24px khe − 772px = 173px, tức khoảng 86px mỗi cột tay, vẫn ≥ 84px nên không cuộn ngang (HF-01, E1). Nếu đo thực tế bị thiếu, chỉ trong khoảng 1024–1279px giảm padding `.keyboard` từ 18px xuống 12px (lợi 12px), không giảm phím.
  - Nhãn tên ngón (`.finger-label`): một phần tử duy nhất như hiện tại, thêm `data-side="left|right"`. Ngón tay trái hoặc ngón cái → ô dưới tay trái. Ngón tay phải → ô dưới tay phải. Chữ 0.95rem/800, cho xuống dòng (`white-space: normal`, tối đa 2 dòng, `text-align: center`), `max-width` bằng cột tay. Ô nhãn giữ `min-height` 2 dòng để tay không nhảy khi đổi bên. Nhãn không chạm bàn phím vì nằm trong cột tay (HF-02).
  - Tô ngón và ánh xạ phím → ngón giữ nguyên (HF-02).
- < 1024px: `.kb-stage` là cột dọc, `.hands-guide` hiện như hiện tại (card dưới bàn phím, nhãn giữa hai tay, quy tắc ≤ 640px giữ nguyên) (HF-03, Q1).
- `fingerGuide` tắt: không có `.kb-stage--hands`, HandGuide trả `null`, `.kb-stage` là khối thường căn giữa, bàn phím `max-width: 820px` như cũ, `keyboard--hide-fingers` vẫn áp dụng. Bật lại trong SettingsPanel thì modifier đổi ngay theo store, không cần tải lại (HF-04).

#### C-ComboBurst · Nhãn khen hai bên (trong S1, sửa `ComboBurst.tsx`)
- Cấu trúc: gốc `.combo-burst` (`aria-hidden="true"`, `pointer-events: none`, `key={milestone.id}`) chứa 2 khối `.combo-side.combo-side--left` và `.combo-side--right`. Mỗi khối có:
  - `ComboFireworks` (lớp dưới, `z-index` 0)
  - `.combo-burst-value`: pill (icon `flame` + "x{mốc}")
  - `.combo-burst-praise`: lời khen `comboPraise{mốc}`
- Hai bên giống hệt nhau (Q2: đối xứng). Trình đọc màn hình chỉ đọc 1 lần qua `ComboAnnouncer` có sẵn (HF-05).
- Bỏ 8 hạt `combo-spark` ở tâm vùng chữ. Pháo hoa ở hai bên thay vai trò này.
- Vị trí ≥ 1024px: `.combo-side` `position: absolute; top: 0; bottom: 0; width: var(--hf-gutter)`, bên trái `left: 0`, bên phải `right: 0` trong `.word-stage`. `--hf-gutter: clamp(140px, 13vw, 180px)`. Nội dung căn giữa theo chiều dọc. Vì vùng chữ đã lùi vào `--hf-gutter + 12px`, khối khen không thể giao với ký tự (HF-05).
- Vị trí < 1024px: `.combo-side` `position: absolute; bottom: calc(100% + 4px); height: 92px; width: calc(50% - 4px)`, trái `left: 0`, phải `right: 0`. Khối nằm ngay trên `.word-stage`, đè lên phần dưới StatsBar (và mép TopBar nếu StatsBar thấp hơn 92px), không giao vùng chữ hay bàn phím (HF-11, Q3).
- Kích thước:
  - Màn rộng: pill 2rem/800, padding 4px 14px. Lời khen 1.1rem/800, tối đa 2 dòng.
  - Màn hẹp: pill 1.5rem, lời khen 0.95rem, 1 dòng nếu vừa, nếu không thì 2 dòng.
  - Không dùng ellipsis, không cắt chữ ("Vô địch gõ phím!" xuống dòng chứ không bị cắt) (HF-13, E10).
- Màu: pill nền `--kr-play`, viền 4px `--kr-play-deep`, chữ `--kr-on-play`. Lời khen nền đặc `--kr-card`, viền 3px `--kr-fun`, chữ `--kr-fg`. Nền đặc giúp tương phản không phụ thuộc pháo hoa phía sau (HF-13).
- Nhịp: giữ `combo-pop` 280ms + giữ + `combo-out` 900–1200ms. Animation chuyển sang từng `.combo-side` vì keyframes hiện tại dùng `translate(-50%,-50%)` cho tâm. Gỡ bằng timer `COMBO_BURST_MS = 1200` sẵn có (≤ 1500ms, HF-05).
- Thay thế mốc: mốc mới đổi `milestone.id`, gốc remount nên nhãn và pháo hoa cũ bị gỡ ngay rồi vẽ bộ mới (HF-08, E5).
- Chặn khi có lớp phủ: `ComboBurst` nhận prop `suppressed` (= `showCelebration || panel !== 'none'`). Khi `true` thì không render gì (HF-12, E12). `finish()`/`clear()` vẫn gỡ như hiện tại, và vì pháo hoa nằm trong cùng cây với nhãn nên bị gỡ cùng frame (HF-12, E7).

#### C-ComboFireworks · Pháo hoa (mới)
- Mỗi `.combo-side` có một `ComboFireworks`. Mỗi chùm gồm 1 "tên lửa" `.fw-rocket` (vệt 4×14px, bo tròn) bay từ đáy khối lên tâm chùm, rồi nổ thành N hạt `.fw-spark` (tròn 8px) toả đều.
- Chỉ dùng CSS keyframes (`transform`, `opacity`), không canvas, không thư viện, không request mạng (HF-09).
- Mật độ theo mốc (cố định, tất định, HF-07). Hàm thuần `fireworkPlan(value)` trả danh sách chùm `{ x%, y%, delayMs, sparks }` cho 1 bên. Bên phải là ảnh gương của bên trái (x → 100 − x).

| Mốc | Chùm mỗi bên | Hạt mỗi chùm | Hạt `.fw-spark` tổng n | Tên lửa tổng | Phần tử pháo hoa tổng (≤ 60) |
|---|---|---|---|---|---|
| 5 | 1 | 6 | 12 | 2 | 14 |
| 10 | 2 | 5 | 20 | 4 | 24 |
| 20 | 2 | 8 | 32 | 4 | 36 |
| 50 | 3 | 8 | 48 | 6 | 54 |

  - n(5)=12 ≥ 8. 12 < 20 < 32 < 48. Tổng tối đa 54 ≤ 60. Hai bên luôn bằng nhau (HF-06, HF-07).
- Vị trí chùm (theo % khối `.combo-side`, bên trái):
  - chùm 1 (50%, 30%)
  - chùm 2 (28%, 58%)
  - chùm 3 (72%, 62%)
- Bán kính toả `--fw-r: min(22cqw, 22cqh, 56px)`, với `.combo-side { container-type: size }`. Chùm và bán kính được chọn sao cho tâm ± bán kính ± 4px luôn nằm trong khối. Như vậy bounding box của hạt không bao giờ ra khỏi `.combo-side`, mà khối này không giao chữ hay phím (HF-06, HF-11). Không dựa vào `overflow: hidden` vì nó không đổi `getBoundingClientRect`. Chỉ thêm `overflow: hidden` như lưới an toàn.
- Nhịp mỗi chùm k (k = 0, 1, 2): `delay = 150ms × k`. Tên lửa bay 250ms (ease-out). Hạt bay 600ms (`--kr-ease-out`, scale 0.4→1, opacity 1→0, `animation-fill-mode: both`, `iteration-count: 1`). Chùm cuối kết thúc lúc 300 + 250 + 600 = 1150ms < 1200ms, sau đó cả cây bị gỡ khỏi DOM (≤ 2000ms, HF-06).
- Góc hạt: `i × 360/N + k × 20°` (tất định). Màu xoay vòng `--kr-play`, `--kr-fun`, `--kr-primary`, `--kr-success` (đổi theo theme, không cần màu mới).
- Chỉ bắn khi chạm mốc (combo 6–9, >50 không bắn, E6). Gõ sai không thêm, không kéo dài (HF-08).
- Reduced motion: không render `ComboFireworks` (0 hạt, 0 tên lửa). Nhãn ở trạng thái cuối, không animation (HF-10).
- Hiệu năng: tối đa 54 `span` animate `transform`/`opacity` (compositor), không đo layout trong JS, không `setInterval`. Hạt được tạo một lần khi mount theo `milestone.id`, không render lại theo từng phím (memo theo `id`) (HF-09).

## Component
| Component | Mới/Tái dùng/Sửa | Đường dẫn (hiện có hoặc đề xuất) | Props/State chính | Dùng ở |
|---|---|---|---|---|
| GameEngine | Sửa | `apps/web/src/components/game/GameEngine.tsx` | bọc Keyboard + HandGuide trong `.kb-stage` (`--hands` khi `fingerGuide`); truyền `suppressed` cho ComboBurst | S1 |
| HandGuide | Sửa (nhẹ) | `apps/web/src/components/game/HandGuide.tsx` | thêm `data-side` cho `.finger-label` (left/right; thumb → left); cấu trúc SVG, id ngón, class `finger--active` giữ nguyên | S1 |
| Keyboard | Tái dùng (không đổi) | `apps/web/src/components/game/Keyboard.tsx` | — | S1 |
| ComboBurst / ComboBurstView | Sửa | `apps/web/src/components/game/ComboBurst.tsx` | `milestone`, `lang`, `reducedMotion`, mới `suppressed`; render 2 `.combo-side`; bỏ `SPARKS` | S1 |
| ComboFireworks | Mới | `apps/web/src/components/game/ComboFireworks.tsx` (đề xuất) | `value: number`, `side: 'left' \| 'right'`; render từ `fireworkPlan` | trong ComboBurst |
| fireworkPlan | Mới (hàm thuần) | `apps/web/src/lib/hf/fireworks.ts` (đề xuất; hoặc thêm vào `lib/kr/combo-celebration.ts`) | `(value) => Burst[]`, hằng `FIREWORK_MAX_NODES = 60` | ComboFireworks, test HF-07 |
| ComboAnnouncer | Tái dùng | `apps/web/src/components/game/ComboAnnouncer.tsx` | — | S1 |
| combo-celebration-store, `combo-celebration.ts` | Tái dùng | `apps/web/src/stores/…`, `apps/web/src/lib/kr/…` | `COMBO_BURST_MS = 1200` giữ nguyên | ComboBurst |
| usePrefersReducedMotion | Tái dùng | `apps/web/src/hooks/usePrefersReducedMotion.ts` | — | ComboBurst |
| CSS bố cục | Sửa | `apps/web/src/styles/game.css` | `@media (min-width: 1024px)`: `.main` 1240px, `.kb-stage--hands` grid, `.hands-guide { display: contents }`, `.finger-label[data-side]`, `.word-stage` padding-inline | S1 |
| CSS hiệu ứng | Sửa | `apps/web/src/styles/decor.css` | `.combo-side*`, `.fw-rocket`, `.fw-spark`, keyframes mới; bỏ `.combo-spark`; khối `prefers-reduced-motion` | S1 |

Ghi chú cho QC: `ComboBurst.test.tsx` đang khẳng định đúng 8 `combo-spark`. Test này phải đổi theo thiết kế mới (2 `.combo-side`, số `.fw-spark` theo bảng mật độ).

## Trạng thái
| Màn hình/Component | Loading | Empty | Error | Success | Offline/Guest |
|---|---|---|---|---|---|
| S1 bố cục `.kb-stage` | Như hiện tại: stagger `kr-enter`, tay hiện cùng bàn phím | `fingerGuide` tắt: không tay, bàn phím căn giữa (HF-04). Văn bản rỗng/đã hết: không ngón nào tô, nhãn ngón ẩn (như hiện tại) | Không áp dụng: thuần client, không gọi API | Tay hai bên (≥1024) hoặc dưới (<1024), ngón đúng (HF-01..03) | Guest: `fingerGuide` từ localStorage. User: từ API như cũ. Offline không ảnh hưởng |
| HandGuide `.finger-label` | Không áp dụng (render đồng bộ từ state) | Ký tự không có ngón → không render nhãn (như hiện tại) | Không áp dụng | Nhãn dưới tay đúng bên (≥1024) / giữa hai tay (<1024) | Giống nhau |
| ComboBurst (nhãn) | Không áp dụng (không tải gì) | Chưa có mốc / `suppressed` → không render | Không áp dụng: không I/O. Key i18n thiếu thì `t()` trả key như mọi chuỗi khác | Hai nhãn đối xứng 1200ms (HF-05, HF-11) | Giống nhau, không request (HF-13, E14) |
| ComboFireworks | Không áp dụng | Reduced motion / `suppressed` / không có mốc → 0 phần tử (HF-10, HF-12) | Không áp dụng: CSS thuần, nếu animation không chạy thì hạt ở trạng thái cuối `opacity: 0` (fill both) và vẫn bị gỡ lúc 1200ms | Pháo hoa theo bảng mật độ, kết thúc 1150ms (HF-06, HF-07) | Giống nhau |

## Chuỗi i18n
Không có key mới. Tái dùng:

| Key | vi | en |
|---|---|---|
| `comboPraise5` | Giỏi lắm! | Nice job! |
| `comboPraise10` | Siêu quá! | Super! |
| `comboPraise20` | Cực đỉnh luôn! | Amazing! |
| `comboPraise50` | Vô địch gõ phím! | Typing champion! |
| `comboAnnounce` | Chuỗi {0}! {1} | {0} combo! {1} |
| `fingerLeftPinky` … `fingerThumb` | (giữ nguyên) | (giữ nguyên) |

Pháo hoa và nhãn trực quan đều `aria-hidden`, nên không cần chuỗi mới (HF-13).

## Accessibility
- Tương phản: pill `--kr-on-play` trên `--kr-play` (≈ 8.9:1 light/colorful, ≈ 10:1 dark). Lời khen `--kr-fg` trên `--kr-card` ≥ 12:1 cả 3 theme. Cả hai đều có nền đặc nên pháo hoa phía sau không làm giảm tương phản (HF-13). Nhãn ngón dùng `--ink` trên `--surface-2` như hiện tại.
- Kích thước chữ: pill ≥ 1.5rem (chữ lớn), lời khen ≥ 0.95rem/800, nhãn ngón 0.95rem/800 (0.8rem ở ≤ 640px như cũ).
- Không chỉ dựa vào màu: ngón đang dùng vẫn có nhãn chữ. Mốc có số "x{mốc}" và lời khen bằng chữ, không chỉ pháo hoa.
- Screen reader: `.combo-burst` và toàn bộ pháo hoa `aria-hidden="true"`. Thông báo mốc chỉ qua `ComboAnnouncer` (`aria-live="polite"`), đúng 1 lần mỗi mốc dù hiển thị 2 bản (HF-05). SVG tay nên thêm `aria-hidden="true"` (trang trí, nhãn chữ đã mang thông tin).
- Focus: không thêm phần tử focus, `pointer-events: none` cho tay (ở chế độ hai bên), nhãn, pháo hoa. Input ẩn giữ focus (HF-05, HF-09, E11).
- `prefers-reduced-motion: reduce`: không pháo hoa, nhãn tĩnh, không còn animation chạy sau 500ms (HF-10). Chuyển `fill` ngón giữ 150ms như cũ (là transition, không phải animation).
- Không thêm âm thanh. Cài đặt tắt âm không bị ảnh hưởng (E16).
- Không nhấp nháy: pháo hoa ≤ 3 chùm/bên, mỗi hạt hiện 1 lần, không chớp lặp (an toàn với người nhạy sáng).

## Responsive
- Desktop ≥ 1024px (đo 1024×768, 1280×720, 1440×900):
  - `.main` tối đa 1240px. Hàng bàn phím: tay | bàn phím | tay. Vùng chữ có hai lề khen `--hf-gutter`.
  - Vì bỏ khối HandGuide riêng dưới bàn phím (khoảng 140px), ở 1280×720 bàn phím và tay nằm gọn trong viewport khi `scrollY = 0` (HF-01).
  - Rủi ro: vùng chữ hẹp đi `2 × (gutter + 12)` nên văn bản dài có thể thêm 1 dòng. PTL đo ở 1280×720. Nếu tràn, giảm `--hf-gutter` tối thiểu xuống 132px trước khi đụng tới cỡ chữ.
- Tablet 768 (641–1023px): bố cục cột như hiện tại, tay dưới bàn phím (Q1). Nhãn khen hai nửa trong dải 92px phía trên vùng chữ, pháo hoa bán kính theo `cq` (~20px với khối cao 92px). Không cuộn ngang (HF-03, HF-11).
- Mobile 375 (không bàn phím vật lý):
  - Bàn phím ảo và HandGuide giữ quy tắc ≤ 700/640px hiện tại.
  - Nhãn khen mỗi nửa khoảng 170px: pill 1.5rem + lời khen 0.95rem, có thể 2 dòng.
  - Pháo hoa vẫn theo bảng mật độ (≤ 54 phần tử).
  - Bấm phím ảo không bị chặn vì mọi lớp hiệu ứng `pointer-events: none` và không giao `.key` (E11).
- Ngưỡng 1024px dùng chung cho tay hai bên và nhãn khen hai bên, để một màn chỉ có một kiểu bố cục.

## Quyết định & câu hỏi
- **D1 (Q1)**: Đồng ý giả định. ≥ 1024px tay hai bên. < 1024px tay dưới bàn phím như cũ, vì ở 768px nếu đặt tay hai bên thì phải thu bàn phím, trái HF-03.
- **D2 (Q2)**: Hai bên, mỗi bên một bản giống nhau (pill + lời khen), đối xứng như hai bên sân khấu. Chỉ đọc 1 lần.
- **D3 (Q3)**: Màn hẹp đặt nhãn khen ở dải 92px ngay trên vùng chữ, đè tạm lên StatsBar trong 1.2s. Lý do: đây là chỗ trống gần mắt trẻ nhất mà không phải chữ cần gõ hay phím. Trẻ không cần đọc số liệu giữa lúc gõ. Phương án khác (khe giữa vùng chữ và bàn phím) quá hẹp (16px) và sẽ làm bố cục nhảy.
- **D4 (Q4)**: Chỉ 4 mốc hiện có. Combo > 50 không bắn.
- **D5 (Q5)**: Trần 60 được giữ, thiết kế dùng tối đa 54 phần tử. CSS thuần, không thư viện, tăng JS rất nhỏ (một component + hàm kế hoạch).
- **D6 (Q6)**: Pháo hoa bắn trong hai khối khen (hai bên vùng chữ ở màn rộng, hai nửa dải trên vùng chữ ở màn hẹp), không bắn cạnh bàn phím. Như vậy không che tay gợi ý lúc trẻ cần nhìn ngón, và vùng chứa có kích thước biết trước nên đảm bảo được hạt không ra khỏi khối.
- **D7**: Lề khen hai bên vùng chữ luôn được giữ (kể cả khi không có mốc) để vùng chữ không nhảy khi nhãn hiện (KR-15, tránh làm trẻ mất chỗ đang đọc).
- **D8**: Ngón cái (phím cách) đặt nhãn dưới tay trái, để giữ đúng một phần tử `.finger-label` (cả hai ngón cái vẫn được tô).
- **Câu hỏi cho người dùng**:
  - (a) Màn hẹp: chấp nhận nhãn khen đè tạm lên thanh số liệu 1.2s, hay muốn ẩn hẳn nhãn trên mobile (chỉ còn pháo hoa nhỏ + thông báo đọc)? Giả định tạm: đè tạm.
  - (b) Ở màn rộng, tay ở 1024px khá nhỏ (~86px). Có chấp nhận, hay muốn ngưỡng hai bên là 1280px? Giả định tạm: 1024px theo AC.

## Lịch sử
- v1 2026-11-06 10:30: bản đầu.
