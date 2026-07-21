const stdOptions = {
  code: 400,
  name: 'InvalidStorageData',
  message: 'Please check your storage',
}

const expiredOptions = {
  code: 403,
  name: 'ExpiredLink',
  message: 'This link is expired!',
}

class InvalidStorageError extends Error {
  /**
   * @constructor
   * @param {object} message
   */
  constructor({ name, message, code }) {
    super();
    this.name = name;
    this.message = message;
    this.code = code;
  }

  static getOptions(condition) {
    return condition ? expiredOptions : stdOptions;
  }
}

module.exports = InvalidStorageError;

