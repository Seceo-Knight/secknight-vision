const Joi = require('joi');
class PayrollSetupSettingsValidation {
    putPayrollSetupSettingValidation(params) {
        const schema = Joi.object().keys({
            pfAllowed: Joi.boolean().optional(),
            pfPercent: Joi.number().positive().optional(),
            pfCeiling: Joi.number().positive().optional().allow(0),
            paycycleFrom: Joi.number().positive().optional(),
            esiAllowed: Joi.boolean().optional(),
            ptAllowed: Joi.boolean().optional(),
            isCustomSalary: Joi.boolean().optional(),
            contract_scheme_id: Joi.number().optional().default(null),
        });
        var result = Joi.validate(params, schema);
        return result;
    }
}

module.exports = new PayrollSetupSettingsValidation;