const configFile = require('../../../../../config/config');

const Model = require('./eventAlertEmail.model');
const { Mailer } = require('../../../messages/Mailer');
const template = require('./template');
const redisServices = require('../../../database/redisConnection');

class EventAlertEmailController {
    static async sendEmailAlert(cb) {
        /*
          This cronjob runs every day at 10 AM an filter out employee having birthday tomorrow.
          - Get list of employee from default organization id
          - filter out employee with birthday
        */
        console.log("Started for Birthday mail")
        try {
            let organizations = await Model.getOrganization(configFile.EMPLOYEE_ALERT_BIRTHDAY);
            for (const orgDetails of organizations) {
                let employeeDetails = await Model.getEmployees(orgDetails.id);
                if(employeeDetails.length === 0) continue;

                for (const empDetail of employeeDetails) {
                    let html = template(`${empDetail.first_name} ${empDetail.last_name}`, `Team`);
    
                    let [to, cc, bcc] = await Promise.all([
                        redisServices.getAsync(`${orgDetails.id}_birthday_to`),
                        redisServices.getAsync(`${orgDetails.id}_birthday_cc`),
                        redisServices.getAsync(`${orgDetails.id}_birthday_bcc`)
                    ])
        
                    if(!to) continue; 
                    if(to) to = to.split(',')
                    if(cc) cc = cc.split(',')
                    if(bcc) bcc = bcc.split(',')
                    
                
                    let mailerDetails = {
                        from: process.env.EMP_REPORT_EMAIL,
                        to: to,
                        bcc: configFile.AUTO_EMAIL_REPORT_BCC,
                        subject: `${empDetail.first_name} ${empDetail.last_name} - Birthday Reminder`,
                        html: html,
                    }
                    if(cc) mailerDetails.cc = cc;
                    if(bcc) mailerDetails.bcc = [...bcc, ...configFile.AUTO_EMAIL_REPORT_BCC];
                    await Mailer.sendMail(mailerDetails);
                    console.log(`Sending Mail for ${empDetail.first_name} ${empDetail.last_name}`)
                }
            }
            return cb();
        }
        catch (e) {
            console.log("Error in Birthday Event Mail", e);
            return cb();
        }
    }
}

module.exports = EventAlertEmailController;