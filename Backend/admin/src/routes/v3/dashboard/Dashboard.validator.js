const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');

class DashboardValidator {
    getAbsentEmployee() {
        return Joi.object().keys({
            date: Common.dateValidator('date').required()
        });
    }
    getEmployeeProductivity() {
        return Joi.object().keys({
            location_id: Joi.number().integer().positive().optional(),
            department_id: Joi.number().integer().positive().optional(),
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('to_date').required()
        });
    }
    getLocationProductivity() {
        return Joi.object().keys({
            location_id: Joi.number().integer().positive().optional(),
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('to_date').required()
        });
    }
    getDepartmentProductivity() {
        return Joi.object().keys({
            department_id: Joi.number().integer().positive().optional(),
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('to_date').required()
        });
    }
    getOrganizationProductivity() {
        return Joi.object().keys({
            date: Common.dateValidator('date').required()
        });
    }
    getActiveDays() {
        return Joi.object().keys({
            location_id: Joi.number().integer().positive().optional(),
            department_id: Joi.number().integer().positive().optional(),
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('to_date').required()
        })
    }
    getTopAppWeb() {
        return Joi.object().keys({
            type: Joi.number().valid(1, 2).required(),
            start_date: Common.dateValidator('start_date').required(),
            end_date: Common.dateValidator('end_date').required()
        });
    }
    getPerformance() {
        return Joi.object().keys({
            category: Joi.string().valid('location', 'department').required(),
            type: Joi.string().valid('pro', 'non', 'neu').required(),
            start_date: Common.dateValidator('start_date').required(),
            end_date: Common.dateValidator('end_date').required()
        });
    }
    productive() {
        return Joi.object().keys({
            type: Joi.number().integer().positive().required(),
            location_id: Joi.number().allow(null, 'null').optional(),
            department_id: Joi.number().allow(null, 'null').optional(),
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('to_date').required()
        })
    }

    activityBeakdown() {
        return Joi.object().keys({
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('to_date').required(),
            type: Joi.string().valid('organization', 'employee').default('organization')
        })
    }

    getWebAppActivities() {
        return Joi.object().keys({
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            location_id: Joi.number().allow(null, 'null').optional(),
            department_id: Joi.number().allow(null, 'null').optional(),
            employeeIds: Joi.array().items(Joi.number().positive()).min(1),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(20),
            appId: Joi.string().optional().default(null)
        })
    }


    getWebApp() {
        return Joi.object().keys({
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            location_id: Joi.number().allow(null, 'null').optional(),
            department_id: Joi.number().allow(null, 'null').optional(),
            employeeIds: Joi.array().items(Joi.number().positive()).default(null),
            appIds: Joi.array().items(Joi.string()).default(null),
            type: Joi.number().integer().optional(),
            employee: Joi.number().integer().optional(),
        })
    }
}

module.exports = new DashboardValidator;