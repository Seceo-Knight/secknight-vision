const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class LeaveValidation {

    addLeave(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
            day_type: Joi.string().required().max(50),
            leave_type: Joi.string().required().max(50),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            reason: Joi.string().required().max(255),
            status: Joi.number().integer().valid(3).default(0),
        });
        return Joi.validate(params, schema);
    }

    updateLeave(params) {
        const schema = Joi.object().keys({
            leave_id: Joi.number().required(),
            employee_id: Joi.number().required(),
            day_type: Joi.string().required().max(50),
            leave_type: Joi.string().required().max(50),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            reason: Joi.string().required().max(255),
            status: Joi.number().required().max(4),
        });
        return Joi.validate(params, schema);
    }

    createLeaveType(params) {
        const schema = Joi.object().keys({
            name: Joi.string().required().max(50),
            duration: Joi.number().required(),
            number_of_days: Joi.number().required(),
            carry_forward: Joi.number().required().max(2),
        });
        return Joi.validate(params, schema);
    }

    updateLeaveType(params) {
        const schema = Joi.object().keys({
            leave_id: Joi.number().required(),
            name: Joi.string().required().max(50),
            duration: Joi.number().required(),
            number_of_days: Joi.number().required(),
            carry_forward: Joi.number().required().max(2),
        });
        return Joi.validate(params, schema);
    }

    getLeaveOverride(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().integer().default(null),
            name: Joi.string().default(null),
            skip: Joi.number().integer().default(null),
            limit: Joi.number().integer().default(null),
        });

        return Joi.validate(params, schema);
    }

    addLeaveOverride(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().integer().required(),
            leaves: Joi.array().items(
                Joi.object().keys({
                    leave_id: Joi.number().integer().required(),
                    no_of_leaves: Joi.number().required()
                })
            ).required(),
        });

        return Joi.validate(params, schema);
    }

    approveRejectLeave(params) {
        const schema = Joi.object().keys({
            leave_id: Joi.number().integer().required(),
            type: Joi.number().integer().valid(1, 2).required(),
            approved: Joi.array().items(Joi.date().iso().required()).required(),
        });

        return Joi.validate(params, schema);
    }
}

module.exports = new LeaveValidation;