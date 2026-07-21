const Joi = require('joi')
const Common = require(`${utilsFolder}/helpers/Common`);


class DeductionLoansValidator {
    /**
     * @function getValidation
     * @description function to validate get loans
     * 
     * @param { Object } params 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    static getValidation(params) {
        return Joi.validate(params, Joi.object().keys({
            employee_id: Joi.number().integer().optional().default(null),
            search: Joi.string().optional().default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10),
        }));
    }

    /**
     * @function postValidation
     * @description function to validate the post request
     * 
     * @param {*} params 
     * @param {*} isLoginEmployee
     * @returns
     * @author Amit Verma<amitverma@globussoft.in> 
     */
    static postValidation(params, isLoginEmployee) {
        const schemaObj = {
            id: Joi.number().optional().default(null),
            loan_name: Joi.string().trim().required(),
            start_date: Joi.date().raw(),
            end_date: Joi.date().raw(),
            loan_process_date: Joi.date().raw(),
            emi_amount: Joi.number().default(null),
            total_amount: Joi.number().required(),
            no_of_emi_pending: Joi.number().default(0),
            amount_pending: Joi.number(),
            rate_of_interest: Joi.number().optional(),
            financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            comment: Joi.string().optional().default(null),
            employee_id: Joi.number().optional().default(null),
            status: Joi.number().default(0),
            component: Joi.string().optional(),
            frequency: Joi.string().optional(),
            no_of_schedule: Joi.number().optional(),
            amount_paid: Joi.number().optional(),
            loan_required_date: Joi.date().raw().optional(),
            approved_amount: Joi.number().optional(),
        };
        if (!isLoginEmployee) {
            schemaObj.employee_id = Joi.number().required();
        }
        const schema = Joi.object().keys(schemaObj);

        return Joi.validate(params, schema);
    }

    static deleteValidation(params) {
        const Schema = Joi.object().keys({
            id: Joi.number().required(),
            employee_id: Joi.number().required(),
            financial_year: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
        });

        return Joi.validate(params, Schema);
    }
}
module.exports = { DeductionLoansValidator };