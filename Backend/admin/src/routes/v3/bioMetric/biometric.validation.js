const Joi = require('joi');


class BiometricValidator {
    
    enableBiometric(body) {
        const schema = Joi.object().keys({
            secretKey: Joi.string().required().trim(true).allow(null),
            userName: Joi.string().trim(true).allow('',null),
            status: Joi.number().integer()
        });
        const result = schema.validate(body);
        return result;
    }
    fetchUserData(body) {
        const schema = Joi.object().keys({
            email: Joi.string().trim(true).email(),
            secretKey: Joi.string().required().trim(true),
            userName: Joi.string().trim(true).allow('',null),
        });
        const result = schema.validate(body);
        return result;
    }
    updateBiometricData(body) {
        const schema = Joi.object().keys({
            user_id: Joi.string().required(),
            finger1: Joi.string().trim(true).allow('',null),
            finger2: Joi.string().trim(true).allow('',null),
            face: Joi.string().trim(true).allow('',null),
            bio_code: Joi.string().trim(true).allow('',null), 
        }).or('finger1', 'finger2', 'face', 'bio_code')
        const result = schema.validate(body);
        return result;
    }
    fetchUserDetails(body) {
        const schema = Joi.object().keys({
            finger: Joi.string().trim(true).allow('',null),
            face: Joi.string().trim(true).allow('',null),
            bio_code: Joi.string().trim(true).allow('',null), 
        });
        const result = schema.validate(body);
        return result;
    }
    forgotSecretKey(body) {
        const schema = Joi.object().keys({
            email: Joi.string().trim(true).email(),
            userName: Joi.string().trim(true)
        });
        const result = schema.validate(body);
        return result;
    }
    attendanceSummary(body) {
        const schema = Joi.object().keys({
            date: Joi.date().iso().required(),
            location_id: Joi.string().required()
        });
        const result = schema.validate(body);
        return result;
    }

    attendanceDetails(body) {
        const schema = Joi.object().keys({
            date: Joi.date().iso().required(),
            location_id: Joi.string().required(),
            status: Joi.string().allow(null,'').valid('0','1','2','3')
        });
        const result = schema.validate(body);
        return result;
    }
    
}

module.exports = new BiometricValidator();

