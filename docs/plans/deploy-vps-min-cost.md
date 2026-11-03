# Plan: Deploy production chi phí tối thiểu (1 VPS + domain)

Trạng thái: approved
Lesson/PR: <#PR khi mở>

## Mục tiêu
- Mọi người vào `https://<domain>` dùng được đủ tính năng: chơi guest, đăng ký/đăng nhập (Credentials + Google), lưu record, race multiplayer qua Socket.IO.
- Tổng chi phí khoảng **$6–7/tháng**: 1 VPS 1GB ở Singapore + domain. Mọi thứ khác dùng gói free.
- Deploy lặp lại được bằng 1 lần bấm GitHub Actions, có backup DB hằng ngày.

## Lựa chọn chi phí

| Hạng mục | Chọn | Giá |
|---|---|---|
| VPS | Vultr Cloud Compute Regular 1 vCPU / 1GB / 25GB, Singapore (dự phòng: DigitalOcean 1GB SG $6) | ~$5–6/tháng |
| Domain | `.io.vn`/`.id.vn` (rẻ nhất) hoặc `.com` qua Cloudflare Registrar (~$10.5/năm) | ~$0.1–1/tháng |
| DNS | Cloudflare free, record **DNS only** (mây xám) | $0 |
| HTTPS | Caddy + Let's Encrypt tự động | $0 |
| Postgres | Container `postgres:16-alpine` chung VPS | $0 |
| Registry | GHCR (repo `st-datdo/typing-adventure` public → không tính phí) | $0 |
| CI/CD | GitHub Actions (repo public) | $0 |
| Backup | `pg_dump` hằng ngày, giữ 7 bản local + đẩy Cloudflare R2 (free 10GB) | $0 |
| Giám sát | UptimeRobot free; Sentry free (tuỳ chọn, chỉ cần DSN) | $0 |

Phương án $0 đã cân nhắc nhưng không chọn: Oracle Cloud Always Free (khó xin capacity, rủi ro bị thu hồi), Render free + Neon free (web ngủ sau 15 phút, cold start khoảng 1 phút).

## Ngoài phạm vi
- Scale ngang (nhiều instance). Room/anti-cheat/rate-limit vẫn là `Map` trong RAM; Redis adapter để plan sau.
- Managed DB, load balancer, CDN, multi-AZ.
- Zero-downtime deploy: mỗi lần deploy app restart vài giây, race đang chạy bị rớt.
- Thu gọn image (pnpm deploy, bundle `server.ts`): runner dùng lại stage builder cho đơn giản, image lớn nhưng GHCR public miễn phí.
- Trang chính sách riêng tư / xoá tài khoản (Nghị định 13/2023): cần làm trước khi quảng bá rộng, tách thành plan riêng.

## File thay đổi (dự đoán)
- `typing-adventure/Dockerfile` (sửa): stage builder nhận `ARG NEXT_PUBLIC_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_SENTRY_DSN` → `ENV` trước `pnpm build`; stage runner `FROM builder`, `NODE_ENV=production`, user không phải root, `CMD ["pnpm","--filter","@typing-adventure/web","start:ws"]` (chạy `server.ts` qua tsx, có Socket.IO).
- `typing-adventure/docker-compose.prod.yml` (thêm): `postgres` (volume, healthcheck, `mem_limit` ~256m, `shared_buffers=64MB`), `migrate` (one-shot `prisma migrate deploy`, profile `tools`), `web` (image GHCR, `env_file`, `NODE_OPTIONS=--max-old-space-size=384`, `restart: unless-stopped`), `caddy` (80/443, volume cert). Chỉ Caddy mở cổng ra ngoài; Postgres không publish port.
- `typing-adventure/deploy/Caddyfile` (thêm): `<domain> { reverse_proxy web:3000 { header_up X-Real-IP {remote_host} } }`, có redirect `www`.
- `typing-adventure/deploy/.env.prod.example` (thêm): danh sách biến runtime, không có giá trị thật.
- `typing-adventure/deploy/backup.sh` (thêm): `pg_dump | gzip`, xoay vòng 7 bản, `rclone copy` lên R2.
- `typing-adventure/deploy/bootstrap-vps.sh` (thêm): tạo swap 2GB, cài Docker, bật ufw (22/80/443), tạo user deploy, cron backup.
- `.github/workflows/deploy.yml` (thêm): `workflow_dispatch` → build image với build-arg → push `ghcr.io/st-datdo/typing-adventure:<sha>` + `latest` → SSH vào VPS: `docker compose pull && docker compose run --rm migrate && docker compose up -d`.
- `typing-adventure/docs/DEPLOY_VPS.md` (thêm): runbook từng bước, gồm phần thao tác tay.
- `typing-adventure/.env.example` (sửa): `NEXTAUTH_SECRET` → `AUTH_SECRET`, thêm `AUTH_TRUST_HOST`, `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_WS_URL`.

## Interface chạm tới
- Hàm export: không.
- HTTP: không đổi route. Thêm reverse proxy Caddy: HTTP→HTTPS redirect, WebSocket upgrade cho `/socket.io/`.
- Env build-time (bake vào bundle và CSP): `NEXT_PUBLIC_URL=https://<domain>`, `NEXT_PUBLIC_WS_URL=wss://<domain>`, `NEXT_PUBLIC_SENTRY_DSN` (để trống nếu không dùng).
- Env runtime: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=https://<domain>`, `AUTH_TRUST_HOST=true`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TRUST_PROXY_HEADER=x-real-ip`, `POSTGRES_PASSWORD`.
- GitHub secrets mới: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`. Biến repo: `PROD_DOMAIN`.
- Dependency mới: không (tsx đã có trong devDependencies của `apps/web`).

## Thao tác tay (không nằm trong diff)
1. Mua domain; trỏ nameserver về Cloudflare; tạo record A `@` và `www` → IP VPS, **DNS only**.
2. Tạo VPS Ubuntu 24.04 Singapore, add SSH key, chạy `bootstrap-vps.sh`.
3. Google Cloud Console: OAuth client, redirect URI `https://<domain>/api/auth/callback/google`; publish consent screen sang Production.
4. Tạo `.env.prod` trên VPS (`chmod 600`), `AUTH_SECRET` và `POSTGRES_PASSWORD` sinh bằng `openssl rand -base64 32`.
5. Cloudflare R2: bucket + API token cho rclone (`rclone config` trên VPS).
6. Chạy workflow deploy lần đầu, rồi seed 1 lần: `docker compose -f docker-compose.prod.yml run --rm migrate pnpm --filter @typing-adventure/db db:seed`. Kiểm tra seed có idempotent không trước khi chạy lại.
7. UptimeRobot: monitor HTTPS `https://<domain>` mỗi 5 phút.

## Verify
```bash
docker build --build-arg NEXT_PUBLIC_URL=http://localhost:3000 --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:3000 -t ta:local typing-adventure
# build xanh

docker compose -f typing-adventure/docker-compose.prod.yml config
# không lỗi

curl -sI https://<domain> | head -1
# HTTP/2 200

curl -s "https://<domain>/socket.io/?EIO=4&transport=polling" | head -c 2
# 0{   (handshake Socket.IO, chứng minh server.ts đang chạy)

curl -sI http://<domain> | grep -i location
# location: https://<domain>/

ssh <vps> 'docker compose -f docker-compose.prod.yml ps; free -m'
# web/postgres/caddy healthy; RAM dùng < 800MB lúc idle

ssh <vps> './deploy/backup.sh && rclone ls r2:<bucket> | tail -1'
# có file dump mới
```
Thủ công: đăng ký + đăng nhập Credentials, đăng nhập Google, chơi 1 ván và thấy record lưu lên server, 2 trình duyệt vào cùng 1 phòng race, sai mật khẩu 11 lần → bị rate-limit theo IP thật (không phải `unknown`), restore thử 1 bản dump vào DB tạm.

## Tự review
1. Đoán được diff chưa? Phần lớn có. Còn mơ hồ: `Dockerfile` (runner `FROM builder` có cần `pnpm prune --prod` không, quyền ghi `.next/cache` với user non-root) và `deploy.yml` (cách SSH: action có sẵn hay `ssh` thuần).
2. Interface nào người khác đang dùng? `Dockerfile` đang được `docs/DEPLOY_AWS.md` (ECS/App Runner) tham chiếu: sau khi sửa, image có Socket.IO nên doc AWS vẫn đúng, chỉ cần thêm build-arg. CI `ci.yml` không build Docker. `.github/` có thể nằm trong ruleset bảo vệ: kiểm tra trước khi push.
3. Rollback thế nào? Code: revert commit. Production: `docker compose` pin lại tag `<sha>` trước đó rồi `up -d`. Migration lỗi: restore dump gần nhất. Nếu VPS hỏng: VPS mới + `bootstrap-vps.sh` + restore dump từ R2.

## Rủi ro
- 1GB RAM: Next + Postgres sát giới hạn. Giảm thiểu bằng swap 2GB, `mem_limit`, giới hạn heap Node, build ở CI chứ không build trên VPS. Nếu `free -m` thường xuyên dưới 100MB thì nâng lên gói 2GB (~$10–12).
- Chỉ 1 máy: VPS chết thì mất dịch vụ cho tới khi dựng lại; dữ liệu được bảo vệ bằng backup R2 (mất tối đa 24 giờ).
- Bật proxy Cloudflare (mây cam) sẽ làm `X-Real-IP` thành IP của Cloudflare → rate-limit sai. Giữ DNS only, hoặc cấu hình `trusted_proxies` của Caddy trước khi bật.

## Lịch sử
- v1 2026-11-03 16:41: bản đầu, approved.
- v2 2026-11-03 16:42: đọc code thấy 4 điểm, chỉnh trước khi sửa code.
  - `docker-compose.prod.yml` chuyển vào `typing-adventure/deploy/`, để workflow chỉ cần copy 1 thư mục lên VPS.
  - Thêm sửa `typing-adventure/.dockerignore`: pattern `node_modules`, `.next`, `.env*` chỉ khớp ở gốc, nên `apps/web/.env` và `packages/db/.env` (có secret) bị đóng vào image public, và `node_modules` build trên macOS ghi đè bản Linux.
  - Runner chạy `node --import tsx server.ts` thay vì `pnpm ... start:ws`: user non-root không có pnpm do corepack cache sẵn, sẽ phải tải lúc chạy. Cài `openssl` cho Prisma trên Alpine.
  - Workflow thêm secret `VPS_KNOWN_HOSTS` (không dùng `ssh-keyscan` lúc chạy) và input `image_tag` để rollback mà không build lại. Chỉ dùng `docker` CLI, không thêm action bên thứ ba.

## Thực tế
File thật: `typing-adventure/Dockerfile`, `typing-adventure/.dockerignore`, `typing-adventure/.env.example`, `typing-adventure/deploy/{docker-compose.prod.yml,Caddyfile,.env.prod.example,backup.sh,bootstrap-vps.sh}`, `typing-adventure/docs/DEPLOY_VPS.md`, `.github/workflows/deploy.yml`.

- Khớp dự đoán: Dockerfile, Caddyfile, `.env.prod.example`, `backup.sh`, `bootstrap-vps.sh`, `deploy.yml`, `DEPLOY_VPS.md`, `.env.example`.
- Dự đoán mà không đổi: không có.
- Đổi mà không dự đoán (đã ghi ở v2): `.dockerignore`; vị trí `docker-compose.prod.yml` chuyển vào `deploy/`.
- Tỉ lệ khớp: 9/10 file dự đoán đúng (vị trí compose lệch), cộng 1 file ngoài dự đoán.

Verify local (Docker Desktop, image `linux/amd64` 636MB, user `node`, không có `.env*` trong `/app`): `prisma migrate deploy` áp 2 migration; seed chạy OK; `/` 200; `/socket.io/?EIO=4&transport=polling` trả `0{"sid"...`; `/lobby` khi chưa đăng nhập → 307 `/login`; đăng ký → đăng nhập Credentials → session có `id` → `/lobby` 200; sai mật khẩu với cùng `X-Real-IP` lần thứ 11 → 429, IP khác vẫn 302; CSP `connect-src` lấy đúng `NEXT_PUBLIC_WS_URL` từ build-arg. RAM idle: web ~292MB/640MB, postgres ~53MB/256MB. Log có cảnh báo `"next start" does not work with "output: standalone"`: vô hại vì chạy custom server chứ không chạy `next start`; chưa bỏ `output: 'standalone'` để giữ diff nhỏ (image hiện không dùng thư mục standalone nữa, có thể bỏ ở plan sau).

Chưa verify được: Caddy cấp cert thật, `deploy.yml` chạy trên GitHub, `bootstrap-vps.sh` trên Ubuntu thật, backup lên R2. Cần VPS + domain.
