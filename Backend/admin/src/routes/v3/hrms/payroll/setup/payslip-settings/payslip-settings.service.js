/** Payslip Settings Service */


/** Imports */
const model = require("./payslip-settings.model");


/**
 * @class PayslipSettingsService
 * Contains Methods for Service
 */
class PayslipSettingsService {

    /**
     * Get Payslip Settings Service
     * @param {*} param0 
     * @author Akshay Dhood
     */
    async getPayslipSettings({ organization_id }) {
        try {

            /** Get Organization Settings */
            let [data] = await model.getOrganizationSettings({ organization_id });

            /** Convert Json to Object */
            data = data?.settings ? JSON.parse(data.settings).payslip_settings : { status: 0 };

            /** return Payslip Settings Data */
            return data;
        }
        catch (error) {
            throw error;
        }
    };


    /**
     * Update Payslip Settings Service
     * @param {*} param0 
     * @author Akshay Dhood
     */
    async updatePayslipSettings({ status, day, template_id, organization_id }) {
        try {

            /** Get Organization Settings */
            const [data] = await model.getOrganizationSettings({ organization_id });

            /** Convert Json to Object */
            let settings = data?.settings ? JSON.parse(data.settings) : {};

            /** Adding Payslip Settings */
            settings.payslip_settings = { status, day, template_id };

            /** Convert Object to Json */
            settings = JSON.stringify(settings);


            /** 
             * Condition 
             * if settings then update
             * else create
             */
            if (data?.id) {
                const updated = await model.updateOrganizationSettings({ settings, organization_id });
                if (!updated?.affectedRows) throw new Error();
            } else {
                const updated = await model.createOrganizationSettings({ settings, organization_id });
                if (!updated?.insertId) throw new Error();
            }

            /** Returns */
            return;
        } catch (error) {
            throw error;
        }
    };
}


/** exports */
module.exports = new PayslipSettingsService;