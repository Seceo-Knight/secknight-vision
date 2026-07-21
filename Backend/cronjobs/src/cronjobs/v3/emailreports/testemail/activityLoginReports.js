const moment = require("moment");
const momentTimezone = require('moment-timezone')
const _ = require("underscore");
const { createObjectCsvWriter } = require('csv-writer');
const rimraf = require('rimraf');
const Temp = require('temp');

const { logger: Logger } = require('../../../../utils/Logger');
const  {emailReportsModel}  = require('../emailreports.model');
const { Mailer } = require('../../../../messages/Mailer');
const htmlTemplate = require("../mailtemplate/activityLogsTemplate");

class LogsReportBuilder {
    constructor({ timezone, name, organization_id, frequency, recipients, language, report_types, filterType, empIds, depIds }) {
        this.arguments = { timezone, name, organization_id, frequency,  recipients, language, report_types,   filterType, empIds, depIds };
        Object.assign(this, this.arguments);
    }

    getCvsWriter(fileName, header) {
        const filePath = `${this.dirName}/${fileName}`;
        const csvWriter = createObjectCsvWriter({ path: filePath, header });
        return { filePath, csvWriter };
    };

    async finalize() {
        try {
            if (!('dirName' in this)) return Promise.resolve();
            return new Promise((resolve) => {
                rimraf(this.dirName, {}, () => {
                    resolve();
                });
            });
        } catch (err) {
            Logger.error(`-managerTL----Logs--csv1---${err}'---`);
            return Promise.reject(err);
        }
    }

    async LogsCSV(fileName) {
        try {

            this.dirName = Temp.mkdirSync('csvWriter');
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'employeeName', title: "Employee Name" },
                { id: 'email', title: "Email" },
                { id: 'department', title: "Department"},
                { id: 'location', title: "Location"},
                { id: 'type', title: "Type" },
                { id: 'logIn', title: "Login" },
                { id: 'logOut', title: "Logout" },
               
            ]);
          
            for (const log of Object.values(this.logs)) {
                await csvWriter.writeRecords([{
                    employeeName: log.employeeName,
                    email: log.email,
                    department: log.department,
                    location: log.location,
                    type: log.type,
                    logIn:log.logIn,
                    logOut:log.logOut,
                    ...log.details
                }]);
            }
            return filePath;
        } catch (err) {
            Logger.error(`-managerTL----Logs--csv2---${err}'---`);
            return Promise.reject(err);
        }
    }

    async sendMail() {
        Logger.info(`======managerTL======Logs===== In Send Mail Function ==========`);
        try {
            this.dateTo = moment().format('YYYY-MM-DD');
            this.dateFrom = moment().subtract(1, 'months').format('YYYY-MM-DD');

            let userData = [];
            let empids = [];

            let result = [];

            let column = 'ea.date';
            let order = `DESC`;
        

           let logs = await emailReportsModel.GetLogsforEmployee({ organization_id: this.organization_id, start_date: this.dateFrom, end_date: this.dateTo,  column, order });
           
           if (logs.length === 0) return true;

           empids = _.pluck(logs, 'employeeId');

           userData = await emailReportsModel.getEmployeeDetails(this.organization_id, empids);
            if (this.filterType == 1) result = logs;

            
            logs.forEach((log) => {
                userData.forEach((user) => {
                  if (log.employeeId == user.id) {
                    log.employeeName = user?.first_name + '' + user?.last_name;
                    log.email = user?.email;
                    log.department = user?.department;
                    log.location = user?.location;
                    log.logIn = momentTimezone.utc(log.logIn).tz(this.timezone).format('YYYY-MM-DD HH:mm:ss')
                    log.logOut =log.logOut ? momentTimezone.utc(log.logOut).tz(this.timezone).format('YYYY-MM-DD HH:mm:ss') : 'session expired'
                  }
                });
              });

            this.logs = logs;

            let attachments = [];
            let htmlFormat;
            const filename = `${this.name}_${moment().format("YYYY-MM-DD")}__activityLogs_employee.csv`;
            const path = await this.LogsCSV(filename);
            attachments.push({ filename, path });
            Logger.info(`------Logs Employee Report-----${path}-----------`);
            const empAdminEmail = process.env.EMP_REPORT_EMAIL;
            const empReportBccEmail = process.env.EMP_REPORT_BCC_MAIL
            htmlFormat = await htmlTemplate(this.name, moment().format('YYYY-MM-DD'));

            return Mailer.sendMail({
                from: empAdminEmail,
                to: this.recipients,
                subject: this.name,
                text: this.name,
                html: htmlFormat,
                attachments: attachments,
                bcc: empReportBccEmail
            });
        } catch (err) {
            Logger.error(`-managerTL----Logs--csv3---${err}'---`);
            return Promise.reject(err);
        }
    }

}


module.exports.LogsReportBuilder = LogsReportBuilder;