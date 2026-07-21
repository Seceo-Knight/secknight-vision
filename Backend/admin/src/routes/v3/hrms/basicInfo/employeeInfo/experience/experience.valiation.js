const Joi = require('joi');

class ExperienceValidation {
    /**
     * getExperienceValidation - function to validat get request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getExperienceValidation(params) {
        const schema = Joi.object().keys({
            employeeId: Joi.number().positive().required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }

    /**
     * postExperienceValidation - function to validat post request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    postExperienceValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().default(new Date().getTime()),
            employeeId: Joi.number().positive().required(),
            nameOfCompany: Joi.string().max(255).required(),
            designation: Joi.string().max(255).required(),
            reportingManager: Joi.string().max(255).required().default(null),
            contactOfReportingManager: Joi.string().max(30).required().default(null),
            joiningDate: Joi.date().iso().raw().required(),
            leavingDate: Joi.date().iso().raw().required(),
            hrName: Joi.string().max(100).required().default(null),
            hrMailId: Joi.string().max(200).required().default(null),
            hrContactNo: Joi.string().max(30).required().default(null),
            reasonForLeaving: Joi.string().max(255).required().default(null),
        });
        const result = Joi.validate(params, schema);
        return result;
    }

    /**
     * putExperienceValidation - function to validat put request
     * 
     * @param {*} params
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    putExperienceValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().required(),
            employeeId: Joi.number().positive().required(),
            nameOfCompany: Joi.string().max(255).required(),
            designation: Joi.string().max(255).required(),
            reportingManager: Joi.string().max(255).required().default(null),
            contactOfReportingManager: Joi.string().max(30).required().default(null),
            joiningDate: Joi.date().iso().raw().required(),
            leavingDate: Joi.date().iso().raw().required(),
            hrName: Joi.string().max(100).required().default(null),
            hrMailId: Joi.string().max(200).required().default(null),
            hrContactNo: Joi.string().max(30).required().default(null),
            reasonForLeaving: Joi.string().max(255).required().default(null),
        });
        const result = Joi.validate(params, schema);
        return result;
    }
    
    /**
     * deleteExperienceValidation - function to validat delete request
     * 
     * @param {*} params
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    deleteExperienceValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().required(),
            employeeId: Joi.number().positive().required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }
}


module.exports = new ExperienceValidation;