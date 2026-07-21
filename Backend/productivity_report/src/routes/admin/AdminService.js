"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);

const Admin = require('../shared/Admin')
const encodeDecode = require('../../utils/helpers/PasswordEncoderDecoder')
const crypto = process.env.CRYPTO_PASSWORD;
const JoiAdminValidation = require('../../rules/validation/Admin')
const sendResponse = require('../../utils/myService').sendResponse;

const multer = require('multer');
const upload = multer({
    dest: __dirname.split('src')[0] + 'public/images/profilePic/'
}).single('avatar');

class AdminService {


    /**
     * Admin details update .
     *
     * @function updateAdminDetails
     * @memberof AdminService
     * @param {*} req
     * @param {*} res
     * @returns {Object} -  Admin details or error .
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Admin/post_admin_profile_update}
     */
    async updateAdminDetails(req, res) {
        upload(req, res, function (uploadErr) {
            if (uploadErr) {
                return res.json({
                    code: 401,
                    data: null,
                    message: 'Updation Failed.',
                    error: err
                })
            } else {
                let validate = JoiAdminValidation.adminProfileUpdation(req.body.admin_id, req.body.new_password, req.body.confirm_password, req.body.full_name, req.body.name);
                if (validate.error) {
                    return res.json({
                        code: 404,
                        data: null,
                        message: 'Validation Failed.',
                        error: validate.error.details[0].message
                    });
                }

                let adminId = req.body.admin_id;
                Admin.admin_Data(adminId, (err, adminData) => {
                    if (err) {
                        return res.json({
                            code: 401,
                            data: null,
                            message: 'Updation Failed.',
                            error: err
                        })
                    } else if (adminData.length <= 0) {
                        return res.json({
                            code: 401,
                            data: null,
                            message: 'Admin Data Not Found.',
                            error: err
                        })
                    } else {
                        let photo_path;
                        let currentPassword = req.body.password;
                        let newPassword = req.body.new_password;
                        let confirmPassword = req.body.confirm_password;
                        let fullName = req.body.full_name || adminData[0].full_name;
                        let name = req.body.name || adminData[0].name;
                        if (req.file) {
                            photo_path = `/images/profilePic/${req.file.filename}`;
                        } else {
                            photo_path = adminData[0].photo_path;
                        }
                        if (currentPassword) {
                            if (newPassword == null) {
                                return res.json({
                                    code: 400,
                                    data: null,
                                    message: 'Please Enter New Password.',
                                    error: null
                                })
                            }
                            if (confirmPassword != newPassword) {
                                return res.json({
                                    code: 400,
                                    data: null,
                                    message: 'Confirm Password And New Password Is Not Matching.',
                                    error: null
                                })
                            }
                            if (currentPassword == newPassword) {
                                return res.json({
                                    code: 400,
                                    data: null,
                                    message: 'Current Password And New Password Must Be Different.',
                                    error: null
                                })
                            }

                            encodeDecode.decrypt(adminData[0].password, crypto, (decrypt_err, decryptdate) => {
                                if (decrypt_err) {
                                    return res.json({
                                        code: 400,
                                        data: null,
                                        message: 'Password Decryption Failed.',
                                        error: decrypterr
                                    })
                                } else {
                                    if (decryptdate == currentPassword) {
                                        encodeDecode.encrypt(newPassword, crypto, (encrypt_err, encryptdata) => {
                                            if (encrypt_err) {
                                                return res.json({
                                                    code: 400,
                                                    data: null,
                                                    message: 'Password Encryption Failed.',
                                                    error: encrypt_err
                                                })
                                            }
                                            Admin.admin_Update(adminId, fullName, name, encryptdata, photo_path, (update_err, update_data) => {
                                                if (err) {
                                                    return res.json({
                                                        code: 400,
                                                        data: null,
                                                        message: 'Updation Failed.',
                                                        error: update_err
                                                    })
                                                }
                                                return res.json({
                                                    code: 200,
                                                    data: req.body,
                                                    message: 'Updated Successully.',
                                                    error: null
                                                })
                                            })
                                        })
                                    } else {
                                        return res.json({
                                            code: 400,
                                            data: null,
                                            message: 'Incorrect Password.',
                                            error: null
                                        })
                                    }
                                }
                            })
                        } else if (!currentPassword && newPassword) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Please Enter The  Current Password.',
                                error: null
                            })
                        } else if (!currentPassword && !newPassword && confirmPassword) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Please Enter The Curent Password.',
                                error: null
                            })
                        } else if (!currentPassword && !newPassword && !confirmPassword) {
                            Admin.admin_Update(adminId, fullName, name, adminData[0].password, photo_path, (update_err, update_data) => {
                                if (err) {
                                    return res.json({
                                        code: 400,
                                        data: null,
                                        message: 'Updation Failed.',
                                        error: update_err
                                    })
                                }
                                return res.json({
                                    code: 200,
                                    data: req.body,
                                    message: 'Updated Successully.',
                                    error: null
                                })
                            })
                        }
                    }
                })
            }
        })
    }

    async getDetails(req, res) {
        Admin.admin_auth(req['decoded'].jsonData.email, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Database Error.',
                    error: err
                });
            } else {

                return res.json({
                    code: 200,
                    data: {
                        name: data[0].name,
                        full_name: data[0].full_name,
                        email: data[0].email,
                        phone: data[0].phone,
                        emp_code: data[0].emp_code,
                        location_id: data[0].location_id,
                        role_id: data[0].role_id,
                        address: data[0].address,
                        department_id: data[0].department_id
                    },
                    message: 'Success.',
                    error: null
                });
            }
        });
    }

    async adminDetails(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        try {
            const admin = await Admin.getDetails(admin_id);
            sendResponse(res, 200, admin[0], 'Admin Data.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Get Admin Details', 'Databse Error.');
        }
    }

    async updateInterval(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        let screenshot_capture_interval = req.body.screenshot_capture_interval;
        let ideal_time = req.body.ideal_time;
        let offline_time = req.body.offline_time;
        try {
            let validate = JoiAdminValidation.updateIntevalValidation({
                screenshot_capture_interval,
                ideal_time,
                offline_time
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

            const admin = await Admin.getDetails(admin_id);
            screenshot_capture_interval = screenshot_capture_interval || admin[0].screenshot_capture_interval;
            ideal_time = ideal_time || admin[0].ideal_time;
            offline_time = offline_time || admin[0].offline_time;

            if (parseInt(offline_time) <= parseInt(ideal_time)) return sendResponse(res, 400, null, 'Offline Time Must Be More Than Ideal Time.', null);

            const updated = await Admin.updateInteval(admin_id, screenshot_capture_interval, ideal_time, offline_time);

            return sendResponse(res, 200, {
                screenshot_capture_interval,
                ideal_time,
                offline_time
            }, 'Time Interval Updated Successfully.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Update Interval Details', 'Databse Error.');
        }
    }

    async getAdminFeatures(req, res) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            let filter = `admin_id = ${admin_id}`;

            const appInfo = await Admin.getAdminFeatures('screenshot_enabled,website_analytics_enabled,application_analytics_enabled,keystroke_enabled,browser_history_enabled,user_log_enabled,firewall_enabled,domain_enabled', filter);

            if (appInfo.length === 0) {
                return next(new ErrorResponse('Not Found', 404));
            }

            return sendResponse(res, 200, {
                data: appInfo[0],
                ack: {
                    true: 1,
                    false: 0
                }
            }, 'Fetched', null);
        } catch (err) {
            return sendResponse(res, 404, null, 'Data not found for this user', err);
        }

    }

    async updateAdminFeatures(req, res) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            let toBeUpdated = req.body;
            let validate = JoiAdminValidation.updateAdminFeatureValidation(toBeUpdated);
            if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

            const appInfoUpdated = await Admin.updateAdminFeature(
                toBeUpdated.screenshot_enabled, toBeUpdated.website_analytics_enabled, toBeUpdated.application_analytics_enabled,
                toBeUpdated.keystroke_enabled, toBeUpdated.browser_history_enabled, toBeUpdated.user_log_enabled, toBeUpdated.firewall_enabled,
                toBeUpdated.domain_enabled, admin_id
            );

            if (appInfoUpdated.changedRows > 0)
                return sendResponse(res, 200, appInfoUpdated.changedRows, 'Updated status of the features', null);
            else
                return sendResponse(res, 404, null, 'Not Updated', 'Nothing get changed');
        } catch (err) {
            return sendResponse(res, 400, null, 'Some error occured', err);
        }

    }
}
module.exports = new AdminService;