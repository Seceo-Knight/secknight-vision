const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class LocationValidation {

  getLocation(params) {
    const schema = Joi.object().keys({
      location_id: Joi.number().allow(null, ""),
      company_id: Joi.number().allow(null, ""),
    });
    return Joi.validate(params, schema);
  }

  addNewLocation(params) {
    const schema = Joi.object().keys({
      location: Joi.string().required().max(50),
      timezone: Joi.string().allow(null).allow("").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
      }),
      location_head_id: Joi.number().required(),
      location_hr_id: Joi.number().required(),
      email: Joi.string().required().max(50),
      phone: Joi.string().required().max(50),
      fax: Joi.string().required().max(50),
      address_one: Joi.string().required().max(50),
      address_two: Joi.string().allow(null, "").max(50),
      city: Joi.string().required().max(50),
      state: Joi.string().required().max(50),
      country: Joi.string().required().max(50),
      zip: Joi.string().required().max(50)
    });
    return Joi.validate(params, schema);
  }

  updateLocation(params) {
    const schema = Joi.object().keys({
      location_id: Joi.string().required().max(50),
      location: Joi.string().required().max(50),
      timezone: Joi.string().allow(null).allow("").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
      }),
      location_head_id: Joi.number().required(),
      location_hr_id: Joi.number().required(),
      email: Joi.string().required().max(50),
      phone: Joi.string().required().max(50),
      fax: Joi.string().required().max(50),
      address_one: Joi.string().required().max(50),
      address_two: Joi.string().allow(null, "").max(50),
      city: Joi.string().required().max(50),
      state: Joi.string().required().max(50),
      country: Joi.string().required().max(50),
      zip: Joi.string().required().max(50)
    });
    return Joi.validate(params, schema);
  }
}

module.exports = new LocationValidation;
