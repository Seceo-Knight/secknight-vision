const { format: formatSql } = require('mysql2');
const moment = require('moment-timezone');
const _ = require('lodash');

const AttCalculator = require('./EmployeeServices/AttTimeCalculator');
const AttendanceCalculator = require('./EmployeeServices/TimeCalculator');
const allowSortedColumn = {
    name: 'u.first_name',
    location: 'ol.name',
    department: 'od.name',
    emp_code: 'e.emp_code',
};
const allowSortedOrder = {
    A: 'ASC',
    D: 'DESC',
};
const fieldsOfSearch = ['u.first_name', 'u.last_name', 'e.emp_code', 'od.name', 'ol.name'];

class EmployeeHelper {
    getAllowSortValue() {
        return {
            columns: Object.keys(allowSortedColumn),
            orders: Object.keys(allowSortedOrder),
        };
    };

    parseSortQuery(sortColumn, sortOrder) {
        if (!sortColumn) return '';

        const column = allowSortedColumn[sortColumn];
        const order = allowSortedOrder[sortOrder];

        return ` ORDER BY ${column} ${order}`;
    };

    parseLimitInstruct(limit, skip) {
        if (!limit) return '';

        return formatSql(' LIMIT ?,?', [skip, limit]);
    };

    parseConditionQuery({ search, ...queries }) {
        const searchQuery = search ? this.parseSearchByWord(search) : '';
        const keys = Object.keys(queries);
        const сonditionQuery = keys.length === 0 ? '' : this.parseConditions(keys, queries);
        return сonditionQuery + searchQuery;
    }

    parseSearchByWord(search) {
        const searchString = fieldsOfSearch.reduce((acc, field) => {
            const query = ` LCASE(${field}) LIKE '%${search}%'`;
            acc += acc !== ' AND (' ? ` OR${query}` : query;

            return acc;
        }, ' AND (');
        const fullNameQuery = this.parseFullNameQuery(search);

        return searchString + fullNameQuery;
    };

    parseFullNameQuery(search) {
        const [fName, secPart, ...rest] = search.split(' ');
        if (!secPart) return ')';

        const last = _.last(rest);
        const lName = last || secPart;
        const query = ` OR ( LCASE(u.first_name) LIKE '%${fName}%' AND LCASE(u.last_name) LIKE '%${lName}%'))`;

        return query;
    };

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
            queriesArray.length === 1 ? `AND${queriesArray[0]}` : `AND${queriesArray.join(' AND')}`;

        return formatSql(conditionString, paramsArray);
    }

    getShifts(attendanceData) {
        return _.uniq(_.map(attendanceData, 'shift_id'));
    }

    getEmpId(empData) {
        return _.map(empData, 'id');
    }

    getAttMonthRangeDate(date) {
        const utcStartMonth = moment.utc(date, 'YYYYMM').startOf('month');

        return {
            start: utcStartMonth.clone().toISOString(),
            end: utcStartMonth.clone().endOf('month').add(1, 'day').toISOString()
        }
    }

    employeeAttendanceMapper({ empData, attendanceData, shifts, date, orgTimezone }) {
        const groupedByID = _.groupBy(attendanceData, 'employee_id');
        const groupedShifts = _.groupBy(shifts, 'id');
        const range = AttCalculator.parseMonthRange(date);

        return empData.map(
            (employee) => {
                const attendanceData = groupedByID[employee.id];
                const shift = _.get(groupedShifts, `${employee.shift_id}[0]`);
                const empCalc = new AttCalculator({ employee, range, shift, attendanceData, orgTimezone });

                return empCalc.calculate();
            });
    }
    async AttendanceMapper({ empData, attendanceData, shifts, date, orgTimezone }) {
        const groupedByID = _.groupBy(attendanceData, 'employee_id');
        const groupedShifts = _.groupBy(shifts, 'id');
        const range = AttendanceCalculator.parseMonthRange(date);
        let attendance =[];
        for(let employee of empData){
            const attendanceData = groupedByID[employee.id];
            const shift = _.get(groupedShifts, `${employee.shift_id}[0]`);
            const empCalc = new AttendanceCalculator({ employee, range, shift, attendanceData, orgTimezone });
            const result =  await empCalc.calculate();
            attendance.push(result)
        }
        return attendance;
    }

    checkError(error) {
        const incorrectMessage = _.get(error, 'details[0].message');
        if (!incorrectMessage) return error;

        error.message = incorrectMessage.replace(/"/gi, '');

        return error;
    };

    findPageCount(limit, count) {
        switch (true) {
            case count === 0:
                return 0;
            case !limit:
                return 1;
            default:
                return Math.ceil(count / limit);
        }
    };
}

module.exports = new EmployeeHelper();
