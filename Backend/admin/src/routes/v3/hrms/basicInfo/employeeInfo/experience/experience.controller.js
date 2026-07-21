const experienceModel = require("./experience.model");
const experienceService = require("./experience.service");
const experienceValiation = require("./experience.valiation");
const { translate } = require(`../../../../../../utils/messageTranslation`);
const { experienceMessages } = require('../../../../../../utils/helpers/LanguageTranslate');
class ExperienceController {

    /**
     * getExperience - function to handle the get request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async getExperience(req, res) {
        const { language } = req.decoded;
        try {
            const { value, error } = experienceValiation.getExperienceValidation(req.query);
            if (error) {
                return res.json({ code: 400, message: translate(experienceMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }

            const experienceData = await experienceService.getExperience(value.employeeId);
            return res.json({ code: 200, message: translate(experienceMessages, experienceData.length ? 'SUCCESS' : 'NO_DATA', language), data: experienceData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * putExperience - function to handle the put request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async postExperience(req, res) {
        const { language } = req.decoded;
        try {
            const { organization_id } = req.decoded;

            const { value: postBody, error } = experienceValiation.postExperienceValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: translate(experienceMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }
            const experienceData = await experienceService.createExperience(postBody, organization_id);
            return res.json({ code: 200, message: translate(experienceMessages, 'SUCCESS', language), data: experienceData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * putExperience - function to handle the put request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async putExperience(req, res) {
        const { language } = req.decoded;
        try {
            const { organization_id } = req.decoded;
            const { value: updateBody, error } = experienceValiation.putExperienceValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: translate(experienceMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }
            const experienceData = await experienceService.updateExperience(updateBody, organization_id);
            return res.json({ code: 200, message: translate(experienceMessages, 'UPDATED_SUCCESSFULLY', language), data: experienceData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * deleteExperience - function to handle the delete request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async deleteExperience(req, res) {
        const { language } = req.decoded;
        try {
            const { organization_id } = req.decoded;
            const { value: deleteBody, error } = experienceValiation.deleteExperienceValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: translate(experienceMessages, 'VALIDATION_FAILED', language), error: error.details[0].message, data: null });
            }
            const experienceData = await experienceService.deleteExperience(deleteBody, organization_id);
            return res.json({ code: 200, message: translate(experienceMessages, 'DELETED_SUCCESSFULLY', language), data: null, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }
}

module.exports = new ExperienceController();