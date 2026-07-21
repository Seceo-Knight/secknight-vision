const Joi = require('joi');

class PayrollSalaryRevisionValidation {
    getSalaryRevisionValidation(params) {
        const schema = Joi.object().keys({
            skip: Joi.number().allow(0).positive().optional(),
            limit: Joi.number().allow(0).optional(),
            date: Joi.date().raw().iso().required()
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new PayrollSalaryRevisionValidation();
