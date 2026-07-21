const _ = require('underscore');
const moment = require('moment');
const crypto = require("crypto");
const jwt = require('jsonwebtoken');

const { Mailer } = require('../../../../messages/Mailer');
const authModel = require('./auth.model')
const Validation = require('./auth.validation');
const passwordService = require('../../auth/services/password.service');
const CommonHelper = require('../../../../utils/helpers/Common');
const jwtService = require('../../auth/services/jwt.service');

const redis = require('../../auth/services/redis.service');

const mailTemplate = require('../template/mail.template');

const ConfigData = require('../../../../../../config/config')

class AuthController {
    async userAuth(req, res, next) {
        try {
            let { email, password, language } = await Validation.validateUserAuthParams().validateAsync(req.body);
            let is_manager = false,
                is_teamlead = false,
                is_employee = false;

            let [userData] = await authModel.userWithAdminAndRole(email);

            if (!userData) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User does not exists', data: null });
            if (userData.status == 2) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User suspended by admin', data: null });
            const userRoles = await authModel.roles(userData.id);

            let permissionData = await authModel.userPermission(userData.role_id, userData.organization_id);
            let permission_ids = [];
            if (permissionData.length > 0) {
                permission_ids = _.pluck(permissionData, 'permission_id');
            }

            if (userData.role && userData.role.toLowerCase() === 'manager') is_manager = true;
            else if (userData.role && userData.role.toLowerCase() === 'employee') is_employee = true;
            else if (userData.role && userData.role.toLowerCase() === 'team lead') is_teamlead = true;
            else if (userData.role && userData.role.toLowerCase()) is_manager = true;
            else return res.status(403).json({ code: 403, error: 'Not autherized', message: 'You are not autherized to access this.', data: null });

            const { decoded } = await passwordService.decrypt(userData.password, process.env.CRYPTO_PASSWORD);
            if (decoded != password) return res.status(400).json({ code: 400, error: 'Invalid', message: 'Password is invalid.', data: null });

            await authModel.updateEmployeeLocalizationStatus(userData.employee_id, language);
            userData.employee_language = language;

            let setting = JSON.parse(userData.custom_tracking_rule);
            const shift = userData.shift ? JSON.parse(userData.shift) : '';

            let expire_date = moment(JSON.parse(userData.expire_date)).format('YYYY-MM-DD');
            let now = moment().format('YYYY-MM-DD');
            if (!(now <= expire_date)) return res.status(400).json({ code: 400, error: 'Denied', message: 'Access Denied as package is expired. Contact your administrator to renew the plan.', data: null });
            const productive_setting = userData.productive_hours ? JSON.parse(userData.productive_hours) : null;
            const productive_hours = productive_setting ? (productive_setting.mode == 'unlimited' ? 28800 : CommonHelper.hourToSeconds(productive_setting.hour)) : 28800;

            setting.roomId = userData.room_id;
            /**user details for JWT token */
            let adminJsonData = {
                user_id: userData.id,
                employee_id: userData.employee_id,
                organization_id: userData.organization_id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                a_email: userData.a_email,
                email_verified_at: userData.email_verified_at,
                contact_number: userData.contact_number,
                emp_code: userData.emp_code,
                location_id: userData.location_id,
                location_name: userData.location,
                department_id: userData.department_id,
                department_name: userData.department,
                photo_path: userData.photo_path,
                address: userData.address,
                role_id: userData.role_id,
                role: userData.role,
                status: userData.status,
                timezone: userData.timezone,
                is_manager: is_manager,
                is_teamlead: is_teamlead,
                is_employee: is_employee,
                is_admin: false,
                weekday_start: userData.weekday_start,
                language: userData.employee_language,
                productive_hours,
                productivity_data: productive_setting,
                productivityCategory: userData.productivityCategory,
                permissionData,
            };

            const payload = { user_id: adminJsonData.user_id };
            await redis.setAsync(`${adminJsonData.user_id}_mobile_user`, JSON.stringify({ ...adminJsonData, permission_ids, setting, shift }), 'EX', CommonHelper.getTime(process.env.JWT_EXPIRY_SILAH));

            const accessToken = await jwtService.generateTokenWithCustomExpiryDays(payload, process.env.JWT_EXPIRY_SILAH);

            // const feature = await authModel.dashboardFeature();
            res.status(200).json({
                code: 200,
                data: accessToken,
                user_name: userData.first_name,
                is_admin: false,
                is_manager: adminJsonData.is_manager,
                is_teamlead: adminJsonData.is_teamlead,
                is_employee: adminJsonData.is_employee,
                user_id: userData.employee_id,
                photo_path: userData.photo_path,
                full_name: userData.first_name + ' ' + userData.last_name,
                email: userData.a_email,
                location_id: userData.location_id,
                organization_id: userData.organization_id,
                department_id: userData.department_id,
                role: userData.role,
                role_id: userData.role_id,
                roles: userRoles,
                total_allowed_user_count: userData.total_allowed_user_count,
                u_id: userData.id,
                weekday_start: userData.weekday_start,
                language: userData.employee_language,
                message: 'Authentication Successful',
                error: null,
            });
            //userData.mobile_login_date
            if(userData.mobile_login_date == null) {
                return  await authModel.updateMobileLoginDate(userData.employee_id, moment().utc().toISOString());
            } else return true;
        } catch (error) {
            console.log('Catch error ---', error);
            return res.status(400).json({ code: 400, error: 'Error in auth', message: error.message, data: null });
        }
    }

    async sendOTPAuth(req, res, next) {
        try {
            let { email } = await Validation.validateUserEmailParams().validateAsync(req.body);
            const [userData] = await authModel.userWithAdminAndRole(email);

            if (!userData) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User does not exists', data: null });
            if (userData.status == 2) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User suspended by admin', data: null });


            let isOTPExist = await redis.getAsync(`${userData.employee_id}_mobile_user_otp_next`);
            if (isOTPExist !== null) return res.status(200).json({ code: 200, error: null, message: 'OTP already sent', data: null });

            let otp = crypto.randomInt(1001, 9999);

            await redis.setAsync(`${userData.employee_id}_mobile_user_otp`, otp, 'EX', 60 * 2); // OPT will expire after 2 minutes
            await redis.setAsync(`${userData.employee_id}_mobile_user_otp_next`, otp, 'EX', 60); // Next OTP will be generated after 1 minutes
            // Send Mail Function
            const [orgSetting] = await authModel.getOrganizationSetting(userData.organization_id);

            let reseller = orgSetting.details;
            let silahCustomTemplate = false;
            if (orgSetting.reseller_user_id) {
                // Check if reseller is Silah
                let [reseller_org] = await authModel.getResellerOrgId(orgSetting.reseller_user_id);
                if (ConfigData.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(String(reseller_org.organization_id))) silahCustomTemplate = true;
            }
            if (ConfigData.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(String(userData.organization_id))) {
                const [resellerDetails] = await authModel.isReseller(userData.organization_id);
                reseller = resellerDetails.details;
                silahCustomTemplate = true;
            }

            let htmlTemplate = mailTemplate.OTP_MAIL_SILAH({
                otp: otp,
                name: userData.first_name + '' + userData.last_name,
                support_email: "support@empmonitor.com",
                skype: "empmonitorsupport",
                facebook: "",
                twitter: "",
                product_name: "Silah"
            })

            await Mailer.sendMail({
                from: process.env.EMP_SUPPORT_EMAIL,
                to: email,
                subject: "OTP - Password Reset - EmpMonitor",
                html: htmlTemplate,
            });

            return res.status(200).json({ code: 200, error: null, message: "Success", data: null });
        } catch (error) {
            return res.status(400).json({ code: 400, error: 'Error in sending OTP', message: error.message, data: null });
        }
    }

    async validateOTP(req, res, next) {
        try {

            let { email, otp } = await Validation.validateUserEmailOTPParams().validateAsync(req.body);
            const [userData] = await authModel.userWithAdminAndRole(email);

            if (!userData) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User does not exists', data: null });
            if (userData.status == 2) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User suspended by admin', data: null });


            let isOTPExist = await redis.getAsync(`${userData.employee_id}_mobile_user_otp`);
            if (isOTPExist === null) return res.status(400).json({ code: 400, error: null, message: 'OTP not found or expired', data: null });

            if (isOTPExist == otp) {
                await redis.delAsync(`${userData.employee_id}_mobile_user_otp`);

                let token = jwt.sign({ employee_id: userData.employee_id, organization_id: userData.organization_id, id: userData.id }, process.env.SESSION_SECRET, { expiresIn: 60 * 5 });

                return res.status(200).json({ code: 200, error: null, message: 'OTP match successfully', data: token });
            }
            else return res.status(400).json({ code: 400, error: null, message: 'OTP not match', data: null });

        } catch (error) {
            return res.status(400).json({ code: 400, error: 'Error in validation OTP', message: error.message, data: null });
        }
    }

    async updatePassword(req, res, next) {
        try {
            let token = req.headers['authorization'];
            if (token.includes('Bearer ')) {
                token = token.split('Bearer ')[1];
                let redisToken = await redis.getAsync(token);
                if(redisToken) return res.status(400).json({ code: 400, error: "Token Expired", message: "Token Expired", data: null });
                try {
                    let decoded = jwt.verify(token, process.env.SESSION_SECRET);
                    try {
                        let { password, confirm_password } = await Validation.validateUserPasswordParams().validateAsync(req.body);
                        if(password == confirm_password) {
                            const { encoded, error } = await passwordService.encrypt(password, process.env.CRYPTO_PASSWORD);
                            if(encoded == null) return res.status(400).json({ code: 400, error: 'Error in updating password', message: error.message, data: null });
                            
                            let updateId = await authModel.updatePassword(encoded, decoded);
                            if(updateId.affectedRows) {
                                await redis.setAsync(token, "expired", 'EX', 60 * 5);
                                return res.status(200).json({ code: 200, error: null, message: "Password updated successfully", data: null });
                            }
                            else return res.status(401).json({ code: 401, error: null, message: "Error in updating", data: null });
                        }
                        return res.status(401).json({ code: 401, error: 'Password & confirm password not match', message: 'Password & confirm password not match', data: null });
                    } catch (error) {
                        return res.status(400).json({ code: 400, error: 'Error in updating password', message: error.message, data: null });
                    }
                } catch (err) {
                    return res.status(401).json({ code: 401, error: "Invalid Access", message: err.message, data: null });
                }
            }
            else return res.status(401).json({ code: 401, error: "Invalid Access", message: 'Invalid Access', data: null });
        } catch (error) {
            return res.status(400).json({ code: 400, error: "Error in updating OTP password", message: error.message, data: null });
        }
    }

    async userLogout(req, res, next) {
        try {
            // await redis.setAsync(`${adminJsonData.user_id}_mobile_user`, JSON.stringify({ ...adminJsonData, permission_ids, setting, shift }), 'EX', CommonHelper.getTime(process.env.JWT_EXPIRY));
            let token = req.headers['authorization'];
            token = token.split('Bearer ')[1];
            await redis.setAsync(token, "Expired Logout", 'EX', CommonHelper.getTime(process.env.JWT_EXPIRY));
            return res.status(200).json({ code: 200, error: "User Logout Successfully", message: 'User Logout Successfully', data: null });
        } catch (error) {
            next(error);
        }
    }
}


module.exports = new AuthController;
