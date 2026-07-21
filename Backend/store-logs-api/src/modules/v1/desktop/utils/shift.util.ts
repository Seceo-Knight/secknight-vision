import moment = require('moment-timezone');

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const setDateTime = (date, time, timezone) => {
    const [hours, minutes] = time.split(':');
    return moment.tz(date.toISOString().substr(0, 10), timezone).set({ hours, minutes, seconds: 0, milliseconds: 0 }).utc();
};

const isEndInNextDay = (start, end) => {
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');
    const startInMin = +startHours * 60 + +startMinutes;
    const endInMin = +endHours * 60 + +endMinutes;
    return startInMin > endInMin;
}

export const timesByDate = async (data, date, timezone) => {
    date = new Date(date)
    const day = DAYS[date.getDay()];
    const shift = data[day];

    if (!shift || !shift.status) {
        return Promise.resolve({});
    }
    let endDate = date;
    if (isEndInNextDay(shift.time.start, shift.time.end)) {
        endDate = moment(date, "YYYY-MM-DD").add(1, 'day');
    }

    return Promise.resolve({
        start: setDateTime(date, shift.time.start, timezone),
        end: setDateTime(endDate, shift.time.end, timezone),
    });
}