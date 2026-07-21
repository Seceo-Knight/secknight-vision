/**
 * MyError - custom error to set code for a error
 * @author Akshay Dhood
 */
class MyError extends Error {
    constructor(code, message, defaultMsg = null) {
        super(message);
        this.name = 'MyError';
        this.code = code || 400;
        this.defaultMsg = defaultMsg
    }
}

/** Exports */
module.exports = MyError;