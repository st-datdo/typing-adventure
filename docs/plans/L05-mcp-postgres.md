# Plan: Thay MCP postgres deprecated (BACKLOG #5)

Trạng thái: approved
Lesson/PR: L05 · EX-7

## Mục tiêu
- `.mcp.json` server `postgres-ro` chạy server Postgres MCP còn bảo trì, pin phiên bản, vẫn đăng nhập bằng role `mcp_ro`, thêm lớp read-only phía phiên (`default_transaction_read_only=on`).

## Ngoài phạm vi
- Đổi role/quyền DB, đổi `init-db/01-mcp-readonly.sql`.
- Bật server trong `.claude/settings*.json` (user tự approve server project).

## Lựa chọn
| Ứng viên | Nguồn | Bản mới nhất | Ghi chú |
|---|---|---|---|
| `@modelcontextprotocol/server-postgres` | npm | 0.6.2 | npm: `Package no longer supported` |
| `postgres-mcp` (Crystal DBA) | PyPI, github.com/crystaldba/postgres-mcp | 0.3.0 (2025-05-16) | có `--access-mode=restricted`; bản release đã 17 tháng, fix `mcp[cli]<2.0` (2026-08) chưa phát hành |
| **MCP Toolbox for Databases** (`@toolbox-sdk/server`) | npm, github.com/googleapis/mcp-toolbox | **1.15.0 (2026-10-23)** | Google, release 2–3 tuần/lần; `--prebuilt postgres --stdio`; không có cờ read-only → dùng role `mcp_ro` + `options=-c default_transaction_read_only=on` |

Chọn MCP Toolbox 1.15.0 qua `npx -y @toolbox-sdk/server@1.15.0 --prebuilt postgres --stdio`. Kết nối qua env `POSTGRES_HOST/PORT/DATABASE/USER/PASSWORD/QUERY_PARAMS`, mặc định `mcp_ro`/`mcp_ro`@localhost:5432/typing_adventure, ghi đè được bằng `MCP_PG_*`.

## File thay đổi (dự đoán)
- `.mcp.json` (sửa)

## Interface chạm tới
- Tên server `postgres-ro` giữ nguyên; tool đổi từ `query` sang `execute_sql`, `list_tables`, …
- Env / dependency mới: `MCP_PG_HOST`, `MCP_PG_PORT`, `MCP_PG_DATABASE`, `MCP_PG_USER`, `MCP_PG_PASSWORD` (tuỳ chọn, thay cho `MCP_PG_URL`).

## Verify
```bash
jq empty .mcp.json && ! grep -n 'server-postgres@0.6.2' .mcp.json
claude mcp list                                   # thấy postgres-ro (có thể Pending approval)
# JSON-RPC stdio trực tiếp: initialize → tools/call execute_sql "select count(*) from \"User\"" (được), "create table mcp_probe(x int)" (bị chặn)
psql (mcp_ro) -c "select current_user, rolsuper ..."; psql (mcp_ro) -c "create table ..." → permission denied / read-only
```

## Tự review
1. Đoán được diff chưa? Có, 1 file. Mơ hồ: `npx` tải binary theo nền tảng lần đầu (mạng).
2. Interface nào người khác đang dùng? Chỉ agent qua MCP; `CLAUDE.md` mục MCP chỉ nói tên server.
3. Rollback? Revert `.mcp.json`.

## Lịch sử
- v1 2026-10-30 00:32: bản đầu, approved.

## Thực tế
Điền 2026-10-30 00:51. Plan `bafa8d0` (00:32:46) trước code `2a4a3aa` (00:46:09). Không có v2.

Lệnh: `git diff --name-only main...lesson/L05-enforcement -- . ':!docs/ai-levelup/'`, lọc `.mcp.json`.

- Khớp (1): `.mcp.json`.
- Dự đoán mà không đổi (0) / đổi mà không dự đoán (0): không.
- Tỉ lệ khớp: 1 / 1 = 100%.
- Lệch: không thêm `POSTGRES_QUERY_PARAMS` (`queryParams` của toolbox là map, không chắc nhận chuỗi từ env); lớp read-only phiên đến từ `ALTER ROLE mcp_ro SET default_transaction_read_only = on` đã có. Chạy server bằng `npx` bị auto-mode chặn (`Code from External`) → runtime MCP `chưa verify`; kiểm role bằng `psql`. Phát hiện: trên Postgres 14 (Homebrew) `mcp_ro` có `CREATE` trên schema `public` qua `PUBLIC`, chỉ lớp `default_transaction_read_only` chặn DDL, mà lớp này tắt được bằng `SET` (xem REPORT).
- Design round 2: không.
