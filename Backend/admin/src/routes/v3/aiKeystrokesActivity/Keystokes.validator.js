const Joi = require('joi');
class keystrokesValidator {
    addConversationClassification(data) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().positive().required(),
            organization_id: Joi.number().positive().required(),
            date: Joi.date().required(),
            result: Joi.array()
                .items({
                    application_id: Joi.string().required().error(() => 'application_id is required'),
                    prediction: Joi.number()
                        .required().error(() => 'prediction must be a number'),
                    offensive_words: Joi.string().allow(null, ""),
                })
        });
        return Joi.validate(data, schema);
    }

    validateObject(data) {
        const schema = Joi.object().keys({
            tdata: Joi.object().required(),
        });
        return Joi.validate(data, schema);
    }

    validateSkipLimit(skip, limit, timezone) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(1),
            timezone: Joi.string().required()

        });
        return Joi.validate({ skip, limit, timezone }, schema);
    }

    addBulkConversationClassification(data) {
        const schema = Joi.object().keys({
            data: Joi.array()
                .items({
                    application_id: Joi.string().required().error(() => 'application_id is required'),
                    prediction: Joi.number()
                        .required().error(() => 'prediction must be a number'),
                    offensive_words: Joi.string().allow(null, ""),
                    employee_id: Joi.number().positive().required().error(() => 'employee_id must be a number'),
                    organization_id: Joi.number().positive().required().error(() => 'organization_id must be a number'),
                    date: Joi.date().required(),
                })
        });
        return Joi.validate({ data }, schema);
    }

}
module.exports = new keystrokesValidator;