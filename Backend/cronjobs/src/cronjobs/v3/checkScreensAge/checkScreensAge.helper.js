const moment = require('moment-timezone');
const _ = require('underscore');

class CheckScreensAgeHelper {
	async *asyncGenerator(array, callback, args) {
		let i = 0;
		while (i < array.length) {
			yield callback(array[i], args);
			i += 1;
		}
	}

	async asyncMapper(array, callback, args) {
		const resultsArray = [];
		for await (let promiseResulst of this.asyncGenerator(
			array,
			callback,
			args,
		)) {
			resultsArray.push(promiseResulst);
		}

		return resultsArray;
	}

	checkExpireDate(date, lastDate) {
		return moment(date, 'YYYY-MM-DD').isBefore(lastDate, 'day');
	}

	checkPrevDay(date, lastDate) {
		return lastDate.isSame(date, 'day');
	}

	findNextDayHour(tzOffset) {
		const offsetInHour = Math.abs(tzOffset) / 60;

		return Math.floor(24 - offsetInHour);
	}

	getTZOffset(timezone, date) {
		return moment.tz.zone(timezone).utcOffset(date);
	}

	// getLastDate(monthCount) {
	//     return moment().subtract(monthCount, 'month');
	// }
	getLastDate(daysCount) {
		return moment().subtract(daysCount, 'days');
	}

	getParam(arr) {
		const obj = _.first(arr);

		return (property) => _.property(property)(obj);
	}

	needTimezone(type) {
		return type === 'ZH' || type === 'FTP';
	}
}

module.exports = new CheckScreensAgeHelper();
