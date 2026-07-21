const jwt = require('jsonwebtoken');

const Crypto = require('../helpers/PasswordEncoderDecoder');

class JwtAuth {
    constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
        this.accessTokenSecret_Sherii = process.env.JWT_SECRET;
        this.refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
        this.tokenLife = process.env.JWT_TOKEN_LIFE;
    }

    generateRefreshToken(user, userAgent) {
        return new Promise((resolve, reject) => {
            const encryptedUserData = Crypto.encrypt(JSON.stringify(user), process.env.CRYPTO_PASSWORD);

            if (encryptedUserData.error) {
                return reject(encryptedUserData.error);
            }

            jwt.sign(
                {
                    signature: encryptedUserData.encoded,
                    userAgent: userAgent
                },
                this.accessTokenSecret,
                { algorithm: 'HS256' },
                (err, token) => {
                    if (err) reject(err);
                    else {
                        const encryptedToken = Crypto.encrypt(token, process.env.CRYPTO_PASSWORD);
                        if (encryptedToken.error) {
                            return reject(encryptedToken.error);
                        }
                        resolve(encryptedToken.encoded);
                    }
                }
            );
        });
    }

    generateRefreshToken_Sherii(user) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                user,
                this.accessTokenSecret_Sherii,
                { algorithm: 'HS256' },
                (err, token) => {
                    if (err) reject(err);
                    else {
                        resolve(token);
                    }
                });
        });
    }

    // verify(token) {
    //     return new Promise((resolve, reject) => {
    //         jwt.verify(token, this.accessTokenSecret, (err, user) => {
    //             if (err) reject(err);
    //             else resolve(user);
    //         });
    //     })
    // }

    /**
     * 1. Encrypt the JSON of the user  (but encryption function only accepts String)
     *      - So parse JSON as string using JSON.stringify
     * 2. Generate Token using JWT.sign (key and expiry present in /config/token file)
     * 3. Again Encrpyt the token data :-p
     * 
     * Here we will encode the user-agent so the the token is valid for a particular user-agent only.
     * 
     * @param {Object} user
     * @param {String} userAgent
     */
    generateAccessToken(user, userAgent) {
        return new Promise((resolve, reject) => {
            const encryptedUserData = Crypto.encrypt(JSON.stringify(user), process.env.CRYPTO_PASSWORD);

            if (encryptedUserData.error) {
                return reject(encryptedUserData.error);
            }

            jwt.sign(
                {
                    signature: encryptedUserData.encoded,
                    userAgent: userAgent
                },
                this.accessTokenSecret,
                {
                    algorithm: 'HS256',
                    expiresIn: this.tokenLife
                },
                (err, token) => {
                    if (err) reject(err);
                    else {
                        const encryptedToken = Crypto.encrypt(token, process.env.CRYPTO_PASSWORD);
                        if (encryptedToken.error) {
                            return reject(encryptedToken.error);
                        }
                        resolve(encryptedToken.encoded);
                    }
                }
            );
        });
    }

    generateAccessToken_Sherii(user) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                user,
                this.accessTokenSecret_Sherii,
                { algorithm: 'HS256', expiresIn: this.tokenLife },
                (err, token) => {
                    if (err) reject(err);
                    else {
                        resolve(token);
                    }
                });
        });
    }

    /**
     * 1. Decrypt the encrypted token string of the user  (basically in authetication Middleware)
     * 2. Decode Token using JWT.verify (key present in /config/token file)
     * 3. Again Dencrpyt the decoded token data :-p
     *      - parse string as JSON using JSON.parse
     * Here we are also checking if the token is generated using the same user-agent from whic it is being accessed or not
     * 
     * @param {*} token
     * @param {*} header
     * @memberof JwtAuth
     */
    verify(token, userAgent) {
        return new Promise((resolve, reject) => {
            const decryptedToken = Crypto.decrypt(token, process.env.CRYPTO_PASSWORD);

            if (decryptedToken.error) {
                return reject(decryptedToken.error);
            }
            token = decryptedToken.decoded;

            jwt.verify(token, this.accessTokenSecret, (err, decoded) => {
                if (err) reject(err);
                else {
                    // if (decoded.signature && decoded.userAgent == userAgent) {
                    if (decoded.signature) {
                        const decryptedSignature = Crypto.decrypt(decoded.signature, process.env.CRYPTO_PASSWORD);
                        if (decryptedSignature.error) {
                            return reject(decryptedSignature.error);
                        }
                        resolve(decryptedSignature.decoded);
                    } else {
                        reject({ name: 'AuthorizationError', message: `Invalid Token` });
                    }
                }
            });
        })
    }

    verifyNew(token, userAgent) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.accessTokenSecret_Sherii, (err, decoded) => {
                if (err) reject(err);
                else {
                    if (decoded) {
                        resolve(decoded);
                    } else {
                        reject({ name: 'AuthorizationError', message: `Invalid Token` });
                    }
                }
            });
        });
    }

}

module.exports = new JwtAuth;