const Joi = require('joi');

class PwdRecoverValidation {
    /** Validation for Forgot Password  */
    forgotPassword(email, isClient) {
        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
            isClient: Joi.boolean().optional().default(false)
        });
        return Joi.validate({ email, isClient }, schema);
    }

    /** Validation for Forgot Password  */
    UpdatePassword(email, new_pasword, confirm_password, token, isClient) {
        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
            new_pasword: Joi.string().required().max(512).regex(/^(?=.*\d)(?=.*[!-\/:-@\[-`{-~]).{8,}$/).error(() => 'The password must contain at least one special character and at least one number and a minimum of 8 characters.'),
            confirm_password: Joi.any().valid(Joi.ref('new_pasword')).required().options({ language: { any: { allowOnly: 'must match new_pasword' } } }),
            // confirm_password: Joi.string().required().max(512).regex(/^(?=.*\d)(?=.*[!-\/:-@\[-`{-~]).{8,}$/).error(() => 'The password must contain at least one special character and at least one number and a minimum of 8 characters.'),
            token: Joi.string().required(),
            isClient: Joi.boolean().optional().default(false)
        });
        var result = Joi.validate({ email, new_pasword, confirm_password, token, isClient }, schema);
        return result;
    }


    /** Validation for admin reset Password  */
    adminResetPassword( email ) {
        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
        });
        var result = Joi.validate({ email }, schema);
        return result;
    }
}

module.exports = new PwdRecoverValidation;
