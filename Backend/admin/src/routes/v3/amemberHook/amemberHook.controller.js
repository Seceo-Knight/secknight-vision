const Model = require("./amemberHook.model");
const Service = require("./amemberHook.service");
const EventEmitter = require("events");
const redisService = require('../auth/services/redis.service');

const logger = require('../../../logger/Logger');

const eventEmitter = new EventEmitter();

class AmemberHookController {
    async updateExpiryData(req, res, next) {
        try {
            const { user_id, invoice_id, tm_added, login, email } = req.body;

            res.status(200).json({ code: 200, message: "Request received. Processing in background." });

            // Emit an event to handle the business logic
            eventEmitter.emit("processExpiryUpdate", { user_id, invoice_id, tm_added, login, email });
        } catch (error) {
            console.error("Error in updateExpiryData:", error.message);
            next(error);
        }
    }

    async addPaymentLogs(req, res) {
        try{
            await Model.insertPaymentLogs(req.body);
            return res.status(200).json({ code: 200, message: "Payment logs added successfully." });
        }catch(error){
            console.error("Error in addPaymentLogs:", error.message);
            next(error);
        }
    }

    async getPaymentLogs(req, res) {
        try{
            const [result, count] = await Promise.all([Model.fetchPaymentLogs(), Model.fetchPaymentLogs(1)]);
 
            return res.status(200).json({ code: 200, message: "success", data : {result, totalCount: count}, error : null });
        }catch(error){
            console.error("Error in getPaymentLogs:", error);
            return res.status(400).json({ code: 400, message: "failed", data : null, error : error.message });
        }
    }


}

module.exports = new AmemberHookController();


// Add an event listener for processing expiry updates
eventEmitter.on("processExpiryUpdate", async (data) => {
    let organization_id;
    let orgRules;
    try {
        const { user_id, login, email } = data;

        // Fetch organization details
        const [{ id, rules }] = await Model.getOrganizationId(user_id, email);
        if (id && rules) {
            organization_id = id;
            orgRules = JSON.parse(rules);
        }

        // Fetch plan expiry date
        const planExpiry = await Service.getPlanExpiryDate(user_id, login);

        if (planExpiry) {
            let parsedRules = JSON.parse(rules);

            // Update plan expiry in the rules
            if (parsedRules.pack) {
                parsedRules.pack.expiry = planExpiry;
            } else {
                parsedRules.pack = { expiry: planExpiry };
            }

            const updatedRules = JSON.stringify(parsedRules);


            // Update expiry data in the model
            const result = await Model.updateExpairyData(id, updatedRules);
            eventEmitter.emit("updateOrganizationPlanEmployeeWise", { id });

            if (!result) {
                logger.logger.error("Failed to update expiry data for organization ID: " +id);
            } else {
                logger.logger.info("Successfully updated expiry data for organization ID: " + id);
            }
        } else {
            logger.logger.error("Invalid or missing plan expiry date for user ID: " + user_id);
        }
    } catch (error) {
        if (error.message === "No active plans found.") {
            orgRules.pack.expiry = "2000-01-01";
            const result = await Model.updateExpairyData(organization_id, JSON.stringify(orgRules));
            eventEmitter.emit("updateOrganizationPlanEmployeeWise", { id: organization_id });
            logger.logger.info("Successfully updated expiry data for organization ID: " + organization_id);
        }
        else logger.logger.error("Error in processExpiryUpdate event: " + error.message);
    }
});


eventEmitter.on('updateOrganizationPlanEmployeeWise', async ({ id }) => {
    try {
        await redisService.delAsync(`${id}_plan_details`);
        let organizationEmployees = await Model.getOrganizationEmployee(id);
        for (const employee of organizationEmployees) {
            if (employee?.email) await redisService.delAsync(`${employee?.email?.toLowerCase()}_pack`);
            if (employee?.email) await redisService.delAsync(`${employee?.email?.toLowerCase()}_invalid_email_cred`);
            if (employee?.a_email) await redisService.delAsync(`${employee?.a_email?.toLowerCase()}_pack`);
            if (employee?.a_email) await redisService.delAsync(`${employee?.a_email?.toLowerCase()}_invalid_email_cred`);
        }
    } catch (error) {
        logger.logger.error("Error in updateOrganizationPlanEmployeeWise event - " + id);
    }
})
