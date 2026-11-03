# Deploy lên 1 VPS (chi phí tối thiểu)

Plan: `docs/plans/deploy-vps-min-cost.md` ở gốc repo.

Kiến trúc: 1 VPS Ubuntu 24.04 chạy Docker Compose gồm `caddy` (HTTPS, cổng 80/443) → `web` (Next + Socket.IO, `server.ts`) → `postgres`. Image build trên GitHub Actions, đẩy lên GHCR, VPS chỉ pull về.

| Hạng mục | Chọn | Giá |
|---|---|---|
| VPS | 1 vCPU / 1GB / 25GB, Singapore (Vultr, DigitalOcean...) | ~$5–6/tháng |
| Domain | `.io.vn` / `.id.vn` hoặc `.com` (Cloudflare Registrar) | ~$0.1–1/tháng |
| DNS, HTTPS, registry, CI, backup R2, uptime | Cloudflare, Let's Encrypt, GHCR, Actions, R2, UptimeRobot | $0 |

## Các file

| File | Vai trò |
|---|---|
| `Dockerfile` | Build app với `NEXT_PUBLIC_*` truyền qua `--build-arg`, chạy `node --import tsx server.ts` (có Socket.IO) |
| `deploy/docker-compose.prod.yml` | `postgres`, `web`, `caddy`, `migrate` (profile `tools`) |
| `deploy/Caddyfile` | HTTPS tự động, redirect `www`, đặt `X-Real-IP` cho rate-limit |
| `deploy/.env.prod.example` | Mẫu `.env` trên VPS |
| `deploy/backup.sh` | `pg_dump` → gzip, giữ 7 bản local, đẩy R2 nếu có `BACKUP_REMOTE` |
| `deploy/bootstrap-vps.sh` | Swap, Docker, ufw, user `deploy`, tắt đăng nhập SSH bằng mật khẩu, cron backup |
| `../.github/workflows/deploy.yml` | Bấm chạy tay: build → push GHCR → copy file deploy → migrate → restart → smoke test |

## Lần đầu

### 1. Domain và DNS
1. Mua domain, trỏ nameserver về Cloudflare (gói free).
2. Sau khi có IP VPS (bước 2): tạo record `A @` và `A www` → IP VPS, chọn **DNS only** (mây xám).

> Không bật proxy Cloudflare (mây cam): khi đó `X-Real-IP` là IP của Cloudflare, rate-limit đăng nhập sẽ gộp mọi người vào chung vài IP.

### 2. VPS
1. Tạo VPS Ubuntu 24.04, region Singapore, thêm SSH key cá nhân của bạn.
2. Copy và chạy bootstrap (đổi `r2:typing-adventure-backups` thành remote rclone bạn sẽ tạo ở bước 5, hoặc bỏ trống):
   ```bash
   scp typing-adventure/deploy/bootstrap-vps.sh root@<IP>:
   ssh root@<IP> 'BACKUP_REMOTE=r2:typing-adventure-backups bash bootstrap-vps.sh'
   ```
3. Kiểm tra đăng nhập được bằng user mới **trước khi** đóng phiên root: `ssh deploy@<IP> docker ps`.

### 3. Google OAuth
Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application):
- Authorized JavaScript origins: `https://<domain>`
- Authorized redirect URIs: `https://<domain>/api/auth/callback/google`
- OAuth consent screen: chuyển sang **In production**, nếu không chỉ test user đăng nhập được.

### 4. `.env` trên VPS
```bash
ssh deploy@<IP>
cd ~/typing-adventure
nano .env      # dán nội dung deploy/.env.prod.example rồi điền
chmod 600 .env
```
- `POSTGRES_PASSWORD`: `openssl rand -hex 24` (dùng hex vì mật khẩu nằm trong URL, ký tự `/ + =` của base64 làm hỏng URL).
- `AUTH_SECRET`: `openssl rand -base64 32`.
- `DOMAIN`, `AUTH_URL`, `NEXT_PUBLIC_URL` phải khớp domain thật.
- `TRUST_PROXY_HEADER=x-real-ip` là **bắt buộc** (xem `DEPLOY_AWS.md`, mục "Rate limit và IP client").
- `WEB_IMAGE` để nguyên, workflow tự ghi đè mỗi lần deploy.

### 5. Backup lên Cloudflare R2 (tuỳ chọn nhưng nên có)
1. Cloudflare → R2 → tạo bucket `typing-adventure-backups`; tạo API token quyền Object Read & Write cho bucket đó.
2. Trên VPS, user `deploy`: `rclone config` → New remote tên `r2`, type `s3`, provider `Cloudflare`, nhập access key, secret, endpoint `https://<account_id>.r2.cloudflarestorage.com`.
3. Thử: `rclone lsd r2:`.

### 6. GitHub
Settings → Secrets and variables → Actions:

| Loại | Tên | Giá trị |
|---|---|---|
| Variable | `PROD_DOMAIN` | `example.io.vn` (không có `https://`) |
| Variable | `NEXT_PUBLIC_SENTRY_DSN` | để trống nếu không dùng Sentry |
| Secret | `VPS_HOST` | IP VPS |
| Secret | `VPS_USER` | `deploy` |
| Secret | `VPS_SSH_KEY` | private key riêng cho deploy (bên dưới) |
| Secret | `VPS_KNOWN_HOSTS` | output `ssh-keyscan` (bên dưới) |

```bash
ssh-keygen -t ed25519 -f ~/.ssh/typing_deploy -N '' -C github-deploy
ssh-copy-id -i ~/.ssh/typing_deploy.pub deploy@<IP>
cat ~/.ssh/typing_deploy                      # → VPS_SSH_KEY
ssh-keyscan -t ed25519 <IP>                   # → VPS_KNOWN_HOSTS
```
So fingerprint của `ssh-keyscan` với fingerprint trong console nhà cung cấp VPS trước khi dán.

### 7. Deploy lần đầu
1. Actions → **Deploy** → Run workflow (để trống `image_tag`). Workflow build image, đẩy lên GHCR, chạy `prisma migrate deploy`, khởi động lại, chờ HTTPS và handshake Socket.IO trả lời.
2. GitHub → Packages → `typing-adventure` → Package settings → **Change visibility → Public**. Package private trên gói free chỉ có 500MB, image vượt mức này sẽ bị tính tiền. Image không chứa secret (`.dockerignore` loại mọi `.env*`).
3. Seed 1 lần (seed dùng `upsert`, chạy lại không nhân đôi dữ liệu):
   ```bash
   ssh deploy@<IP>
   cd ~/typing-adventure
   docker compose -f docker-compose.prod.yml --profile tools run --rm migrate node_modules/.bin/tsx prisma/seed.ts
   ```
4. Cấp quyền admin cho tài khoản của bạn (sau khi đăng ký trên web):
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres \
     psql -U typing -d typing_adventure -c "UPDATE \"User\" SET role='ADMIN' WHERE email='<email của bạn>';"
   ```
5. UptimeRobot: monitor HTTPS `https://<domain>`, chu kỳ 5 phút.

## Kiểm tra sau deploy
```bash
curl -sI https://<domain> | head -1                                      # HTTP/2 200
curl -sI http://<domain> | grep -i location                              # https://<domain>/
curl -s "https://<domain>/socket.io/?EIO=4&transport=polling" | head -c 2 # 0{
ssh deploy@<IP> 'cd typing-adventure && docker compose -f docker-compose.prod.yml ps && free -m'
ssh deploy@<IP> 'typing-adventure/backup.sh'
```
Thủ công: đăng ký + đăng nhập (mật khẩu và Google), chơi 1 ván và thấy record lưu trên server, 2 trình duyệt vào cùng 1 phòng race, sai mật khẩu 11 lần thì bị chặn.

## Vận hành

| Việc | Lệnh (trên VPS, trong `~/typing-adventure`) |
|---|---|
| Xem log | `docker compose -f docker-compose.prod.yml logs -f web` |
| Restart app | `docker compose -f docker-compose.prod.yml restart web` |
| Vào DB | `docker compose -f docker-compose.prod.yml exec postgres psql -U typing -d typing_adventure` |
| Backup ngay | `./backup.sh` |
| RAM | `free -m`, `docker stats --no-stream` |

**Deploy bản mới:** Actions → Deploy → Run workflow trên `main`.

**Rollback:** Actions → Deploy → Run workflow, điền `image_tag` = SHA commit đã deploy trước đó (xem lịch sử run). Không build lại. Nếu bản mới đã chạy migration làm hỏng dữ liệu thì restore backup như dưới.

**Restore backup** (dump có `--clean`, ghi đè dữ liệu hiện tại):
```bash
docker compose -f docker-compose.prod.yml stop web
gunzip -c ~/backups/<file>.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U typing -d typing_adventure
docker compose -f docker-compose.prod.yml start web
```
Lấy bản từ R2: `rclone copy r2:typing-adventure-backups/<file> ~/backups/`.

**Khi nào nâng cấp:** `free -m` thường xuyên còn dưới 100MB, hoặc swap dùng liên tục → lên gói 2GB (~$10–12). Muốn chạy nhiều instance thì phải chuyển room/rate-limit sang Redis trước (đang là `Map` trong RAM).

## Giới hạn
- 1 máy: VPS chết là ngừng dịch vụ tới khi dựng lại (bootstrap + restore backup, khoảng 30 phút). Dữ liệu mất tối đa 24 giờ.
- Mỗi lần deploy app khởi động lại vài giây, race đang chạy bị rớt.
