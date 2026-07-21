
const Joi = require('joi');
const Common = require('../../../utils/helpers/Common')

class DepartmentValidation {

    validationCreateDepartments(name) {
        const schema = Joi.object().keys({
            name: Joi.string().required().max(50).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
        });
        var result = Joi.validate({
            name,

        }, schema);
        return result;
    };

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

    validateionUpdateDepartment(name, department_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.errorMessage(errors)
            }),
            department_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            name,
            department_id
        }, schema);
        return result;
    }

    validateDeleteDept(department_id) {
        const schema = Joi.object().keys({
            department_id: Joi.number().positive().integer().required(),
        });
        var result = Joi.validate({
            department_id
        }, schema);
        return result;
    }

}
module.exports = new DepartmentValidation;