const Joi = require('joi');
class Reseller{

    addResellerData(title,brand) {
        const schema = Joi.object().keys({
            title: Joi.string().required(),
            brand: Joi.string().required(),
        });
        var result = Joi.validate({ title,brand }, schema);
        return result;
    }

}
module.exports= new Reseller;