const Joi = require('joi');
const JoiHapi = require('@hapi/joi');
class SentimentalAnalysisValidator {
    
    getKeyStrokes() {
        return JoiHapi.object().keys({
            employee_id: JoiHapi.number().integer().positive().required(),
            employee_timezone : JoiHapi.string().required(),
            // skip: JoiHapi.number().integer().default(0),
            // limit: JoiHapi.number().integer().default(10)
        }).required();
    }
    
    validateSentimentalAnalysisData(data) {
        const schema = Joi.object().keys({
            // url: Joi.string().required(),
            // category: Joi.string().required(),
            attendance_id:Joi.number().integer().required(),
            employee_id:Joi.number().integer().required(),
            positive:Joi.number().required(),
            negative:Joi.number().required(),
            neutral: Joi.number().required(),
            date:Joi.string().required(),
            positive_sentences:Joi.array().required(),
            negative_sentences:Joi.array().required(),

        });
        return Joi.validate(data, schema);;
    }
    

    validateUrlCategorizationData(data) {
        const schema = Joi.object().keys({
            url: Joi.string().required(),
            category: Joi.string().required(),
        });
        return Joi.validate(data, schema);;
    }

    validateSkipLimit(skip, limit) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10)
        });
        return Joi.validate({ skip, limit }, schema);
    }

    validateGetAttandance(employee_id, skip, limit) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().required(),
            limit: Joi.number().integer().required(),
            employee_id: Joi.number().integer().required()
        });
        return Joi.validate({ employee_id, skip, limit }, schema);
    }
}
module.exports = new SentimentalAnalysisValidator;