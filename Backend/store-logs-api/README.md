# Store Logs API

NestJS-based backend service for SecKnight Vision data and reporting workflows.  
This service integrates with both MongoDB and MySQL, exposes versioned REST APIs, and provides Swagger documentation.

## Prerequisites

- Node.js `20+` (recommended)
- npm `10+` (recommended)
- MongoDB instance
- MySQL instance
- PM2 (optional, for production runtime)

## Project Structure

- `src/` - application source code
- `src/main.ts` - bootstrap, middleware, CORS, Swagger, API prefix
- `mongo-migrations/` - Mongo migration files and config
- `mysql-migrations/` - Sequelize/MySQL migrations
- `.env.example` - environment template
- `sample.env` - sample local-style values

## Setup

From repository root:

```bash
cd Backend/store-logs-api
npm install
```

Create environment file:

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with valid MongoDB, MySQL, JWT, Redis, and service URLs before starting.

## Environment Variables

Use `.env.example` as the source of truth. Commonly used keys include:

- `PORT`, `NODE_ENV`, `IS_DEBUGGING`, `ENABLE_VALIDATION`
- `MONGO_URI`, `MONGO_DB_NAME`, `MONGO_ACTIVITY_DURATION_PER_CALL_IN_SECONDS`
- `MYSQL_HOST`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `DROP_TABLE`, `TIMEZONE_SEQUELIZE`
- `TIMEZONE`
- `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`, `JWT_EXPIRY`, `CRYPTO_PASSWORD`
- `REDIS_HOST`, `REDIS_PASSWORD`
- `ATTENDANCE_URL`, `ACTIVITY_PRODUCTIVITY_URL`, `CRONS_JOBS_URL`, `WEB_SOCKET_SERVER_URL`
- request limiter and org-specific configuration values

## Run

### Development

```bash
npm run start:dev
```

### Standard Start

```bash
npm run start
```

### Production (PM2, after build)

```bash
npm run build
npm run start:prod
```

## API and Swagger

- Global API prefix: `/api`
- Swagger UI: `/api/v1/explorer`

Examples:

- API base: `http://localhost:<PORT>/api`
- Swagger: `http://localhost:<PORT>/api/v1/explorer`

## Database Migrations

### Mongo

```bash
npm run migrate-mongo:up
npm run migrate-mongo:down
```

### MySQL (Sequelize)

```bash
npm run migrate-mysql:up
npm run migrate-mysql:down
```

## Quality and Tests

```bash
npm run lint
npm run test
npm run test:e2e
npm run test:cov
```

## Notes

- `start:prod` runs `pm2 start dist/main.js -i max` for clustered execution.
- `prestart:prod` runs `npm i` as defined in `package.json`.
- Do not commit real secrets in `.env`.
