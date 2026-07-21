const Joi = require('joi');

class Dashboard {
    /** Validation for production hours API */
    getProductionHours(from_date, to_date, location_id, manager_id) {
        const schema = Joi.object().keys({
            from_date: Joi.date().required(),
            to_date: Joi.date().required(),
            location_id: Joi.number().integer().default(0).allow(""),
            manager_id: Joi.number().integer().allow(""),
        });
        var result = Joi.validate({ from_date, to_date, location_id, manager_id }, schema);
        return result;
    }
    /** Validation for dashboard  */
    dashbord(manager_id) {
        const schema = Joi.object().keys({
            manager_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ manager_id }, schema);
        return result;
    }
    /** Validation for get active days API */
    getActiveDays(from_date, to_date, location_id, department_id, manager_id) {
        const schema = Joi.object().keys({
            from_date: Joi.date().required(),
            to_date: Joi.date().required(),
            location_id: Joi.number().integer().default(0).allow(""),
            department_id: Joi.number().integer().default(0).allow(""),
            manager_id: Joi.number().integer().allow(""),
        });
        var result = Joi.validate({ from_date, to_date, location_id, department_id, manager_id }, schema);
        return result;
    }

    /** Validation for working hours for locations  */
    getLocationWorkingHours(from_date, to_date, location_id, manager_id) {
        const schema = Joi.object().keys({
            from_date: Joi.date().required(),
            to_date: Joi.date().required(),
            location_id: Joi.number().integer().default(0).allow(""),
            manager_id: Joi.number().integer().allow(""),
        });
        var result = Joi.validate({ from_date, to_date, location_id, manager_id }, schema);
        return result;
    }

    /** validation for get presence rate API */
    get_presence_rate(from_date, to_date, location_id) {
        const schema = Joi.object().keys({
            from_date: Joi.date().required(),
            to_date: Joi.date().required(),
            location_id: Joi.number().integer().default(0).allow(""),
        });
        var result = Joi.validate({ from_date, to_date, location_id }, schema);
        return result;
    }

} module.exports = new Dashboard;

