const {TYPES} = require('./Model');
const Joi = require('joi');

const processErrors = (validation) => {
    if (!validation.error) return validation;
    const errorMessages = {};
    validation.error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errorMessages[key] = key in errorMessages ? errorMessages[key] : [];
        errorMessages[key].push(detail.message);
    });
    return {...validation, errorMessages};
};


class Validation {
    static search(params) {
        const schema = Joi.object().keys({
            keyword: Joi.string().min(3).required(),
            type: Joi.number().integer().valid(Object.keys(TYPES).map(x => +x)).required(),
            limit: Joi.number().integer().default(20),
        });
        return processErrors(Joi.validate(params, schema, {abortEarly: false}));
    }

    static upsert(params) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            type: Joi.number().integer().valid(Object.keys(TYPES).map(x => +x)).required(),
        });
        return processErrors(Joi.validate(params, schema, {abortEarly: false}));
    }
}

module.exports.Validation = Validation;
