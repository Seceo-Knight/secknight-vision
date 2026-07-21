const Joi = require('joi');

class DeclarationSettingValidation {

    /**
     * isDeclarationWindowOpenValidate - function to validate the declaration open window
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    isDeclarationWindowOpenValidate(params) {
        const schema = Joi.object().keys({
            isDeclarationWindowOpen: Joi.boolean().required().default(false),
            enabled: Joi.optional(),
            isAppliedForAll: Joi.optional(),
            isMandatorProofNeeded: Joi.optional(),
            employeeIds: Joi.optional(),
            monthly: Joi.optional(),
            yearly: Joi.optional()
        });
        return Joi.validate(params, schema);
    }

    /**
     * putDeclarationSettingValidation - function to validate put declaration settings
     * 
     * @param {*} params 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    putDeclarationSettingValidation(params) {
        const schema = Joi.object().keys({
            enabled: Joi.string().allow(['MONTHLY', 'YEARLY']).optional(),
            isAppliedForAll: Joi.boolean().optional(),
            isDeclarationWindowOpen: Joi.boolean().required().default(false),
            isMandatorProofNeeded: Joi.boolean().required().default(false),
            employeeIds: Joi.array().when('isAppliedForAll', {
                is: false,
                then: Joi.array().items(Joi.number()).min(1).required()
            }),
            monthly: Joi.object().when('enabled', {
                is: 'MONTHLY',
                then: Joi.object().keys({
                    declarationWindow: Joi.object().keys({
                        from: Joi.number().positive().required(),
                        to: Joi.number().positive().greater(Joi.ref('from')).required()
                    }),
                    cutoffDateForYear: Joi.object().keys({
                        month: Joi.number().min(1).max(12).required().error(() => 'Month should be between 1 to 12'),
                        date: Joi.number().min(1).max(31).required()

                    })
                }).required()
            }),
            yearly: Joi.object().when('enabled', {
                is: 'YEARLY',
                then: Joi.object().keys({
                    from: Joi.date().raw().required(),
                    to: Joi.date().min(Joi.ref('from')).raw().required()
                }).required()
            })
        });
        return Joi.validate(params, schema);
    }
}

module.exports = new DeclarationSettingValidation();