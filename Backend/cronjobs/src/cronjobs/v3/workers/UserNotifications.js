const SgMail = require('@sendgrid/mail');
SgMail.setApiKey(process.env.SENDGRID_API_KEY);

var Excel = require('exceljs');
var path = require('path');
const fs = require('fs');
var rimraf = require("rimraf");
const { Mailer } = require('../../../messages/Mailer');
const UserNotificationModel = require('./UserNotificationModels')
const { timezones_details: timezones } = require('../../../utils/timezones');
const moment = require('moment');
const _ = require('underscore');

const { logger: Logger } = require("../../../utils/Logger");

class UserNotifications {

    /**
        * absentReport 
        * @memberof UserNotifications
        * @description cron to generate and sending absent report
        * @returns Nothing
        * @author Guru Prasad <guruprasad@globussoft.in>
       */
    async absentReport() {

        console.log('-------------Daily Absent Report cron started-----------------')
        Logger.info(`-----------Starting for absent report ${new Date()}----------------`)
        let dirName = __dirname.split('src')[0] + '/public/absentreports';
        const now = moment();
        const reportTimezone = [];
        timezones.map(timezone => {
            const nowTz = now.tz(timezone.zone);
            if (nowTz.hour() === 0 && nowTz.minutes() < 29) {
                reportTimezone.push(timezone.zone);
            }
        });
        if (reportTimezone.length === 0) return;
        try {

            if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName) }

            // send report only for speciel admins 
            let specielAdmins = process.env.ORGANIZATION_ID.length > 0 ? process.env.ORGANIZATION_ID.toString().split(',') : [];
            if (specielAdmins.length == 0) { return }

            const orgData = await UserNotificationModel.getOrganizationsData(reportTimezone, specielAdmins);
            if (orgData.length == 0) { return }

            for (const row of orgData) {
                let rowsData = []
                const fileName = `Not_Logged_Report.xlsx`;
                const filePath = path.join(dirName, fileName)
                const workbook = new Excel.Workbook();

                //create worksheet
                const worksheet = workbook.addWorksheet("Absent Report");
                worksheet.columns = [
                    { header: 'User Name', key: 'name', width: 40 },
                    { header: 'E-mail ID', key: 'email', width: 75 },
                    { header: 'Emp Code', key: 'empcode', width: 15 },
                    { header: 'Location', key: 'location', width: 30 },
                    { header: 'Department/BU', key: 'department', width: 35 },
                    { header: 'Computer Name', key: 'compname', width: 35 },
                    { header: 'Not Reporting To Portal', key: 'notreporting', width: 22 }
                ];

                const absentEmpIds = _.pluck(await UserNotificationModel.getAbsentData(row.org_id), 'id');
                let empData = absentEmpIds.length == 0 ? null : await UserNotificationModel.getEmployeesData(row.org_id, absentEmpIds);
                const maxDate = empData != null ? await UserNotificationModel.getLastLoginData(absentEmpIds) : []

                if (absentEmpIds.length > 0) {

                    for (const val of absentEmpIds) {
                        let temp = []
                        let data = empData.filter(obj => obj.empid == val)
                        temp.push(data[0].UserName)
                        temp.push(data[0].email)
                        temp.push(data[0].empcode)
                        temp.push(data[0].Location)
                        temp.push(data[0].Department)
                        temp.push(data[0].ComputerName)

                        let maxdate = maxDate.filter(obj => obj.employee_id == val)
                        if (maxdate.length > 0) {
                            temp.push(maxdate[0].date)
                            rowsData.push(temp)
                        }
                    }

                    const admin_email = row.admin_email ? admin_email : process.env.EMP_REPORT_EMAIL;
                    rowsData = rowsData.length > 0 ? rowsData.sort(function (a, b) { return new Date(b[6]) - new Date(a[6]); }) : null;

                    let suspendedUsers = empData.filter(obj => obj.status == 2)
                    let empCodeArray = suspendedUsers.map(x => { return x.empcode })

                    if (rowsData.length > 0) {
                        rowsData.forEach(element => {
                            let row = worksheet.addRow(element)
                            if (empCodeArray.includes(element[2])) {
                                row.fill = {
                                    type: 'pattern',
                                    pattern: 'lightDown',
                                    fgColor: { argb: '708090' },
                                    bgColor: { argb: '708090' }
                                };

                                //Add comment for suspended rows
                                worksheet.getCell(row._cells[0]._address).note = {
                                    texts: [
                                        { 'font': { 'bold': true, 'size': 12, 'color': { 'theme': 1 }, 'name': 'Calibri', 'family': 2, 'scheme': 'minor' }, 'text': 'Suspended Users' },
                                    ],
                                    margins: {
                                        insetmode: 'custom',
                                        inset: [6, 0, 0.35, 0.35]
                                    }
                                }
                            }
                        });
                    }

                    let currentDate = moment(new Date()).format("DD/MM/YYYY")
                    const subject = `Employee Last Logged in List (${currentDate})`;
                    const body = `<strong>Following Employees Are Not Logged In Yesterday:</strong>`;
                    await workbook.xlsx.writeFile(filePath);

                    //read base64 content of xlsx sheet
                    let attachment = fs.readFileSync(filePath).toString("base64");

                    //send mails
                    await Mailer.sendMail({
                        from: admin_email,
                        to: row.email,
                        subject: subject,
                        text: 'Daily Absent Report',
                        html: body,
                        attachments: [
                            {
                                content: attachment,
                                filename: fileName,
                                encoding: 'base64',
                                disposition: "attachment"
                            }
                        ],
                    });
                    //need to delete for each iteration
                    fs.unlinkSync(filePath)
                }
            }
            //remove entire directory at once
            rimraf(dirName, function () { console.log("directory deleted"); });
            console.log('------------Daily Absent Report cron completed--------------')
            Logger.info(`-----------End for absent report ${new Date()}----------------`)

        } catch (error) {
            console.log('error in absent report cron', error)
        }
    }
}

module.exports = new UserNotifications();