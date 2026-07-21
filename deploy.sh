#!/usr/bin/env bash
#
# SecKnight Vision — one-shot deployment script
# ================================================
# Deploys the full stack (MySQL, MongoDB, Redis, 7 backend services, frontend,
# nginx, firewall, PM2 process persistence) onto a fresh Ubuntu 22.04/24.04
# server, and creates the first admin login.
#
# USAGE:
#   git clone <your-repo-url> secknight-vision
#   cd secknight-vision
#   sudo bash deploy.sh
#
# Re-running this script is safe — every step is written to skip work that's
# already done (packages already installed, database already created, etc).
#
# This script must be run as root (via sudo) on the server you want to
# deploy to. It does NOT run on your Mac — copy it to the Ubuntu server
# first (it's already part of this repo, so `git clone` is enough).

set -euo pipefail

# ---------------------------------------------------------------------------
# 0. Pretty output helpers
# ---------------------------------------------------------------------------
c_reset='\033[0m'; c_blue='\033[1;34m'; c_green='\033[1;32m'; c_yellow='\033[1;33m'; c_red='\033[1;31m'
step()  { echo -e "\n${c_blue}==>${c_reset} $*"; }
ok()    { echo -e "${c_green}✓${c_reset} $*"; }
warn()  { echo -e "${c_yellow}!${c_reset} $*"; }
fail()  { echo -e "${c_red}✗ $*${c_reset}"; exit 1; }

trap 'fail "Something went wrong on line $LINENO. Scroll up to see the actual error, fix it, then re-run: sudo bash deploy.sh — it is safe to re-run."' ERR

[ "$(id -u)" -eq 0 ] || fail "Run this with sudo: sudo bash deploy.sh"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"
[ -d "Backend/admin" ] || fail "Run this from inside the cloned repo (Backend/admin not found here: $REPO_ROOT)"

# ---------------------------------------------------------------------------
# 1. Gather configuration
# ---------------------------------------------------------------------------
step "Configuration"

DEFAULT_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -z "${SERVER_IP:-}" ]; then
    read -rp "Server LAN IP that browsers will use to reach this machine [${DEFAULT_IP}]: " SERVER_IP
    SERVER_IP="${SERVER_IP:-$DEFAULT_IP}"
fi
[ -n "$SERVER_IP" ] || fail "Could not determine a server IP. Set SERVER_IP=x.x.x.x and re-run."

if [ -z "${ADMIN_EMAIL:-}" ]; then
    read -rp "Email address for the first admin login: " ADMIN_EMAIL
fi
[ -n "$ADMIN_EMAIL" ] || fail "Admin email is required."

if [ -z "${ADMIN_PASSWORD:-}" ]; then
    read -rsp "Password for the first admin login (min 6 characters): " ADMIN_PASSWORD; echo
fi
[ ${#ADMIN_PASSWORD} -ge 6 ] || fail "Admin password must be at least 6 characters."

ok "Deploying for http://${SERVER_IP}/  —  admin login: ${ADMIN_EMAIL}"

# ---------------------------------------------------------------------------
# 2. Generate secrets (only once — reused on re-runs via .deploy-secrets file)
# ---------------------------------------------------------------------------
step "Preparing secrets"

SECRETS_FILE="$REPO_ROOT/.deploy-secrets"
gen_password() { # MySQL validate_password-safe: upper+lower+digit+special, no quotes/backslash/$
    echo "Kx9#$(openssl rand -hex 12)Aa"
}
gen_key32() { openssl rand -hex 16; }   # exactly 32 ASCII chars -> 32 bytes, required for AES-256 key
gen_hex()   { openssl rand -hex 32; }

if [ -f "$SECRETS_FILE" ]; then
    ok "Reusing secrets generated on a previous run ($SECRETS_FILE)"
    # shellcheck disable=SC1090
    source "$SECRETS_FILE"
else
    MYSQL_APP_PASSWORD="$(gen_password)"
    CRYPTO_PASSWORD="$(gen_key32)"
    JWT_ACCESS_SECRET="$(gen_hex)"
    JWT_REFRESH_SECRET="$(gen_hex)"
    SESSION_SECRET="$(gen_hex)"
    cat > "$SECRETS_FILE" <<EOF
MYSQL_APP_PASSWORD='${MYSQL_APP_PASSWORD}'
CRYPTO_PASSWORD='${CRYPTO_PASSWORD}'
JWT_ACCESS_SECRET='${JWT_ACCESS_SECRET}'
JWT_REFRESH_SECRET='${JWT_REFRESH_SECRET}'
SESSION_SECRET='${SESSION_SECRET}'
EOF
    chmod 600 "$SECRETS_FILE"
    ok "Generated new secrets, saved to $SECRETS_FILE (keep this file private)"
fi

MYSQL_APP_USER="secknight"
MYSQL_DB_NAME="secknight_vision"

# ---------------------------------------------------------------------------
# 3. System packages
# ---------------------------------------------------------------------------
step "Installing system packages (this can take a few minutes)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

if ! command -v node >/dev/null || [ "$(node -v | grep -oE '^v[0-9]+' | tr -d v)" -lt 20 ]; then
    step "Installing Node.js 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
    apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v)"

if ! command -v mysql >/dev/null; then
    step "Installing MySQL server"
    apt-get install -y -qq mysql-server
    systemctl enable --now mysql
fi
ok "MySQL installed"

if ! command -v mongod >/dev/null; then
    step "Installing MongoDB 7.0"
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
        > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update -qq
    apt-get install -y -qq mongodb-org
    systemctl enable --now mongod
fi
ok "MongoDB installed"

if ! command -v redis-server >/dev/null; then
    step "Installing Redis"
    apt-get install -y -qq redis-server
    systemctl enable --now redis-server
fi
ok "Redis installed"

if ! command -v nginx >/dev/null; then
    step "Installing nginx"
    apt-get install -y -qq nginx
fi
ok "nginx installed"

if ! command -v pm2 >/dev/null; then
    step "Installing PM2"
    npm install -g pm2 --silent
fi
ok "PM2 installed"

# ---------------------------------------------------------------------------
# 4. MySQL database + application user
# ---------------------------------------------------------------------------
step "Configuring MySQL database"

mysql <<SQL
CREATE DATABASE IF NOT EXISTS ${MYSQL_DB_NAME};
CREATE USER IF NOT EXISTS '${MYSQL_APP_USER}'@'localhost' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
ALTER USER '${MYSQL_APP_USER}'@'localhost' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
GRANT ALL PRIVILEGES ON ${MYSQL_DB_NAME}.* TO '${MYSQL_APP_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
ok "Database '${MYSQL_DB_NAME}' and user '${MYSQL_APP_USER}' ready"

# ---------------------------------------------------------------------------
# 5. Helper: write a KEY = value into an env file, replacing if present
# ---------------------------------------------------------------------------
set_env() {
    local file="$1" key="$2" value="$3"
    if grep -qE "^${key}[[:space:]]*=" "$file" 2>/dev/null; then
        sed -i "s|^${key}[[:space:]]*=.*|${key} = ${value}|" "$file"
    else
        echo "${key} = ${value}" >> "$file"
    fi
}

# ---------------------------------------------------------------------------
# 6. Full MySQL + MongoDB schema init (95+ tables, permissions, seed data)
# ---------------------------------------------------------------------------
step "Running database schema + seed migrations"

pushd Backend/migrations >/dev/null
npm install --silent
cp -n sample.env .env
set_env .env MYSQL_HOST localhost
set_env .env MYSQL_USERNAME "${MYSQL_APP_USER}"
set_env .env MYSQL_PASSWORD "${MYSQL_APP_PASSWORD}"
set_env .env MYSQL_DATABASE_NAME "${MYSQL_DB_NAME}"
set_env .env MONGO_URL "mongodb://localhost:27017/${MYSQL_DB_NAME}"
set_env .env FRESH_DB false
npm start
popd >/dev/null
ok "Schema + seed data ready (safe to re-run — CREATE TABLE IF NOT EXISTS)"

# ---------------------------------------------------------------------------
# 7. Backend services
# ---------------------------------------------------------------------------
WEBSOCKET_URL="http://localhost:8080/notification"

deploy_service() {
    local dir="$1" pm2name="$2" entry="$3"
    step "Deploying ${pm2name}"
    pushd "Backend/${dir}" >/dev/null
    npm install --silent
    pm2 delete "${pm2name}" >/dev/null 2>&1 || true
    pm2 start "${entry}" --name "${pm2name}"
    popd >/dev/null
    ok "${pm2name} started"
}

# --- store-logs-api (NestJS, needs a build step) ---
step "Deploying store-logs-api"
pushd Backend/store-logs-api >/dev/null
npm install --silent
cp -n .env.example .env
set_env .env NODE_ENV production
set_env .env PORT 3001
set_env .env MYSQL_HOST localhost
set_env .env MYSQL_USERNAME "${MYSQL_APP_USER}"
set_env .env MYSQL_PASSWORD "${MYSQL_APP_PASSWORD}"
set_env .env MYSQL_DATABASE "${MYSQL_DB_NAME}"
set_env .env MONGO_URI "mongodb://localhost:27017/${MYSQL_DB_NAME}"
set_env .env MONGO_DB_NAME "${MYSQL_DB_NAME}"
set_env .env TIMEZONE_SEQUELIZE "+00:00"
set_env .env TIMEZONE "UTC"
set_env .env REDIS_HOST localhost
set_env .env JWT_ACCESS_TOKEN_SECRET "${JWT_ACCESS_SECRET}"
set_env .env JWT_REFRESH_TOKEN_SECRET "${JWT_REFRESH_SECRET}"
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
set_env .env WEB_SOCKET_SERVER_URL "${WEBSOCKET_URL}"
npm run build
pm2 delete store-logs-api >/dev/null 2>&1 || true
pm2 start dist/main.js --name store-logs-api -i max
popd >/dev/null
ok "store-logs-api started (port 3001)"

# --- web-socket-server (no DB — pure notification relay) ---
pushd Backend/web-socket-server >/dev/null
npm install --silent
cp -n .env.example .env
set_env .env PORT 8080
set_env .env NOTIFICATION_PREFIX notification
set_env .env JWT_ACCESS_TOKEN_SECRET "${JWT_ACCESS_SECRET}"
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
popd >/dev/null
deploy_service web-socket-server web-socket-server server.js

# --- remote_socket (no DB, PM2 name collides with realtime by default — override) ---
pushd Backend/remote_socket >/dev/null
npm install --silent
cp -n sample.env .env
set_env .env PORT 3002
set_env .env NODE_ENV production
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
set_env .env JWT_ACCESS_TOKEN_SECRET "${JWT_ACCESS_SECRET}"
set_env .env JWT_REFRESH_TOKEN_SECRET "${JWT_REFRESH_SECRET}"
set_env .env REDIS_HOST localhost
popd >/dev/null
deploy_service remote_socket remote-socket server.js

# --- realtime (no DB, needs Redis pub/sub triplet) ---
pushd Backend/realtime >/dev/null
npm install --silent
cp -n sample.env .env
set_env .env PORT 3006
set_env .env NODE_ENV production
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
set_env .env JWT_ACCESS_TOKEN_SECRET "${JWT_ACCESS_SECRET}"
set_env .env JWT_REFRESH_TOKEN_SECRET "${JWT_REFRESH_SECRET}"
set_env .env REDIS_HOST localhost
set_env .env REDIS_HOST_SUBSCRIBER localhost
set_env .env REDIS_HOST_PUBLISHER localhost
popd >/dev/null
deploy_service realtime realtime server.js

# --- admin (the main API — includes the on-prem login bootstrap) ---
pushd Backend/admin >/dev/null
npm install --silent
cp -n .env.example .env
set_env .env NODE_ENV production
set_env .env PORT 3000
set_env .env IS_HTTP_HTTPS http
set_env .env MYSQL_HOST localhost
set_env .env MYSQL_USERNAME "${MYSQL_APP_USER}"
set_env .env MYSQL_PASSWORD "${MYSQL_APP_PASSWORD}"
set_env .env MYSQL_DBNAME "${MYSQL_DB_NAME}"
set_env .env MONGO_URI "mongodb://localhost:27017/${MYSQL_DB_NAME}"
set_env .env SESSION_SECRET "${SESSION_SECRET}"
set_env .env JWT_ACCESS_TOKEN_SECRET "${JWT_ACCESS_SECRET}"
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
set_env .env REDIS_HOST localhost
set_env .env WEB_SOCKET_SERVER_URL "${WEBSOCKET_URL}"
set_env .env ALERT_SERVICE_URL "http://localhost:3000"
set_env .env WEB_LOCAL "http://${SERVER_IP}/"
set_env .env WEB_DEV "http://${SERVER_IP}/"
set_env .env WEB_PRODUCTION "http://${SERVER_IP}/"
# On-prem single-admin login bootstrap (bypasses the EmpCloud SaaS licensing
# flow this route was originally built for — see Backend/admin/src/routes/v1/auth.js)
set_env .env AUTH_METHOD_V3 true
set_env .env ADMIN_PASSWORD "${ADMIN_PASSWORD}"
set_env .env ADMIN_DETAILS "{\"email\":\"${ADMIN_EMAIL}\"}"
popd >/dev/null
deploy_service admin admin adminApi.js

# --- productivity_report ---
pushd Backend/productivity_report >/dev/null
npm install --silent
cp -n .env.example .env
set_env .env NODE_ENV production
set_env .env PORT 3005
set_env .env API_URL_LOCAL "http://localhost:3000"
set_env .env API_URL_DEV "http://localhost:3000"
set_env .env API_URL_PRODUCTION "http://localhost:3000"
set_env .env MYSQL_HOST localhost
set_env .env MYSQL_USERNAME "${MYSQL_APP_USER}"
set_env .env MYSQL_PASSWORD "${MYSQL_APP_PASSWORD}"
set_env .env MYSQL_DBNAME "${MYSQL_DB_NAME}"
set_env .env MONGO_URI "mongodb://localhost:27017/${MYSQL_DB_NAME}"
set_env .env SESSION_SECRET "${SESSION_SECRET}"
set_env .env JWT_ACCESS_TOKEN_SECRET "${JWT_ACCESS_SECRET}"
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
set_env .env REDIS_HOST localhost
set_env .env ALERT_SERVICE_URL "http://localhost:3000/api/v3/jobs"
set_env .env WEB_SOCKET_SERVER_URL "${WEBSOCKET_URL}"
popd >/dev/null
deploy_service productivity_report productivity_report productivity_report_api.js

# --- cronjobs (background worker, no inbound HTTP needed) ---
pushd Backend/cronjobs >/dev/null
npm install --silent
cp -n sample.env .env
set_env .env NODE_ENV production
set_env .env PORT 3003
set_env .env API_URL_LOCAL "http://localhost:3000"
set_env .env API_URL_DEV "http://localhost:3000"
set_env .env API_URL_PRODUCTION "http://localhost:3000"
set_env .env MYSQL_HOST localhost
set_env .env MYSQL_USERNAME "${MYSQL_APP_USER}"
set_env .env MYSQL_PASSWORD "${MYSQL_APP_PASSWORD}"
set_env .env MYSQL_DBNAME "${MYSQL_DB_NAME}"
set_env .env MONGO_URI "mongodb://localhost:27017/${MYSQL_DB_NAME}"
set_env .env CRYPTO_PASSWORD "${CRYPTO_PASSWORD}"
set_env .env REDIS_HOST localhost
# Not in sample.env at all — required or the cron scheduler throws at startup
set_env .env REPORT_CRON "0 * * * *"
popd >/dev/null
deploy_service cronjobs cronjobs cronService.js

# ---------------------------------------------------------------------------
# 8. Frontend build + nginx
# ---------------------------------------------------------------------------
step "Building frontend"
pushd Frontend >/dev/null
npm install --silent
cat > .env <<EOF
VITE_API_URL=http://${SERVER_IP}:3000/api/v3
VITE_SOCKET_URL=ws://${SERVER_IP}:3006
VITE_BACKEND_V4_URL=http://${SERVER_IP}:3000
VITE_CRYPTO_PASSWORD=${CRYPTO_PASSWORD}
VITE_PASSWORD_IV=$(openssl rand -hex 8)
VITE_SHOW_EMP_AI_ASSISTANT=false
EOF
npm run build
popd >/dev/null
ok "Frontend built"

step "Configuring nginx"
mkdir -p /var/www/secknight-vision
cp -r Frontend/dist/* /var/www/secknight-vision/
chown -R www-data:www-data /var/www/secknight-vision
chmod -R 755 /var/www/secknight-vision

cat > /etc/nginx/sites-available/secknight-vision <<EOF
server {
    listen 80;
    server_name ${SERVER_IP};

    root /var/www/secknight-vision;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
EOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/secknight-vision /etc/nginx/sites-enabled/
nginx -t
systemctl enable nginx >/dev/null
systemctl restart nginx
ok "nginx serving http://${SERVER_IP}/"

# ---------------------------------------------------------------------------
# 9. Firewall
# ---------------------------------------------------------------------------
step "Configuring firewall"
ufw allow OpenSSH >/dev/null
for port in 80 3000 3001 3002 3005 3006 8080; do
    ufw allow "${port}/tcp" >/dev/null
done
ufw --force enable >/dev/null
ok "Firewall active (SSH + 80 + 3000/3001/3002/3005/3006/8080 open, 3003 stays internal-only)"

# ---------------------------------------------------------------------------
# 10. PM2 persistence across reboots
# ---------------------------------------------------------------------------
step "Enabling PM2 auto-start on boot"
pm2 save >/dev/null
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || warn "pm2 startup needs a manual run — see 'pm2 startup' output above if this step looked off"
ok "PM2 process list will survive reboots"

# ---------------------------------------------------------------------------
# 11. Bootstrap the first admin account
# ---------------------------------------------------------------------------
step "Creating the first admin account"
sleep 3
BOOTSTRAP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://127.0.0.1:3000/api/v3/auth/admin" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")
BOOTSTRAP_STATUS=$(echo "$BOOTSTRAP_RESPONSE" | tail -n1)
if [ "$BOOTSTRAP_STATUS" = "200" ]; then
    ok "Admin account created for ${ADMIN_EMAIL}"
else
    warn "Admin bootstrap returned HTTP ${BOOTSTRAP_STATUS} — this can happen if the account already exists from a previous run, which is fine. Full response:"
    echo "$BOOTSTRAP_RESPONSE" | head -n1
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo
echo -e "${c_green}========================================================${c_reset}"
echo -e "${c_green} SecKnight Vision is deployed${c_reset}"
echo -e "${c_green}========================================================${c_reset}"
echo "  URL:            http://${SERVER_IP}/"
echo "  Admin login:    http://${SERVER_IP}/admin-login"
echo "  Admin email:    ${ADMIN_EMAIL}"
echo "  Admin password: (whatever you entered above)"
echo
echo "  Generated secrets (MySQL password, JWT/crypto keys) are saved at:"
echo "    ${SECRETS_FILE}"
echo "  Keep this file private — copy it somewhere safe and consider deleting"
echo "  it from the server once you've backed it up."
echo
echo "  Check service health any time with: pm2 list"
echo -e "${c_green}========================================================${c_reset}"
