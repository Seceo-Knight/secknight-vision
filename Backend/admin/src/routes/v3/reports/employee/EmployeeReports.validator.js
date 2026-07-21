const Joi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common');

class EmployeeReportsValidator {
    getEmployeeReport() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One User Must Required !'),
            from_date: Joi.date().required().error(() => 'Starting Date Required !'),
            to_date: Joi.date().required().error(() => 'Ending Date Required !')
        });
    }

    downloadEmployeeReport() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).default([]),
            download_option: Joi.number().integer().positive().min(1).max(3).required(),
            startDate: Common.dateValidator('from_date').required(),
            endDate: Common.dateValidator('to_date').required(),
            location_id: Joi.number().positive().default(null),
            department_ids: Joi.string().default(null),
            selected_columns: Joi.array().items(Joi.string()).default([]),
            role_id: Joi.number().positive().default(null),
            nonAdminId: Joi.number().optional(),
            searchKeyword: Joi.string().allow(null)
        })
    }

    downloadEmployeeReportCustom(hasMergedReport) {
        return Joi.object().keys({
            date: Joi.string().regex(/^\d{4}[./-]\d{2}[./-]\d{2}$/).required(),
            startTime: Joi.string().required(),
            endTime: Joi.string().required(),
        })
    }

    downloadEmployeeReportNew() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).default([]),
            download_option: Joi.number().integer().positive().min(1).max(3).required(),
            startDate: Common.dateValidator('from_date').required(),
            endDate: Common.dateValidator('to_date').required(),
            location_id: Joi.number().positive().default(null),
            department_ids: Joi.string().default(null),
            role_id: Joi.number().positive().default(null),
            skip:Joi.number().positive().optional(),
            limit:Joi.number().positive().max(150).optional(),
        })
    }

    requestAppWebUsage() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).default([]),
            page: Joi.number().positive().optional().default(1),
            skip: Joi.number().optional().default(0),
            limit: Joi.number().optional(),
            request_option: Joi.number().integer().positive().optional(),
            location_ids: Joi.array().items(Joi.number()).default([]),
            department_ids: Joi.array().items(Joi.number()).default([]),
            startDate: Common.dateValidator('from_date').required(),
            endDate: Common.dateValidator('to_date').required(),
            sortOrder: Joi.string().optional(),
            sortColumn: Joi.string().optional(),
            search: Joi.string().optional(),
            nonAdminId: Joi.number().optional(),
        })
    }

    getDepartmentRules() {
        return Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number()).default([]),
            location_ids: Joi.array().items(Joi.number()).default([]),
            department_ids: Joi.array().items(Joi.number()).default([]),
            startDate: Common.dateValidator('from_date').required(),
            endDate: Common.dateValidator('to_date').required(),
            application_id: Joi.string().required(),
            sortOrder: Joi.string().optional(),
            sortColumn: Joi.string().optional(),
            skip: Joi.number().optional().default(0),
            limit: Joi.number().optional(),
            search: Joi.string().optional().allow(""),
            nonAdminId: Joi.number(),
        })
    }

    requestAppWebCumulativeUsage() {
        return Joi.object().keys({
            employee_ids: Joi.string().optional().allow(""),
            location_ids: Joi.string().optional().allow(""),
            department_ids: Joi.string().optional().allow(""),
            sortOrder: Joi.string().optional(),
            sortColumn: Joi.string().optional(),
            search: Joi.string().optional(),
            type: Joi.number().integer().positive().optional(),
            startDate: Common.dateValidator('from_date').required(),
            endDate: Common.dateValidator('to_date').required(),
            skip: Joi.number().optional().default(0),
            limit: Joi.number().optional(),
            nonAdminId: Joi.number(),
        })
    }
}

module.exports = new EmployeeReportsValidator;