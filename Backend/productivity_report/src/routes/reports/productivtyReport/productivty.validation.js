const Joi = require('@hapi/joi');

class ProductivtyValidation {
    static activityDataValidator(activityData) {
        const activityPerSecond = Joi.object().keys({
            _id: Joi.string().optional(),
            id: Joi.string().optional(),
            buttonClicks: Joi.array().items(Joi.number().positive().allow(0)).required(),
            fakeActivities: Joi.array().items(Joi.number().positive().allow(0)).required(),
            keystrokes: Joi.array().items(Joi.number().positive().allow(0)).required(),
            mouseMovements: Joi.array().items(Joi.number().positive().allow(0)).required()
        }).required();

        const appUsage = Joi.array().items(
            Joi.object().keys({
                _id: Joi.string().optional(),
                id: Joi.string().allow(null, '').optional(),
                app: Joi.string().allow(null, '').optional(),
                start: Joi.number().positive().allow(0).default(0),
                end: Joi.number().positive().allow(0).default(0),
                url: Joi.string().allow('', null).default(null),
                keystrokes: Joi.string().allow('', null),
                title: Joi.string().allow('', null),
                ageOfData: Joi.number().optional(),
            })
        )

        return Joi.object().keys({
            organization_id: Joi.number().positive().required(),
            employee_id: Joi.number().positive().required(),
            email: Joi.string().required(),
            systemTimeUtc: Joi.string().required(),
            task_id: Joi.number().integer().positive().allow(null, 0).default(null),
            project_id: Joi.number().integer().positive().allow(null, 0).default(null),
            appUsage,
            activityPerSecond,
            break_duration: Joi.number().positive().allow(0),
            timezone: Joi.string().required(),
            attendanceDate: Joi.string().default(null).optional(),
            secondAttendanceDate: Joi.string().default(null).optional(),
            systemTimeUtcDayOneEnd: Joi.string().default(null).optional(),
            timesheetIdleTime: Joi.string().default('00:00').optional(),
            productivityCategory: Joi.number().default(0),
        });
    }
}

module.exports.ProductivtyValidation = ProductivtyValidation;