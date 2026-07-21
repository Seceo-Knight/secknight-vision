const moment = require("moment");
const _ = require("underscore");
const { createObjectCsvWriter } = require('csv-writer');
const rimraf = require('rimraf');
const Temp = require('temp');


const { emailReportsModel: reportModel } = require('../emailreports.model');
const { Mailer } = require('../../../../messages/Mailer');
const htmlTemplate = require("../mailtemplate/unProdTemplate");

class UnReportBuilder {
    constructor({ timezone, name, organization_id, frequency, content, recipients, language, report_types, custom, orgProductiveHours, filterType, empIds, depIds }) {
        this.arguments = { timezone, name, organization_id, frequency, content, recipients, language, report_types, custom, orgProductiveHours, filterType, empIds, depIds };
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
            console.log('-------csv1--------', err);
            return Promise.reject(err);
        }
    }

    async UnProductiveCSV(fileName) {
        try {

            this.dirName = Temp.mkdirSync('csvWriter');
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'employee_id', title: "Employee Id" },
                { id: 'employee_name', title: "Employee Name" },
                { id: 'department', title: "department" },
                { id: 'location', title: "location" },
                { id: moment().subtract(7, 'd').format("YYYY-MM-DD"), title: moment().subtract(7, 'd').format("Do MMM YYYY") },
                { id: moment().subtract(6, 'd').format("YYYY-MM-DD"), title: moment().subtract(6, 'd').format("Do MMM YYYY") },
                { id: moment().subtract(5, 'd').format("YYYY-MM-DD"), title: moment().subtract(5, 'd').format("Do MMM YYYY") },
                { id: moment().subtract(4, 'd').format("YYYY-MM-DD"), title: moment().subtract(4, 'd').format("Do MMM YYYY") },
                { id: moment().subtract(3, 'd').format("YYYY-MM-DD"), title: moment().subtract(3, 'd').format("Do MMM YYYY") },
                { id: moment().subtract(2, 'd').format("YYYY-MM-DD"), title: moment().subtract(2, 'd').format("Do MMM YYYY") },
                { id: moment().subtract(1, 'd').format("YYYY-MM-DD"), title: moment().subtract(1, 'd').format("Do MMM YYYY") },
            ]);


            for (const attendance of Object.values(this.unProdEmployee)) {
                await csvWriter.writeRecords([{
                    employee_id: attendance.employee_id,
                    employee_name: attendance.first_name + " " + attendance.last_name,
                    department: attendance.department,
                    location: attendance.location,
                    ...attendance.details
                }]);
            }
            return filePath;
        } catch (err) {
            console.log('-----csv2------', err);
            return Promise.reject(err);
        }
    }

    async sendMail() {
        console.log("================= In Send Mail Function ==========");
        try {
            this.dateTo = moment().subtract(1, 'd').format('YYYY-MM-DD');
            this.dateFrom = moment().subtract(7, 'd').format('YYYY-MM-DD');

            let productivity;
            let userData = [];
            let empids = [];
            let dates = [];

            let result = [];

            let column = 'ea.date';
            let order = `DESC`;

            userData = await reportModel.getAttendance(this.organization_id, this.dateFrom, this.dateTo, column, order);
            if (userData.length === 0) return true;

            empids = _.pluck(userData, 'id');
            dates = _.pluck(userData, 'date');
            productivity = await reportModel.GetProductivity({ organization_id: this.organization_id, empids, dates, dateFrom: this.dateFrom, dateTo: this.dateTo, orgProductiveHours: this.orgProductiveHours, column, order });

            let tempresult = userData.map((user, i) => {
                let temp = productivity.find(element => (element.date === user.date && element.employee_id === user.id))
                if (temp) {
                    delete temp.total_count;
                    return {
                        ...temp,
                        ...user,
                        details: user.details ? JSON.parse(user.details) : null,
                        offline: user.total_time - temp.office_time
                    };
                } else {
                    return {
                        ...user,
                        details: user.details ? JSON.parse(user.details) : null,
                        productive_duration: 0,
                        non_productive_duration: 0,
                        neutral_duration: 0,
                        idle_duration: 0,
                        break_duration: 0,
                        computer_activities_time: 0,
                        office_time: 0,
                        productivity: 0,
                        offline: user.total_time - 0,
                    };
                }
            });

            if (this.filterType == 1) result = tempresult;

            if (this.filterType != 1) {
                tempresult?.filter((item) => {
                    if (this.filterType == 3 && this.depIds?.includes(item?.department_id)) result.push(item);
                    if (this.filterType == 2 && this.empIds?.includes(item?.id)) result.push(item);
                });
            }

            let unique_EMPIds = _.pluck(result, "employee_id")?.reduce(function (acc, curr) {
                if (!acc.includes(curr))
                    acc.push(curr);
                return acc;
            }, []);

            result = result?.reduce(function (results, org) {
                (results[org.id] = results[org.id] || []).push(org);
                return results;
            }, {})

            let unProdEmployeeobj = {};

            unique_EMPIds.map((item) => {
                let count = 0
                // For Employees Work for 6 days or more than 6 days
                if (result[item].length >= 6) {
                    result[item].map((x) => {
                        if (x.productivity < 60) count++;
                    })
                    if (count >= 4) {
                        unProdEmployeeobj[item] = result[item];
                    }
                }
                // For Employees work for 5 days or more than 5 days
                else if (result[item].length == 5) {
                    result[item].map((x) => {
                        if (x.productivity < 60) count++;
                    })
                    if (count >= 3) {
                        unProdEmployeeobj[item] = result[item];
                    }
                }
                else if (result[item].length == 4) {
                    result[item].map((x) => {
                        if (x.productivity < 60) count++;
                    })
                    if (count >= 2) {
                        unProdEmployeeobj[item] = result[item];
                    }
                }
                else if (result[item].length == 3) {
                    result[item].map((x) => {
                        if (x.productivity < 60) count++;
                    })
                    if (count >= 1) {
                        unProdEmployeeobj[item] = result[item];
                    }
                }
                // For Employees who worked for less than 3 days
                else {
                    result[item].map((x) => {
                        if (x.productivity < 60) count++;
                    })
                    if (count != 0) {
                        unProdEmployeeobj[item] = result[item];
                    }
                }
            });

            let unProdEmployee = [];

            for (const attendance of Object.values(unProdEmployeeobj)) {
                let temp = {
                    employee_id: attendance[0].employee_id,
                    department: attendance[0].department,
                    location: attendance[0].location,
                    first_name: attendance[0].first_name,
                    last_name: attendance[0].last_name,
                    emp_code: attendance[0].emp_code,
                }
                let details = {};
                attendance.map((item) => {
                    details[item.date] = Math.round(item?.productivity * 100) / 100;
                });
                temp["details"] = details;
                unProdEmployee.push(temp);
            }

            this.unProdEmployee = unProdEmployee;

            let attachments = [];
            let htmlFormat;
            const filename = `${this.name}_${moment().format("YYYY-MM-DD")}__unproductive_employee.csv`;
            const path = await this.UnProductiveCSV(filename);
            attachments.push({ filename, path });
            console.log(`------Unproductivity Employee Report-----${path}-----------`);
            const empAdminEmail = process.env.EMP_REPORT_EMAIL;
            htmlFormat = await htmlTemplate(this.name, moment().format('YYYY-MM-DD'));

            return Mailer.sendMail({
                from: empAdminEmail,
                to: this.recipients,
                subject: this.name,
                text: this.name,
                html: htmlFormat,
                attachments: attachments,
            });
        } catch (err) {
            console.log('-------3-------', err);
            return Promise.reject(err);
        }
    }

}


module.exports.UnReportBuilder = UnReportBuilder;