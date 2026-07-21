
// Imports
const Joi = require('joi');


/**
 * @class AnnouncementsValidation
 * For validation of Announcements apis
 */
class AnnouncementsValidation {

    getAnnouncements(params) {
        const schema = Joi.object().keys({
            title: Joi.string().default(null),
            start_date: Joi.date().default(null),
            end_date: Joi.date().default(null),
            location_id: Joi.number().default(null),
            department_id: Joi.number().default(null),
            type: Joi.number().default(null),
            is_active: Joi.number().default(1)
        });

        return Joi.validate(params, schema);
    }


    createAnnouncements(params) {
        const schema = Joi.object().keys({
            title: Joi.string().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            location_id: Joi.number().default(null),
            department_id: Joi.number().default(null),
            type: Joi.number().required(),
            description: Joi.string().required()
        });

        return Joi.validate(params, schema);
    }


    updateAnnouncements(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(),
            title: Joi.string().default(null),
            start_date: Joi.date().default(null),
            end_date: Joi.date().default(null),
            location_id: Joi.number().default(null),
            department_id: Joi.number().default(null),
            type: Joi.number().default(null),
            description: Joi.string().default(null),
            is_active: Joi.number().default(null),
        });

        return Joi.validate(params, schema);
    }


    deleteAnnouncements(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(),
        });

        return Joi.validate(params, schema);
    }
}

// Exports
module.exports = new AnnouncementsValidation;