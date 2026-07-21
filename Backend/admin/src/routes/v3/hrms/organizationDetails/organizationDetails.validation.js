// Organization Details Module Validation
const Joi = require('joi');


// Validator class
class OrganizationDetailsValidator {

    /**
     * Basic Details Validator
     * @param {*} params 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in> 
     */
    basicDetails(params) {
        const schema = Joi.object().keys({
            registeredCompanyName: Joi.string().default(null),
            brandName: Joi.string().default(null),
            domainName: Joi.string().default(null),
            website: Joi.string().default(null),
            email: Joi.string().default(null),
            registeredOfficeAddress: Joi.string().default(null),
            corporateOfficeAddress: Joi.string().default(null),
            director: Joi.string().default(null),
            contactNumber: Joi.number().integer().default(null),
        });

        return Joi.validate(params, schema);
    }

    /**
     * Bank Details Validator
     * @param {*} params 
     */
    bankDetails(params) {
        const schema = Joi.object().keys({
            id: Joi.number().optional().default(null),
            bankName: Joi.string().valid('SBI', 'ICICI', 'AXIS', 'HDFC').allow(null, '').required(),
            accountNumber: Joi.string().allow(null, '').required(),
            ifsc: Joi.string().allow(null, '').required(),
            accountType: Joi.string().valid('CA', 'FD').allow(null, '').required(),
            branchName: Joi.string().allow(null, '').required(),
        });

        return Joi.validate(params, schema);
    }

    /**
     * compliance Details Validator
     * @param {*} params 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    complianceDetails(params) {
        const schema = Joi.object().keys({
            uan: Joi.string().default(null),
            pfJoiningDate: Joi.date().iso().default(null),
            excessEPF: Joi.number().valid(0, 1).default(null),
            excessEPS: Joi.number().valid(0, 1).default(null),
            existingPFMember: Joi.number().valid(0, 1).default(null),
            employeeEligibleForPT: Joi.number().valid(0, 1).default(null),
            employeeEligibleForEsi: Joi.number().valid(0, 1).default(null),
            esiNumber: Joi.string().default(null),
            pan: Joi.string().default(null),
            ctc: Joi.number().default(null),
            gross: Joi.number().default(null),
            effectiveDate: Joi.date().iso().default(null),
        });

        return Joi.validate(params, schema);
    }
}


// export validator
module.exports = new OrganizationDetailsValidator();