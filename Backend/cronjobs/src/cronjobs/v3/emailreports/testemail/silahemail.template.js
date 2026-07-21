module.exports.emailTemplate = ({
    officeTime, computerActivity, productiveHour, nonProductiveHour, productivityPer, comparedToPrevious, topWebSites,
    topApps, findMoreLink, heading, reportDate, timeAttendances, frequency, neutralHour, idleHour,
    officeTimeStr, computerActivityStr, productiveHourStr, nonProductiveHourStr, neutralHourStr, idleHourStr,
    productivityPerStr, comparedToPreviousStr, topWebSitesStr, topAppsStr, timeAttendancesStr, topAppAndWebStr,
    haveAnyQuestionStr, helpCenterStr, unsubsribeMessageStr, unsubsribeStr, findMoreStr, reportStr, reportDateStr,
    sellerMailChangesObj, reportLink
}) => `
<!DOCTYPE>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Email Report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin: 0; padding: 0;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 10px 0 30px 0;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="650"
                    style="border: 1px solid #cccccc; border-collapse: collapse;">
                    <tr ${!sellerMailChangesObj.hasLogo ? '' : "style='display:none'"} style="display: none;">
                        <td align="center"
                            style="padding: 40px 0 30px 0; color: #2784d8; font-size: 40px; font-weight: bold; font-family: Arial, sans-serif;">
                            Emp<span style="color: #414042;">Monitor</span>
                        </td>
                    </tr>
                    <tr  ${sellerMailChangesObj.hasLogo ? '' : "style='display:none'"} >
                        <td align="center" style="padding: 40px 0 30px 0;">
                            <img src="${sellerMailChangesObj.logoLink}"
                                alt="LOGO" style="width: 200px;">
                        </td> 
                     </tr>
                    <tr>
                        <td
                            style="padding: 0 30px 0 30px; color: #153643; font-family: Arial, sans-serif; font-size: 24px; text-align:left;">
                            <b>${heading}</b>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 0 30px; text-align:right; font-family: Arial, sans-serif;">
                            <b>${reportDateStr} :</b>&nbsp;&nbsp;${reportDate}
                        </td>
                    </tr>
                    <tr>
                        <td align="center" border="0" cellpadding="0" cellspacing="0" width="650">
                            <div style="display: ${reportLink ? '' : 'none'}">
                                <a href='${reportLink}' style="color: #d01f27;"> Click here </a> to download report
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 40px 30px 30px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <table width="100%" style="text-align: center; margin: 20px 00 20px 00;">
                                            <tr bgcolor="#ffe6e8">
                                                <td width="33.33%"
                                                    style="padding: 20px 00 20px 00; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${officeTimeStr} </b><br>
                                                    ${officeTime}
                                                </td>
                                                <td width="33.33%"
                                                    style="padding: 20px 00 20px 00; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${productivityPerStr} </b><br>
                                                    ${productivityPer}
                                                </td>
                                            </tr>
                                            <tr bgcolor="#ffbabe">
                                                <td width="33.33%"
                                                    style="padding: 10px 00 10px 00; font-family: Arial, sans-serif;">
                                                    <b> ${computerActivityStr} </b><br>
                                                    ${computerActivity}
                                                </td>
                                                <td width="33.33%"
                                                    style="padding: 10px 00 10px 00; font-family: Arial, sans-serif;">
                                                    <b> ${comparedToPreviousStr} </b><br>
                                                    ${comparedToPrevious}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <table width="100%" style="text-align: center; margin: 00px 00 20px 00;">
                                            <tr bgcolor="#d01f27">
                                                <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 20px; text-align: center; padding: 10px 00 10px 00;"
                                                    colspan="5">
                                                    <b>${frequency} ${reportStr}</b>
                                                </td>
                                            </tr>
                                            <tr bgcolor="#ffe6e8">
                                                <td width="33.33%"
                                                    style="padding: 20px 15px 20px 15px; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${timeAttendancesStr} </b><br>

                                                    <small><b></b><br>${timeAttendances}</small>
                                                </td>
                                                <td width="33.33%"
                                                    style="padding: 20px 20px 20px 20px; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${productiveHourStr} </b><br>

                                                    <small><br> ${productiveHour} </small>
                                                </td>
                                                <td width="33.33%"
                                                    style="padding: 20px 20px 20px 20px; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${nonProductiveHourStr} </b><br>

                                                    <small><br> ${nonProductiveHour} </small>
                                                </td>
                                                <td width="33.33%"
                                                    style="padding: 20px 20px 20px 20px; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${neutralHourStr} </b><br>

                                                    <small><br> ${neutralHour} </small>
                                                </td>
                                                <td width="33.33%"
                                                    style="padding: 20px 20px 20px 20px; font-family: Arial, sans-serif; color: #153643;">
                                                    <b> ${idleHourStr} </b><br>

                                                    <small><br> ${idleHour} </small>
                                                </td>
                                            </tr>

                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <table width="100%">
                                            <tr bgcolor="#d01f27">
                                                <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 20px; text-align: center; padding: 10px 00 10px 00;"
                                                    colspan="3">
                                                    <b> ${topAppAndWebStr} </b>
                                                </td>
                                            </tr>
                                            <tr bgcolor="#ffe6e8">
                                                <td width="50%"
                                                    style="padding: 20px 20px 20px 20px; font-family: Arial, sans-serif; color: #153643;vertical-align: top;">
                                                    <b> ${topAppsStr} </b><br><br>
                                                    <small>
                                                        <ul>
                                                            ${topApps}
                                                        </ul>
                                                    </small>
                                                </td>
                                                <td width="50%"
                                                    style="padding: 20px 20px 20px 20px; font-family: Arial, sans-serif; color: #153643;vertical-align: top;">
                                                    <b> ${topWebSitesStr} </b><br><br>
                                                    <small>
                                                        <ul>
                                                            ${topWebSites}
                                                        </ul>
                                                    </small>
                                                </td>

                                            </tr>

                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#666" style="padding: 30px 30px 30px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
                                <tr>
                                    <td
                                        style="color: #ffffff; font-family: Arial, sans-serif; font-size: 14px; line-height: 2;">
                                        &copy; ${sellerMailChangesObj.copyrightName} ${sellerMailChangesObj.copyrightYear}<br />

                                        <span ${sellerMailChangesObj.supportText ? "style='font-size: 1.5rem'" : "style='display:none'"} >
                                            ${sellerMailChangesObj.supportText} <br />
                                        </span>

                                        <span ${sellerMailChangesObj.supportMail ? '' : "style='display:none'"}>
                                            <a href="mailto:${sellerMailChangesObj.supportMail}" style="color: #adddfb;"> ${sellerMailChangesObj.supportMailStr} </a> <br />
                                        </span>

                                        <span ${sellerMailChangesObj.skypeEmail ? '' : "style='display:none'"}>
                                            <a href="mailto:${sellerMailChangesObj.skypeEmail}" style="color: #adddfb;"> ${sellerMailChangesObj.skypeMailStr} </a> <br />
                                        </span>
                                        
                                        <span ${sellerMailChangesObj.helpLink ? '' : "style='display:none'"}>
                                            ${haveAnyQuestionStr} <a href="${sellerMailChangesObj.helpLink}"
                                                style="color: #adddfb;">${helpCenterStr}.</a> <br>
                                        </span>

                                       <!--- ${unsubsribeMessageStr}
                                        <a href="unsubscrb" style="color: #adddfb;">
                                            ${unsubsribeStr}
                                        </a> <br><br> -->
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span ${sellerMailChangesObj.instagramLink ? '' : "style='display:none'"}>
                                            <a href="${sellerMailChangesObj.instagramLink}"
                                                style="background-color: #3f729b; color: #ffffff; text-decoration: none; padding: 5px;">Instagram</a>&nbsp;
                                        </span>
                                        <span ${sellerMailChangesObj.twitterLink ? '' : "style='display:none'"}>
                                            <a href="${sellerMailChangesObj.twitterLink}"
                                                style="background-color: #00acee; color: #ffffff; text-decoration: none; padding: 5px;">
                                                Twitter
                                            </a>&nbsp;
                                        </span>
                                        <span ${sellerMailChangesObj.facebookLink ? '' : "style='display:none'"}>
                                            <a href="${sellerMailChangesObj.facebookLink}"
                                                style="background-color: #3b5998; color: #ffffff; text-decoration: none; padding: 5px;">
                                                facebook
                                            </a>
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
`;
