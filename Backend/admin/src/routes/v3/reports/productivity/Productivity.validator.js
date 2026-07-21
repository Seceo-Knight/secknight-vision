const Joi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common');

class PrValidator {
    getProductivity() {
        return Joi.object().keys({
            location_id: Joi.number().positive().optional(),
            department_id: Joi.number().positive().optional(),
            employee_id: Joi.string().optional(),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            nonAdminId: Joi.number()
        }).required();
    }
    getProductivityList() {
        return Joi.object().keys({
            page: Joi.number().positive().optional(),
            skip: Joi.number().optional().default(0),
            limit: Joi.number().integer().positive().default(25),
            location_id: Joi.number().positive().optional().allow('All'),
            department_id: Joi.number().positive().optional().allow('All'),
            employee_id: Joi.string().optional().allow('All'),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            sortOrder: Joi.string().optional(),
            sortColumn: Joi.string().optional(),
            nonAdminId: Joi.number()
        }).required();
    }

    getProductivityListForDownload() {
        return Joi.object().keys({
            location_id: Joi.number().positive().optional().allow('All'),
            department_id: Joi.number().positive().optional().allow('All'),
            employee_id: Joi.string().optional().allow('All'),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            nonAdminId: Joi.number()
        }).required();
    }

    getAnomalyData() {
        return Joi.object().keys({
            skip: Joi.number().optional().default(0),
            limit: Joi.number().integer().positive().default(25),
            location_id: Joi.number().positive().optional().allow('All'),
            department_id: Joi.number().positive().optional().allow('All'),
            employee_id: Joi.number().positive().optional().allow('All'),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            sortOrder: Joi.string().optional(),
            sortColumn: Joi.string().optional()
        }).required();
    }
}

module.exports = new PrValidator;