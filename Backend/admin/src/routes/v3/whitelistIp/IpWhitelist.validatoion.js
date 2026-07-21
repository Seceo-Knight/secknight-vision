const Joi = require('joi');

class IpWhitelistValidation{

    add_ip_whitelist(ip) {
        const schema = Joi.object().keys({
            ip: Joi.string().required(),
          });
        var result = Joi.validate({
            ip
        }, schema);
        return result;

    }

    updateIp(ip,ip_id){
        const schema = Joi.object().keys({
            ip: Joi.string().required(),
            ip_id:Joi.number().required(),
          });
        var result = Joi.validate({
            ip,ip_id
        }, schema);
        return result;

    }

    idValidation(ip_id){
        const schema = Joi.object().keys({
            ip_id:Joi.number().required(),
          });
        var result = Joi.validate({
            ip_id
        }, schema);
        return result;

    }

    skipLimit(skip,limit){
        const schema = Joi.object().keys({
            skip:Joi.number().allow(""),
            limit:Joi.number().allow(""),
          });
        var result = Joi.validate({
            skip,limit
        }, schema);
        return result;

    }

    // delete_ip_whitelist(id) {
    //     const schema = Joi.object().keys({
    //         id: Joi.number().integer().required(),
    //     });
    //     var result = Joi.validate({
    //         id
    //     }, schema);
    //     return result;
    // }
    
    // edit_ip(id, ip) {
    //     const schema = Joi.object().keys({
    //         id: Joi.number().integer().required(),
    //         ip: Joi.string().required(),
    //     });
    //     var result = Joi.validate({
    //         id,
    //         ip
    //     }, schema);
    //     return result;
    // }

}
module.exports=new IpWhitelistValidation;