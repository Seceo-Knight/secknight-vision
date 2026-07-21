const Joi = require('@hapi/joi');
const { truncate } = require('lodash');
const Common = require('../../../../utils/helpers/Common')


class GroupValidation {
    static create() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).default([]),
            department_ids: Joi.array().items(Joi.number()).default([]),
            roles: Joi.array().items({
                role_id: Joi.number(),
                location: Joi.array().items({
                    location_id: Joi.number(),
                    department_ids: Joi.array().items(Joi.number()).default([])
                }).default([]),
                department_ids: Joi.array().items(Joi.number())
            }).default([]),
            location: Joi.array().items({
                location_id: Joi.number(),
                department_ids: Joi.array().items(Joi.number()).default([])
            }).default([]),
            name: Joi.string().max(32).required(),
            note: Joi.string().max(200).default(null).optional(),
        })
    }

    static createNewGroup() {
        return Joi.object().keys({
            data: Joi.array().items({
                role_id: Joi.number().default(null).allow(null),
                location_id: Joi.number().default(null).allow(null),
                department_id: Joi.number().default(null).allow(null),
                employee_ids: Joi.array().default(null).allow(null)
            }).optional().default(null),
            // name: Joi.string().max(32).required(),
            name: Joi.string().max(32).required().regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            note: Joi.string().max(200).default(null).optional().regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            overwrite: Joi.boolean().default(false),

        })
    }

    static listGroup() {
        return Joi.object().keys({
            skip: Joi.number().default(null).allow(null),
            limit: Joi.number().default(null).allow(null),
            group_id: Joi.number().positive().optional().default(null),
            sortOrder: Joi.string().allow(null).allow(""),
            name: Joi.string().allow(null).allow(""),
            sortColumn: Joi.string().allow(null).allow(""),
        })
    }

    static delete() {
        return Joi.object().keys({
            group_id: Joi.number().required(),
        })
    }

    static edit() {
        return Joi.object().keys({
            data: Joi.array().items({
                // role_id: Joi.number().default(null),
                // location_id: Joi.number().default(null),
                // department_id: Joi.number().default(null),
                // employee_ids:Joi.array().default(null)
                role_id: Joi.number().default(null).allow(null),
                location_id: Joi.number().default(null).allow(null),
                department_id: Joi.number().default(null).allow(null),
                employee_ids: Joi.array().default(null).allow(null)
            }).optional().default(null),
            name: Joi.string().max(32).required().regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            note: Joi.string().max(200).default(null).optional().regex(/[$\(\)<>]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            overwrite: Joi.boolean().default(false),
            group_id: Joi.number().required(),
        })
    }
    static empTrackingModeValidation() {
        return Joi.object().keys({
            trackingMode: Joi.string().valid('unlimited', 'fixed', 'networkBased', 'manual', 'projectBased'),
        });
    }
    static updateGroupCustomSetting() {
        return Joi.object().keys({
            group_id: Joi.number().positive().required(),
            settings: Joi.object().required()
        })
    }
}

module.exports.GroupValidation = GroupValidation;