const Joi = require('joi');

class QualificationValidation {
    /**
     * getQualificationValidation - function to validat get request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getQualificationValidation(params) {
        const schema = Joi.object().keys({
            employeeId: Joi.number().positive().required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }

    /**
     * postQualificationValidation - function to validat post request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    postQualificationValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().default(new Date().getTime()),
            employeeId: Joi.number().positive().required(),
            qualificationType: Joi.string().max(255).required(),
            qualificationDetails: Joi.string().max(255).optional().allow([ '', null ]).default(null),  
            nameOfInstitue: Joi.string().max(255).required(),
            universityBoard: Joi.string().max(255).required(),
            yearOfPassing: Joi.date().iso().raw().required(),
            percentageGrade: Joi.string().max(40).required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }


    /**
     * putQualificationValidation - function to validat put request
     * 
     * @param {*} params
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    putQualificationValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().required(),
            employeeId: Joi.number().positive().required(),
            qualificationType: Joi.string().max(255).required(),
            qualificationDetails: Joi.string().max(255).optional().allow([ '', null ]).default(null),  
            nameOfInstitue: Joi.string().max(255).required(),
            universityBoard: Joi.string().max(255).required(),
            yearOfPassing: Joi.date().iso().raw().required(),
            percentageGrade: Joi.string().max(40).required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }
       
    /**
     * deleteQualificationValidation - function to validat delete request
     * 
     * @param {*} params
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    deleteQualificationValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().required(),
            employeeId: Joi.number().positive().required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }
}

module.exports = new QualificationValidation;