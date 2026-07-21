const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common')

class FeedbackValidator {
    addQuestion() {
        return Joi.object().keys({
            question: Joi.string().required(),
            options: Joi.array().items(Joi.string()).unique().min(1),
            type: Joi.string().required().valid("radio", "checkBox", "star"),
        });
    }

    addAnswer() {
        return Joi.object().keys({
            status: Joi.number().required().valid(1, 0),
            data: Joi.array()
                .items({
                    question_id: Joi.number()
                        .required(),
                    option_id: Joi.number()
                        .required(),
                    comment: Joi.string().default(null).max(2000).regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) })
                }).required().min(1),
        });
    }


}
module.exports = new FeedbackValidator;
