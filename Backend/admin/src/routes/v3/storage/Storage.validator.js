
const Joi = require('joi');


class StorageValidator {
    addStorageDataType1(client_id, client_secret, refresh_token) {
        const schema = Joi.object().keys({
            client_id: Joi.string().required(),
            client_secret: Joi.string().required(),
            refresh_token: Joi.string().required()
        });
        var result = Joi.validate({
            client_id, client_secret, refresh_token
        }, schema);
        return result;
    }

    addStorageDataType2(client_id, client_secret, bucket_name, region) {
        const schema = Joi.object().keys({
            client_id: Joi.string().required(),
            client_secret: Joi.string().required(),
            bucket_name: Joi.string().required(),
            region: Joi.string().required()
        });
        var result = Joi.validate({
            client_id, client_secret, bucket_name, region
        }, schema);
        return result;
    }

    ValidateId(id) {
        const schema = Joi.object().keys({
            id: Joi.string().required(),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }

    UpdateStorageData(params) {
        const schema = Joi.object().keys({
            client_id: Joi.string().allow(null),
            client_secret: Joi.string().allow(null),
            bucket_name: Joi.string().allow(null),
            region: Joi.string().allow(null),
            refresh_token: Joi.string().allow(null),
            storage_data_id: Joi.number().required(),

            zoho_client_id: Joi.string().allow(null),
            zoho_client_secret: Joi.string().allow(null),
            zoho_refresh_token: Joi.string().allow(null),
            domain: Joi.string().allow(null),
            team_id: Joi.string().allow(null),

            onedrive_client_id: Joi.string().allow(null),
            onedrive_client_secret: Joi.string().allow(null),
            onedrive_redirect_url: Joi.string().allow(null),
            onedrive_refresh_token: Joi.string().allow(null),

            username: Joi.string().allow(null),
            password: Joi.string().allow(null),
            host: Joi.string().allow(null),
            port: Joi.number().min(1).allow(null),
            ftp_path: Joi.string().allow(null),
            access_token: Joi.string().allow(null),
            app_key: Joi.string().allow(null),
            app_secret: Joi.string().allow(null),
            redirect_uri: Joi.string().allow(null),
            api_endpoint: Joi.string().allow(null),
            auto_delete_period: Joi.number().min(1).max(365).allow(null),
        });

        return Joi.validate(params, schema);
    }

    UpdateStorageOption(storage_data_id, status) {
        const schema = Joi.object().keys({
            status: Joi.number().required(),
            storage_data_id: Joi.number().required(),
            client_organization_id: Joi.number().optional().default(null)

        });
        var result = Joi.validate({
            storage_data_id, status
        }, schema);
        return result;
    }


    addZohoStorageData(creds) {
        const schema = Joi.object().keys({
            zoho_client_id: Joi.string().required(),
            zoho_client_secret: Joi.string().required(),
            zoho_refresh_token: Joi.string().required(),
            domain: Joi.string().required(),
            team_id: Joi.string().required(),
        });
        return Joi.validate(creds, schema);
    }

    addOneDriveStorageData(onedrive_client_id, onedrive_client_secret, onedrive_redirect_url, onedrive_refresh_token) {
        const schema = Joi.object().keys({
            onedrive_client_id: Joi.string().required(),
            onedrive_client_secret: Joi.string().required(),
            onedrive_redirect_url: Joi.string().required(),
            onedrive_refresh_token: Joi.string().required(),
        });
        var result = Joi.validate({
            onedrive_client_id, onedrive_client_secret, onedrive_redirect_url, onedrive_refresh_token
        }, schema);
        return result;
    }

    addFTPStorageData({ username, password, host, port, ftp_path }) {
        const schema = Joi.object().keys({
            host: Joi.string().required(),
            password: Joi.string().required(),
            username: Joi.string().required(),
            port: Joi.number(),
            ftp_path: Joi.string()
        });

        return Joi.validate({ username, password, host, port, ftp_path }, schema);
    }

    ValidateStorageId(provider_id, auto_delete_period, client_organization_id, client_user_id) {
        const schema = Joi.object().keys({
            provider_id: Joi.number().required(),
            auto_delete_period: Joi.number().min(1).required(),
            client_organization_id: Joi.number().optional().default(null),
            client_user_id: Joi.number().optional().default(null)
        });

        return Joi.validate({ provider_id, auto_delete_period, client_organization_id, client_user_id }, schema);
    }

    validateOrgId(params) {
        return Joi.validate(params, Joi.object().keys({
            client_organization_id: Joi.number().optional().default(null)
        }), { abortEarly: false });
    }

    resellerIds(params) {
        return Joi.validate(params, Joi.object().keys({
            client_organization_ids: Joi.array().items(Joi.number()).default([]),
            enable: Joi.boolean().required().allow('true', 'false')
        }), { abortEarly: false });
    }

    addDropboxStorageData(access_token) {
        const schema = Joi.object().keys({
            access_token: Joi.string().required()
        });
        var result = Joi.validate({
            access_token
        }, schema);
        return result;
    }

    addDropboxStorageDataWithCredentials(app_key, app_secret, refresh_token, redirect_uri) {
        const schema = Joi.object().keys({
            app_key: Joi.string().min(10).required(),
            app_secret: Joi.string().min(10).required(),
            refresh_token: Joi.string().required(),
            redirect_uri: Joi.string().required()
        });
        var result = Joi.validate({
            app_key, app_secret, refresh_token, redirect_uri
        }, schema);
        return result;
    }

    addWebdavStorageData({ baseUrl, url, host, webdav_path, port, username, password }) {
        const schema = Joi.object().keys({
            baseUrl: Joi.string().uri().allow(null, ''),
            url: Joi.string().uri().allow(null, ''),
            host: Joi.string().allow(null, ''),
            webdav_path: Joi.string().required(),
            port: Joi.number().min(1).allow(null),
            username: Joi.string().allow(null, ''),
            password: Joi.string().allow(null, ''),
        }).or('baseUrl', 'url', 'host');

        return Joi.validate({ baseUrl, url, host, webdav_path, port, username, password }, schema);
    }

}
module.exports = new StorageValidator;