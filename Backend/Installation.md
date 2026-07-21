# Backend Installation Guide

This guide explains how to set up and run SecKnight Vision backend microservices on a local machine.

## 1) Prerequisites

Install and verify:

- Node.js `20+`
- npm `10+`
- Redis
- MongoDB
- MySQL or MariaDB
- PM2 (recommended for production)

Verification commands:

```bash
node -v
npm -v
redis-server --version
mongod --version
mysql --version
pm2 -v
```

## 2) Clone and Enter Project

```bash
git clone <your-fork-or-repository-url>
cd EmpOpenSource/Backend
```

## 3) Install Dependencies Per Service

Install dependencies inside each backend service directory:

```bash
cd store-logs-api && npm install
cd ../web-socket-server && npm install
cd ../remote_socket && npm install
cd ../realtime && npm install
```

For PowerShell users, run the same commands one by one.

## 4) Configure Environment Files

Create `.env` files from templates in each service:

- `store-logs-api`: copy `.env.example` to `.env`
- `web-socket-server`: copy `.env.example` to `.env`
- `remote_socket`: copy `sample.env` to `.env`
- `realtime`: copy `sample.env` to `.env`

PowerShell examples:

```powershell
Copy-Item store-logs-api\.env.example store-logs-api\.env
Copy-Item web-socket-server\.env.example web-socket-server\.env
Copy-Item remote_socket\sample.env remote_socket\.env
Copy-Item realtime\sample.env realtime\.env
```

Update credentials and service URLs in each `.env`:

- MongoDB connection settings
- MySQL connection settings
- Redis host/password
- JWT and crypto secrets
- inter-service URLs

## 5) Database Setup

### MySQL or MariaDB

Create required database(s), then update corresponding values in `.env`:

```sql
CREATE DATABASE empmonitor;
```

### MongoDB

Ensure the target Mongo database in `.env` exists/accessible.  
Example shell flow:

```bash
mongosh
use empmonitor
```

### Redis

Start Redis and verify:

```bash
redis-cli ping
```

Expected: `PONG`

## 6) Run Migrations (Store Logs API)

From `Backend/store-logs-api`:

```bash
npm run migrate-mongo:up
npm run migrate-mysql:up
```

Rollback commands:

```bash
npm run migrate-mongo:down
npm run migrate-mysql:down
```

## 7) Start Services

You can run services in development mode or production mode.

### Development (recommended first run)

Open separate terminals:

```bash
cd Backend/store-logs-api && npm run start:dev
cd Backend/web-socket-server && npm run start:dev
cd Backend/remote_socket && npm run start:dev
cd Backend/realtime && npm run start:dev
```

### Production (PM2)

```bash
cd Backend/store-logs-api && npm run build && npm run start:prod
cd Backend/web-socket-server && npm start
cd Backend/remote_socket && npm run start
cd Backend/realtime && npm run start
```

## 8) Quick Verification

- Store Logs API Swagger: `http://localhost:<PORT>/api/v1/explorer`
- Web Socket Server health: `http://localhost:<PORT>/api/custom/on-premise-socket`
- Remote Socket health: `http://localhost:<PORT>/`
- Realtime health: `http://localhost:<PORT>/rt`

Use ports from each service `.env` file.

## 9) Common Issues

- **Port already in use**: change `PORT` in the related `.env`.
- **Database connection failed**: recheck host, username, password, and database name.
- **Redis errors**: verify Redis is running and credentials are correct.
- **JWT/auth failures**: ensure secrets match across services that communicate.

## Notes

- This backend is Node.js/NestJS microservices based; Laravel/PHP commands are not required.
- Keep secrets in `.env` files only and never commit real credentials.

