
const Joi = require('joi');
const Common = require(`${utilsFolder}/helpers/Common`);

const bool = () => Joi.boolean().valid(true, false),
    obj = () => Joi.object().unknown(true),
    num = () => Joi.number(),
    strRequired = () => Joi.string().max(200).required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
    }),
    str = () => Joi.string().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
    }),
    pfContribution = () => {
        return obj().keys({
            is_fixed: bool().default(false),
            fixed_amount: num().default(0),
            // .if("is_fixed").valid(true).than(Joi.number().integer().greater(0).required()),
            basic: bool().default(false),
            percentage: num().default(0),
            ceilingAmount: obj().keys({
                is_fixed: bool().default(false),
                fixed_amount: num().default(0),
                basic: bool().default(false),
                percentage: num().default(0)
            }).default({ is_fixed: false, fixed_amount: 0, basic: false, percentage: 0 })
        })
    },
    esiContribution = () => {
        return obj().keys({
            is_fixed: bool().default(false),
            fixed_amount: num().default(0),
            gross: bool().default(false),
            percentage: num().default(0)
        })
    }


class OverviewValidator {
    /**
     * A function for validate get employees parameters
     * @function getEmployees
     * @param {*} params
     * @returns {*} Values or Error 
     */
    static getEmployees(params) {
        return Joi.validate(params,
            Joi.object().keys({
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(20),
                name: Joi.string(),
                employee_id: Joi.number().integer().allow(null, "").default(null),
                sort: Joi.string().valid("employee").default(null),
                order: Joi.string().valid("A", "D").default("D"),
            }));
    }

    /**
     * A function for validate the payroll settings update params
     * @function updateSettings
     * @param {*} params 
     * @returns {*} Values or Error
     */
    static updateSettings(params) {
        params = { ...params, ...params.details, ...params.settings }
        delete params.details
        delete params.settings
        return Joi.validate(params,
            Joi.object().keys({
                employee_id: num().required(),
                pf_override: bool(),
                esi_override: bool(),
                pf_applicable: bool().required(),
                esi_applicable: bool().required(),
                adminCharges_override: bool().default(false),

                pf_number: Joi.any().when('pf_applicable', {
                    is: Joi.boolean().valid(true),
                    then: Joi.string().required(),
                    otherwise: Joi.optional().default(null),
                }).concat(Joi.any().when('pf_override', {
                    is: Joi.boolean().valid(true),
                    then: Joi.string().required(),
                    otherwise: Joi.optional().default(null),
                })),

                esi_number: Joi.any().when('esi_applicable', {
                    is: Joi.boolean().valid(true),
                    then: Joi.string().required(),
                    otherwise: Joi.optional().default(null),
                }).concat(Joi.any().when('esi_override', {
                    is: Joi.boolean().valid(true),
                    then: Joi.string().required(),
                    otherwise: Joi.optional().default(null),
                })),

                uan_number: str().default(null),
                eps_number: str().default(null),

                // settings: obj().keys({
                // pf_date_joined: Joi.date().default(null),
                // pf_effective_date: Joi.date().default(null),
                // esi_effective_date: Joi.date().default(null),

                pf_date_joined: Joi.any().when('pf_override', {
                    is: Joi.boolean().valid(true),
                    then: Joi.string().required(),
                    otherwise: Joi.optional().default(null),
                }),

                pf_effective_date: Joi.any().when('pf_override', {
                    is: Joi.boolean().valid(true),
                    then: Joi.date().required(),
                    otherwise: Joi.optional().default(null),
                }),

                esi_effective_date: Joi.any().when('esi_override', {
                    is: Joi.boolean().valid(true),
                    then: Joi.date().required(),
                    otherwise: Joi.optional().default(null),
                }),

                adminCharges_effective_date: Joi.any().when('adminCharges_override', {
                    is: Joi.boolean().valid(true),
                    then: Joi.date().required(),
                    otherwise: Joi.optional().default(null),
                }),

                vpf: num().default(0),
                pfContribution: obj().keys({
                    employee: pfContribution().default({ is_fixed: false, fixed_amount: 0, basic: true, percentage: 0 }),
                    employer: pfContribution().default({ is_fixed: false, fixed_amount: 0, basic: true, percentage: 0 }),
                }),

                esiContribution: obj().keys({
                    employee: esiContribution().default({ is_fixed: false, fixed_amount: 0, gross: true, percentage: 0 }),
                    employer: esiContribution().default({ is_fixed: false, fixed_amount: 0, gross: true, percentage: 0 }),
                }),

                adminChargesContribution: obj().keys({
                    is_fixed: bool().default(null),
                    fixed_amount: num().default(null),
                    basic: bool().default(null),
                    percentage: num().default(null),
                }).default({ is_fixed: true, fixed_amount: 0, basic: false, percentage: 0 }),
                // })
            }));
    }
}
module.exports = { OverviewValidator, bool, obj, num, str, strRequired, pfContribution }
