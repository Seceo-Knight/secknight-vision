"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const jwt = require('jsonwebtoken')
const jwtKey = process.env.SESSION_SECRET;
const jwtExpirySeconds = process.env.JWT_EXPIRY_SECONDS;

class JwtAuth {
    async createToken(jsonData, user_agent, cb) {
        try {
            const token = jwt.sign({
                jsonData,
                user_agent
            }, jwtKey, {
                algorithm: 'HS256',
                expiresIn: jwtExpirySeconds
            });
            cb(null, token);
        } catch (err) {
            cb(err, null);
        }
    }

    async createTokenData(jsonData, user_agent) {
        const token = jwt.sign({
            jsonData,
            user_agent
        }, jwtKey, {
            algorithm: 'HS256',
            expiresIn: jwtExpirySeconds
        });
        return token
    }

    async decryptToken(tokenData, user_agent, cb) {
        try {
            const payload = jwt.verify(tokenData, jwtKey)
            // cb(null, payload);
            if (payload && payload.user_agent == user_agent) {
                cb(null, payload);
            } else {
                cb({
                    err: 'Token is invalid',
                    msg: 'Either UserAgent or token not valid'
                }, null);
            }
        } catch (err) {
            cb(err, null);
        }
    }

}
module.exports = new JwtAuth;