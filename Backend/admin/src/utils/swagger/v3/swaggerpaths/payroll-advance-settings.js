const number = require('joi/lib/types/number');
const string = require('joi/lib/types/string');
const swaggerHelpers = require('../swagger-helpers');
const { securityObject } = require('../swagger-helpers');

exports.advanceSetting = {
    '/hrms/payroll/advance-settings/pf-esi/pf': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get PF setting',
            description: 'Get PF setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update PF setting',
            description: 'Update PF setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'PF',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['pfAllowed', 'pfCeiling', 'pfIndividualOverride', 'lopDependent', 'employeeContribution', 'employerContribution', 'pfEmployerContribution'],
                        properties: {
                            pfAllowed: { type: 'boolean', example: true, },
                            employeeContribution: {
                                type: 'object', example: {
                                    "is_fixed": false,
                                    "fixed_amount": 1000,
                                    "basic": true,
                                    "percentage": 12,
                                    "ceilingAmount": {
                                        "is_fixed": false,
                                        "fixed_amount": 1000,
                                        "basic": true,
                                        "percentage": 12
                                    }
                                }
                            },
                            employerContribution: {
                                type: 'object', example: {
                                    "is_fixed": false,
                                    "fixed_amount": 1000,
                                    "basic": true,
                                    "percentage": 12,
                                    "ceilingAmount": {
                                        "is_fixed": false,
                                        "fixed_amount": 1000,
                                        "basic": true,
                                        "percentage": 12,
                                    }
                                }
                            },
                            pfCeiling: { type: 'number', example: 15000, },
                            pfIndividualOverride: { type: 'boolean', example: true, },
                            lopDependent: { type: 'boolean', example: true, },
                            includeEdliPfAdminChargesInCtc: { type: 'boolean', example: true, },
                            enableStatutoryMinimumCeiling: { type: 'boolean', example: true, },
                            employerPfContributionIncludedInCtc: { type: 'boolean', example: true, },
                            pfEffectiveDate: { type: 'date', example: '2021-06-30' }

                            // includeEdliPfAdminChargesInCtc,
                            // enableStatutoryMinimumCeiling,
                            // employerPfContributionIncludedInCtc,
                            // pfEffectiveDat
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/advance-settings/pf-esi/esi': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get ESI setting',
            description: 'Get ESI setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update ESI setting',
            description: 'Update ESI setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'ESI',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['esiIndividualOverride', 'includeEmployerEsiContributionInCtc'],
                        properties: {
                            esiAllowed: { type: 'boolean', example: true, },
                            esiIndividualOverride: { type: 'boolean', example: true, },
                            includeEmployerEsiContributionInCtc: { type: 'boolean', example: true, },
                            esiEffectiveDate: { type: 'date', example: '2021-06-30' },
                            statutoryMaxMonthlyGrossForEsi: { type: 'number', example: 2000 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/advance-settings/pf-esi/admin-charges': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get Admin Charges setting',
            description: 'Get Admin Charges setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update Admin Charges setting',
            description: 'Update Admin Charges setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'AdminCharges',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['adminChargesAllowed', 'adminChargesCeiling', 'adminChargesIndividualOverride', 'lopDependent', 'enableStatutoryMinimumCeiling', 'adminChargesEffectiveDate', 'contribution'],
                        properties: {
                            adminChargesAllowed: { type: 'boolean', example: true },
                            adminChargesCeiling: { type: 'number', example: 15000, },
                            adminChargesIndividualOverride: { type: 'boolean', example: true, },
                            lopDependent: { type: 'boolean', example: true, },
                            enableStatutoryCeiling: { type: 'boolean', example: true, },
                            adminChargesEffectiveDate: { type: 'date', example: '2021-06-30' },
                            contribution: {
                                type: 'object', example: {
                                    "is_fixed": false,
                                    "fixed_amount": 1000,
                                    "basic": true,
                                    "percentage": 12,
                                    "belowCeilingAmount": {
                                        "is_fixed": false,
                                        "fixed_amount": 1000,
                                        "basic": true,
                                        "percentage": 12
                                    }
                                }
                            },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/advance-settings/pf-esi/overview': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get overview',
            description: 'Get ESI setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'chanti' }, },
                { in: 'query', name: 'sort', type: 'string', enum: ["employee",] },
                { in: 'query', name: 'order', type: 'string', enum: ['A', 'D'] },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
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
                        // required: ['pfAllowed', 'pfCeiling', 'pfIndividualOverride', 'lopDependent', 'employeeContribution', 'employerContribution', 'pfEmployerContribution'],
                        properties: {
                            employee_id: { type: 'number', example: 1 },
                            pf_override: { type: 'boolean', example: true, },
                            esi_override: { type: 'boolean', example: true, },
                            pf_applicable: { type: 'boolean', example: true, },
                            esi_applicable: { type: 'boolean', example: true, },
                            adminCharges_override: { type: 'boolean', example: true, },
                            settings: {
                                type: 'object', example: {
                                    "pf_date_joined": '2021-06-12',
                                    "pf_effective_date": '2021-06-12',
                                    "esi_effective_date": '2021-06-12',
                                    "adminCharges_effective_date": '2021-06-12',
                                    "vpf": 1000,
                                    "pfContribution": {
                                        "employee": {
                                            "is_fixed": false,
                                            "fixed_amount": 1000,
                                            "basic": true,
                                            "percentage": 12
                                        },
                                        "employer": {
                                            "is_fixed": false,
                                            "fixed_amount": 1000,
                                            "basic": true,
                                            "percentage": 12
                                        }
                                    },
                                    "esiContribution": {
                                        "employee": {
                                            "is_fixed": false,
                                            "fixed_amount": 1000,
                                            "gross": true,
                                            "percentage": 12
                                        },
                                        "employer": {
                                            "is_fixed": false,
                                            "fixed_amount": 1000,
                                            "gross": true,
                                            "percentage": 12
                                        }
                                    },
                                    "adminChargesContribution": {
                                        "is_fixed": false,
                                        "fixed_amount": 100,
                                        "basic": true,
                                        "percentage": 12
                                    },
                                },
                            },
                            details: {
                                type: "object", example: {
                                    "father_name": 'fathername',
                                    "mother_name": 'mothername',
                                    "marital_status": 1,
                                    "govt_id": "123456",
                                    "pt_location": 'Delhi',
                                    "pan_number": "123456",
                                    "pf_number": '123456',
                                    "esi_number": '12356',
                                    "uan_number": '123456',
                                    "ctc": 60000,
                                    "eps_number": '123456'
                                }
                            }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/advance-settings/declaration-setting': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get Declaration Settings',
            description: 'Get ESI setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Put Declaration Settings',
            description: 'Put Declaration Settings',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Declaration settings',
                    required: true,
                    properties: {
                        enabled: { type: 'string', example: 'MONTHLY', enum: ['MONTHLY', 'YEARLY'], required: true },
                        isAppliedForAll: { type: 'boolean', example: false, required: true },
                        employeeIds: { type: 'array', example: [1, 2] },
                        isDeclarationWindowOpen: { type: 'boolean', example: false, required: true },
                        isMandatorProofNeeded: { type: 'boolean', example: false, required: true },
                        monthly: {
                            type: 'object',
                            properties: {
                                declarationWindow: {
                                    required: ["from", "to"],
                                    type: 'object',
                                    properties: {
                                        from: { type: "number", example: 1 },
                                        to: { type: "number", example: 31 }
                                    },
                                },
                                cutoffDateForYear: {
                                    required: ["month", "date"],
                                    type: 'object',
                                    properties: {
                                        month: { type: 'number', example: 1 },
                                        date: { type: 'number', example: 1 }
                                    },
                                }
                            }
                        },
                        yearly: {
                            type: 'object',
                            properties: {
                                required: ['from', 'to'],
                                from: { type: 'string', example: '2021-05-01' },
                                to: { type: 'string', example: '2021-06-01' }
                            }
                        }
                    }
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/hrms/payroll/advance-settings/payroll': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get Payroll setting',
            description: 'Get Payroll setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update Payroll setting',
            description: 'Update Payroll setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Payroll',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['includeWeeklyOffs', 'includeHolidays', 'payFrequency', 'payrollAllowed', 'salaryStructure', 'effectiveDate',
                            'payoutDate', 'cutOffDateNewJoinees', 'payrollLeaveAttendanceCycle', 'paycycle'],
                        properties: {
                            includeWeeklyOffs: { type: 'boolean', example: true },
                            includeHolidays: { type: 'boolean', example: true },
                            payFrequency: { type: 'string', example: "Monthly", description: "Allowed Inputs are ['Monthly', 'Annually', 'SemiAnnually']" },
                            payrollAllowed: { type: 'boolean', example: true },
                            salaryStructure: { type: 'string', example: "CTC", description: "Allowed Inputs are ['CTC', 'Gross']" },
                            effectiveDate: { type: "date", example: "2021-06-21", description: "Valid date formate 'YYYY-MM-DD'" },
                            payoutDate: { type: 'number', example: 31, description: "payoutDate less than or equals to 31  and greater than zero " },
                            cutOffDateNewJoinees: { type: 'number', example: 31, description: "cutOffDateNewJoinees less than or equals to 31  and greater than zero " },
                            payrollLeaveAttendanceCycle: {
                                type: 'object', example: {
                                    "from": 1,
                                    "to": 31
                                },
                                description: "number less than or equals to 31  and greater than zero "
                            },
                            paycycle: {
                                type: 'object', example: {
                                    "from": 1,
                                    "to": 31
                                },
                                description: "number less than or equals to 31  and greater than zero "
                            }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/advance-settings/pt': {
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Add PT details',
            description: 'Add Location data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'ptData',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            effective_date: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                            locations: {
                                type: 'array',
                                example: [{
                                    location_id: 1, details: [
                                        { start: 0, end: 15000, amount: 0 },
                                        { start: 15000, end: 15000, amount: 200 },
                                        { start: 15000, end: 15000, amount: 300 },
                                    ]
                                }]
                            }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update PT setting',
            description: 'Update PT setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'PT',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['ptAllowed', 'ptEffectiveDate', 'ptStateOverride'],
                        properties: {
                            ptAllowed: { type: 'boolean', example: true },
                            ptEffectiveDate: { type: "date", example: "2021-06-21", description: "Valid date formate 'YYYY-MM-DD'" },
                            ptStateOverride: { type: 'boolean', example: true },
                            allStates: { type: 'boolean', example: true },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get PT setting',
            description: 'Get PT setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },


    },
    '/hrms/payroll/advance-settings/pt/locations': {
        delete: {
            tags: ['HRMS:Payroll'],
            summary: 'Delete PT Locations',
            description: 'Delete PT Locations',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'ptData',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            locations: {
                                type: 'array',
                                example: [1, 2]
                            }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/advance-settings/pt/overview': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get PT overview',
            description: 'Get PT overview',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'search', schema: { type: 'string', example: 'chanti' }, },
                { in: 'query', name: 'sort', type: 'string', enum: ["employee", 'location'] },
                { in: 'query', name: 'order', type: 'string', enum: ['A', 'D'] },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update Overview',
            description: 'Update Overview',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'PT',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['ptAllowed', 'ptEffectiveDate', 'ptStateOverride'],
                        properties: {
                            employee_id: { type: 'number', example: 1 },
                            ptAllowed: { type: 'boolean', example: true },
                            ptEffectiveDate: { type: "date", example: "2021-06-21", description: "Valid date formate 'YYYY-MM-DD'" },
                            location_id: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },


    },
    '/hrms/payroll/advance-settings/pt/by-location': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get PT by location',
            description: 'Get PT by location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'location_id', schema: { type: 'number', example: '1' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/payroll/advance-settings/salary-hold': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get employee with salary on hold.',
            description: 'Get employee with salary on hold.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'date', schema: { type: 'date', example: '2021-06-01' }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Update salary on hold status .',
            description: 'Update salary on hold status for a particular employee.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'salaryHold',
                    required: ['employee_id', 'hold_type'],
                    properties: {
                        employee_id: { type: 'number', example: 1 },
                        hold_type: { type: 'string', enum: ['pay', 'hold'] }
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Add employee for salary hold',
            description: 'To add employee for salary on hold',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'addsalaryHold',
                    required: ['salary_hold_components'],
                    schema: {
                        type: 'object',
                        required: ['salary_hold_components'],
                        properties: {
                            salary_hold_components: {
                                type: 'object',
                                example:
                                    [
                                        {
                                            "from": "10",
                                            "to": "1",
                                            "employee_id": 1
                                        },
                                        {
                                            "from": "2",
                                            "to": "3",
                                            "employee_id": 12
                                        },
                                    ]
                            },
                        },
                    }

                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/payroll/advance-settings/salary-in-hand': {
        get: {
            tags: ['HRMS:Payroll'],
            summary: 'Get employee with salary in hand.',
            description: 'Get employee with salary in hand.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'name', schema: { type: 'string', example: 'Axel' }, },
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['HRMS:Payroll'],
            summary: 'Update salary in hand status .',
            description: 'Update salary in hand status.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'salaryInHand',
                required: ['employee_ids'],
                properties: {
                    employee_ids: { type: 'array', example: [1, 2, 3, 5] },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['HRMS:Payroll'],
            summary: 'Add employee for salary in hand',
            description: 'To disable employee for salary in hand',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'salaryInHand',
                required: ['employee_id'],
                properties: {
                    employee_id: { type: 'number', example: 1 },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
}
