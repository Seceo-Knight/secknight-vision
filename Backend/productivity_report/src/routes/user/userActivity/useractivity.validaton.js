const Joi = require('joi');

class UserActivityValidation {
    customEmpSettingValidation(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required().positive(),
            track_data: Joi.object().required(),
        });
        var result = Joi.validate(params, schema);
        return result;
    }


    empTrackingModeValidation(params) {
        const schema = Joi.object().keys({
            trackingMode: Joi.string().valid(['unlimited', 'fixed', 'networkBased', 'manual', 'projectBased']).error(() => 'trackingMode unlimited, fixed, networkBased, manual, projectBased are Allowed.'),
        });
        return Joi.validate(params, schema);
    }

    empIdValidation(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required().positive()
        });
        return Joi.validate(params, schema);
    }

    validateUserRegister(params) {
        const schema = Joi.object().keys({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!,*()@%&]).{6,20}$/).required().error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
            emp_code: Joi.string().required(),
            location_id: Joi.number().integer().required(),
            department_id: Joi.number().integer().required(),
            role_id: Joi.number().integer().required(),
            address: Joi.string().required(),
            status: Joi.number().integer(),
            contact_number: Joi.string().max(15).required().error(() => 'Invalid contact number.'),
            date_join: Joi.date().allow("").allow(null),
            timezone: Joi.string().required()
        });
        var result = Joi.validate(params, schema);
        return result;
    }

    usersValidataion(data) {
        const schema = {
            department_id: Joi.string().allow(null).allow(""),
            location_id: Joi.number().allow(null).allow(""),
            role_id: Joi.number().allow(null).allow(""),
            name: Joi.string().allow(null).allow("")
        };
        return Joi.validate(data, schema);
    }
}

module.exports = new UserActivityValidation;