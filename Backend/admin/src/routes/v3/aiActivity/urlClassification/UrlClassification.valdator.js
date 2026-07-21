const Joi = require('joi');

class UrlClassifictioValidator {
    updateUrlStatus(data) {
        const schema = Joi.object().keys({
            data: Joi.array()
                .items({
                    domain: Joi.string().required().error(() => 'domain is required'),
                    prediction: Joi.string()
                        .required().error(() => 'prediction must be a srting'),
                })
        });
        return Joi.validate({
            data
        }, schema);
    }

    updateUrlStatusObj(data) {
        const schema = Joi.object().keys({
            data: Joi.string().required()
        });
        return Joi.validate({
            data
        }, schema);
    }

    getDomains(skip, limit) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().required(),
            limit: Joi.number().integer().required()
        });
        return Joi.validate({
            skip, limit
        }, schema);
    }

    updateUserRiskScore(data) {
        const schema = Joi.object().keys({
            risk_percentage: Joi.number().min(0).max(100).required().error(() => 'risk_percentage must be in 0 to 100'),
            employee_id: Joi.number().required(),
            date: Joi.date().required()
        });
        return Joi.validate(data, schema);
    }
}

module.exports = new UrlClassifictioValidator;