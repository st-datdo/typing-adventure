# L07 · Task B `l07/wm-moderation-v3` (EX-7, BACKLOG #23)

Worktree: `.worktrees/l07_wm_moderation_v3`, branch `l07/wm-moderation-v3` từ `main` 432c693. `.wt-scope` = `specs/WM/spec.md` (untracked). PR: https://github.com/st-datdo/typing-adventure/pull/11

## Mốc giờ (`date '+%F %H:%M:%S'`, giờ +07)

| Mốc | Giờ | Commit |
|---|---|---|
| Bắt đầu (đọc LESSON) | 2026-10-30 20:25:12 | |
| Spec `approved` (v1) | 2026-10-30 20:26:32 | 556d2e6 `docs(specs): WM ...` |
| Draft PR #11 | 2026-10-30 20:26:58 (`createdAt` 13:26:58Z, sau spec 26s) | |
| Spec v2 (WM-04 chỉ xét `\p{L}`) | 2026-10-30 20:28:02 | fbc1059 |
| `test:` đỏ | 2026-10-30 20:28:09 | c88d94e |
| `feat:` xanh | 2026-10-30 20:29:09 | 6324b7a |
| Mutation xong | 2026-10-30 20:31:25 (131 s) | |
| ready | xem PR timeline (`gh pr ready` sau khi CI xanh) | |

## Dòng đỏ đầu tiên từng ID (commit c88d94e, `vitest run moderation-v3`: 10 failed / 5 passed)

| ID | Test đỏ đầu tiên | Dòng đỏ |
|---|---|---|
| WM-01 | `WM-01: tokens split on hyphen and apostrophe are blocked` | `AssertionError: expected [] to deeply equal [ [ 'dumb-dumb', 'blocked' ], …(3) ]` |
| WM-02 | `WM-02: a multi-token entry matches consecutive tokens anywhere` | `AssertionError: expected [] to deeply equal [ Array(4) ]` |
| WM-03 | `WM-03: combining marks outside U+0300-U+036F are removed when folding` | `AssertionError: expected [] to deeply equal [ [ 'stup⃝id', 'blocked' ], …(2) ]` |
| WM-04 | `WM-04: Latin mixed with Greek or Cyrillic is mixed_script` | `AssertionError: expected [] to deeply equal [ [ 'stυpid', 'mixed_script' ], …(2) ]` |
| WM-05 | `WM-05: blocklist entries without tokens are ignored` | `AssertionError: expected [ 'cat' ] to deeply equal [ '-', '\'', 'cat', '- \'' ]` |
| WM-06 | `WM-06: the 6 cases that slipped through in L06 ...` | `AssertionError: expected [] to deeply equal [ Array(6) ]` |

Đỏ đúng lý do: hàm vẫn chạy, chỉ sai kết quả (không lỗi import/type). 5 test xanh sẵn là hồi quy có chủ đích: WM-01 không khớp chuỗi con, WM-02 thứ tự/không liền kề, WM-02 entry dài hơn từ, WM-04 từ một script, WM-06 5 ca vốn đã chặn.

## 11 ca người chấm L06 → test

Tất cả dùng `DEFAULT_BLOCKLIST`, file `typing-adventure/packages/game-engine/src/__tests__/moderation-v3.test.ts`.

| # | Ca | L06 | Kết quả mới | Test cite ID |
|---|---|---|---|---|
| 1 | `STUPID` | chặn | `blocked` | WM-06 (5 ca cũ) |
| 2 | `stüpid` (U+00FC) | chặn | `blocked` | WM-06 (5 ca cũ) |
| 3 | `you stupid` | chặn | `blocked` | WM-06 (5 ca cũ) |
| 4 | `Đồ Ngốc` | chặn | `blocked` | WM-06 (5 ca cũ) |
| 5 | `đồ  ngốc` | chặn | `blocked` (word `đồ ngốc`) | WM-06 (5 ca cũ) |
| 6 | `thằng đồ ngốc` | lọt | `blocked` | WM-06 (6 ca lọt), WM-02 |
| 7 | `dumb-dumb` | lọt | `blocked` | WM-06 (6 ca lọt), WM-01 |
| 8 | `idiot's` | lọt | `blocked` | WM-06 (6 ca lọt), WM-01 |
| 9 | `stup⃝id` (U+20DD) | lọt | `blocked` | WM-06 (6 ca lọt), WM-03 |
| 10 | `stupid҉` (U+0489) | lọt | `blocked` | WM-06 (6 ca lọt), WM-03, WM-04 (dấu Cyrillic không tính) |
| 11 | `stυpid` (U+03C5) | lọt | `mixed_script` | WM-06 (6 ca lọt), WM-04 |

## Verify (HEAD 6324b7a, trong `typing-adventure/`, qua `rtk proxy`)

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @typing-adventure/game-engine test` | exit 0, `Test Files 16 passed (16)`, `Tests 193 passed (193)` |
| `pnpm typecheck` | exit 0, `Tasks: 4 successful, 4 total` |
| `pnpm lint` | exit 0, `✖ 37 problems (0 errors, 37 warnings)` (không đổi, task không chạm `apps/`) |
| `pnpm --filter @typing-adventure/game-engine mutation` | exit 0, 131 s, `Final mutation score of 78.02 is greater than or equal to break threshold 75` |
| `scripts/ci/check-tdd-commits.sh main HEAD` | exit 0, `check-tdd-commits: OK (4 commits in main..HEAD)` |
| `scripts/ci/guard-diff.sh main HEAD` (không `PR_LABELS`) | exit 0, `guard-diff: OK (main...HEAD)` |
| `git diff main -- .../moderation.test.ts \| wc -l` | `0` (file cũ không đổi; test mới ở file riêng) |
| `grep -c '^import' .../moderation.ts` | `0` |
| `comm -12` diff A và diff B | rỗng |
| Scope offline AC-2 (hook `guard-scope.sh` của checkout lesson, `.wt-scope` = `specs/WM/spec.md`) | rỗng (không `OUT:`); ca âm `apps/web/src/app/api/wordpacks/route.ts` → exit 2 |

Mutation `moderation.ts`: 97.12% (100 killed, 3 survived, 0 no coverage). 3 mutant sống đều tương đương:
- `toLowerCase()` → `toUpperCase()` trong `fold`: từ và blocklist gấp cùng cách nên so vẫn đúng.
- `/[\s'-]+/` → `/[\s'-]/`: token rỗng sinh thêm bị `filter` bỏ, kết quả như cũ.
- `start + entry.length <= tokens.length` → `start - entry.length <= ...`: vòng chạy thêm vài vị trí, `tokens[i]` là `undefined` nên `every` trả false, kết quả như cũ.

Criteria có test: 6/6 ID (100%), mỗi ID có ≥ 1 test cite ID trong `moderation-v3.test.ts`; hành vi không đổi giữ bằng 18 test WP trong `moderation.test.ts` (không sửa).

## Vấn đề gặp và cách xử lý
- U+0483 và U+0489 là `\p{M}` nhưng có `Script=Cyrillic`, nên kiểm script trên mọi ký tự sẽ biến `stupid҉` thành `mixed_script`, trái với WM-06 (`blocked`). Phát hiện khi viết test, trước commit `test:`. Sửa spec trước (v2, commit fbc1059, ghi Lịch sử): WM-04 chỉ xét chữ cái `\p{L}`. Thêm test `WM-04: Cyrillic combining marks on Latin letters are not mixed_script`.
- Push commit `test:` đỏ bị pre-push hook (engine test) chặn, đúng như thiết kế. Đã push bằng `LEFTHOOK=0` một lần (CLAUDE.md cho phép, CI vẫn kiểm). CI đỏ ở commit này là dự kiến, PR vẫn draft.
- Prettier đổi escape `υ`... trong test thành ký tự thật. Giữ như vậy; tên test và bảng trên ghi code point để đọc được.

## Chưa verify runtime
- `guard-scope`/`notify` không chạy trong phiên này (chưa gộp `settings.hooks.json`). Scope chỉ kiểm offline như bảng trên.
- API `wordpacks` với `mixed_script` (WP-05 tự đếm vì khác `duplicate`) không chạy integration test DB. Không đổi code `apps/`; dựa vào `route.ts` lọc `r.reason !== 'duplicate'`.

## Đề xuất BACKLOG #23
`đã xong` qua WM (PR #11): đủ 4 nhóm lọt ở GRADE L06. Phần còn lại tách thành mục mới (ngoài phạm vi WM): từ toàn Cyrillic/Greek trông như Latin (`сат`), confusables TR39, so blocklist có dấu cho tiếng Việt một âm tiết.
