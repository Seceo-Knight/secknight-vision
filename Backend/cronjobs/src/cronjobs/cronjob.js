const cronJobs = require('cron').CronJob;

const ReportController = require('./helper/report/ReportController');
const ScreenshootCron = require('./helper/screenshots/ScreenshotHelper');
const UserNotifications = require('./v3/workers/UserNotifications');

//delete downloaded screenshot zip file
let checkScreenshotfolder = new cronJobs(
    `0 */1 * * *`,
    ScreenshootCron.RemoveOldFile,
    () => console.log('---Folder checking Cron complete---'),
    false,
    'Asia/Kolkata'
);
// checkScreenshotfolder.start();

/**Auto email report cron */
let autoemailReport = new cronJobs(
    `0 20 * * *`,
    ReportController.autoEmailReport,
    () => console.log('---Auto email report Cron complete---'),
    false,
    'Asia/Kolkata'
);
// autoemailReport.start();

/**Auto email report cron */
// const activityReportCronJobs = new cronJobs(
//     `0 * */1 * *`,
//     UserNotifications.ActivityReport,
//     () => console.log('---Activity report cron job completed---'),
//     false,
//     'Asia/Kolkata'
// );

const absentReportCronJobs = new cronJobs(
    `*/30 * * * *`,
    UserNotifications.absentReport,
    () => console.log('---Activity report cron job completed---'),
    false,
    'Asia/Kolkata'
);
absentReportCronJobs.start();

