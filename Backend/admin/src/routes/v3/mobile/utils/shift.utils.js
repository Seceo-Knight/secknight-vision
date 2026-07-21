const moment = require('moment-timezone');
const isEndInNextDay = (start, end) => {
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');
    const startInMin = +startHours * 60 + +startMinutes;
    const endInMin = +endHours * 60 + +endMinutes;
    return startInMin > endInMin;
}
module.exports = { isEndInNextDay };