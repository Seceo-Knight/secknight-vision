'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const crypto = require("crypto");

/**
 * EncoderDecoder class
 * 
 * This class only function is to encode/encrypt and decode/decrypt
 * any json object or string
 * 
 * There are 2 types of method in this
 * 1. basic encryption/decryption using buffer (encodeBasic/decodeBasic functions)
 * 2. complex encryption/decryption mechanism using crypto (encodeCrypto/decodeCrypto functions)
 */
class EncoderDecoder {
    encodeBasic(data) {
        if (data) return Buffer.from(JSON.stringify(data)).toString('base64');
        else return null;
    }

    decodeBasic(encodedText) {
        if (encodedText) return JSON.parse(Buffer.from(encodedText, 'base64').toString());
        else return null;
    }

    encodeCrypto(data) {
        return new Promise((resolve, reject) => {
            try {
                const cipher = crypto.createCipher('aes-256-cbc', process.env.CRYPTO_PASSWORD);
                let encrypted = cipher.update(JSON.stringify(data), "utf8", 'hex');
                encrypted += cipher.final('hex');
                resolve({ message: "Encrypted", error: null, data: encrypted });
            } catch (exception) {
                reject({ message: exception.message, error: exception, data: null });
            }
        });
    }

    decodeCrypto(encodedText) {
        return new Promise((resolve, reject) => {
            try {
                const decipher = crypto.createDecipher('aes-256-cbc', process.env.CRYPTO_PASSWORD);
                let decrypted = decipher.update(encodedText, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                resolve({ message: "Decrypted", error: null, data: JSON.parse(decrypted) });
            } catch (exception) {
                reject({ message: exception.message, error: exception, data: null });
            }
        });
    }
}

module.exports = EncoderDecoder;