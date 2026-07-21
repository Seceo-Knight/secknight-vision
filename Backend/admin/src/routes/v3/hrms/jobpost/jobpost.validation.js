const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class JobpostsValidation {

    addNewJobPosts(params) {
        const schema = Joi.object().keys({
            job_title: Joi.string().required(255),
            job_type: Joi.string().required().max(255),
            job_vacancy: Joi.string().required().max(100000),
            gender: Joi.string().required().max(100),
            minimum_experience: Joi.string().required().max(500),
            date_of_closing: Joi.string().required().max(500),
            short_description: Joi.string().required().max(500),
            long_description: Joi.string().required().max(500),
            status: Joi.number().required().max(500),
        });
        return Joi.validate(params, schema);
    }

    updateJobPosts(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(255),
            job_title: Joi.string().required(255),
            job_type: Joi.string().required().max(255),
            job_vacancy: Joi.string().required().max(100000),
            gender: Joi.string().required().max(100),
            minimum_experience: Joi.string().required().max(500),
            date_of_closing: Joi.string().required().max(500),
            short_description: Joi.string().required().max(500),
            long_description: Joi.string().required().max(500),
            status: Joi.number().required().max(500),
        });
        return Joi.validate(params, schema);
    }


}

module.exports = new JobpostsValidation;