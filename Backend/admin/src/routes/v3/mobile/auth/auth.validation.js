'use strict';

const Joi = require('@hapi/joi');
// const Common = require('../../../../utils/helpers/Common')
const Common = require('../../../../utils/helpers/Common');

class AuthValidator {
    static validateUserAuthParams() {
        return Joi.object()
            .keys({
                email: Joi.string().required().trim(),
                password: Joi.string().required().trim(),
                language: Joi.string().required().allow('en', 'ar')
            })
            .required();
    }

    static validateUserEmailParams() {
        return Joi.object()
            .keys({
                email: Joi.string().required().trim(),
            })
            .required();
    }

    static validateUserEmailOTPParams() {
        return Joi.object()
            .keys({
                email: Joi.string().required().trim(),
                otp: Joi.number().required().min(1111).max(9999),
            })
            .required();
    }

    static validateUserPasswordParams() {
        return Joi.object()
            .keys({
                password: Joi.string().required().trim(),
                confirm_password: Joi.string().required().trim(),
            })
            .required();
    }

}

module.exports = AuthValidator;