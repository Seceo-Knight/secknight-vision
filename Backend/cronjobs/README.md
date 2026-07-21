# Cronjobs Microservice

The Cronjobs microservice handles all scheduled background tasks for the SecKnight Vision platform including automated email reports, screenshot cleanup, data retention, external integrations, late login alerts, and failed activity recovery.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js (minimal, for internal API)
- **Databases:** MySQL, MongoDB (Mongoose), Redis
- **Scheduling:** cron (node-cron)
- **Email:** Nodemailer, SendGrid
- **SMS:** Twilio
- **Cloud Storage:** AWS S3, Google Drive, OneDrive, Zoho WorkDrive, FTP, SFTP, WebDAV
- **Reporting:** pdfmake (PDF), exceljs (Excel), csv-writer (CSV)
- **Logging:** Winston with daily rotate file

## Project Structure

```
cronjobs/
├── cronService.js                  # Entry point
├── package.json
├── sample.env                      # Environment template
├── public/                         # Screenshots & temp report files
├── src/
│   ├── App.js                      # Express server & cron initialization
│   ├── database/
│   │   ├── MySqlConnection.js      # MySQL connection pool (singleton)
│   │   ├── MongoConnection.js      # MongoDB connection
│   │   └── redisConnection.js      # Redis connection
│   ├── cronjobs/
│   │   ├── v3/
│   │   │   ├── cronjobs.js         # Main cron job orchestrator
│   │   │   ├── router/router.js    # Internal API routes
│   │   │   ├── workers/            # Background workers
│   │   │   ├── models/             # Mongoose schemas
│   │   │   ├── emailreports/       # Scheduled email report generation
│   │   │   ├── checkScreensAge/    # Screenshot auto-deletion
│   │   │   ├── checkDataAge/       # Old data cleanup & user suspension
│   │   │   ├── checkLateLoginShift/        # Late login detection & SMS alerts
│   │   │   ├── checkOrganizationProviderCred/  # Storage credential expiry checks
│   │   │   ├── applicationinformation/     # App info Redis cache
│   │   │   ├── eventAlertEmail/    # Birthday alert emails
│   │   │   ├── externalReportCrons/        # External API data sync
│   │   │   ├── FailedActivityRestore/      # Failed data recovery
│   │   │   └── reportActivity/     # Temp report file cleanup
│   │   └── helper/
│   │       ├── report/             # Report generation helpers
│   │       ├── screenshots/        # Screenshot processing
│   │       └── shared/             # Shared report utilities
│   ├── messages/
│   │   └── Mailer.js              # Email service (SendGrid/SMTP)
│   ├── utils/
│   │   ├── Logger.js              # Winston logger config
│   │   └── helpers/IPMasking.js   # IP address masking
│   └── GraphExtension/
│       └── barGraph.js            # Chart generation for reports
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL
- MongoDB
- Redis

### Installation

```bash
cd cronjobs
npm install
```

### Configuration

1. Copy the sample environment file:
   ```bash
   cp sample.env .env
   ```
2. Update `.env` with your database credentials, API keys, and configuration values.

### Running

```bash
# Development (with nodemon)
npm run start:dev

# Production (with PM2)
npm start
```

The service starts on the port defined in `.env` (default: `3003`).

## Cron Jobs

All cron jobs run in the `Asia/Kolkata` timezone.

| Job | Schedule | Description |
|---|---|---|
| **sendEmailReport** | Every 30 min | Sends scheduled email reports to organizations |
| **sendUnProductiveEmailReport** | Monday 10 AM | Sends weekly unproductivity reports |
| **sendBirthdayEventAlertMail** | Daily 10 AM | Sends birthday greeting emails |
| **sendActivityLoginEmailReport** | Monthly (1st, midnight) | Sends monthly activity & login reports |
| **checkCloudStorage** | Daily 11:59 PM | Auto-deletes old screenshots from cloud storage |
| **appInfo** | Every 10 min | Refreshes app configuration in Redis cache |
| **checkUserActivityAge** | Daily 1 AM | Deletes old activity data (3+ days) & suspends inactive users |
| **checkOrganizationProviderCredIsExpired** | Daily 1 AM | Checks storage provider credential expiry |
| **sendExternalReport** | Every 30 min | Syncs data to external APIs (Tele-Works) |
| **checkShiftBasedLateLogin** | Configurable | Detects late logins based on shift schedules |
| **taskDisabled** | Every 30 min | Disables active external tasks before midnight |
| **oneDriveCalendarSyncCron** | Every 30 min | Syncs OneDrive calendar data |
| **failedActivityRestore** | Every minute | Retries failed activity data submissions |
| **ReportActivity** | Configurable | Cleans up temporary report files |

## API Endpoints

This is primarily an internal service with minimal API surface.

**Base URL:** `/api/v3`

| Method | Route | Description |
|---|---|---|
| `GET` | `/enableFailedRestore` | Enable the failed activity restoration cron |
| `GET` | `/disableFailedRestore` | Disable the failed activity restoration cron |

## Key Modules

### Email Reports
- Supports daily, weekly, monthly, and custom schedules
- Generates PDF and HTML email templates
- Configurable recipients (to/cc/bcc)
- Timezone-aware report generation
- Covers attendance, activity logs, productivity, and unproductivity metrics

### Screenshot Cleanup
- Automatic age-based deletion of old screenshots
- Multi-provider support: AWS S3, Google Drive, OneDrive, Zoho WorkDrive, FTP, SFTP, WebDAV
- S3 lifecycle policy configuration
- Configurable retention period via `SCREENSHOTS_DEL`

### Data Retention
- Removes activity data older than 3 days from MongoDB
- Auto-suspends employees inactive for 1+ month
- Organization-specific retention policies

### Late Login Detection
- Checks arrivals against shift schedules
- Sends SMS alerts via Twilio
- Generates CSV absent employee reports
- Email notifications with attachments

### Failed Activity Recovery
- Stores failed activity submissions in MongoDB
- Automatic retry every minute (when enabled)
- Disabled after 2 failed attempts or when records < 100
- Enable/disable via API endpoints (uses Redis flags)

### External Integrations
- Tele-Works platform data sync (tasks, productivity, attendance)
- OneDrive calendar synchronization
- Shift-based data generation with retry mechanism

## Database Models (MongoDB)

| Schema | Description |
|---|---|
| `activityLogs` | Login/logout activities (auto-expires after 32 days) |
| `employee_activities` | Employee activity tracking |
| `employee_productivity` | Productivity metrics |
| `failed_activity_data` | Failed submissions for retry |
| `externalTeleWorks` | Tele-Works external data |
| `organization_apps_web` | Organization app configuration |
| `report-activity-log` | Report generation logs |
| `user_activity_data` | User activity data |

## Cloud Storage Integrations

- **AWS S3** - With lifecycle policy management
- **Google Drive** - Via Google APIs
- **Microsoft OneDrive** - Via Microsoft Graph API
- **Zoho WorkDrive** - Via Zoho API
- **FTP/SFTP** - Direct server connections
- **WebDAV** - WebDAV-compatible services

## Environment Variables

Refer to `sample.env` for the full list of required environment variables including:

- Database connections (MySQL, MongoDB, Redis)
- SMTP / SendGrid configuration
- Twilio SMS credentials
- Cloud storage provider settings
- Cron schedule overrides
- Organization-specific settings
- Branding (logo, social links, support email)

## Logging

- **Engine:** Winston with daily rotating log files
- **Location:** `src/utils/errorLog/`
- **Retention:** 15 days
- **Max file size:** 100MB
- **Format:** `YYYY-MM-DD-error.log`

## Scripts

| Script | Command | Description |
|---|---|---|
| `start:dev` | `nodemon cronService.js` | Development server with auto-reload |
| `start` | `pm2 start cronService.js` | Production server with PM2 |
| `test` | `mocha --config=src/test/.mocharc.json` | Run test suite |
