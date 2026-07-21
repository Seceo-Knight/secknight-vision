const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class TravelValidation {

    addTravel(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            purpose: Joi.string().required().max(255),
            place: Joi.string().required().max(55),
            travel_mode: Joi.string().required().max(55),
            arrangement_type: Joi.string().required().max(55),
            expected_travel_budget: Joi.string().required().max(55),
            actual_travel_budget: Joi.string().required().max(55),
            description: Joi.string().required().max(255),
        });
        return Joi.validate(params, schema);
    }

    updateTravel(params) {
        const schema = Joi.object().keys({
            travel_id: Joi.number().required(),
            employee_id: Joi.number().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            purpose: Joi.string().required().max(255),
            place: Joi.string().required().max(55),
            travel_mode: Joi.string().required().max(55),
            arrangement_type: Joi.string().required().max(55),
            expected_travel_budget: Joi.string().required().max(55),
            actual_travel_budget: Joi.string().required().max(55),
            description: Joi.string().required().max(255),
            status: Joi.number().required(),
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new TravelValidation;