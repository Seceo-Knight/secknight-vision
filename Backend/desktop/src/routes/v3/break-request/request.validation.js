const Joi = require('joi');
const { joiErrorMessage } = require(`../../../utils/helpers/Common`);
Joi.objectId = require('joi-objectid')(Joi)


class Validator {

    createBreakRequest(data) {
        const schema = Joi.object().keys({
            start_time: Joi.date().iso().required(),
            end_time: Joi.date().iso().required().greater(Joi.ref('start_time')),
            activity: Joi.string().required(),
            description: Joi.string().max(225).allow("", null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return joiErrorMessage(errors)
            }),

        });
        return schema.validate(data);
        
    }
    offlineRequest(data) {
        const schema = Joi.array().items(
            Joi.object().keys({
            date: Joi.date().required(),
            start_time: Joi.date().iso().required(),
            end_time: Joi.date().iso().required().greater(Joi.ref('start_time')),
            reason: Joi.string().max(225).required(),
            offline_time: Joi.number().required().greater(0)
        })).required();
        return schema.validate(data);
    }

    createIdleRequest(data) {
        const schema = Joi.object().keys({
            date: Joi.date().required(),
            start_time: Joi.date().iso().required(),
            end_time: Joi.date().iso().required().greater(Joi.ref('start_time'))
                .error(er => "End time should be greater than start time"),
            reason: Joi.string().min(2).max(225).required(),
            activity_ids: Joi.array().items(Joi.string()).required(),
        });
        return schema.validate(data);
    }

    getReason(params) {
        const schema = Joi.object().keys({
            type: Joi.number().valid(1, 2, 3, 4).required(),
        });
        return schema.validate(params)
    }
}
module.exports = new Validator;