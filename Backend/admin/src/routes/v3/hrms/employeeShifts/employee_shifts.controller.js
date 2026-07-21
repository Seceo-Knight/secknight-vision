/** Employee Shifts Controller */

/** Imports */
const MyError = require("./employee_shifts.utils");
const validator = require("./employee_shifts.validator");
const Logger = require("../../../../logger/Logger").logger;
const EmployeeShiftsService = require("./employee_shifts.service");


/**
 * @class EmployeeShiftsController
 * Controller Methods for Employee Shifts Routes
 */
class EmployeeShiftsController {


    /**
     * Get Employees Shifts Data
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async getEmployeeShifts(req, res) {

        /** Data from token */
        let { organization_id, employee_id, is_manager, is_teamlead, role_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.getEmployeeShifts(req.query);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error", error: error.details[0].message });

            /** If Manager/Teamlead */
            const to_assigned_id = is_manager || is_teamlead ? employee_id : null;
            employee_id = to_assigned_id ? null : employee_id;
            employee_id = value.employee_id ? value.employee_id : employee_id;

            /** Calling Service */
            const service = new EmployeeShiftsService();
            const data = await service.getEmployeeShiftsService({ ...value, organization_id, employee_id, to_assigned_id, role_id });

            /** Response */
            return res.json({ code: 200, data, message: "success", error: null });
        } catch (error) {

            /** If MyError */
            if (error instanceof MyError)
                return res.json({ code: error.code, data: null, message: error.message, error: null });

            Logger.error(`Get Employee Shifts API Error----------------------${error}-----------`);
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    };


    /**
     * Update Employees Shifts
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async postEmployeeShifts(req, res) {

        /** Data from token */
        const { organization_id, user_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.postEmployeeShifts(req.body);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error", error: error.details[0].message });

            /** Calling Service */
            const service = new EmployeeShiftsService();
            const data = await service.postEmployeeShiftsService({ ...value, user_id, organization_id });

            /** Response */
            return res.json({ code: 200, data: null, message: "Employees Shifts Updated", error: null });
        } catch (error) {

            /** If MyError */
            if (error instanceof MyError)
                return res.json({ code: error.code, data: null, message: error.message, error: null });

            Logger.error(`Post Employee Shifts API Error----------------------${error}-----------`);
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    };


    /**
     * Delete Employee Shifts
     * @param {*} req 
     * @param {*} res 
     * @returns
     */
    async deleteEmployeeShifts(req, res) {

        /** Data from token */
        const { organization_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.deleteEmployeeShifts(req.body);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error", error: error.details[0].message });

            /** Calling Service */
            await new EmployeeShiftsService().deleteEmployeeShiftsService({ ...value, organization_id });

            /** Response */
            return res.json({ code: 200, data: null, message: "Employee Shift Deleted", error: null });
        } catch (error) {

            /** If MyError */
            if (error instanceof MyError)
                return res.json({ code: error.code, data: null, message: error.message, error: null });

            Logger.error(`Delete Employee Shifts API Error----------------------${error}-----------`);
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }
}


/** Exports */
module.exports = EmployeeShiftsController;