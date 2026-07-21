"use strict";

const authModel = require('../../../auth/auth.model');
const validator = require('../../../auth/auth.validation');
const passwordService = require('../../../auth/services/password.service');
const redis = require('../../../auth/services/redis.service');
const jwtService = require('../../../auth/services/jwt.service');
const moment = require('moment-timezone');
const _ = require('underscore');
const actionsTracker = require('../../../services/actionsTracker');

/**
 * User Authentication routes
 *
 * @class UserAuthIndex
 */
class AuthService {
    async userAuth(req, res, next) {
        try {
            let { email, password, } = await validator.validateUserAuthParams().validateAsync(req.body);
            let is_manager = false, is_teamlead = false, is_employee = false;

            const [userData] = await authModel.userWithAdminAndRole(email);

            if (!userData) return res.status(400).json({ code: 400, error: 'Not Found', message: 'User does not exists', data: null });
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

            let setting = JSON.parse(userData.custom_tracking_rule);
            const shift = userData.shift ? JSON.parse(userData.shift) : '';

            let expire_date = moment(JSON.parse(userData.expire_date)).format("YYYY-MM-DD");
            let now = moment().format("YYYY-MM-DD");
            if (!(now <= expire_date)) return res.status(400).json({ code: 400, error: 'Denied', message: 'Access Denied as package is expired. Contact your administrator to renew the plan.', data: null });

            /**user details for JWT token */
            let adminJsonData = {
                user_id: userData.id, employee_id: userData.employee_id,
                organization_id: userData.organization_id, first_name: userData.first_name,
                last_name: userData.last_name, email: userData.email, a_email: userData.a_email,
                email_verified_at: userData.email_verified_at,
                contact_number: userData.contact_number,
                emp_code: userData.emp_code, location_id: userData.location_id, location_name: userData.location,
                department_id: userData.department_id, department_name: userData.department, photo_path: userData.photo_path,
                address: userData.address, role_id: userData.role_id, role: userData.role,
                status: userData.status, timezone: userData.timezone, is_manager: is_manager,
                is_teamlead: is_teamlead, is_employee: is_employee, is_admin: false,
                weekday_start: userData.weekday_start,
                language: userData.language,
                permission_ids
            };

            const payload = { user_id: adminJsonData.user_id };
            await redis.setUserMetaData(adminJsonData.user_id, { ...adminJsonData, permission_ids, setting, shift });

            const accessToken = await jwtService.generateAccessToken(payload);
            actionsTracker(req, 'User %i logged in successfully.', [userData.id]);
            return res.status(200).json({
                code: 200,
                data: accessToken,
                message: 'Authentication Successful',
                error: null
            });
        } catch (error) {
            console.log('Catch error ---', error);
            return res.status(400).json({ code: 400, error: 'Error in auth', message: error.message, data: null, });
        }
    }

}

module.exports = new AuthService;



// (async () => {
//     const [userData] = await authModel.userWithAdminAndRole("asitdasglb@gmail.com");
//     console.log(userData);
// })
    // ()