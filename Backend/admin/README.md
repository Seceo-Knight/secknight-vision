# Admin Microservice

The Admin microservice is the core backend service of the SecKnight Vision platform. It handles employee monitoring, productivity analytics, reporting, alerting, cloud storage integration, and organization management.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Databases:** MySQL (relational data), MongoDB (activity/log data), Redis (caching & job queue)
- **Job Queue:** Node-Resque (Redis-backed)
- **Authentication:** JWT with Redis token blacklist
- **Email:** Nodemailer, SendGrid
- **Push Notifications:** Firebase (GCM), WebSocket
- **Cloud Storage:** AWS S3, Google Drive, Dropbox, WebDAV, SFTP, OneDrive
- **Logging:** Winston with daily rotate file

## Project Structure

```
admin/
├── adminApi.js                  # Entry point
├── package.json
├── src/
│   ├── App.js                   # Express app setup, middleware, route registration
│   ├── database/
│   │   ├── MySqlConnection.js   # MySQL connection pool (singleton)
│   │   └── MongoConnection.js   # MongoDB connection with auto-reconnect
│   ├── routes/v3/               # API route modules (~30+ feature modules)
│   │   ├── auth/                # Authentication & authorization
│   │   ├── employee/            # Employee data & tracking
│   │   ├── timesheet/           # Timesheet & attendance
│   │   ├── dashboard/           # KPI dashboards & metrics
│   │   ├── report/              # Report generation & export
│   │   ├── firewall/            # Domain blocking & whitelisting
│   │   ├── settings/            # Organization & employee settings
│   │   ├── organization/        # Organization management
│   │   ├── alerts-and-notifications/  # Alert rules & delivery
│   │   ├── storage/             # Cloud storage configuration
│   │   ├── ai/                  # URL classification & risk scoring
│   │   ├── screenshots/         # Screenshot retrieval
│   │   ├── location/            # Geolocation tracking
│   │   └── ...                  # Additional modules
│   ├── models/                  # MongoDB schemas & MySQL BaseModel
│   ├── jobs/                    # Background jobs & cron tasks
│   │   ├── alertsAndNotifications/  # Alert rule handlers
│   │   ├── backgroundEmail/     # Queued email delivery
│   │   └── reports/             # Scheduled report jobs
│   ├── middleware/              # Error handling middleware
│   ├── messages/                # Firebase, Email, WebSocket services
│   ├── logger/                  # Winston logger configuration
│   ├── event/                   # Event emitters & handlers
│   └── utils/                   # Utility helpers
└── public/                      # Static assets & temp files
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL
- MongoDB
- Redis

### Installation

```bash
cd admin
npm install
```

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your database credentials, API keys, and other configuration values.

### Running

```bash
# Development (with nodemon)
npm run start:dev

# Production (with PM2)
npm start
```

The service starts on the port defined in `.env` (default: `3000`).

## API Overview

**Base URL:** `/api/v3`

**Swagger Explorer:** `/api/v3/explorer`

### Authentication & Access

| Endpoint | Description |
|---|---|
| `POST /auth/admin` | Admin login |
| `POST /auth/user` | User login |
| `GET /auth/logout` | Logout (invalidates token) |
| `POST /auth/validate-otp-2fa` | Two-factor authentication |

### Employee Monitoring

| Endpoint | Description |
|---|---|
| `/employee/browser-history` | Browser history tracking |
| `/employee/applications` | Application usage |
| `/employee/keystrokes` | Keystroke logs |
| `/employee/attendance` | Attendance records |
| `/employee/geolocation` | Desktop geolocation |
| `/screenshots` | Screenshot retrieval |
| `/system-logs` | System log collection |
| `/email-monitoring` | Email activity tracking |

### Productivity & Analytics

| Endpoint | Description |
|---|---|
| `/timesheet` | Timesheet data & productivity breakup |
| `/dashboard` | KPI dashboards & metrics |
| `/report` | Report generation (CSV, Excel, PDF) |
| `/ai` | URL classification & risk scoring |
| `/sentimental-analysis` | Communication sentiment analysis |

### Organization Management

| Endpoint | Description |
|---|---|
| `/organization` | Organization settings & features |
| `/settings` | Employee tracking & role/permission settings |
| `/department` | Department management |
| `/firewall` | Domain blocking & whitelisting |
| `/ip-whitelist` | IP address whitelisting |
| `/storage` | Cloud storage configuration |

### Alerts & Notifications

| Endpoint | Description |
|---|---|
| `/alerts-and-notifications` | Alert rules, conditions & recipients |

## Authentication

The service uses **JWT-based authentication**:

1. Client authenticates via `/auth/admin` or `/auth/user` and receives a JWT token
2. Token is sent in the `Authorization: Bearer <token>` header on subsequent requests
3. Tokens are validated against a Redis blacklist on each request
4. User metadata is cached in Redis for performance
5. Optional **Two-Factor Authentication (TOTP)** via `speakeasy` library

**Role-Based Access Control:** Routes can be restricted to admin-only users via middleware.

## Background Jobs

The service uses **Node-Resque** with Redis for background job processing:

| Job | Description |
|---|---|
| `activityCreatedJob` | Triggered on new employee activity |
| `sendAlertJob` | Sends alerts based on configured rules |
| `DWTLessJob` | Desk time violation detection |
| `offlineJob` | Offline employee detection |
| `SEEJob` | Suspicious email event detection |
| `sendMailReJob` | Background email delivery |
| `sendTestMailReportJob` | Scheduled report generation & email |

### Alert Rule Handlers

- **ABT** - Aggressive browsing tracking
- **ASA** - Abnormal system access
- **DWT** - Desk time violation
- **IDL** - Idle time detection
- **OFFL** - Offline detection
- **SEE** - Suspicious email events
- **SSE** - Suspicious search engine activity
- **STA** - System-wide tracking alerts
- **WDO** - Website/domain oversight

## Database Models

### MySQL (via BaseModel)

Provides ORM-like functionality: `create`, `update`, `get`, `delete`, `findBy`, `findAllBy`, and raw `query` execution.

### MongoDB Schemas

Key collections include:
- `employee_activities` - Activity records with timestamps
- `employee_productivity` - Productivity metrics
- `employee_keystrokes` - Keystroke logs
- `employee_email_monitoring` - Email data
- `employee_system_logs` - System logs
- `mobile_geolocation` - Mobile GPS data
- `biometrics_access_logs` - Biometric data
- `file_transfer_logs` - File operation logs
- `geo_location_change_logs` - Location changes

## Cloud Storage Integrations

The service supports multiple cloud storage providers for screenshot and data storage:

- Amazon S3
- Google Drive
- Dropbox
- WebDAV
- SFTP
- OneDrive

## Environment Variables

Refer to `.env.example` for the full list of required environment variables including:

- Database connection strings (MySQL, MongoDB, Redis)
- JWT secrets and token expiry
- SendGrid / SMTP configuration
- Cloud storage credentials
- Firebase API key
- Jenkins build configuration
- Rate limiting settings

## Scripts

| Script | Command | Description |
|---|---|---|
| `start:dev` | `nodemon adminApi.js` | Development server with auto-reload |
| `start` | `pm2 start adminApi.js` | Production server with PM2 |
| `test` | `mocha --config=src/test/.mocharc.json` | Run test suite |
