const Joi = require('@hapi/joi');

class EmailMonitoringValidation {
    getEmailMonitoring() {
        return Joi.object({
            employee_id: Joi.number().optional(),
            skip: Joi.number().optional(),
            limit: Joi.number().optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            search: Joi.string().optional(),
            type: Joi.number().optional(),
            department_id: Joi.number().optional(),
            location_id: Joi.number().optional(),
        }).required();
    }
}

module.exports = new EmailMonitoringValidation();