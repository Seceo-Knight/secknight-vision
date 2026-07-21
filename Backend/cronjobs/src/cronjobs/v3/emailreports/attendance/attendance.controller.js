const model = require("./attendance.model");
const helper = require("./attendance.helper");

module.exports = async ({ orgId: organization_id, empIds: employee_ids, depIds: department_ids, date }) => {
    try {
        const empData = await model.getEmployeeForAttSheet({
            organization_id,
            department_ids,
            employee_ids
        });
        if (empData.length === 0) return null;

        const employeesId = helper.getEmpId(empData);
        const shiftsId = helper.getShifts(empData);
        if (shiftsId.length === 0) return null;

        const [attendanceData, shifts, orgTimezone] = await Promise.all([
            model.getAttendanceSheet({
                organization_id,
                employeesId,
                date,
            }),
            model.getOrganizationShift(shiftsId),
            model.getOrgTimezone(organization_id),
        ]);

        return helper.employeeAttendanceMapper({
            empData,
            attendanceData,
            shifts,
            date,
            orgTimezone,
        });
    } catch (err) {
        return helper.checkError(err);
    }
}