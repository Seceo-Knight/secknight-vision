const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi)


class Validator {

    checkAgentUninstallProcess(data) {
        const schema = Joi.object().keys({
            admin_email: Joi.string().required(),
            user_email: Joi.string().required(),
            password: Joi.string().default(null).allow(null, ''),
            dataId: Joi.string().required(),
        });
        return schema.validate(data);
        
    }
}
module.exports = new Validator;