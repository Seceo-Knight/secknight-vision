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


const propertySchema = Joi.object().keys({
    name: Joi.string().required(),
    value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array(), Joi.object()).required(),
});

const propertiesSchema = Joi.object().keys({
    properties: Joi.array().min(1).items(propertySchema),
});

const namesOnlySchema = Joi.object().keys({
    names: Joi.array().min(1).items(Joi.string().required()),
});

class Validation {
    static set(params) {
        return processErrors(Joi.validate(params, propertiesSchema, {abortEarly: false}));
    }

    static get(params) {
        return processErrors(Joi.validate(params, namesOnlySchema, {abortEarly: false}));
    }

    static delete(params) {
        return processErrors(Joi.validate(params, namesOnlySchema, {abortEarly: false}));
    }
}

module.exports.Validation = Validation;
