const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class TransferValidation {

    addNewTransfer(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(255),
            transfer_date: Joi.string().required().max(255),
            transfer_department: Joi.number().required().max(255),
            transfer_location: Joi.number().required().max(1000),
            description: Joi.string().required().max(500),
        });
        return Joi.validate(params, schema);
    }

    updateTransfer(params) {
        const schema = Joi.object().keys({
            id: Joi.number().required(255),
            employee_id: Joi.number().required(255),
            transfer_date: Joi.string().required().max(255),
            transfer_department: Joi.number().required().max(255),
            transfer_location: Joi.number().required().max(1000),
            description: Joi.string().required().max(500),
        });
        return Joi.validate(params, schema);
    }

}

module.exports = new TransferValidation;