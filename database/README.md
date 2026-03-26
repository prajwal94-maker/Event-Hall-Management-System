# 🏛️ EventHall — Venue Booking System

A full-stack event hall booking platform for managing venue reservations, cancellations, customer messages, and an admin dashboard.

---

## 📁 Project Structure

```
eventhall/
├── database/
│   └── schema.sql          ← MySQL schema, tables, seed data
├── backend/
│   ├── server.js           ← Express API server
│   ├── package.json
│   └── .env.example        ← Copy to .env and configure
└── frontend/
    ├── index.html          ← Main customer-facing site
    ├── css/style.css
    ├── js/
    │   ├── booking.js
    │   └── cancel_booking.js
    ├── admin/
    │   ├── index.html      ← Admin panel (login: admin@eventhall.in / Admin@1234)
    │   ├── admin.css
    │   └── admin.js
    └── images/stages/      ← Place stage design images here
```

---

## ⚙️ Prerequisites

| Tool        | Version     | Install |
|-------------|-------------|---------|
| Node.js     | >= 18.0.0   | https://nodejs.org |
| npm         | >= 8.0.0    | bundled with Node |
| MySQL       | >= 8.0      | https://dev.mysql.com/downloads/mysql/ |

---

## 🚀 Local Setup (Development)

### Step 1 — Clone / Download the project

```bash
cd /your/projects/folder
# Place the eventhall/ folder here
```

### Step 2 — Set up the database

```sql
-- In MySQL client / MySQL Workbench / phpMyAdmin:
CREATE DATABASE eventhall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Then import the schema:
mysql -u root -p eventhall < database/schema.sql
```

### Step 3 — Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=eventhall
DB_PORT=3306

ADMIN_EMAIL=admin@eventhall.in
ADMIN_PASSWORD=Admin@1234
```

### Step 4 — Install dependencies and run

```bash
cd backend
npm install
npm run dev          # development (auto-restarts on change)
# OR
npm start            # production
```

### Step 5 — Open in browser

- **Customer site:** http://localhost:3000
- **Admin panel:**   http://localhost:3000/admin/
  - Email: `admin@eventhall.in`
  - Password: `Admin@1234`

---

## 📦 npm Packages

### Production dependencies (`npm install`)

| Package     | Purpose |
|-------------|---------|
| `express`   | Web server and REST API |
| `mysql2`    | MySQL database driver (Promise-based) |
| `cors`      | Cross-Origin Resource Sharing headers |
| `dotenv`    | Loads environment variables from `.env` |
| `nodemailer`| Email sending (future use / OTP emails) |

### Dev dependencies (`npm install --save-dev`)

| Package     | Purpose |
|-------------|---------|
| `nodemon`   | Auto-restart server during development |

### Install command (from `/backend` directory)

```bash
npm install express mysql2 cors dotenv nodemailer
npm install --save-dev nodemon
```

---

## 🌐 Hosting on a Linux VPS (Ubuntu 22.04)

### Option A — Manual VPS Setup

#### 1. Server provisioning
Get a VPS from DigitalOcean, Linode, Vultr, or AWS EC2 (Ubuntu 22.04 LTS recommended, minimum 1GB RAM).

#### 2. Install Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version    # should print v20.x.x
```

#### 3. Install MySQL

```bash
sudo apt update
sudo apt install -y mysql-server
sudo mysql_secure_installation   # follow prompts — set root password

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE eventhall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eventhall_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON eventhall.* TO 'eventhall_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u eventhall_user -p eventhall < /var/www/eventhall/database/schema.sql
```

#### 4. Upload project files

```bash
# Using scp from your local machine:
scp -r ./eventhall ubuntu@YOUR_SERVER_IP:/var/www/eventhall

# Or clone from git:
# git clone https://github.com/your-repo/eventhall.git /var/www/eventhall
```

#### 5. Install PM2 (process manager)

```bash
sudo npm install -g pm2

cd /var/www/eventhall/backend
npm install --omit=dev   # install only production packages

# Copy and configure .env
cp .env.example .env
nano .env               # fill in DB credentials and PORT=3000

# Start with PM2
pm2 start server.js --name eventhall
pm2 startup             # auto-start on reboot — follow the printed command
pm2 save
```

#### 6. Install and configure Nginx (reverse proxy)

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/eventhall
```

Paste this configuration (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/eventhall /etc/nginx/sites-enabled/
sudo nginx -t            # test config — should say "ok"
sudo systemctl reload nginx
```

#### 7. Enable HTTPS with Let's Encrypt (free SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow prompts — certbot will automatically configure HTTPS

# Auto-renewal is set up automatically; test it:
sudo certbot renew --dry-run
```

#### 8. Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

### Option B — Shared Hosting (cPanel / Plesk)

Shared hosting typically does **not** support Node.js. Use a VPS or cloud platform instead.

---

### Option C — Railway / Render (Easy Cloud Deployment)

#### Railway (recommended for beginners)

1. Create account at https://railway.app
2. New Project → Deploy from GitHub repo
3. Add a MySQL plugin from Railway's dashboard
4. Set environment variables (DATABASE_URL is provided automatically by Railway)
5. Set `PORT` to `$PORT` (Railway assigns it automatically)
6. Deploy — Railway handles everything else

#### Render

1. Create account at https://render.com
2. New → Web Service → Connect your GitHub repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add a separate Render MySQL database and link the credentials as environment variables

---

## 🔑 Default Admin Credentials

| Field    | Value                   |
|----------|-------------------------|
| Email    | `admin@eventhall.in`    |
| Password | `Admin@1234`            |

**⚠️ Change the password before going live!** Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, and update the matching constants at the top of `frontend/admin/admin.js`.

---

## 🗄️ Database Schema Overview

| Table             | Purpose |
|-------------------|---------|
| `users`           | Registered customers |
| `bookings`        | Hall booking records |
| `messages`        | Admin → customer messages |
| `contact_messages`| General contact form submissions |

Auto-migrations run on server startup — missing columns are added automatically.

---

## 🛠️ API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:userId` | Get user bookings |
| POST | `/api/check-availability` | Check hall availability |
| POST | `/api/cancel-booking` | Cancel booking |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:userId` | Get messages for user |
| PUT | `/api/messages/:id/read` | Mark message read |
| GET | `/api/messages/:userId/unread-count` | Unread count |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard KPIs |
| GET | `/api/admin/revenue-chart` | Monthly revenue data |
| GET | `/api/admin/hall-stats` | Hall booking counts |
| GET | `/api/admin/bookings` | All bookings (filters + pagination) |
| PUT | `/api/admin/bookings/:id/status` | Update booking status |
| DELETE | `/api/admin/bookings/:id` | Delete booking |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/messages` | All sent messages |
| POST | `/api/admin/send-message` | Send message to customer |
| GET | `/api/admin/recent-bookings` | Dashboard recent bookings |

---

## 📊 Cancellation Policy

| Days Before Event | Penalty |
|-------------------|---------|
| More than 30 days | 10% |
| 15–30 days        | 20% |
| 8–14 days         | 35% |
| 7 days or fewer   | 50% |
| Past event date   | 100% |

---

## 📸 Stage Design Images

Place stage design images in `frontend/images/stages/`:

| Filename           | Design |
|--------------------|--------|
| `floral.jpg`       | Grand Floral Arch |
| `royal.jpg`        | Royal Gold & Drapes |
| `modern.jpg`       | Modern Minimalist |
| `rustic.jpg`       | Rustic Wooden Charm |
| `fairy.jpg`        | Fairy Lights Canopy |
| `crystal.jpg`      | Crystal Chandelier |

Use images of at least 800×500px for best appearance.

---

## ❓ Troubleshooting

**"Cannot connect to database"**
→ Check `.env` credentials. Confirm MySQL is running: `sudo systemctl status mysql`

**"Port already in use"**
→ Change `PORT` in `.env`, or kill the process: `lsof -ti:3000 | xargs kill`

**Admin panel shows blank / 404**
→ Make sure `frontend/admin/` folder exists and server.js is serving the frontend static files correctly.

**PM2 not starting on reboot**
→ Run `pm2 startup` and execute the printed command, then `pm2 save`.

---

## 📞 Support

Built for EventHall, Udupi, Karnataka.
