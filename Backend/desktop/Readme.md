# Desktop Microservice

The Desktop microservice is the agent-facing backend API for the SecKnight Vision platform. It handles communication with desktop monitoring agents — receiving tracking data (activities, keystrokes, screenshots, system logs, emails), managing agent registration, enforcing organizational policies, and serving configuration to agents.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Databases:** MySQL (user/org data), MongoDB (activity/tracking data), Redis (caching & rate limiting)
- **Message Queue:** RabbitMQ (amqplib)
- **Authentication:** JWT with AES-256-CBC encryption, MAC address registration
- **Cloud Storage:** AWS S3, Google Drive, OneDrive, Zoho WorkDrive, FTP
- **Logging:** Winston with daily rotate file
- **Monitoring:** NewRelic (production)

## Desktop vs Admin Service

| Aspect | Desktop Service | Admin Service |
|---|---|---|
| **Users** | Desktop monitoring agents | Admin/Manager dashboard |
| **Data Flow** | Agents send data TO server | Dashboard fetches data FROM server |
| **Auth** | MAC-based agent registration | Username/email login |
| **Endpoints** | Activity submission, config download | Reports, user management, analytics |
| **Rate Limiting** | High-frequency per-agent | Standard per-admin |

## Project Structure

```
desktop/
├── desktopApi.js                   # Entry point
├── package.json
├── public/                         # Static files, logs, attachments
├── src/
│   ├── App.js                      # Express app setup, middleware, route registration
│   ├── database/
│   │   ├── MySqlConnection.js      # MySQL connection pool (singleton)
│   │   └── MongoConnection.js      # MongoDB connection
│   ├── routes/v3/                  # API route modules
│   │   ├── open/                   # Public endpoints (health, app-info)
│   │   ├── auth/                   # Agent registration & authentication
│   │   │   └── services/           # JWT, Redis, Password, Rate limiting
│   │   ├── user/                   # User config, system info, alerts, storage
│   │   ├── project/                # Project & task management
│   │   ├── firewall/               # Domain blocking rules
│   │   ├── report/                 # Email activity logging
│   │   │   └── services/cloudservice/  # Cloud storage integrations
│   │   ├── break-request/          # Break & offline time requests
│   │   ├── announcements/          # Employee announcements
│   │   ├── timesheet/              # Timesheet data
│   │   ├── RDPRequestModule/       # RDP connection management
│   │   ├── uninstall-agent/        # Agent uninstall verification
│   │   └── clock-in/               # Clock-in/out recording
│   ├── models/                     # MongoDB schemas
│   ├── middleware/                  # Auth, error handling, user middleware
│   ├── event/                      # Event emitters & handlers
│   └── utils/                      # Redis, RabbitMQ, helpers
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL
- MongoDB
- Redis

### Installation

```bash
cd desktop
npm install
```

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your database credentials, secrets, and configuration values.

### Running

```bash
# Development (with nodemon)
npm run start:dev

# Production (with PM2)
npm start
```

The service starts on the port defined in `.env` (default: `3002`).

## API Overview

**Base URL:** `/api/v3`

### Open Routes (No Auth Required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/server-time` | Current server time |
| `GET` | `/app-info` | Application information |
| `POST` | `/log` | Client-side logging |
| `POST` | `/get-employee-detail` | Plan expiry details |
| `POST` | `/get-organization-detail` | Organization plan details |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register agent via MAC address |
| `POST` | `/auth/authenticate` | Agent login |
| `POST` | `/auth/authenticate-extension` | Browser extension login |
| `POST` | `/auth/check-key` | Verify shortened keys |

### User & Agent (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/me` | Get current user info |
| `GET` | `/user/config` | Get agent configuration & tracking settings |
| `POST` | `/user/system-info` | Report system information |
| `GET` | `/user/get-storage-details` | Get cloud storage credentials |
| `POST` | `/user/save-system-log` | Save system logs |
| `POST` | `/user/save-email-monitoring-log` | Save email logs with attachments |
| `POST` | `/user/raised-alert` | Raise alert to admin |
| `GET` | `/user/log-out` | Logout & clear session |

### Project & Task Management (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/get-projects` | List all projects |
| `GET` | `/project/get-tasks/:project_id` | Get tasks for a project |
| `POST` | `/project/add-task-stats` | Record task statistics |
| `PUT` | `/project/update-task` | Update task details |
| `GET` | `/project/start-project-task` | Start task tracking |
| `GET` | `/project/stop-project-task` | Stop task tracking |
| `GET` | `/project/finish-project-task` | Mark task as finished |

### Break & Offline Requests (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/request/create-request` | Create offline time request |
| `POST` | `/request/create-idle-request` | Create idle time request |
| `GET` | `/request/get-offline-time` | Get offline time records |
| `GET` | `/request/reasons` | Get break reason categories |

### Other (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/firewall/blocked-domains` | Get blocked domains list |
| `POST` | `/report/email-activity` | Log email activity |
| `PUT` | `/announcement/update-announcement` | Mark announcement as read |
| `GET` | `/time-sheet/` | Get timesheet data |
| `POST` | `/rdp-request/rdp-connection-open` | Open RDP connection |
| `POST` | `/agent/check-uninstall-password` | Verify agent uninstall code |

## Authentication

### Registration Flow
1. Desktop agent registers via MAC address (`/auth/register`)
2. Validates email against organization records
3. Creates user & employee record in MySQL
4. Supports Active Directory / LDAP integration

### Login Flow
1. Agent authenticates with email & password
2. Organization settings, rules, features, and plan loaded
3. Encrypted JWT token generated (AES-256-CBC + HS256)
4. User metadata cached in Redis

### Token Validation
1. Bearer token extracted from Authorization header
2. Token decrypted and JWT signature verified
3. Redis blacklist check for invalidated tokens
4. Rate limiting applied (20 req/min default, configurable per org)
5. User metadata loaded from Redis

### Plan Expiry Handling
- Special `PLAN_EXPIRY_TOKEN` allows limited access when plan expires
- Only `/user/config` endpoint remains accessible
- Returns hardcoded config with expiry information

## Middleware

| Middleware | Description |
|---|---|
| **Auth** | JWT verification with Redis blacklist & user-agent check |
| **Rate Limiter** | 20 req/min (auth), 4 req/min (system-info) |
| **Timeout Handler** | 60-second request timeout |
| **Error Handler** | Standardized error responses (ValidationError, TokenExpiredError) |
| **Helmet** | Security headers |
| **Compression** | Response compression |
| **Morgan** | HTTP request logging |

## Event System

The service uses an event emitter for asynchronous data processing:

| Event | Description |
|---|---|
| `update_app_domain` | App/domain categorization update |
| `update_keystroke` | Keystroke data processing |
| `update_employee_attendance` | Attendance record update |
| `employee_activity` | Activity data processing |
| `register` | Auto-assign employee on registration |
| `location_update_on_assign` | Location change handling |
| `departemnt_update_on_assign` | Department change handling |

## Database Models (MongoDB)

| Schema | Description |
|---|---|
| `employee_activities` | App/website activity duration |
| `employee_keystrokes` | Keystroke data |
| `employee_productivity_reports` | Daily productivity metrics |
| `employee_system_logs` | System activity logs |
| `employee_email_monitoring` | Email activity tracking |
| `break_request` | Break/offline time requests |
| `organization_blocked_domains` | Website block list |
| `organization_apps_web` | App/domain categorization |
| `announcements` | Broadcast announcements |

## Agent Configuration

The `/user/config` endpoint returns tracking settings to the desktop agent:

- Application tracking (on/off)
- Keystroke monitoring
- Website monitoring & blocking rules
- Screenshot capture frequency (120–3600 per hour)
- Screen recording settings
- Tracking schedule (unlimited, fixed, domain/network/project/geolocation-based)
- Idle time detection settings
- Break & offline time policies

## Cloud Storage Integrations

- **AWS S3** - Screenshot & log storage
- **Google Drive** - Via Google APIs
- **Microsoft OneDrive** - Via OneDrive API
- **Zoho WorkDrive** - Via Zoho pools
- **FTP** - Direct FTP server upload

## Environment Variables

Refer to `.env.example` for the full list including:

- Database connections (MySQL, MongoDB, Redis)
- JWT secrets and token lifetime
- Crypto password (AES-256-CBC)
- RabbitMQ URL
- Rate limiting settings
- Swagger auth credentials

## Scripts

| Script | Command | Description |
|---|---|---|
| `start:dev` | `nodemon desktopApi.js` | Development server with auto-reload |
| `start` | `pm2 start desktopApi.js` | Production server with PM2 |
| `test` | `mocha src/test/**/*.js` | Run test suite |
