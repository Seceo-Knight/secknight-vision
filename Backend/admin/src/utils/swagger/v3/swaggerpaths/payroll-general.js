const number = require('joi/lib/types/number');
const string = require('joi/lib/types/string');
const swaggerHelpers = require('../swagger-helpers');
const { securityObject } = require('../swagger-helpers');

exports.payrollGeneral = {
    '/hrms/payroll/declaration': {
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'declaration upload',
            description: 'Update Overview',
            description: `
                Add declaration content data \n
                Example { "financial_year": "FY 19-20","declaration_id": 1, "comments": "some comments", "declared_amount": 2000 }\n
              
                House property data\n
                 
                  Add id inside json to update the particular  house property ("id":1)
                  
            
                {
                    "financial_year": "2020-2021",
                    "declaration_id": 31,
                    "comments": "some comments",
                    "houseProperty": {
                      "type": "selfOccupiedProperty",
                      "hasLoan": false,
                      "details": {
                        "type": "apartment",
                        "propertyValue": 25000
                      },
                      "lossAmount": 20000
                    }
                  }

               Income From PreviousEmployer 
 
               Add id inside json to update the particular  Income From PreviousEmployer ("id":1)

                {
                   "financial_year": "2020-2021",
                   "declaration_id": 31,
                   "comments": "some comments",
                    "incomeFromPreviousEmployer" : {
                    "startDate": "2021-07-26",
                    "endDate": "2021-07-26",
                    "employerName": "admin",
                    "income": 250000,
                    "pf": 250,
                    "pt": 250,
                    "taxDeduction": 1200
                }}



                `,
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'formData',
                    name: 'type',
                    type: 'string',
                    enum: ["houseProperty", "deduction", "Income From Previous Employer"]
                },
                {
                    in: "formData",
                    type: "string",
                    name: "data",
                    required: true,
                    description: "declaration data."
                },
                {
                    in: "formData",
                    type: "file",
                    name: "documents",
                    required: false,
                    description: "Upload documents."
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/upload-data': {
        post: {
            parameters: [
                {
                    in: 'body',
                    name: 'Declaration',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['financial_year', 'declaration_id', 'declared_amount'],
                        properties: {
                            financial_year: { type: 'string', example: "2019-2020" },
                            declaration_id: { type: 'number', example: 1 },
                            comments: { type: 'string', example: "some comments" },
                            declared_amount: { type: 'number', example: 2000 },
                            employee_id: { type: 'number', example: 20, description: "Mandatory for admin login" }
                        },
                    },
                },
            ],
            tags: ['HRMS:Payroll'],
            summary: 'Add declaration content data',
            description: 'Add declaration content data',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/upload-file': {
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'declaration upload',
            description: 'Update Overview',
            description: `
                Add declaration upload file \n
            `,
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [
                {
                    in: "query",
                    type: "string",
                    name: "employee_declaration_id",
                    required: true,
                    description: "declaration data."
                },
                {
                    in: "formData",
                    type: "file",
                    name: "documents",
                    required: false,
                    description: "Upload documents."
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/employees-tax-scheme': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get employee tax schemes',
            description: 'Get employee tax schemes',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_type', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'employeeId', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'basavaraj' }, },
                { in: 'query', name: 'sortColumn', type: 'string', enum: ["name", 'location', 'email'] },
                { in: 'query', name: 'sortOrder', type: 'string', enum: ['DESC', 'ASC'] },
                { in: 'query', name: 'financial_year', schema: { type: 'string', example: "2019-2020" } },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/payroll/declaration/tax-correction': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get employee tax details',
            description: 'Get employee tax details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'Axel' }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: new Date().toISOString().slice(0, 10) } },
                { in: 'query', name: 'employee_type', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'skip', schema: { type: 'number', example: 0 }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 10 }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Update Employee TDS for TDS Correction.',
            description: 'Update Employee TDS for TDS Correction.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'EmployeeData',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['employee_id', 'date'],
                        properties: {
                            employee_id: { type: 'number', example: 1 },
                            date: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                            gross: { type: 'number', example: 1 },
                            tds: { type: 'number', example: 1 }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/payroll/declaration/schemes': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get employee tax schemes',
            description: 'Get employee tax schemes',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_type', schema: { type: 'number', example: '2' }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/declaration/update-schemes': {
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update tax schemes',
            description: `Update tax schemes 1-approved,2-pending,0-rejected`,
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Declaration',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['schemeData'],
                        properties: {
                            schemeData: { type: 'array', example: [{ employeeId: 1, adminApprovedBchemeId: '1', employeeApprovedSchemeId: 1, schemeStatus: 1 }] }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/custom-salary/bulk': {
        post: {
            tags: ['HRMS:Payroll'],
            description: 'Upload custom salary bulk',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload custom salary bulk',
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/custom-salary/employees-custom-details': {
        get: {
            tags: ['HRMS:Payroll'],
            description: 'Get Employee Custom salary',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'auto code' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 0 } },
                { in: 'query', name: 'employee_type', schema: { type: 'number', example: 0 }, description: 'employee_type must be in [0,1,2,3,4,5].' }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,

        },
        post: {
            tags: ['HRMS:Payroll'],
            parameters: [
                {
                    in: 'body',
                    name: 'Declaration',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['employee_id', 'salary_components'],
                        properties: {
                            employee_id: { type: 'number', example: 123 },
                            salary_components: {
                                type: 'object',
                                example:
                                {
                                    "annual_ctc": 165600,
                                    "monthly_ctc": 13800,
                                    "employer_pf": null,
                                    "employer_esic": 435,
                                    "gross_salary": 13365,
                                    "basic_allowance": 10000,
                                    "hra": 3365,
                                    "telephone_and_internet": null,
                                    "medical_allowance": null,
                                    "lunch_allowance": null,
                                    "special_allowance": null,
                                    "admin_charges": 100,
                                }
                            },
                            "additional_components": {
                                type: 'array',
                                example: [{
                                    "component_name": "abc",
                                    "value": 100,
                                    "date": "2021-10-27"
                                }]
                            },
                            "deduction_components": {
                                type: 'array',
                                example: [{
                                    "component_name": "xyz",
                                    "value": 100,
                                    "date": "2021-10-27"
                                }]
                            }
                        },
                    },
                },
            ],
            summary: 'Add declaration content data',
            description: 'Add declaration content data',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/custom-salary/org-components': {
        get: {
            tags: ['HRMS:Payroll'],
            description: 'Get org components',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,

        },
        post: {
            tags: ['HRMS:Payroll'],
            parameters: [
                {
                    in: 'body',
                    name: 'organization components',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['remove_components', 'new_components'],
                        properties: {
                            remove_components: {
                                type: 'array',
                                example: ['comp_1', 'comp_2']
                            },
                            new_components: {
                                type: 'array',
                                example: ['comp_1', 'comp_2']
                            }
                        },
                    },
                },
            ],
            summary: 'Add / Remove organization components',
            description: 'Add / Remove organization components',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/custom-salary/org-custum-details': {
        get: {
            tags: ['HRMS:Payroll'],
            description: 'Get Organization Custom salary',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    }
};
