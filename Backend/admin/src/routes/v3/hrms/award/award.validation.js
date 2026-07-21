const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class AwardValidation {
    getAwards(params) {
        const schema = Joi.object().keys({
            award_id: Joi.number().allow(null, "").max(50),
        });
        return Joi.validate(params, schema);
    }

    createAward(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
            award_type: Joi.string().required().max(50),
            award_date: Joi.date().required(),
            gift: Joi.string().required().max(50),
            cash: Joi.string().allow(null, "").required().max(50),
            award_info: Joi.string().required().max(50),
            award_photo: Joi.string().required(),
        });
        return Joi.validate(params, schema);
    }

    updateAward(params) {
        const schema = Joi.object().keys({
            award_id: Joi.number().required(),
            employee_id: Joi.number().required(),
            award_type: Joi.string().required().max(50),
            award_date: Joi.date().required(),
            gift: Joi.string().required().max(50),
            cash: Joi.string().allow(null, "").required().max(50),
            award_info: Joi.string().required().max(50),
            award_photo: Joi.string().required(),
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new AwardValidation;