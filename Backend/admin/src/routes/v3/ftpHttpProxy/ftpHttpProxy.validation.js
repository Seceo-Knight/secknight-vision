const Joi = require('joi');

class FtpHttpProxyValidation {
  validateQuery(query) {
    const schema = Joi.object().keys({
      store: Joi.string().required(),
      path: Joi.string().required(),
    });

    return new Promise((resolve, reject) => {
      const { value, error } = Joi.validate(query, schema);
      if (error) reject(error);

      return resolve(value);
    });
  }
}

module.exports = new FtpHttpProxyValidation();
