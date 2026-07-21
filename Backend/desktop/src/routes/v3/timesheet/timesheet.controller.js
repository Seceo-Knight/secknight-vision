'use strict';
const _ = require("underscore");
const moment = require("moment-timezone");

const Model = require('./timesheet.model');


class TimesheetController {

    async getTimesheet(req, res, next) {
        try {
            let { organization_id, employee_id, timezone } = req.decoded;
            let date = moment(req.query.date).format('YYYY-MM-DD');
            let [attendance] = await Model.getAttendance({ organization_id, employee_id, date });
            if (!attendance) return res.status(400).json({
                code: 400,
                message: "No attendance found",
                data: null,
                error: null
            })

            const [employeeProductivity, organization_settings_arr] = await Promise.all([
                Model.getEmployeeProductivity({ organization_id, employee_id, date: moment(attendance.date).format('YYYYMMDD') }),
                Model.getOrganizationDefaultSettings({ organization_id })
            ]);
            if (!employeeProductivity) return res.status(400).json({
                code: 400,
                message: "No attendance found",
                data: null,
                error: null
            });

            let [organization_settings] = organization_settings_arr;
            let productive_duration = JSON.parse(organization_settings.rules).productiveHours.hour;
            productive_duration = moment.duration(productive_duration);
            productive_duration = productive_duration.asSeconds();

            let data = {
                ...attendance,
                start_time: moment(attendance.start_time).tz(timezone).format('YYYY-MM-DD HH:mm:ss A'),
                end_time: moment(attendance.end_time).tz(timezone).format('YYYY-MM-DD HH:mm:ss A'),
                active_duration: secondsToHHMMSS(employeeProductivity.productive_duration + employeeProductivity.non_productive_duration + employeeProductivity.neutral_duration),
                productive_duration: secondsToHHMMSS(employeeProductivity.productive_duration),
                non_productive_duration: secondsToHHMMSS(employeeProductivity.non_productive_duration),
                idle_duration: secondsToHHMMSS(employeeProductivity.idle_duration),
                neutral_duration: secondsToHHMMSS(employeeProductivity.neutral_duration),
                productivity: ((employeeProductivity.productive_duration / productive_duration) * 100).toFixed(2),
                office_duration: secondsToHHMMSS(employeeProductivity.productive_duration + employeeProductivity.non_productive_duration + employeeProductivity.neutral_duration + employeeProductivity.idle_duration),
                organization_id: organization_id
            }

            return res.json({
                code: 200,
                data: data,
                message: "Success",
                error: null
            })
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new TimesheetController;


function secondsToHHMMSS(seconds) {
    const duration = moment.duration(seconds, 'seconds');
    const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
    const minutes = String(duration.minutes()).padStart(2, '0');
    const secs = String(duration.seconds()).padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}
