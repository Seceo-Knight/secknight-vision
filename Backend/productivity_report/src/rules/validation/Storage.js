const Joi = require('joi');


class Storage {

    /** valiadtion for add storage */
    add_storage_type(name, short_code) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            short_code: Joi.string().required(),
        });
        var result = Joi.validate({ name, short_code }, schema);
        return result;
    }

    /**valiadtion for add storage data  */
    add_storage_data(storage_type_id, username, password,
        desktop_access_token, web_access_token, token, api_key, application_id, refresh_token
        , client_id, client_secret, bucket_name, region) {
        const schema = Joi.object().keys({
            storage_type_id: Joi.number().integer().required(),
            username: Joi.string().allow(""),
            password: Joi.string().allow(""),
            desktop_access_token: Joi.string().allow(""),
            web_access_token: Joi.string().allow(""),
            token: Joi.string().allow(""),
            api_key: Joi.string().allow(""),
            application_id: Joi.string().allow(""),
            refresh_token: Joi.string().allow(""),
            client_id: Joi.string().allow(""),
            client_secret: Joi.string().allow(""),
            bucket_name:Joi.string().allow(""),
            region:Joi.string().allow("")
        });
        var result = Joi.validate({
            storage_type_id, username, password,
            desktop_access_token, web_access_token, token, api_key, application_id, refresh_token
            , client_id, client_secret,bucket_name,region
        }, schema);
        return result;
    }

    /** delete Storage data  */
    delete_storage_data(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    /** valiadtion for update starage data  */
    update_storage_data(storage_data_id, username, password,
        desktop_access_token, web_access_token, token, api_key, application_id, refresh_token
        , admin_email, client_id, client_secret,bucket_name,region) {
        const schema = Joi.object().keys({
            storage_data_id: Joi.number().integer().required(),
            username: Joi.string().allow(null),
            password: Joi.string().allow(null),
            desktop_access_token: Joi.string().allow(null),
            web_access_token: Joi.string().allow(null),
            token: Joi.string().allow(null),
            api_key: Joi.string().allow(null),
            application_id: Joi.string().allow(null),
            refresh_token: Joi.string().allow(null),
            admin_email: Joi.string().email().allow(null),
            client_id: Joi.string().allow(null),
            client_secret: Joi.string().allow(null),
            bucket_name:Joi.string().allow(""),
            region:Joi.string().allow("")
        });
        var result = Joi.validate({
            storage_data_id, username, password,
            desktop_access_token, web_access_token, token, api_key, application_id, refresh_token
            , admin_email, client_id, client_secret,bucket_name,region
        }, schema);
        return result;
    }

    /**validation  update storage option */
    update_storage_option(storage_data_id, status) {
        const schema = Joi.object().keys({
            storage_data_id: Joi.number().integer().required(),
            status: Joi.number().integer().required(),
        });
        var result = Joi.validate({ storage_data_id, status }, schema);
        return result;
    }


} module.exports = new Storage;