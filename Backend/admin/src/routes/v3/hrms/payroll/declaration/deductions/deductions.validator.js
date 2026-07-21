const Joi = require('joi')
const Common = require(`${utilsFolder}/helpers/Common`);


class DeductionsValidator {

    static getDeductions(params) {

        return Joi.validate(params, Joi.object().keys({
            type: Joi.string().valid("", null, "Income From Other Than Savings Bank Interest", "Income From Savings Bank Interest", "House Property", "Income From Previous Employer", "Income From Pension").optional(),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10),
            employee_id: Joi.number().integer().optional().default(null),
            search: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            financialYear: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            withOtherDeductions: Joi.boolean().valid(true, false).optional().default(false),
            includeOther: Joi.boolean().valid(true, false).optional().default(true)
        }))
    }

    static updateDeductions(params) {
        return Joi.validate(params, Joi.object().keys({
            approved_amount: Joi.number().integer().optional().default(null),
            id: Joi.number().integer().required(),
            status: Joi.number().integer().optional().default(null).valid(0, 1, 2),
            comment: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),

        }))
    }

    static addBankInterest(params) {
        return Joi.validate(params,
            Joi.object().keys({
                bankName: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
                amount: Joi.number().required(),
                id: Joi.number().optional().default(null),
                declaration_component_id: Joi.number().required(),
                financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
                comment: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
            })
        )
    }

    static postHraValidation(params, isEmployeeLogin) {
        let validationSchemaObj = {
            id: Joi.number().positive().optional(),
            date_range: Joi.string().required(),
            monthly_rent: Joi.number().required(),
            address: Joi.string().required(),
            // approved_amount: Joi.number(),
            declared_amount: Joi.number().required(),
            landlord_name: Joi.string().required(),
            landlord_pan: Joi.string().required(),
            financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            comments: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            })
        };

        //for admin 
        if (!isEmployeeLogin) {
            validationSchemaObj = {
                ...validationSchemaObj,
                employee_id: Joi.number().positive().required()
            }
        }
        const schema = Joi.object().keys(validationSchemaObj);
        return Joi.validate(params, schema);
    }
    static addPension(params) {
        return Joi.validate(params,
            Joi.object().keys({
                memberName: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
                relationType: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
                amount: Joi.number().required(),
                date: Joi.date().required(),
                id: Joi.number().optional().default(null),
                declaration_component_id: Joi.number().required(),
                financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
                comment: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
            })
        )
    }

    static getEmployeeDeduction(params) {
        return Joi.validate(params,
            Joi.object().keys({
                employee_id: Joi.number().required().error(e => "Not Authorized"),
                financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                    return Common.joiErrorMessage(errors)
                }),
                withOtherDeductions: Joi.boolean().optional()
            })
        )
    }

    static deleteDeductions(params) {
        return Joi.validate(params, Joi.object().keys({
            ids: Joi.array().items(Joi.number().integer()).min(1)
        }))
    }

    static getReimbursementValidation(params) {

        return Joi.validate(params, Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(),
            employee_id: Joi.number().integer().optional().default(null),
            search: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            financialYear: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            date: Joi.date().optional()
        }))
    }

    static postReimbursement(params) {
        return Joi.validate(params, Joi.object().keys({
            id: Joi.number().positive().optional(),
            component_name: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            employee_id: Joi.number().required(),
            declared_date: Joi.string().required(),
            declared_amount: Joi.number().required(),
            financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            comment: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            })
        })
        );
    }

    static putReimbursement(params) {
        return Joi.validate(params, Joi.object().keys({
            id: Joi.number().positive().required(),
            employee_id: Joi.number().required(),
            approved_amount: Joi.number().required(),
            comment: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            status: Joi.number().required(),
        })
        );
    }

    static deleteReimbursement(params) {
        return Joi.validate(params, Joi.object().keys({
            id: Joi.number().positive().required()
        })
        );
    }

}
module.exports = { DeductionsValidator };