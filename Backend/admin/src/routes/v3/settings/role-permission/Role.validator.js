const Joi = require('@hapi/joi');
const Common = require('../.../../../../../utils/helpers/Common');
class RoleValidator {
    addRole() {
        return Joi.object().keys({
            name: Joi.string().required().trim().max(250),
            permission_ids: Joi.array().items(Joi.number().integer().positive().required()).required()
        })
    }
    editRole() {
        return Joi.object().keys({
            name: Joi.string().trim().default(null).max(250).regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            role_id: Joi.number().integer().positive().required(),
            permission_ids: Joi.array().items(Joi.number().integer().positive()).default([]),
            location: Joi.array().items({
                location_id: Joi.number(),
                department_ids: Joi.array().items(Joi.number()).default([])
            }).default([]),
            department_ids: Joi.array().items(Joi.number()).default([]),
            loc_dept_edit: Joi.boolean().default(false).optional(),
            permission: Joi.object().default(null).optional(),
            type: Joi.number().integer().positive().allow('1', '2', 1, 2).default(1)
        })
    }
    deleteRole() {
        return Joi.object().keys({
            role_id: Joi.number().integer().positive().required()
        })
    }
    getRolePermissions() {
        return Joi.object().keys({
            role_id: Joi.number().integer().positive().required()
        })
    }

    //new
    addRoleByName() {
        return Joi.object().keys({
            name: Joi.string().required().trim().max(250).regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            location: Joi.array().items({
                location_id: Joi.number().allow('All'),
                department_ids: Joi.array().items(Joi.number()).default([])
            }).default([]),
            department_ids: Joi.array().items(Joi.number()).default([]),
            permission: Joi.object().default(null).optional()
        })
    }
    getRole() {
        return Joi.object().keys({
            role_id: Joi.number().integer().positive().optional().default(null),
            location_id: Joi.number().integer().positive().optional().default(null),
            skip: Joi.number().optional().default(0),
            limit: Joi.number().optional().default(1000),
            name: Joi.string().optional().default(null),
            sortOrder: Joi.string().optional().allow('A', 'D').default(null)
        })
    }
    addHRMSRole(){
        return Joi.object().keys({
            role_id: Joi.number().integer().positive().required(),
            permission_id: Joi.number().integer().positive().required(),
            status: Joi.number().valid('1', '2', 1, 2).required(),
        })
    }
}

module.exports = new RoleValidator;