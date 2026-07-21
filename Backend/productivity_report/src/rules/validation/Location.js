const Joi = require('joi');

class Location {

    /** location id department id validation for add dept to location */
    deptLocation(location_id, department_id) {
        const schema = Joi.object().keys({
            location_id: Joi.number().integer().required(),
            department_id: Joi.number().integer().required(),

        });
        var result = Joi.validate({
            location_id,
            department_id
        }, schema);
        return result;
    }

    /** location id department id validation for add dept to location */
    deptDelLocation(department_ids, department_name, short_name) {
        const schema = Joi.object().keys({
            department_ids: Joi.array().items(Joi.object().keys({
                location_id: Joi.number().integer().required(),
                department_id: Joi.number().integer().allow(""),
            })),
            department_name: Joi.string().allow(""),
            short_name: Joi.string().allow(""),
        });
        var result = Joi.validate({
            department_ids,
            department_name,
            short_name
        }, schema);
        return result;
    }

    /**location name and short_name validation */
    addLocation(data) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            short_name: Joi.string(),
            timezone: Joi.string(),
            timezone_offset: Joi.number()
        });
        return Joi.validate(data, schema);
    }

    /**Skip and limit validation  */
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
    /**Location Id validation  */
    locationId(id) {
        const schema = Joi.object().keys({
            id: Joi.number().allow(""),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }
    /**Validation for Updation loaction */
    updateLocation(name, short_name, location_id, timezone, timezone_offset) {
        const schema = Joi.object().keys({
            name: Joi.string().allow(null).allow(""),
            short_name: Joi.string().allow(null).allow(""),
            location_id: Joi.number().integer().required(),
            timezone: Joi.string().allow(null).allow(""),
            timezone_offset: Joi.number().allow(null).allow("")
        });
        var result = Joi.validate({
            name,
            short_name,
            location_id,
            timezone,
            timezone_offset
        }, schema);
        return result;
    }

    addDeptToLocationName(location, short_name, department_name, dept_short_name) {
        const schema = Joi.object().keys({
            department_id: Joi.number().integer().required(),
            location: Joi.string().required(),
            short_name: Joi.string().required(),
            dept_short_name: Joi.string().required(),
            department_name: Joi.string().required(),

        });
        var result = Joi.validate({
            location,
            short_name,
            department_name,
            dept_short_name
        }, schema);
        return result;
    }
    /**validation for addin new location with new department */
    /**   addNewDeptToLocationName(location, deptId, short_name, department_name, dept_short_name) {
          const schema = Joi.object().keys({
              deptId: Joi.number().integer().required(),
              location: Joi.string().required(),
              short_name: Joi.string().required(),
              department_name: Joi.string().required(),
              dept_short_name: Joi.string().required(),
          });
          var result = Joi.validate({ location, deptId, short_name, department_name, dept_short_name }, schema);
          return result;
      }*/

    addNewDeptToLocationName(location, deptId, short_name, department_name, timezone, timezone_offset) {
        let dept_ids = deptId ? deptId.split(",") : [];
        const schema = Joi.object().keys({
            dept_ids: Joi.array().items(Joi.number().allow("")),
            location: Joi.string().required(),
            short_name: Joi.string().allow(""),
            department_name: Joi.array().items(Joi.string().allow("")),
            timezone: Joi.string().allow(null).allow(""),
            timezone_offset: Joi.number().allow(null).allow("")
        });
        var result = Joi.validate({
            location,
            dept_ids,
            short_name,
            department_name,
            timezone,
            timezone_offset
        }, schema);
        return result;
    }
    // user_ids: Joi.array().items(Joi.number()).min(1),
    addDeptIdToLocationName(location, deptId, short_name) {
        const schema = Joi.object().keys({
            deptId: Joi.number().integer().required(),
            location: Joi.string().required(),
            short_name: Joi.string().required(),
        });
        var result = Joi.validate({
            location,
            deptId,
            short_name
        }, schema);
        return result;
    }

    /**Validation for departments */

    /** validation for create departments */
    validationCreateDepartments(name, short_name) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            short_name: Joi.string().allow(""),
        });
        var result = Joi.validate({
            name,
            short_name
        }, schema);
        return result;
    }

    /**Validation for update department */
    validateionUpdateDepartment(name, short_name, department_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            short_name: Joi.string().allow(""),
            department_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            name,
            short_name,
            department_id
        }, schema);
        return result;
    }

    /**detee department */
    validateDeleteDept(department_id) {
        const schema = Joi.object().keys({

            department_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            department_id
        }, schema);
        return result;
    }

    validateAddDepartmentToLocation(department_ids, location_id, department_name, short_name) {
        const schema = Joi.object().keys({
            department_ids: Joi.array().items(Joi.number()),
            location_id: Joi.number().required(),
            department_name: Joi.array().items(Joi.string().allow("")),
            short_name: Joi.string().allow("")
        });
        var result = Joi.validate({
            department_ids,
            location_id,
            department_name,
            short_name
        }, schema);
        return result;
    }
}

module.exports = new Location();