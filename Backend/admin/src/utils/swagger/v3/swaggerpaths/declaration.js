const number = require('joi/lib/types/number');
const string = require('joi/lib/types/string');
const swaggerHelpers = require('../swagger-helpers');
const { securityObject } = require('../swagger-helpers');

exports.declaration = {
    '/hrms/payroll/declaration/deductions/': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get deductions',
            description: 'Get deductions',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'search', schema: { type: 'string', example: "chanti" }, },
                { in: 'query', name: 'financialYear', schema: { type: 'string', example: '2020-2021' }, },
                { in: 'query', name: 'withOtherDeductions', type: 'string', enum: [true, false] },
                { in: 'query', name: 'includeOther', type: 'string', enum: [true, false] },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update employee deduction',
            description: 'Update employee deduction',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Deductions',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 },
                            status: { type: 'number', example: 1, description: '0-pending 1-approved 2-decline' },
                            approved_amount: { type: 'number', example: 15000, },
                            comment: { type: 'string', example: 'ok', },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['HRMS:Payroll'],
            summary: 'Delete declarations',
            description: 'Delete declarations',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Deductions',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            ids: { type: 'array', example: [1, 2, 3] },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/deductions/hra': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get HRA',
            description: 'Get HRA',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'search', schema: { type: 'string', example: "chanti" }, },
                { in: 'query', name: 'financialYear', schema: { type: 'string', example: '2020-2021' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Post HRA',
            description: 'Post HRA',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Deductions',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'number', example: 1 },
                        employee_id: { type: 'number', example: 1 },
                        date_range: { type: 'string', example: "Jan-Feb" },
                        monthly_rent: { type: 'number', example: 1000 },
                        address: { type: 'string', example: "address some" },
                        declared_amount: { type: 'number', example: 1000 },
                        landlord_name: { type: 'string', example: "name some" },
                        landlord_pan: { type: 'string', example: "xxxxx8646z" },
                        financial_year: { type: 'string', example: '2020-2021' },
                        comments: { type: 'string', example: 'some comments' }
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },

    },
    '/hrms/payroll/declaration/deductions/lta': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get LTA',
            description: 'Get LTA',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'search', schema: { type: 'string', example: "chanti" }, },
                { in: 'query', name: 'financialYear', schema: { type: 'string', example: '2020-2021' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },


    },
    '/hrms/payroll/declaration/deductions/house-property': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get house-property',
            description: 'Get house-property',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query', name: 'type', type: 'string', enum: [
                        "Income From Other Than Savings Bank Interest",
                        "Income From Savings Bank Interest",
                        "House Property",
                        "Income From Previous Employer",
                        "Income From Pension",]
                },
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'search', schema: { type: 'string', example: "chanti" }, },
                { in: 'query', name: 'financialYear', schema: { type: 'string', example: '2020-2021' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/payroll/declaration/deductions/deduction-components': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get deduction components',
            description: 'Get house-property',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/deductions/bank-interest': {
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Upsert bank interest',
            description: 'Upsert bank interest',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Deductions',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 },
                            declaration_component_id: { type: 'number', example: 1 },
                            amount: { type: 'number', example: 100 },
                            comment: { type: 'string', example: 'ok', },
                            financial_year: { type: 'string', example: "2020-2021" },
                            bankName: { type: 'string', example: "SBI" }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/deductions/income-from-pension': {
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Upsert Pension Details',
            description: 'Upsert Pension Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Deductions',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 },
                            declaration_component_id: { type: 'number', example: 1 },
                            amount: { type: 'number', example: 100 },
                            comment: { type: 'string', example: 'ok', },
                            relationType: { type: 'string', example: 'Father', },
                            date: { type: 'string', example: '2021-01-30', },
                            financial_year: { type: 'string', example: "2020-2021" },
                            memberName: { type: 'string', example: "SBI" }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/deductions/employee': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get Employee Deduction',
            description: 'Get Employee Deduction',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'financial_year', schema: { type: 'string', example: '2020-2021' }, },
                { in: 'query', name: 'withOtherDeductions', type: 'string', enum: [true, false] },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/deductions/loans': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get loans',
            description: 'Get loans',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'search', schema: { type: 'string', example: "employee name" }, },
                { in: 'query', name: 'financial_year', schema: { type: 'string', example: '2020-2021' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'upsert loans',
            description: 'upsert loans',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Deductions',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 },
                            employee_id: { type: 'number', example: 1 },
                            loan_name: { type: 'string', example: 'loan name hai' },
                            start_date: { type: 'string', example: '2021-09-09' },
                            end_date: { type: 'string', example: '2021-09-09' },
                            loan_required_date: { type: 'string', example: '2021-09-09' },
                            component: { type: 'string', example: 'example component' },
                            frequency: { type: 'string', example: 'MONTHLY' },
                            no_of_schedule: { type: 'number', example: 10 },
                            loan_process_date: { type: 'string', example: '2021-09-09' },
                            total_amount: { type: 'number', example: 12345 },
                            approved_amount: { type: 'number', example: 12345 },
                            amount_paid: { type: 'number', example: 12345 },
                            amount_pending: { type: 'number', example: 12345 },
                            emi_amount: { type: 'number', example: 12345 },
                            rate_of_interest: { type: 'number', example: 5 },
                            no_of_emi_pending: { type: 'number', example: 1 },
                            status: { type: 'number', example: 0 },
                            financial_year: { type: 'string', example: '2020-2021' },
                            comment: { type: 'string', example: 'comment' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['HRMS:Payroll'],
            summary: 'Delete loan',
            description: 'Delete loan',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'financial_year', schema: { type: 'string', example: '2020-2021' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/declaration/deductions/reimbursement': {
        get: {
            tags: ['HRMS:Reimbursement'],
            summary: 'Get Reimbursement',
            description: 'Get Reimbursement',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'financialYear', schema: { type: 'string', example: '2021-2022' }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: '2022-02-01' }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Reimbursement'],
            summary: 'upsert Reimbursement Data',
            description: 'upsert Reimbursement Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Reimbursement',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 },
                            employee_id: { type: 'number', example: 1 },
                            component_name: { type: 'string', example: 'Component Name ' },
                            declared_date: { type: 'string', example: '2021-01-01' },
                            declared_amount: { type: 'number', example: 1000 },
                            financial_year: { type: 'string', example: '2020-2021' },
                            comment: { type: 'string', example: 'comment' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Reimbursement'],
            summary: 'upsert Reimbursement Data',
            description: 'upsert Reimbursement Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Reimbursement',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 },
                            employee_id: { type: 'number', example: 1 },
                            approved_amount: { type: 'number', example: 1000 },
                            comment: { type: 'string', example: 'comment' },
                            status: { type: 'number', example: 1 }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['HRMS:Reimbursement'],
            summary: 'Delete Reimbursement Data',
            description: 'Delete Reimbursement Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Reimbursement',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'number', example: 1 }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    }
}