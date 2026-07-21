const errorHandler = require('../../../../utils/helpers/ErrorResponse');
const uninstallAgentModel = require('../uninstall-agent.model');
const moment = require('moment');

module.exports = {
    async planCheck(req, res, next) {
        try {
            const { admin_email, user_email } = req.body;
            if (!admin_email?.trim() && !user_email?.trim()) {
                return next(new errorHandler('admin_email and user_email are required.', 404));
            }
            const [{ pack }] = await uninstallAgentModel.getExpiryFromAdmin(admin_email);
            const [{ timezone }] = await uninstallAgentModel.getEmployeeTimeZone(user_email);
            if (!pack || !timezone) return next(new errorHandler('admin_email or user_email not found.', 404));
            const expiry = JSON.parse(pack).expiry;
            if (!(moment().tz(timezone).format("YYYY-MM-DD") <= moment(expiry).format("YYYY-MM-DD"))) {
                return next(new errorHandler('Your plan expired.', 403));
            }
            next();
        } catch (error) {
            next(new errorHandler('Bad request.', 400));
        }
    }
}