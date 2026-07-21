const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class JobcandidateValidation {

    addNewJobCandidates(params) {
        const schema = Joi.object().keys({
            job_title: Joi.string().required(255),
            job_type: Joi.string().required().max(255),
            candidate_name: Joi.string().required().max(255),
            email: Joi.string().required().max(100),
            phone_number: Joi.string().required().max(100),
            status: Joi.string().required().max(50),
            applied_date: Joi.string().required().max(100),
            resume: Joi.string().required().max(500),
            application_remarks: Joi.string().required().max(50),
        });
        return Joi.validate(params, schema);
    }

    updateJobCandidates(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(255),
            job_title: Joi.string().required(255),
            job_type: Joi.string().required().max(255),
            candidate_name: Joi.string().required().max(255),
            email: Joi.string().required().max(100),
            phone_number: Joi.string().required().max(100),
            status: Joi.string().required().max(50),
            applied_date: Joi.string().required().max(100),
            resume: Joi.string().required().max(500),
            application_remarks: Joi.string().required().max(50),
        });
        return Joi.validate(params, schema);
    }

}

module.exports = new JobcandidateValidation;