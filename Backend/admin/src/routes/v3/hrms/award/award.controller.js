const _ = require('underscore');
const AwardModel = require('./award.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const AwardValidation = require('./award.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { awardMessages } = require("../../../../utils/helpers/LanguageTranslate");

class AwardController {

    /**
    * Create award
    *
    * @function createAward
    * @memberof  AwardController
    * @param {*} req
    * @param {*} res
    * @returns {object} created list or error
    */
    async createAward(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = AwardValidation.createAward(req.body);
            if (error) return sendResponse(res, 404, null, translate(awardMessages, "2", language), error.details[0].message);

            let { employee_id, award_type, award_date, gift, cash, award_info, award_photo } = value;
            const award = await AwardModel.addAward(award_type, employee_id, gift, cash, award_date, award_info, award_photo, organization_id);
            if (award.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    awards: {
                        award_id: award.insertId || null,
                        award_type: award_type || null,
                        employee_id: employee_id,
                    },
                }, translate(awardMessages, "9", language), null);
            }
            return sendResponse(res, 400, null, translate(awardMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(awardMessages, "8", language), err);
        }
    }

    /**
    * Get award
    *
    * @function getAwards
    * @memberof  AwardController
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getAwards(req, res) {
        let { organization_id, language } = req.decoded;
        let { award_id } = req.query;
        try {
            let awards = await AwardModel.getAwards(award_id, organization_id);
            if (awards.length > 0) return sendResponse(res, 200, awards, translate(awardMessages, "4", language), null);

            return sendResponse(res, 400, null, translate(awardMessages, "3", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(awardMessages, "6", language), null);
        }
    }

    /**
    * Update award
    *
    * @function updateAward
    * @memberof  AwardController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateAward(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = AwardValidation.updateAward(req.body);
            if (error) return sendResponse(res, 404, null, translate(awardMessages, "2", language), error.details[0].message);

            let { award_id, award_type, employee_id, gift, cash, award_date, award_info, award_photo } = value;
            const award = await AwardModel.updateAward(award_id, award_type, employee_id, gift, cash, award_date, award_info, award_photo, organization_id);
            if (award.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    awards: {
                        award_id: award_id || null,
                        award_type: award_type || null,
                        employee_id: employee_id,
                    },
                }, translate(awardMessages, "10", language), null);
            }
            return sendResponse(res, 400, null, translate(awardMessages, "11", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(awardMessages, "12", language), err);
        }
    }

    /**
    * Delete award
    *
    * @function deleteAward
    * @memberof  AwardController
    * @param {*} req
    * @param {*} res
    * @returns {object} deleted list or error
    */
    async deleteAward(req, res) {
        let { organization_id, language } = req.decoded;
        let { award_id } = req.body;
        try {
            let awards = await AwardModel.getAwards(award_id, organization_id);
            if (awards.length > 0) {
                let deleteAward = await AwardModel.deleteAward(award_id, organization_id);
                if (deleteAward.affectedRows !== 0) return sendResponse(res, 200, null, translate(awardMessages, "13", language), null);

                return sendResponse(res, 400, null, translate(awardMessages, "14", language), null);
            }
            return sendResponse(res, 400, null, translate(awardMessages, "16", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(awardMessages, "15", language), null);
        }
    }
}

module.exports = new AwardController;