
class CommonError extends Error {
    /**
     * @constructor
     * @param {object} message
     */
    constructor({ name, message }) {
        super();
        this.name = name;
        this.message = message;
        this.code = 400;
    }
}

module.exports = CommonError;
