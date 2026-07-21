const nodemailer = require('nodemailer');

/**
 * Returns a usable transport config for nodemailer.createTransport().
 *
 * SMTP_URL must be a real SMTP connection URL (e.g.
 * "smtps://user:pass@smtp.example.com:465"). If it's missing or still set to
 * the placeholder from sample.env, fall back to nodemailer's jsonTransport so
 * the app can boot without a configured mail server — sendMail() then just
 * serialises the message to JSON instead of delivering it (and we warn once).
 */
function resolveTransportConfig() {
    const url = process.env.SMTP_URL;
    const isValidSmtpUrl =
        typeof url === 'string' &&
        /^smtps?:\/\//i.test(url.trim());

    if (isValidSmtpUrl) return url.trim();

    console.warn(
        '[Mailer] SMTP_URL is missing or invalid (' +
        (url ? `"${url}"` : 'undefined') +
        '). Falling back to a no-op JSON transport — emails will NOT be sent. ' +
        'Set SMTP_URL to a valid smtp:// or smtps:// URL to enable mail.'
    );
    return { jsonTransport: true };
}

let transport, nodemailerMock;
if (process.env.NODE_ENV === 'test') {
    nodemailerMock = require('nodemailer-mock');
    transport = nodemailerMock.createTransport(resolveTransportConfig());
} else {
    transport = nodemailer.createTransport(resolveTransportConfig());
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
