const moment = require('moment-timezone');

const ProjectModel = require('../project.model');
const Comman = require('../../../../utils/helpers/CommonFunctions');


const getMaxLogoutTime = async (sysTimeUtc, userData, previousLoginTime, previousLogoutTime, startDate, date) => {
    //shift logout is more than  day end than take shift end as logout/
    let maxLogoutTime = moment(sysTimeUtc);
    let shift;
    if (userData.setting.trackingMode == 'fixed') {
        shift = await Comman.timesByDate(userData.setting.tracking.fixed, date, userData.timezone);
    } else if (userData.shift) {
        shift = await Comman.timesByDate(userData.shift, date, userData.timezone);
    }

    const setting = userData.logoutOptions || {
        option: 2,
        specificTimeUTC: '00:00',
        specificTimeUser: '00:00',
        afterFixedHours: 10
    };
    switch (+setting.option) {
        case 1: {
            if (setting.specificTimeUTC === '00:00') {
                maxLogoutTime = previousLoginTime.clone().endOf('day');
            } else {
                const timeSpecified = setting.specificTimeUTC.split(':');
                maxLogoutTime = previousLoginTime.clone().set({ hours: parseInt(timeSpecified[0]), minutes: parseInt(timeSpecified[1]), seconds: 0 });
            }
            break;
        }
        case 2: {
            if (setting.specificTimeUser === '00:00') {
                maxLogoutTime = previousLoginTime.clone().tz(userData.timezone).endOf('day').utc();
                if (shift && shift.start && moment(shift.end).isAfter(maxLogoutTime)) {
                    maxLogoutTime = shift.end;
                }
                // maxLogoutTime = maxLogoutTime.clone().utc();
            } else {
                const timeSpecified = setting.specificTimeUser.split(':');
                maxLogoutTime = previousLoginTime.clone().tz(userData.timezone).set({ hours: parseInt(timeSpecified[0]), minutes: parseInt(timeSpecified[1]), seconds: 59 }).utc();
                if (shift && shift.start && moment(shift.end).isAfter(maxLogoutTime)) {
                    maxLogoutTime = shift.end;
                }
                // maxLogoutTime = maxLogoutTime.clone().utc();
            }
            break;
        }
        case 3: {
            maxLogoutTime = previousLoginTime.add(1, 'day');
            break;
        }
        case 4: {
            if ((previousLogoutTime.tz(userData.timezone).date() < startDate.tz(userData.timezone).date()) && startDate.diff(previousLogoutTime) >= setting.afterFixedHours) {
                maxLogoutTime = previousLogoutTime;
            } else {
                maxLogoutTime = previousLoginTime.add(1, 'day');
            }
            break;
        }
        default:
            break;
    }
    return maxLogoutTime;
}
class AttendanceService {
    async getAttendance(employee_id, startDate, userData, organization_id) {
        // Get perticular date's attendance of a user
        const [previousAttendanceData] = await ProjectModel.getLastInsertedAttendanceLastInserted({ employee_id });
        if (previousAttendanceData) {
            const previousLoginTime = moment(previousAttendanceData.start_time);
            const previousLogoutTime = moment(previousAttendanceData.end_time);
            const date = moment(previousAttendanceData.date).format('YYYY-MM-DD');

            // get max logout data from setting and its relevant options
            const maxLogoutTime = await getMaxLogoutTime(startDate, userData, previousLoginTime, previousLogoutTime, startDate, date);
            if (startDate > maxLogoutTime) {
                if (startDate == previousAttendanceData.date) {
                    startDate.add(1, 'day');
                }
                const insertedData = await ProjectModel.createAttendanceEntry(
                    startDate.tz(userData.timezone).format('YYYY-MM-DD'),
                    employee_id, organization_id,
                    startDate.format('YYYY-MM-DD HH:mm:ss'),
                    startDate.format('YYYY-MM-DD HH:mm:ss'));
                return insertedData.insertId;
            } else {

                return previousAttendanceData.id;
            }
        } else {
            // Insert a new entry with current attendance details, no manipulation needed
            const insertedData = await ProjectModel.createAttendanceEntry(
                startDate.tz(userData.timezone).format('YYYY-MM-DD'),
                employee_id, organization_id,
                startDate.format('YYYY-MM-DD HH:mm:ss'),
                startDate.format('YYYY-MM-DD HH:mm:ss'));
            return insertedData.insertId;
        }
    }
}

module.exports = new AttendanceService;