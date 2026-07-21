const Joi = require('joi');

class CommonBulkValidation {
    bulkUploadValidation(params) {
        const schema = Joi.object().keys({
            basicDetails: Joi.array().items(
                Joi.object().keys({
                    employee_unique_id: Joi.string().required(),
                    employee_name: Joi.any().optional().default(null),
                    marital_status: Joi.number().allow("", null).valid(0, 1, 2, 3, 4, 5).optional().default(null),
                    phone: Joi.any().optional().default(null),
                    email: Joi.string().email().allow(null, "").optional().default(null),
                    personal_email: Joi.string().email().allow(null, "").optional().default(null),
                    current_address: Joi.any().allow("", null).default(null),
                    permanent_address: Joi.any().allow("", null).default(null),
                    type: Joi.number().allow(null, "").valid(1, 2, 3, 4, 5),
                })
            ),
            bankDetails: Joi.array().items(
                Joi.object().keys({
                    employee_unique_id: Joi.string().required(),
                    employee_name: Joi.string().allow(null, "").optional().default(null),
                    bank_name: Joi.string().allow(null, "").optional().default(null),
                    ifsc_code: Joi.string().allow(null, "").optional().default(null),
                    bank_address: Joi.string().allow(null, "").optional().default(null),
                    account_number: Joi.any().optional().default(null),
                })
            ),
            complianceDetails: Joi.array().items(
                Joi.object().keys({
                    employee_unique_id: Joi.string().required(),
                    employee_name: Joi.string().trim().optional().default(null),
                    eligible_pf: Joi.number().allow("", null).valid(0, 1).optional().default(null),
                    uan_number: Joi.any().allow("", null).optional().default(null),
                    pan_number: Joi.any().allow("", null).optional().default(null),
                    pf_number: Joi.any().allow("", null).optional().default(null),
                    pf_scheme: Joi.any().allow("", null).optional().default(null),
                    pf_joining: Joi.date().allow(null, "").optional().default(null),
                    excess_pf: Joi.number().allow("", null).valid(0, 1).optional().default(null),
                    excess_eps: Joi.number().allow("", null).valid(0, 1).optional().default(null),
                    exist_pf: Joi.number().allow("", null).valid(0, 1).optional().default(null),
                    eligible_esi: Joi.number().allow("", null).valid(0, 1).optional().default(null),
                    eligible_pt: Joi.number().allow("", null).valid(0, 1).optional().default(null),
                    esi_number: Joi.any().allow("", null).optional().default(null),
                    ctc: Joi.number().allow("", null).optional().default(null),
                    gross: Joi.number().allow("", null).optional().default(null),
                    personal_email: Joi.any().allow("", null).default(null),
                    marital_status: Joi.number().allow("", null).default(null).max(3),
                    c_address: Joi.any().allow("", null).default(null),
                    p_address: Joi.any().allow("", null).default(null),
                    marital_status: Joi.number().allow("", null).default(null).max(3),
                    effective_date: Joi.date().allow(null, "").optional().default(null),
                })
            ),
            customSalary: Joi.array().items(
                Joi.object().keys({
                    mail_id: Joi.string().required(),
                    annual_ctc: Joi.number().allow('', 0, null).required(),
                    monthly_ctc: Joi.number().allow('', 0, null).required(),
                    employer_pf: Joi.number().allow('', 0, null).required(),
                    employer_esic: Joi.number().allow('', 0, null).required(),
                    gross_salary: Joi.number().allow('', 0, null).required(),
                    basic_allowance: Joi.number().allow('', 0, null).required(),
                    hra: Joi.number().allow('', 0, null).optional(),
                    telephone_and_internet: Joi.number().allow('', 0, null).optional(),
                    medical_allowance: Joi.number().allow('', 0, null).optional(),
                    lunch_allowance: Joi.number().allow('', 0, null).optional(),
                    special_allowance: Joi.number().allow('', 0, null).optional()
                })
            )
        });

        return Joi.validate(params, schema);
    }
}

module.exports = new CommonBulkValidation;