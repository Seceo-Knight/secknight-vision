'use strict';

const crypto = require("crypto");

/**
 * PasswordEncoderDecoder class
 * 
 * Encoder function encript password by using security key and using aes-256-cbc alogoritham
 * 
 * Decoder function decript password by using security key
 * 
 * */
class PasswordEncoderDecoder {
    encrypt(text, key, cb) {
        try {
            const IV_LENGTH = 16 // For AES, this is always 16
            let iv = crypto.randomBytes(IV_LENGTH)
            let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
            let encrypted = cipher.update(text)
            encrypted = Buffer.concat([encrypted, cipher.final()])
            let encoded = iv.toString('hex') + ':' + encrypted.toString('hex');
            cb(null, encoded);
        } catch (err) {

            cb(err, null);
        }
    }

    decrypt(text, key, cb) {
        try {
            let textParts = text.split(':')
            let iv = Buffer.from(textParts.shift(), 'hex')
            let encryptedText = Buffer.from(textParts.join(':'), 'hex')
            let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
            let decrypted = decipher.update(encryptedText)

            decrypted = Buffer.concat([decrypted, decipher.final()])
            let final = decrypted.toString()
            cb(null, final)
        } catch (err) {
            cb(err, null);
        }
    }

    encryptText(text, key) {
        const IV_LENGTH = 16 // For AES, this is always 16
        let iv = crypto.randomBytes(IV_LENGTH)
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
        let encrypted = cipher.update(text)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        let encoded = iv.toString('hex') + ':' + encrypted.toString('hex');
        return encoded;
    }

    decryptText(text, key) {
        let textParts = text.split(':')
        let iv = Buffer.from(textParts.shift(), 'hex')
        let encryptedText = Buffer.from(textParts.join(':'), 'hex')
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
        let decrypted = decipher.update(encryptedText)

        decrypted = Buffer.concat([decrypted, decipher.final()])
        let final = decrypted.toString()
        return final;
    }

    /**
    * Password encryption.
    *
    * @function passwordEncrypt
    * @memberof PasswordEncoderDecoder
    * @param {Sting} text
    * @returns {String} - Encrypted text .
    */
    passwordEncrypt(text) {
        var encryptor = crypto.createCipheriv('AES-256-CBC', process.env.CRYPTO_PASSWORD, process.env.CRYPTO_PASSWORD.substr(0, 16));
        return encryptor.update(text, 'utf8', 'base64') + encryptor.final('base64');
    }

    /**
    * Password Decryption.
    *
    * @function passwordDecrypt
    * @memberof PasswordEncoderDecoder
    * @param {Sting} encryptedText
    * @returns {String} - decrypted text .
    */
    passwordDecrypt(encryptedText) {
        var decryptor = crypto.createDecipheriv('AES-256-CBC', process.env.CRYPTO_PASSWORD, process.env.CRYPTO_PASSWORD.substr(0, 16));
        return decryptor.update(encryptedText, 'base64', 'utf8') + decryptor.final('utf8');
    };
}

module.exports = new PasswordEncoderDecoder;