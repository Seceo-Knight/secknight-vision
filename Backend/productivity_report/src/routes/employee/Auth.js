'use strict';
const moment = require('moment-timezone');
if (process.env.IS_DEBUGGING) console.log(__filename);

const Admin = require('../shared/Admin');
const encodeDecode = require('../../utils/helpers/PasswordEncoderDecoder');
const jwtToken = require('../../utils/jwt/JwtAuth');
const JoiAdminValidation = require('../../rules/validation/Admin');
const crypto_key = process.env.CRYPTO_PASSWORD;
const sendResponse = require('../../utils/myService').sendResponse;

class Auth {
    /**
     * Authentication verification .
     *
     * @function employee_auth
     * @memberof Auth
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Token or error .
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Open/post_employee_auth}
     */

    async employeeAuth(req, res) {
        let email = req.body.userName.toLowerCase();
        let password = req.body.password;
        let ip = req.body.ip

        let user_agent = req.headers['user-agent'] || req.headers.user_agent;
        let validate = JoiAdminValidation.adminAuth(email, password, ip);

        let is_employee = false;
        if (validate.error) return sendResponse(res, 404, null, 'Validation Failed.', validate.error.details[0].message);

        try {
            const employeeData = await Admin.userWithAdminAndRole(email);
            if (employeeData.length === 0) return sendResponse(res, 400, null, 'Inavalid Username And password.', null);

            let expire_date = moment(employeeData[0].expire_date).format("YYYY-MM-DD")
            let now = moment().format("YYYY-MM-DD");
            if (!(now <= expire_date)) return sendResponse(res, 400, null, 'Access Denied Due To Package Expired.', null);

            is_employee = employeeData[0].role_code === 'E';

            const decrypt_data = await encodeDecode.decryptText(employeeData[0].password, process.env.CRYPTO_PASSWORD);
            if (decrypt_data != password) return sendResponse(res, 400, null, 'Invalid Password.', null);

            /**user details for JWT token */
            let adminJsonData = {
                id: employeeData[0].id,
                admin_id: employeeData[0].admin_id,
                name: employeeData[0].name,
                full_name: employeeData[0].name + ' ' + employeeData[0].full_name,
                email: employeeData[0].email,
                email_verified_at: employeeData[0].email_verified_at,
                remember_token: employeeData[0].remember_token,
                phone: employeeData[0].phone,
                emp_code: employeeData[0].emp_code,
                location_id: employeeData[0].location_id,
                department_id: employeeData[0].department_id,
                photo_path: employeeData[0].photo_path,
                address: employeeData[0].address,
                role_id: employeeData[0].role_id,
                status: employeeData[0].status,
                timezone: employeeData[0].timezone,
                timezone_offset: employeeData[0].timezone_offset,
                is_employee: is_employee,
            };

            const tokenData = await jwtToken.createTokenData(adminJsonData, user_agent);
            const encryptData = await encodeDecode.encryptText(tokenData, process.env.CRYPTO_PASSWORD);


            return res.json({
                code: 200,
                data: encryptData,
                user_name: employeeData[0].name,
                is_employee: is_employee,
                user_id: employeeData[0].id,
                photo_path: employeeData[0].photo_path,
                message: 'Authentication Successful',
                error: null
            });
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, 'Unable To Login.', err);
        }
    }

    Employee_Authorise(req, res, next) {
        let userAgent = req.headers['user-agent'] || req.headers.user_agent;
        let token;
        if ('x-access-token' in req.headers) {
            token = req.headers['x-access-token'];
        }
        let validate = JoiAdminValidation.middlewate(userAgent, token)
        if (validate.error) {
            return res.json({
                code: 401,
                auth: false,
                message: 'Not Autherized.',
                error: null
            });
        }
        encodeDecode.decrypt(token, crypto_key, (decryptErr, decryptData) => {
            if (decryptErr) {
                res.json({
                    code: 400,
                    data: null,
                    auth: false,
                    message: 'Failed To Autherized.',
                    err: decryptErr
                })
            } else {
                // if (token && userAgent) {
                jwtToken.decryptToken(decryptData, userAgent, (err, decodedData) => {
                    if (err) return sendResponse(res, 400, null, 'Failed to Autherized.', err);
                    req['decoded'] = decodedData;
                    if (decodedData.jsonData.is_employee || decodedData.jsonData.is_manager) next();
                    else return sendResponse(res, 401, null, 'Unautherized access', 'invalid token');
                });
            }
        });
    }

}

module.exports = new Auth;