const declarationSettingService = require("./declaration-setting.service");
const declarationsettingValidation = require('./declaration-setting.validation');

class DeclarationSettingController {

    /**
     * getDeclarationSettings - function to handle get declaration settings
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getDeclarationSettings(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const declarationsettings = await declarationSettingService.getDeclarationSettings(organization_id);

            return res.json({ code: 200, error: null, data: declarationsettings, message: 'Declaration Settings' });
        } catch (err) {
            return res.json({ code: 400, error: err.message, data: null, message: err.message });
        }
    }

    /**
     * putDeclarationSettings- function to handle put declaration request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async putDeclarationSettings(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error: err } = declarationsettingValidation.isDeclarationWindowOpenValidate(req.body);

            // validate the request for disable declaration settings
            if (err) {
                return res.json({ code: 404, error: err.details[0].message, data: null, message: 'Declaration Settings' });
            }
            if (!value.isDeclarationWindowOpen) {
                const updateStatus = await declarationSettingService.updateDeclarationSettings(value, organization_id);
                return res.json({ code: 200, error: null, data: updateStatus, message: 'Declaration Settings' })
            }

            // validate the request for enable declaration settings
            const { value: updateBody, error } = declarationsettingValidation.putDeclarationSettingValidation(req.body);

            if (error) {
                return res.json({ code: 404, error: error.details[0].message, data: null, message: 'Declaration Settings' });
            }
            const updateStatus = await declarationSettingService.updateDeclarationSettings(updateBody, organization_id);
            return res.json({ code: 200, error: null, data: updateStatus, message: 'Declaration Settings' })
        } catch (err) {
            return res.json({ code: 400, error: err.message, data: null, message: err.message });
        }
    }
}

module.exports = new DeclarationSettingController();