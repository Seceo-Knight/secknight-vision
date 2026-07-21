"use strict";
const sgMail = require('@sendgrid/mail');

class MailHelper {
    async sendRoprtMail(email, subject, body) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'admin@empmonitor.com',
            subject: subject,
            text: subject,
            html: body,
        };
        return sgMail
            .send(msg)
            .then(data => {
                return data;
            })
            .catch(err => {
                return null;
            })
    }
}

module.exports = new MailHelper;