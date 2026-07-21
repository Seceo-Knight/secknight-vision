const { BaseModel } = require('../../../models/BaseModel');
const Organization = require('../../../routes/v3/organization');
const EmployeeModel = require('./Employee.model');

class EmployeeAttendanceModel extends BaseModel {
    static get TABLE_NAME() {
        return 'employee_attendance';
    }

    static get TABLE_FIELDS() {
        return [
            'id',
            'employee_id',
            'organization_id',
            'date',
            'start_time',
            'end_time',
            'created_at',
            'updated_at',
        ];
    }

    get organization() {
        if (this._organization) return Promise.resolve(this._organization);
        return Organization.OrganizationModel.get(this.organization_id).then((organization) => {
            this._organization = organization;
            return organization;
        });
    }

    get employee() {
        if (this._employee) return Promise.resolve(this._employee);
        return EmployeeModel.get(this.employee_id).then((employee) => {
            this._employee = employee;
            return employee;
        });
    }
}

module.exports.EmployeeAttendanceModel = EmployeeAttendanceModel;
