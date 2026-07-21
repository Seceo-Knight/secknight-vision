const _ = require('lodash');
const Moment = require('moment-timezone');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const DayCounter = require('./AttDayCounter');

// halfday const
const FIRST_HALFDAY_SHORT_TXT = '1H';
const SECOND_HALFDAY_SHORT_TXT = '2H';

class AttCalculator {
    constructor({ employee, attendanceData, shift, range, orgTimezone }) {
        this.ignoreTime = shift && shift.late_period && moment.duration(shift.late_period).asMinutes() ? moment.duration(shift.late_period).asMinutes() : 10;
        this.latePeriod = 10;
        this.earlyLogoutPeriod = shift && shift.early_login_logout_time ? moment.duration(shift.early_login_logout_time).asMinutes() : 0;
        this.minWorkingHoursForHalfday = shift && shift.half_day_hours ? moment.duration(shift.half_day_hours).asMinutes() : 0;
        this.overtimeIgnore = 60;
        this.ignoreInterval = this.ignoreTime + this.latePeriod;
        this.orgTimezone = orgTimezone;
        this.cycleIndex = 0;
        this.counter = new DayCounter();
        this.attendanceData = attendanceData;
        this.range = range;
        this.shift = shift;
        const { id, emp_code, first_name, last_name, department, location } = employee;
        const full_name = `${first_name} ${last_name}`;

        this.employee = {
            id,
            emp_code,
            first_name,
            last_name,
            full_name,
            department,
            location,
        };
    }

    static parseMonthRange(date) {
        const startDate = moment(date).subtract(1, "months");
        const endDate = moment(date);

        return moment.range(startDate, endDate);
    };

    calculate() {
        if (!this.shift) {
            this.attendance = null;
            return this.getSheet();
        }
        const { timezone, data: shiftTimeStr, name } = this.shift;
        this.timezone = timezone || this.orgTimezone;
        this.employee.shift = name;
        const shiftWeekData = JSON.parse(shiftTimeStr);
        this.attendance = {};

        for (const day of this.range.by('days')) {
            const dayOfMonth = day.date();
            const dateKey = moment(day).format("YYYY-MM-DD");
            const dayOfWeek = day.format('ddd').toLowerCase();
            const { status, time } = shiftWeekData[dayOfWeek];
            this.attendance[dateKey] = '-';

            const extData = _.get(this.attendanceData, `[${this.index()}]`);
            const dayData = extData &&
                moment.tz(extData.start, this.timezone).date() === dayOfMonth
                ? extData
                : null;

            if (!status) {
                this.attendance[dateKey] = 'D';
                if (dayData) {
                    this.attendance[dateKey] = 'O';
                    this.counter.plus('O');
                    this.next();
                    continue;
                }
                this.counter.plus('D');
                continue;
            }

            // check the user has worked minimum hours set by admin
            if (dayData && this.minWorkingHoursForHalfday) {
                const { empStart, empEnd } = this.userTimeToMoment(dayData);
                if (!this.hasCompletedMinHalfdayWorkingHours({ empStart, empEnd })) {
                    this.attendance[dateKey] = 'ADLH';
                    this.counter.plus('A');
                    continue;
                }
            }

            if (!dayData) {
                if (moment(day).isAfter(moment(), 'day')) {
                    this.attendance[dateKey] = '-';
                    continue;
                }
                this.attendance[dateKey] = 'A';
                this.counter.plus('A');
                continue;
            }

            this.attendance[dateKey] = this.parseOneDayLog(dayData, time, day);
            this.next();
        }

        return this.getSheet();
    }

    parseOneDayLog(AttData, shiftData, day) {
        let log = 'P';

        try {
            const { empStart, empEnd } = this.userTimeToMoment(AttData);
            const { shiftStart, shiftEnd } = this.shiftTimeToUTC(shiftData, day);
            const allTimes = { shiftStart, shiftEnd, empStart, empEnd };

            const workTimeDiff = this.getWorkTimeDiff(allTimes);
            const isHalf = this.isHalf(allTimes, workTimeDiff);
            const isLate = this.isLate(empStart, shiftStart);
            const isOvertime = this.isOvertime(workTimeDiff);
            const isEarylLogout = this.isEarylLogout(empEnd, shiftEnd);

            const haveSecondaryMarkers = isHalf || isLate || isOvertime || isEarylLogout;

            if (this.isOnlyPresent(allTimes)) {
                this.counter.plus('P');
            } else {
                if (haveSecondaryMarkers) {
                    if (isHalf) {
                        log = 'H';
                        this.counter.plus('H');
                        // halfday bifurcation
                        const shiftWorkTime = shiftEnd.diff(shiftStart, 'hours');
                        if (
                            moment(empStart).isBetween(
                                shiftStart,
                                moment(shiftStart).add(Math.floor(shiftWorkTime / 2), 'hours')
                            )
                        ) {
                            log = FIRST_HALFDAY_SHORT_TXT;
                        } else if (
                            moment(empStart).isBetween(
                                moment(shiftStart).add(Math.floor(shiftWorkTime / 2), 'hours'),
                                shiftEnd
                            )
                        ) {
                            log = SECOND_HALFDAY_SHORT_TXT;
                        }
                    }

                    if (isLate) {
                        log = 'L';
                        this.counter.plus('L');
                    }

                    if (isOvertime) {
                        log = 'O';
                        this.counter.plus('O');
                    }

                    if (isEarylLogout) {
                        log = 'EL';
                        this.counter.plus('EL');
                    }
                } else {
                    this.counter.plus('P');
                }
            }

            return log;
        } catch (error) {
            log = '-';
            return log;
        }
    }

    isOvertime(diff) {
        return diff > 0 && Math.abs(diff) > this.overtimeIgnore;
    }

    isHalf({ empStart, empEnd, shiftStart, shiftEnd }, diff) {
        const islessTime = diff < 0 && this.ignoreInterval <= Math.abs(diff);
        const afterShiftTimeStart = this.getTimeWithIgnInterval(shiftStart);
        const logoutBeforeEarlyLogoutTime = moment(shiftEnd).subtract(this.earlyLogoutPeriod, 'm');

        return (
            empStart.isAfter(afterShiftTimeStart) || empEnd.isSameOrBefore(logoutBeforeEarlyLogoutTime) || empEnd.isSameOrBefore(logoutBeforeEarlyLogoutTime) || islessTime
        );
    }

    isLate(empStart, shiftStart) {
        const afterShiftTimeStart = moment(shiftStart).add(this.ignoreTime, 'm');
        const afterLateTime = this.getTimeWithIgnInterval(shiftStart);
        return empStart.isSameOrAfter(afterShiftTimeStart) && empStart.isBefore(afterLateTime)
    }

    isEarylLogout(empEnd, shiftEnd) {
        const logoutBeforeEarlyLogoutTime = moment(shiftEnd).subtract(this.earlyLogoutPeriod, 'm');
        return empEnd.isBefore(logoutBeforeEarlyLogoutTime)
    }

    getTimeWithIgnInterval(startTime) {
        return moment(startTime).add(this.ignoreInterval, 'm');
    }

    isOnlyPresent(allTimes) {
        return this.isSameOrIgnoreStart(allTimes) && this.isSameOrAfterEarlyEnd(allTimes)
    }

    isSameOrIgnoreStart({ shiftStart, empStart }) {
        const isSameStart = empStart.isSame(shiftStart);

        return isSameStart || this.isIgnoreDiffOnePeriod(empStart, shiftStart)
    }

    isSameOrAfterEarlyEnd({ empEnd, shiftEnd }) {
        const logoutBeforeEarlyLogoutTime = moment(shiftEnd).subtract(this.earlyLogoutPeriod, 'm');
        return empEnd.isSameOrAfter(logoutBeforeEarlyLogoutTime) || this.isSameEnd({ shiftEnd, empEnd });
    }

    isSameEnd({ shiftEnd, empEnd }) {
        return empEnd.isSame(shiftEnd);
    }

    isIgnoreDiffOnePeriod(empTime, shiftTime) {
        const afterShiftTime = moment(shiftTime).add(this.ignoreTime, 'm');
        const beforeShiftTime = moment(shiftTime).subtract(this.ignoreTime, 'm');

        return afterShiftTime.isSameOrAfter(empTime) && beforeShiftTime.isSameOrBefore(empTime);
    }

    parseShiftMinHour(time) {
        try {
            const [hour, minutes] = time.split(':');

            return {
                hour: parseInt(hour, 10),
                minutes: parseInt(minutes, 10)
            }
        } catch (error) {
            throw new Error('Invalid shift Data');
        }
    }

    getDelayThreshold({ shiftStart, shiftEnd }) {
        return Math.ceil(shiftEnd.diff(shiftStart, 'minutes') / 2);
    }

    getWorkTimeDiff({ shiftStart, shiftEnd, empStart, empEnd }) {
        const shiftWorkTime = shiftEnd.diff(shiftStart, 'minutes');
        const empWorkTime = empEnd.diff(empStart, 'minutes');

        return empWorkTime - shiftWorkTime;
    }

    userTimeToMoment(time) {
        return {
            empStart: moment(time.start),
            empEnd: moment(time.end),
        };
    }

    isShiftEndInNextDay(start, end) {
        const startInMin = start.hour * 60 + start.minutes;
        const endInMin = end.hour * 60 + end.minutes;

        return startInMin > endInMin;
    }

    shiftTimeToUTC({ start, end }, day) {
        if (!start || !end) {
            throw new Error('Invalid shift Data');
        }
        const parsedStart = this.parseShiftMinHour(start);
        const parsedEnd = this.parseShiftMinHour(end);

        const startDateWithTz = moment.tz(day, this.timezone);
        const endDateWithTz = startDateWithTz.clone();
        if (this.isShiftEndInNextDay(parsedStart, parsedEnd)) {
            endDateWithTz.add(1, 'day');
        }
        return {
            shiftStart: moment(startDateWithTz).set(parsedStart),
            shiftEnd: moment(endDateWithTz).set(parsedEnd),
        };
    }

    parseLogTime(data) {
        return {
            start: moment.tz(data.start, this.timezone).format('HH:mm'),
            end: moment.tz(data.end, this.timezone).format('HH:mm'),
        }
    }

    next() {
        this.cycleIndex += 1;
    }

    index() {
        return this.cycleIndex;
    }

    getSheet() {
        return { ...this.employee, ...this.counter.values, date: this.attendance }
    }

    hasCompletedMinHalfdayWorkingHours({ empStart, empEnd }) {
        return empEnd.diff(empStart, 'minutes') > this.minWorkingHoursForHalfday;
    }
}

module.exports = AttCalculator;