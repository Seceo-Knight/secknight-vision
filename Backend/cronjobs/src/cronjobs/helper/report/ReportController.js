const moment = require('moment');
const Report = require('../shared/Report');
const MailHelper = require('./MailHelper');

class ReportController {

    async autoEmailReport() {
        try {
            const admins = await Report.getActivatedAdmin();

            for (const admin of admins) {
                let start_date;
                let end_date;
                if (admin.frequency_type === 1) {
                    start_date = moment().utc().format('YYYY-MM-DD');
                    end_date = moment().utc().format('YYYY-MM-DD');
                } else if (admin.frequency_type === 2) {
                    start_date = moment().utc().format('YYYY-MM-DD');
                    end_date = moment().utc().subtract(7, 'd').format('YYYY-MM-DD');

                    const day_of_week = moment().utc().day('saturday').hour(0).minute(0).second(0).format('YYYY-MM-DD');
                    const current_date = moment().utc().format('YYYY-MM-DD');
                    if (!(day_of_week === current_date)) {
                        continue;
                    }
                } else {
                    start_date = moment().utc().endOf("month").format('YYYY-MM-DD');
                    end_date = moment().utc().startOf("month").format('YYYY-MM-DD');

                    const month = moment().utc().endOf("month").format('YYYY-MM-DD');
                    const current_date = moment().utc().format('YYYY-MM-DD');
                    if (!(month === current_date)) {
                        continue;
                    }
                }

                const users = await Report.getAllUsers(admin.admin_id)
                let log_content
                let log_final = '';
                let app_content
                let app_final = '';
                let website_content;
                let website_final = '';
                let top_website_content;
                let top_website_final = '';
                let top_app_content;
                let top_app_final = '';
                /**Log details of employee */
                for (const user of users) {
                    if (admin.user_log === 1) {
                        const user_log = await Report.getLogDetails(user.id, start_date, end_date);
                        if (user_log.length > 0) {
                            log_content = user_log.reduce(function (a, b) {
                                return a + '<tr><td>' + b.day + '</td><td>' + b.login_time + '</td><td>' + b.logout_time + '</td><td>' + b.working_hours + '</td><td>' + b.non_working_hours + '</td><td>' + b.total_hours + '</td></tr>';
                            }, '');
                            log_final += '<h3>' + user.first_name + ' ' + user.last_name + '</h3><br/><div><table><thead><tr><th>Day</th><th>Login Time</th><th>Logout Time</th><th>Working Hours</th><th>Non Working Hours</th><th>Total Hours</th></tr></thead><tbody>' +
                                log_content + '</tbody></table></div>'
                        }
                    }
                    /**Application used analitics data */
                    if (admin.application_analytics === 1) {
                        const apps = await Report.userApplicationUsed(user.id, start_date, end_date);
                        if (apps.length > 0) {
                            app_content = apps.reduce(function (a, b) {
                                return a + '<tr><td>' + b.create_date + '</td><td>' + b.app_name + '</td></tr>';
                            }, '');
                            app_final += '<h3>' + user.first_name + ' ' + user.last_name + '</h3><br/><div><table><thead><tr><th>Day</th><th>Application Name</th></tr></thead><tbody>' +
                                app_content + '</tbody></table></div>'
                        }
                    }
                    /**Browser history datails */
                    if (admin.website_analytics === 1) {
                        const browser = await Report.browserHistory(user.id, start_date, end_date);
                        if (browser.length > 0) {
                            website_content = browser.reduce(function (a, b) {
                                return a + '<tr><td>' + b.create_date + '</td><td>' + b.browser + '</td><td>' + b.url + '</td></tr>';
                            }, '');
                            website_final += '<h3>' + user.first_name + ' ' + user.last_name + '</h3><br/><div><table><thead><tr><th>Day</th><th>Browser</th><th>URL</th></tr></thead><tbody>' +
                                website_content + '</tbody></table></div>'
                        }
                    }

                    /**Top websites datails */
                    if (admin.top_website_analytics === 1) {
                        const top_website_analytics = await Report.topWebsites(user.id, start_date, end_date);
                        if (top_website_analytics.length > 0) {
                            top_website_content = top_website_analytics.reduce(function (a, b) {
                                return a + '<tr><td>' + b.domain + '</td><td>' + b.count + '</td></tr>';
                            }, '');
                            top_website_final += '<h3>' + user.first_name + ' ' + user.last_name + '</h3><br/><div><table><thead><tr><th>Domain</th><th>Count</th></tr></thead><tbody>' +
                                top_website_content + '</tbody></table></div>'
                        }
                    }
                    /**Top application datails */
                    if (admin.top_application_analytics === 1) {
                        const top_application_analytics = await Report.topApps(user.id, start_date, end_date);
                        if (top_application_analytics.length > 0) {
                            top_app_content = top_application_analytics.reduce(function (a, b) {
                                return a + '<tr><td>' + b.app_name + '</td><td>' + b.count + '</td></tr>';
                            }, '');
                            top_app_final += '<h3>' + user.first_name + ' ' + user.last_name + '</h3><br/><div><table><thead><tr><th>Domain</th><th>Count</th></tr></thead><tbody>' +
                                top_app_content + '</tbody></table></div>'
                        }
                    }
                }
                if (log_final) {
                    const log_detail_mail = await MailHelper.sendRoprtMail(admins[0].recipient_email, 'Log details of user', log_final);
                }
                if (top_app_final) {
                    const topapp_mail = await MailHelper.sendRoprtMail(admins[0].recipient_email, 'User to application used', top_app_final);
                }
                if (app_final) {
                    const app_mail = await MailHelper.sendRoprtMail(admins[0].recipient_email, 'User application used', app_final);
                }
                if (website_final) {
                    const browser_mail = await MailHelper.sendRoprtMail(admins[0].recipient_email, 'User browser history', website_final);
                }
                if (top_website_final) {
                    const topwebsite_mail = await MailHelper.sendRoprtMail(admins[0].recipient_email, 'User top websites', top_website_final);
                }

            }
            console.log('=================done=====');
            return;
        } catch (err) {
            console.log('------', err)
        }
    }
}

module.exports = new ReportController;

// (async () => {

// })