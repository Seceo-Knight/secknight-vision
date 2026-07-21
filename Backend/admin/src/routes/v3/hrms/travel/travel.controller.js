const TravelModel = require('./travel.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const TravelValidation = require('./travel.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { travelMessages } = require("../../../../utils/helpers/LanguageTranslate");

class TravelController {

    /**
    * Create travel
    *
    * @function createTravel
    * @memberof  TravelController
    * @param {*} req
    * @param {*} res
    * @returns {object} create list or error
    */
    async createTravel(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = TravelValidation.addTravel(req.body);
            if (error) return sendResponse(res, 404, null, translate(travelMessages, "2", language), error.details[0].message);

            let { employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description } = value;
            const travel = await TravelModel.addTravel(employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, organization_id);
            if (travel.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    travels: {
                        travel_id: travel.insertId || null,
                        ...value
                    },
                }, translate(travelMessages, "3", language), null);
            }
            return sendResponse(res, 400, null, translate(travelMessages, "4", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(travelMessages, "5", language), err);
        }
    }

    /**
    * Update travel
    *
    * @function updateTravel
    * @memberof  TravelController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateTravel(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = TravelValidation.updateTravel(req.body);
            if (error) return sendResponse(res, 404, null, translate(travelMessages, "2", language), error.details[0].message);

            let { travel_id, employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, status } = value;
            const travel = await TravelModel.updateTravel(travel_id, employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, status, organization_id);
            if (travel.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    travels: { ...value },
                }, translate(travelMessages, "6", language), null);
            }
            return sendResponse(res, 400, null, translate(travelMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(travelMessages, "8", language), err);
        }
    }

    /**
    * Update travel status
    *
    * @function updateTravelStatus
    * @memberof  TravelController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateTravelStatus(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { travel_id, status } = req.body;
            const travel = await TravelModel.updateTravelStatus(travel_id, status, organization_id);
            if (travel.affectedRows !== 0) return sendResponse(res, 200, {}, translate(travelMessages, "6", language), null);

            return sendResponse(res, 400, null, translate(travelMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(travelMessages, "8", language), err);
        }
    }

    /**
    * Get travel
    *
    * @function getTravel
    * @memberof  TravelController
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getTravel(req, res) {
        let { organization_id, language } = req.decoded;
        let { travel_id } = req.query;
        try {
            let travels = await TravelModel.getTravel(travel_id, organization_id);
            if (travels.length > 0) return sendResponse(res, 200, travels, translate(travelMessages, "9", language), null);

            return sendResponse(res, 400, null, translate(travelMessages, "10", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(travelMessages, "11", language), err);
        }
    }

    /**
    * Delete travel
    *
    * @function deleteTravel
    * @memberof  TravelController
    * @param {*} req
    * @param {*} res
    * @returns {object} deleted list or error
    */
    async deleteTravel(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { travel_id } = req.body;
            const travel = await TravelModel.checkTravelId(travel_id, organization_id);
            if (travel.length == 0) return sendResponse(res, 400, null, translate(travelMessages, "12", language), null);

            let travels = await TravelModel.deleteTravel(travel_id, organization_id);
            if (travels) return sendResponse(res, 200, [], translate(travelMessages, "13", language), null);

            return sendResponse(res, 400, null, translate(travelMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(travelMessages, "15", language), null);
        }
    }

}

module.exports = new TravelController;