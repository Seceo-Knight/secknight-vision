const Joi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common')

class DashboardValidator {

    getEmployees() {
        return Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().positive().default(20),
            location_id: Joi.number().integer().allow(null, ""),
            department_id: Joi.number().integer().allow(null, ""),
            role_id: Joi.number().integer().allow(null, ""),
            name_contains: Joi.string().allow(null, "")
        });
    }

    getDeveloperAppReports() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number().positive()).min(1),
            applications: Joi.array().items(Joi.string().invalid("", null)).min(1),
            from_date: Joi.date().required(),
            to_date: Joi.date().required()
        });
    }

    getAbsentEployeeDetails() {
        return Joi.object().keys({
            from_date: Joi.date().required(),
            to_date: Joi.date().required()
        });
    }

    getAbsentEmployee() {
        return Joi.object().keys({
            date: Common.dateValidator('date').required()
        });
    }













}

module.exports = new DashboardValidator;