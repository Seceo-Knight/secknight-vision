const qualificationValiation = require('./qualification.valiation');
const qualificationService = require('./qualification.service');
const { translate } = require(`../../../../../../utils/messageTranslation`);
const { qualificationMessages } = require('../../../../../../utils/helpers/LanguageTranslate');
class QualificationController {

    /**
     * getQualification - function to handle the get request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async getQualification(req, res) {
        const { language } = req.decoded;
        try {
            const { value, error } = qualificationValiation.getQualificationValidation(req.query);
            if (error) {
                return res.json({ code: 400, message: translate(qualificationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }

            const qualificationData = await qualificationService.getQualification(value.employeeId);
            return res.json({ code: 200, message: translate(qualificationMessages, qualificationData.length ? 'SUCCESS' : 'NO_DATA', language), data: qualificationData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * putQualification - function to handle the put request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async postQualification(req, res) {
        const { language } = req.decoded;
        try {
            const { organization_id } = req.decoded;

            const { value: postBody, error } = qualificationValiation.postQualificationValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: translate(qualificationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }
            const qualificationData = await qualificationService.createQualification(postBody, organization_id);
            return res.json({ code: 200, message: translate(qualificationMessages, 'SUCCESS', language), data: qualificationData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * putQualification - function to handle the put request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async putQualification(req, res) {
        const { language } = req.decoded;
        try {
            const { organization_id } = req.decoded;

            const { value: updateBody, error } = qualificationValiation.putQualificationValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: translate(qualificationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }
            const qualificationData = await qualificationService.updateQualification(updateBody, organization_id);
            return res.json({ code: 200, message: translate(qualificationMessages, 'UPDATED_SUCCESSFULLY', language), data: qualificationData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * deleteQualification - function to handle the delete request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async deleteQualification(req, res) {
        const { language } = req.decoded;
        try {
            const { organization_id } = req.decoded;

            const { value: deleteBody, error } = qualificationValiation.deleteQualificationValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: translate(qualificationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }
            const qualificationData = await qualificationService.deleteQualification(deleteBody, organization_id);
            return res.json({ code: 200, message: translate(qualificationMessages, 'DELETED_SUCCESSFULLY', language), data: null, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }
}

module.exports = new QualificationController();