const Joi = require('joi');

class settingValidation {
    updateSetting(params) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            type: Joi.number().required().max(10),
            values: Joi.number().required(),
            manual_hours: Joi.number().required(),
            colors: Joi.object().keys({
                leaves: Joi.string().required(),
                attendance_override: Joi.string().required(),
                holidays: Joi.string().required(),
                weekOff: Joi.string().required(),
                absent: Joi.string().required(),
            })
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new settingValidation;