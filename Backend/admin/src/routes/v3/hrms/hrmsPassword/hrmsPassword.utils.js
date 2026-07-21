"use strict";
const sgMail = require('@sendgrid/mail');


exports.sendEmail = async ({ email, name, code, message }) => {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: email,
        from: process.env.EMP_SUPPORT_EMAIL,
        subject: "HRMS Password Reset",
        text: "HRMS Password Reset",
        html: `<html xmlns="http://www.w3.org/1999/xhtml">
                <head></head>
                <body bgcolor="#f8f8f8"></body>
                </html>
                <title>EmpMonitor</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet"
                    type="text/css" />
                <style type="text/css">
                    html {
                        width: 100%
                    }
                
                    ::-moz-selection {
                        background: #1D6AD2;
                        color: #fff
                    }
                
                    ::selection {
                        background: #1D6AD2;
                        color: #fff
                    }
                
                    body {
                        background-color: #f8f8f8;
                        margin: 0;
                        padding: 0
                    }
                
                    .ReadMsgBody {
                        width: 100%;
                        background-color: #f8f8f8
                    }
                
                    .ExternalClass {
                        width: 100%;
                        background-color: #f8f8f8
                    }
                
                    a {
                        color: #1D6AD2;
                        text-decoration: none;
                        font-weight: 400;
                        font-style: normal
                    }
                
                    a:hover {
                        color: #aaa;
                        text-decoration: underline;
                        font-weight: 400;
                        font-style: normal
                    }
                
                    a.heading-link {
                        text-decoration: none;
                        font-weight: 400;
                        font-style: normal
                    }
                
                    a.heading-link:hover {
                        text-decoration: none;
                        font-weight: 400;
                        font-style: normal
                    }
                
                    p,
                    div {
                        margin: 0 !important
                    }
                
                    table {
                        border-collapse: collapse
                    }
                
                    @media only screen and (max-width: 640px) {
                        table table {
                            width: 100% !important
                        }
                    
                        td[class=full_width] {
                            width: 100% !important
                        }
                    
                        div[class=div_scale] {
                            width: 440px !important;
                            margin: 0 auto !important
                        }
                    
                        table[class=table_scale] {
                            width: 440px !important;
                            margin: 0 auto !important
                        }
                    
                        td[class=td_scale] {
                            width: 440px !important;
                            margin: 0 auto !important
                        }
                    
                        img[class=img_scale] {
                            width: 100% !important;
                            height: auto !important
                        }
                    
                        img[class=divider] {
                            width: 440px !important;
                            height: 2px !important
                        }
                    
                        table[class=spacer] {
                            display: none !important
                        }
                    
                        td[class=spacer] {
                            display: none !important
                        }
                    
                        td[class=center] {
                            text-align: center !important
                        }
                    
                        table[class=full] {
                            width: 400px !important;
                            margin-left: 20px !important;
                            margin-right: 20px !important
                        }
                    
                        img[class=divider] {
                            width: 100% !important;
                            height: 1px !important
                        }
                    }
                
                    @media only screen and (max-width: 479px) {
                        table table {
                            width: 100% !important
                        }
                    
                        td[class=full_width] {
                            width: 100% !important
                        }
                    
                        div[class=div_scale] {
                            width: 280px !important;
                            margin: 0 auto !important
                        }
                    
                        table[class=table_scale] {
                            width: 280px !important;
                            margin: 0 auto !important
                        }
                    
                        td[class=td_scale] {
                            width: 280px !important;
                            margin: 0 auto !important
                        }
                    
                        img[class=img_scale] {
                            width: 100% !important;
                            height: auto !important
                        }
                    
                        img[class=divider] {
                            width: 280px !important;
                            height: 2px !important
                        }
                    
                        table[class=spacer] {
                            display: none !important
                        }
                    
                        td[class=spacer] {
                            display: none !important
                        }
                    
                        td[class=center] {
                            text-align: center !important
                        }
                    
                        table[class=full] {
                            width: 240px !important;
                            margin-left: 20px !important;
                            margin-right: 20px !important
                        }
                    
                        img[class=divider] {
                            width: 100% !important;
                            height: 1px !important
                        }
                    }
                </style>
                <!-- START OF HEADER BLOCK-->
                <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0"
                    style="margin-top: 20px;border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;border-top: 5px solid #e6e6e6;">
                    <tbody>
                        <tr>
                            <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%">
                                                <!-- START OF VERTICAL SPACER-->
                
                                                <!-- END OF VERTICAL SPACER-->
                
                                                <table border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%">
                                                                <table border="0" cellpadding="0" cellspacing="0" width="600">
                                                                    <tbody>
                                                                        <tr>
                
                                                                            <td>
                                                                                <!-- START OF LOGO IMAGE TABLE-->
                                                                                <table align="center" border="0" cellpadding="0"
                                                                                    cellspacing="0" class="full"
                                                                                    style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"
                                                                                    width="auto">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td align="center"
                                                                                                style="padding: 40px 0 30px 0; color: #2784d6; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif;">
                                                                                                Emp<span style="color: #414042;">Monitor</span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                                <!-- END OF LOGO IMAGE TABLE-->
                                                                            </td>
                
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- START OF VERTICAL SPACER-->
                
                
                                                <!-- END OF VERTICAL SPACER-->
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <!-- END OF HEADER BLOCK-->
                <!-- START OF FEATURED AREA BLOCK-->
                
                <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border: 5px solid #e6e6e6;">
                    <tbody>
                        <tr>
                            <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%">
                                                <table bgcolor="#1D6AD2" border="0" cellpadding="0" cellspacing="0" class="table_scale"
                                                    width="600">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%">
                                                                <table bgcolor="#f4f7fe" border="0" cellpadding="0" cellspacing="0"
                                                                    width="600">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style="padding: 0px;" valign="middle" width="600">
                                                                                <table align="center" border="0" cellpadding="0"
                                                                                    cellspacing="0" class="full" width="600">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td align="center"
                                                                                                class="center"
                                                                                                style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 25px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;">
                                                                                                Hello ${name}, Your OTP for ${message} Password Reset is <strong>${code}</strong></td>
                                                                                        </tr>
                                                                                        <!-- END OF HEADING-->

                                                                                        
                                                                                        <!-- START OF BUTTON-->
                                                                                        <!-- START OF Cong-->
                                                                                        <tr>
                                                                                            <td align="center" class="center"
                                                                                                style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 18px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;">
                                                                                                <span>Regards,<br /> EmpMonitor
                                                                                                    Support,<br />
                                                                                                    support@empmonitor.com<br /> Skype:
                                                                                                    empmonitorsupport </span></td>
                                                                                        </tr> <!-- END oF Cong -->
                                                                                        <!-- START OF BUTTON-->
                                                                                        <tr>
                                                                                            <td height="30" width="100%"></td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                        <!--[if gte mso 9]> </v:textbox> </v:rect> <![endif]-->
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
                <!-- END OF FEATURED AREA BLOCK-->
                <!-- START OF SOCIAL BLOCK-->
                
                <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0"
                    style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;">
                    <tbody>
                        <tr>
                            <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%">
                                                <!-- START OF VERTICAL SPACER-->
                                                <table align="center" bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0"
                                                    class="table_scale" width="600">
                                                    <tbody>
                                                        <tr>
                                                            <td height="30" width="100%"></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- END OF VERTICAL SPACER-->
                
                                                <table bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0"
                                                   >
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <table border="0" cellpadding="0" cellspacing="0" width="600">
                                                                    <tbody>
                
                                                                        <tr>
                                                                            <td align="center"
                                                                                style="margin: 0; font-size: 20px; color:#666666; font-family: Lucida Sans Unicode;">
                                                                                <span>Stay in touch</span></td>
                                                                        </tr>
                                                                        <table align="center" border="0" cellpadding="0" cellspacing="0" height="50px"
                                                                            >
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td align="center"
                                                                                        style="margin: 0; font-size:14px ; color:#aaaaaa;">
                                                                                        <span><a href="https://www.facebook.com/EmpMonitor/"
                                                                                                target="_blank" style="background-color: #3b5998; color: #ffffff; padding: 10px">
                                                                                                Facebook
                                                                                            </a> &nbsp; <a
                                                                                                href="https://twitter.com/empmonitor"
                                                                                                target="_blank" style="background-color: #00acee; color: #ffffff; padding: 10px;">
                                                                                                <!-- <i class="fa fa-twitter-square fa-2x" aria-hidden="true"></i> -->
                                                                                                Twitter
                                                                                            </a> </span></td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table> <!-- END OF RIGHT COLUMN FOR SOCIAL ICONS-->
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
                <!-- END OF SOCIAL BLOCK-->
                <!-- START OF SUB-FOOTER BLOCK-->
                
                <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0"
                    style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6; border-bottom: 5px solid #e6e6e6">
                    <tbody>
                        <tr>
                            <td valign="top">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0"
                                                   width="600">
                                                    <tbody>
                                                        <tr>
                                                            <td height="40"
                                                                style="margin: 0; font-size:12px ; color:#ededed; font-family: Helvetica, Arial, sans-serif; line-height: 18px; text-align: center;"
                                                                width="100%">Copyright &copy; 2017 - 2020 EmpMonitor. All Rights
                                                                Reserved.</td>
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
                <!-- END OF SUB-FOOTER BLOCK-->`,
    };
    return sgMail
        .send(msg)
        .then(data => {
            console.log(`-----Mail sent to ${msg.to} in sendMail-------`)
            return data;
        })
        .catch(err => {
            console.log(`-----Mail sending failed in sendMail-------`, err);
            return null;
        })
}