const Joi = require('@hapi/joi');
const moment = require('moment-timezone');
const Common = require('../../../utils/helpers/Common');
const EmployeeHelper = require('./Employee.helper');
Joi.objectId = require('joi-objectid')(Joi)

class EmployeeValidator {
    getBrowserHistory() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                startDate: Common.dateValidator('startDate').required(),
                endDate: Common.dateValidator('endDate').required(),
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(10),
            })
            .required();
    }
    getApplicationsUsed() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                startDate: Common.dateValidator('startDate').required(),
                endDate: Common.dateValidator('endDate').required(),
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(10),
            })
            .required();
    }
    
    getAppWebUsedCombined() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                startDate: Common.dateValidator('startDate').required(),
                endDate: Common.dateValidator('endDate').required(),
                // Type for App/Web App - 1 Web - 2
                type: Joi.number().integer().allow(1,2).default(1),
                // Category for Productive - 1 Unproductive -2 Neutral -3
                category: Joi.number().integer().allow(1,2,0).required(),
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(10),
            })
            .required();
    }
    
    getKeyStrokes() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                startDate: Common.dateValidator('startDate').required(),
                endDate: Common.dateValidator('endDate').required(),
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(10),
            })
            .required();
    }

    getLogDetails() {
        return Joi.object()
            .keys({
                user_id: Joi.number().integer().positive().required(),
                from_date: Common.dateTimeValidator('from_date').required(),
                to_date: Common.dateTimeValidator('to_date').required(),
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(10),
            })
            .required();
    }

    getEmployeesAttendanceSheet() {
        const currentMonth = Number(moment().utc().format('YYYYMM'));
        const { columns, orders } = EmployeeHelper.getAllowSortValue();

        return Joi.object()
            .keys({
                locationId: Joi.number().integer().positive(),
                skip: Joi.number().integer().min(0).default(0),
                departmentId: Joi.number().integer().positive(),
                date: Joi.number()
                    .integer()
                    .positive()
                    .min(200001)
                    .max(currentMonth)
                    .default(moment().utc().format('YYYYMM')),
                limit: Joi.number().integer().positive(),
                sortColumn: Joi.string().valid(...columns),
                sortOrder: Joi.string().valid(...orders).default(orders[0]),
                search: Joi.string().lowercase(),
                non_admin_id: Joi.number(),
                shift_id: Joi.number().optional().allow(null).default(null),
            })
            .required();


    }

    urlPrediction() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                startDate: Common.dateValidator('startDate').required(),
                endDate: Common.dateValidator('endDate').required(),
                skip: Joi.number().integer().default(0),
                limit: Joi.number().integer().default(10),
                category: Joi.string().allow('', null),
                category: Joi.objectId().allow("", null),
                sortBy: Joi.string().valid("url", "date", "domain", "prediction", "category"),
                // orders: Joi.string().valid([1, -1]),
                order: Joi.string().valid("A", "D"),
                search: Joi.string().allow(null, ''),
            })
            .required();
    }

    conversationClassification() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                startDate: Common.dateValidator('startDate').required(),
                endDate: Common.dateValidator('endDate').required(),
                sortBy: Joi.string().valid("app", "words", "date"),
                order: Joi.string().valid("A", "D"),
            })
            .required();
    }

    sentimentalAnalysis() {
        return Joi.object().keys({
            employee_id: Joi.number().integer().positive().required(),
            from_date: Common.dateValidator('from_date').required(),
            to_date: Common.dateValidator('from_date').required(),
        }).required();
    }

    employeeInsights() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required().error((err) => Common.hapijoiStringErrorMessage(err)),
                date: Common.dateValidator('date').required().error((err) => Common.hapijoiStringErrorMessage(err)),
            }).required();
    }

    employeeRoomId() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required().error((err) => Common.hapijoiStringErrorMessage(err)),
            }).required();
    }

    getKeyStrokesData() {
        return Joi.object()
            .keys({
                department_id : Joi.number().integer().positive().default(0),
            })
            .required();
    }

    getEmployeeGeolocationLogs() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().integer().positive().required(),
                start_date: Common.dateValidator('start_date').required(),
                end_date: Common.dateValidator('end_date').required(),
            })
            .required();
    }
}

module.exports = new EmployeeValidator();
