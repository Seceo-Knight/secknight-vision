# Productivity Report Microservice

The Productivity Report microservice handles activity data ingestion, productivity calculation, reporting, and analytics for the SecKnight Vision platform. It receives raw activity data from desktop agents, aggregates productivity metrics, and provides comprehensive reporting, dashboard analytics, project management, and third-party integrations (Zoho, Trello, Jira).

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Databases:** MySQL (relational data), MongoDB (activity/tracking data), Redis (caching & job queue)
- **Job Queue:** Node-Resque
- **Authentication:** JWT (HS256/RS256) with AES-256 encryption
- **Email:** Nodemailer, SendGrid
- **Cloud Storage:** AWS S3, Dropbox, Google Drive
- **Logging:** Winston with daily rotate file
- **API Docs:** Swagger UI

## Project Structure

```
productivity_report/
├── productivity_report_api.js       # Entry point
├── package.json
├── src/
│   ├── App.js                       # Express app setup, middleware, Swagger
│   ├── database/
│   │   ├── MySqlConnection.js       # MySQL connection pool (singleton)
│   │   └── MongoConnection.js       # MongoDB connection with auto-reconnect
│   ├── routes/
│   │   ├── Routes.js                # Main route aggregator
│   │   ├── admin/                   # Admin auth & profile management
│   │   ├── employee/                # Employee self-service endpoints
│   │   ├── user/                    # User management (CRUD, bulk, assignments)
│   │   ├── dashboard/               # KPI dashboards & analytics
│   │   ├── reports/
│   │   │   └── productivity/        # Activity ingestion & productivity reports
│   │   ├── firewall/                # Domain blocking & IP whitelisting
│   │   ├── desktop/                 # Desktop control (shutdown, USB block, etc.)
│   │   ├── storages/                # Cloud storage management
│   │   ├── settings/                # Productivity rankings & tracking settings
│   │   ├── projectManagement/       # Projects, teams, tasks, timesheets
│   │   ├── integrations/
│   │   │   ├── zoho/                # Zoho project sync
│   │   │   ├── trello/              # Trello board/card import
│   │   │   └── jira/                # Jira OAuth integration
│   │   └── shared/                  # Reusable query helpers
│   ├── models/                      # MongoDB schemas (activities, productivity, keystrokes)
│   ├── modules/
│   │   └── alerts/                  # Event-driven alert system
│   ├── middleware/                   # Error handling middleware
│   ├── event/                       # Event emitters & handlers
│   ├── utils/                       # JWT, encryption, mail helpers
│   ├── rules/                       # Joi validation schemas
│   └── logger/                      # Winston logger config
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL
- MongoDB
- Redis

### Installation

```bash
cd productivity_report
npm install
```

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your database credentials, API keys, and configuration values.

### Running

```bash
# Development (with nodemon)
npm run start:dev

# Production (with PM2)
npm start
```

The service starts on the port defined in `.env` (default: `3005`).

## API Overview

**Base URL:** `/api/v1`
**Swagger:** `/api/v1/explorer`
**Auth Header:** `x-access-token`

### Authentication (Open)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/admin-authentication` | Admin login |
| `POST` | `/manager-auth` | Manager/TeamLead login |
| `POST` | `/emp/auth` | Employee login |
| `POST` | `/forgot-password` | Password reset request |
| `PUT` | `/reset-password` | Password reset confirmation |

### Activity Data Ingestion (Open)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reports/activity` | Insert activity data from agents |
| `POST` | `/reports/activity2` | Insert activity data (v2) |
| `POST` | `/reports/checkServerHealth` | Health check |

### Dashboard & Analytics (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Admin dashboard data |
| `GET` | `/stats` | User statistics |
| `GET` | `/absent-emp` | Absent employees |
| `GET` | `/online-emp` | Online employees |
| `GET` | `/offline-emp` | Offline employees |
| `POST` | `/dashboard-production` | Production hours chart |
| `POST` | `/dashboard-active-days` | Active days data |
| `POST` | `/dashboard-location-hours` | Location working hours |

### Productivity Reports (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports/productivity` | Get productivity report |
| `GET` | `/reports/productivity-list` | Productivity by employees/departments |
| `POST` | `/download-user-report` | Download user activity report |
| `POST` | `/user-report` | Generate comprehensive user report |
| `GET` | `/production-stats` | Production statistics |

### User Management (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/user-register` | Register user |
| `POST` | `/user-register-bulk` | Bulk user registration |
| `POST` | `/fetch-users` | Get user list (paginated) |
| `POST` | `/get-user` | Get single user details |
| `DELETE` | `/user-delete` | Remove user |
| `PUT` | `/update-user-status` | Change user status |
| `POST` | `/assign-user-manager` | Assign employee to manager |

### Employee Self-Service (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/emp/user` | Get employee profile |
| `POST` | `/emp/log` | Get personal activity logs |
| `PUT` | `/emp/update-user` | Update own profile |

### User Analytics (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/get-browser-history` | Browser history |
| `POST` | `/application-used` | Application usage |
| `POST` | `/top-apps` | Top used applications |
| `POST` | `/top-websites` | Top visited websites |
| `POST` | `/get-keystrokes` | Keystroke data |
| `POST` | `/get-screenshots` | Screenshots |
| `POST` | `/working-hours` | Working hours |

### Firewall & Content Control (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/add-domain` | Add blocked domain |
| `POST` | `/add-domain-bulk` | Bulk add domains (CSV) |
| `GET` | `/get-category-domains` | Categories with domains |
| `POST` | `/add-ip-whitelist` | Add IP to whitelist |

### Desktop Control (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/desktop-settings` | Set desktop restrictions (shutdown, USB block, etc.) |
| `POST` | `/desktop-settings-multi-user` | Multi-user restrictions |

### Project Management (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/project-management/get-project` | Get project |
| `POST` | `/project-management/create-internal-projects-team` | Create project with team |
| `POST` | `/project-management/create-todo` | Create task |
| `POST` | `/project-management/create-timesheet` | Create timesheet |

### Integrations (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/integrations/trello/auth/login` | Trello OAuth |
| `GET` | `/integrations/zoho/integration` | Zoho integration data |

## Authentication

- **Admin/Manager:** Email + password login, returns encrypted JWT
- **Employee:** Separate login flow with limited access
- **Token:** AES-256 encrypted JWT in `x-access-token` header
- **License Check:** Verifies organization plan expiry on login

## Event-Driven Architecture

Activity data triggers events that notify the alert service:
1. Activity saved to MongoDB
2. `post('save')` hook emits activity event
3. Alert service contacted via HTTP POST to `ALERT_SERVICE_URL`

## Database Models (MongoDB)

| Schema | Description |
|---|---|
| `employee_activities` | App/website usage events |
| `employee_productivity` | Daily productivity aggregates |
| `employee_keystrokes` | Keystroke records |
| `user_activity_data` | Raw per-second activity telemetry |
| `failed_activity_data` | Failed processing records |
| `organization_apps_web` | App/website registry |
| `organization_categories` | Content categories |

## Environment Variables

Refer to `.env.example` for the full list including:

- Database connections (MySQL, MongoDB, Redis)
- JWT secrets and crypto password
- SendGrid API key and SMTP config
- Zoho client credentials
- Web URLs
- Alert service URL

## Scripts

| Script | Command | Description |
|---|---|---|
| `start:dev` | `nodemon productivity_report_api.js` | Development with auto-reload |
| `start` | `pm2 start productivity_report_api.js` | Production with PM2 |
| `test` | `mocha src/test/**/*.js` | Run test suite |
