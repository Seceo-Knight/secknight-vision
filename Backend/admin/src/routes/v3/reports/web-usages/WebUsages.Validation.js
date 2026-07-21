const Joi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common');
class WebUsagesValidation {

    static webUsages(params) {
        return Joi.object().keys({
            url_id: Joi.string(),
            appIds: Joi.array().items(Joi.string()).default([]),
            employee_id: Joi.number().positive().optional().allow(null),
            department_id: Joi.number().positive().optional().allow(null),
            location_id: Joi.number().positive().optional().allow(null),
            status: Joi.number().optional().default(1),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            type: Joi.number().allow(1, 2).default(2),
            skip: Joi.number().optional().positive(0).allow(0).default(0),
            limit: Joi.number().optional().positive(0).allow(0).default(0)
        })
    }

    static validateAppIds() {
        return Joi.object().keys({
            appIds: Joi.array().items(Joi.string()).min(1),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
        })
    }
}

module.exports.WebUsagesValidation = WebUsagesValidation;