const moment = require('moment');
module.exports = (employee_name, admin_name) => {
return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="icon" href="https://empmonitor.com/wp-content/uploads/2019/03/empmonitor_icon.png" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet">
    <title>Emp Monitor : User Guide</title>
</head>

<body>
    <div style="max-width:600px;width:100%;margin:auto;
    /* background-color: #101011; */
    /* border-radius: 40px; */
    font-family: 'Montserrat', sans-serif;
    box-shadow: 0px 0px 21px -8px #00000052">
        <table style="border-spacing: 0px;">
            <tbody>
                <tr style="background: #fff;">
                    <td style="padding:0;text-align: center;">
                        <img style="width: 40%; margin: auto; margin-block: 1.5rem;"
                            src="https://app.empmonitor.com/assets/images/logos/323176aaf7bb6da5259e901f3b81bdcc.png" />
                    </td>
                </tr>

                <tr>
                    <td>
                        <img style="width: 100%; margin: auto; margin-block: 1.5rem; margin-top: 0;"
                            src="https://empmonitor.com/wp-content/uploads/2024/03/banner-scaled.webp" />
                    </td>
                </tr>
                <tr style="background: #fff;">
                    <td style="padding:0;padding-inline: 1.5rem; color: #001647;">


                        <h2 style="    margin: 0;
                       font-weight: 600;
                       font-size: 23px;
                       margin-bottom: 1rem;
                       text-align: left;
                       margin-bottom: 2rem;">
                            Reminder: Employee Birthday Tomorrow 🎉
                        </h2>

                        <p style="text-align: left; font-size: 18px;
                       font-weight: 500;">
                            Hi ${admin_name},</p>



                        <p style="text-align: justify; line-height: 1.5;     font-size: 18px;
                       font-weight: 400;">This is just a friendly reminder that ${employee_name}'s birthday is tomorrow!
                            🎂</p>

                        <p style="text-align: justify; line-height: 1.5;     font-size: 18px;
                       font-weight: 400;">Please join us in celebrating their special day and considering any gestures
                            or acknowledgments you'd like to extend.</p>


                        <p style="margin: 0;     font-size: 18px;
                       ">Best Regards,</p>
                        <p style="margin-top: 5px;    font-size: 18px;
                       font-weight: 500; margin-bottom: 8px;">EmpMonitor Team</p>

                        <p style="text-align: justify; line-height: 1.5;    font-size: 18px;
                                              font-weight: 500; margin-top: 0;"><a target="_blank"
                                href="https://techsupport@empmonitor.com" style=" text-decoration: none;
                                               color: #5a64f5;
                                               cursor: pointer;">support@empmonitor.com</a></p>

                    </td>
                </tr>

                <tr style="text-align: center;">
                    <td>
                        <div style="width: 100%;margin: auto;margin-top: 10px;margin-bottom: 0px;" class="media-footer">
                            <div
                                style="display: flex;justify-content: space-between;align-content: center;gap: 30px;margin: auto;">
                                <table style="margin: auto">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div style="margin: 10px;">
                                                    <a href="https://www.facebook.com/empmonitorglobal/" target="_blank"><img
                                                            src="https://empmonitor.com/wp-content/uploads/2020/01/f_icon.png"
                                                            style="width: 30px;"></a>
                                                </div>
                                            </td>

                                            <td>
                                                <div style="margin: 10px;">
                                                    <a href="https://www.linkedin.com/company/empmonitor/"
                                                        target="_blank"><img
                                                            src="https://empmonitor.com/wp-content/uploads/2020/04/linkedin.png"
                                                            style="width: 30px;"></a>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="margin: 10px;">
                                                    <a href="https://www.youtube.com/channel/UCh2X5vn5KBkN-pGY5PxJzQw"
                                                        target="_blank"><img
                                                            src="https://empmonitor.com/wp-content/uploads/2020/04/youtube.png"
                                                            style="width: 30px;"></a>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="margin: 10px;">
                                                    <a href="https://twitter.com/empmonitor" target="_blank"><img
                                                            src="https://empmonitor.com/wp-content/uploads/2020/01/t_icon.png"
                                                            style="width: 30px;"></a>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="margin: 10px;">
                                                    <a href="skype:empmonitorsupport" target="_blank"><img
                                                            src="https://empmonitor.com/wp-content/uploads/2022/11/skype_icon.png"
                                                            style="width: 30px;"></a>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="20"
                        style="margin: 0;font-size: 14px;color: #000;font-family: Montserrat;line-height: 18px;text-align: center;background: #151514;padding: 14px;color: #fff">
                        Copyright ${moment().format('YYYY')} @ EmpMonitor | All Rights Reserved
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`
}