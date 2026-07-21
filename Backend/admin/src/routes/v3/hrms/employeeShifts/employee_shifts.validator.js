/** Employee Shifts Validator */

/** Imports */
const Joi = require("joi");



class EmployeeShiftsValidator {

    getEmployeeShifts(params) {
        const schema = Joi.object().keys({
            name: Joi.string().min(3).default(null).optional(),
            employee_id: Joi.number().default(null),
            skip: Joi.number().integer().default(null).optional(),
            limit: Joi.number().integer().default(10).optional(),
        });

        return Joi.validate(params, schema);
    };


    postEmployeeShifts(params) {
        const schema = Joi.object().keys({
            shift_id: Joi.number().integer().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            employee_ids: Joi.array().items(Joi.number().required()).required()
        });

        return Joi.validate(params, schema);
    }


    deleteEmployeeShifts(params) {
        const schema = Joi.object().keys({
            shift_id: Joi.number().integer().required(),
            employee_id: Joi.number().integer().required()
        });

        return Joi.validate(params, schema);
    }
}


/** Exports */
module.exports = new EmployeeShiftsValidator;