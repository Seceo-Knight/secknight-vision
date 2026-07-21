module.exports = (reportName, reportDate) => {
    return `
<!DOCTYPE>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Report Date</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin: 0; padding: 0;" bgcolor="#f8f8f8">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" >
        <tr>
            <td style="padding: 10px 0 30px 0;">
                <table align="center" bgcolor="#f4f7fe" border="0" cellpadding="0" cellspacing="0" width="600"
                    style="border: 5px solid #e6e6e6; border-collapse: collapse;">
                    <tr>
                        <td align="center" >
                            <img width="200px" src="https://empmonitor.com/wp-content/uploads/2019/03/0K2D_AqW-1.png" style="margin-top:20px;" />
                        </td>
                    </tr>
                   
                    <tr>
                        <td bgcolor="#f4f7fe" style="padding: 40px 30px 30px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #153643; font-family: Arial, sans-serif; font-size: 24px;">
                                        <b>${reportName}</b>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 30px 0 30px; text-align: right; font-family: Arial, sans-serif;">
                                        <b>Report Date: </b>${reportDate}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin-bottom:30px">
                                <tr >
                                    <td
                                        style="color: #000; font-family: Arial, sans-serif; font-size: 22px; line-height: 2; text-align: center; margin-bottom:30px; font-weight:700">
                                        Please find the attachment below regarding Emp-monitor Activity Logs Employee Report
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <img src="https://empmonitor.com/wp-content/uploads/2020/06/Windows-amico.png" width="500px">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" class="center"
                            style="margin: 0; padding-bottom:15px; margin:0; font-family: Lucida Sans Unicode; font-size: 18px; color: #0d1a2b; line-height: 25px;mso-line-height-rule: exactly;">
                            <span>Regards,<br>
                                EmpMonitor Support,<br>
                                support@empmonitor.com<br>
                                Skype: empmonitorsupport </span>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#02213e" style="padding: 30px 30px 30px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
                                <tr>
                                    <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 14px; line-height: 2;"
                                        >
                                        © EmpMonitor 2020-2022<br />
                                       
                                        Have any questions? Please check out our <a href="http://help.empmonitor.com/"
                                            style="color: #adddfb;">Help center.</a>
                                    </td>
                                    </tr>
                                    <tr>
                                <table width="600" cellpadding="0" cellspacing="0" border="0" >
                                    <tbody>
                                        <tr>
                                            <td class="spacer" width="10"></td>
                                            <td width="540">
                                                <!-- START OF LEFT COLUMN FOR HEADING-->
                                                <table class="full" align="center" width="300" cellpadding="0" cellspacing="0" border="0"
                                                    style="margin-top:20px; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
                                                    <tbody>
                                                        <tr>
                                                            <td class="center" align="center"
                                                                style="margin: 0; font-size: 16px; color:#fff; font-family: Verdana, Geneva, sans-serif; line-height: 12px;  mso-line-height-rule: exactly;  padding-bottom: 7px;">
                                                                <span><b>Stay in touch</b></span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- END OF LEFT COLUMN FOR HEADING-->
                                                <!-- START OF RIGHT COLUMN FOR SOCIAL ICONS-->
                                                <table class="full" align="center" width="280" cellpadding="0" cellspacing="0" border="0"
                                                    style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
                                                    <tbody>
                                                        <tr>
                                                            <td class="center" align="center"
                                                                style="margin: 0; font-size:14px ; color:#aaaaaa; font-family: Helvetica, Arial, sans-serif; line-height: 100%; padding-top: 10px;">
                                                                <span>
                                                                    <a style="text-decoration: none;" href="https://www.facebook.com/EmpMonitor/" target="_blank">
                                                                        <img src="https://empmonitor.com/wp-content/uploads/2020/01/f_icon.png"
                                                                            style="width: 40px;">
                                                                    </a> 
                                                                    <a href="https://twitter.com/empmonitor" style="text-decoration: none;" target="_blank">
                                                                        <img src="https://empmonitor.com/wp-content/uploads/2020/01/t_icon.png"
                                                                            style="width: 40px;">
                                                                    </a>
                                                                    <a href="https://www.linkedin.com/company/empmonitor/" target="_blank" style="text-decoration: none;">
                                                                        <img src="https://empmonitor.com/wp-content/uploads/2020/04/linkedin.png"
                                                                            style="width: 40px;">
                                                                    </a>
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- END OF RIGHT COLUMN FOR SOCIAL ICONS-->
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>`;
}