
const Joi = require('@hapi/joi');

const Common = require('../../../../utils/helpers/Common');


class EmailValidator {

    getEmails() {
        return Joi.object().keys({
            type: Joi.number().positive().optional(),
            department_id: Joi.number().positive().optional(),
            location_id: Joi.number().positive().optional(),
            employee_id: Joi.number().positive().optional(),
            client_type: Joi.string().optional(),
            skip: Joi.number().integer().required().default(0),
            limit: Joi.number().positive().required().default(10),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            name: Joi.string().default(null)
        }).required();
    }
    // department_id, employee_id, type, client_type,

    emailContentGraph() {
        return Joi.object().keys({
            department_id: Joi.number().positive().optional().default(null),
            location_id: Joi.number().positive().optional().default(null),
            employee_id: Joi.number().positive().optional().default(null),
            client_type: Joi.string().optional().default(null),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required()
        }).required();
    }
}
module.exports = new EmailValidator;