const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');

class PrValidator {

    getProductivity() {
        return Joi.object().keys({
            location_id: Joi.number().positive().optional(),
            department_id: Joi.number().positive().optional(),
            user_id: Joi.number().positive().optional(),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required()
        }).required();
    }

    getProductivityList() {
        return Joi.object().keys({
            page: Joi.number().positive().optional(),
            day: Common.dateValidator('day').required()
        }).required();
    }
}

module.exports = new PrValidator;