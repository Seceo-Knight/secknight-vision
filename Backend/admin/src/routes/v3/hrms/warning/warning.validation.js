const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class WarningValidation {

    addNewWarnings(params) {
        const schema = Joi.object().keys({
            complaint_from: Joi.number().required(25555),
            title: Joi.string().required().max(255),
            complaint_date: Joi.string().required().max(255),
            complaint_against: Joi.number().required().max(100000000),
            description: Joi.string().required().max(100),
            status: Joi.number().required().max(50),
            type: Joi.number().required().max(50),
            warning_type: Joi.number().required().max(255),
        });
        return Joi.validate(params, schema);
    }

}

module.exports = new WarningValidation;