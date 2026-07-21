// Load this module's sibling .env (Backend/config/.env) so the Config class
// below actually picks up its values. The path is resolved relative to THIS
// file, so it works no matter which service's cwd `node` was started from.
//
// We parse the file by hand instead of using `dotenv` because this directory
// has no node_modules of its own — `require('dotenv')` is not reliably
// resolvable from here across the different services that load this config.
// Values already present in process.env (e.g. set by the host service's own
// dotenv.config()) are kept authoritative; this only fills in the missing ones.
(function loadConfigEnv() {
    try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) return;
        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue; // skip blanks/comments
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            if (!key || process.env[key] !== undefined) continue; // don't override existing
            let value = trimmed.slice(eq + 1).trim();
            // strip surrounding single/double quotes if present
            if (value.length >= 2 && ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    } catch (e) {
        if (process.env.IS_DEBUGGING) console.warn('[config] could not load config/.env:', e.message);
    }
})();

class Config {
    constructor() {
        // Helper to parse string env var
        const parseStr = (envVar) => process.env[envVar] || '';
        // Helper to parse JSON from env
        const parseJSON = (envVar) => {
            const val = process.env[envVar];
            if (!val) return {};
            try { return JSON.parse(val); } catch { return {}; }
        };
        // Helper to parse JSON array from env
        const parseJSONArray = (envVar) => {
            const val = process.env[envVar];
            if (!val) return [];
            try { return JSON.parse(val); } catch { return []; }
        };
        // Helper to parse comma-separated number arrays from env
        const parseNumArrayEnv = (envVar) => {
            const val = process.env[envVar];
            if (!val) return [];
            return val.split(',').map(Number).filter(n => !isNaN(n));
        };
        // Helper to parse integer from env
        const parseInt10 = (envVar) => {
            const val = process.env[envVar];
            return val ? parseInt(val, 10) : 0;
        };

        // Capping productivity to 100% and not exceeding
        this.cappingProductivityOrgs = parseStr('CAPPING_PRODUCTIVITY_ORGS');

        // Adding Average Calculation in Dashboard / Activity Break Down
        this.activityBreakDownAverage = parseStr('ACTIVITY_BREAKDOWN_AVERAGE');

        // Expired Organization Emails
        this.planExpiredOrgEmails = parseJSONArray('PLAN_EXPIRED_ORG_EMAILS');

        // Expired Organization Ids
        this.planExpiredOrgIds = parseNumArrayEnv('PLAN_EXPIRED_ORG_IDS');

        // Client Requirement to Update Office Agent Email to Computer Name
        this.UPDATE_IN_SCREENSHOT_OFFICE_USER = parseStr('UPDATE_IN_SCREENSHOT_OFFICE_USER');

        // Client Id for Silah for Custom Mail Template
        this.SILAH_CUSTOM_MAIL_TEMPLATE = parseStr('SILAH_CUSTOM_MAIL_TEMPLATE');

        // Time Group Auto Email for Combined Attachment of Website and Application Usage
        this.TIME_GROUP_AUTO_EMAIL_UPDATE = parseStr('TIME_GROUP_AUTO_EMAIL_UPDATE');

        // To enable FTP on Client Dashboard
        this.IS_FTP_ENABLED_ORGANIZATION = parseStr('IS_FTP_ENABLED_ORGANIZATION');

        // To enable SFTP on client Dashboard
        this.IS_SFTP_ENABLED_ORGANIZATION = parseStr('IS_SFTP_ENABLED_ORGANIZATION');

        // For enabling the feature of storage of WebDav
        this.IS_WEBDAV_ENABLED_ORGANIZATION = parseStr('IS_WEBDAV_ENABLED_ORGANIZATION');

        // To Change Custom Structure in One Drive Client Specific
        this.CUSTOM_DATE_EMAIL_SCREEN_FORMAT = parseStr('CUSTOM_DATE_EMAIL_SCREEN_FORMAT');

        // To change Custom Structure in S3 Bucket
        this.CUSTOM_DATE_EMAIL_SCREEN_FORMAT_S3 = parseStr('CUSTOM_DATE_EMAIL_SCREEN_FORMAT_S3');

        // For Custom Late Alert ARRAY
        this.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS = parseStr('CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS');
        this.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS_TIME_CRON = parseStr('CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS_TIME_CRON');

        this.AUTO_EMAIL_REPORT_BCC = parseJSONArray('AUTO_EMAIL_REPORT_BCC');

        // Below Config is to add unproductive percentage to time sheet
        this.UNPRODUCTIVE_PERCENTAGE_TIME_SHEET = parseStr('UNPRODUCTIVE_PERCENTAGE_TIME_SHEET');

        // For TCE to move suspended user to active when try to login
        this.MOVE_SUSPENDED_USER_TO_ACTIVE = parseStr('MOVE_SUSPENDED_USER_TO_ACTIVE');

        // Show specific department to non admin in productivity rules
        this.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN = parseStr('SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN');

        // Show all role for specific non admin
        this.SHOW_ALL_ROLE_NON_ADMIN = parseStr('SHOW_ALL_ROLE_NON_ADMIN');

        // Search specific domains or app visited csv report generation
        this.SEARCH_REPORT_ORG = parseStr('SEARCH_REPORT_ORG');

        // Block Email for Personal Agent during register, roles update, etc
        this.BLOCK_SPECIFIC_ORGANIZATION_EMPLOYEE_EMAIL = parseNumArrayEnv('BLOCK_SPECIFIC_ORGANIZATION_EMPLOYEE_EMAIL');

        // The Organization ID for the Birthday Event Alert mail
        this.EMPLOYEE_ALERT_BIRTHDAY = parseNumArrayEnv('EMPLOYEE_ALERT_BIRTHDAY');

        // For Client to send clock-in clock-out record to their API
        this.EXTERNAL_CLOCKINOUT_CALL = parseNumArrayEnv('EXTERNAL_CLOCKINOUT_CALL');
        this.EXTERNAL_CLOCKINOUT_CALL_URL = parseStr('EXTERNAL_CLOCKINOUT_CALL_URL');
        this.EXTERNAL_CLOCKINOUT_CALL_TOKEN = parseStr('EXTERNAL_CLOCKINOUT_CALL_TOKEN');

        // Change in Office Email to userName_domainName@userName.orgID AD Swapping Users
        this.CHANGE_OFFICE_AGENT_EMAIL = parseNumArrayEnv('CHANGE_OFFICE_AGENT_EMAIL');

        // Change in Office Email to Support AD Swapping and Workgroup users
        this.CHANGE_OFFICE_AGENT_EMAIL_SWAPPING_NON_SWAPPING = parseNumArrayEnv('CHANGE_OFFICE_AGENT_EMAIL_SWAPPING_NON_SWAPPING');

        // Client with wasted hours in Timesheet Auto Email
        this.LUNCH_DURATION = parseInt10('LUNCH_DURATION');
        this.WASTED_HOURS_ORG_ID = parseStr('WASTED_HOURS_ORG_ID');

        // Client Swap Main System and AVD
        this.CUSTOM_LOGIN_REGISTER_AD_NO_SWAP = parseNumArrayEnv('CUSTOM_LOGIN_REGISTER_AD_NO_SWAP');

        // Disable keystroke feature
        this.DISABLE_KEYSTROKE_FEATURE = parseStr('DISABLE_KEYSTROKE_FEATURE');

        this.export_emp_users_link = parseStr('EXPORT_EMP_USERS_LINK');

        // Enable auto updates for a specific client
        this.AD_AUTO_UPDATE_ENABLE = parseNumArrayEnv('AD_AUTO_UPDATE_ENABLE');

        // FOR ICICI Client to block admin user "soldier"
        this.AD_SWAP_ICICI_BLOCK_USERNAME = parseNumArrayEnv('AD_SWAP_ICICI_BLOCK_USERNAME');

        // For AD/Non AD swap user based on username
        this.SPECIAL_AD_SWAPPING_WITHOUT_AD_ID = parseNumArrayEnv('SPECIAL_AD_SWAPPING_WITHOUT_AD_ID');

        // Without shift assignment, stop splitting data at midnight
        this.AUTO_SHIFT_FEATURES = parseNumArrayEnv('AUTO_SHIFT_FEATURES');

        this.PRODUCTIVITY_REPORT_FOR_ALL_USERS_DOWNLOAD = parseNumArrayEnv('PRODUCTIVITY_REPORT_FOR_ALL_USERS_DOWNLOAD');

        // For Agent Popup to check user idle and send request for idle claim
        this.IDLE_POPUP_AGENT = parseNumArrayEnv('IDLE_POPUP_AGENT');

        // Auto Assign superiors based on same location and department
        this.AUTO_ASSIGN_USER = parseNumArrayEnv('AUTO_ASSIGN_USER');

        // Send weekly auto email on saturday, sort data according to productivity
        this.AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS = parseNumArrayEnv('AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS');

        // Block administrator account
        this.BLOCK_ADMIN_ACCOUNT = parseJSON('BLOCK_ADMIN_ACCOUNT');

        this.ONE_DRIVE_CALENDAR_SYNC = parseInt10('ONE_DRIVE_CALENDAR_SYNC');

        this.AUTO_EMAIL_WEB_APP_REPORT_TITLE = parseNumArrayEnv('AUTO_EMAIL_WEB_APP_REPORT_TITLE');

        // Send admin desktop push notification for alerts when using usb or hdd
        this.USB_ALERT_ADMIN = parseNumArrayEnv('USB_ALERT_ADMIN');

        // Screenshot frequency customizations
        this.CUSTOM_SCREENSHOT_FREQUENCY_120_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_120_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_180_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_180_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_240_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_240_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_360_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_360_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_480_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_480_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_600_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_600_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_720_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_720_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_900_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_900_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_1200_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_1200_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_1800_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_1800_PER_HOUR');
        this.CUSTOM_SCREENSHOT_FREQUENCY_3600_PER_HOUR = parseNumArrayEnv('CUSTOM_SCREENSHOT_FREQUENCY_3600_PER_HOUR');

        // Enable Logout feature
        this.ENABLE_LOGOUT_FEATURE = parseNumArrayEnv('ENABLE_LOGOUT_FEATURE');

        // Disable blocking of multiple access for screen cast
        this.DISABLE_BLOCKING_MULTIPLE_ACCESS_SCREENCAST = parseNumArrayEnv('DISABLE_BLOCKING_MULTIPLE_ACCESS_SCREENCAST');

        // To update the first name & last name while registration without computer name
        this.AD_REGISTRATION_WITHOUT_COMPUTER_NAME = parseNumArrayEnv('AD_REGISTRATION_WITHOUT_COMPUTER_NAME');

        // Sort all reports based on user and date wise
        this.SORT_ALL_REPORTS_USER_WISE = parseNumArrayEnv('SORT_ALL_REPORTS_USER_WISE');

        // For Customization in Alert for late login
        this.CUSTOM_LATE_LOGIN_ALERT = parseNumArrayEnv('CUSTOM_LATE_LOGIN_ALERT');

        // For customization of replacing application name from "Oracle Developer" to "ERP"
        this.CHANGING_APP_NAME_IN_PRODUCTIVITY_REPORT_MODULE = parseNumArrayEnv('CHANGING_APP_NAME_IN_PRODUCTIVITY_REPORT_MODULE');

        // To enable screen casting in an organization for specific users
        this.SCREEN_CAST_FOR_SPECIFIC_USERS = parseJSON('SCREEN_CAST_FOR_SPECIFIC_USERS');

        // To enable screen recording in an organization for specific users
        this.SCREEN_RECORDING_FOR_SPECIFIC_USERS = parseJSON('SCREEN_RECORDING_FOR_SPECIFIC_USERS');

        // Geo location change logging
        this.GEO_LOCATION_CHANGE_LOGGING = parseNumArrayEnv('GEO_LOCATION_CHANGE_LOGGING');

        // To disable timesheet activity tracking - storelogs
        this.DISABLE_TIMESHEET_ACTIVITY_TRACKING = parseNumArrayEnv('DISABLE_TIMESHEET_ACTIVITY_TRACKING');

        // To disable dlp logs tracking - storelogs
        this.DISABLE_DLP_LOGS_TRACKING = parseNumArrayEnv('DISABLE_DLP_LOGS_TRACKING');

        // To disable screenshot tracking - storelogs
        this.DISABLE_SCREENSHOT_TRACKING = parseNumArrayEnv('DISABLE_SCREENSHOT_TRACKING');

        // To disable screen record tracking - storelogs
        this.DISABLE_SCREEN_RECORD_TRACKING = parseNumArrayEnv('DISABLE_SCREEN_RECORD_TRACKING');

        // Organization wise productivity rule customization for mail.google.com
        this.PRODUCTIVITY_RULE_CUSTOMIZATION_FOR_MAIL_GOOGLE_COM = parseNumArrayEnv('PRODUCTIVITY_RULE_CUSTOMIZATION_FOR_MAIL_GOOGLE_COM');

        // Disable validation for non admin assigned to project task
        this.DISABLE_VALIDATION_NON_ADMIN_ASSIGNED_PROJECT_TASK = parseNumArrayEnv('DISABLE_VALIDATION_NON_ADMIN_ASSIGNED_PROJECT_TASK');

        // Auto Email report selected header is allowed
        this.AUTO_EMAIL_REPORT_SELECTED_HEADER = parseJSON('AUTO_EMAIL_REPORT_SELECTED_HEADER');

        // For timeclaim updates
        this.TIME_CLAIM_UPDATE_OFFICE_TIME_SEGRGATION = parseNumArrayEnv('TIME_CLAIM_UPDATE_OFFICE_TIME_SEGRGATION');

        // Combined Report Download Organization ID
        this.COMBINED_REPORT_DOWNLOAD_ORG_ID = parseNumArrayEnv('COMBINED_REPORT_DOWNLOAD_ORG_ID');

        // New mail template with the timesheet data
        this.NEW_MAIL_TEMPLATE_WITH_TIMESHEET_DATA = parseNumArrayEnv('NEW_MAIL_TEMPLATE_WITH_TIMESHEET_DATA');

        // Project Task Organization to Auto stop task if idle for more than configured minutes
        this.PROJECT_TASK_AUTO_STOP_IDLE_TIME = parseNumArrayEnv('PROJECT_TASK_AUTO_STOP_IDLE_TIME');
        this.PROJECT_TASK_AUTO_STOP_IDLE_TIME_MINUTES = parseInt10('PROJECT_TASK_AUTO_STOP_IDLE_TIME_MINUTES');

        // For blocking based on mac address
        this.CHECK_BLOCK_MAC_ADDRESS_USERNAME_REGISTRATION = parseJSONArray('CHECK_BLOCK_MAC_ADDRESS_USERNAME_REGISTRATION');

        // Filter keystroke in all reports sections i.e removing symbols
        this.KEYSTROKE_FILTER_TEXT = parseNumArrayEnv('KEYSTROKE_FILTER_TEXT');

        // Add last checkout time to employee details page
        this.EMPLOYEE_DETAILS_LAST_LOGIN = parseNumArrayEnv('EMPLOYEE_DETAILS_LAST_LOGIN');

        // Feature to enable the file upload screenshot alert
        this.FILE_UPLOAD_SCREENSHOT_ALERT = parseNumArrayEnv('FILE_UPLOAD_SCREENSHOT_ALERT');

        // Feature to change weekly reports schedule dynamic
        this.WEEKLY_REPORTS_SCHEDULE = parseJSON('WEEKLY_REPORTS_SCHEDULE');
    }
}

module.exports = new Config();
