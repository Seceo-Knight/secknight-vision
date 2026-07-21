const Joi = require('joi');

class Department {

    /** Create departments  */
    create_departments(skip, limit, department_id, location_id, role_id) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().default(0).allow(""),
            limit: Joi.number().integer().default(10).allow(""),
            location_id: Joi.number().integer().default(0).allow(""),
            department_id: Joi.number().integer().default(0).allow(""),
            role_id: Joi.number().integer().default(0).allow(""),

        });
        var result = Joi.validate({ skip, limit, department_id, location_id, role_id }, schema);
        return result;
    }

} module.exports = new Department;
