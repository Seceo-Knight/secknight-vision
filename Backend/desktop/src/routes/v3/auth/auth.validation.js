'use strict';

const Joi = require('@hapi/joi');

const Common = require('../../../utils/helpers/CommonFunctions');
class AuthValidator {
    validToken() {
        return Joi.object().keys({
            user_agent: Joi.string().required(),
            token: Joi.string().required()
        }).required();
    }

    validateLoginParams() {
        return Joi.object().keys({
            email: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            password: Joi.string().optional(),
            macId: Joi.string().optional(),
            testing: Joi.number().default(0)
        }).required();
    }

    validateAutoRegistartionParams() {
        return Joi.object({
            macId: Joi.string().guid().required(),
            organizationId: Joi.string().required(),
            username: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            computerName: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            firstname: Joi.string().allow('').required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            lastname: Joi.string().allow('').required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            domain: Joi.string().allow('').optional(),
            isActiveDirectory: Joi.number().allow(0, 1).optional(),
            a_email: Joi.string().allow(null, '').optional().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            activeDirectoryMeta: Joi.object().optional().allow(null, {}).default({})
        }).required();
    }
}

module.exports = new AuthValidator;