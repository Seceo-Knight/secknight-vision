const OAuth = require('oauth').OAuth;
const TrelloModel = require('./Trello.model');

/**
 * @class TrelloAuth
 */
class TrelloAuth {
    /**
     * Creates an instance of TrelloAuth.
     * @memberof TrelloAuth
     * @see also {@link https://trello.com/app-key}
     * @see also {@link https://developers.trello.com/page/authorization}
     */
    constructor() {
        this.key = process.env.TRELLO_KEY;
        this.secret = process.env.TRELLO_OAUTH_SECRET;

        this.requestURL = "https://trello.com/1/OAuthGetRequestToken";
        this.accessURL = "https://trello.com/1/OAuthGetAccessToken";
        this.authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
        this.appName = "EMP Monitor";
        this.scope = ['read', 'write', 'account'];
        this.expiration = 'never';
        this.loginCallback = `${process.env.API_URL}/callback`;
        // this.loginCallback = `${process.env.API_URL}/api/v1/integrations/trello/auth/callback/`;
        this.oauth_secrets = {}

        this.oauth = new OAuth(
            this.requestURL,
            this.accessURL,
            this.key,
            this.secret,
            "1.0A",
            this.loginCallback,
            "HMAC-SHA1"
        );
    }

    /**
     * @param {*} req
     * @param {*} res
     * @memberof TrelloAuth
     */
    async authenticate(req, res) {
        TrelloModel.getIntegration(`name = "Trello" AND status = 1`, (err, integration) => {
            if (err) {
                return res.status(500).json({ success: false, error: err });
            }

            if (!integration || integration.length === 0) {
                return res.status(404).json({ success: false, error: 'Integration Not Found.' })
            }

            this.oauth.getOAuthRequestToken((err, token, tokenSecret, results) => {
                if (err) {
                    return res.status(500).json({ success: false, error: err });
                }

                this.oauth_secrets[token] = tokenSecret;
                res.json({ success: true, url: `${this.authorizeURL}?oauth_token=${token}&name=${this.appName}&scope=${this.scope}&expiration=${this.expiration}` })
                // res.redirect(`${this.authorizeURL}?oauth_token=${token}&name=${this.appName}&scope=${this.scope}&expiration=${this.expiration}`);
            });
        });
    }

    /**
     * @param {*} req
     * @param {*} res
     * @memberof TrelloAuth
     */
    callback(req, res) {
        const token = req.query.oauth_token;
        const tokenSecret = this.oauth_secrets[token];
        const verifier = req.query.oauth_verifier;

        console.log(token)
        console.log(tokenSecret)
        console.log(verifier)

        //! REMOVE
        // req = {
        //     decoded: {
        //         jsonData: {
        //             admin_id: 1,
        //             id: 1
        //         }
        //     }
        // }

        this.oauth.getOAuthAccessToken(token, tokenSecret, verifier, (err, accessToken, accessTokenSecret, results) => {
            if (err) {
                console.error('getOAuthAccessToken Error ', err);
                return res.status(500).json({ success: false, error: err });
            }
            // In a real app, the accessToken and accessTokenSecret should be stored
            const admin_id = req['decoded'].jsonData.admin_id;
            const manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;

            TrelloModel.getIntegration(`name = "Trello" AND status = 1`, (err, integration) => {
                if (err) {
                    console.error(err)
                    return res.status(500).json({ success: false, error: err });
                }

                if (!integration || integration.length === 0) {
                    return res.status(404).json({ success: false, error: 'Integration Not Found.' })
                }

                let filter = '';
                if (!manager_id) {
                    filter = `integration_id = ${integration[0].id} AND admin_id = ${admin_id}`;
                } else {
                    filter = `
                        integration_id = ${integration[0].id} AND
                        admin_id = ${admin_id} AND
                        manager_id = ${manager_id}
                    `;
                }

                TrelloModel.getIntegrationData(filter, (err, integrationData) => {
                    if (err) {
                        console.error(err)
                        return res.status(500).json({ success: false, error: err });
                    }

                    this.oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, (err, data, response) => {
                        if (err) {
                            console.error(err)
                            return res.status(500).json({ success: false, error: err });
                        }

                        // Now we can respond with data to show that we have access to your Trello account via OAuth
                        data = JSON.parse(data);
                        if (integrationData && integrationData.length > 0) {
                            // Update
                            const update = `
                                    access_token = "${accessToken}",
                                    access_token_secret = "${accessTokenSecret}"
                                `;
                            TrelloModel.updateIntegrationData(update, `id = ${integrationData[0].id}`, (err, results) => {
                                if (err) {
                                    console.error(err)
                                    return res.status(500).json({ success: false, error: err });
                                }
                                res.json({ accessToken, accessTokenSecret, data });
                            });
                        } else {
                            // Insert
                            const values = `(${integration[0].id}, ${admin_id}, ${manager_id}, "Trello-${data.id}", "${accessToken}", "${accessTokenSecret}", "${data.id}", 1)`;
                            TrelloModel.insertIntegrationData(values, (err, results) => {
                                if (err) {
                                    console.error(err)
                                    return res.status(500).json({ success: false, error: err });
                                }
                                res.json({ success: true });
                                // res.json({ accessToken, accessTokenSecret, data });
                            });
                        }
                    });
                });
            });
        });
    }
}

module.exports = new TrelloAuth;