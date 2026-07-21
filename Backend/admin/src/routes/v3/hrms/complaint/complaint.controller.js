const ComplaintModel = require('./complaint.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const ComplaintValidation = require('./complaint.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { complaintMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./complaint.validation');

class ComplaintController {

    /**
    * get complaints
    *
    * @function getComplaints
    * @memberof  ComplaintController;
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getComplaints(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let complaints = [];
            complaints = await ComplaintModel.fetchComplaintsList(organization_id)
            if (complaints.length > 0) return sendResponse(res, 200, complaints, translate(complaintMessages, "5", language), null);

            return sendResponse(res, 400, null, "No complaints found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(complaintMessages, "6", language), null);
        }
    }

    /**
   * Create complaints
   *
   * @function createComplaints
   * @memberof  ComplaintController;
   * @param {*} req
   * @param {*} res
   * @returns {object} requested list or error
   */
    async createComplaints(req, res) {
        let { organization_id, language } = req.decoded;
        let details = {};
        try {
            let { value, error } = joiValidation.addNewComplaints(req.body);
            if (error) return sendResponse(res, 404, null, translate(complaintMessages, "2", language), error.details[0].message);

            let { complaint_from, title, complaint_date, complaint_against, description, status, type } = value;
            details = { complaint_from, title, complaint_date, complaint_against, description, status, type };
            const add_complaints = await ComplaintModel.addComplaints(complaint_from, title, complaint_date, complaint_against, description, status, type, organization_id);
            if (add_complaints) {
                if (add_complaints.insertId) {
                    return sendResponse(res, 200, {
                        complaints: {
                            add_complaints: add_complaints.insertId || null
                        },
                    }, translate(complaintMessages, "3", language), null);
                }

            }
            return sendResponse(res, 400, null, translate(complaintMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(complaintMessages, "8", language), err);
        }
    }

    /**
  * Delete complaints
  *
  * @function deleteComplaints
  * @memberof  ComplaintController;
  * @param {*} req
  * @param {*} res
  * @returns {object} requested list or error
  */
    async deleteComplaints(req, res) {
        let { organization_id, language } = req.decoded;
        let complaint_id = req.body.complaint_id;
        try {
            const delete_complaint = await ComplaintModel.deleteComplaints(complaint_id, organization_id);
            if (delete_complaint) return sendResponse(res, 200, [], translate(complaintMessages, "14", language), null);

            return sendResponse(res, 400, null, translate(complaintMessages, "15", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(complaintMessages, "15", language), null);
        }
    }

}

module.exports = new ComplaintController;