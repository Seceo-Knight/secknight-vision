const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class DepartmentValidation {

    addDepartment(params) {
        const schema = Joi.object().keys({
            department_name: Joi.string().required().max(50),
            location_id: Joi.string().required().max(50),
            department_head_id: Joi.string().required().max(50),
        });
        return Joi.validate(params, schema);
    }

    updateDepartment(params) {
        const schema = Joi.object().keys({
            department_id: Joi.string().required().max(50),
            department_name: Joi.string().required().max(50),
            location_id: Joi.string().required().max(50),
            department_head_id: Joi.string().required().max(50),
        });
        return Joi.validate(params, schema);
    }

    getDepartments({ department_id, company_id }) {
        const schema = Joi.object().keys({
            department_id: Joi.integer().allow(null, "").max(50),
        });
        return Joi.validate({ department_id, company_id }, schema);
    }
}

module.exports = new DepartmentValidation;