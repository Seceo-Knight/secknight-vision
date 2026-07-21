const moment = require('moment');

const Report = require('../shared/Report');
const sendResponse = require('../../utils/myService').sendResponse;
const ReportValidation = require('../../rules/validation/Report');

class AutoReportService {
    async autoEmailData(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        try {
            const auto_email_data = await Report.autoEmailData(admin_id);
            return sendResponse(res, 200, auto_email_data, 'Auto Email Data.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Get AutoEmail Report Data.', 'Database Error.');
        }
    }

    async updateAutoEmailReoprt(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;

        try {
            const auto_email_data = await Report.autoEmailData(admin_id);
            let {
                recipient_email,
                website_analytics,
                application_analytics,
                keystroke,
                browser_history,
                user_log,
                top_website_analytics,
                top_application_analytics,
                frequency_type,
                status
            } = req.body;

            let validate = ReportValidation.autoEmailReportValidation({
                recipient_email,
                website_analytics,
                application_analytics,
                keystroke,
                browser_history,
                user_log,
                top_website_analytics,
                top_application_analytics,
                frequency_type,
                status
            });
            let next_send_on;
            keystroke = keystroke || 0;
            if (validate.error) return sendResponse(res, 404, null, 'Validation Error', validate.error.details[0].message);

            if (parseInt(frequency_type) === 1) {
                const next_day = moment().utc().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
                console.log(moment().utc().format('YYYY-MM-DD HH:mm:ss'))
                console.log(moment().utc().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'))
                next_send_on = next_day

            } else if (parseInt(frequency_type) === 2) {
                const day_of_week = moment().utc().day('monday').hour(0).minute(0).second(0);
                const end_of_today = moment().utc().hour(23).minute(59).second(59);
                if (day_of_week.isBefore(end_of_today)) {
                    day_of_week.add(1, 'weeks');
                }
                next_send_on = day_of_week.format('YYYY-MM-DD HH:mm:ss')
            } else {
                const endOfToday = moment().utc().hour(23).minute(59).second(59);
                const month = moment().utc().endOf("month")
                // const month = moment().utc('2020-03-30')
                if (month.isBefore(endOfToday)) {
                    month.add(1, 'months');
                }
                next_send_on = month.format('YYYY-MM-DD HH:mm:ss');
            }
            if (auto_email_data.length > 0) {
                //update
                const updated = await Report.updateAutoReport(admin_id, recipient_email.toLowerCase(), website_analytics, application_analytics, top_application_analytics, keystroke, browser_history, user_log, top_website_analytics, status, frequency_type, next_send_on);
                if (updated.changedRows > 0) {
                    return sendResponse(res, 200, req.body, 'Successfully Updated', null);
                } else {
                    return sendResponse(res, 400, null, 'Not Updated Updated', 'Nothing get changed');
                }
            } else {
                //insert
                const added = await Report.addAutoEmailReport(admin_id, recipient_email.toLowerCase(), website_analytics, application_analytics, keystroke, browser_history, user_log, top_website_analytics, top_application_analytics, status, frequency_type, next_send_on);
                return sendResponse(res, 200, req.body, 'Successfully Added', null);
            }

        } catch (err) {
            sendResponse(res, 400, null, 'Unable To Update Auto Email Report Data.', 'Database Error');
        }

    }
}

module.exports = new AutoReportService;

// (async () => {
//     const auto_email_data = await Report.autoEmailData(1);
//     console.log('=====================', auto_email_data);
// })();
// let frequency_type = 1;
// let next_send_on;

// if (frequency_type === 1) {
//     const next_day = moment().utc().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
//     next_send_on = next_day
// } else if (frequency_type === 2) {
//     const day_of_week = moment().utc().day('monday').hour(0).minute(0).second(0);
//     const end_of_today = moment().utc().hour(23).minute(59).second(59);
//     if (day_of_week.isBefore(end_of_today)) {
//         day_of_week.add(1, 'weeks');
//     }
//     next_send_on = day_of_week.format('YYYY-MM-DD HH:mm:ss')
// } else {
//     const endOfToday = moment().utc().hour(23).minute(59).second(59);
//     const month = moment().utc().endOf("month")
//     // const month = moment().utc('2020-03-30')
//     if (month.isBefore(endOfToday)) {
//         month.add(1, 'months');
//     }
//     next_send_on = month.format('YYYY-MM-DD HH:mm:ss');
// }
// console.log('=======================', next_send_on);