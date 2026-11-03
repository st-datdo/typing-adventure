#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "bootstrap-vps.sh: run as root" >&2
  exit 1
fi

deploy_user=${DEPLOY_USER:-deploy}
app_dir="/home/$deploy_user/typing-adventure"
swap_size=${SWAP_SIZE:-2G}
backup_remote=${BACKUP_REMOTE:-}

if ! swapon --show | grep -q .; then
  fallocate -l "$swap_size" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl ufw rclone unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker

cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
systemctl restart docker

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

if ! id "$deploy_user" >/dev/null 2>&1; then
  adduser --disabled-password --gecos '' "$deploy_user"
fi
usermod -aG docker "$deploy_user"
if [ -s /root/.ssh/authorized_keys ]; then
  install -d -m 700 -o "$deploy_user" -g "$deploy_user" "/home/$deploy_user/.ssh"
  install -m 600 -o "$deploy_user" -g "$deploy_user" /root/.ssh/authorized_keys "/home/$deploy_user/.ssh/authorized_keys"
  cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'SSHD'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
SSHD
  systemctl reload ssh
fi

install -d -m 750 -o "$deploy_user" -g "$deploy_user" "$app_dir"

cat > /etc/cron.d/typing-adventure-backup <<CRON
SHELL=/bin/bash
30 19 * * * $deploy_user BACKUP_REMOTE=$backup_remote $app_dir/backup.sh >> /home/$deploy_user/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/typing-adventure-backup

echo "bootstrap ok: user=$deploy_user dir=$app_dir"
