const Trello = require("trello");
const TrelloModel = require('./Trello.model');

class TrelloMiddleware {
    getIntegration(req, res, next) {
        // !REMOVE
        req = {
            decoded: {
                jsonData: {
                    admin_id: 1,
                    id: 1
                }
            }
        }

        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id;

        TrelloModel.getIntegration(`name = "Trello" AND status = 1`, (err, integration) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ success: false, error: err });
            }

            if (!integration || integration.length === 0) {
                return res.status(404).json({ success: false, error: 'Integration Not Found.' })
            }

            const filter = `
                integration_id = ${integration[0].id} AND
                admin_id = ${admin_id} AND
                manager_id = ${manager_id}
            `;

            TrelloModel.getIntegrationData(filter, (err, integrationData) => {
                if (err) {
                    console.error(err)
                    return res.status(500).json({ success: false, error: err });
                }

                if (!integrationData && integrationData.length === 0) {
                    return res.status(404).json({ success: false, error: 'Not Integrated With Trello.' })
                }

                res['integrationData'] = { ...integrationData[0], integration_creds_id: integrationData[0].id };
                next();
            })
        })
    }
}

module.exports = new TrelloMiddleware;