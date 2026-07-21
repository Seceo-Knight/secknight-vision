'use strict';

const Joi = require('@hapi/joi');

class GeoLocationValidation {
    validateGeoLogsData() {
        return Joi.object()
            .keys({
                longitude: Joi.string().required(),
                latitude: Joi.string().required(),
            })
            .required();
    }

    validateFetchGeoLocation() {
        return Joi.object()
           .keys({
                employee_id: Joi.number().required(),
                start_date: Joi.date().required(),
                end_date: Joi.date().required(),
            })
           .required();
    }
}

module.exports = new GeoLocationValidation();