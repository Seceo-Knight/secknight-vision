'use strict';

const crypto = require("crypto");

/**
 * PasswordEncoderDecoder class
 * Encoder function Encrypt password using security key and aes-256-cbc alogorithm.
 * Decoder function Decrypt password by using security key
 */
class PasswordEncoderDecoder {

    /**
     * Encrypts Password using Securities Key and aes-256-cbc Alogorithm.
     *
     * @param {String} text to be encrypted.
     * @param {String} key Securities Key.
     * @returns {Object} - error and encoded value.
     * @default error
     * @memberof PasswordEncoderDecoder
     */
    encrypt(text, key) {
        const IV_LENGTH = 16 // For AES, this is always 16
        let iv = crypto.randomBytes(IV_LENGTH)
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
        let encrypted = cipher.update(text)

        encrypted = Buffer.concat([encrypted, cipher.final()])
        let encoded = iv.toString('hex') + ':' + encrypted.toString('hex');

        return encoded
    }

    /**
     * Decrypts password using security key.
     *
     * @param {String} text to be decrypted.
     * @param {String} key Securities Key.
     * @returns {Object} - error and decoded value.
     * @default error
     * @memberof PasswordEncoderDecoder
     */
    decrypt(text, key) {
        let textParts = text.split(':')
        let iv = Buffer.from(textParts.shift(), 'hex')
        let encryptedText = Buffer.from(textParts.join(':'), 'hex')
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
        let decrypted = decipher.update(encryptedText)

        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString()
    }
}

module.exports = new PasswordEncoderDecoder;