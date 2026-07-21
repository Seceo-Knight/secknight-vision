'use strict';

const Joi = require('@hapi/joi');

class UserValidator {
    validSystemInfoParams() {
        return Joi.object().keys({
            operating_system: Joi.string().required(),
            architecture: Joi.string().allow('').required(),
            software_version: Joi.string().allow('').required(),
            service_version: Joi.string().allow('').optional().default(''),
            computer_name: Joi.string().optional().default('').allow(''),
            mac_id: Joi.string().optional().default('').allow(''),
            geolocation: Joi.object().optional(),
        }).required();
    }

    validUserCode() {
        return Joi.object().keys({
            uninstallCode: Joi.string().required()
        }).required();
    }
}

module.exports = new UserValidator;