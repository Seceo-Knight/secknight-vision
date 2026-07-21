const Joi = require('joi');

class AttendanceValidator {

    userValidation(data) {
        const schema = {
            department_id: Joi.string().allow(null).allow(""),
            location_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null).allow(""),
            role_id: Joi.number().allow(null).allow(""),
            name: Joi.string().allow(null).allow(""),
            sortOrder: Joi.string().allow(null).allow(""),
            sortColumn: Joi.string().allow(null).allow(""),
            status: Joi.number().valid(1, 2).allow("", null),
            employee_type: Joi.number().valid(0, 1, 2, 3, 4, 5).default(0),
            employee_id: Joi.number().allow(null, "").default(0),
            start_date: Joi.date().iso().default(null),
            end_date: Joi.date().when('start_date', {is: null,
                then: Joi.optional().allow(null, ""),
                otherwise: Joi.required()}),
        };
        return Joi.validate(data, schema);
    }

    /**
     * Validator for attendanceOverride
     * @param {*} params 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    attendanceOverride(params) {
        const schema = Joi.object().keys({
            date: Joi.date().iso().required(),
            employee_id: Joi.number().required(),
            status: Joi.number().valid(1, 2, 3, 4, 5, 6, 7).required(),
            leave_id: Joi.when('status', {
                is: Joi.number().valid(4, 6, 7),
                then: Joi.number().required(),
                otherwise: Joi.default(null)
            }),
        });

        return Joi.validate(params, schema);
    }

    /**
     * postMarkAttendanceValidate - function to validate post mark attendance req body
     * 
     * @param {*} params 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    postMarkAttendanceValidate(params) {
        const schema = Joi.object().keys({
            date: Joi.date().iso().required(),
            check_time: Joi.date().iso().required(),
            ip : Joi.string().max(50).optional().default(""),
            device_os: Joi.string().max(50).optional().default(""),
            device_type: Joi.string().max(50).optional().default(""),
            browser: Joi.string().max(50).optional().default(""),
            city: Joi.string().max(50).optional().default(""),
            internet_provider: Joi.string().max(300).optional().default(""),
            region: Joi.string().max(50).optional().default(""), 
            country: Joi.string().max(50).optional().default(""), 
            latitude: Joi.string().max(50).optional().default(""), 
            longitude: Joi.string().max(50).optional().default(""),
            geolocation_enabled: Joi.boolean().optional().default(false),
        });
        return Joi.validate(params, schema);
    }

    attendanceRequest(params) {
        const schema = Joi.object().keys({
            date: Joi.date().iso().required(),
            check_in: Joi.date().iso().required(),
            check_out: Joi.date().iso().required(),
            reason: Joi.string().max(2000).required(),
        });
        return Joi.validate(params, schema);
    }

    /**
     * Validator for getRequestAttendance
     * @param {*} params 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getRequestAttendance(params) {
        const schema = Joi.object().keys({
            id: Joi.number().default(0),
            status: Joi.number().valid(1, 2, 3).default(0),
            date: Joi.date().iso().default(null),
            month: Joi.date().iso().default(null),
        });

        return Joi.validate(params, schema);
    }

    /**
     * Validator for postRequestAttendance
     * @param {*} params 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    postRequestAttendance(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(),
            status: Joi.number().valid(1, 2, 3).required(),
        });

        return Joi.validate(params, schema);
    }
}

module.exports = new AttendanceValidator;