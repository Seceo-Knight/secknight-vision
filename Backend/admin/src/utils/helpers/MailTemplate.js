const moment = require('moment');

class MailTemplate {
    static getMailTemplate2FA (otp) {
        return `
            <!DOCTYPE html>
            <html lang="en">

            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>2FA</title>
            </head>

            <body>
              <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f5f5f5;
                    padding: 40px 20px;
                  ">
                <table style="
                      max-width: 600px;
                      margin: 0 auto;
                      background-color: #ffffff;
                      border-radius: 8px;
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                      overflow: hidden;
                    ">
                  <tbody>
                    <tr>
                      <td style="padding: 30px">
                        <table style="width: 100%">
                          <tbody>
                            <tr>
                              <td style="text-align: center">
                                <img src="https://empmonitor.com/wp-content/uploads/2024/08/EmpMonitor-logo-02082024.png"
                                  alt="Company Logo" style="
                                  max-width: 150px;
                                  margin-bottom: 20px;
                                  display: block;
                                  margin: 0 auto;
                                ">
                              </td>
                            </tr>
                            <tr>
                              <td style="text-align: center; padding: 20px 0">
                                <h1 style="
                                  font-size: 24px;
                                  font-weight: bold;
                                  margin-bottom: 10px;
                                ">
                                  Your 2FA Code
                                </h1>
                                <p style="color: #666666; margin-bottom: 20px">
                                  As part of our Two-Factor Authentication (2FA) process, please use the following One-Time Password (OTP) to securely access your account:
                                </p>
                                <div style="
                                  background-color: #f5f5f5;
                                  padding: 20px;
                                  border-radius: 8px;
                                  font-size: 32px;
                                  font-weight: bold;
                                  letter-spacing: 4px;
                                  margin-bottom: 20px;
                                ">
                                  ${otp}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>


            </body>

            </html>
        `
    }
}

module.exports = MailTemplate;