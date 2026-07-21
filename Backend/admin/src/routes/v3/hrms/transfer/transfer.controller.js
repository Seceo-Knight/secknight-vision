const TransferModel = require('./transfer.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { transferMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./transfer.validation');


class TransferController {

    /**
    * Get TransferDetails
    *
    * @function getTransferDetails
    * @memberof  TransferController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getTransferDetails(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let transfers = [];
            transfers = await TransferModel.fetchTransferList(organization_id)
            if (transfers.length > 0) return sendResponse(res, 200, transfers, translate(transferMessages, "5", language), null);

            return sendResponse(res, 400, null, "No transfers found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(transferMessages, "6", language), null);
        }
    }

    /**
    * Get TransferDetails by Id
    *
    * @function getTransferDetails
    * @memberof  TransferController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getTransferDetailsById(req, res) {
        let { organization_id, language } = req.decoded;
        let transfer_id = req.body.transfer_id;
        try {
            let transfers = [];
            transfers = await TransferModel.fetchTransferListById(transfer_id, organization_id)
            if (transfers.length > 0) return sendResponse(res, 200, transfers, translate(transferMessages, "5", language), null);

            return sendResponse(res, 400, null, "No transfers found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(transferMessages, "6", language), null);
        }
    }

    /**
    * Create TransferDetails
    *
    * @function getTransferDetails
    * @memberof  TransferController;
    * @param {*} req
    * @param {*} res
    * @returns {object} created list or error
    */
    async createTransfer(req, res) {
        let { organization_id, language } = req.decoded;
        let details = {};
        try {
            let { value, error } = joiValidation.addNewTransfer(req.body);
            if (error) return sendResponse(res, 404, null, translate(transferMessages, "2", language), error.details[0].message);

            let { employee_id, transfer_date, transfer_department, transfer_location, description } = value;
            details = { employee_id, transfer_date, transfer_department, transfer_location, description };
            const add_transfer = await TransferModel.addTransfer(employee_id, transfer_date, transfer_department, transfer_location, description, organization_id);
            if (add_transfer) {
                if (add_transfer.insertId) {
                    return sendResponse(res, 200, {
                        transfer: {
                            add_transfer: add_transfer.insertId || null
                        },
                    }, translate(transferMessages, "3", language), null);
                }

            }
            return sendResponse(res, 400, null, translate(transferMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(transferMessages, "8", language), err);
        }
    }

    /**
    * Update TransferDetails
    *
    * @function getTransferDetails
    * @memberof  TransferController;
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateTransfer(req, res) {
        const { language } = req.decoded;
        let details = {};
        let id = req.body.id;
        try {
            let { value, error } = joiValidation.updateTransfer(req.body);
            if (error) return sendResponse(res, 404, null, translate(resignationMessages, "2", language), error.details[0].message);

            let { id, employee_id, transfer_date, transfer_department, transfer_location, description } = value;
            details = { id, employee_id, transfer_date, transfer_department, transfer_location, description };
            const update_transfer = await TransferModel.updateTransfer(id, employee_id, transfer_date, transfer_department, transfer_location, description);
            if (update_transfer) {
                return sendResponse(res, 200, {
                    transfer: {
                        transfer_id: id
                    },
                }, translate(transferMessages, "12", language), null);
            }
            return sendResponse(res, 400, null, translate(transferMessages, "7", language), null);
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, translate(transferMessages, "8", language), err);
        }
    }

    /**
    * Delete TransferDetails
    *
    * @function deleteTransfer
    * @memberof  TransferController;
    * @param {*} req
    * @param {*} res
    * @returns {object} deleted list or error
    */
    async deleteTransfer(req, res) {
        let { language } = req.decoded;
        let id = req.decoded;
        let transfer_id = req.body.transfer_id;
        try {
            const delete_transfer = await TransferModel.deleteTransfer(transfer_id);
            if (delete_transfer) return sendResponse(res, 200, [], translate(transferMessages, "12", language), null);

            return sendResponse(res, 400, null, translate(transferMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(transferMessages, "7", language), null);
        }
    }

}

module.exports = new TransferController;