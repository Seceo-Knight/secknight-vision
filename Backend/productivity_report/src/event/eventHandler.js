const EmpProductivityReport = require('../models/employee_productivity.schema')

exports.updateLocationHandler = async ({employee_id, location_id}) => {
    try {
        if(employee_id && location_id) {
            await EmpProductivityReport.updateMany({ employee_id }, { $set: { location_id } });
        }
    } catch (err) {
        console.error(err);
    }
}

exports.updateDepartmentHandler = async ({employee_id, department_id}) => {
    try {
        if(employee_id && department_id) {
            await EmpProductivityReport.updateMany({ employee_id }, { $set: { department_id } });
        }
    } catch (err) {
        console.error(err);
    }
}

// (async () => console.log(await EmpProductivityReport.updateMany({ employee_id: 8 }, { $set: { location_id: 2 } })))();