const Joi = require('joi');

class FamilyValidation {
    /**
     * getFamilyValidation - function to validat get request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getFamilyValidation(params) {
        const schema = Joi.object().keys({
            employeeId: Joi.number().positive().required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }

    /**
     * postFamilyValidation - function to validat post request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    postFamilyValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().default(new Date().getTime()),
            employeeId: Joi.number().positive().required(),
            nameOfFamilyMember: Joi.string().trim().max(255).required(),
            age: Joi.number().positive().max(100).required(),
            gender: Joi.string().trim().max(20).required().default(null),
            relationShipWithEmployee: Joi.string().trim().max(30).required().default(null),
            occupation: Joi.string().trim().required(),
            dateOfBirth: Joi.date().iso().raw().required(),
            aadharNo: Joi.string().trim().max(100).required().default(null),
            panNo: Joi.string().trim().max(200).required().default(null),
            contactNo: Joi.string().trim().max(15).optional().default(null),
            isContactPerson: Joi.boolean().required().default(false),
            bloodGroup: Joi.string().trim().optional().default(null)
        });
        const result = Joi.validate(params, schema);
        return result;
    }

    /**
     * putFamilyValidation - function to validat put request
     * 
     * @param {*} params
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    putFamilyValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().required(),
            employeeId: Joi.number().positive().required(),
            nameOfFamilyMember: Joi.string().trim().max(255).required(),
            age: Joi.number().max(100).required(),
            gender: Joi.string().trim().max(20).required().default(null),
            relationShipWithEmployee: Joi.string().trim().max(30).required().default(null),
            occupation: Joi.string().trim().required(),
            dateOfBirth: Joi.date().iso().raw().required(),
            aadharNo: Joi.string().trim().max(100).required().default(null),
            panNo: Joi.string().trim().max(200).required().default(null),
            contactNo: Joi.string().trim().max(15).optional().default(null),
            isContactPerson: Joi.boolean().required().default(false),
            bloodGroup: Joi.string().trim().optional().default(null)
        });
        const result = Joi.validate(params, schema);
        return result;
    }

    /**
     * deleteFamilyValidation - function to validat delete request
     * 
     * @param {*} params
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    deleteFamilyValidation(params) {
        const schema = Joi.object().keys({
            _id: Joi.number().positive().required(),
            employeeId: Joi.number().positive().required()
        });
        const result = Joi.validate(params, schema);
        return result;
    }
}

module.exports = new FamilyValidation;