const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class AwardValidation {

    addPromotion(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
            title: Joi.string().required().max(50),
            description: Joi.string().max(255),
            date: Joi.date().required(),
        });
        return Joi.validate(params, schema);
    }

    updatePromotion(params) {
        const schema = Joi.object().keys({
            promotion_id: Joi.number().required(),
            employee_id: Joi.number().required(),
            title: Joi.string().required().max(50),
            description: Joi.string().max(255),
            date: Joi.date().required(),
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new AwardValidation;