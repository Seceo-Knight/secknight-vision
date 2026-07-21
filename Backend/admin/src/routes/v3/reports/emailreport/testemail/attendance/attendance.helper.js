const _ = require('lodash');
const moment = require('moment-timezone');
const AttCalculator = require('./AttTimeCalculator');

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

class EmployeeHelper {
    getAllowSortValue() {
        return {
            columns: Object.keys(allowSortedColumn),
            orders: Object.keys(allowSortedOrder),
        };
    };

    getShifts(attendanceData) {
        return _.uniq(_.map(attendanceData, 'shift_id'));
    }

    getEmpId(empData) {
        return _.map(empData, 'id');
    }

    getAttMonthRangeDate(date) {
        const start = moment(date).subtract(1, "months").format("YYYY-MM-DD");
        const end = moment(date).format("YYYY-MM-DD");
        return { start, end };
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

    checkError(error) {
        const incorrectMessage = _.get(error, 'details[0].message');
        if (!incorrectMessage) return error;

        error.message = incorrectMessage.replace(/"/gi, '');

        return error;
    };
}

module.exports = new EmployeeHelper();
