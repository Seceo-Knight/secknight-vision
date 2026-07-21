const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');

class UserValidator {
    getBrowserHistorySingleDate() {
        return Joi.object().keys({
            user_id: Joi.number().integer().positive().required(),
            date: Common.dateValidator('date').required(),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10)
        }).required();
    }

    getBrowserHistory() {
        return Joi.object().keys({
            user_id: Joi.number().integer().positive().required(),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10)
        }).required();
    }
    getApplicationsUsed() {
        return Joi.object().keys({
            user_id: Joi.number().integer().positive().required(),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10)
        }).required();
    }
    getKeyStrokes() {
        return Joi.object().keys({
            user_id: Joi.number().integer().positive().required(),
            date: Common.dateValidator('date').required()
        }).required();
    }
    getKeyStrokesRange() {
        return Joi.object().keys({
            user_id: Joi.number().integer().positive().required(),
            startDate: Common.dateValidator('startDate').required(),
            endDate: Common.dateValidator('endDate').required(),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10)
        }).required();
    }

    getLogDetails() {
        return Joi.object().keys({
            user_id: Joi.number().integer().positive().required(),
            from_date: Common.dateTimeValidator('from_date').required(),
            to_date: Common.dateTimeValidator('to_date').required(),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10)
        }).required();
    }
}

module.exports = new UserValidator;