// const Joi = require('@hapi/joi');
const Joi = require('joi');
const Common = require('../../../utils/helpers/Common');

class LocationValidation {


  addNewDeptToLocationName(location, deptId, department_name, timezone) {
    let dept_ids = deptId ? deptId.split(",") : [];
    const schema = Joi.object().keys({
      dept_ids: Joi.array().items(Joi.number().allow("")),
      location: Joi.string().required().max(50).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
      }),
      short_name: Joi.string().allow(""),
      department_name: Joi.array().items(Joi.string().allow("").max(50).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiArrayStringErrorMessage(errors);
      })),
      timezone: Joi.string().allow(null).allow("").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
      }),
      timezone_offset: Joi.number().allow(null).allow(""),
    });
    var result = Joi.validate({
      location, dept_ids, department_name, timezone

    }, schema);
    return result;
  }


  updateLocation(name, location_id, timezone) {
    const schema = Joi.object().keys({
      name: Joi.string().allow(null).allow("").max(50).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
      }),
      location_id: Joi.number().integer().required(),
      timezone: Joi.string().allow(null).allow("").max(225).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
      }),
    });
    var result = Joi.validate({
      name,
      location_id,
      timezone

    }, schema);
    return result;
  }

  locationId(id) {
    const schema = Joi.object().keys({
      id: Joi.number().allow(""),
    });
    var result = Joi.validate({
      id
    }, schema);
    return result;
  }


  validateAddDepartmentToLocation(department_ids, location_id, department_name,) {
    const schema = Joi.object().keys({
      department_ids: Joi.array().items(Joi.number()),
      location_id: Joi.number().required(),
      department_name: Joi.array().items(Joi.string().allow("").max(50).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiArrayStringErrorMessage(errors);
      })),
    });
    var result = Joi.validate({
      department_ids,
      location_id,
      department_name
    }, schema);
    return result;
  }


  deptLocation(location_id, department_id) {
    department_id = department_id ? department_id.split(",") : [];
    const schema = Joi.object().keys({
      location_id: Joi.number().integer().required(),
      department_id: Joi.array().items(Joi.number()).min(1).error(() => 'Aleast One Department Id Is Required'),
    });
    var result = Joi.validate({
      location_id,
      department_id
    }, schema);
    return result;
  }

  skipAndLimit(skip, limit) {
    const schema = Joi.object().keys({
      skip: Joi.number().integer().allow(""),
      limit: Joi.number().integer().allow(""),
    });
    var result = Joi.validate({
      skip,
      limit
    }, schema);
    return result;
  }

  getGeoLocation(employee_id) {
    const schema = Joi.object().keys({
      employee_id: Joi.number().required(),
    });
    var result = Joi.validate({
        employee_id
    }, schema);
    return result;
  }
}

module.exports = new LocationValidation;

// location_name,timezone,department_name,department_ids{}
