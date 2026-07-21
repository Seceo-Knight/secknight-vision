const OAuth = require('oauth').OAuth;
const JiraModel = require('./Jira.model');

/**
 * @class JiraAuth
 */
class JiraAuth {
    /**
     * Creates an instance of JiraAuth.
     * @memberof JiraAuth
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
     * @memberof JiraAuth
     */
    async authenticate(req, res) {
        // Handle With Passport
        res.send('logging in with google')
    }

    /**
     * @param {*} req
     * @param {*} res
     * @memberof JiraAuth
     */
    callback(req, res) {
        // Handle With Passport
        console.log(req.query)
        res.send('check console')
    }
}

module.exports = new JiraAuth;