const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class HolidayValidation {

    getHolidays(params) {
        const schema = Joi.object().keys({
            date: Joi.date().default(null),
        });

        return Joi.validate(params, schema);
    }

    addNewHolidays(params) {
        const schema = Joi.object().keys({   
            holidays: Joi.array().items(Joi.object().keys({
            holiday_name: Joi.string().required().max(50),
                holiday_date: Joi.date().required(),
            })),
            });
        return Joi.validate(params, schema);
    }

    updateHoliday(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(),
            holiday_name: Joi.string().required().max(50),
            holiday_date: Joi.date().required(),  
        });
        return Joi.validate(params, schema);
    }

}

module.exports = new HolidayValidation;