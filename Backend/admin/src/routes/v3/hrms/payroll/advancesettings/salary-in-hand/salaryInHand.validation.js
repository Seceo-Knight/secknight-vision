// Salary in Hand Validator 

// Imports
const Joi = require("joi");


/**
 * @class SalaryInHandValidator
 * Validator class for different Salary in Hand Routes
 */
class SalaryInHandValidator {

    /**
     * Validates data for getSalaryInHandEmployees controller
     * @function getSalaryInHandEmployees
     * @param {*} params 
     * @returns validated data
     */
    getSalaryInHandEmployees(params) {
        const schema = Joi.object().keys({
            name: Joi.string().min(3).default(null).optional(),
            skip: Joi.number().integer().default(null).optional(),
            limit: Joi.number().integer().default(10),
        });

        return Joi.validate(params, schema);
    }

    /**
     * Validates data for postSalaryInHand controller
     * @function postSalaryInHandEmployees
     * @param {*} params 
     * @returns validated data
     */
    postSalaryInHandEmployees(params) {
        const schema = Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number().required()).required()
        });

        return Joi.validate(params, schema);
    }

    /**
     * Validates data for disableSalaryInHand controller
     * @function disableSalaryInHand
     * @param {*} params 
     * @returns validated data
     */
    disableSalaryInHand(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required()
        });

        return Joi.validate(params, schema);
    }
}


// Exports
module.exports = new SalaryInHandValidator;