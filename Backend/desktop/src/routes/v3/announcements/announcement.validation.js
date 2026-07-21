'use strict';

const Joi = require('@hapi/joi');

class AnnouncementValidation {
    static updateAnnouncement(params) {
        return Joi.object().keys({
            ids: Joi.array().items(Joi.string().required()).min(1).required()
        });
    }
}

module.exports.AnnouncementValidation = AnnouncementValidation;