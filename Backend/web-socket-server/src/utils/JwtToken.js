const jwt = require('jsonwebtoken');
const jwtKey = process.env.JWT_ACCESS_TOKEN_SECRET;
class JwtToken {
    static async create(data, jwtExpirySeconds = process.env.JWT_EXPIRY_SECONDS) {
        return jwt.sign(
            {
                payload: data,
                expiresIn: jwtExpirySeconds,
            },
            jwtKey, {
            algorithm: 'HS256',
            expiresIn: jwtExpirySeconds
        });
    }
    static async decrypt(token) {
        const { payload } = await jwt.verify(token, jwtKey);
        return payload;
    }
}
module.exports.JwtToken = JwtToken;