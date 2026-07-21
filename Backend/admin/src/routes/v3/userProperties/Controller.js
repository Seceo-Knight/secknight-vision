const { UserPropertiesModel } = require('./UserPropertiesModel');
const { Validation } = require('./Validation');
const { sendResponse } = require('../../../utils/myService');
const actionsTracker = require('../services/actionsTracker');
const Firebase = require('../../../messages/Firebase');
const { userPropMessages } = require('../../../utils/helpers/LanguageTranslate');

const checkFirebaseToken = async (user_id, properties) => {
    for (const property of properties) {
        if (property.name === 'firebaseToken') {
            const { firebaseToken } = await UserPropertiesModel.get(user_id, ['firebaseToken']);
            const result = await Firebase.Firebase.sendMessage(
                [property.value],
                `You're successfully subscribed to EmpMonitor notifications.`,
            ).catch(() => {
                throw new Error('Firebase token invalid.');
            });
            if (result.failure) {
                throw new Error('Firebase token invalid.');
            }
        }
    }
};

class Controller {
    static async set(req, res) {
        const { user_id, language } = req.decoded;
        const validation = Validation.set(req.body);

        if (validation.error) {
            return sendResponse(res, 422, null, userPropMessages.find(x => x.id === "2")[language] || userPropMessages.find(x => x.id === "2")["en"], validation.errorMessages);
        }
        const { properties } = validation.value;

        try {
            await checkFirebaseToken(user_id, properties);
        } catch (e) {
            return sendResponse(res, 422, null, userPropMessages.find(x => x.id === "2")[language] || userPropMessages.find(x => x.id === "2")["en"], e.message);
        }

        await UserPropertiesModel.set(user_id, properties);
        actionsTracker(
            req,
            'User ? properties values (?) set.',
            [user_id, properties.map(property => property.name)],
        );
        return sendResponse(res, 200, { properties }, userPropMessages.find(x => x.id === "3")[language] || userPropMessages.find(x => x.id === "3")["en"], null);
    }

    static async get(req, res) {
        const { user_id, language } = req.decoded;
        const validation = Validation.get(req.query);
        if (validation.error) {
            return sendResponse(res, 422, null, userPropMessages.find(x => x.id === "2")[language] || userPropMessages.find(x => x.id === "2")["en"], validation.errorMessages);
        }
        const { names } = validation.value;
        const properties = await UserPropertiesModel.get(user_id, names);
        actionsTracker(req, 'User %i properties requested.', [user_id]);
        return sendResponse(res, 200, { properties }, userPropMessages.find(x => x.id === "4")[language] || userPropMessages.find(x => x.id === "4")["en"], null);
    }

    static async delete(req, res) {
        const { user_id, language } = req.decoded;
        const validation = Validation.get(req.body);
        if (validation.error) {
            return sendResponse(res, 422, null, userPropMessages.find(x => x.id === "2")[language] || userPropMessages.find(x => x.id === "2")["en"], validation.errorMessages);
        }
        const { names } = validation.value;
        const result = await UserPropertiesModel.delete(user_id, names);
        actionsTracker(req, 'User %i properties (?) deleted.', [user_id, names]);
        return sendResponse(res, 200, { deletedTotal: result.affectedRows }, userPropMessages.find(x => x.id === "5")[language] || userPropMessages.find(x => x.id === "5")["en"], null);
    }
}

module.exports.Controller = Controller;
