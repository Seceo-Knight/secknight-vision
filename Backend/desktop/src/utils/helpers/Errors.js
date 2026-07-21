'use strict';

/**
 * @class ValidationError
 * @extends {Error}
 */
class ValidationError extends Error {
    /**
     *Creates an instance of ValidationError.
     * @param {String} message
     * @memberof ValidationError
     */
    constructor(message) {
        super(message)
        this.name = 'ValidationError'
        this.message = message
    }
}

/**
 * @class PermissionError
 * @extends {Error}
 */
class PermissionError extends Error {
    /**
     *Creates an instance of PermissionError.
     * @param {String} message
     * @memberof PermissionError
     */
    constructor(message) {
        super(message)
        this.name = 'PermissionError'
        this.message = message
    }
}

/**
 * @class DatabaseError
 * @extends {Error}
 */
class DatabaseError extends Error {
    /**
     *Creates an instance of DatabaseError.
     * @param {String} message
     * @memberof DatabaseError
     */
    constructor(message) {
        super(message)
        this.name = 'DatabaseError'
        this.message = message
    }

    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                stacktrace: this.stack
            }
        }
    }
}

module.exports = {
    ValidationError,
    PermissionError,
    DatabaseError
}