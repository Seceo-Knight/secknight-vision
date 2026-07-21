/** Payslip Settings Controller */

/** Importing */
const service = require("./payslip-settings.service");
const validation = require("./payslip-settings.validation");
const Logger = require("../../../../../../logger/Logger").logger;
const sendResponse = require("../../../../../../utils/myService").sendResponse;


/**
 * @class PayslipSettingsController
 * Contains Methods for Controller
 */
class PayslipSettingsController {

    /**
     * Get Payslip Settings
     * @param {*} req 
     * @param {*} res 
     * @author Akshay Dhood
     */
    async getPayslipSettings(req, res) {

        /** Parameters */
        const { organization_id } = req.decoded;
        try {

            /** Update Payslip Settings Service */
            const data = await service.getPayslipSettings({ organization_id });


            /** Response */
            return sendResponse(res, 200, data, "Success", null);
        }
        catch (error) {
            Logger.error(`get payslip-settings API error -----------------${error}-------`);
            return sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", error);
        }
    };


    /**
     * Update Payslip Settings
     * @param {*} req 
     * @param {*} res 
     * @author Akshay Dhood
     */
    async updatePayslipSettings(req, res) {

        /** Parameters */
        const { organization_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validation.updatePayslipSettings(req.body);
            if (error) return sendResponse(res, 400, null, "Validation Error", error.details[0].message);


            /** Update Payslip Settings Service */
            await service.updatePayslipSettings({ ...value, organization_id });


            /** Response */
            return sendResponse(res, 200, null, "Success", null);
        }
        catch (error) {
            Logger.error(`post payslip-settings API error -----------------${error}-------`);
            return sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", error);
        }
    };
}


/** exports */
module.exports = new PayslipSettingsController;