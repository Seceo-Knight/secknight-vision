const _ = require('underscore');

const Password = require('./decode.service');
const sendResponse = require('../../../../utils/myService').sendResponse;
const Validation = require('./emailRepots.validation');
const EmailReportModel = require('./emailReports.model');
const actionsTracker = require('../../services/actionsTracker');
const { reportMessage } = require("../../../../utils/helpers/LanguageTranslate");

class EmailReportsController {

    async createNewReport(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            let { name, frequency, recipients, content, filter_type, user_ids, department_ids, report_types, custom, location_ids, shift_ids } = req.body;

            if (frequency == 5 && (content.productivity == 1 || content.timesheet == 1 || content.apps_usage == 1 || content.websites_usage == 1)) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if (JSON.stringify(report_types).match('pdf') && (content.hrms_attendance == '1' || content.attendance == '1')) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if ((content.hrms_attendance == '1' || content.attendance == '1') && frequency != 5) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if (!custom.date && frequency == 5) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if(frequency == 9 && !custom && !custom.time) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);
            
            let validate = Validation.emailReport({ name, frequency, recipients, content, filter_type, user_ids, department_ids, report_types, custom, location_ids, shift_ids });
            if (validate.error) return sendResponse(res, 404, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"], validate.error.details[0].message);

            content = JSON.stringify(content);
            filter_type = parseInt(filter_type);
            custom = custom ? JSON.stringify(custom) : null;

            if (filter_type === 2) {
                if (user_ids.length === 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "3")[language] || reportMessage.find(x => x.id === "3")["en"], null);
            } else if (filter_type === 3) {
                if (department_ids.length === 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "4")[language] || reportMessage.find(x => x.id === "4")["en"], null);
            }
            let reportByName = await EmailReportModel.searchByname(name, organization_id);
            if (reportByName.length > 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "5")[language] || reportMessage.find(x => x.id === "5")["en"], null);

            let report = await EmailReportModel.addEmailReport(organization_id, name, frequency, recipients, content, filter_type, req.decoded.user_id, report_types, custom, location_ids, shift_ids);

            if (filter_type === 2) {
                let userReport = user_ids.map(id => [report.insertId, id]);
                let reportsToUser = await EmailReportModel.addUserToReports(userReport);

            } else if (filter_type === 3) {
                let deptReport = department_ids.map(id => [report.insertId, id]);
                let reportsToUser = await EmailReportModel.addDeptToReports(deptReport);
            }

            req.body.id = report.insertId;
            actionsTracker(req, 'Report %i created.', [req.body.id]);
            return sendResponse(res, 200, req.body, reportMessage.find(x => x.id === "6")[language] || reportMessage.find(x => x.id === "6")["en"], null);

        } catch (err) {
            console.log('===========', err);
            return sendResponse(res, 400, null, 'Unable to add reports', 'Unable to add reports');
        }
    }

    async getReports(req, res) {
        try {
            let { organization_id, language, user_id, is_admin } = req.decoded;
            const { page, limit, name, sortColumn, sortOrder, skip } = req.query;
            if (is_admin) user_id = null;

            let validate = Validation.getEmailReport({ page, limit, name, sortColumn, sortOrder });
            if (validate.error) return sendResponse(res, 404, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"], validate.error.details[0].message);

            actionsTracker(req, 'Reports requested.');
            // if (page < 1) return sendResponse(res, 400, null, 'Page number must grater or equal to one.', null);
            // Pagination
            // const startIndex = (page - 1) * (limit || 10);
            // const endIndex = page * limit;
            let startIndex;
            let endIndex;
            if (page) {
                startIndex = (page - 1) * limit;
                endIndex = page * limit;
            } else {
                startIndex = skip;
                endIndex = (parseInt(skip) + parseInt(limit));
            }
            let column;
            let order;
            if (sortOrder === 'D') {
                order = `DESC`;
            } else {
                order = `ASC`;
            }

            switch (sortColumn) {
                case 'Name':
                    column = 'name';
                    break;
                case 'Frequency':
                    column = 'frequency';
                    break;
                case 'Filter Type':
                    column = 'filter_type';
                    break;
                case 'Recipients':
                    column = 'recipients';
                    break;
                default:
                    column = 'created_at';
                    order = 'DESC';
                    break;
            }
            let reports = await EmailReportModel.getReport(organization_id, startIndex, limit, name, column, order, user_id);

            if (reports.length === 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "7")[language] || reportMessage.find(x => x.id === "7")["en"], null);

            const total_count = reports.length > 0 ? reports[0].total_count : 0;

            await Promise.all(reports.map(async (report) => {
                delete report.total_count;
                report.content = JSON.parse(report.content);
                report.report_types = report.report_types.split(',');
                if (report.filter_type === 2) {
                    report.employees = await EmailReportModel.getReportUser(report.id);
                } else if (report.filter_type === 3) {
                    report.departments = await EmailReportModel.getReportDept(report.id);
                }
                else if (report.filter_type === 4 && report.location_ids) {
                    report.locations = await EmailReportModel.getReportsLocation(report.location_ids);
                }
                else if (report.filter_type === 5 && report.shift_ids) {
                    report.shifts = await EmailReportModel.getReportsShift(report.shift_ids);
                }
                return report;
            }));
            // Pagination result
            const pagination = {};

            if (startIndex > 0) {
                pagination.prev = { page: page - 1, };
            }

            if (endIndex < total_count) {
                pagination.next = { page: page + 1, };
            }
            return sendResponse(res, 200, { reports, total_count, has_more_data: endIndex >= total_count ? false : true, skipValue: endIndex, pagination }, 'Email report data.', null)

        } catch (err) {
            console.log('=======', err);
            return sendResponse(res, 400, null, 'Unable to get reports', err);
        }
    }

    async deleteReports(req, res) {
        try {
            const { email_report_ids } = req.body;
            const { organization_id, language } = req.decoded;
            let validate = Validation.emailReportDelete({ email_report_ids: email_report_ids });
            if (validate.error) return sendResponse(res, 404, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"], validate.error.details[0].message);

            let deleted = await EmailReportModel.deleteReports(email_report_ids);
            if (deleted.affectedRows === 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "8")[language] || reportMessage.find(x => x.id === "8")["en"], 'Invalid Input');

            actionsTracker(req, 'Reports ? deleted.', [email_report_ids]);
            return sendResponse(res, 200, req.body, reportMessage.find(x => x.id === "9")[language] || reportMessage.find(x => x.id === "9")["en"], null);
        } catch (err) {
            console.log('===========', err);
            return sendResponse(res, 400, null, 'Unable to delete reports', 'Unable to delete reports');
        }
    }

    async reportsingle(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const email_report_id = req.query.email_report_id;
            actionsTracker(req, 'Report %i requested.', [email_report_id]);

            if (!email_report_id) return sendResponse(res, 404, null, 'email_report_id required.', null);

            let reports = await EmailReportModel.report(`organization_id=${organization_id} AND id=${email_report_id}`);
            if (reports.length === 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "7")[language] || reportMessage.find(x => x.id === "7")["en"], null);

            await Promise.all(reports.map(async (report) => {
                report.content = JSON.parse(report.content);
                report.report_types = report.report_types.split(',');
                report.custom = (report.custom !== null || report.custom != undefined) ? JSON.parse(report.custom) : null

                if (report.filter_type === 2) {
                    report.employees = await EmailReportModel.getReportUser(report.id);
                } else if (report.filter_type === 3) {
                    report.departments = await EmailReportModel.getReportDept(report.id);
                } else if (report.filter_type === 4 && report.location_ids) {
                    report.locations = await EmailReportModel.getReportsLocation(report.location_ids);
                }
                else if (report.filter_type === 5 && report.shift_ids && report.shift_ids.length) {
                    report.shifts = await EmailReportModel.getReportsShift(report.shift_ids);
                }
                return report;
            }));
            return sendResponse(res, 200, reports[0], 'Email report data.', null)

        } catch (err) {
            console.log('=======', err);
            return sendResponse(res, 400, null, 'Unable to get reports', err);
        }
    }

    async editReport(req, res) {
        try {
            const { organization_id, language } = req.decoded;

            let { value, error } = Validation.editEmailReport(req.body);
            if (error) return sendResponse(res, 404, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"], error.details[0].message);

            let { name, frequency, recipients, content, filter_type, add_user_ids, del_user_ids, add_department_ids, del_department_ids, email_report_id, report_types, custom, location_ids, shift_ids } = value;

            if (frequency == 5 && (content.productivity == 1 || content.timesheet == 1 || content.apps_usage == 1 || content.websites_usage == 1)) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if (JSON.stringify(report_types).match('pdf') && (content.hrms_attendance == '1' || content.attendance == '1')) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if ((content.hrms_attendance == '1' || content.attendance == '1') && frequency != 5) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if (frequency == 5 && !custom?.date) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            if (frequency == 9 && !custom?.time) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);

            const [rep] = await EmailReportModel.report(`organization_id=${organization_id} AND id=${email_report_id}`);
            if (!rep) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "7")[language] || reportMessage.find(x => x.id === "7")["en"], null);

            const reportByName = name ? await EmailReportModel.searchByname(name, organization_id) : [];

            if (reportByName?.length && reportByName.every(r => r.id !== +email_report_id))
                return sendResponse(res, 400, null, reportMessage.find(x => x.id === "5")[language] || reportMessage.find(x => x.id === "5")["en"], null);


            content = JSON.stringify(content);
            custom = custom ? JSON.stringify(custom) : null;
            filter_type = filter_type ? parseInt(filter_type) : filter_type;

            let report = await EmailReportModel.updateEmailReport(name, frequency, recipients, content, filter_type, email_report_id, report_types, custom, location_ids, shift_ids);

            if (filter_type !== rep.filter_type) {
                if (rep.filter_type === 2) {
                    const employee_ids = _.pluck(await EmailReportModel.getReportUser(rep.id), 'id');
                    if (employee_ids.length) await EmailReportModel.deleteUserFromReport(employee_ids, email_report_id);
                } else if (rep.filter_type === 3) {
                    const dept_ids = _.pluck(await EmailReportModel.getReportDept(rep.id), 'id');
                    if (dept_ids.length) await EmailReportModel.deleteDeptFromReport(dept_ids, email_report_id);
                }
            }

            if (filter_type === 2) {
                if (add_user_ids && add_user_ids.length > 0) {
                    let userReport = add_user_ids.map(id => [email_report_id, id]);
                    const employee_ids = _.pluck(await EmailReportModel.getReportUser(rep.id), 'id');
                    userReport = userReport.filter(x => !employee_ids.includes(x[1]));
                    if (userReport.length)
                        await EmailReportModel.addUserToReports(userReport);
                }
                if (del_user_ids?.length > 0) {
                    await EmailReportModel.deleteUserFromReport(del_user_ids, email_report_id);
                }
            } else if (filter_type === 3) {
                if (add_department_ids?.length) {
                    let deptReport = add_department_ids.map(id => [email_report_id, id]);
                    const dept_ids = _.pluck(await EmailReportModel.getReportDept(rep.id), 'id');
                    deptReport = deptReport.filter(x => !dept_ids.includes(x[1]));
                    if (deptReport.length)
                        await EmailReportModel.addDeptToReports(deptReport);
                }
                if (del_department_ids?.length) {
                    await EmailReportModel.deleteDeptFromReport(del_department_ids, email_report_id);
                }
            }

            actionsTracker(req, 'Report %i updated.', [email_report_id]);
            return sendResponse(res, 200, req.body, reportMessage.find(x => x.id === "10")[language] || reportMessage.find(x => x.id === "10")["en"], null);

        } catch (err) {
            console.log('===========', err);
            return sendResponse(res, 400, null, 'Unable to add reports', 'Unable to add reports');
        }
    }

    async unSubscribe(req, res) {
        try {
            const token = req.query.token;
            const decrypt_data = await Password.decrypt(token, process.env.CRYPTO_PASSWORD);
            let data = JSON.parse(decrypt_data);
            if (data && data.id && data.email) {
                const [rep] = await EmailReportModel.report(`id=${data.id}`);
                if (!rep) return res.send('Report not found');
                let emailIds = rep.recipients.split(',');
                if (emailIds.length === 0) return res.send('Subscribed report not found.');

                let index = emailIds.indexOf(data.email);
                if (index === -1) return res.send('Subscribed report not found.');

                emailIds.splice(index, 1);
                //if length is 0 delete report otherwise remove email id
                if (emailIds.length === 0) {
                    const deleted = await EmailReportModel.deleteReports(data.id);
                    return res.send('Email Unsubscribed.');
                } else {
                    const updated = await EmailReportModel.updateEmailReport(null, null, emailIds, null, null, data.id);
                    return res.send('Email Unsubscribed.');
                }
            } else {
                res.send('Report not found');
            }
        } catch (err) {
            console.log('====err===', err);
            res.send('Report not found');
        }
    }
}

module.exports = new EmailReportsController;