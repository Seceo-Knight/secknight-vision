const TerminationModel = require('./termination.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const TerminationValidation = require('./termination.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
// TerminationMessages
const { terminationMessages } = require("../../../../utils/helpers/LanguageTranslate");

class TerminationController {

    /**
    * Create termination
    *
    * @function createTermination
    * @memberof  TerminationController
    * @param {*} req
    * @param {*} res
    * @returns {object} create list or error
    */
    async createTermination(req, res) {
        const { organization_id, language, user_id } = req.decoded;
        try {
            let { value, error } = TerminationValidation.addTermination(req.body);
            if (error) return sendResponse(res, 404, null, translate(terminationMessages, "2", language), error.details[0].message);

            let { type, employee_id, notice, termination, reason, description } = value;
            const terminations = await TerminationModel.addTermination(type, employee_id, notice, termination, reason, 0, description, organization_id);
            if (terminations.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    terminations: {
                        termination_id: terminations.insertId || null,
                        ...value
                    },
                }, translate(terminationMessages, "3", language), null);
            }
            return sendResponse(res, 400, null, translate(terminationMessages, "4", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(terminationMessages, "5", language), err);
        }
    }

    /**
    * Get termination
    *
    * @function getTerminations
    * @memberof  TerminationController
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getTerminations(req, res) {
        let { organization_id, language } = req.decoded;
        let { termination_id, type } = req.query;
        try {
            let terminations = await TerminationModel.getTermination(termination_id, type, organization_id);
            if (terminations.length > 0) return sendResponse(res, 200, terminations, translate(terminationMessages, "6", language), null);

            return sendResponse(res, 400, null, translate(terminationMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(terminationMessages, "8", language), null);
        }
    }

    /**
   * Update termination
   *
   * @function updateTermination
   * @memberof  TerminationController
   * @param {*} req
   * @param {*} res
   * @returns {object} updated list or error
   */
    async updateTermination(req, res) {
        const { organization_id, language, user_id } = req.decoded;
        try {
            let { value, error } = TerminationValidation.updateTermination(req.body);
            if (error) return sendResponse(res, 404, null, translate(terminationMessages, "2", language), error.details[0].message);

            let { type, termination_id, employee_id, notice, termination, status, reason, description } = value;
            const terminations = await TerminationModel.updateTermination(type, termination_id, employee_id, notice, termination, reason, status, description, organization_id);
            if (terminations.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    terminations: { ...value },
                }, translate(terminationMessages, "9", language), null);
            }
            return sendResponse(res, 400, null, translate(terminationMessages, "10", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(terminationMessages, "11", language), err);
        }
    }

    /**
   * Delete termination
   *
   * @function deleteTermination
   * @memberof  TerminationController
   * @param {*} req
   * @param {*} res
   * @returns {object} deleted list or error
   */
    async deleteTermination(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { termination_id } = req.body;
            const termination = await TerminationModel.checkTerminationId(termination_id, organization_id);
            if (termination.length == 0) return sendResponse(res, 400, null, translate(terminationMessages, "12", language), null);

            let terminations = await TerminationModel.deleteTermination(termination_id, organization_id);
            if (terminations) return sendResponse(res, 200, [], translate(terminationMessages, "13", language), null);

            return sendResponse(res, 400, null, translate(terminationMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(terminationMessages, "15", language), null);
        }
    }
}

module.exports = new TerminationController;