const {Validation} = require('./Validation');
const {sendResponse} = require('../../../../utils/myService');
const actionsTracker = require('../../services/actionsTracker');
const {Model} = require('./Model');
const { organizationMessages } = require("../../../../utils/helpers/LanguageTranslate");


class Controller {
    static async search(req, res) {
        const {user_id, organization_id} = req.decoded;
        const language = req.decoded.language;

        const validation = Validation.search(req.query);

        if (validation.error) {
            return sendResponse(res, 422, null, organizationMessages.find(x => x.id === "2")[language] || organizationMessages.find(x => x.id === "2")["en"], validation.errorMessages);
        }
        const result = await Model.search({...validation.value, organization_id});
        actionsTracker(req, 'User ? search through application names (?).', [user_id, validation.value]);
        return sendResponse(res, 200, result, organizationMessages.find(x => x.id === "1")[language] || organizationMessages.find(x => x.id === "1")["en"], null);
    }

    static async create(req, res) {
        const {user_id, organization_id} = req.decoded;
        const language = req.decoded.language;

        const validation = Validation.upsert(req.body);
        if (validation.error) {
            return sendResponse(res, 422, null, organizationMessages.find(x => x.id === "2")[language] || organizationMessages.find(x => x.id === "2")["en"], validation.errorMessages);
        }
        const {name} = validation.value;
        const result = await Model.upsert({...validation.value, organization_id});
        actionsTracker(req, 'User %i application name "?" created.', [user_id, name]);
        return sendResponse(res, 200, result, organizationMessages.find(x => x.id === "3")[language] || organizationMessages.find(x => x.id === "3")["en"], null);
    }
}

module.exports.Controller = Controller;
