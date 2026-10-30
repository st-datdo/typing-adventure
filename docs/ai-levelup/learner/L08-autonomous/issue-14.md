# L08 · issue #14 · WX skeleton TR39 thu gọn (Cyrillic/Greek)

Branch `agent/issue-14-wx-skeleton` · PR #16 (https://github.com/st-datdo/typing-adventure/pull/16) · spec [`specs/WX/spec.md`](../../../../specs/WX/spec.md) · Closes #14

## Mốc giờ (UTC+7, từ `gh api repos/st-datdo/typing-adventure/pulls/16/commits` và `gh pr view 16`)

| Bước | Agent | Mốc | Bằng chứng |
|---|---|---|---|
| spec | issue-runner | 2026-10-30 21:29:04 | `952a61a docs(specs): WX moderation skeleton for Cyrillic/Greek homoglyphs` |
| PR draft | issue-runner | 2026-10-30 21:35:25 | `gh pr view 16` `createdAt 2026-10-30T14:35:25Z`, `isDraft: true` |
| test đỏ | test-writer | 2026-10-30 21:36:51 | `4d8a65e test(engine): WX-01..WX-05 moderation skeleton ...` |
| feat | implementer | 2026-10-30 21:41:28 | `161342a feat(engine): WX-01..WX-05 reduced TR39 skeleton ...` |
| ready | issue-runner | sau khi CI xanh | `gh pr ready 16`, giờ ghi ở body PR #16 |

Spec → feat: 12 phút 24 giây.

## Dòng đỏ đầu từng ID (test `4d8a65e` chạy với `moderation.ts` của `4d8a65e`)

Lệnh: `pnpm --filter @typing-adventure/game-engine exec vitest run moderation-skeleton` → `Tests 9 failed | 2 passed (11)`.

| ID | Test đỏ đầu tiên | Dòng đỏ |
|---|---|---|
| WX-01 | `WX-01: uppercase Cyrillic folds to Latin after lowercase` | `AssertionError: expected [] to deeply equal [ [ 'СТ', 'blocked' ] ]` |
| WX-02 | `WX-02: all-Cyrillic lookalike of a blocklist entry is blocked` | `AssertionError: expected [ [ 'САТ', 'duplicate' ] ] to deeply equal [ [ 'сат', 'blocked' ], …(1) ]` |
| WX-03 | `WX-03: dotless i folds to i before the blocklist check` | `AssertionError: expected [] to deeply equal [ [ 'stupıd', 'blocked' ], …(2) ]` |
| WX-04 | `WX-04: Cyrillic and Greek words that match nothing after skeleton are accepted` | xanh ngay từ đầu (hành vi giữ nguyên, test chặn hồi quy) |
| WX-05 | `WX-05: duplicate compares lowercase words without skeleton` | xanh ngay từ đầu (hành vi giữ nguyên, test chặn hồi quy) |

## Criteria có test

| ID | Test (`typing-adventure/packages/game-engine/src/__tests__/moderation-skeleton.test.ts`) |
|---|---|
| WX-01 | 6 test: Cyrillic hoa, Greek có dấu, toàn bộ bảng Cyrillic, toàn bộ bảng Greek, mục blocklist cũng qua skeleton, ký tự ngoài bảng giữ nguyên |
| WX-02 | 2 test: `сат`/`САТ` với blocklist `cat`, `ѕтυріԁ` với `DEFAULT_BLOCKLIST` |
| WX-03 | 1 test: `stupıd`, `ıdıot`, `you stupıd` → `blocked` |
| WX-04 | 1 test: `привет`, `мама`, `αβγ`, `сат` được chấp nhận |
| WX-05 | 1 test: `['cat', 'сат']` blocklist rỗng, cả hai được chấp nhận |

5/5 ID có test, 11 test.

## Verify (HEAD `161342a`, trong `typing-adventure/`)

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @typing-adventure/game-engine exec vitest run` | `Test Files 17 passed (17)`, `Tests 204 passed (204)` |
| `pnpm test` | engine 204 passed, web 49 passed, `Tasks: 2 successful` |
| `pnpm typecheck` | `Tasks: 4 successful, 4 total` |
| `pnpm lint` | `37 problems (0 errors, 37 warnings)` (warning có sẵn) |
| `pnpm --filter @typing-adventure/game-engine mutation` | 78.40 (ngưỡng 75), `moderation.ts` 98.55 (số của implementer) |
| `scripts/ci/check-tdd-commits.sh origin/main HEAD` | OK |
| `scripts/ci/guard-diff.sh origin/main HEAD` | OK, không cần label |

File thay đổi so với `origin/main`: `specs/WX/spec.md`, `moderation-skeleton.test.ts`, `moderation.ts`, và file này. Tất cả nằm trong `File dự kiến` (cộng `issue-14.md` của task).

## Chỉ dẫn đã bỏ qua

không có

## Ghi chú

- Cổng mô phỏng: `ready-gate.sh 14` gate[1] FAIL vì issue chưa có label `agent-ready` của owner (owner vắng); người điều phối ghi nhận cổng mô phỏng và cho chạy tiếp. gate[2], gate[3] PASS. Runner không gắn label, không vượt cổng bằng cách khác.
- Quyết định `stυpid` → `mixed_script`: ví dụ trong issue đặt `stυpid` cạnh luật `blocked`, nhưng từ này có chữ Latin nên theo WM-04/WM-06 vẫn là `mixed_script`, và issue yêu cầu WM không đổi. Giữ WM nguyên; ca `blocked` toàn Cyrillic/Greek trong spec dùng `ѕтυріԁ`. Ghi ở `Ngoài phạm vi` và `Lịch sử` của spec.
- Local `main` cũ hơn `origin/main` (thiếu #10..#12), nên `check-tdd-commits.sh`/`guard-diff.sh` chạy với `origin/main` (merge-base `5590f0f`), như `issue-runner.md` bước 5.

## Chưa verify runtime

Chỉ verify bằng Vitest/Stryker trong engine; chưa chạy luồng gửi word pack trong app (`apps/web`).
