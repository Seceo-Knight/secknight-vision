const jwt = require('jsonwebtoken')

// const jwtKey = process.env.SESSION_SECRET;
// const jwtExpirySeconds = process.env.JWT_EXPIRY_SECONDS;

class JwtAuth {
    constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
        this.refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
        this.tokenLife = process.env.JWT_TOKEN_LIFE;
    }

    generateAccessToken(user) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                user,
                this.accessTokenSecret,
                { algorithm: 'HS256', expiresIn: this.tokenLife },
                (err, token) => {
                    if (err) reject(err);
                    else resolve(token);
                }
            );
        });
    }

    generateRefreshToken(user) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                user,
                this.refreshTokenSecret,
                { algorithm: 'HS256' },
                (err, token) => {
                    if (err) reject(err);
                    else resolve(token);
                }
            );
        });
    }

    verify(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.accessTokenSecret, (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        })
    }

}

module.exports = new JwtAuth;