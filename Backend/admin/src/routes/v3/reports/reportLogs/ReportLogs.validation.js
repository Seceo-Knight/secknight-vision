const Joi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common');

class ReportLogsValidator {

    downloadEmployeeReport() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).default([]),
            download_option: Joi.number().integer().positive().min(1).max(3).required(),
            startDate: Common.dateValidator('from_date').required(),
            endDate: Common.dateValidator('to_date').required(),
            location_id: Joi.number().positive().default(null),
            department_ids: Joi.string().default(null),
            role_id: Joi.number().positive().default(null),
        })
    }
}

module.exports = new ReportLogsValidator