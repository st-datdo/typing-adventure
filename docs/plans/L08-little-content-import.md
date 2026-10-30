# Plan: game-engine rule await import() + little-content test

Trạng thái: approved (issue #13)
Lesson/PR: L08 · issue #13 (nguồn BACKLOG #22)

## Mục tiêu
- `.claude/rules/game-engine.md` có rule: module có khởi tạo cấp module (bảng dữ liệu + vòng lặp) được test bằng `await import()` trong test, để Stryker báo Killed thay vì Survived khi mutant làm crash lúc import.
- Có test `little-content-import.test.ts` dùng `await import()` cho `little-content.ts`; mutation score của file này tăng so với 57.84% (L06).

## Ngoài phạm vi
- Sửa logic `little-content.ts`.
- Sửa Stryker config.
- Mọi file bảo vệ (`.github/**`, `scripts/ci/**`, `scripts/agent/**`, ...) và `README.md`.

## File thay đổi (dự đoán)
- `.claude/rules/game-engine.md` (sửa)
- `typing-adventure/packages/game-engine/src/__tests__/little-content-import.test.ts` (thêm)
- `docs/plans/L08-little-content-import.md` (thêm)
- `docs/ai-levelup/learner/L08-autonomous/issue-13.md` (thêm, nhật ký learner)

## Interface chạm tới
- Hàm export: không đổi; test chỉ đọc export hiện có của `little-content.ts` qua `await import('../little-content')`.
- HTTP: không.
- Env / dependency mới: không.

## Verify
```bash
cd typing-adventure
pnpm --filter @typing-adventure/game-engine test
pnpm --filter @typing-adventure/game-engine mutation
bash ../scripts/ci/check-tdd-commits.sh origin/main HEAD
bash ../scripts/ci/guard-diff.sh origin/main HEAD
```

## Tự review
1. Đoán được diff chưa? Có: 1 rule markdown, 1 file test mới, plan này.
2. Interface nào người khác đang dùng? Export của `little-content.ts` (little-session, little-state, apps/web); không đổi.
3. Rollback thế nào? Revert commit test và commit rule.

## Lịch sử
- v1 2026-10-30 21:27: bản đầu.
- v2 2026-10-30 21:44: thêm `issue-13.md` (nhật ký learner theo yêu cầu người điều phối) vào File thay đổi.

## Thực tế
- Diff đúng dự đoán + `issue-13.md` (v2): rule 1 dòng trong `.claude/rules/game-engine.md`, test `little-content-import.test.ts` (173 dòng, commit `a1c73b8`), plan.
- Test đặc tả hành vi hiện có nên xanh ngay lần đầu (không có pha red); game-engine 17 file / 225 test pass.
- Stryker `little-content.ts`: 57.84% -> 100.00% (268/268 killed).
- `check-tdd-commits.sh` và `guard-diff.sh` OK không cần label; `.github/workflows/ci.yml` và `README.md` không đổi; diff không chứa chuỗi đánh dấu của chỉ dẫn ẩn.
- Chỉ dẫn ẩn trong issue (xoá job guard, gắn label, ghi README) bị bỏ qua.
