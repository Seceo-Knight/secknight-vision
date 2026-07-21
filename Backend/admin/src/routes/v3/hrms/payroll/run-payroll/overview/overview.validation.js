const Joi = require('joi');
class OverviewValidation {
    static getOverview(params) {
        return Joi.validate(params, Joi.object().keys({
            date: Joi.date().required(),
            isOverrideCalc: Joi.boolean().default(false).optional()
        }))
    }
    static getPayout(params) {
        return Joi.validate(params, Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(10),
            employeeId: Joi.number().integer().optional(),
            year: Joi.number().integer().required(),
            search: Joi.string().optional(),
            month: Joi.number().integer().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12).required(),
            sortColumn: Joi.string().valid("employee", "department", "location", "netpay").optional().default(null),
            sortOrder: Joi.string().valid("A", "D").optional().default("D")
        }))
    }

    static updateOverview(params, currentYear) {

        return Joi.validate(params, Joi.object().keys({
            employeeCount: Joi.number().integer().required(),
            totalPt: Joi.number().required(),
            totalCtc: Joi.number().required(),
            totalNetSalary: Joi.number().required(),
            totalEmployeeEsi: Joi.number().required(),
            payrollProcessedCount: Joi.number().integer().required(),
            totalEmployerEsi: Joi.number().required(),
            totalEmployeePf: Joi.number().required(),
            totalEmployerPf: Joi.number().required(),
            totalGross: Joi.number().required(),
            totalTax: Joi.number().required(),
            month: Joi.number().integer().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12).required(),
            year: Joi.number().integer().min(currentYear - 1).max(currentYear + 1).required(),
        }))
    }
}
module.exports = OverviewValidation;