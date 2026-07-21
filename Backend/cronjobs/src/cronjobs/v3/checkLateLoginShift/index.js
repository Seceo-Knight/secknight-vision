const Model = require('./model');

const moment = require("moment-timezone");

const Temp = require('temp');

const configFile = require("../../../../../config/config");
const { createObjectCsvWriter } = require('csv-writer');
const rimraf = require('rimraf');

const mailTemplate = require("./mailTemplate");
const { Mailer } = require('../../../messages/Mailer');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const redisServices = require("../../../database/redisConnection");

class CheckLateLoginBasedOnShift {

    static async checkLateLoginBasedOnShift(cb) {
        try {
            let commonTimeZone = await Model.findCommonTimeZone(configFile.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS);
            let allOrganizationShift = await Model.getOrganizationShift(configFile.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS);

            let [is_notification_enable, is_sms_enable, emails] = await Promise.all([
                redisServices.getAsync(`${configFile.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS}_is_notification_enable`),
                redisServices.getAsync(`${configFile.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS}_is_sms_enable`),
                redisServices.getAsync(`${configFile.CUSTOM_AUTO_EMAIL_LATE_LOGIN_CRONJOBS}_emails`),
            ])


            let currentActiveTimeZone = [];

            for (const tz of commonTimeZone) {
                const currentTZTime = moment().tz(tz.timezone);
                let isActiveShift = allOrganizationShift.filter(i => {
                    let tempShiftData = JSON.parse(i.shift_data)[currentTZTime.format('dddd').substring(0, 3).toLowerCase()];
                    if (tempShiftData.status) {

                        let latePeriod = moment.duration(i.late_period).asMinutes();
                        const shiftMoment = moment.tz(tempShiftData.time.start, 'HH:mm', tz.timezone).add(latePeriod, 'minutes');

                        if (shiftMoment.format('HH:mm') == currentTZTime.format('HH:mm')) {
                            return true;
                        }
                        else return false;
                    } else return false;
                })

                isActiveShift = isActiveShift.map(i => {
                    let temp = { ...i, timezone: tz.timezone };
                    return temp;
                });

                if (isActiveShift.length) currentActiveTimeZone = [...isActiveShift, ...currentActiveTimeZone];
            }

            let tdirname;

            for (const cTZone of currentActiveTimeZone) {
                let absentUser = [];
                let date = moment.utc().utcOffset(moment.tz(cTZone.timezone).utcOffset()).format("YYYY-MM-DD")
                let employeeAssignToShifts = await Model.getEmployeeAssignToShift(cTZone.shift_id, date, cTZone.timezone); //! Error

                for (const employeeAssignToShift of employeeAssignToShifts) {
                    if (employeeAssignToShift?.attendance_id == null) absentUser.push({ ...employeeAssignToShift, shift_name: cTZone.shift_name });
                }
                
                // Send SMS to user via Twilio
                for (const absUsr of absentUser) {

                    try {
                        if (absUsr.contact_number) {
                            if(is_sms_enable == "1") {
                                await sendSMS(absUsr.contact_number, `${absUsr.first_name} ${absUsr.last_name}`);
                                absUsr.message = "Success" // Adding SMS Status to CSV
                            }
                            else {
                                absUsr.message = "SMS Disable"
                            }
                        }
                        else {
                            absUsr.message = "Phone Number not found" // Adding SMS Status to CSV
                        }
                    }
                    catch (error) {
                        absUsr.message = error.message;
                    }
                }

                if(absentUser.length == 0) return true;
                
                let attachments = [];
                let filename = `${date}_lateLogin.csv`
                let { filePath, dirname } = await writeDataToCSV(filename, absentUser);
                if (filePath && dirname) {
                    tdirname = dirname;
                }
                attachments.push({ filename, path: filePath });
                console.log(filePath, "----------Absent Usr----------")
                let htmlFormat = await mailTemplate(date);
                const empAdminEmail = process.env.EMP_REPORT_EMAIL;

                if(is_notification_enable == "1" && emails) await Mailer.sendMail({
                    from: empAdminEmail,
                    to: JSON.parse(emails),
                    bcc: configFile.AUTO_EMAIL_REPORT_BCC,
                    subject: "Absent User List",
                    text: "Absent User List",
                    html: htmlFormat,
                    attachments: attachments,
                })

                try {
                    if (!tdirname) return Promise.resolve();
                    return new Promise((resolve) => {
                        rimraf(tdirname, {}, () => {
                            resolve();
                        });
                    });
                } catch (err) {
                    console.log('-------csv1--------', err);
                    return Promise.reject(err);
                }
            }
        } catch (error) {
            console.log(error);
        }
        cb();
    }
}

module.exports = CheckLateLoginBasedOnShift;


function getCvsWriter(fileName, header) {
    const dirname = Temp.mkdirSync('csvWriter');
    const filePath = `${dirname}/${fileName}`;
    const csvWriter = createObjectCsvWriter({ path: filePath, header });
    return { filePath, csvWriter, dirname };
};

const writeDataToCSV = async (fileName, data) => {
    try {


        const { filePath, csvWriter, dirname } = getCvsWriter(fileName, [
            // { id: 'employee_id', title: "Employee Id" },
            { id: 'first_name', title: "First Name" },
            { id: 'last_name', title: "Last Name" },
            { id: 'email', title: "Employee Email" },
            { id: 'emp_code', title: "Employee Code" },
            { id: 'location_name', title: "Location" },
            { id: 'department_name', title: "Location" },
            { id: 'shift_name', title: "Shift Name" },
            { id: 'message', title: "Message Status" },
        ]);


        for (const attendance of data) {
            await csvWriter.writeRecords([{
                first_name: attendance.first_name,
                last_name: attendance.last_name,
                email: attendance.email,
                emp_code: attendance.emp_code,
                location_name: attendance.location_name,
                department_name: attendance.department_name,
                shift_name: attendance.shift_name,
                message: attendance.message,
            }]);
        }
        return { filePath, dirname };
    } catch (err) {
        console.log('-----csv2------', err);
        return Promise.reject(err);
    }
}

const sendSMS = (phone_number, full_name) => {
    return client.messages
        .create({
            body: `Hi ${full_name},
                    You are informed that you have not logged in today.
                    Thank you.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone_number.includes('+') ? phone_number : `+${phone_number}`
        })
}