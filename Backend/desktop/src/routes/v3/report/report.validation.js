'use strict';

const Joi = require('@hapi/joi');

const Comman = require('../../../utils/helpers/CommonFunctions');

class ReportValidation {
    validateEmailContent() {
        return Joi.object({
            email_info: Joi.array().items(
                Joi.object({
                    mail_time: Joi.string().trim().required().isoDate(),
                    // date: Comman.dateValidator('date').required(),
                    from: Joi.string().required(),
                    to: Joi.string().required(),
                    subject: Joi.string().default(null),
                    body: Joi.string().default(null),
                    client_type: Joi.string(),
                    type: Joi.number(),
                    cc: Joi.string().default(''),
                    bcc: Joi.string().default(''),
                    attachments: Joi.array().items(Joi.object({
                        mail_id: Joi.string().allow(''),
                        attachment_id: Joi.string().allow(''),
                        file_name: Joi.string().allow(''),
                        file_path: Joi.string().allow(''),
                        file_size: Joi.string().allow(''),
                        file_content: Joi.string().allow(''),
                    }))
                })
            ).required().min(1)
        }).required();
    }

    /**
     * validateEmailContentNew
     * @description validator for the email activity
     * @returns 
     */
    validateEmailContentNew() {
        return Joi.object({
            email_info: Joi.array().items(
                Joi.object({
                    mail_time: Joi.string().trim().required().isoDate(),
                    from: Joi.string().required(),
                    to: Joi.string().required(),
                    subject: Joi.string().default(null),
                    body: Joi.string().default(null),
                    client_type: Joi.string(),
                    type: Joi.number(),
                    cc: Joi.string().default(''),
                    bcc: Joi.string().default(''),
                    attachments: Joi.array().items(Joi.object({
                        mail_id: Joi.string().allow(''),
                        attachment_id: Joi.string().allow(''),
                        file_name: Joi.string().allow(''),
                        file_path: Joi.string().allow(''),
                        file_size: Joi.string().allow(''),
                        file_content: Joi.string().allow(''),
                        link: Joi.string().allow(''),
                    }))
                })
            ).required().min(1)
        }).required();
    }
}

module.exports = new ReportValidation;