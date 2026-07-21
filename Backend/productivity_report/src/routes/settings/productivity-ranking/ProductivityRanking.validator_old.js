'use strict';

const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');

class PRValidator {
  getProductivityRanking() {
    return Joi.object().keys({
      page: Joi.number().min(1),
      type: Joi.string().valid('APP', 'WEB'),
      department_id: Joi.number().integer().positive().optional(),
      startDate: Common.dateValidator('startDate'),
      endDate: Common.dateValidator('endDate')
    });
  }

  upsertProductivityRanking() {
    return Joi.object().keys({
      app_domain_id: Joi.number().required(),
      department_id: Joi.number().min(1),
      status: Joi.number().min(0).max(2).required()
    }).required();
  }

  addProductivityRanking() {
    return Joi.object().keys({
      name: Joi.string().required(),
      type: Joi.string().valid('APP', 'WEB').required(),
      status: Joi.number().min(0).max(2).required()
    }).required();
  }

  bulkAddProductivityRanking() {
    const objectSchema = Joi.object().keys({
      app_domain_id: Joi.number().min(1).required(),
      department_id: Joi.number().min(1).required(),
      status: Joi.number().min(0).max(2).required()
    })

    // cannot have duplicate data for same app_domain
    const arraySchema = Joi.array().items(objectSchema).unique((a, b) => a.app_domain_id === b.app_domain_id);

    return Joi.object({
      data: Joi.alternatives().try(arraySchema).required().allow(null),
    }).required();
  }
}

module.exports = new PRValidator;