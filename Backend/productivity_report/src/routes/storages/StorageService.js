const Storage = require('../shared/Storage');
const JoiStorageValidation = require('../../rules/validation/Storage')

class StorageService {

    /**Add storage types */
    addStorageType(req, res) {

        let name = req.body.name;
        let short_code = req.body.short_code;
        let validate = JoiStorageValidation.add_storage_type(name, short_code)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        }
        else {
            Storage.addSorageType(name, short_code, (err, data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Unable To Add Storage Type.', error: err });
                } else if (data.affectedRows > 0) {
                    return res.json({ code: 200, data: null, message: 'Succefully Storage Type Added.', error: err });
                } else {
                    return res.json({ code: 400, data: null, message: 'Storage Type Already Exists.', error: err });
                }
            })
        }
    }

    /**Get storage types */
    getStorageTypes(req, res) {
        Storage.getStorageTypes((err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Unable To Get Storage Types.', error: err });
            } else {
                if (data.length > 0) {
                    return res.json({ code: 200, data: data, message: 'Storage Data', error: err });
                }
                else {
                    return res.json({ code: 400, data: null, message: 'No Storage Data Found ', error: err });
                }
            }
        })
    }

    /**Add storage data and includes storage types*/
    addStorageData(req, res) {
        let validate = JoiStorageValidation.add_storage_data(req.body.storage_type_id, req.body.username,
            req.body.password, req.body.desktop_access_token, req.body.web_access_token, req.body.token,
            req.body.api_key, req.body.application_id, req.body.refresh_token,
            req.body.client_id, req.body.client_secret,req.body.bucket_name,req.body.region)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        } else {
            let admin_id = req['decoded'].jsonData.admin_id;
            let storage_type_id = req.body.storage_type_id;
            let username = req.body.username || null;
            let password = req.body.password || null;
            let desktop_access_token = req.body.desktop_access_token || null;
            let web_access_token = req.body.web_access_token || null;
            let token = req.body.token || null;
            let api_key = req.body.api_key || null;
            let application_id = req.body.application_id || null;
            let refresh_token = req.body.refresh_token || null;
            let admin_email = req['decoded'].jsonData.email;
            let client_id = req.body.client_id || null;
            let client_secret = req.body.client_secret || null;
            let bucket_name = req.body.bucket_name || null;
            let region = req.body.region || null;
            Storage.getStorageType(storage_type_id, (err, storage_type_data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Unable To Get Storage Type.', error: err });
                } else if (storage_type_data.length > 0) {
                    Storage.addStorageData(storage_type_id, username, password, desktop_access_token, web_access_token, token, api_key, application_id, refresh_token, admin_email, client_id, client_secret, admin_id,bucket_name,region, (err, data) => {
                        if (err) {
                            return res.json({ code: 400, data: null, message: 'Unable To Add Storage Data.', error: err });
                        } else {
                            let storage_data = req.body;
                            storage_data.storage_data_id = data.insertId;
                            storage_data.status = 0;
                            storage_data.sotrage_type = storage_type_data[0].name;
                            return res.json({ code: 200, data: storage_data, message: 'Successfully Added Storage Data.', error: null });
                        }
                    })
                }
                else {
                    return res.json({ code: 400, data: null, message: 'No Such Storage Type Found.', error: null });
                }
            })

        }
    }

    /**Get storage data with storage type */
    getStorageDataWithsorageType(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        Storage.getStorageDataWithsorageType(admin_id, (err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Unable To Get Storage Data.', error: err });
            } else {
                if (data.length > 0) {
                    return res.json({ code: 200, data: data, message: 'Success.', error: null });
                } else {
                    return res.json({ code: 400, data: null, message: 'No Storage Data Found.', error: null });
                }
            }
        })
    }

    /**Delete storage data */
    deleteStorageData(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let storage_data_id = req.body.storage_data_id;
        let validate = JoiStorageValidation.delete_storage_data(storage_data_id)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        }
        else {
            Storage.deleteStorageData(storage_data_id, admin_id, (err, data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Unable To Delete Storage Data.', error: err });
                } else if (data.affectedRows > 0) {
                    return res.json({ code: 200, data: null, message: 'Storage Data Successfully Deleted.', error: null });
                } else {
                    return res.json({ code: 400, data: null, message: 'Invalid Input.', error: err });
                }
            })
        }
    }

    /**Update storage data */
    updateStorageData(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let storage_data_id = req.body.storage_data_id;

        Storage.getStorageData(storage_data_id, admin_id, (err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Unable To Update Storage Data.', error: err });
            } else {
                let username = req.body.username || data[0].username;
                let password = req.body.password || data[0].password;
                let desktop_access_token = req.body.desktop_access_token || data[0].desktop_access_token;
                let web_access_token = req.body.web_access_token || data[0].web_access_token;
                let token = req.body.token || data[0].token;
                let api_key = req.body.api_key || data[0].api_key;
                let application_id = req.body.application_id || data[0].application_id;
                let refresh_token = req.body.refresh_token || data[0].refresh_token;
                let admin_email = req['decoded'].jsonData.email || data[0].admin_email;
                let client_id = req.body.client_id || data[0].client_id;
                let client_secret = req.body.client_secret || data[0].client_secret;
                let bucket_name = req.body.bucket_name || data[0].bucket_name;
                let region= req.body.region || data[0].region;
                let validate = JoiStorageValidation.update_storage_data
                    (storage_data_id, username, password,
                        desktop_access_token, web_access_token, token, api_key, application_id, refresh_token
                        , admin_email, client_id, client_secret,bucket_name,region)
                if (validate.error) {
                    return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
                }
                Storage.updateStorageData(storage_data_id, username, password, desktop_access_token, web_access_token, token, api_key, application_id, refresh_token, admin_email, client_id, client_secret,bucket_name,region, (err, updatedData) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Unable To Update Storage Data.', error: err });
                    } else {
                        return res.json({ code: 200, data: req.body, message: 'Successfully Updated Storage Data.', error: null });
                    }
                })
            }
        })


    }

    /**Update storage option */
    updateStorageOption(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let storage_data_id = req.body.storage_data_id;
        let status = req.body.status;
        let validate = JoiStorageValidation.update_storage_option(storage_data_id, status)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        }
        else {
            Storage.deactivateStorageDataOption(admin_id, storage_data_id, (err, data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Unable To Update Storage Data.', error: err });
                } else {
                    Storage.updateStorageDataOption(storage_data_id, status, admin_id, (err, updatedData) => {
                        if (err) {
                            return res.json({ code: 400, data: null, message: 'Unable To Update Storage Data.', error: err });
                        } else if (updatedData.affectedRows > 0) {
                            return res.json({ code: 200, data: req.body, message: 'Successfully Updated Storage Data.', error: null });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Invalid Input !', error: null });
                        }
                    })
                }
            })

        }
    }
}

module.exports = new StorageService;