const Validator = require('./uninstall-agent.validation');
const Model = require('./uninstall-agent.model');
const passwordService = require('../auth/services/password.service');
const redis = require('../../../utils/redis/redis.utils');
const WebSocketNotification = require('../websocket/websocketNotification');
const moment = require('moment');
const errorHandler = require('../../../utils/helpers/ErrorResponse');

class UninstallAgentController {
    async checkAgentUninstallProcess(req, res, next) {
        try {
            let { organization_id, user_id, employee_id, first_name, last_name
            } = req.decoded;
            let [result] = await Model.getAdminId(organization_id)
            const admin_id = result.admin_id;
            let employee_name = first_name.concat(" ", last_name)
            let {value, error} = Validator.checkAgentUninstallProcess(req.body);
            let [organizationData] = await Model.getOrganizationData(organization_id, employee_id);
            const notificationStatus =organizationData?.status;
            let redisUninstallData = await redis.getAsync(`${user_id}_invalid_uninstall_cred`);
            if (redisUninstallData === 5) {
                // create alert for max retry agent uninstall 
                if (notificationStatus === 'true') {
                    await WebSocketNotification.notificationUninstalledAgent(
                        `User ${employee_name} has retried max to uninstalled the agent`, admin_id
                    );
                }
                await Model.agentUninstalledLogs(employee_id, `User ${employee_name} has retried max to uninstalled the agent`,organization_id)
                return res.status(400).json({code: 400, message: "Max retry exceed. Please try after some time", error: "Validation Error" });
            }
            if(error) return res.status(400).json({code: 400, message: error.details[0].message, error: "Validation Error" });
            let { admin_email, password, dataId } = value;
            

            if (organizationData.email !== admin_email || organizationData.a_email !== admin_email) {
                await redis.setAsync(`${user_id}_invalid_uninstall_cred`, redisUninstallData === null ? 1 : ++redisUninstallData , 'EX', 60 * 60 * 8);
                return res.status(400).json({code: 400, message: "Admin Email is Invalid", error: "Validation Error" });
            }
            if(password == organizationData.uninstall_password) {
                await UninstallAgentController.sendAlert(notificationStatus,employee_id,employee_name,admin_id,organization_id)
                return res.status(200).json({code: 200, message: "Success", error: null });
            }
            password = passwordService.decrypt(password, process.env.CRYPTO_PASSWORD).decoded;
            organizationData.uninstall_password = passwordService.decrypt(organizationData.uninstall_password, process.env.CRYPTO_PASSWORD).decoded;

            if (password !== organizationData.uninstall_password) {
                await redis.setAsync(`${user_id}_invalid_uninstall_cred`, redisUninstallData === null ? 1 : ++redisUninstallData , 'EX', 60 * 60 * 8);
                return res.status(400).json({code: 400, message: "Password not match", error: "Validation Error", data: null });
            }
            await UninstallAgentController.sendAlert(notificationStatus,employee_id,employee_name,admin_id,organization_id)
            return res.status(200).json({code: 200, message: "Success", error: null });

        } catch (error) {
            return res.status(401).json({ code: 400, data: null, error: error.message, message: "Error Occurred" });
        }
    }
    /** send socket notification */
    static async sendAlert(notificationStatus,employee_id,employee_name,admin_id,organization_id){
        if (notificationStatus === 'true') {
            await WebSocketNotification.notificationUninstalledAgent(
                `User ${employee_name} has uninstalled the agent`, admin_id
            );
        }
        await Model.agentUninstalledLogs(employee_id, `User ${employee_name} has uninstalled the agent`,organization_id)
    }
}
module.exports = new UninstallAgentController;