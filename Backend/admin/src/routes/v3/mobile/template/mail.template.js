const moment = require('moment');

module.exports = {
    'OTP_MAIL_SILAH': ({ otp, name, support_email, skype, facebook, twitter, product_name }) => {
        return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>OTP for password reset.</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
              rel="stylesheet"
              type="text/css"
            />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
              href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
              rel="stylesheet"
            />
          </head>
        
          <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0">
            <div>
              <table style="margin: auto; box-shadow: 0 0 10px 4px #ccc">
                <tbody>
                  <tr>
                    <td>
                      <table
                        style="margin-top: 20px"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        align="center"
                      >
                        <tbody>
                          <tr>
                            <td width="100%" valign="top">
                              <table cellspacing="0" cellpadding="0" border="0">
                                <tbody>
                                  <tr>
                                    <td width="100%">
                                      <table
                                        width="600"
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                      >
                                        <tbody>
                                          <tr>
                                            <td width="100%">
                                              <table
                                                width="600"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                              >
                                                <tbody>
                                                  <tr>
                                                    <td>
                                                      <table
                                                        style="
                                                          border-collapse: collapse;
                                                        "
                                                        width="auto"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                        align="center"
                                                      >
                                                        <tbody>
                                                          <tr>
                                                            <td
                                                              style="
                                                                padding: 40px 0 30px 0;
                                                              "
                                                              align="center"
                                                            >
                                                              <img
                                                                src="https://tts.silah.com.sa/assets/images/logos/c153766965d3439be0743c112676437a.png"
                                                                alt="Logo"
                                                                width="200px"
                                                              />
                                                            </td>
                                                          </tr>
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
        
                      <table cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                          <tr>
                            <td width="100%" valign="top">
                              <table cellspacing="0" cellpadding="0" border="0">
                                <tbody>
                                  <tr>
                                    <td width="100%">
                                      <table
                                        width="600"
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                        bgcolor="#1D6AD2"
                                      >
                                        <tbody>
                                          <tr>
                                            <td width="100%">
                                              <table
                                                width="600"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                                bgcolor="#f9ebec"
                                              >
                                                <tbody>
                                                  <tr>
                                                    <td
                                                      style="padding: 0px"
                                                      width="600"
                                                      valign="middle"
                                                    >
                                                      <table
                                                        width="600"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                        align="center"
                                                      >
                                                        <tbody>
                                                          <tr>
                                                            <td
                                                              style="
                                                                margin: 0;
                                                                padding-bottom: 15px;
                                                                margin: 0;
                                                                font-size: 25px;
                                                                color: #0d1a2b;
                                                                line-height: 25px;
                                                                padding-left: 10px;
                                                                padding-right: 10px;
                                                              "
                                                              align="center"
                                                            >
                                                              <p>
                                                                To reset your password,
                                                                please use the following
                                                                One-Time Password (OTP)
                                                                code: <b>${otp}</b>.
                                                              </p>
                                                            </td>
                                                          </tr>
        
                                                          <tr>
                                                            <td
                                                              style="
                                                                font-size: 18px;
                                                                margin-block: 1rem;
                                                                text-align: center;
                                                              "
                                                            >
                                                              <p
                                                                style="
                                                                  padding-left: 10px;
                                                                  padding-right: 10px;
                                                                  mix-blend-mode: 2rem;
                                                                "
                                                              >
                                                                Please enter this OTP
                                                                code on the password
                                                                reset page to create a
                                                                new password for your
                                                                account. This OTP code
                                                                is valid for a limited
                                                                time only.
                                                                <br /><br />
                                                                If you did not request
                                                                this password reset,
                                                                please ignore this
                                                                email. Your account is
                                                                secure and no changes
                                                                have been made.
                                                                <br /><br />
                                                                If you have any
                                                                questions or need
                                                                further assistance,
                                                                please contact our
                                                                support team at
                                                                <a
                                                                  href="mailto:${support_email}"
                                                                  rel="noreferrer"
                                                                  target="_blank"
                                                                  >${support_email}</a
                                                                >
                                                              </p>
                                                            </td>
                                                          </tr>
        
                                                          <tr>
                                                            <td
                                                              width="100%"
                                                              height="30"
                                                            ></td>
                                                          </tr>
        
                                                          <tr>
                                                            <td
                                                              style="
                                                                margin: 0;
                                                                padding-bottom: 15px;
                                                                margin: 0;
                                                                font-size: 18px;
                                                                color: #0d1a2b;
                                                                line-height: 25px;
                                                              "
                                                              align="center"
                                                            >
                                                              <span
                                                                >Regards,<br />
                                                                EmpMonitor Support,<br />
                                                                <span>
                                                                  <a
                                                                    href="mailto:${support_email}"
                                                                    rel="noreferrer"
                                                                    target="_blank"
                                                                    >${support_email}</a
                                                                  >
                                                                </span>
                                                                <br />
                                                                <span>
                                                                  Skype:
                                                                  ${skype}
                                                                </span>
                                                              </span>
                                                            </td>
                                                          </tr>
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
        
                      <table
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        bgcolor="#f8f8f8"
                        align="center"
                      >
                        <tbody>
                          <tr>
                            <td width="100%" valign="top">
                              <table cellspacing="0" cellpadding="0" border="0">
                                <tbody>
                                  <tr>
                                    <td width="100%">
                                      <table
                                        width="600"
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                        bgcolor="#ffffff"
                                        align="center"
                                      >
                                        <tbody>
                                          <tr>
                                            <td width="100%" height="30"></td>
                                          </tr>
                                        </tbody>
                                      </table>
        
                                      <table
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                        bgcolor="#ffffff"
                                      >
                                        <tbody>
                                          <tr>
                                            <td>
                                              <table
                                                width="600"
                                                cellspacing="0"
                                                cellpadding="0"
                                                border="0"
                                              >
                                                <tbody>
                                                  <tr>
                                                    <td
                                                      style="
                                                        margin: 0;
                                                        font-size: 20px;
                                                        color: #666666;
                                                      "
                                                      align="center"
                                                    >
                                                      <span>Stay in touch</span>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td>
                                                      <table
                                                        height="50px"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        border="0"
                                                        align="center"
                                                      >
                                                        <tbody>
                                                          <tr>
                                                            <td
                                                              style="
                                                                margin: 0;
                                                                font-size: 14px;
                                                                color: #aaaaaa;
                                                              "
                                                              align="center"
                                                            >
                                                              <span
                                                                ><a
                                                                  href="${facebook}"
                                                                  style="
                                                                    background-color: #3b5998;
                                                                    color: #ffffff;
                                                                    padding: 10px;
                                                                    text-decoration: none;
                                                                  "
                                                                  rel="noreferrer"
                                                                  target="_blank"
                                                                >
                                                                  Facebook
                                                                </a> </span
                                                              >&nbsp;<span>
                                                                <a
                                                                  href="${twitter}"
                                                                  style="
                                                                    background-color: #00acee;
                                                                    color: #ffffff;
                                                                    padding: 10px;
                                                                    text-decoration: none;
                                                                  "
                                                                  rel="noreferrer"
                                                                  target="_blank"
                                                                >
                                                                  Twitter
                                                                </a>
                                                              </span>
                                                            </td>
                                                          </tr>
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
        
                      <table
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        bgcolor="#f8f8f8"
                        align="center"
                      >
                        <tbody>
                          <tr>
                            <td valign="top">
                              <table cellspacing="0" cellpadding="0" border="0">
                                <tbody>
                                  <tr>
                                    <td>
                                      <table
                                        width="600"
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                        bgcolor="#666666"
                                        align="center"
                                      >
                                        <tbody>
                                          <tr>
                                            <td
                                              style="
                                                margin: 0;
                                                font-size: 13px;
                                                color: #ffffff;
                                                text-align: center;
                                                background: #d01f27;
                                                padding-block: 8px;
                                              "
                                              width="100%"
                                              height="40"
                                            >
                                              Copyright © 2020-${moment().format('YYYY')} ${product_name}. All
                                              Rights Reserved..
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
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