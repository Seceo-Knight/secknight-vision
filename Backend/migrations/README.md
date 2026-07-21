# Migrations

The Migrations service is a database initialization tool for the SecKnight Vision platform. It creates the complete MySQL schema (95+ tables), seeds essential data (permissions, features, integrations, providers), and initializes MongoDB with organization categories.

## Tech Stack

- **Runtime:** Node.js
- **MySQL Driver:** mysql2 (with promise support)
- **MongoDB ODM:** Mongoose
- **Environment:** dotenv

## Project Structure

```
migrations/
├── index.js                    # Entry point - runs migrations
├── package.json
├── sample.env                  # Environment template
├── mysql.connection.js         # MySQL connection pool (singleton)
├── emp-monitor.sql             # Full MySQL schema & seed data
└── model/
    └── Organization.Schema.js  # MongoDB organization categories schema & seed
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL server running
- MongoDB server running

### Installation

```bash
cd migrations
npm install
```

### Configuration

1. Copy the sample environment file:
   ```bash
   cp sample.env .env
   ```
2. Update `.env` with your database credentials.

### Running Migrations

```bash
# Production (run once)
npm start

# Development (with auto-reload)
npm run start:dev
```

## How It Works

1. Reads `emp-monitor.sql` file
2. Creates MySQL database if it doesn't exist (connection without DB)
3. Executes all SQL statements against the new database (connection with DB)
4. Connects to MongoDB and inserts organization categories
5. Exits on completion

**Idempotent:** All `CREATE TABLE` statements use `IF NOT EXISTS`, making it safe to run multiple times.

## MySQL Schema (95+ Tables)

### Core Tables

| Category | Tables |
|---|---|
| **Users & Auth** | `users`, `organizations`, `employees`, `roles`, `permissions`, `permission_role`, `user_role` |
| **Employee Management** | `employee_details`, `employee_attendance`, `employee_shifts`, `employee_leaves`, `employee_tasks_timesheet`, `employee_timesheet` |
| **Monitoring** | `employee_activities`, `employee_browsing_history`, `employee_keystrokes`, `keystroke_alert`, `agent_uninstalled` |
| **Organization Config** | `organization_departments`, `organization_locations`, `organization_groups`, `organization_shifts`, `organization_settings`, `organization_tracking_rules` |
| **Projects** | `projects`, `project_employees`, `project_tasks`, `project_tasks_employee`, `project_modules`, `project_comments` |
| **Alerts & Notifications** | `notification_rules`, `notification_rule_conditions`, `notification_rule_recipients`, `announcements` |
| **Integrations & Storage** | `integrations`, `integration_credentials`, `providers`, `free_plan_storages` |
| **HR & Payroll** | `designations`, `employee_payroll`, `organization_payroll_settings`, `organization_payroll_policies`, `bank_account_details`, `professional_tax` |
| **Email & Reports** | `email_reports`, `employee_dept_email_reports`, `employee_mail_notification`, `html_content` |
| **Other** | `companies`, `holidays`, `expenses`, `feedback`, `transfer`, `biometric_data`, `dashboard_features` |

## Seed Data

| Data | Count | Description |
|---|---|---|
| **Dashboard Features** | 26 | Employee insights, notifications, projects, reports, productivity, settings, timesheet, etc. |
| **Permissions** | 75+ | Employee CRUD, report access, screenshot/keystroke viewing, settings management, etc. |
| **Integrations** | 3 | Storage, CRM, Project Management |
| **Storage Providers** | 7 | Google Drive, Dropbox, AWS S3, Zoho WorkDrive, OneDrive, FTP, SFTP |
| **Organization Categories** | 75 | Technology, Finance, Education, Entertainment, Health, Shopping, etc. (MongoDB) |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MYSQL_HOST` | `localhost` | MySQL server host |
| `MYSQL_USERNAME` | `root` | MySQL username |
| `MYSQL_PASSWORD` | *(empty)* | MySQL password |
| `MYSQL_DATABASE_NAME` | `empmonitor` | Database name to create |
| `MYSQL_POOL_CONNECTION_LIMIT` | `10` | Connection pool size |
| `MONGO_URL` | `mongodb://localhost:27017/empdevsite` | MongoDB connection string |

## Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `node index.js` | Run migrations once |
| `start:dev` | `nodemon index.js` | Run with auto-reload |
