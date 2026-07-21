/** Employees Shifts Service */

/** Imports */
const moment = require("moment");
const MyError = require("./employee_shifts.utils");
const employeeShiftsModel = require("./employee_shifts.model");


/**
 * @class EmployeeShiftsService
 * Services for Employee Shifts Controllers
 */
class EmployeeShiftsService {


    /**
     * Service for Get EmployeeShifts Controller
     * @param {*} param0 
     * @returns 
     */
    async getEmployeeShiftsService({ name, skip, limit, organization_id,
        employee_id, is_employee, to_assigned_id, role_id }) {

        try {

            /** Get Organization Shifts Data */
            const organizationShiftsData = await employeeShiftsModel.getOrganizationShiftsData({ organization_id });
            if (!organizationShiftsData.length) throw new MyError(400, "Organization Shifts Not Found!");

            /** Get Employee Shifts Data */
            let employeesData = await employeeShiftsModel.getEmployeesData({
                name, skip, limit, organization_id, employee_id,
                is_employee, to_assigned_id, role_id
            });
            if (!employeesData.length) throw new MyError(400, "Employees Not Found!");

            /** Extracting employee_ids from employees Data */
            const employee_ids = employeesData.map(x => { return x.employee_id });

            /** Get Employee Shifts Data */
            const employeeShiftsData = await employeeShiftsModel.getEmployeesShifts({ organization_id, employee_ids });


            /** 
             * Mapping Organization Shifts Data
             * to Employees Shifts 
             */
            for (const element of employeesData) {

                /** Employee Default Shift Added in Emp Monitor */
                element.empShift = {
                    shift_id: element.shift_id,
                    shift_name: element.shift_name
                };

                /** Delete default shift_id and shift_name */
                delete element.shift_id;
                delete element.shift_name;

                /** Manual Shifts */
                element.shifts = [];
                if (employeeShiftsData.length) {
                    employeeShiftsData.forEach(x => {

                        if (element.employee_id == x.employee_id)
                            element.shifts.push({
                                shift_id: x.shift_id,
                                shift_name: x.shift_name,
                                start_date: x.start_date,
                                end_date: x.end_date,
                            });
                    });
                }
            }

            /** Returns Arranged Employee Shifts Data */
            return employeesData;
        } catch (error) {

            /** Throws error to controller */
            throw error;
        }
    };



    /**
     * Service for Update EmployeeShifts Controller
     * @param {*} param0 
     * @returns 
     */
    async postEmployeeShiftsService({ organization_id, user_id, shift_id, start_date, end_date, employee_ids }) {
        try {

            /** Date Formatting */
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');

            /** If start_date is less than end_date */
            if (moment(end_date).isBefore(moment(start_date))) throw new MyError(400, "Check the start date and end date given!");

            /** Get Organization Shifts Data */
            const [organizationShiftsData] = await employeeShiftsModel.getOrganizationShiftsData({ organization_id, shift_id });
            if (!organizationShiftsData) throw new MyError(400, "Organization Shift Not Found!");

            /** Check if all employee_ids are correct or not */
            const checkEmpIds = await employeeShiftsModel.checkEmployeeIds({ organization_id, employee_ids });
            if (checkEmpIds.length != employee_ids.length) throw new MyError(400, "Employees Not Found!");

            /** if timings is in different shifts */
            const checkEmpShiftTiming = await employeeShiftsModel.checkEmpShiftTiming({ organization_id, employee_ids, shift_id, start_date, end_date });
            if (checkEmpShiftTiming.length) throw new MyError(400, "Some Employees have other shifts assigned on the given dates!");

            /** Get existing Employee Shifts Data */
            const employeeShiftsData = await employeeShiftsModel.employeeShifts({ organization_id, employee_ids, shift_id });

            /** Sorting data for update and insert */
            let updateData = [], insertData = [];
            employee_ids.forEach(id => {
                if (employeeShiftsData.some(x => x.employee_id == id)) updateData.push(id);
                else insertData.push([id, organization_id, shift_id, start_date, end_date, user_id, user_id]);
            });

            /** Update/Insert Employee Shifts */
            if (updateData.length) await employeeShiftsModel.updateEmployeeShifts({ updateData, shift_id, start_date, end_date, organization_id, user_id });
            if (insertData.length) await employeeShiftsModel.insertEmployeeShifts(insertData);

            /** Returns */
            return;
        } catch (error) {

            /** Throws error to controller */
            throw error;
        }
    };


    /**
     * Deletes employee shift
     * @param {*} param0 
     */
    async deleteEmployeeShiftsService({ employee_id, shift_id, organization_id }) {

        /** Get existing Employee Shifts Data */
        const employeeShiftsData = await employeeShiftsModel.employeeShifts({ organization_id, employee_ids: employee_id, shift_id });
        if (!employeeShiftsData.length) throw new MyError(400, "Shift Not assigned to the Employee!");

        /** Deletes employee shift */
        await employeeShiftsModel.deleteEmployeeShifts({ organization_id, employee_id, shift_id });
    }
}


/** Exports */
module.exports = EmployeeShiftsService;