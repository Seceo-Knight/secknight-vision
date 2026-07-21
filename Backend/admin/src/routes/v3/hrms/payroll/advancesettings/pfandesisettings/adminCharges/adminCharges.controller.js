// Admin Charges Controller

const moment = require('moment');
const adminChargesModel = require('./adminCharges.model');
const adminChargesValidation = require('./adminCharges.validation');
const sendResponse = require('../../../../../../../utils/myService').sendResponse;


// class
class AdminChargesController {

    /**
     * get the admin charges details
     * @param {*} req 
     * @param {*} res 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async getAdminCharges(req, res) {
        const { organization_id } = req.decoded;
        try {
            let [data] = await adminChargesModel.getAdminCharges(organization_id);

            data = (JSON.parse(data.settings)).admin_charges;

            return data ? sendResponse(res, 200, data, 'Admin Charges Data.', null) : sendResponse(res, 400, null, 'No Admin Charges Data Found.', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', null);
        }
    }


    /**
     * Update Admin Charges for organization
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async updateAdminCharges(req, res) {
        const { organization_id } = req.decoded;
        try {
            const { value, error } = adminChargesValidation.updateValidation(req.body);
            if (error) return sendResponse(res, 400, null, 'Validation Failed', error.details[0].messages);

            const [data] = await adminChargesModel.getAdminCharges(organization_id);
            let settings = JSON.parse(data.settings);

            value.adminChargesEffectiveDate = value.adminChargesEffectiveDate ? moment(value.adminChargesEffectiveDate).format('YYYY-MM-DD') : value.adminChargesEffectiveDate;
            settings = {
                ...settings,
                admin_charges: value
            }

            let newSettings = JSON.stringify(settings);

            if (data.id) await adminChargesModel.updateAdminCharges(newSettings, organization_id);
            else await adminChargesModel.createAdminCharges(newSettings, organization_id);

            return sendResponse(res, 200, null, 'Admin Charges Updated.', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', null);
        }
    }
}


// exports
module.exports = new AdminChargesController();