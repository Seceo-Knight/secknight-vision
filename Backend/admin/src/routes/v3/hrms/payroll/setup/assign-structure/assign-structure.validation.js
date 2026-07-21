const Joi = require('joi');

class PayrollAssignStructureValidation {

    /**
     * getPayrollAssignStructureValidation - function to validate the get assign structure request
     * 
     * @param {*} params 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getPayrollAssignStructureValidation(params) {
        const schema = Joi.object().keys({
            employeeId: Joi.number().optional(),
            locationId: Joi.number().optional(),
            roleId: Joi.number().optional(),
            search: Joi.string().optional(),
            payrollPolicyId: Joi.number().optional(),
            sortOrder: Joi.string().allow(null).default(null),
            sortColumn: Joi.string().allow(null).default('D'),
            skip: Joi.number().optional(),
            limit: Joi.number().optional(),
            employee_type: Joi.number().valid(0, 1, 2, 3, 4, 5).default(0),
        });
        var result = Joi.validate(params, schema);
        return result;
    }

    /**
     * putPayrollAssignStructureValidation - function to validate put assign changes 
     * 
     * @param {*} params 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    putPayrollAssignStructureValidation(params) {
        const schema = Joi.object().keys({
            employeeId: Joi.number().positive().required(),
            ctc: Joi.number().positive().optional(),
            payrollPolicyId: Joi.number().positive().optional()
        });
        var result = Joi.validate(params, schema);
        return result;
    }
    /**
     * putBulkPayrollAssignStructureValidation - function to validate put assign changes 
     * 
     * @param {*} params 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    putBulkPayrollAssignStructureValidation(params) {
        const schema = Joi.object().keys({
            employeeIds: Joi.array().items(Joi.number().positive().allow(0)).required(),
            payrollPolicyId: Joi.number().positive().required()
        });
        var result = Joi.validate(params, schema);
        return result;
    }
}

module.exports = new PayrollAssignStructureValidation;
