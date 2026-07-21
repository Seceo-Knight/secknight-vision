const moment = require('moment-timezone');

const sendResponse = require('../../utils/myService').sendResponse;
const User = require('../shared/User');
const JoiValidationUser = require('../../rules/validation/User');
const PasswordEncodeDecoder = require('../../utils/helpers/PasswordEncoderDecoder');

class EmployeeService {

    async logDetailsRange(req, res) {

        const user_id = req["decoded"].jsonData.id;
        const admin_id = req["decoded"].jsonData.admin_id;
        const from_date = moment(req.body.from_date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const to_date = moment(req.body.to_date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 10;

        try {
            const validate = JoiValidationUser.userLogValidataion({
                user_id,
                from_date,
                to_date,
                skip,
                limit
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const user_data = await User.getUserDetails(user_id, admin_id);

            let data = await User.logDetails(user_id, from_date, to_date, skip, limit, admin_id);

            let full_name = user_data[0].name + ' ' + user_data[0].full_name;
            let email = user_data[0].email;
            let photo_path = user_data[0].photo_path;
            if (data.length === 0) return sendResponse(res, 200, {
                full_name,
                photo_path,
                email,
                user_id,
                log_details: null
            }, 'Log Data Not Found.', 'Log Data Not Found.');

            let total_count = data.length > 0 ? data[0].total_count : 0;
            let has_more_data = (skip + limit) > total_count ? false : true;
            data.map(e => delete e.total_count);
            return sendResponse(res, 200, {
                full_name,
                email,
                user_id,
                photo_path,
                log_details: data,
                total_count: total_count,
                has_more_data: has_more_data,
                skip_value: skip + limit,
                limit: limit
            }, 'Log details', null);
        } catch (err) {
            sendResponse(res, 400, null, 'Unable To Get Log Details.', 'Databse Error.');
        }
    }

    async userDetails(req, res) {
        const user_id = req["decoded"].jsonData.id;
        const admin_id = req["decoded"].jsonData.admin_id;

        try {
            let user = await User.userInformationWithLocationDepartmentAndRole(user_id, admin_id);
            let decripted_password = await PasswordEncodeDecoder.decryptText(user[0].password, process.env.CRYPTO_PASSWORD);
            user[0].password = decripted_password;
            return sendResponse(res, 200, user[0], 'User details', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to get user details', err);
        }

    }

    async updateDetails(req, res) {
        const user_id = req["decoded"].jsonData.id;
        const new_password = req.body.new_password;
        const confirmation_password = req.body.confirmation_password;

        try {
            const validate = JoiValidationUser.updatedetailsValidation({
                new_password,
                confirmation_password
            });

            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            if (new_password !== confirmation_password) return sendResponse(res, 400, null, 'New password and confirmation not matching.', 'Password mismatching.');

            const encripted = await PasswordEncodeDecoder.encryptText(new_password, process.env.CRYPTO_PASSWORD);

            const values = `password='${encripted}'`
            const condition = `id=${user_id}`

            const updated = await User.updateUser(values, condition);
            return sendResponse(res, 200, null, 'Successfully Updated.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to update.', err);
        }

    }
}

module.exports = new EmployeeService;