const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');

class NotificationValidator {

    notificationList() {
        return Joi.object().keys({
            skip: Joi.number().default(0),
            limit: Joi.number().integer().positive().default(25),
            location_id: Joi.number().positive().optional().default(null),
            department_id: Joi.number().positive().optional().default(null),
            employee_id: Joi.number().positive().optional().default(null),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            name: Joi.string().default(null).optional(),
            sortColumn: Joi.string().optional().default(null),
            sortOrder: Joi.string().optional().default(null),
            download: Joi.boolean().optional().default(false)
        }).required();
    }

    notificationStatusUpdate() {
        return Joi.object().keys({
            ids: Joi.array().items(Joi.number()).min(1)
        }).required();
    }

    notificationCount() {
        return Joi.object().keys({
            date: Common.dateValidator('date').optional(),
        }).required();
    }

}

module.exports = new NotificationValidator;