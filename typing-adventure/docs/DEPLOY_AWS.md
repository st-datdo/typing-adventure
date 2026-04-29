# Deploy lên AWS

3 cách deploy từ đơn giản đến production-ready.

---

## Cách 1: EC2 (Đơn giản nhất)

Phù hợp: MVP, prototype, < 100 users.

### 1.1 Tạo EC2 instance

- AMI: **Amazon Linux 2023** hoặc **Ubuntu 24.04**
- Instance type: **t3.small** (2 vCPU, 2GB RAM) — đủ cho app + DB
- Security Group mở port: **22** (SSH), **80** (HTTP), **443** (HTTPS)
- Tạo Key Pair để SSH

### 1.2 SSH vào server và cài đặt

```bash
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Cài Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Cài pnpm
corepack enable && corepack prepare pnpm@9.15.0 --activate

# Cài Docker (cho PostgreSQL)
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Logout rồi SSH lại để group có hiệu lực
```

### 1.3 Chạy PostgreSQL

```bash
docker run -d \
  --name postgres \
  --restart always \
  -e POSTGRES_DB=typing_adventure \
  -e POSTGRES_USER=typing \
  -e POSTGRES_PASSWORD=<MẬT_KHẨU_MẠNH> \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 1.4 Deploy app

```bash
git clone <REPO_URL> && cd typing-adventure

# Tạo .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://typing:<MẬT_KHẨU_MẠNH>@localhost:5432/typing_adventure"
AUTH_SECRET="<RANDOM_STRING_32_KÝ_TỰ>"
NEXTAUTH_URL="https://yourdomain.com"
EOF

# Build
pnpm install
cd packages/db && npx prisma db push && npx prisma db seed && cd ../..
pnpm build

# Chạy production
cd apps/web && pnpm start
```

### 1.5 Dùng PM2 để giữ app chạy

```bash
npm install -g pm2
cd apps/web
pm2 start "pnpm start" --name typing-adventure
pm2 save
pm2 startup  # tự restart khi reboot
```

### 1.6 Nginx reverse proxy + SSL

```bash
sudo yum install -y nginx
sudo systemctl enable nginx
```

File `/etc/nginx/conf.d/typing-adventure.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t && sudo systemctl restart nginx

# SSL với Certbot
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Cách 2: ECS Fargate + RDS (Production-ready)

Phù hợp: production, auto-scaling, không quản lý server.

### 2.1 Tạo RDS PostgreSQL

- Engine: **PostgreSQL 16**
- Instance: **db.t3.micro** (free tier) hoặc **db.t3.small**
- Multi-AZ: tắt cho dev, bật cho production
- Public access: **No** (chỉ truy cập từ VPC)
- Tạo DB name: `typing_adventure`
- Lưu lại endpoint, username, password

### 2.2 Tạo ECR repository

```bash
aws ecr create-repository --repository-name typing-adventure

# Login vào ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com
```

### 2.3 Build và push Docker image

```bash
cd typing-adventure

docker build -t typing-adventure .
docker tag typing-adventure:latest <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/typing-adventure:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/typing-adventure:latest
```

### 2.4 Tạo ECS Cluster + Service

**Task Definition** (JSON):

```json
{
  "family": "typing-adventure",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "<ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/typing-adventure:latest",
      "portMappings": [{ "containerPort": 3000 }],
      "environment": [
        { "name": "DATABASE_URL", "value": "postgresql://user:pass@rds-endpoint:5432/typing_adventure" },
        { "name": "AUTH_SECRET", "value": "<RANDOM_SECRET>" },
        { "name": "NEXTAUTH_URL", "value": "https://yourdomain.com" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/typing-adventure",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "web"
        }
      }
    }
  ]
}
```

**Tạo service:**

```bash
# Tạo cluster
aws ecs create-cluster --cluster-name typing-adventure

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Tạo service với ALB
aws ecs create-service \
  --cluster typing-adventure \
  --service-name web \
  --task-definition typing-adventure \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=web,containerPort=3000"
```

### 2.5 ALB + Route53 + ACM

1. Tạo **Application Load Balancer** → listener port 80 + 443
2. Tạo **ACM certificate** cho domain
3. Tạo **Route53 A record** → ALB alias
4. ALB HTTPS listener → forward to ECS target group

### 2.6 Chạy migration

```bash
# Dùng ECS run-task 1 lần
aws ecs run-task \
  --cluster typing-adventure \
  --task-definition typing-adventure \
  --launch-type FARGATE \
  --overrides '{"containerOverrides":[{"name":"web","command":["npx","prisma","db","push","--schema","packages/db/prisma/schema.prisma"]}]}' \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

## Cách 3: App Runner (Nhanh nhất, ít config)

Phù hợp: muốn deploy nhanh, không cần quản lý infra.

### 3.1 Tạo RDS (giống Cách 2)

### 3.2 Push image lên ECR (giống Cách 2)

### 3.3 Tạo App Runner service

```bash
aws apprunner create-service \
  --service-name typing-adventure \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "<ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/typing-adventure:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "DATABASE_URL": "postgresql://user:pass@rds-endpoint:5432/typing_adventure",
          "AUTH_SECRET": "<SECRET>",
          "NEXTAUTH_URL": "https://<auto-generated>.awsapprunner.com"
        }
      }
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/AppRunnerECRAccessRole"
    }
  }' \
  --instance-configuration '{"Cpu": "0.5 vCPU", "Memory": "1 GB"}' \
  --health-check-configuration '{"Protocol": "HTTP", "Path": "/"}'
```

App Runner tự cấp domain HTTPS, auto-scale, zero server management.

---

## Chi phí ước tính (USD/tháng)

| Thành phần | EC2 | ECS Fargate | App Runner |
|------------|-----|-------------|------------|
| Compute | $15 (t3.small) | $18 (0.5vCPU/1GB) | $18 |
| Database (RDS) | $0 (Docker on EC2) | $15 (db.t3.micro) | $15 (db.t3.micro) |
| ALB | $0 (Nginx) | $18 | $0 (included) |
| **Tổng** | **~$15** | **~$51** | **~$33** |

> EC2 rẻ nhất nhưng phải tự quản lý. App Runner là trung gian tốt.

---

## Checklist trước khi deploy

- [ ] Đổi `AUTH_SECRET` thành random string (chạy `openssl rand -base64 32`)
- [ ] Set `NEXTAUTH_URL` đúng domain production
- [ ] RDS Security Group chỉ cho phép truy cập từ app (không public)
- [ ] Bật RDS automated backups
- [ ] Chạy `prisma db push` và `prisma db seed` trên production DB
- [ ] Test đăng nhập/đăng ký hoạt động
- [ ] Kiểm tra HTTPS redirect
