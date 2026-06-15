# Hostinger VPS Deployment Runbook

This runbook deploys Jyotish Stack AI on a 16 GB Hostinger VPS with:

- Ubuntu 24.04 LTS
- Node.js 24 LTS
- MySQL listening on localhost only
- phpMyAdmin listening on localhost only, reached through a PuTTY SSH tunnel
- Apache reverse proxy for `https://jyotishstack.com`
- PM2 process management

This production setup serves the full `ui-main` app on `jyotishstack.com`. The `ui-ai-com` package is currently a lighter AI-branded landing surface and should not replace the full app until it has feature parity.

Do not expose MySQL port `3306`, phpMyAdmin, or Node ports `3000` and `5000` to the public internet.

## 1. Hostinger panel setup

1. In Hostinger VPS firewall or your manual firewall rules, allow only TCP `22`, `80`, and `443`.
   Do not use UFW for this deployment if you are managing permissions manually.
2. In Hostinger DNS for `jyotishstack.com`, set:
   - `A` record `@` to the VPS public IP.
   - Preferred: `A` record `www` to the VPS public IP.
   - If Hostinger will not accept `www` as an A record, find the existing `www` record. If it is a CNAME, either delete it and add the A record above, or set/edit it as `CNAME` `www` to `jyotishstack.com`.
3. Remove old/conflicting `A`, `AAAA`, or `CNAME` records for `@` and `www` that point to website builder, parking, CDN, or old hosting.
4. Wait for DNS propagation before running Certbot. It can take several hours and sometimes up to 24 hours.

## 2. First PuTTY login

Connect with PuTTY:

- Host Name: your VPS public IP
- Port: `22`
- Connection type: SSH

Login as `root` for the first setup only.

## 3. Base hardening

```bash
apt update && apt upgrade -y
apt install -y fail2ban curl wget git unzip ca-certificates gnupg lsb-release openssl

adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
if [ -f /root/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
else
  nano /home/deploy/.ssh/authorized_keys
fi
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

```

Open a second PuTTY session and confirm the `deploy` user can log in before disabling root login.

Firewall permissions are managed manually for this server. Keep inbound public access limited to SSH, HTTP, and HTTPS:

- TCP `22` for SSH/PuTTY
- TCP `80` for HTTP/Certbot
- TCP `443` for HTTPS

Do not open MySQL `3306`, Next.js `3000`, Express `5000`, or phpMyAdmin `8081` publicly.

## 4. Install Node.js 24 LTS and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
apt install -y nodejs
node -v
npm -v
npm install -g pm2
```

## 5. Install and lock down MySQL

```bash
apt install -y mysql-server
systemctl enable --now mysql
mysql_secure_installation
```

Confirm MySQL binds to localhost:

```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Set:

```ini
bind-address = 127.0.0.1
```

Restart and create the app database:

```bash
systemctl restart mysql
mysql -u root -p
```

```sql
CREATE DATABASE jyotish_stack_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jyotish_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON jyotish_stack_ai_db.* TO 'jyotish_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Install Apache, PHP, phpMyAdmin, and Certbot

```bash
apt install -y apache2 php libapache2-mod-php php-mysql php-mbstring php-zip php-gd php-json php-curl php-bcmath php-xml phpmyadmin certbot python3-certbot-apache
phpenmod mbstring
a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
a2disconf phpmyadmin || true
systemctl enable --now apache2
```

If the phpMyAdmin installer asks which web server to configure, leave Apache unchecked. We enable phpMyAdmin only through the localhost-only vhost in this repo.

## 7. Pull the app from GitHub

```bash
mkdir -p /var/www
chown deploy:deploy /var/www
su - deploy
cd /var/www
git clone https://github.com/bitsaspidy/jyotish_stack.git jyotish-stack
cd /var/www/jyotish-stack
git checkout main
```

If GitHub asks for credentials, use a GitHub deploy key or a fine-scoped token. Do not paste a token into shared notes or commit it to the repo.

## 8. Create production environment

```bash
cd /var/www/jyotish-stack
cp .env.production.example server/.env
openssl rand -hex 64
openssl rand -hex 64
nano server/.env
```

Fill:

- `APP_URL=https://jyotishstack.com`
- `ALLOWED_ORIGINS=https://jyotishstack.com,https://www.jyotishstack.com`
- `JWT_SECRET` and `JWT_REFRESH_SECRET` from the two `openssl` outputs
- `DB_USER=jyotish_app`
- `DB_PASSWORD` with the MySQL password from step 5
- SMTP, Razorpay, and Anthropic credentials when ready

## 9. Enable Apache sites

```bash
sudo cp apache/jyotish.conf /etc/apache2/sites-available/jyotishstack.conf
sudo cp apache/phpmyadmin-local.conf /etc/apache2/sites-available/phpmyadmin-local.conf
sudo a2ensite jyotishstack
sudo a2ensite phpmyadmin-local
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Check phpMyAdmin is local-only:

```bash
sudo ss -ltnp | grep 8081
```

Expected bind address: `127.0.0.1:8081`.

## 10. Build, migrate, seed, and start

```bash
cd /var/www/jyotish-stack
npm ci
cd /var/www/jyotish-stack/server
NODE_ENV=production npm run migrate
NODE_ENV=production npm run seed
cd /var/www/jyotish-stack
NODE_ENV=production npm run build:main
pm2 startOrReload ecosystem.config.js --env production --update-env
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
```

`pm2 startup` prints one command that must be run with `sudo`; run that command exactly once.

For later releases, use:

```bash
cd /var/www/jyotish-stack
bash deploy.sh
```

Do not run the seed command on every deploy unless you intentionally want to refresh seed data.

## 11. Issue HTTPS certificate

Run this only after DNS points to the VPS:

```bash
sudo certbot --apache -d jyotishstack.com -d www.jyotishstack.com --redirect
sudo systemctl reload apache2
```

## 12. Access phpMyAdmin through PuTTY only

In PuTTY:

1. Open Connection > SSH > Tunnels.
2. Source port: `8080`.
3. Destination: `127.0.0.1:8081`.
4. Click Add, then Open the SSH session.

On your local computer open:

```text
http://127.0.0.1:8080/phpmyadmin
```

Login with the MySQL user `jyotish_app`. The phpMyAdmin Apache site is bound to `127.0.0.1`, so it is not public.

## 13. Verify production

```bash
pm2 status
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:5000/health
curl -I https://jyotishstack.com
curl https://jyotishstack.com/api/settings/public
sudo ss -ltnp
```

Public listeners should be only SSH, HTTP, and HTTPS. MySQL, phpMyAdmin, API, and Next.js should be local-only. Confirm your manual firewall rules also expose only TCP `22`, `80`, and `443`.

## 14. After the deploy user is verified

Only after key-based `deploy` login works in a second PuTTY session:

```bash
sudo nano /etc/ssh/sshd_config.d/99-hardening.conf
```

Add:

```text
PermitRootLogin no
PasswordAuthentication no
```

Validate and reload:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

## 15. Scaling on the 16 GB VPS

Start with one API and one UI process. For higher traffic, increase PM2 workers:

```bash
API_INSTANCES=2 UI_INSTANCES=2 pm2 startOrReload ecosystem.config.js --env production --update-env
pm2 save
```

For thousands of concurrent users, add monitoring first, then consider:

- Moving MySQL to managed/dedicated database hosting.
- Adding Redis for caching/rate-limit state.
- Adding a CDN in front of static assets.
- Splitting API and UI onto separate VPS instances behind a load balancer.

## 16. Backup minimum

Create a daily database backup directory:

```bash
sudo mkdir -p /var/backups/jyotish-stack
sudo chown deploy:deploy /var/backups/jyotish-stack
```

Manual backup test:

```bash
mysqldump -u jyotish_app -p jyotish_stack_ai_db | gzip > /var/backups/jyotish-stack/jyotish_stack_ai_db_$(date +%F).sql.gz
```

Also enable Hostinger VPS snapshots/backups before launch.
