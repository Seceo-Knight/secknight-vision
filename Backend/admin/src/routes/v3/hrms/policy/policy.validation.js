const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class PolicyValidation {

    addPolicy(params) {
        const schema = Joi.object().keys({
            title: Joi.string().required().max(50),
            description: Joi.string().required().max(50),
        });
        return Joi.validate(params, schema);
    }

    updatePolicy(params) {
        const schema = Joi.object().keys({
            policy_id: Joi.string().required().max(50),
            title: Joi.string().required().max(50),
            description: Joi.string().required().max(50),
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new PolicyValidation;