'use strict';
const moment = require('moment');
if (process.env.IS_DEBUGGING) console.log(__filename);

const Admin = require('../shared/Admin');
const Firewall = require('../shared/Firewall')
const UserService = require('../shared/User');
const StorageModel = require('../shared/Storage');
const encodeDecode = require('../../utils/helpers/PasswordEncoderDecoder');
const jwtToken = require('../../utils/jwt/JwtAuth');
const JoiAdminValidation = require('../../rules/validation/Admin');
const Mail = require('../../utils/helpers/Mail')
const sgMail = require('@sendgrid/mail');
const PasswordEncodeDecoder = require('../../utils/helpers/PasswordEncoderDecoder');
const email_tepmlate = require('./EmailTemplate')
const crypto_key = process.env.CRYPTO_PASSWORD;
const sendResponse = require('../../utils/myService').sendResponse;

class Auth {
    /**
     * Authentication verification .
     *
     * @function adminAuth
     * @memberof Auth
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Token or error .
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Open/post_admin_auth}
     */

    async managerAuth_old(req, res) {
        let email = req.body.userName.toLowerCase();
        let password = req.body.password;
        let ip = req.body.ip
        let user_agent = req.headers['user-agent'] || req.headers.user_agent;
        let validate = JoiAdminValidation.adminAuth(email, password, ip);
        let is_manager;
        let is_teamlead;
        if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

        try {
            const manager_data = await Admin.userWithAdminAndRole(email);
            if (manager_data.length === 0) return sendResponse(res, 400, null, 'Inavalid Username And password.', null);


            const data = await UserService.getRoleDatById(manager_data[0].role_id);
            if (data[0].params === 'E') return sendResponse(res, 400, null, 'Invalid Credentials.', null);
            // is_manager = true;
            is_manager = data[0].params === 'M';
            is_teamlead = data[0].params === 'TL';
            const decrypt_data = await encodeDecode.decryptText(manager_data[0].password, process.env.CRYPTO_PASSWORD);
            if (decrypt_data != password) return sendResponse(res, 400, null, 'Invalid Password.', null);

            let expire_date = moment(manager_data[0].expire_date).format("YYYY-MM-DD")
            let now = moment().format("YYYY-MM-DD");
            if (!(now <= expire_date)) return sendResponse(res, 400, null, 'Access Denied Due To Package Expired.', null);

            /**user details for JWT token */
            let adminJsonData = {
                id: manager_data[0].id,
                admin_id: manager_data[0].admin_id,
                name: manager_data[0].name,
                full_name: manager_data[0].name + ' ' + manager_data[0].full_name,
                email: manager_data[0].email,
                email_verified_at: manager_data[0].email_verified_at,
                remember_token: manager_data[0].remember_token,
                phone: manager_data[0].phone,
                emp_code: manager_data[0].emp_code,
                location_id: manager_data[0].location_id,
                department_id: manager_data[0].department_id,
                photo_path: manager_data[0].photo_path,
                address: manager_data[0].address,
                role_id: manager_data[0].role_id,
                status: manager_data[0].status,
                timezone: manager_data[0].timezone,
                timezone_offset: manager_data[0].timezone_offset,
                is_manager: true,
                is_teamlead: is_teamlead,
                is_admin: false
            }

            const tokenData = await jwtToken.createTokenData(adminJsonData, user_agent);
            const encryptData = await encodeDecode.encryptText(tokenData, process.env.CRYPTO_PASSWORD);

            const count = await Firewall.getWhitelistCount(manager_data[0].admin_id);
            if (count[0].count > 0) {
                const IPData = await Firewall.whitelistIPs(ip, manager_data[0].admin_id);
                if (IPData.length > 0) {
                    return res.json({
                        code: 200,
                        data: encryptData,
                        user_name: manager_data[0].name,
                        is_admin: false,
                        is_manager: is_manager,
                        is_teamlead: is_teamlead,
                        user_id: manager_data[0].id,
                        photo_path: manager_data[0].photo_path,
                        message: 'Authentication Successful',
                        error: null
                    });
                } else {
                    return res.json({ code: 400, data: null, message: 'Access Denied Due To This IP Is Not Allowed To Access.', error: null });
                }
            } else {
                return res.json({
                    code: 200,
                    data: encryptData,
                    user_name: manager_data[0].name,
                    is_admin: false,
                    is_manager: is_manager,
                    is_teamlead: is_teamlead,
                    user_id: manager_data[0].id,
                    photo_path: manager_data[0].photo_path,
                    message: 'Authentication Successful',
                    error: null
                });
            }
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Login.', null);
        }
    }

    async managerAuth(req, res) {
        let email = req.body.userName.toLowerCase();
        let password = req.body.password;
        let ip = req.body.ip
        let user_agent = req.headers['user-agent'] || req.headers.user_agent;
        let validate = JoiAdminValidation.adminAuth(email, password, ip);
        let is_manager = false;
        let is_teamlead = false;
        let is_employee = false;
        if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

        try {
            const manager_data = await Admin.userWithAdminAndRole(email);
            if (manager_data.length === 0) return sendResponse(res, 400, null, 'Inavalid Username And password.', null);

            // is_manager = true;
            is_manager = manager_data[0].role_code === 'M';
            is_teamlead = manager_data[0].role_code === 'TL';
            is_employee = manager_data[0].role_code === 'E';

            const decrypt_data = await encodeDecode.decryptText(manager_data[0].password, process.env.CRYPTO_PASSWORD);
            if (decrypt_data != password) return sendResponse(res, 400, null, 'Invalid Password.', null);

            let expire_date = moment(manager_data[0].expire_date).format("YYYY-MM-DD")
            let now = moment().format("YYYY-MM-DD");
            if (!(now <= expire_date)) return sendResponse(res, 400, null, 'Access Denied Due To Package Expired.', null);

            /**user details for JWT token */
            let adminJsonData = {
                id: manager_data[0].id,
                admin_id: manager_data[0].admin_id,
                name: manager_data[0].name,
                full_name: manager_data[0].name + ' ' + manager_data[0].full_name,
                email: manager_data[0].email,
                email_verified_at: manager_data[0].email_verified_at,
                remember_token: manager_data[0].remember_token,
                phone: manager_data[0].phone,
                emp_code: manager_data[0].emp_code,
                location_id: manager_data[0].location_id,
                department_id: manager_data[0].department_id,
                photo_path: manager_data[0].photo_path,
                address: manager_data[0].address,
                role_id: manager_data[0].role_id,
                status: manager_data[0].status,
                timezone: manager_data[0].timezone,
                timezone_offset: manager_data[0].timezone_offset,
                is_manager: is_manager,
                is_teamlead: is_teamlead,
                is_employee: is_employee,
                is_admin: false
            }

            const tokenData = await jwtToken.createTokenData(adminJsonData, user_agent);
            const encryptData = await encodeDecode.encryptText(tokenData, process.env.CRYPTO_PASSWORD);

            const count = await Firewall.getWhitelistCount(manager_data[0].admin_id);
            if (count[0].count > 0) {
                const IPData = await Firewall.whitelistIPs(ip, manager_data[0].admin_id);
                if (IPData.length > 0) {
                    return res.json({
                        code: 200,
                        data: encryptData,
                        user_name: manager_data[0].name,
                        is_admin: false,
                        is_manager: is_manager,
                        is_teamlead: is_teamlead,
                        is_employee: is_employee,
                        user_id: manager_data[0].id,
                        photo_path: manager_data[0].photo_path,
                        message: 'Authentication Successful',
                        error: null
                    });
                } else {
                    return res.json({ code: 400, data: null, message: 'Access Denied Due To This IP Is Not Allowed To Access.', error: null });
                }
            } else {
                return res.json({
                    code: 200,
                    data: encryptData,
                    user_name: manager_data[0].name,
                    is_admin: false,
                    is_manager: is_manager,
                    is_teamlead: is_teamlead,
                    is_employee: is_employee,
                    user_id: manager_data[0].id,
                    photo_path: manager_data[0].photo_path,
                    message: 'Authentication Successful',
                    error: null
                });
            }
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Login.', null);
        }
    }
    /**Middeleware for autherise the admin */
    Authorise(req, res, next) {

        let userAgent = req.headers['user-agent'] || req.headers.user_agent;
        let token;
        if ('x-access-token' in req.headers) {
            token = req.headers['x-access-token'];
        }
        let validate = JoiAdminValidation.middlewate(userAgent, token)
        if (validate.error) {
            return res.json({ code: 401, auth: false, message: 'Not Autherized.', error: null });
        }
        encodeDecode.decrypt(token, crypto_key, (decryptErr, decryptData) => {
            if (decryptErr) {
                return res.json({ code: 400, data: null, auth: false, message: 'Failed To Autherized.', err: decryptErr });
            } else {
                // if (token && userAgent) {
                jwtToken.decryptToken(decryptData, userAgent, (err, decodedData) => {
                    if (err) return sendResponse(res, 400, null, 'Failed to Autherized.', err);
                    req['decoded'] = decodedData;
                    if (decodedData.jsonData.is_admin || decodedData.jsonData.is_manager || decodedData.jsonData.is_teamlead) next();
                    else return sendResponse(res, 401, null, 'Unautherized access', 'invalid token');
                });
            }
        });
    }

    adminAuthentication(req, res) {
        let { name, first_name, last_name, email, username, address, phone, product_id, begin_date, expire_date, timezone, timezone_offset } = req.body;
        let user_agent = req.headers['user-agent'] || req.headers.user_agent;
        address = address ? address : '';
        phone = phone ? phone : '';
        first_name = first_name ? first_name : '';
        last_name = last_name ? last_name : '';

        let validate = JoiAdminValidation.authentication(name, first_name, last_name, email, username, address, phone, product_id, begin_date, expire_date);
        if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

        let expire_time = moment(expire_date).format("YYYY-MM-DD")
        let now = moment().format("YYYY-MM-DD");
        if (!(now <= expire_time)) return sendResponse(res, 400, null, 'Access Denied Due To Package Expired.', null);

        Admin.adminAuthentication(email, (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Failed While Authentication.', err);
            if (data.length > 0) {
                Admin.updateDetails(data[0].id, name, first_name, last_name, email, username, address, phone, product_id, begin_date, expire_date, (err, updatedData) => {
                    if (err) return sendResponse(res, 400, null, 'Failed While Authentication.', err);
                    var adminJsonData = {
                        admin_id: data[0].id,
                        name: name,
                        first_name: first_name,
                        last_name: last_name,
                        username: username,
                        email: email,
                        phone: phone,
                        address: address,
                        product_id: product_id,
                        begin_date: begin_date,
                        expire_date: expire_date,
                        is_manager: false,
                        is_teamlead: false,
                        is_employee: false,
                        is_admin: true,
                        timezone: data[0].timezone,
                        timezone_offset: data[0].timezone_offset,
                        organization_id: data[0].id
                    }
                    jwtToken.createToken(adminJsonData, user_agent, (createTokeErr, tokenData) => {
                        if (createTokeErr) return sendResponse(res, 400, null, 'Failed To Authentication.', createTokeErr);
                        encodeDecode.encrypt(tokenData, crypto_key, (encryptErr, encryptData) => {
                            if (encryptErr) return sendResponse(res, 401, null, 'Failed To Authentication.', encryptErr);
                            return res.json({
                                code: 200,
                                data: encryptData,
                                user_name: data[0].username,
                                is_admin: true,
                                is_manager: false,
                                is_teamlead: false,
                                is_employee: false,
                                user_id: data[0].id,
                                message: 'token',
                                error: null,
                                is_teamlead: false
                            });
                        });
                    });
                })
            } else {
                timezone = timezone || 'Asia/Kolkata';
                timezone_offset = timezone_offset || 330;
                Admin.registerAdmin(name, first_name, last_name, username, email, phone, address, product_id, begin_date, expire_date, timezone, timezone_offset, (err, data) => {
                    if (err) return sendResponse(res, 400, null, 'Failed To Authentication.', err);
                    var adminJsonData = {
                        admin_id: data.insertId,
                        name: name,
                        first_name: first_name,
                        last_name: last_name,
                        username: username,
                        email: email,
                        phone: phone,
                        address: address,
                        product_id: product_id,
                        begin_date: begin_date,
                        expire_date: expire_date,
                        is_admin: true,
                        is_manager: false,
                        is_teamlead: false,
                        is_employee: false,
                        timezone: timezone,
                        timezone_offset: timezone,
                        organization_id: data.insertId

                    }
                    // create jwt token
                    jwtToken.createToken(adminJsonData, user_agent, (createTokeErr, tokenData) => {
                        if (createTokeErr) return sendResponse(res, 401, null, 'Failed To Authentication.', nucreateTokeErrll);
                        encodeDecode.encrypt(tokenData, crypto_key, (encryptErr, encryptData) => {
                            if (encryptErr) return sendResponse(res, 401, null, 'Failed To Authentication.', encryptErr);
                            return res.json({
                                code: 200,
                                data: encryptData,
                                is_admin: true,
                                is_manager: false,
                                is_teamlead: false,
                                is_employee: false,
                                user_id: data.insertId,
                                message: 'token',
                                error: null,
                                is_teamlead: false
                            });
                        });
                    });

                    // Add default storage to free plan only
                    if (parseInt(process.env.FREE_PLAN_ID) === parseInt(product_id)) {
                        StorageModel.addDefaultStorageToFreePlan(data.insertId, email, product_id);
                    }
                });
            }
        });
    }

    /**Forgot password*/
    async forgotPassword(req, res) {
        let subject = 'Password Reset For EMP Monitor'
        let name = 'user'
        let email = req.body.email.toLowerCase();
        let validate = JoiAdminValidation.forgotPassword(email);
        if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message)

        UserService.forgotPassword(email, (err, data) => {
            if (err) return sendResponse(res, 400, null, "Error While Fetching User Data.", err);
            if (data.length === 0) return sendResponse(res, 400, null, "User Not Registered.", null);

            // if (data[0].params != 'M' || data[0].params != 'TL') return sendResponse(res, 400, null, "This Is Not Valid Email", null);
            let user_id = data[0].id.toString();
            encodeDecode.encrypt(user_id, crypto_key, (err, ecrypt_data) => {
                if (err) return sendResponse(res, 400, null, "Failed To Encrypt.", null);
                let link = process.env.WEB_LINK_DEV + `?token=${ecrypt_data}&email=${email} `;
                if (process.env.NODE_ENV === 'development') {
                    link = process.env.WEB_LINK_DEV + `?token=${ecrypt_data}&email=${email} `;
                } else if (process.env.NODE_ENV === 'production') {
                    link = process.env.WEB_LINK_PRODUCTION + `?token=${ecrypt_data}&email=${email} `;
                }
                var redirectlink = `${link}`;
                let emailtepmlate = email_tepmlate.replace("redirectlink", redirectlink);
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msg = {
                    to: email,
                    from: process.env.EMP_ADMIN_EMAIL,
                    subject: 'Password Reset For Emp Monitor',
                    text: 'Password Reset For EMP Monitor',
                    html: emailtepmlate,
                };
                sgMail.send(msg).then(data => {
                    return sendResponse(res, 200, email, "Email Sent To User Email Address", null);
                }).catch(error => {
                    return sendResponse(res, 400, null, "Unable Send Mail", error);
                });
            });
        });
    }

    // process.env.CRYPTO_PASSWORD
    restPassword(req, res) {
        let new_password = req.body.new_password;
        let confirm_password = req.body.confirm_password;
        let email = req.body.email;
        let token = req.body.token;

        let validate = JoiAdminValidation.UpdatePassword(email, new_password, confirm_password, token);
        if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

        if (new_password !== confirm_password) return sendResponse(res, 400, null, "Password Is Not Matching.", null);
        encodeDecode.decrypt(token, crypto_key, (err, decrypt_data) => {
            if (err) return sendResponse(res, 400, null, "Unable Decrypt Token.", err);
            UserService.forgotPassword(email, (err, data) => {
                if (err) return sendResponse(res, 400, null, "Failed To Encrypt Password.", null);
                if (data[0].id !== decrypt_data) return sendResponse(res, 400, null, "Invalid Email.", null);

                PasswordEncodeDecoder.encrypt(new_password, process.env.CRYPTO_PASSWORD, (err, password) => {
                    if (err) return sendResponse(res, 400, null, "Failed To Encrypt Password.", null);
                    UserService.updatePassword(password, email, (err, data) => {
                        if (err) return sendResponse(res, 400, null, "Failed To Encrypt Password.", null);
                        if (data.affectedRows == 0) return sendResponse(res, 400, null, 'Unable Updaet Password.', null);
                        return sendResponse(res, 200, null, 'Password Update Successfully.', null);
                    });
                });
            });
        });
    }
}

module.exports = new Auth;