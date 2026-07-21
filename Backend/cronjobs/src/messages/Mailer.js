const nodemailer = require('nodemailer');

let transport, nodemailerMock;
if (process.env.NODE_ENV === 'test') {
    nodemailerMock = require('nodemailer-mock');
    transport = nodemailerMock.createTransport(process.env.SMTP_URL);
} else {
    transport = nodemailer.createTransport(process.env.SMTP_URL);
}

class Mailer {
    /**
     * Connect to SMTP server
     *
     * @returns {Promise}
     */
    static async verify() {
        return transport.verify()
            .then(() => {
                console.log('Server is ready to take our messages!!!');
            }).catch((error) => {
                console.error(error);
            });
    }

    /**
     * Send mail
     *
     * @param {object} params https://nodemailer.com/message/
     * @returns {Promise}
     */
    static async sendMail(params) {
        return transport.sendMail(params);
    }

    static isIdle() {
        return transport.isIdle();
    }

    static close() {
        return transport.close();
    }
}


if (process.env.NODE_ENV === 'test') {
    class Mock {
        static reset() {
            return nodemailerMock.mock.reset();
        }

        static messages() {
            return nodemailerMock.mock.getSentMail();
        }

        static lastMessage() {
            const mails = [...this.messages()];
            return mails.pop();
        }

        static shouldFailOnce() {
            return nodemailerMock.mock.setShouldFailOnce();
        }

        static shouldFail(shouldFail) {
            return nodemailerMock.mock.setShouldFail(shouldFail);
        }
    }

    Mailer.Mock = Mock;
}

module.exports.Mailer = Mailer;
