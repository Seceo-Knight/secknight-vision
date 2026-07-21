const Joi = require('joi');

class PayrollCreateStructureValidation {

    /**
     * postPayrollCreateStructureValdation - function to validate the post payroll create request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    postPayrollCreateStructureValdation(params) {
        const schema = Joi.object().keys({
            policyName: Joi.string().required(),
            description: Joi.string().max(255).optional(),
            salaryComponents: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required(),
                type: Joi.number().required().valid(1, 2)
            })).optional().min(1) // if salary component is present then min 1 is required
        });
        return Joi.validate(params, schema);
    }

    /**
     * putPayrollCreateStructureValdation - function to validate the put payroll create request
     * 
     * @param {*} params 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    putPayrollCreateStructureValdation(params) {
        const schema = Joi.object().keys({
            policyId: Joi.number().required(),
            policyName: Joi.string().optional(),
            description: Joi.string().max(255).optional(),
            salaryComponents: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                value: Joi.string().required(),
                type: Joi.number().required().valid(1, 2)
            })).optional().min(1) // if salary component is present then min 1 is required
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new PayrollCreateStructureValidation();
