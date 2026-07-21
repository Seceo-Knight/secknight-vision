const Joi = require('joi');

class CustomSalaryValidation {
    /**
     * bulkUploadCustomSalary- function to validate the bulk upload
     * 
     * @param {*} customSalaryData 
     * @param {*} headers 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    bulkUploadCustomSalary(customSalaryData, headers = []) {
        const mandatoryFields = {
            mail_id: Joi.string().required(),
            annual_ctc: Joi.number().allow('', 0, null).required(),
            monthly_ctc: Joi.number().allow('', 0, null).required(),
            employer_pf: Joi.number().allow('', 0, null).required(),
            employer_esic: Joi.number().allow('', 0, null).required(),
            gross_salary: Joi.number().allow('', 0, null).required(),
            basic_allowance: Joi.number().allow('', 0, null).required()
            // employee_code: Joi.string().required()
        };

        const optionalFields = {};
        for (const key of headers) {
            optionalFields[key] = Joi.number().allow('', null).optional();
        }
        const validationObj = {
            ...optionalFields,
            ...mandatoryFields
        }
        return Joi.validate(customSalaryData, Joi.array().items(
            Joi.object().keys({
                ...validationObj
            })
        ))
    }


    /**
     * postCustomDetails- function to validate the bulk upload
     * 
     * @param {*} customSalaryData 
     * @param {*} headers 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    postCustomDetails(customSalaryData, headers = []) {
        const mandatoryFields = {
            annual_ctc: Joi.number().required(),
            monthly_ctc: Joi.number().required(),
            employer_pf: Joi.number().allow('', null).required(),
            employer_esic: Joi.number().allow('', null).required(),
            gross_salary: Joi.number().required(),
            basic_allowance: Joi.number().required(),
            admin_charges: Joi.number().allow('', null),
        };

        const optionalFields = {};
        for (const key of headers) {
            optionalFields[key] = Joi.number().allow('', null).optional();
        }
        const validationObj = {
            ...optionalFields,
            ...mandatoryFields
        }
        return Joi.validate(
            customSalaryData,
            Joi.object().keys({
                employee_id: Joi.number().required(),
                salary_components: Joi.object().keys({
                    ...validationObj
                }).required(),
                additional_components: Joi.array().items(
                    Joi.object().keys({
                        component_name: Joi.string().required(),
                        value: Joi.number().required(),
                        date: Joi.string().raw().required()
                    })
                ).optional(),
                deduction_components: Joi.array().items(
                    Joi.object().keys({
                        component_name: Joi.string().required(),
                        value: Joi.number().required(),
                        date: Joi.string().raw().required()
                    })
                ).optional()
            })
        );
    }


    ValidateGetCustomDetails(params) {
        return Joi.validate(params,
            Joi.object().keys({
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(20),
                name: Joi.string(),
                employee_id: Joi.number().optional(),
                employee_type: Joi.number().valid(0, 1, 2, 3, 4, 5).default(0),
            }));
    }

    /**
     * postOrgComponents - post org component validation
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    postOrgComponents(params) {
        const schema = Joi.object().keys({
            remove_components: Joi.array().items(Joi.string().trim().error(() => "empty value(s) not allowed")).optional().default([]),
            new_components: Joi.array().items(Joi.string().trim().error(() => "empty value(s) not allowed")).optional().default([]),
        });

        return Joi.validate(params, schema);
    }
}
module.exports = new CustomSalaryValidation();

