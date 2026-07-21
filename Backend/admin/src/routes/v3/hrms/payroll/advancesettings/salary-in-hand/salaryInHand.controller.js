// Salary in Hand Controller 

// Imports 
const MyError = require("./salaryInHand.utils");
const validator = require("./salaryInHand.validation");
const SalaryInHandService = require("./salaryInHand.service");
const Logger = require("../../../../../../logger/Logger").logger;


/**
 * @class SalaryInHandController
 * Controller Methods for Salary in Hand Routes
 */
class SalaryInHandController {


    /**
     * Controller Method for Get route
     * @function getSalaryInHandEmployees
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async getSalaryInHandEmployees(req, res) {

        // Data from token
        let { organization_id, employee_id, is_manager, is_teamlead, role_id } = req.decoded;
        try {

            // Validation
            const { value, error } = validator.getSalaryInHandEmployees(req.query);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error", error: error.details[0].message });

            // If Manager/Teamlead
            const to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            // Calling Service 
            const data = await new SalaryInHandService().getSalaryInHandService({
                ...value, organization_id, to_assigned_id, role_id
            });

            // Response
            return res.json({ code: 200, data, message: "success", error: null });
        } catch (error) {

            // If error is instance of MyError
            if (error instanceof MyError)
                return res.json({ code: error.code, data: null, message: error.message, error: null });

            // Logs error and returns error
            Logger.error(`Get Salary in Hand API Error----------------------${error}-----------`);
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }


    /**
     * Controller Method for Post route
     * @function postSalaryInHand
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async postSalaryInHand(req, res) {

        // Data from token 
        const { organization_id, user_id } = req.decoded;
        try {

            // Validation 
            const { value, error } = validator.postSalaryInHandEmployees(req.body);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error", error: error.details[0].message });

            // Calling Service
            await new SalaryInHandService().postSalaryInHandService({ ...value, user_id, organization_id });

            // Message to be shown 
            let message = +value.employee_ids.length === 1 ? "Employee Added in Salary In Hand." : "Employees are Added in Salary In Hand.";

            // Response 
            return res.json({ code: 200, data: null, message, error: null });
        } catch (error) {

            // If error is instance of MyError
            if (error instanceof MyError)
                return res.json({ code: error.code, data: null, message: error.message, error: null });

            // Logs error and returns error
            Logger.error(`Post Salary in Hand API Error----------------------${error}-----------`);
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }


    /**
     * Controller Method for Delete route
     * @function disableSalaryInHand
     * @param {*} req 
     * @param {*} res 
     * @returns
     */
    async disableSalaryInHand(req, res) {

        // Data from token
        const { organization_id } = req.decoded;
        try {

            // Validation
            const { value, error } = validator.disableSalaryInHand(req.body);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error", error: error.details[0].message });

            // Calling Service
            await new SalaryInHandService().disableSalaryInHandService({ ...value, organization_id });

            // Response
            return res.json({ code: 200, data: null, message: "Employee Removed From Salary In Hand.", error: null });
        } catch (error) {

            // If error is instance of MyError
            if (error instanceof MyError)
                return res.json({ code: error.code, data: null, message: error.message, error: null });

            // Logs error and returns error
            Logger.error(`Delete Salary in Hand API Error----------------------${error}-----------`);
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }
}


// Exports
module.exports = SalaryInHandController;