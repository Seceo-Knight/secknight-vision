const {
	format: formatSql
} = require('mysql2');
const _ = require('lodash');
const moment = require('moment');

const allowSortedColumn = {
	name: 'first_name',
	location: 'location',
	department: 'departament',
	date: 'date',
	duration: 'duration',
	computer: 'computer',
	title: 'title',
	description: 'description',
	time: 'time',

};
const allowSortedOrder = {
	A: 1,
	D: -1,
};

class SystemLogsHelper {
	parseTimeToStr(start, end) {
		return {
			startStr: moment(start).format('YYYY-MM-DD'),
			endStr: moment(end).format('YYYY-MM-DD'),
		};
	}

	isString(str) {
		return typeof str === 'string';
	}

	getAllowSortValue() {
		return {
			columns: Object.keys(allowSortedColumn),
			orders: Object.keys(allowSortedOrder),
		};
	}

	getSortOrder(key) {
		return allowSortedOrder[key];
	}

	sortLogsData(data, sortColumn, sortOrder) {
		return [...data].sort((a, b) => {
			const prev = this.isString(a[sortColumn]) ?
				a[sortColumn].toLowerCase() :
				a[sortColumn];
			const next = this.isString(b[sortColumn]) ?
				b[sortColumn].toLowerCase() :
				b[sortColumn];
			const order = sortOrder === 'D' ? -1 : 1;
			if (prev < next) {
				return -1 * order;
			}
			if (prev > next) {
				return 1 * order;
			}

			return 0;
		});
	}

	assignAndSortedData({
		empData,
		logsData,
		sortColumn,
		sortOrder,
		// timezone
	}) {
		const groupedEmpData = _.groupBy(empData, 'id');

		const data = logsData.map((log) => {
			const [employee] = groupedEmpData[log.employee_id];
			// const start = moment(log.start).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
			const {

				full_name,
				departament,
				location,
				timezone
			} = employee;

			return {
				...log,
				full_name,
				departament,
				location,
				// start,
				timezone,
			};
		});

		return data;
		// const haveSortColumn = sortColumn && sortColumn !== 'date';

		// return haveSortColumn ?
		// 	this.sortLogsData(data, sortColumn, sortOrder) :
		// 	data;
	}

	parseConditionQuery(queries) {
		const keys = Object.keys(queries);

		return _.isEmpty(keys) ? '' : this.parseConditions(keys, queries);
	}

	parseOneCondition(key) {
		switch (key) {
			case 'locationId':
				return ' e.location_id = ?';
			case 'departmentId':
				return ' e.department_id = ?';
			default:
				return '';
		}
	}

	parseConditions(keys, queries) {
		const paramsArray = [];
		const queriesArray = keys.map((key) => {
			paramsArray.push(queries[key]);
			return this.parseOneCondition(key);
		});
		const conditionString =
			queriesArray.length === 1 ?
				`AND${queriesArray[0]}` :
				`AND${queriesArray.join(' AND')}`;

		return formatSql(conditionString, paramsArray);
	}
}

module.exports = new SystemLogsHelper();
