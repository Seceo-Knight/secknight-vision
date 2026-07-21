const Joi = require('joi');

class PayrollPreviewValidation {

    /**
     * getPayrollPreviewValdation - function to validate the get payroll preview request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getPayrollPreviewValdation(params) {
        const schema = Joi.object().keys({
            limit: Joi.number().integer().optional(),
            skip: Joi.number().integer().optional(),
            employeeId: Joi.number().integer().optional(),
            date: Joi.date().iso().raw().required(),
            isOverrideCalc: Joi.boolean().default(false).optional()
        });
        return Joi.validate(params, schema);
    }
    completeActionValidation(params) {
        const schema = Joi.object().keys({
            date: Joi.date().iso().raw().required(),
            completed: Joi.boolean().default(false),
            isOverrideCalc: Joi.boolean().default(false).optional(),
            employeeId: Joi.number().positive().optional()
        });
        return Joi.validate(params, schema);
    }

    /**
     * getEmployeeTds - function to validate getEmployeeTds request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployeeTds(params, isEmployeeLogin) {
        let validationSchemaObj = {
            employee_id: Joi.number().positive().optional()
        };
        //for admin 
        if (!isEmployeeLogin) {
            validationSchemaObj = {
                employee_id: Joi.number().positive().required()
            }
        }
        const schema = Joi.object().keys(validationSchemaObj);
        return Joi.validate(params, schema);
    }
}

module.exports = new PayrollPreviewValidation();
