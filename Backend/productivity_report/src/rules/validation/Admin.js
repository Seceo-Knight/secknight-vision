const Joi = require('joi');

class Admin {

    /**validation for Admin profile updation  */
    adminProfileUpdation(adminId, newPassword, confirmPassword,
        fullName, name) {
        const schema = Joi.object().keys({
            name: Joi.string().allow(""),
            adminId: Joi.number().integer().required(),
            fullName: Joi.string().allow(""),
            newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{6,20}$/).allow("").required().error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
            confirmPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{6,20}$/).allow("").required().error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
        });
        var result = Joi.validate({
            adminId,
            newPassword,
            confirmPassword,
            fullName,
            name
        }, schema);
        return result;
    }

    /** Validation for Admin authentication  */
    adminAuth(userName, password, ip) {
        const schema = Joi.object().keys({
            userName: Joi.string().required(),
            password: Joi.string().required(),
            ip: Joi.string().required(),
        });
        var result = Joi.validate({
            userName,
            password,
            ip
        }, schema);
        return result;
    }

    /** Validation for  authentication  middleware */
    middlewate(user_agent, token) {
        const schema = Joi.object().keys({
            user_agent: Joi.string().required(),
            token: Joi.string().required(),
        });
        var result = Joi.validate({
            user_agent,
            token
        }, schema);
        return result;
    }

    authentication(name, first_name, last_name, email, username, address, phone, product_id, begin_date, expire_date) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            first_name: Joi.string(),
            last_name: Joi.string(),
            email: Joi.string().required(),
            username: Joi.string(),
            address: Joi.string().allow(''),
            phone: Joi.string().allow(''),
            product_id: Joi.number().required(),
            begin_date: Joi.date().required(),
            expire_date: Joi.date().required()
        });
        var result = Joi.validate({
            name,
            first_name,
            last_name,
            email,
            username,
            address,
            phone,
            product_id,
            begin_date,
            expire_date
        }, schema);
        return result;
    }

    /** Validation for Forgot Password  */
    forgotPassword(email) {
        const schema = Joi.object().keys({
            email: Joi.string().required(),
        });
        var result = Joi.validate({
            email
        }, schema);
        return result;
    }

    /** Validation for Forgot Password  */
    UpdatePassword(email, new_pasword, confirm_password, token) {
        const schema = Joi.object().keys({
            email: Joi.string().email({
                minDomainSegments: 2,
                tlds: {
                    allow: ['com', 'net', 'in']
                }
            }).required(),
            new_pasword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{6,20}$/).required().error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
            confirm_password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{6,20}$/).required().error(() => 'Confirm Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
            token: Joi.string().required(),
        });
        var result = Joi.validate({
            email,
            new_pasword,
            confirm_password,
            token
        }, schema);
        return result;
    }

    updateIntevalValidation(data) {
        const schema = {
            screenshot_capture_interval: Joi.number(),
            ideal_time: Joi.number(),
            offline_time: Joi.number()
        };
        return Joi.validate(data, schema);
    }

    updateAdminFeatureValidation(data) {
        const schema = {
            screenshot_enabled: Joi.number().required().valid([0, 1]),
            website_analytics_enabled: Joi.number().required().valid([0, 1]),
            application_analytics_enabled: Joi.number().required().valid([0, 1]),
            keystroke_enabled: Joi.number().required().valid([0, 1]),
            browser_history_enabled: Joi.number().required().valid([0, 1]),
            user_log_enabled: Joi.number().required().valid([0, 1]),
            firewall_enabled: Joi.number().required().valid([0, 1]),
            domain_enabled: Joi.number().required().valid([0, 1])
        };
        return Joi.validate(data, schema);
    }
}
module.exports = new Admin;