const WarningModel = require('./warning.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const WarningValidation = require('./warning.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { warningMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./warning.validation');

class WarningController {

    /**
    * get warnings
    *
    * @function getWarnings
    * @memberof  WarningController;
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getWarnings(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let warnings = [];
            warnings = await WarningModel.fetchWarningsList(organization_id)
            if (warnings.length > 0) return sendResponse(res, 200, warnings, translate(warningMessages, "5", language), null);

            return sendResponse(res, 400, null, "No warnings found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(warningMessages, "6", language), null);
        }
    }

    /**
    * create warnings
    *
    * @function createWarnings
    * @memberof  WarningController;
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async createWarnings(req, res) {
        let { organization_id, language } = req.decoded;
        let details = {};
        try {
            let { value, error } = joiValidation.addNewWarnings(req.body);
            if (error) return sendResponse(res, 404, null, translate(warningMessages, "2", language), error.details[0].message);

            let { complaint_from, title, complaint_date, complaint_against, warning_type, description, status, type } = value;
            details = { complaint_from, title, complaint_date, complaint_against, warning_type, description, status, type };
            const add_warnings = await WarningModel.addWarnings(complaint_from, title, complaint_date, complaint_against, warning_type, description, status, type, organization_id);
            if (add_warnings) {
                if (add_warnings.insertId) {
                    return sendResponse(res, 200, {
                        warnings: {
                            add_warnings: add_warnings.insertId || null
                        },
                    }, translate(warningMessages, "3", language), null);
                }

            }
            return sendResponse(res, 400, null, translate(warningMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(warningMessages, "8", language), err);
        }
    }

    /**
    * delete warnings
    *
    * @function deleteWarnings
    * @memberof  WarningController;
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async deleteWarnings(req, res) {
        let { organization_id, language } = req.decoded;
        let id = req.decoded;
        let warning_id = req.body.warning_id;
        try {
            const delete_warning = await WarningModel.deleteWarnings(warning_id, organization_id);
            if (delete_warning) return sendResponse(res, 200, [], translate(warningMessages, "14", language), null);

            return sendResponse(res, 400, null, translate(warningMessages, "15", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(warningMessages, "16", language), null);
        }
    }

}

module.exports = new WarningController;