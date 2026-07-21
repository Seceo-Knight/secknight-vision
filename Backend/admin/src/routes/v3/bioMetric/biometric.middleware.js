const sendResponse = require('../../../utils/myService').sendResponse;
const jwt = require('jsonwebtoken');

class BioMiddlewareService {
    async authenticate(req, res, next) {
        try {

            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.split(' ')[1];
            if (!accessToken) return sendResponse(res, 401, null, 'access token required')

            jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET, async (_error, userData) => {
                if (userData != null) {
                    req.decoded = userData;
                    next();

                } else {
                    return sendResponse(res, 401, null, 'Invalid access token....')
                }
            });
        } catch (e) {
            return sendResponse(res, 401, null, 'Invalid access token....')
        }
    }
}


module.exports = new BioMiddlewareService();
