'use strict';

const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');

class PRValidator {
    getProductivityRanking() {
        return Joi.object().keys({
            page: Joi.number().integer().positive().default(1),
            limit: Joi.number().integer().positive().default(25),
            type: Joi.number().valid(1, 2),
            category_type: Joi.string().valid('All', 'Global', 'Custom', 'New').default('All'),
            name: Joi.string().allow(null).allow("")
        });
    }

    updateProductivityRankingNew() {
        const arraySchema = Joi.array().items(Joi.number().integer().positive()).required();

        return Joi.object().keys({
            application_id: Joi.string().required(),
            department_rule: Joi.object({
                productive: arraySchema,
                unproductive: arraySchema,
                neutral: arraySchema,
            }).required()
        });
    }

    updateProductivityRanking() {
        return Joi.object().keys({
            application_id: Joi.string().required(),
            department_rules: Joi.array().items(
                Joi.object({
                    department_id: Joi.number().integer().positive().required().allow(null),
                    status: Joi.number().valid(0, 1, 2).required(),
                }).required()
            ).required().unique((a, b) => a.department_id === b.department_id),
        });
    }

    bulkUpdateProductivityRanking() {
        const objectSchema = Joi.object().keys(
            {
                application_id: Joi.string().required(),
                department_rules: Joi.array().items(
                    Joi.object({
                        department_id: Joi.number().integer().positive().required().allow(0),
                        status: Joi.number().valid(0, 1, 2).required(),
                    }).required()
                ).required().unique((a, b) => a.department_id === b.department_id),
            }
        ).required();

        // cannot have duplicate data for application_id
        const arraySchema = Joi.array().items(objectSchema).unique((a, b) => a.application_id === b.application_id);

        return Joi.object({
            data: Joi.alternatives().try(arraySchema).required()
        }).required();
    }

    updateProductivityRankingOld() {
        return Joi.object().keys({
            application_id: Joi.string().required(),
            department_ids: Joi.array().items(Joi.number().integer().positive()).required(),
            status: Joi.number().valid(0, 1, 2)
        });
    }

    //   upsertProductivityRanking() {
    //     return Joi.object().keys({
    //       app_domain_id: Joi.number().required(),
    //       department_id: Joi.number().min(1),
    //       status: Joi.number().min(0).max(2).required()
    //     }).required();
    //   }

    //   addProductivityRanking() {
    //     return Joi.object().keys({
    //       name: Joi.string().required(),
    //       type: Joi.string().valid('APP', 'WEB').required(),
    //       status: Joi.number().min(0).max(2).required()
    //     }).required();
    //   }

    //   bulkAddProductivityRanking() {
    //     const objectSchema = Joi.object().keys({
    //       app_domain_id: Joi.number().min(1).required(),
    //       department_id: Joi.number().min(1).required(),
    //       status: Joi.number().min(0).max(2).required()
    //     })

    //     // cannot have duplicate data for same app_domain
    //     const arraySchema = Joi.array().items(objectSchema).unique((a, b) => a.app_domain_id === b.app_domain_id);

    //     return Joi.object({
    //       data: Joi.alternatives().try(arraySchema).required().allow(null),
    //     }).required();
    //   }
}

module.exports = new PRValidator;