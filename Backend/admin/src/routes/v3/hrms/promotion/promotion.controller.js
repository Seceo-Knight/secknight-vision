const _ = require('underscore');
const PromotionModel = require('./promotion.model');
const LocationModel = require('../location/location.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const PromotionValidation = require('./promotion.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { promotionMessages } = require("../../../../utils/helpers/LanguageTranslate");

class PromotionController {

    /**
    * Create promotion
    *
    * @function createPromotion
    * @memberof  PromotionController
    * @param {*} req
    * @param {*} res
    * @returns {object} create list or error
    */
    async createPromotion(req, res) {
        const { organization_id, language, user_id } = req.decoded;
        try {
            let { value, error } = PromotionValidation.addPromotion(req.body);
            if (error) return sendResponse(res, 404, null, translate(promotionMessages, "2", language), error.details[0].message);

            let { employee_id, title, description, date } = value;
            const promotion = await PromotionModel.addPromotion(employee_id, title, description, date, user_id, organization_id);
            if (promotion.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    promotions: {
                        promotion_id: promotion.insertId || null, ...value
                    },
                }, translate(promotionMessages, "6", language), null);
            }
            return sendResponse(res, 400, null, translate(promotionMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(promotionMessages, "8", language), err);
        }
    }

    /**
    * Update promotion
    *
    * @function updatePromotion
    * @memberof  PromotionController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updatePromotion(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = PromotionValidation.updatePromotion(req.body);
            if (error) return sendResponse(res, 404, null, translate(promotionMessages, "2", language), error.details[0].message);

            let { promotion_id, employee_id, title, description, date } = value;
            const promotion = await PromotionModel.updatePromotion(employee_id, title, description, date, promotion_id);
            if (promotion.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    promotions: {
                        promotion_id: promotion.id || null, ...value
                    },
                }, translate(promotionMessages, "9", language), null);
            }
            return sendResponse(res, 400, null, translate(promotionMessages, "10", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(promotionMessages, "11", language), err);
        }
    }

    /**
    * Get promotion
    *
    * @function getPromotions
    * @memberof  PromotionController
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getPromotions(req, res) {
        let { organization_id, language } = req.decoded;
        let { promotion_id } = req.query;
        try {
            let promotions = await PromotionModel.getPromotion(promotion_id, organization_id);
            if (promotions.length > 0) {
                let addedByIds = _.pluck(promotions, "added_by");
                addedByIds = (_.unique(addedByIds)).filter(el => el != null);
                let addedByData = [];
                if (addedByIds.length > 0) addedByData = await LocationModel.getUsersWithUid(addedByIds);

                promotions = promotions.map(item => ({
                    ...item,
                    added_by_name: addedByData.find(itr => itr.id === item.added_by) ? addedByData.find(itr => itr.id === item.added_by).name : null,
                }))
                return sendResponse(res, 200, promotions, translate(promotionMessages, "4", language), null);
            }
            return sendResponse(res, 400, null, translate(promotionMessages, "3", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(promotionMessages, "5", language), null);
        }
    }

    /**
    * Deleted promotion
    *
    * @function deletePromotion
    * @memberof  PromotionController
    * @param {*} req
    * @param {*} res
    * @returns {object} deleted list or error
    */
    async deletePromotion(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { promotion_id } = req.body;
            const promotion = await PromotionModel.checkPromotionId(promotion_id, organization_id);
            if (promotion.length == 0) return sendResponse(res, 400, null, translate(promotionMessages, "12", language), null);

            let promotions = await PromotionModel.deletePromotion(promotion_id, organization_id);
            if (promotions) return sendResponse(res, 200, [], translate(promotionMessages, "15", language), null);

            return sendResponse(res, 400, null, translate(promotionMessages, "13", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(promotionMessages, "14", language), null);
        }
    }

}

module.exports = new PromotionController;