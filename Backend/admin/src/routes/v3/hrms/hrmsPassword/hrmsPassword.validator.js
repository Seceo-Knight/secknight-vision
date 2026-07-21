/** HRMSPassword Validator */

/** Imports */
const Joi = require("joi");


/**
 * @class HRMSPasswordValidator
 * Methods For API's data validation
 */
class HRMSPasswordValidator {

    checkPassword(params) {
        const schema = Joi.object().keys({
            password: Joi.string().required(),
            type: Joi.number().valid(1, 2).required()
        });

        return Joi.validate(params, schema);
    }

    forgotPassword(params) {
        const schema = Joi.object().keys({
            type: Joi.number().valid(1, 2).required()
        });

        return Joi.validate(params, schema);
    }

    forgotPasswordCode(params) {
        const schema = Joi.object().keys({
            type: Joi.number().valid(1, 2).required(),
            password: Joi.string().required(),
            code: Joi.number().required()
        });

        return Joi.validate(params, schema);
    }
}


/** Exports */
module.exports = new HRMSPasswordValidator;