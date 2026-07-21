const Joi = require('joi');

class InformationValidation {

    getEmployeeBasicInfo(params) {
        const schema = Joi.object().keys({
            location_id: Joi.number().required(),
            department_id: Joi.number().required(),
            role_id: Joi.number().required(),
            name: Joi.string().optional().min(3).max(50),
            status: Joi.string().required(),
            employee_type: Joi.number().valid(0, 1, 2, 3, 4, 5).default(0),
        });
        return Joi.validate(params, schema);
    }

    updateEmployeeBasicInfo(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(),
            u_id: Joi.number().required(),
            location_id: Joi.number().allow(null, ""),
            department_id: Joi.number().allow(null, ""),
            phone: Joi.string().allow("", null).default(null).max(50),
            email: Joi.string().allow("", null).default(null).max(50),
            date_of_birth: Joi.date().default(null),
            address: Joi.string().allow("", null).default(null).max(100),
            marital_status: Joi.number().allow("", null).max(5),
            type: Joi.number().allow("", null).default(null).max(6),
            pt_location: Joi.number().allow("", null).default(null),
            pt_location_name: Joi.number().allow("", null).default(null),
            pan_number: Joi.string().allow("", null).max(50),
            pf_number: Joi.string().allow("", null).default(null).max(50),
            esi_number: Joi.string().allow("", null).default(null).max(50),
            uan_number: Joi.string().allow("", null).default(null).max(50),
            ctc: Joi.string().allow(null, "").max(50),
            c_address: Joi.string().allow("", null).default(null).max(1000),
            p_address: Joi.string().allow("", null).default(null).max(1000),
            personal_email: Joi.string().allow("", null).default(null).max(100),
            eligible_pf: Joi.number().allow("", null).default(0).max(3),
            pf_scheme: Joi.string().allow("", null).default(null).max(100),
            pf_joining: Joi.string().allow("", null).default(null).max(100),
            excess_pf: Joi.number().allow("", null).default(0).max(3),
            excess_eps: Joi.number().allow("", null).default(0).max(3),
            exist_pf: Joi.number().allow("", null).default(0).max(3),
            eligible_esi: Joi.number().allow("", null).default(0).max(3),
            eligible_pt: Joi.number().allow("", null).default(0).max(3),
        });
        return Joi.validate(params, schema);
    }

    getEmployeeDetails(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
        });
        return Joi.validate(params, schema);
    }

    updateBirthdayMailDetailValidate(params) {
        const schema = Joi.object().keys({
            to_email: Joi.array().items(Joi.string().email().required()).default([]),
            cc_email: Joi.array().items(Joi.string().email().required()).default([]),
            bcc_email: Joi.array().items(Joi.string().email().required()).default([]),
        });
        return Joi.validate(params, schema);
    }

    getEmployeeBioMetricsStatus(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
        });
        return Joi.validate(params, schema);
    }

    updateEmployeeBioMetricsStatus(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
            start_date: Joi.date().default(null),
            end_date: Joi.date().default(null),
            custom: Joi.string().valid('enable', 'disable').default(null)
        }).when(Joi.object({
            start_date: Joi.date().required(),
            end_date: Joi.date().min(Joi.ref('start_date')).required(),
            custom: Joi.string().forbidden()
        }).unknown(), {
            then: Joi.object({
                custom: Joi.string().forbidden()
            }),
            otherwise: Joi.object({
                custom: Joi.string().valid('enable', 'disable').required(),
                start_date: Joi.date().forbidden(),
                end_date: Joi.date().forbidden()
            })
        });
        
        return Joi.validate(params, schema);
    }
}

module.exports = new InformationValidation;