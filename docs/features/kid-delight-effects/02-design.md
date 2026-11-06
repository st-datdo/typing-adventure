# FX · Hiệu ứng "đã mắt" cho trẻ: juice từng phím, combo leo thang, ít lặp lại — Design

Trạng thái: draft
Nguồn: 01-requirements.md (FX-01..FX-20), 00-research.md

Kế thừa hệ thiết kế KR/HF (`styles/tokens.css`: `--kr-*`, `--kr-ease-back`, `--kr-ease-out`). Không thêm màu ngoài token có sẵn. Hình mới (hạt, sticker, nhân vật chạy, phụ kiện owl) là SVG nội tuyến cùng nét vẽ với `OwlMascot` (viền `#1E3A8A` 3px, bo tròn, màu phẳng). Không dùng emoji hệ điều hành cho hiệu ứng (FX-08).

Ba nguyên tắc dẫn đường cho mọi quyết định bên dưới:
1. **Bật ra từ chỗ trẻ đang nhìn.** Mọi phản hồi gắn với một hành động xuất hiện ở dòng chữ hoặc ở owl, không ở mép màn.
2. **Khi nào có thưởng thì cố định, thưởng là gì thì ngẫu nhiên.** Tầng combo cố định (FX-02). Kiểu pop, hạt, câu khen, nhân vật, phụ kiện được rút từ pool có chống lặp (FX-05).
3. **Tối đa 2 điểm chuyển động cùng lúc.** Điểm 1 là ký tự/từ vừa gõ. Điểm 2 là một hiệu ứng tầng (nhãn, nhân vật, nền hoặc owl). Hiệu ứng mới thay hiệu ứng cũ cùng loại, không xếp hàng.

## Luồng người dùng
1. Mở `/`, ván chưa bắt đầu → owl `idle` trong TopBar, cạnh owl là đồng hồ combo ở trạng thái tắt, số 0 (FX-06).
2. Gõ đúng 1 phím → ký tự pop theo một kiểu ngẫu nhiên. Ở mức Nhiều có thêm 3–5 hạt SVG bắn lên và lùi về phía chữ đã gõ. Phát 1 nốt ngũ cung, cao dần theo combo. Số trên đồng hồ tăng và nảy nhẹ (FX-07, FX-08, FX-09, FX-06).
3. Xong 1 từ → từ chạy 1 trong 6 kiểu hoàn thành. Khoảng 1/6 số lần, owl nói một câu khen trong bong bóng (FX-10, FX-11).
4. Combo chạm tầng 3 → đồng hồ "bén lửa" (FX-04).
5. Tầng 5, 10, 15, 20, 30, 40, 50, 75, 100, 150… → nhãn "x{tầng}" + câu khen hiện căn giữa ngay trên dòng chữ, bay lên rồi tan. Mỗi tầng thêm một chất liệu mới: pháo giấy, nhân vật chạy, trời thức dậy, chế độ siêu cấp, mưa sticker, owl biến hình, pháo hoa nền (FX-02, FX-03, FX-04).
6. Gõ sai → ký tự sai lắc như cũ, owl `thinking`. Nếu combo ≥ 3: đồng hồ xì hơi thành khói rồi tắt, mọi trạng thái "giữ" tắt dần. Sai 3 lần liền → owl `encourage` + bong bóng động viên (FX-12, FX-13).
7. Dừng 5s → owl vẫy cánh. Dừng 15s → owl ngủ, "zzz". Gõ lại → owl giật mình tỉnh (FX-12).
8. Hết ván, Chơi lại, đổi chế độ, hoặc mở panel/modal → gỡ mọi hiệu ứng ngay, đồng hồ về 0 (FX-18).
9. Phụ huynh mở Cài đặt → mục "Hiệu ứng": Nhiều / Vừa / Ít, có hiệu lực ngay (FX-14). Máy bật giảm chuyển động thì hiện ghi chú và mọi thứ chạy như mức Ít (FX-15).

```mermaid
flowchart TD
  K[Phím được engine chấm] --> C{Đúng?}
  C -- sai --> W1[Ký tự sai lắc + âm wrong<br/>owl thinking 800ms]
  W1 --> W2{combo trước đó >= 3?}
  W2 -- có --> W3[Đồng hồ xì khói, gỡ trạng thái giữ <= 600ms]
  W2 -- không --> W4[Không có gì thêm]
  W3 & W4 --> W5{sai 3 lần liền?}
  W5 -- có --> W6[owl encourage + bong bóng động viên]
  C -- đúng --> L{Mức hiệu lực<br/>= min(setting, reduced motion ? Ít)}
  L --> P[Pop ký tự Nhiều/Vừa · Hạt chỉ Nhiều · Nốt nhạc mọi mức]
  P --> T{combo là tầng?}
  T -- không --> D{xong từ?}
  T -- có --> TF[Hiệu ứng tầng theo bảng mức<br/>âm tầng thay nốt]
  D -- có --> WF[Kiểu hoàn thành từ<br/>1/6: owl khen nếu không có nhãn]
  G[Hết ván / Chơi lại / đổi bài / mở panel] --> X[Gỡ tất cả trong 1 frame, đồng hồ về 0]
```

## Màn hình

### S1 · Màn chơi — route `/` (sửa `components/game/GameEngine.tsx`)
- Mục đích: gõ phím. Ai thấy: guest và user đăng nhập, mọi chế độ trong `GameEngine`. Không áp dụng cho Little, `/games`, `/race`, lobby (E17).
- Thay đổi tổng quát:
  - Bỏ `ComboBurst`/`ComboFireworks` hai bên (FX-01).
  - Bỏ pill `.combo-display` "🔥xN" ở góc phải trên vùng chữ trong `WordDisplay`. Đồng hồ cạnh owl thay vai trò này, để màn chỉ có một chỗ hiện số combo.
  - Thêm 5 lớp hiệu ứng (bảng "Lớp" bên dưới).
  - Hai lề `--hf-gutter` của `.word-stage` ở ≥ 1024px **giữ nguyên**, không chứa chữ/số. Lề chỉ là "cửa sổ" nhìn ra lớp nền phía sau (mưa sticker, pháo hoa nền) (FX-01). Giữ lề để vùng chữ không đổi bề rộng so với HF (KR-15).

#### Lớp (z-order từ dưới lên)
| Lớp | Phần tử | Vị trí | z | Chứa |
|---|---|---|---|---|
| L0 Nền | `.kr-scene` (có sẵn) + `.fx-backdrop` (mới, `position: fixed; inset: 0`) | toàn màn, sau `.main` | 0 | trời thức dậy (20), mưa sticker (40), canvas pháo hoa nền (75/100/150…) |
| L1 Nội dung | `.ta-head`, `.main` (có sẵn) | | `.main` 1, `.ta-head` **2** | chữ, bàn phím, tay. `.ta-head` nâng lên 2 để bong bóng owl tràn xuống không bị StatsBar che |
| L2 Từ/ký tự | `.fx-word-layer` (mới, `position: absolute; inset: 0` trong `.word-display-section`) | phủ vùng chữ | 3 | hạt từng phím, hiệu ứng hoàn thành từ |
| L3 Nhân vật chạy | `.fx-runner-track` (mới, trong `.word-display-section`, trùng hàng `.word-foot`) | dải thanh tiến độ | 4 | nhân vật tầng 15 |
| L4 Nhãn | `.fx-combo-label` (mới, thay `.combo-burst`, con của `.word-stage`) | căn giữa trên `.word-display` | 5 | nhãn tầng |
| L5 Pháo giấy | canvas overlay dùng chung (`position: fixed`, chỉ mount khi có chùm) | toàn màn | 50 (dưới `.ui-overlay`) | chùm pháo giấy tầng 10 |

Mọi phần tử FX: `pointer-events: none`, `aria-hidden="true"`, không nhận focus (FX-03, FX-08, FX-19). `.fx-backdrop` và canvas nền có `opacity ≤ 0.6` (FX-16).

#### Bố cục ≥ 1024px (`fingerGuide` bật)
```
 ┌ TopBar ─────────────────────────────────────────────────────────────────────┐
 │ [≡]          [owl][🔥 12 ▰▰▱]  Typing Adventure          [hồ sơ][↻][🔊]   │
 │                 ╰─ bong bóng owl "Cú thích lắm nè!" (khi có) ─╮             │
 └──────────────────────────────────────────────────────────────────────────────┘
 ┌ StatsBar ───────────────────────────────────────────────────────────────────┐
 │                          ╭───────────────╮  <- nhãn tầng nổi lên rồi bay   │
 └──────────────────────────│ x10 Siêu quá! │──────────────────────────────────┘
  lề (nền)   ┌ Vùng chữ ────┴───────────────┴──────────┐   lề (nền)
   ★  ✿      │  the quick brown fox jumps over ...     │      ♥  ★     <- mưa sticker (L0, tầng 40)
   ·  ★      │  ✦ ✧ hạt bay lên-lùi từ chữ vừa gõ (L2) │      ✿
             │ [🐱→→→ thanh tiến độ ────────] [Tự nhập]│   <- nhân vật chạy (L3, tầng 15)
             └─────────────────────────────────────────┘
  ┌─────┐ ┌ Bàn phím ảo (giữ nguyên) ────────────────────┐ ┌─────┐
  │ tay │ │                                              │ │ tay │
  └─────┘ └──────────────────────────────────────────────┘ └─────┘
```

#### Bố cục 375px
```
 ┌ TopBar ───────────────────────────┐
 │ [≡] [owl][🔥12▰▱]     [👤][↻][🔊] │  <- ≤ 480px: chữ "Typing Adventure" ẩn trực quan (vẫn cho SR)
 │      ╰ bong bóng owl (tối đa 2 dòng, rộng ≤ 240px)
 ┌ StatsBar ─────────────────────────┐
 │        ╭────────────────╮         │  <- nhãn tầng đè tạm phần dưới StatsBar ≤ 900ms
 └────────│ x20 Bay cao nào!│─────────┘
 ┌ Vùng chữ ──┴────────────────┴─────┐
 │  the quick brown fox ...          │
 │ [🦕→→ thanh tiến độ ───────] [✎]  │
 └───────────────────────────────────┘
 ┌ Bàn phím ảo ──────────────────────┐
 └───────────────────────────────────┘
 ┌ HandGuide ────────────────────────┐
```

- Tương tác bàn phím: không thêm phần tử focus được trên màn chơi. Tab order giữ như KR/HF (menu → đăng xuất → chơi lại → âm thanh → "Tự nhập chữ" → phím ảo). Focus luôn ở input ẩn. Bấm lên bất kỳ lớp FX nào đều rơi xuống `.ta-screen` và focus lại input. Không thêm phím tắt.
- AC: FX-01..FX-13, FX-15..FX-20.

#### C-ComboMeter · Đồng hồ combo cạnh owl (mới, FX-06, FX-13)
- Vị trí: trong `TopBar.title`, gom với owl thành `.owl-dock` (`inline-flex`, `align-items: center`, `gap: 6px`). Thứ tự: `[owl][meter]`, sau đó là chữ "Typing Adventure". Ở TopBar nên không bao giờ giao chữ, phím hay tay (FX-06).
- Owl trong màn chơi tăng từ 40 lên 48px (CSS `.owl-dock .owl`). ≤ 640px giữ 40px.
- Hình: pill cao 36px, rộng tối thiểu 64px, chữ số `tabular-nums` để pill không đổi bề rộng theo số.
  - Trái là icon `flame` (có sẵn).
  - Giữa là số combo, 1.25rem/800 (1.1rem ở ≤ 640px).
  - Đáy là vạch tiến tới tầng kế, 4px, bo tròn: `fill = (combo − tầng trước) / (tầng kế − tầng trước)`. Trẻ thấy "sắp tới quà kế tiếp".
- Thuộc tính trạng thái `data-level` (FX-06, ≥ 4 cấp):

| `data-level` | Combo | Nền / viền | Lửa | Chuyển động (Nhiều/Vừa, no-preference) |
|---|---|---|---|---|
| `off` | 0–2 | `--kr-card-soft` / `--kr-edge`, số `--kr-fg-muted` | xám `--kr-fg-muted`, 20px | không |
| `lit` | 3–9 | `--kr-tint-yellow` / `--kr-play`, số `--kr-fg` | `--kr-play`, 22px | lửa đung đưa `rotate ±6°`, chu kỳ 1200ms |
| `hot` | 10–29 | `--kr-play` / `--kr-play-deep`, số `--kr-on-play` | `--kr-fun-deep` viền, 26px | đung đưa 900ms + 2 đốm tàn lửa bay lên (900ms, lệch pha) |
| `super` | ≥ 30 | `--kr-play`, viền 3px gradient `--kr-play → --kr-fun → --kr-primary → --kr-success` | 26px | + 1 ngôi sao nhỏ quay quanh pill, chu kỳ 2400ms |

- Mỗi phím đúng: số nảy `scale 1 → 1.18 → 1`, 160ms `--kr-ease-back`. Số cập nhật đồng bộ với `gameState.combo`, cùng lần render với `WordDisplay` (FX-06).
- Lúc chuyển cấp (3, 10, 30): pill pop `scale 0.85 → 1.1 → 1`, 280ms. Ở tầng 3 phát âm `pop` (FX-04).
- Gãy chuỗi (combo ≥ 3 → 0), trạng thái `data-smoke="true"` trong 500ms (FX-13):
  - Lửa co lại `scale 1 → 0.3`, `opacity → 0`, 250ms.
  - 3 cụm khói tròn xám (`--kr-fg-muted`, opacity 0.5) bốc lên 14–22px, tan trong 500ms.
  - Số về 0, pill về `off` bằng transition 300ms. Tổng ≤ 600ms.
  - Combo < 3 khi sai: chỉ đổi số, không khói.
- `aria-hidden="true"`. Số combo cho trình đọc màn hình vẫn đi qua `ComboAnnouncer` (FX-06).

#### C-ComboLabel · Nhãn tầng căn giữa (mới, thay ComboBurst; FX-01, FX-03, FX-05)
- Vị trí: `position: absolute`, con của `.word-stage`. `left: 50%`, `translateX(-50%)`, nên tâm ngang trùng tâm `.word-display` vì `.word-stage` có lề trong đối xứng (FX-03: lệch ≤ 24px).
- Neo dọc: `bottom: calc(100% − 12px)` so với mép trên `.word-display-section`.
  - Mép dưới nhãn nằm trong 12px đầu của padding trên vùng chữ (padding 20px, ký tự `--active` nhô lên 2px). Như vậy mép dưới luôn cao hơn mép trên ký tự đầu ít nhất 6px (FX-03).
  - Phần còn lại của nhãn đè tạm lên phần dưới StatsBar, giống quyết định D3 của HF.
- Chỉ có **1** phần tử `.fx-combo-label`. Mỗi lần chạm tầng thì remount theo `id`, nhãn cũ biến mất cùng frame (FX-03, E1).
- Nội dung, một khối căn giữa, rộng `max-width: min(90%, 360px)`:
  - Dòng 1 là pill số "x{tầng}": 2rem/800 (1.6rem ở ≤ 640px).
  - Dòng 2 là câu khen rút từ pool `fxPraise*` (chống lặp 5 lần gần nhất, FX-05): 1.05rem/800 (0.95rem ở ≤ 640px), tối đa 2 dòng, không ellipsis (FX-20).
- Tầng 3: không có nhãn (FX-03).
- Màu theo dải tầng, nền đặc để tương phản không phụ thuộc lớp nền phía sau:

| Tầng | Pill số (nền / viền / chữ) | Khung câu khen |
|---|---|---|
| 5, 10 | `--kr-play` / `--kr-play-deep` / `--kr-on-play` | nền `--kr-card`, viền `--kr-play`, chữ `--kr-fg` |
| 15, 20, 30 | `--kr-fun` / `--kr-fun-deep` / `--kr-on-fun` | viền `--kr-fun` |
| 40, 50 | `--kr-primary` / `--kr-primary-deep` / `--kr-on-primary` | viền `--kr-primary` |
| 75, 100, 150… | `--kr-play`, viền 4px gradient play → fun → primary → success / `--kr-on-play` | viền `--kr-fun` |

- Pool **kiểu nhãn** (≥ 2 mỗi tầng; dùng chung 4 kiểu, chống lặp k = 3, FX-05):

| Kiểu | Hình | Nhịp vào (≤ 240ms) |
|---|---|---|
| `bubble` | pill tròn bầu, viền 4px, bóng `--kr-shadow-md` | `scale 0.6 → 1.08 → 1`, `--kr-ease-back` |
| `ribbon` | băng rôn có 2 đuôi tam giác hai bên pill số | trượt từ `translateY(12px)` + `scaleX 0.7 → 1` |
| `sticker` | pill nghiêng −4° hoặc +4° (ngẫu nhiên), viền trắng 4px dày như sticker dán | `rotate −20° → ±4°` + `scale 0.5 → 1` |
| `badge` | ngôi sao 8 cánh `--kr-tint-yellow` sau pill số | ngôi sao `scale 0 → 1` và quay 45° một lần, pill pop |

- Nhịp chung (Nhiều/Vừa, no-preference), tổng 860ms ≤ 900ms:
  - Vào 220ms.
  - Giữ 420ms, trong đó nhãn trôi lên 8px tuyến tính.
  - Ra 220ms: `translateY(−32px)`, `opacity → 0`, ease-in.
  - Ra nhanh hơn hoặc bằng vào. Sau 900ms gỡ khỏi DOM (FX-03).
- Ngẫu nhiên hoá tham số nhỏ (FX-05): góc nghiêng ±4°, độ cao bay −28..−36px, thứ tự màu gradient.
- Mức Ít hoặc reduced motion: chỉ dùng kiểu `bubble`, không có keyframe. Hiện ngay ở trạng thái cuối, sau 800ms bị gỡ (≤ 900ms) (FX-14, FX-15).
- Bị chặn (`suppressed` = `showCelebration || panel !== 'none' || navOpen`): không render (FX-18).

#### C-CharPop · Pop ký tự (sửa `WordDisplay` + CSS; FX-07)
- Ký tự vừa gõ nhận `data-pop="<kiểu>"` thay cho class `char--pop` cố định. Pool 6 kiểu, chống lặp liền (k = 3). Mọi kiểu chỉ đổi `transform`/`opacity`/`color`, `transform-origin: 50% 100%` (đã có trên `.char`), nên không đổi layout:

| Kiểu | Keyframes | Thời lượng |
|---|---|---|
| `squash` | `scale(1.35, 0.7) → scale(0.9, 1.2) → scale(1)` | 320ms |
| `wiggle` | `rotate(-14deg) scale(1.2) → rotate(10deg) → rotate(-5deg) → 0` | 360ms |
| `hop` | `translateY(-12px) scale(1.15) → translateY(0) scale(1.05, 0.95) → 1` | 340ms |
| `flip` | `perspective(200px) rotateX(-70deg) → rotateX(15deg) → 0` | 380ms |
| `jelly` | `scale(1.25, 0.85) → scale(0.88, 1.12) → scale(1.06, 0.96) → 1` | 380ms |
| `tint` | `scale(1.3)` + màu chuyển `--kr-play → --kr-success` | 300ms |

- Easing `--kr-ease-back` cho mọi kiểu. Tất cả ≤ 400ms (FX-07).
- Ngẫu nhiên hoá nhỏ: biên độ ±20% (ví dụ `hop` −10..−14px).
- Phím cách: vẫn pop (không có ký tự hiển thị nên chỉ thấy khoảng trống nảy), không hạt (E6).
- Mức Ít hoặc reduced motion: không `data-pop`, chỉ đổi màu sang `--kr-success` như hiện tại (FX-14, FX-15).

#### C-KeyParticles · Hạt từng phím (mới; FX-08)
- Chỉ ở mức Nhiều và no-preference. Không áp dụng cho phím cách.
- Mỗi phím đúng sinh 3–5 hạt, tâm xuất phát là tâm ký tự vừa gõ, lệch ngẫu nhiên ±6px (nằm trong ±8px của bounding box, FX-08).
- Hướng bay: quạt góc −165°..−95° (lên trên và lùi về bên trái, tức về phía chữ đã gõ). Hạt không bay vào ký tự kế tiếp nằm bên phải (FX-19).
- Quãng bay 22–44px, kèm `rotate` 0..180°, `scale 0.5 → 1 → 0.6`, `opacity 1 → 0`. Thời lượng 450–550ms, `--kr-ease-out` (≤ 600ms).
- Kích thước 10–16px. Màu xoay vòng `--kr-play`, `--kr-fun`, `--kr-primary`, `--kr-success`.
- Pool **hình hạt** (SVG cùng nét, ≥ 4, FX-08). Mỗi phím rút 1–2 hình, chống lặp k = 3:
  1. `star` sao 5 cánh bo góc
  2. `dot` chấm tròn đặc
  3. `heart` tim
  4. `bubble` vòng tròn rỗng có chấm sáng
  5. `sparkle` sao 4 cánh (như `owl-sparkles`)
  6. `note` nốt nhạc ♪ vẽ bằng path (gợi nốt FX-09)
- Trần: ≤ 60 node hạt trong DOM, dùng chung cho mọi hiệu ứng DOM. Khi đầy thì tái dùng node cũ nhất (pool node) thay vì tạo mới (FX-08, FX-17).

#### C-WordComplete · Hoàn thành từ (mới, thay `wordBurst` chỉ có ở `soundMode='word'`; FX-10)
- Áp dụng cho mọi `soundMode` khi `completedWord !== null`, ở mức Nhiều/Vừa. Pool 6 kiểu, chống lặp k = 3. Mỗi kiểu ≤ 700ms:

| Kiểu | Mô tả | Nhịp |
|---|---|---|
| `domino` | từng chữ nảy `translateY(-10px)` lần lượt | stagger 35ms/chữ, mỗi chữ 280ms; từ dài cắt stagger để tổng ≤ 700ms |
| `rainbow-wave` | các chữ nảy theo sóng, mỗi chữ tô thoáng 1 màu token rồi về `--kr-success` | stagger 30ms, 300ms/chữ |
| `star-fly` | 1 ngôi sao 20px tách từ tâm từ, bay theo đường cong lên đồng hồ combo, tới nơi thì vạch tiến độ của đồng hồ nảy (hiệu ứng "thu thập") | 600ms `--kr-ease-out` |
| `confetti-pop` | 10–14 mảnh giấy DOM (tính chung trần 60) bắn lên từ mép trên từ | 550ms |
| `stamp` | sticker ✓ 28px (`check` icon trong vòng tròn `--kr-success`) đóng dấu ở góc trên-phải của từ, nghiêng ngẫu nhiên ±12° | `scale 1.6 → 1` 200ms, giữ, mờ ở 650ms |
| `bubble-up` | 2–3 bong bóng rỗng nổi lên từ mép trên từ | 650ms |

- Mọi kiểu chỉ chiếm vùng của từ vừa xong và phía trên nó. Không đặt gì lên từ kế tiếp, nên ký tự kế tiếp luôn là phần tử trên cùng tại tâm của nó (FX-10).
- Mức Ít hoặc reduced motion: không có hiệu ứng hoàn thành từ, chỉ còn màu chữ đúng.

#### C-TierRunner · Nhân vật chạy ngang (mới; tầng 15, FX-04)
- Đường chạy: dải `.fx-runner-track` trùng hàng `.word-foot`, nhân vật đứng **trên thanh tiến độ**, cao 40px (32px ở ≤ 640px). Dải nằm dưới dòng chữ, cách ít nhất 12px (gap có sẵn). Vì vậy nhân vật không giao ký tự nào, cũng không ở gần bàn phím hay tay. Dải `overflow: hidden` theo bề rộng vùng chữ, nên không gây cuộn ngang (FX-19).
- Chạy hết bề ngang trong 1800–2200ms (≤ 2500ms), rồi gỡ khỏi DOM. Hướng trái→phải hoặc phải→trái ngẫu nhiên (lật `scaleX(-1)`).
- Pool **nhân vật** (≥ 3, chống lặp k = 2):

| Nhân vật | Kiểu di chuyển |
|---|---|
| `kitten` mèo con | chạy, thân nhún `translateY` 4px mỗi 200ms |
| `dino` khủng long con | chạy dậm, nghiêng ±4° |
| `rocket` tên lửa | bay thẳng hơi chếch, để lại 3 chấm khói mờ dần |
| `turtle` rùa trượt ván | lướt đều, ván rung 1px |
| `bunny` thỏ | nhảy cóc 3 cung parabol |

- Âm `boing` lúc bắt đầu chạy.
- Gõ sai khi đang chạy: chạy nốt, không sinh mới (E4).

#### C-SkyAwake · Trời thức dậy (mới; tầng 20, giữ đến khi gãy chuỗi)
- `.ta-screen` nhận `data-fx-sky="<biến thể>"`. Chuyển cảnh **một lần** 800ms, không lặp (FX-04, KR-16 giữ nguyên):
  - ≥ 768px: lớp `.kr-scene--top` tăng `saturate(1.25)` trong 800ms. Đây là đổi màu một chiều, không phải chớp (FX-16). Đồng thời lớp `.fx-backdrop` thêm hình theo biến thể ở vùng trời 240px trên cùng, opacity 0.6.
  - < 768px (scene top đang ẩn): viền trên `.word-display-section` thành dải 4px gradient theo biến thể, mọc từ giữa ra hai bên (`scaleX 0 → 1`, 800ms).
- Pool **biến thể trời** (≥ 2, chống lặp k = 1):

| Biến thể | Hình |
|---|---|
| `rainbow` | cầu vồng 5 dải token mọc từ trái qua phải |
| `shooting-stars` | 2 sao băng vạch chéo một lần, để lại 6 sao tĩnh (mặc định ưu tiên ở theme dark) |
| `balloons` | 4 bóng bay nổi lên tới chỗ đứng yên |

- Owl đeo **1 phụ kiện** ngẫu nhiên. Pool ≥ 3 (SVG lớp trên owl, viewBox 120), chống lặp k = 2:
  1. `sunglasses` kính râm
  2. `party-hat` mũ sinh nhật
  3. `crown` vương miện
  4. `headphones` tai nghe
  5. `bowtie` nơ
- Phụ kiện rơi xuống đầu owl `translateY(-16px) → 0`, 300ms `--kr-ease-back`.
- Âm `fanfare` ngắn.
- Gỡ (gãy chuỗi hoặc ván mới): phụ kiện và hình trời mờ đi 400ms, scene về bình thường (≤ 600ms, FX-04, FX-13).

#### C-SuperMode · Siêu cấp (sửa CSS `WordDisplay`; tầng 30, giữ)
- `.word-display` nhận `data-fx-super="<biến thể>"`:
  - Ký tự `--active` (caret) có quầng sáng 0 0 0 4px màu biến thể, kèm vệt 3 chấm mờ dần phía trái (`::after`, tĩnh).
  - Ký tự `--correct` đổi gạch chân từ xanh đơn sang gradient tĩnh của biến thể.
  - Không có keyframe lặp, không lấp lánh nhanh (FX-16).
- Pool biến thể (≥ 2): `rainbow` (play → fun → primary → success), `gold` (play → play-deep), `galaxy` (primary → fun).
- Vào: quầng caret nở `scale` 300ms. Gỡ: transition 300ms khi combo về 0 hoặc ván mới.

#### C-StickerRain · Mưa sticker (mới; tầng 40, chỉ mức Nhiều)
- Nằm trong `.fx-backdrop` (L0, sau `.main`). Ở ≥ 1024px sticker hiện qua hai lề `--hf-gutter` và lề trang. Ở < 1024px chỉ lộ ra ở mép và khe giữa các khối (nhỏ nhưng có), không bao giờ ở trên chữ/phím/tay vì nằm dưới lớp nội dung (FX-01, FX-19, E10).
- 18 sticker (±20%, trần 24 node, tính chung trần 60), kích thước 28–44px, opacity 0.55.
- Rơi `translateY(-10vh → 105vh)` + xoay ±90°, mỗi sticker 1600–2200ms, delay rải 0–300ms. Xong trong ≤ 2500ms rồi gỡ.
- Pool hình (mỗi trận mưa rút 3 hình, chống lặp k = 1): `star`, `candy`, `heart`, `balloon`, `flower`, `moon`, `cloud`.
- Âm `sticker`.

#### C-OwlEvolve · Owl biến hình (sửa `GameOwl`/`OwlMascot`; tầng 50)
- Owl pop `scale 1 → 1.5 → 1.25 → 1`, kèm hào quang tròn `--kr-tint-yellow` opacity 0.6 phía sau. Tổng 1600ms (≤ 2000ms). Phóng to quanh tâm owl, vẫn nằm trong vùng TopBar/StatsBar, không chạm vùng chữ.
- Pool biến thể (≥ 2, chống lặp k = 1):
  - `phoenix`: 2 cánh lửa `--kr-play`/`--kr-fun` mọc sau cánh.
  - `star`: 5 sao nhỏ quay một vòng quanh owl.
  - `hero`: áo choàng `--kr-fun` bay phấp phới 2 nhịp.
- Hết hiệu ứng thì owl giữ phụ kiện (của tầng 20, nếu chưa có thì rút 1). Âm `fanfare`.
- Owl chỉ phóng to và quay quanh tâm, không bay khỏi chỗ (khác research "bay vòng"), để không đè StatsBar quá lâu.

#### C-BackdropFireworks · Pháo hoa nền (mới; tầng 75, 100, 150…, chỉ mức Nhiều)
- 1 canvas trong `.fx-backdrop` (L0, sau `.main`, opacity 0.6). 4–6 chùm rải ở 40% trên của viewport và hai lề, mỗi chùm 30–40 hạt, tổng hạt sống ≤ 200. Tổng thời gian ≤ 2400ms.
- Pool kiểu chùm (chống lặp k = 1): `peony` tròn, `heart`, `star`, `ring`. Màu là 4 token màu chính của theme.
- Không có lớp phủ toàn màn, không đổi độ sáng nền (FX-16).
- Âm `fanfare`.

#### C-TierConfetti · Pháo giấy tầng 10 (mới)
- Canvas overlay L5, 1 chùm duy nhất. Gốc là tâm ký tự vừa gõ.
- Bắn **lên**: góc 90° ± 35°, 32–40 hạt (≥ 30), hình rút từ pool hạt FX-08 (star, heart, dot, sparkle).
- Gravity thấp, thời gian sống ~900ms. Hạt tắt dần **trước khi** rơi xuống dưới mép trên dòng chữ, nên không phủ chữ đang gõ (FX-19). Hạt chủ yếu bay lên vùng StatsBar.
- Âm `sparkle`.

#### C-OwlBubble · Bong bóng thoại của owl (mới; FX-11, FX-12)
- Neo dưới `.owl-dock` trong TopBar: `top: calc(100% + 6px)`, đuôi nhọn chỉ lên owl.
- `max-width: 240px` (≤ 640px: `min(240px, 70vw)`), 0.95rem/800, tối đa 2 dòng, nền `--kr-card`, viền 3px `--kr-primary`, chữ `--kr-fg`. Bong bóng tràn xuống đè tạm StatsBar. `.ta-head` z-index 2 để không bị che.
- Bong bóng không bao giờ chạm vùng chữ: giữa TopBar và vùng chữ luôn có StatsBar (≥ 56px) và gap 14–16px (FX-11).
- Nhịp: pop `scale 0.6 → 1` 200ms từ đuôi, giữ, mờ 200ms. Gỡ ở 1400ms (≤ 1500ms).
- Không hiện khi `.fx-combo-label` đang có. Nếu có nhãn tầng mới trong lúc bong bóng hiện, gỡ bong bóng ngay để giữ ≤ 2 điểm chuyển động.
- Nội dung:
  - Xong từ, xác suất 1/6, mức Nhiều/Vừa: rút từ `fxOwlPraise*` (≥ 20, chống lặp 5). Owl `happy`.
  - Sai 3 lần liền, mọi mức: rút từ `fxOwlEncourage*` (≥ 5, chống lặp 3). Owl `encourage`.
- Reduced motion: hiện/ẩn không chuyển động.

#### C-GameOwl · Owl phản ứng (sửa; FX-12)
- Bảng mood:

| Sự kiện | Mood | Thời hạn | Ghi chú hình |
|---|---|---|---|
| Ván chưa bắt đầu / mặc định | `idle` | | thở + chớp mắt như cũ |
| Chạm tầng ≥ 5 | `cheer` | 1200ms → `idle` | mắt sao, 2 cánh giơ |
| Xong từ có bong bóng khen | `happy` | 1000ms → `idle` | |
| Sai 1 phím | `thinking` | 800ms → `idle` | không bao giờ `sad` |
| Sai 3 phím liên tiếp | `encourage` | 1400ms (theo bong bóng) | tim nhỏ |
| 5s không gõ | `wave` | đến khi gõ hoặc tới 15s | vẫy 2 nhịp, rồi lặp lại vẫy mỗi 3s |
| 15s không gõ | `sleep` | đến khi gõ | "zzz" bay chậm, chu kỳ 2.4s |
| Gõ khi đang `sleep` | `happy` + dấu "!" nhỏ trên đầu | 800ms → `idle` | owl nảy 6px như giật mình |

- Ưu tiên khi trùng thời điểm: `encourage` > `cheer` > `thinking` > `happy` > `wave`/`sleep` > `idle`.
- Bộ đếm 5s/15s chỉ chạy khi ván đã bắt đầu, chưa kết thúc, không có panel/modal hoặc SideNav mở, và tab hiển thị (FX-12, E12).
- Lưu ý cho PTL: mọi `.kr-loop` bị pause khi `data-playing=true` (KR-16). "zzz" và vẫy cánh lúc idle giữa ván phải dùng class riêng của FX (không phải `.kr-loop`), nếu không chúng sẽ đứng im.
- Reduced motion: đổi tư thế (mood) tức thì, không `owl-hop`/nảy/dịch vị trí (FX-15).

#### Bảng tầng tổng hợp (FX-02, FX-04, FX-14)
| Tầng | Chất liệu mới | Nhãn | Owl | Âm | Nhiều | Vừa | Ít / reduced |
|---|---|---|---|---|---|---|---|
| 3 | đồng hồ `lit` | không | — | `pop` | ✓ | ✓ | đồng hồ đổi cấp, không chuyển động |
| 5 | nhãn + câu khen | ✓ | `cheer` | `sparkle` | ✓ | ✓ | nhãn tĩnh |
| 10 | pháo giấy từ ký tự, đồng hồ `hot` | ✓ | `cheer` | `sparkle` | ✓ | ✓ | nhãn tĩnh |
| 15 | nhân vật chạy | ✓ | `cheer` | `boing` | ✓ | — (chỉ nhãn) | nhãn tĩnh |
| 20 | trời thức dậy + phụ kiện owl (giữ) | ✓ | `cheer` + phụ kiện | `fanfare` | ✓ | ✓ | nhãn tĩnh |
| 30 | siêu cấp (giữ), đồng hồ `super` | ✓ | `cheer` | — (nốt bậc 6) | ✓ | — (chỉ nhãn) | nhãn tĩnh |
| 40 | mưa sticker | ✓ | `cheer` | `sticker` | ✓ | — (chỉ nhãn) | nhãn tĩnh |
| 50 | owl biến hình | ✓ | biến hình + `cheer` | `fanfare` | ✓ | ✓ | nhãn tĩnh |
| 75, 100, 150… | pháo hoa nền | ✓ | `cheer` | `fanfare` | ✓ | — (chỉ nhãn) | nhãn tĩnh |

- Ở mức Vừa, các tầng 15/30/40/75+ vẫn hiện nhãn câu khen (cho trẻ phần thưởng chữ). Chỉ bỏ chất liệu nặng của tầng đó. Tầng 3/5/10/20/50 chạy đầy đủ (FX-14).
- Đồng hồ `hot`/`super` là cấp hiển thị theo combo (FX-06), hiện ở mọi mức. Ở mức Ít/reduced thì không có chuyển động lặp.
- Âm tầng thay nốt của phím chạm tầng. Tầng 30 không có âm tầng nên phát nốt bình thường (FX-04, FX-09).

#### Gỡ hiệu ứng (FX-13, FX-18)
| Sự kiện | Hiệu ứng một lần (nhãn, hạt, pháo, runner, mưa, bong bóng) | Trạng thái giữ (lửa, trời, phụ kiện, siêu cấp) | Đồng hồ |
|---|---|---|---|
| Gõ sai (combo ≥ 3) | chạy nốt, không sinh mới | tắt dần ≤ 600ms | khói → `off` |
| Hết ván / Chơi lại / đổi chế độ, cấp, bài | gỡ ngay trong 1 frame | gỡ ngay | về 0, `off` |
| Mở Settings/History/CustomText/SideNav/CelebrationModal | không sinh mới; cái đang chạy bị ẩn (`suppressed`) | giữ nguyên (không đổi khi panel mở) | giữ |
| Tab ẩn | canvas dừng; DOM tự hết theo thời hạn | giữ | giữ |

### S2 · Cài đặt — SettingsPanel (sửa `components/settings/SettingsPanel.tsx`)
- Mục đích: phụ huynh/giáo viên chọn mức hiệu ứng. Ai thấy: guest và user đăng nhập.
- Vị trí: một `ta-field` mới ngay **sau** "Giao diện" (`themeLabel`), vì cùng nhóm "nhìn thế nào".
```
 ┌ 🛠️ Cài đặt ─────────────────────────────── [✕] ┐
 │ ...                                            │
 │ Giao diện   [☀️ Ban ngày ▾]                    │
 │                                                │
 │ Hiệu ứng                                        │
 │ Chọn bao nhiêu hiệu ứng vui mắt khi gõ          │
 │ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
 │ │ 🌈 Nhiều  ✓│ │ ✨ Vừa     │ │ ⭐ Ít      │   │
 │ └────────────┘ └────────────┘ └────────────┘   │
 │ Đầy đủ: hạt lấp lánh, pháo giấy, nhân vật chạy, │  <- mô tả mức đang chọn (aria-live polite)
 │ mưa sticker, pháo hoa.                          │
 │ ⓘ Máy đang bật "giảm chuyển động" nên hiệu ứng   │  <- chỉ hiện khi prefers-reduced-motion: reduce
 │   sẽ nhẹ nhàng như mức Ít.                       │
 │ ...                                            │
```
- Component: tái dùng `ChoiceCards` (radiogroup, mũi tên chuyển, Tab vào mục đang chọn), thêm `columns={3}`. Icon dùng icon có sẵn:
  - Nhiều = `rainbow`
  - Vừa = `sparkle`
  - Ít = `star`
- Mặc định `lots` (FX-14, Q1).
- Mô tả mức đang chọn hiện dưới nhóm (`fxLotsHint` / `fxSomeHint` / `fxFewHint`), gắn `aria-describedby` vào radiogroup.
- Ghi chú reduced motion (`fxReducedNote`) là `div.ta-hint` có `role="note"`, chỉ render khi `usePrefersReducedMotion()` true (FX-15).
- Tương tác bàn phím:
  - Tab vào nhóm thì focus nằm ở thẻ đang chọn.
  - ←/→/↑/↓ đổi lựa chọn và áp dụng ngay (theo `nextIndex`).
  - Space/Enter chọn. Esc đóng panel như hiện tại.
  - Đóng panel thì focus về input ẩn (đã có).
- Lưu (FX-14):
  - Áp dụng ngay vào store. Không có nút Lưu, giống các setting khác.
  - Guest: `persist` localStorage.
  - User đăng nhập: đồng bộ qua luồng settings hiện có. Lỗi mạng/API thì im lặng, không toast, không chặn (E13).
- AC: FX-14, FX-15, FX-20.

## Component
| Component | Mới/Tái dùng/Sửa | Đường dẫn (hiện có hoặc đề xuất) | Props/State chính | Dùng ở |
|---|---|---|---|---|
| GameEngine | Sửa | `apps/web/src/components/game/GameEngine.tsx` | thay `<ComboBurst>` bằng `<ComboLabel suppressed>`; title TopBar dùng `<OwlDock>`; mount `<FxBackdrop>`; set `data-fx-sky` trên `.ta-screen`; truyền `suppressed` cho mọi lớp FX | S1 |
| OwlDock | Mới | `components/game/fx/OwlDock.tsx` (đề xuất) | gom `GameOwl` + `ComboMeter` + `OwlBubble`; chữ "Typing Adventure" ẩn trực quan ≤ 480px | S1 TopBar |
| ComboMeter | Mới | `components/game/fx/ComboMeter.tsx` | `combo`, `level: 'off'\|'lit'\|'hot'\|'super'`, `nextTierProgress`, `smoke` | OwlDock |
| ComboLabel | Mới (thay ComboBurst) | `components/game/fx/ComboLabel.tsx` | `tier`, `id`, `praiseKey`, `style: 'bubble'\|'ribbon'\|'sticker'\|'badge'`, `band`, `reduced`, `suppressed` | S1 `.word-stage` |
| ComboBurst, ComboFireworks, `lib/hf/fireworks.ts` | Bỏ | `components/game/ComboBurst.tsx`, `ComboFireworks.tsx`, `lib/hf/fireworks.ts` | thay bằng ComboLabel + BackdropFireworks; test HF tương ứng phải đổi (QC) | — |
| WordDisplay | Sửa | `components/game/WordDisplay.tsx` | `data-pop` thay `char--pop`; `data-fx-super`; bỏ `.combo-display`; chứa `.fx-word-layer` và `.fx-runner-track` | S1 |
| KeyParticles | Mới | `components/game/fx/KeyParticles.tsx` | pool node ≤ 60, `emit(rect, shapes, count)`; không setState theo hạt | `.fx-word-layer` |
| WordCompleteFx | Mới | `components/game/fx/WordCompleteFx.tsx` | `kind`, `range [start,end)`, `id` | `.fx-word-layer` |
| TierRunner | Mới | `components/game/fx/TierRunner.tsx` | `character`, `direction`, `id` | `.fx-runner-track` |
| FxBackdrop | Mới | `components/game/fx/FxBackdrop.tsx` | `sky`, `rain` (`{id, shapes}`), `fireworks` (`{id, kind}`); 1 canvas khi cần | S1 L0 |
| TierConfetti | Mới | `components/game/fx/TierConfetti.tsx` hoặc helper `lib/fx/confetti.ts` | `origin`, `shapes`, `count`; tải trễ nếu PTL chọn thư viện canvas (Q5) | S1 L5 |
| OwlBubble | Mới | `components/game/fx/OwlBubble.tsx` | `textKey`, `id`, `kind: 'praise'\|'encourage'` | OwlDock |
| GameOwl | Sửa | `components/game/GameOwl.tsx` | mood theo bảng FX-12, `accessory`, `evolve`, đếm idle 5s/15s | OwlDock |
| OwlMascot | Sửa | `components/mascot/OwlMascot.tsx` | prop mới `accessory?: 'sunglasses'\|'party-hat'\|'crown'\|'headphones'\|'bowtie'`, `evolve?: 'phoenix'\|'star'\|'hero'`; giữ 8 mood | GameOwl (các nơi khác không truyền nên không đổi) |
| FxSprite | Mới | `components/game/fx/sprites.tsx` | bộ SVG: 6 hạt, 7 sticker, 5 nhân vật, 5 phụ kiện, sao "thu thập" | mọi lớp FX |
| SettingsPanel | Sửa | `components/settings/SettingsPanel.tsx` | field "Hiệu ứng" | S2 |
| ChoiceCards | Sửa (nhẹ) | `components/ui/ChoiceCards.tsx` | `columns?: 1 \| 2 \| 3`, thêm `describedBy?` | S2 |
| ComboAnnouncer | Tái dùng (không đổi) | `components/game/ComboAnnouncer.tsx` | chỉ 5/10/20/50 | S1 |
| usePrefersReducedMotion | Tái dùng | `hooks/usePrefersReducedMotion.ts` | | mọi lớp FX, S2 |
| settings-store | Sửa | `stores/settings-store.ts` | trường mới `effectsLevel: 'lots'\|'some'\|'few'`, mặc định `lots` | S2, S1 |
| Logic thuần (PTL quyết vị trí) | Mới | gợi ý `packages/game-engine/src/fx/` | `tier(combo)`, `pickNonRepeating(pool, history, k, rng)`, `noteStep(combo)`, `effectiveLevel(setting, reduced)`, cấu hình tầng × mức | test FX-02/05/09/14 |
| CSS | Mới + sửa | mới `styles/fx.css`; sửa `game.css` (bỏ `.combo-display`, `charPop` → `data-pop`), `decor.css` (bỏ `.combo-side`, `.fw-*`), `ui.css`/`game.css` (`.ta-head { z-index: 2 }`, `.owl-dock`), `.choice-cards--3` | | S1, S2 |

## Trạng thái
| Màn hình/Component | Loading | Empty | Error | Success | Offline/Guest |
|---|---|---|---|---|---|
| S1 lớp FX nói chung | Không áp dụng: không tải gì lúc gõ, không request sau phím đầu (FX-17). Nếu thư viện canvas tải trễ chưa xong thì tầng 10/75+ bỏ qua phần canvas, nhãn vẫn hiện | Ván chưa bắt đầu: không hiệu ứng, đồng hồ `off`/0 | Không áp dụng I/O. Lỗi khi tạo hiệu ứng (canvas không có): bỏ hiệu ứng đó im lặng, không ảnh hưởng nhận phím | theo bảng tầng | Giống nhau guest/user (FX-20) |
| ComboMeter | Không áp dụng | combo 0: `off`, số 0 | Không áp dụng | 4 cấp + khói | Giống nhau |
| ComboLabel | Không áp dụng | không tầng / tầng 3 / `suppressed`: không render | Key i18n thiếu thì `t()` trả key như mọi chuỗi | 1 nhãn ≤ 900ms | Giống nhau |
| CharPop / KeyParticles | Không áp dụng | mức Ít/reduced: không pop/hạt; phím cách: không hạt | Không áp dụng | pop ≤ 400ms; 3–5 hạt ≤ 600ms | Giống nhau |
| WordCompleteFx | Không áp dụng | mức Ít/reduced: không | Không áp dụng | 1 kiểu ≤ 700ms | Giống nhau |
| TierRunner / StickerRain / BackdropFireworks / SkyAwake / OwlEvolve | Không áp dụng | mức không bật (bảng tầng) hoặc reduced: không render | Không áp dụng | theo spec từng component | Giống nhau |
| OwlBubble | Không áp dụng | không có sự kiện / có nhãn tầng / mức Ít (với câu khen): không render | Không áp dụng | ≤ 1500ms | Giống nhau |
| GameOwl | Không áp dụng | `idle` | Không áp dụng | mood theo bảng | Giống nhau |
| S2 field Hiệu ứng | Không áp dụng: đọc store đồng bộ (store đã hydrate trước khi mở panel) | Chưa từng chọn: hiện `lots` được chọn | Lưu API lỗi/offline: không hiện lỗi, mức vẫn áp dụng tại chỗ; lần sync kế tiếp gửi lại theo luồng settings hiện có | thẻ được chọn có dấu ✓ + mô tả | Guest: localStorage; user: API |

## Chuỗi i18n
Tái dùng không đổi: `comboAnnounce`, `comboPraise5/10/20/50` (chỉ cho `ComboAnnouncer`). Thêm **59 key** vào cả `vi.ts` và `en.ts`.

Cài đặt (9):

| Key | vi | en |
|---|---|---|
| `fxLabel` | Hiệu ứng | Effects |
| `fxDesc` | Chọn bao nhiêu hiệu ứng vui mắt khi gõ | Choose how many fun effects appear while typing |
| `fxLots` | Nhiều | Lots |
| `fxSome` | Vừa | Some |
| `fxFew` | Ít | Few |
| `fxLotsHint` | Đầy đủ: hạt lấp lánh, pháo giấy, nhân vật chạy, mưa sticker, pháo hoa. | Everything: sparkles, confetti, running friends, sticker rain, fireworks. |
| `fxSomeHint` | Vừa phải: chữ nảy, lời khen, pháo giấy, cú cú đổi đồ. Không hạt từng phím. | Balanced: bouncy letters, cheers, confetti, owl outfits. No per-key sparkles. |
| `fxFewHint` | Nhẹ nhàng: chỉ đồng hồ chuỗi, lời khen đứng yên và âm thanh. | Calm: just the streak meter, still cheers and sounds. |
| `fxReducedNote` | Máy đang bật "giảm chuyển động" nên hiệu ứng sẽ nhẹ nhàng như mức Ít. | This device has "reduce motion" on, so effects stay calm like Few. |

Câu khen nhãn tầng `fxPraise1..fxPraise24` (FX-05, ≥ 20):

| Key | vi | en |
|---|---|---|
| `fxPraise1` | Giỏi lắm! | Nice job! |
| `fxPraise2` | Siêu quá! | Super! |
| `fxPraise3` | Tuyệt vời! | Awesome! |
| `fxPraise4` | Đỉnh quá! | Fantastic! |
| `fxPraise5` | Quá xịn luôn! | So cool! |
| `fxPraise6` | Nhanh như chớp! | Lightning fast! |
| `fxPraise7` | Ngón tay thần kỳ! | Magic fingers! |
| `fxPraise8` | Cứ thế phát huy! | Keep it up! |
| `fxPraise9` | Bùng nổ luôn! | Boom! |
| `fxPraise10` | Chuẩn không cần chỉnh! | Spot on! |
| `fxPraise11` | Bay cao nào! | Fly high! |
| `fxPraise12` | Không ai cản nổi! | Unstoppable! |
| `fxPraise13` | Gõ như siêu nhân! | Typing hero! |
| `fxPraise14` | Lửa quá đi! | On fire! |
| `fxPraise15` | Xuất sắc! | Excellent! |
| `fxPraise16` | Hay quá trời! | Wonderful! |
| `fxPraise17` | Giữ chuỗi nào! | Keep the streak! |
| `fxPraise18` | Cực đỉnh luôn! | Amazing! |
| `fxPraise19` | Vô địch gõ phím! | Typing champion! |
| `fxPraise20` | Nhà vô địch nhí! | Little champ! |
| `fxPraise21` | Tuyệt cú mèo! | Way to go! |
| `fxPraise22` | Ngôi sao gõ phím! | Typing star! |
| `fxPraise23` | Cừ khôi quá! | Brilliant! |
| `fxPraise24` | Wow, siêu đỉnh! | Wow, so good! |

Owl khen khi xong từ `fxOwlPraise1..fxOwlPraise20` (FX-11, ≥ 20):

| Key | vi | en |
|---|---|---|
| `fxOwlPraise1` | Từ đó đẹp lắm! | Lovely word! |
| `fxOwlPraise2` | Cú thích lắm nè! | Owl loves it! |
| `fxOwlPraise3` | Con gõ giỏi ghê! | You type so well! |
| `fxOwlPraise4` | Thêm một từ nữa rồi! | One more word done! |
| `fxOwlPraise5` | Đúng rồi đó! | That's right! |
| `fxOwlPraise6` | Hay quá, tiếp nào! | Great, keep going! |
| `fxOwlPraise7` | Cú vỗ cánh cho con! | Owl claps for you! |
| `fxOwlPraise8` | Gõ êm quá! | So smooth! |
| `fxOwlPraise9` | Chính xác luôn! | Perfectly typed! |
| `fxOwlPraise10` | Con làm được rồi! | You did it! |
| `fxOwlPraise11` | Tiếp tục nhé! | Keep going! |
| `fxOwlPraise12` | Cú tự hào về con! | Owl is proud of you! |
| `fxOwlPraise13` | Ngón tay nhanh ghê! | Quick fingers! |
| `fxOwlPraise14` | Từ này dễ ợt ha! | That was easy, huh? |
| `fxOwlPraise15` | Thông minh như cú! | Wise as an owl! |
| `fxOwlPraise16` | Nhịp gõ đều quá! | Nice steady rhythm! |
| `fxOwlPraise17` | Mắt tinh tay nhanh! | Sharp eyes, quick hands! |
| `fxOwlPraise18` | Gõ đẹp như mơ! | Dreamy typing! |
| `fxOwlPraise19` | Cú cười toe nè! | Owl is grinning! |
| `fxOwlPraise20` | Một từ hoàn hảo! | A perfect word! |

Owl động viên `fxOwlEncourage1..fxOwlEncourage6` (FX-12, ≥ 5):

| Key | vi | en |
|---|---|---|
| `fxOwlEncourage1` | Không sao, lại nào! | No worries, try again! |
| `fxOwlEncourage2` | Thử lại nhé, con làm được! | Try again, you can do it! |
| `fxOwlEncourage3` | Từ từ thôi, cú chờ con! | Take your time, owl will wait! |
| `fxOwlEncourage4` | Nhìn phím đang sáng nha! | Look at the glowing key! |
| `fxOwlEncourage5` | Sai một chút thôi mà! | Just a tiny slip! |
| `fxOwlEncourage6` | Hít thở rồi gõ tiếp nào! | Deep breath, keep typing! |

Câu dài nhất ở pool hiển thị: vi "Thử lại nhé, con làm được!" (26 ký tự) và en "Take your time, owl will wait!" (30 ký tự). Ở 0.95rem/800 trong 240px, câu xuống tối đa 2 dòng, không cắt (FX-20). Nhãn tầng dài nhất "Chuẩn không cần chỉnh!" vừa 1 dòng ở 360px, 2 dòng ở 375px viewport.

## Accessibility
- **Tương phản (FX-20):**
  - Mọi chữ FX nằm trên nền đặc: pill số dùng cặp `--kr-on-*` trên `--kr-*` có sẵn (đã đạt ≥ 4.5:1 trong KR/HF). Câu khen và bong bóng dùng `--kr-fg` trên `--kr-card` (≥ 12:1).
  - Số đồng hồ ở `off` dùng `--kr-fg-muted` trên `--kr-card-soft` (≈ 7:1 light, ≈ 8:1 dark).
  - Hình nền phía sau không ảnh hưởng tương phản chữ.
- **Kích thước chữ:** pill số ≥ 1.6rem, câu khen ≥ 0.95rem/800, số đồng hồ ≥ 1.1rem/800.
- **Không chỉ dựa vào màu:**
  - Cấp đồng hồ đổi cả kích thước lửa, đốm tàn và sao quay, không chỉ đổi màu.
  - Tầng có số "x{tầng}" bằng chữ.
  - Gõ sai vẫn có lắc và âm như cũ.
- **Trình đọc màn hình:**
  - Mọi phần tử FX `aria-hidden="true"`.
  - Thông báo combo chỉ qua `ComboAnnouncer` hiện có (5/10/20/50), không thêm thông báo để không dồn dập.
  - Bong bóng owl cũng `aria-hidden` (FX-11).
  - Trong Settings: radiogroup có nhãn `fxLabel`, mô tả `fxDesc` + hint của mức đang chọn (`aria-describedby`), ghi chú reduced motion `role="note"`.
- **Focus:** không thêm phần tử focus được trên màn chơi. Input ẩn giữ focus (FX-03, FX-17). Settings dùng roving tabindex của `ChoiceCards`.
- **Reduced motion (FX-15):** mức hiệu lực = Ít, bất kể setting.
  - Nhãn tầng ≥ 5 hiện tĩnh (kiểu `bubble`), gỡ sau 800ms.
  - Owl đổi tư thế không nảy.
  - Đồng hồ đổi cấp không lặp.
  - Khói khi gãy chuỗi: hiện 1 icon khói tĩnh 400ms rồi gỡ.
  - Không có animation FX nào còn chạy sau 500ms. Âm thanh và announcer giữ nguyên.
- **An toàn nhấp nháy (FX-16):**
  - Không keyframe nào đổi `opacity`/độ sáng lặp với chu kỳ < 334ms. Các vòng lặp duy nhất là lửa đồng hồ 900–1200ms, sao quay 2400ms, zzz 2400ms, vẫy cánh 600ms × 2 mỗi 3s. Tất cả chỉ là `transform`, trừ zzz (opacity 1 → 0 mỗi 2.4s).
  - Không lớp phủ toàn màn. Nền pháo hoa và sticker ≤ 0.6 và ở dưới nội dung. Không dùng đỏ bão hoà (`--kr-danger` không xuất hiện trong FX).
- **Âm thanh:** tôn trọng `soundEnabled`. Âm tầng thay cho nốt, không chồng âm (FX-04, FX-09).

## Responsive
- **Desktop ≥ 1024px (1024×768, 1280×720, 1440×900):**
  - Bố cục HF giữ nguyên. Hai lề `--hf-gutter` trống, nhìn ra lớp nền (mưa sticker, pháo hoa nền).
  - Owl 48px + đồng hồ trong TopBar.
  - Nhãn tầng nằm trên vùng chữ, đè tạm phần dưới StatsBar.
- **Tablet 768–1023px:**
  - Cùng bố cục cột như hiện tại.
  - Trời thức dậy dùng scene top (đang hiện ở 144px, opacity 0.5).
  - Mưa sticker và pháo hoa nền chỉ lộ ở lề trang và khe giữa các khối.
  - Nhân vật chạy trên thanh tiến độ.
- **Mobile 375px (không bàn phím vật lý):**
  - TopBar: chữ "Typing Adventure" ẩn trực quan ở ≤ 480px. Owl 40px + đồng hồ (≥ 64px) nằm ở cột giữa, vừa với 44 + 3×44 + khe (đã đo theo quy tắc ≤ 640px hiện có: `gap 6px`).
  - Bong bóng owl `min(240px, 70vw)`, căn theo owl nhưng bị kẹp trong viewport (không tràn mép).
  - Nhãn tầng 1.6rem / 0.95rem, câu khen tối đa 2 dòng.
  - Trời thức dậy thành viền gradient trên vùng chữ (scene top đang ẩn).
  - Hạt và pop hoạt động như desktop.
  - Bấm phím ảo không bị chặn vì mọi lớp FX `pointer-events: none` và không nằm trên `.key` (E11, FX-19).
  - Không cuộn ngang: lớp nền `position: fixed; inset: 0; overflow: hidden`, runner track `overflow: hidden`, bong bóng kẹp viewport (FX-19, KR-20).
- **Màn ngang thấp (1024×768, 1280×720):** pháo giấy tầng 10 có gravity thấp và bay lên, hạt tắt trước khi xuống tới dòng chữ.

## Quyết định & câu hỏi
- **D1 (FX-01, Q3):** Bỏ hẳn nhãn hai bên. Giữ hai lề `--hf-gutter` như khoảng trống để lộ lớp nền phía sau, không đặt phần tử FX nào trong lề. Như vậy không đổi bề rộng vùng chữ, test bố cục HF-01..04 không bị ảnh hưởng.
- **D2:** Đồng hồ combo nằm trong TopBar cạnh owl. Lý do:
  - Owl hiện ở đó, và AC yêu cầu "cạnh `GameOwl`".
  - TopBar xa chữ, phím và tay nên chắc chắn không che.
  - Bỏ pill `.combo-display` trên vùng chữ để chỉ có một số combo trên màn.
- **D3:** Lớp nền (sticker, pháo hoa nền, trời) đặt **sau** `.main` thay vì vẽ vào lề. Các khối nội dung có nền đặc nên tự che phần hiệu ứng nằm sau chúng. FX-16/FX-19 được bảo đảm bằng cấu trúc chứ không bằng tính toán vị trí.
- **D4:** Nhân vật tầng 15 chạy **trên thanh tiến độ**: đây là dải ngang duy nhất gần mắt trẻ mà không phải chữ hay phím, và gợi ý "tiến lên".
- **D5:** Pháo giấy tầng 10 bắn lên và tắt trước khi rơi về dòng chữ, để vừa "bật từ ký tự" vừa không che chữ đang gõ.
- **D6:** Hạt từng phím bay lên và lùi về phía chữ đã gõ, không bay về phía chữ kế tiếp.
- **D7:** Mở rộng hiệu ứng hoàn thành từ cho mọi `soundMode` (trước đây `wordBurst` chỉ chạy ở `soundMode='word'`), vì FX-10 dựa trên `completedWord` chứ không dựa trên chế độ đọc.
- **D8:** `.ta-head` nâng z-index lên 2 để bong bóng owl tràn xuống StatsBar không bị che. Bong bóng tạm che StatsBar ≤ 1.5s, cùng lập luận với HF D3: trẻ không đọc số liệu giữa lúc gõ.
- **D9:** Ở mức Vừa, tầng bị bỏ chất liệu (15/30/40/75+) vẫn có nhãn khen, để thang tầng vẫn "đều tay" với trẻ.
- **D10:** Pool câu khen tách 2 nhóm: nhãn tầng (ngắn, hào hứng) và owl (owl nói, xưng "cú"/"con"). Tránh việc trẻ thấy cùng một câu ở hai nơi liền nhau.
- **Lưu ý cho QC:** các test HF sau phải đổi hoặc bỏ theo thiết kế mới:
  - `ComboBurst.test.tsx`
  - `hf-fireworks.test.ts`
  - `hf-decor.test.ts` (`.combo-side`, `.fw-spark`)
  - phần kiểm `.combo-display` nếu có
- **Câu hỏi cho người dùng:**
  - (a) Ở ≤ 480px, ẩn chữ "Typing Adventure" trên TopBar màn chơi để có chỗ cho owl + đồng hồ? Giả định tạm: có (vẫn đọc được bằng trình đọc màn hình).
  - (b) Owl ở màn chơi tăng từ 40 lên 48px trên desktop có được không? Giả định tạm: được.
  - (c) Bộ nhân vật chạy/phụ kiện/sticker do dev vẽ SVG đơn giản theo nét owl, hay có designer cung cấp asset? Giả định tạm: dev vẽ SVG đơn giản, ≤ 1.5 KB mỗi hình.
  - (d) Owl vẫy cánh lặp mỗi 3s trong lúc trẻ dừng (5–15s) có gây phân tâm không? Giả định tạm: chấp nhận, vì trẻ đang không gõ.

## Lịch sử
- v1 2026-11-06 18:10: bản đầu.
