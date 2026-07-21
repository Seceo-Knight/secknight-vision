const Joi = require('joi');

class RunPayrollPayRegisterValidation {
    getPayRegisterValidation(params) {
        const schema = Joi.object().keys({
            skip: Joi.number().allow(0).positive().optional().default(null),
            limit: Joi.number().allow(0).optional().default(null),
            date: Joi.date().raw().iso().required(),
            employee_type: Joi.number().valid(0, 1, 2, 3, 4, 5).default(0),
            components: Joi.number().valid(1, 2, 3, 4).default(null),
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new RunPayrollPayRegisterValidation();
