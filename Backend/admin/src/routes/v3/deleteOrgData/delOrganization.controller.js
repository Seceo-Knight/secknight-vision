const underscore = require('underscore');
const events = require('events');
let eventEmitter = new events.EventEmitter();
const otherOrganizationModel = require('./delOrganization.model');
const { logger } = require('../../../logger/Logger');
const { sendMailHelper } = require('./delOrganization.service');
const redis = require("../auth/services/redis.service");

const EMPV3DEMO_ID = process.env.ORGANIZATION_DATA_DELETE_ORG_ID; // Keep EMPV3DEMO Organization ID

class OrganizationController {

    /**
     * API will generate OTP for Delete Organization Data
     * Generate OTP 
     * Save OTP to redis for 10 minutes 
     * Send Mail with OTP
     * @param {*} req 
     * @param {*} res 
     * @returns {} success
     */

    async sendOTPEmail(req, res) {
        if (req.decoded.organization_id == EMPV3DEMO_ID) {
            try {
                await sendMailHelper(); // Send Mail Service for generating OTP, save on redis for 10 minutes and sending email
                return res.json({ code: 200, message: `OTP has been send to ${process.env.EMAIL_ORGANIZATION_DATA_DELETE}` });
            }
            catch (err) {
                return res.json({ code: 401, error: err.msg, message: "Some error occurred" });
            }
        }
        return res.json({ error: "API not found" });
    }

    /**
     * API will verify OTP and Delete Organization
     * Verify user OTP with redis 
     * Delete Redis OTP after verify  
     * Trigger event for data delete 
     * @param {*} req 
     * @param {*} res 
     * @returns {} success
     */

    async OrgDeleteApi(req, res) {
        let { emails, OTP } = req.body;
        if (req.decoded.organization_id == EMPV3DEMO_ID) {
            let redisOtp = await redis.getAsync('otp_for_organization_data_delete');    // Geting otp saved on redis and match with user otp
            if (OTP !== parseInt(redisOtp)) return res.json({code : 400, message: "Invalid OTP"});
            try {
                await redis.delAsync('otp_for_organization_data_delete');   // delete otp once verified
                let data = await otherOrganizationModel.getIdWithEmail(emails); // Get all organization id for array of organization emails
                logger.info(`-----------${JSON.stringify(data)}-------data`)
                let orgIds = underscore.pluck(data, 'id');
                logger.info(`-----------${orgIds}-------orgIds`)
                eventEmitter.emit('clear', orgIds, data); // Emit event to delete organization data
                return res.json({ code: 200, message: "OTP Verified. Deleting of Data have been Started. It might take 5-10 minutes" });
            }
            catch (err) {
                console.log(err);
                return res.json({ code: 401, error: "Error Delete Failed", message: err.message });
            }
        }
        return res.json({ error: "API not found" })
    }


}

const deleteDBData = async (orgIds, data) => {
    try {
        for (const orgid of orgIds) {
            let [orgData] = data.filter(d => d.id === orgid);
            try {
                let deletedRows;
                // For all employee list of organization from mysql
                let employeeDetails = await otherOrganizationModel.getAllEmployee(orgid);
                // let empIds = underscore.pluck(employeeDetails, 'id');

                let userIDS = underscore.pluck(employeeDetails, "u_id");

                deletedRows =  await otherOrganizationModel.removeAllAppWebUsage(orgid);
                logger.info(`---orgId----${orgid}-----employee_activities---${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_activityRequest(orgid);
                logger.info(`---orgId----${orgid}-----activity_request-----${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_orgAppWebModel(orgid);
                logger.info(`---orgId----${orgid}-----organization_apps_webs---${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_orgCategoriesModel(orgid);
                logger.info(`---orgId----${orgid}-----organization_categories----${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_report_activity_logs(orgid);
                logger.info(`---orgId----${orgid}-----report_activity_log--${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_userActivityData(orgid);
                logger.info(`---orgId----${orgid}-----useractivitydatas---${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_userSystemLogs(orgid);
                logger.info(`---orgId----${orgid}-----usersystemlogs--${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.remove_employeeProductivityReports(orgid);
                logger.info(`---orgId----${orgid}-----employee_productivity_reports---${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.get_notification_rules(orgid);
                let notification_ids = underscore.pluck(deletedRows, 'id');

                deletedRows = await otherOrganizationModel.delete_notification_rule_recipients(notification_ids);
                logger.info(`---orgId----${orgid}-----notification_rule_recipients---${JSON.stringify(deletedRows)}`)

                deletedRows = await otherOrganizationModel.delete_external_teleworks(orgid);
                logger.info(`---orgId----${orgid}-----external_teleworks---${JSON.stringify(deletedRows)}`)

                userIDS.push(orgData.user_id);
                

                deletedRows = await otherOrganizationModel.deleteAllUsersTable(userIDS);
                logger.info(`---orgId----${orgid}-----all from mysql---${JSON.stringify(deletedRows)}`)


                console.log("Deleted for orgId " + orgid);
            } catch (error) {
                console.log(error)
                console.log(error.message)
            }
        }
        console.log(`Data Delete for all orgIds`);
        return true;
    } catch (error) {
        console.log(error);
        console.log(error.message);
        return true;
    }
}

eventEmitter.on('clear', deleteDBData);
module.exports = new OrganizationController;