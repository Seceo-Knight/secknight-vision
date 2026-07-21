const Joi = require('joi');
const { get } = require('lodash');

module.exports = Joi.extend({
    name: 'JSON',
    language: {
        base: 'Data json is invalid!',
        parse: 'Unable to parse json, check json string',
        notDay: 'Not day data, check json string',
        time: 'If status = true, then start and end time must be value in format hh:mm'
    },
    pre(data, state, options) {
        try {
            return JSON.parse(data);
        } catch (error) {
            return this.createError(
                'JSON.parse', {
                data
            },
                state,
                options
            );
        }

    },
    rules: [
        {
            name: 'shiftData',
            validate(params, data, state, options) {
                const timePattern = /[0-9]{2}:[0-9]{2}/;
                const daySchema = Joi.object().keys({
                    status: Joi.boolean().default(false),
                    time: Joi.object().when('status', {
                        is: true, 
                        then: Joi.object().keys({
                            start: Joi.string().length(5).regex(timePattern),
                            end: Joi.string().length(5).regex(timePattern),
                        }),
                        otherwise: Joi.object().keys({
                            start: Joi.string().allow(null),
                            end: Joi.string().allow(null),
                        }),
                    }),
                }).required();
                const schema = Joi.object().keys({
                    mon: daySchema,
                    tue: daySchema,
                    wed: daySchema,
                    thu: daySchema,
                    fri: daySchema,
                    sat: daySchema,
                    sun: daySchema,
                });
                try {
                    const { error, value } = Joi.validate(data, schema);
                    if (error) {
                        let type = 'JSON.time';
                        if (get(error, 'details[0].type') === 'any.required') {
                            type = 'JSON.notDay'
                        }

                        return this.createError(
                            type, {
                            value
                        },
                            state,
                            options
                        );
                    }

                    return JSON.stringify(value);

                } catch (error) {
                    return this.createError(
                        'JSON.base', {
                        data
                    },
                        state,
                        options
                    );
                }

            }
        },

    ]
});
