const Joi = require('joi');

class TimeSheetValidator {
    fetchUserParams(location_id, department_id, start_date, end_date, user_id) {
        const schema = Joi.object().keys({
            location_id: Joi.number().required().positive().allow(0),
            user_id: Joi.number().required().positive().allow(0),
            department_id: Joi.number().required().positive().allow(0),
            start_date: Joi.string().isoDate().required(),
            end_date: Joi.string().isoDate().required()
        });
        var result = Joi.validate({ location_id, department_id, user_id, start_date, end_date }, schema);
        return result;
    }

    fetchTimesheetBreakupParams(params) {
        const schema = Joi.object().keys({
            attendance_id: Joi.number().required().positive().allow(0)
        });
        var result = Joi.validate(params, schema);
        return result;
    }


}

module.exports = new TimeSheetValidator;