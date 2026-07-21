const PayrollSetupSettingService = require('./setting.service.js');
const PayrollSetupSettingValidation = require('./setting.validation.js');

class PayrollSetupSettingController {

    async getSetupSetting(req, res) {
        try {
            const { organization_id, language } = req.decoded;

            const orgPayrollSettings = await PayrollSetupSettingService.getOrgPayrollSetupSetting({ organization_id });
            if (!orgPayrollSettings) return res.json({ code: 400, data: null, error:null, message: 'No data' });

            return res.json({ code: 200, data: orgPayrollSettings, error: null, message: 'Payroll Setup Setting' });
        } catch (err) {
            return res.json({ code: 400, data:null, error: err.message, message: err.message });
        }
    }

    async putSetupSetting(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            //todo: update validation here
            const { error, value: updateBody } = PayrollSetupSettingValidation.putPayrollSetupSettingValidation(req.body);
            if (error) return res.json({ code: 404, data: null, message: 'Validation Failed.', error: error.details[0].message });

            const updateOrgPayrollSettings = await PayrollSetupSettingService.updateOrgPayrollSettings(organization_id, updateBody);
            if (!updateOrgPayrollSettings) return res.json({ code: 400, data: null, error: null, message: 'Update unsuccessful' });

            return res.json({ code: 200, data: { updateBody, updatedSetting: updateOrgPayrollSettings }, error: null, message: 'Payroll Setup Update Setting' });
        } catch (err) {
            return res.json({ code: 400, data:null, error: err.message, message: err.message });
        }
    }

}

module.exports = new PayrollSetupSettingController();