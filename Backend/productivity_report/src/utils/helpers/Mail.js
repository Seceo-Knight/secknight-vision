"use strict";
const sgMail = require('@sendgrid/mail');
const nodemailer = require("nodemailer");

class Mail {
    async sendMail_old(email, message, subject, name, cb) {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,

            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        let mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: email,
            subject: subject,
            html: `Hello ${name} </br></br>
            
            ${message}. </br></br>

            Link : <a href="http://app.empmonitor.com">SecKnight Vision</a>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                cb(error, null)
            } else {
                cb(null, info)
            }

        });
    }

    async sendMail(email, message, subject, name, password, role, cb) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'admin@empmonitor.com',
            subject: subject,
            text: subject,
            html: `<html xmlns="http://www.w3.org/1999/xhtml">
                    <head>
                    </head>
                    <body bgcolor="#f8f8f8"></body>
                    </html>
                    <br />
                    <br />
                    <br />
                    <br />
                    <title>SecKnight Vision</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
                    <style type="text/css">html {
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
                                margin: 0!important
                            }
                            table {
                                border-collapse: collapse
                            }
                            @media only screen and (max-width: 640px) {
                                table table {
                                    width: 100%!important
                                }
                                td[class=full_width] {
                                    width: 100%!important
                                }
                                div[class=div_scale] {
                                    width: 440px!important;
                                    margin: 0 auto!important
                                }
                                table[class=table_scale] {
                                    width: 440px!important;
                                    margin: 0 auto!important
                                }
                                td[class=td_scale] {
                                    width: 440px!important;
                                    margin: 0 auto!important
                                }
                                img[class=img_scale] {
                                    width: 100%!important;
                                    height: auto!important
                                }
                                img[class=divider] {
                                    width: 440px!important;
                                    height: 2px!important
                                }
                                table[class=spacer] {
                                    display: none!important
                                }
                                td[class=spacer] {
                                    display: none!important
                                }
                                td[class=center] {
                                    text-align: center!important
                                }
                                table[class=full] {
                                    width: 400px!important;
                                    margin-left: 20px!important;
                                    margin-right: 20px!important
                                }
                                img[class=divider] {
                                    width: 100%!important;
                                    height: 1px!important
                                }
                            }
                            @media only screen and (max-width: 479px) {
                                table table {
                                    width: 100%!important
                                }
                                td[class=full_width] {
                                    width: 100%!important
                                }
                                div[class=div_scale] {
                                    width: 280px!important;
                                    margin: 0 auto!important
                                }
                                table[class=table_scale] {
                                    width: 280px!important;
                                    margin: 0 auto!important
                                }
                                td[class=td_scale] {
                                    width: 280px!important;
                                    margin: 0 auto!important
                                }
                                img[class=img_scale] {
                                    width: 100%!important;
                                    height: auto!important
                                }
                                img[class=divider] {
                                    width: 280px!important;
                                    height: 2px!important
                                }
                                table[class=spacer] {
                                    display: none!important
                                }
                                td[class=spacer] {
                                    display: none!important
                                }
                                td[class=center] {
                                    text-align: center!important
                                }
                                table[class=full] {
                                    width: 240px!important;
                                    margin-left: 20px!important;
                                    margin-right: 20px!important
                                }
                                img[class=divider] {
                                    width: 100%!important;
                                    height: 1px!important
                                }
                            }
                    </style>
                    <!-- START OF HEADER BLOCK-->
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px;border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;border-top: 5px solid #e6e6e6;">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%"><!-- START OF VERTICAL SPACER-->
                                            <table align="center" bgcolor="#0f48d5" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="20" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER-->
                        
                                            <table bgcolor="#0f48d5" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td width="100%">
                                                        <table border="0" cellpadding="0" cellspacing="0" width="600">
                                                            <tbody>
                                                                <tr>
                                                                    <td class="spacer" width="20"></td>
                                                                    <td width="540"><!-- START OF LOGO IMAGE TABLE-->
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="auto">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" class="center" style="padding: 0px; text-transform: uppercase; font-family: Lucida Sans Unicode; color:#666666; font-size:24px; line-height:34px;"><span><a href="#" style="color:#0f48d5;"><img alt="SecKnight Vision" border="0" height="55" src="https://cdn.shortpixel.ai/client/q_glossy,ret_img/https://empmonitor.com/wp-content/uploads/2019/03/EmpMonitorLogo.png" style="display: inline;" width="auto" /> </a> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!-- END OF LOGO IMAGE TABLE--></td>
                                                                    <td class="spacer" width="30"></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- START OF VERTICAL SPACER-->
                        
                                            <table align="center" bgcolor="#0f48d5" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="20" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--></td>
                                        </tr>
                                    </tbody>
                                </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- END OF HEADER BLOCK--><!-- START OF FEATURED AREA BLOCK-->
                        
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%">
                                            <table bgcolor="#1D6AD2" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td width="100%">
                                                        <table bgcolor="#1D6AD2" border="0" cellpadding="0" cellspacing="0" width="600"><!--[if gte mso 9]> <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:315px;"> <v:fill type="tile" src="http://i.imgur.com/5Udx4T6.png" color="#1D6AD2" /> <v:textbox inset="0,0,0,0"> <![endif]-->
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 0px;" valign="middle" width="600"><img src="https://empmonitor.com/wp-content/uploads/2019/11/emp_fb_cover-3.jpg" style="width: 100%;" /></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                        
                                                        <table bgcolor="#f4f7fe" border="0" cellpadding="0" cellspacing="0" width="600"><!--[if gte mso 9]> <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:315px;"> <v:fill type="tile" src="http://i.imgur.com/5Udx4T6.png" color="#1D6AD2" /> <v:textbox inset="0,0,0,0"> <![endif]-->
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 0px;" valign="middle" width="600">
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="540">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td height="30" width="100%"></td>
                                                                            </tr>
                                                                            <!-- START OF HEADING-->
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 25px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;">Hello ${name} You ${message}</td>
                                                                            </tr>
                                                                            <!-- END OF HEADING--><!-- START OF Cong-->
                                                                            <tr>
                                                                                ${role == 'M' ? `<td align="left" class="left" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 16px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;"><br />
                                                                                <strong>Your User ID</strong>: ${email}<br />
                                                                                <strong>Your Password</strong>: ${password}<br />
                                                                                Log-on to your Manager Account at: <a href="http://app.empmonitor.com/login">Log-In</a></td>` : ' '}
                                                                            </tr>
                                                                            <!-- END oF Cong --><!-- START OF BUTTON-->
                                                                            <tr>
                                                                                <td align="center" style="padding-top: 10px; padding-bottom: 10px;" valign="middle"></td>
                                                                            </tr>
                                                                            <!-- START OF Cong-->
                                                                            <tr>
                                                                                <td align="left" class="left" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 16px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;"></td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 18px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;"><span>Regards,<br />
                                                                                SecKnight Vision Support,<br />
                                                                                support@empmonitor.com<br />
                                                                                Skype: empmonitorsupport </span></td>
                                                                            </tr>
                                                                            <!-- END oF Cong --><!-- START OF BUTTON-->
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
                    <!-- END OF FEATURED AREA BLOCK--><!-- START OF SOCIAL BLOCK-->
                        
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%"><!-- START OF VERTICAL SPACER-->
                                            <table align="center" bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="30" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER-->
                        
                                            <table bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td width="100%">
                                                        <table border="0" cellpadding="0" cellspacing="0" width="600">
                                                            <tbody>
                                                                <tr>
                                                                    <td class="spacer" width="30"></td>
                                                                    <td width="540"><!-- START OF LEFT COLUMN FOR HEADING-->
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="300">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; font-size: 20px; color:#666666; font-family: Lucida Sans Unicode; line-height: 30px;  mso-line-height-rule: exactly;"><span>Stay in touch</span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!-- END OF LEFT COLUMN FOR HEADING--><!-- START OF RIGHT COLUMN FOR SOCIAL ICONS-->
                        
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="280">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; font-size:14px ; color:#aaaaaa; font-family: Helvetica, Arial, sans-serif; line-height: 100%;"><span><a href="https://www.facebook.com/SecKnight Vision/" target="_blank"><!-- <i class="fa fa-facebook-square fa-2x" aria-hidden="true"></i> --> <img src="https://empmonitor.com/wp-content/uploads/2020/01/f_icon.png" style="width: 50px;" /> </a> &nbsp; <a href="https://twitter.com/empmonitor" target="_blank"> <!-- <i class="fa fa-twitter-square fa-2x" aria-hidden="true"></i> --> <img src="https://empmonitor.com/wp-content/uploads/2020/01/t_icon.png" style="width: 50px;" /> </a> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!-- END OF RIGHT COLUMN FOR SOCIAL ICONS--></td>
                                                                    <td class="spacer" width="30"></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- START OF VERTICAL SPACER-->
                        
                                            <table align="center" bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="30" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--></td>
                                        </tr>
                                    </tbody>
                                </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- END OF SOCIAL BLOCK--><!-- START OF SUB-FOOTER BLOCK-->
                        
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6; border-bottom: 5px solid #e6e6e6">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%"><!-- START OF VERTICAL SPACER-->
                                            <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0" class="table_scale" style="border-top: 1px solid #767373;" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="10" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                        
                                            <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="20" style="margin: 0; font-size:12px ; color:#ededed; font-family: Helvetica, Arial, sans-serif; line-height: 18px; text-align: center;" width="100%">Copyright &copy; 2017 - 2020 SecKnight Vision. All Rights Reserved.</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--><!-- START OF VERTICAL SPACER-->
                        
                                            <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="10" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--></td>
                                        </tr>
                                    </tbody>
                                </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- END OF SUB-FOOTER BLOCK-->`,
        };
        sgMail
            .send(msg)
            .then(data => {
                cb(null, data);
            })
            .catch(err => {
                cb(err, null);
            })
    }

    async sendEMail(email, message, subject, name, password, role) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'admin@empmonitor.com',
            subject: subject,
            text: subject,
            html: `<html xmlns="http://www.w3.org/1999/xhtml">
                    <head>
                    </head>
                    <body bgcolor="#f8f8f8"></body>
                    </html>
                    <br />
                    <br />
                    <br />
                    <br />
                    <title>SecKnight Vision</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
                    <style type="text/css">html {
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
                                margin: 0!important
                            }
                            table {
                                border-collapse: collapse
                            }
                            @media only screen and (max-width: 640px) {
                                table table {
                                    width: 100%!important
                                }
                                td[class=full_width] {
                                    width: 100%!important
                                }
                                div[class=div_scale] {
                                    width: 440px!important;
                                    margin: 0 auto!important
                                }
                                table[class=table_scale] {
                                    width: 440px!important;
                                    margin: 0 auto!important
                                }
                                td[class=td_scale] {
                                    width: 440px!important;
                                    margin: 0 auto!important
                                }
                                img[class=img_scale] {
                                    width: 100%!important;
                                    height: auto!important
                                }
                                img[class=divider] {
                                    width: 440px!important;
                                    height: 2px!important
                                }
                                table[class=spacer] {
                                    display: none!important
                                }
                                td[class=spacer] {
                                    display: none!important
                                }
                                td[class=center] {
                                    text-align: center!important
                                }
                                table[class=full] {
                                    width: 400px!important;
                                    margin-left: 20px!important;
                                    margin-right: 20px!important
                                }
                                img[class=divider] {
                                    width: 100%!important;
                                    height: 1px!important
                                }
                            }
                            @media only screen and (max-width: 479px) {
                                table table {
                                    width: 100%!important
                                }
                                td[class=full_width] {
                                    width: 100%!important
                                }
                                div[class=div_scale] {
                                    width: 280px!important;
                                    margin: 0 auto!important
                                }
                                table[class=table_scale] {
                                    width: 280px!important;
                                    margin: 0 auto!important
                                }
                                td[class=td_scale] {
                                    width: 280px!important;
                                    margin: 0 auto!important
                                }
                                img[class=img_scale] {
                                    width: 100%!important;
                                    height: auto!important
                                }
                                img[class=divider] {
                                    width: 280px!important;
                                    height: 2px!important
                                }
                                table[class=spacer] {
                                    display: none!important
                                }
                                td[class=spacer] {
                                    display: none!important
                                }
                                td[class=center] {
                                    text-align: center!important
                                }
                                table[class=full] {
                                    width: 240px!important;
                                    margin-left: 20px!important;
                                    margin-right: 20px!important
                                }
                                img[class=divider] {
                                    width: 100%!important;
                                    height: 1px!important
                                }
                            }
                    </style>
                    <!-- START OF HEADER BLOCK-->
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px;border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;border-top: 5px solid #e6e6e6;">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%"><!-- START OF VERTICAL SPACER-->
                                            <table align="center" bgcolor="#0f48d5" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="20" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER-->
                        
                                            <table bgcolor="#0f48d5" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td width="100%">
                                                        <table border="0" cellpadding="0" cellspacing="0" width="600">
                                                            <tbody>
                                                                <tr>
                                                                    <td class="spacer" width="20"></td>
                                                                    <td width="540"><!-- START OF LOGO IMAGE TABLE-->
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="auto">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" class="center" style="padding: 0px; text-transform: uppercase; font-family: Lucida Sans Unicode; color:#666666; font-size:24px; line-height:34px;"><span><a href="#" style="color:#0f48d5;"><img alt="SecKnight Vision" border="0" height="55" src="https://cdn.shortpixel.ai/client/q_glossy,ret_img/https://empmonitor.com/wp-content/uploads/2019/03/EmpMonitorLogo.png" style="display: inline;" width="auto" /> </a> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!-- END OF LOGO IMAGE TABLE--></td>
                                                                    <td class="spacer" width="30"></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- START OF VERTICAL SPACER-->
                        
                                            <table align="center" bgcolor="#0f48d5" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="20" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--></td>
                                        </tr>
                                    </tbody>
                                </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- END OF HEADER BLOCK--><!-- START OF FEATURED AREA BLOCK-->
                        
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%">
                                            <table bgcolor="#1D6AD2" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td width="100%">
                                                        <table bgcolor="#1D6AD2" border="0" cellpadding="0" cellspacing="0" width="600"><!--[if gte mso 9]> <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:315px;"> <v:fill type="tile" src="http://i.imgur.com/5Udx4T6.png" color="#1D6AD2" /> <v:textbox inset="0,0,0,0"> <![endif]-->
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 0px;" valign="middle" width="600"><img src="https://empmonitor.com/wp-content/uploads/2019/11/emp_fb_cover-3.jpg" style="width: 100%;" /></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                        
                                                        <table bgcolor="#f4f7fe" border="0" cellpadding="0" cellspacing="0" width="600"><!--[if gte mso 9]> <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:315px;"> <v:fill type="tile" src="http://i.imgur.com/5Udx4T6.png" color="#1D6AD2" /> <v:textbox inset="0,0,0,0"> <![endif]-->
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 0px;" valign="middle" width="600">
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="540">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td height="30" width="100%"></td>
                                                                            </tr>
                                                                            <!-- START OF HEADING-->
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 25px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;">Hello ${name} Your ${message}</td>
                                                                            </tr>
                                                                            <!-- END OF HEADING--><!-- START OF Cong-->
                                                                            <tr>
                                                                                ${role == 'M' ? `<td align="left" class="left" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 16px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;"><br />
                                                                                <strong>Your User ID</strong>: ${email}<br />
                                                                                <strong>Your Password</strong>: ${password}<br />
                                                                                Log-on to your Account at: <a href="http://app.empmonitor.com/login">Log-In</a></td>` : ' '}
                                                                            </tr>
                                                                            <!-- END oF Cong --><!-- START OF BUTTON-->
                                                                            <tr>
                                                                                <td align="center" style="padding-top: 10px; padding-bottom: 10px;" valign="middle"></td>
                                                                            </tr>
                                                                            <!-- START OF Cong-->
                                                                            <tr>
                                                                                <td align="left" class="left" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 16px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;"></td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 18px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;"><span>Regards,<br />
                                                                                SecKnight Vision Support,<br />
                                                                                support@empmonitor.com<br />
                                                                                Skype: empmonitorsupport </span></td>
                                                                            </tr>
                                                                            <!-- END oF Cong --><!-- START OF BUTTON-->
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
                    <!-- END OF FEATURED AREA BLOCK--><!-- START OF SOCIAL BLOCK-->
                        
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6;">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%"><!-- START OF VERTICAL SPACER-->
                                            <table align="center" bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="30" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER-->
                        
                                            <table bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td width="100%">
                                                        <table border="0" cellpadding="0" cellspacing="0" width="600">
                                                            <tbody>
                                                                <tr>
                                                                    <td class="spacer" width="30"></td>
                                                                    <td width="540"><!-- START OF LEFT COLUMN FOR HEADING-->
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="300">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; font-size: 20px; color:#666666; font-family: Lucida Sans Unicode; line-height: 30px;  mso-line-height-rule: exactly;"><span>Stay in touch</span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!-- END OF LEFT COLUMN FOR HEADING--><!-- START OF RIGHT COLUMN FOR SOCIAL ICONS-->
                        
                                                                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="full" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="280">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" class="center" style="margin: 0; font-size:14px ; color:#aaaaaa; font-family: Helvetica, Arial, sans-serif; line-height: 100%;"><span><a href="https://www.facebook.com/SecKnight Vision/" target="_blank"><!-- <i class="fa fa-facebook-square fa-2x" aria-hidden="true"></i> --> <img src="https://empmonitor.com/wp-content/uploads/2020/01/f_icon.png" style="width: 50px;" /> </a> &nbsp; <a href="https://twitter.com/empmonitor" target="_blank"> <!-- <i class="fa fa-twitter-square fa-2x" aria-hidden="true"></i> --> <img src="https://empmonitor.com/wp-content/uploads/2020/01/t_icon.png" style="width: 50px;" /> </a> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!-- END OF RIGHT COLUMN FOR SOCIAL ICONS--></td>
                                                                    <td class="spacer" width="30"></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- START OF VERTICAL SPACER-->
                        
                                            <table align="center" bgcolor="#ededed" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="30" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--></td>
                                        </tr>
                                    </tbody>
                                </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- END OF SOCIAL BLOCK--><!-- START OF SUB-FOOTER BLOCK-->
                        
                    <table align="center" bgcolor="#f8f8f8" border="0" cellpadding="0" cellspacing="0" style="border-left: 5px solid #e6e6e6;border-right: 5px solid #e6e6e6; border-bottom: 5px solid #e6e6e6">
                        <tbody>
                            <tr>
                                <td valign="top" width="100%">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td width="100%"><!-- START OF VERTICAL SPACER-->
                                            <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0" class="table_scale" style="border-top: 1px solid #767373;" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="10" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                        
                                            <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="20" style="margin: 0; font-size:12px ; color:#ededed; font-family: Helvetica, Arial, sans-serif; line-height: 18px; text-align: center;" width="100%">Copyright &copy; 2017 - 2020 SecKnight Vision. All Rights Reserved.</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--><!-- START OF VERTICAL SPACER-->
                        
                                            <table align="center" bgcolor="#666666" border="0" cellpadding="0" cellspacing="0" class="table_scale" width="600">
                                                <tbody>
                                                    <tr>
                                                        <td height="10" width="100%"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!-- END OF VERTICAL SPACER--></td>
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
                return data;
            })
            .catch(err => {
                return null;
            })
    }
}
module.exports = new Mail;