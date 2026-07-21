const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class BankdetailValidation {

    BankDetail(params) {
        const schema = Joi.object().keys({
            id: Joi.number().allow(null, ""),
            employee_id: Joi.number().required(),
            bank_name: Joi.string().required().max(100),
            account_number: Joi.string().required().max(50),
            ifsc_code: Joi.string().required().max(100),
            bank_address: Joi.string().allow(null, "").optional().default(null).max(100),
        });
        return Joi.validate(params, schema);
    }

    compliance(params) {
        const schema = Joi.object().keys({
            id: Joi.number().allow(null, ""),
            employee_id: Joi.number().required(),
            phone: Joi.string().allow("", null).default(null).max(50),
            email: Joi.string().allow("", null).default(null).max(50),
            address: Joi.string().allow("", null).default(null).max(50),
            marital_status: Joi.number().allow("", null).default(null).max(3),
            type: Joi.number().allow("", null).default(null).max(6),
            pt_location: Joi.number().allow("", null).default(null),
            pt_location_name: Joi.string().allow("", null).default(null),
            pan_number: Joi.string().allow("", null).default(null).max(50),
            pf_number: Joi.string().allow("", null).default(null).max(50),
            esi_number: Joi.string().allow("", null).default(null).max(50),
            uan_number: Joi.string().allow("", null).default(null).max(50),
            ctc: Joi.string().allow("", null).default(null).max(50),
            gross: Joi.string().allow("", null).default(null).max(50),
            c_address: Joi.string().allow("", null).default(null).max(100),
            p_address: Joi.string().allow("", null).default(null).max(100),
            personal_email: Joi.string().allow("", null).default(null).max(100),
            eligible_pf: Joi.number().allow("", null).default(0).max(3),
            pf_scheme: Joi.string().allow("", null).default(null).max(100),
            pf_joining: Joi.string().allow("", null).default(null).max(100),
            excess_pf: Joi.number().allow("", null).default(0).max(3),
            excess_eps: Joi.number().allow("", null).default(0).max(3),
            exist_pf: Joi.number().allow("", null).default(0).max(3),
            eligible_esi: Joi.number().allow("", null).default(0).max(3),
            eligible_pt: Joi.number().allow("", null).default(0).max(3),
            effective_date: Joi.date().allow(null, "").optional().default(null),
        });
        return Joi.validate(params, schema);
    }

    bulkUpdateCompliance(ComplianceData) {
        return Joi.validate(ComplianceData, Joi.array().items(
            Joi.object().keys({
                // id: Joi.any().required(),
                employee_unique_id: Joi.string().required(),
                employeeName: Joi.string().trim().optional().default(null),
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
        ))
    }

    bankDetailUpdate(params) {
        return Joi.validate(params,
            Joi.object().keys({
                detailsType: Joi.string().valid("bank", "basic").required()
            }))
    }

    bankDetailsBulkUpdate(params) {
        return Joi.validate(params, Joi.array().items(
            Joi.object().keys({
                employee_unique_id: Joi.string().required(),
                employeeName: Joi.string().allow(null, "").optional().default(null),
                bank_name: Joi.string().allow(null, "").optional().default(null),
                ifsc_code: Joi.string().allow(null, "").optional().default(null),
                bank_address: Joi.string().allow(null, "").optional().default(null),
                account_number: Joi.any().optional().default(null),
            })
        ))
    }

    basicDetailsBulkUpdate(params) {
        return Joi.validate(params, Joi.array().items(
            Joi.object().keys({
                employee_unique_id: Joi.string().required(),
                employeeName: Joi.any().optional().default(null),
                marital_status: Joi.number().allow("", null).valid(0, 1, 2, 3, 4, 5).optional().default(null),
                phone: Joi.any().optional().default(null),
                email: Joi.string().email().allow(null, "").optional().default(null),
                personal_email: Joi.string().email().allow(null, "").optional().default(null),
                current_address: Joi.any().allow("", null).default(null),
                permanent_address: Joi.any().allow("", null).default(null),
                type: Joi.number().allow(null, "").valid(1, 2, 3, 4, 5),
            })
        ))
    }
}
module.exports = new BankdetailValidation;

// const BasicDetailsHeaders = {
//     id: "ID",
//     employeeName: "Employee Name",
//     marital_status: "MARITAL STATUS",
//     phone: "PHONE NUMBER",
//     email: "EMAIL",
//     personal_email: "PERSONAL EMAIL",
//     current_address: "CURRENT ADDRESS",
//     permanent_address: "PERMANENT ADDRESS",
// }