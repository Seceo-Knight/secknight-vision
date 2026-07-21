const number = require('joi/lib/types/number');
const string = require('joi/lib/types/string');
const swaggerHelpers = require('../swagger-helpers');
const { securityObject } = require('../swagger-helpers');

exports.runPayrollSwagger = {
    '/hrms/payroll/run-payroll/salary-revision': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get salary revision',
            description: 'Get salary revision',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: '2021-10-01' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/run-payroll/preview': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get PF setting',
            description: 'Get PF setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employeeId', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: '2020-07-07' }, },
                { in: 'query', name: 'isOverrideCalc', schema: { type: 'boolean', example: false }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/run-payroll/preview/complete': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get PF setting',
            description: 'Get PF setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'completed', schema: { type: 'boolean', example: false }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: '2020-07-07' }, },
                { in: 'query', name: 'employeeId', schema: { type: 'number', example: 2 }, },
                { in: 'query', name: 'isOverrideCalc', schema: { type: 'boolean', example: false }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/run-payroll/preview/employee-tds': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get Employee TDS',
            description: 'Get Employee TDS',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: '1' }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/run-payroll/overview': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get overview',
            description: 'Get overview',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'date', schema: { type: 'date', example: '2021-06-01' }, },
                { in: 'query', name: 'isOverrideCalc', schema: { type: 'boolean', example: false }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Update Overview',
            description: 'Update Overview',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Overview',
                    required: true,
                    schema: {
                        type: 'object',
                        // required: ['ptAllowed', 'ptEffectiveDate', 'ptStateOverride'],
                        properties: {
                            employeeCount: { type: 'number', example: 10 },
                            payrollProcessedCount: { type: 'number', example: 5 },
                            totalPt: { type: 'number', example: 100 },
                            totalCtc: { type: 'number', example: 10000 },
                            totalNetSalary: { type: 'number', example: 10000 },
                            totalEmployeeEsi: { type: 'number', example: 100 },
                            totalEmployerEsi: { type: 'number', example: 100 },
                            totalEmployeePf: { type: 'number', example: 100 },
                            totalEmployerPf: { type: 'number', example: 100 },
                            totalGross: { type: 'number', example: 10000 },
                            totalTax: { type: 'number', example: 100 },
                            month: { type: 'number', example: 1 },
                            year: { type: 'number', example: 2012 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/run-payroll/overview/payout': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get Payout',
            description: 'Get Payout',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employeeId', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'year', schema: { type: 'number', example: '2021' }, },
                { in: 'query', name: 'month', type: 'number', enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
                { in: 'query', name: 'search', schema: { type: 'string', example: 'chanti' }, },
                { in: 'query', name: 'sortColumn', type: 'number', enum: ["employee", "department", "location", "netpay"] },
                { in: 'query', name: 'sortOrder', type: 'number', enum: ["A", "D",] },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/run-payroll/pay-register': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get pay register',
            description: 'Get pay register',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: '2020-07-07' }, },
                { in: 'query', name: "employee_type", schema: { type: 'number', example: 0, }, description: "employee_type must be in [0,1,2,3,4,5]" },
                { in: 'query', name: "components", schema: { type: 'number', example: 1, }, description: "employee_type must be in [1,2,3,4]" },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/run-payroll/overview/status': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get overview',
            description: `status :0-Pending , 1-Processed `,
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'date', schema: { type: 'date', example: '2021-06-01' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },


}
