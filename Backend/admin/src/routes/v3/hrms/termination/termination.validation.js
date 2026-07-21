const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class TerminationValidation {

    addTermination(params) {
        const schema = Joi.object().keys({
            type: Joi.number().required(),
            employee_id: Joi.number().required(),
            notice: Joi.date().required(),
            termination: Joi.date().required(),
            reason: Joi.string().required().max(50),
            description: Joi.string().max(255),
        });
        return Joi.validate(params, schema);
    }

    updateTermination(params) {
        const schema = Joi.object().keys({
            termination_id: Joi.number().required(),
            type: Joi.number().required(),
            employee_id: Joi.number().required(),
            notice: Joi.date().required(),
            termination: Joi.date().required(),
            status: Joi.number().required(),
            reason: Joi.string().required().max(50),
            description: Joi.string().max(255),
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new TerminationValidation;