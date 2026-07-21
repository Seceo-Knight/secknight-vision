const Joi = require('joi');
const JoiHapi = require('@hapi/joi');

class ScreenshotValidation {
    validateScreenshot(data) {
        const schema = Joi.object().keys({
            user_id: Joi.number().positive().required(),
            date: Joi.date().required(),
            limit: Joi.number().integer(),
            pageToken: Joi.string().allow(null).allow(""),
            from: Joi.number(),
            to: Joi.number()
        });
        return Joi.validate(data, schema);
    }
}

module.exports = new ScreenshotValidation;