const moment = require('moment');
const swaggerHelpers = require('./swagger-helpers');
const schemas = require('./swagger-schemas');
const { description } = require('joi');
const { BaseModel } = require('../../../models/BaseModel');
const AppNames = require('../../../routes/v3/organization/appNames/Model');
const { advanceSetting } = require('./swaggerpaths/payroll-advance-settings');
const { runPayrollSwagger } = require('./swaggerpaths/run-payroll');
const { payrollGeneral } = require('./swaggerpaths/payroll-general');
const { declaration } = require('./swaggerpaths/declaration');
const { commonBulkSwagger } = require('./swaggerpaths/common-bulk');

const securityObject = [{
    authenticate: [],
},];

module.exports = {
    '/': {
        get: {
            tags: ['Open'],
            description: "Get root request's response from the api - basically server status",
            responses: {
                200: {
                    description: 'Healthy! server status and API status.',
                },
                500: swaggerHelpers.responseObject['500'],
            },
        },
    },

    '/auth/admin': {
        post: {
            tags: ['Auth'],
            summary: 'Admin authentication',
            description: ' Admin authentication',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: ' adminData',
                description: `Admin authentication  
                    feedback : 0-Show popup , 1-Accepted ,2-Skip, 3- Not expired`,
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'first_name', 'last_name', 'username', 'email', 'address', 'phone'],
                    properties: {
                        name: { type: 'string', example: 'empv3demo' },
                        first_name: { type: 'string', example: 'EMP' },
                        last_name: { type: 'string', example: 'V3' },
                        email: { type: 'string', example: 'empv3demo@gmail.com', },
                        username: { type: 'string', example: 'empv3demo' },
                        address: { type: 'string', example: 'Bangalore' },
                        phone: { type: 'string', example: '+784726272' },
                        product_id: { type: 'number', example: '6' },
                        begin_date: { type: 'date', example: '2020-05-20' },
                        expire_date: { type: 'date', example: '2037-12-12', },
                        timezone: { type: 'string', example: 'Asia/Kolkata', },
                        // amember_id: { type: 'number', example: '61', },
                        // total_allowed_user_count: { type: 'number', example: "10" }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/user': {
        post: {
            tags: ['Auth'],
            summary: 'Employee/Manager login ',
            description: 'Login to the portal',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee signin ',
                description: 'Employee/Manager Signin ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email', 'password', 'ip'],
                    properties: {
                        email: { type: 'string', example: 'email' },
                        password: { type: 'string', example: '********' },
                        ip: { type: 'string', example: '123.123.123.128' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/validate-otp-2fa': {
        post: {
            tags: ['Auth'],
            summary: 'Employee/Manager login validate otp for 2fa',
            description: 'Login to the portal validate otp for 2fa',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Employee signin validate otp for 2fa',
                    description: 'Employee/Manager Signin validate otp for 2fa',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email', 'otp', 'ip'],
                        properties: {
                            email: { type: 'string', example: 'email' },
                            otp: { type: 'number', example: 123456 }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/validate-otp-2fa-organization': {
        post: {
            tags: ['Auth'],
            summary: 'Admin login validate otp for 2fa',
            description: 'Login to the portal validate otp for 2fa',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Admin signin validate otp for 2fa',
                    description: 'Admin Signin validate otp for 2fa',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email', 'otp', 'ip'],
                        properties: {
                            email: { type: 'string', example: 'email' },
                            otp: { type: 'number', example: 123456 }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/info': {
        post: {
            tags: ['Auth'],
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Org details ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', example: 'empv3demo@gmail.com' }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/admin-send-email': {
        post: {
            tags: ['Auth'],
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Send 2FA validate OTP to admin',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email'],
                        properties: {
                            
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/auth/admin-resend-email': {
        post: {
            tags: ['Auth'],
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Resend 2FA validate OTP to admin',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email'],
                        properties: {
                            email: { type: 'string', example: 'empv3demo@gmail.com' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/employee-resend-email': {
        post: {
            tags: ['Auth'],
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Resend 2FA validate OTP to Employee',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email'],
                        properties: {
                            email: { type: 'string', example: 'empv3demo@gmail.com' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/role-account-switch': {
        post: {
            tags: ['Auth'],
            summary: 'Role account switch ',
            description: 'Role account switch',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'AccountSwitch',
                description: 'account switch',
                required: true,
                schema: {
                    type: 'object',
                    required: ['role_id'],
                    properties: {
                        role_id: { type: 'number', example: '6' }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/auth/logout': {
        get: {
            tags: ['Auth'],
            summary: 'Logout user session',
            description: 'Logout user session',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/auth/agent-logout': {
        get: {
            tags: ['Auth'],
            summary: 'Agent logout user session.',
            description: 'Agent logout user session.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{ in: 'query', name: 'employeeId', schema: { type: 'number', example: 1 }, required: true, }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/auth/amember-logout': {
        post: {
            tags: ['Auth'],
            summary: 'AMember logout',
            description: 'Logout and clear session/cache for an admin by email and amember id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'body',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email', 'amember_id'],
                        properties: {
                            email: { type: 'string', example: 'admin@example.com', description: 'Admin email' },
                            amember_id: { type: 'number', example: 1, description: 'AMember ID' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: [],
        },
    },

    '/build/add': {
        post: {
            tags: ['Build'],
            summary: 'Build for org',
            description: 'Add build automatically generated by jenkins',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'BuildData',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'organization_key',
                        'build_version',
                        'type',
                        'mode',
                        'url',
                    ],
                    properties: {
                        organization_key: {
                            type: 'string',
                            example: 'O****j',
                        },
                        build_version: { type: 'string', example: '1.0.0' },
                        type: { type: 'string', example: 'win64' },
                        mode: {
                            type: 'string',
                            example: 'official',
                            enum: ['personal', 'official'],
                        },
                        url: {
                            type: 'string',
                            example: 'https://abc.xyz/asd.zip',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/build/create': {
        post: {
            tags: ['Build'],
            summary: 'Build for org',
            description: 'Add build automatically generated by jenkins',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'BuildData',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', example: 'basavaraj@globussoft.in' }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/build/add-onpremise': {
        post: {
            tags: ['Build'],
            summary: 'Build for on-premise',
            description: 'Add build automatically generated by jenkins for on-premise',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'BuildData',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'email',
                        'organization_key',
                        'build_version',
                        'type',
                        'mode',
                        'url',
                    ],
                    properties: {
                        email: {
                            type: 'string',
                            example: 'empv3demo@gmail.com',
                        },
                        organization_key: {
                            type: 'string',
                            example: 'O****j',
                        },
                        build_version: { type: 'string', example: '1.0.0' },
                        type: { type: 'string', example: 'win64' },
                        mode: {
                            type: 'string',
                            example: 'official',
                            enum: ['personal', 'office'],
                        },
                        url: {
                            type: 'string',
                            example: 'https://abc.xyz/asd.zip',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },

    /** ============ Employee Details ============ */
    '/employee/browser-history': {
        get: {
            tags: ['Employee'],
            summary: 'Get browser history details',
            description: 'Get browser history details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-05-01' },
                required: true,
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: '0' },
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/applications': {
        get: {
            tags: ['Employee'],
            summary: 'Get Applications Used.',
            description: 'Get Applications Used Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-05-01' },
                required: true,
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: '0' },
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/app-web-combined': {
        get: {
            tags: ['Employee'],
            summary: 'Get Applications Website Used.',
            description: 'Get Applications Website Used Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 1 },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: { type: 'string', example: '2020-04-30' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: { type: 'string', example: '2020-05-01' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: '0' },
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 10 },
                },
                {
                    in: 'query',
                    name: 'type',
                    schema: { type: 'number', example: 1 },
                    required: true,
                    description: "Type 1 - Application 2 - Website"
                },
                {
                    in: 'query',
                    name: 'category',
                    schema: { type: 'number', example: 0 },
                    required: true,
                    description: "Productivity Category Neutral - 0, Productive - 1 Unproductive - 2"
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/keystrokes': {
        get: {
            tags: ['Employee'],
            summary: 'Get KeyStrokes Details',
            description: 'Get KeyStrokes Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-05-01' },
                required: true,
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: '0' },
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/keystrokes-data': {
        get: {
            tags: ['Employee'],
            summary: 'Get KeyStrokes for last 60 days details',
            description: 'Get KeyStrokes for last 60 days details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: '0' },
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/attendance-sheet': {
        get: {
            tags: ['Employee'],
            summary: 'Get attendance report',
            description: 'Get attendance report for employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'number', example: 202005 },
                description: "Date mast be format 'YYYYMM' (ex. moment(date).format(YYYYMM))",
                default: `${moment().format('YYYYMM')} (Current month)`
            },
            {
                in: 'query',
                name: 'locationId',
                schema: { type: 'number', example: 55 },
                description: 'Employee location id',
            },
            {
                in: 'query',
                name: 'departmentId',
                schema: { type: 'number', example: 45 },
                description: 'Employee department id',
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 10 },
                description: 'Count employees, that will be skip',
                default: 0,
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 5 },
                description: 'The amount of data per page',
                default: 10,
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: 'emp' },
                description: 'Searches for records by keyword',

            },
            {
                in: 'query',
                name: 'sortColumn',
                schema: { type: 'string', example: 'name', },
                description: 'Sort result by selected field',
                enum: ['name', 'location', 'department', 'emp_code']

            },
            {
                in: 'query',
                name: 'sortOrder',
                schema: { type: 'string', example: 'D', default: 'A' },
                description: 'Order of sort',
                enum: ['A', 'D']

            },
            {
                in: 'query',
                name: 'nonAdminId',
                schema: { type: 'number', example: '25860' },
                description: 'filter with non admin by id',
            },

        ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/attendance': {
        get: {
            tags: ['Employee'],
            summary: 'Get attendance report',
            description: 'Get attendance report for employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'date',
                    schema: { type: 'number', example: 202301 },
                    description: "Date mast be format 'YYYYMM' (ex. moment(date).format(YYYYMM))",
                    default: `${moment().format('YYYYMM')} (Current month)`,
                },
                {
                    in: 'query',
                    name: 'locationId',
                    schema: { type: 'number', example: 55 },
                    description: 'Employee location id',
                },
                {
                    in: 'query',
                    name: 'departmentId',
                    schema: { type: 'number', example: 45 },
                    description: 'Employee department id',
                },
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 10 },
                    description: 'Count employees, that will be skip',
                    default: 0,
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 5 },
                    description: 'The amount of data per page',
                    default: 10,
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: 'emp' },
                    description: 'Searches for records by keyword',
                },
                {
                    in: 'query',
                    name: 'sortColumn',
                    schema: { type: 'string', example: 'name' },
                    description: 'Sort result by selected field',
                    enum: ['name', 'location', 'department', 'emp_code'],
                },
                {
                    in: 'query',
                    name: 'sortOrder',
                    schema: { type: 'string', example: 'D', default: 'A' },
                    description: 'Order of sort',
                    enum: ['A', 'D'],
                },
                {
                    in: 'query',
                    name: 'nonAdminId',
                    schema: { type: 'number', example: '25860' },
                    description: 'filter with non admin by id',
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/update-user': {
        put: {
            tags: ['User'],
            summary: 'Update Employee Details',
            description: 'Update Employee Detailss',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Update Employee Details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['new_password', 'confirmation_password'],
                    properties: {
                        new_password: {
                            type: 'string',
                            example: 'Basavaraj@123',
                        },
                        confirmation_password: {
                            type: 'string',
                            example: 'Basavaraj@123',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/get-employee-insights': {
        get: {
            tags: ['Employee'],
            summary: 'Get attendance report',
            description: 'Get attendance report for employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'number', example: '2021-03-23' },
                description: "Date must be format 'YYYY-MM-DD' ",
            },
            {
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 3099 },
                description: 'Employee id',
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/get-employee-room-id': {
        get: {
            tags: ['Employee'],
            summary: 'Get attendance report',
            description: 'Get attendance report for employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 3099 },
                description: 'Employee id',
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    /** ============ System Logs ============ */
    '/system-logs': {
        get: {
            tags: ['System Logs'],
            summary: 'Get system logs',
            description: 'Get system logs for employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: new Date().toISOString() },
                description: "Start for logs period range",
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: new Date().toISOString() },
                description: "end for logs period range",
            },
            {
                in: 'query',
                name: 'locationId',
                schema: { type: 'number', example: 55 },
                description: 'Employee location id',
            },
            {
                in: 'query',
                name: 'departmentId',
                schema: { type: 'number', example: 45 },
                description: 'Employee department id',
            },
            {
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 210 },
                description: 'if need get logs for one employee',
            },
            {
                in: 'query',
                name: 'non_admin_id',
                schema: { type: 'number', example: 25516 },
            },
            {
                in: 'query',
                name: 'offset',
                schema: { type: 'number', example: 10 },
                description: 'Count employees, that will be skip',
                default: 0,
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 5 },
                description: 'The amount of data per page',
                default: 20,
            },
            {
                in: 'query',
                name: 'sortColumn',
                schema: { type: 'string' },
                description: 'Sort result by selected field',
                enum: ['date', 'computer', 'title', 'description', 'time']

            },
            {
                in: 'query',
                name: 'sortOrder',
                schema: { type: 'string', example: 'D', default: 'A' },
                description: 'Order of sort',
                enum: ['A', 'D']
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: 'process', default: 'process' },
                description: 'search string here',
            },


            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /** ============ TimeSheet ============ */
    '/timesheet/': {
        get: {
            tags: ['Timesheet'],
            summary: 'Get all user logs based on filters',
            description: 'Get all users from attendance to timesheet breakup.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 1, default: 0 },
                required: true,
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number', example: 1, default: 0 },
                required: true,
            },
            {
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1, default: 0 },
                required: true,
            },
            {
                in: 'query',
                name: 'start_date',
                schema: {
                    type: 'string',
                    example: new Date().toISOString(),
                },
                required: true,
            },
            {
                in: 'query',
                name: 'end_date',
                schema: {
                    type: 'string',
                    example: new Date().toISOString(),
                },
                required: true,
            },
            {
                in: 'query',
                name: 'absent',
                schema: { type: 'number', example: 1, default: 0 },
            },
            {
                in: 'query',
                name: 'employee_avg',
                schema: {
                    type: 'boolean',
                    example: true,
                    default: false,
                },
            },
            { in: 'query', name: 'avg', schema: { type: 'boolean', example: true, default: false } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/timesheet/timesheet": {
        get: {
            tags: ["Timesheet"],
            summary: "Get all user logs based on filters",
            description: `Get all users from attendance to timesheet breakup.\n 
            column sorting-'Full Name','Start Time','End Time','Location','Department','Email','Employee Code',\n
            'Office Time','Active Hours','Productive','Unproductive','Neutral','Break','Idle','Productivity',Total Time\n
            sortOrder-A-ascending and D-descending 
            `,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "skip", schema: { type: "number", example: 1, default: 0 }, required: true },
                { in: "query", name: "limit", schema: { type: "number", example: 10, default: 10 }, required: true },
                { in: "query", name: "location_id", schema: { type: "number", example: 1, default: 0 }, required: true },
                { in: "query", name: "department_id", schema: { type: "number", example: 1, default: 0 }, required: true },
                { in: "query", name: "employee_id", schema: { type: "number", example: 1, default: 0 }, required: true },
                { in: "query", name: "start_date", schema: { type: "string", example: new Date().toISOString() }, required: true },
                { in: "query", name: "end_date", schema: { type: "string", example: new Date().toISOString() }, required: true },
                { in: "query", name: "sortColumn", schema: { type: "string", example: 'Full Name' } },
                { in: "query", name: "sortOrder", schema: { type: "string", example: 'D' } },
                { in: "query", name: "name", schema: { type: "string", example: 'basavaraj' } }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/timesheet/employee-timesheet": {
        get: {
            tags: ["Timesheet"],
            summary: "Get all user logs based on filters",
            description: `This is a custom API of Time sheet with rate limit of 30 minutes min.
            Get all users from attendance to timesheet breakup.\n 
            column sorting-'Full Name','Start Time','End Time','Location','Department','Email','Employee Code',\n
            'Office Time','Active Hours','Productive','Unproductive','Neutral','Break','Idle','Productivity',Total Time\n
            sortOrder-A-ascending and D-descending 
            `,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "start_date", schema: { type: "string", example: new Date().toISOString() }, required: true },
                { in: "query", name: "end_date", schema: { type: "string", example: new Date().toISOString() }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/timesheet/getUnProductiveEmployees": {
        get: {
            tags: ["Timesheet"],
            summary: "Get all unproductive employees logs data",
            description: `This is a custom API used for Custom Only
            Get all users from attendance to timesheet breakup.\n 
            column sorting-'Full Name','Start Time','End Time','Location','Department','Email','Employee Code',\n
            'Office Time','Active Hours','Productive','Unproductive','Neutral','Break','Idle','Productivity',Total Time\n
            sortOrder-A-ascending and D-descending 
            `,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "start_date", schema: { type: "string", example: new Date().toISOString() }, required: true },
                { in: "query", name: "end_date", schema: { type: "string", example: new Date().toISOString() }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/timesheet/details': {
        get: {
            tags: ['Timesheet'],
            summary: "Get all data for a user's timesheet",
            description: 'Timesheet breakup details',
            consumes: ['application/json'],
            produces: ['application/json'],
            // parameters: [{
            //     in: "body",
            //     name: "attnData",
            //     description: "Parameters for getting data",
            //     required: true,
            //     schema: {
            //         type: "object",
            //         required: true,
            //         properties: {
            //             attendance_id: {
            //                 type: "number",
            //                 example: 1,
            //                 default: 0
            //             }
            //         }
            //     }
            // }],
            parameters: [{
                in: 'query',
                name: 'attendance_id',
                schema: { type: 'number', example: 1, default: 0 },
                required: true,
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/timesheet/active-time-attendance': {
        get: {
            tags: ['Timesheet'],
            summary: 'Get all employee active time',
            description: `Get all employee active time`,
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1, default: 0 }, required: true },
                { in: 'query', name: 'department_id', schema: { type: 'number', example: 1, default: 0 }, required: true },
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1, default: 0 }, required: true },
                { in: 'query', name: 'date', schema: { type: 'number', example: 202405 }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /** =========== Reports =============== */
    '/report/download-options': {
        get: {
            tags: ['Report'],
            description: 'Report download option',
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee': {
        post: {
            tags: ['Report'],
            summary: 'Download user report',
            description: 'Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3] },
                        location_id: { type: 'number', example: 1 },
                        role_id: { type: 'number', example: 1 },
                        department_ids: { type: 'string', example: '1,2,3' },
                        startDate: { type: 'string', example: '2019-11-19' },
                        endDate: { type: 'string', example: '2019-11-29' },
                        download_option: { type: 'number', example: 7 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee-report': {
        post: {
            tags: ['Report'],
            summary: 'Custom API for Download user report',
            description: 'Custom Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        date: { type: 'string', example: '2022-07-29' },
                        startTime: { type: 'string', example: '10:00 AM' },
                        endTime: { type: 'string', example: '11:00 AM' },
                    },
                },
            },],

            responses: swaggerHelpers.responseObject,

            security: securityObject,

        },

    },
    '/report/employee-excel': {
        post: {
            tags: ['Report'],
            summary: 'Download user report',
            description: 'Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3] },
                        location_id: { type: 'number', example: 1 },
                        role_id: { type: 'number', example: 1 },
                        department_ids: { type: 'string', example: '1,2,3' },
                        startDate: { type: 'string', example: '2019-11-19' },
                        endDate: { type: 'string', example: '2019-11-29' },
                        download_option: { type: 'number', example: 7 },
                        selected_columns: {
                            type: 'array',
                            example: [
                                "employee_name", "location", "department", "application_used",
                                "start_date", "start_time", "end_date", "end_time", "active_time",
                                "idle_time", "idle_time_in_mins", "total_time", "key_strokes", "category",
                                "active_time_in_mins", "total_time_in_mins"
                            ]
                        },
                        nonAdminId: { type: 'number', example: 7 },
                        searchKeyword: { type: 'string', example: 'empmonitor' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee-csv': {
        post: {
            tags: ['Report'],
            summary: 'Download user report',
            description: 'Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3] },
                        location_id: { type: 'number', example: 1 },
                        role_id: { type: 'number', example: 1 },
                        department_ids: { type: 'string', example: '1,2,3' },
                        startDate: { type: 'string', example: '2019-11-19' },
                        endDate: { type: 'string', example: '2019-11-29' },
                        download_option: { type: 'number', example: 7 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee-appweb-usage': {
        post: {
            tags: ['Report'],
            summary: 'App and Web Usage',
            description: 'App and Web Usage ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'App and Web Usage',
                description: 'App and Web Usage',
                required: false,
                schema: {
                    type: 'object',
                    required: ['startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2], description: '`if you want for particuler employee`' },
                        location_ids: { type: 'array', example: [1, 2], description: '`if you want for particuler location`' },
                        department_ids: { type: 'array', example: [1, 2], description: '`if you want for particuler department`' },
                        sortColumn: { type: 'string', example: 'total_duration' },
                        sortOrder: { type: 'string', example: 'D', description: '`A-ascending and D-descending `' },
                        skip: { type: 'number', example: 0 },
                        limit: { type: 'number', example: 100 },
                        page: { type: 'string', example: 1 },
                        startDate: {
                            type: 'string',
                            example: '2020-09-05',
                        },
                        endDate: { type: 'string', example: '2020-09-05' },
                        request_option: { type: 'number', example: 1, description: '`1-for App and 2-for Website`' },
                        nonAdminId: { type: 'number', example: 25516 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee-login-activity': {
        get: {
            tags: ['Report'],
            summary: 'User Login and LogOut Activity Details',
            description: 'App and Web Usage ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_ids',
                    schema: { type: 'number', example: '1,2' },
                    description: 'if you want for particuler employee',
                },
                {
                    in: 'query',
                    name: 'employee_name',
                    schema: { type: 'number', example: 'abced xyz' },
                    description: 'if you want for particuler employee',
                },
                {
                    in: 'query',
                    name: 'location_ids',
                    schema: { type: 'number', example: '1,2' },
                    description: 'if you want for particuler location',
                },
                {
                    in: 'query',
                    name: 'department_ids',
                    schema: { type: 'number', example: '1,2' },
                    description: 'if you want for particuler department',
                },
                {
                    in: 'query',
                    name: 'sortColumn',
                    schema: { type: 'string' },
                    enum: ['employeeName', 'employeeId', 'organization', 'department', 'type', 'logIn', 'logOut'],
                },
                {
                    in: 'query',
                    name: 'sortOrder',
                    schema: { type: 'string'},
                    enum: ['A','D'],
                    description: '`A-ascending and D-descending`',
                },
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 0 },
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 100 },
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: { type: 'string', example: '2020-09-05' },
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: { type: 'string', example: '2020-09-05' },
                },
                {
                    in: 'query',
                    name: 'type',
                    schema: { type: 'string' },
                    enum:['LogIn','LogIn/LogOut'],
                    description: 'LogIn-for checking login details, LogIn/logOut-for checking both login and logout',
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee-appweb-cumulative-usage': {
        get: {
            tags: ['Report'],
            summary: 'App and Web Cumulative Usage',
            description: 'App and Web Usage ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: "employee_ids",
                schema: { type: 'string', example: "1,2" },
                description: 'if you want for particuler employee'
            },
            {
                in: 'query',
                name: "location_ids",
                schema: { type: 'string', example: "1,2" },
                description: 'if you want for particuler location'
            },
            {
                in: 'query',
                name: "department_ids",
                schema: { type: 'string', example: "1,2" },
                description: 'if you want for particuler department'
            },
            {
                in: 'query',
                name: "sortColumn",
                schema: { type: 'string', example: 'idle' },
                description: 'firstname, email, location, department, name, productive, non_productive, neutral, idle'
            },
            {
                in: 'query',
                name: "sortOrder",
                schema: { type: 'string', example: 'D' },
                description: '`A-ascending and D-descending`'
            },
            {
                in: 'query',
                name: "skip",
                schema: { type: 'number', example: 0 }
            },
            {
                in: 'query',
                name: "limit",
                schema: { type: 'number', example: 100 }
            },
            {
                in: 'query',
                name: "startDate",
                schema: { type: 'string', example: '2020-09-05' }
            },
            {
                in: 'query',
                name: "endDate",
                schema: { type: 'string', example: '2020-09-05' }
            },
            {
                in: 'query',
                name: 'type',
                schema: { type: 'number', example: 1 },
                description: '`1-for App and 2-for Website`'
            },
            {
                in: 'query',
                name: 'nonAdminId',
                schema: { type: 'number', example: 25516 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/employee-appweb-cumulative-usage-dateWise': {
        get: {
            tags: ['Report'],
            summary: 'App and Web Cumulative Usage',
            description: 'App and Web Usage ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: "employee_ids",
                schema: { type: 'string', example: "1,2" },
                description: 'if you want for particuler employee'
            },
            {
                in: 'query',
                name: "location_ids",
                schema: { type: 'string', example: "1,2" },
                description: 'if you want for particuler location'
            },
            {
                in: 'query',
                name: "department_ids",
                schema: { type: 'string', example: "1,2" },
                description: 'if you want for particuler department'
            },
            {
                in: 'query',
                name: "sortColumn",
                schema: { type: 'string', example: 'idle' },
                description: 'firstname, email, location, department, name, productive, non_productive, neutral, idle'
            },
            {
                in: 'query',
                name: "sortOrder",
                schema: { type: 'string', example: 'D' },
                description: '`A-ascending and D-descending`'
            },
            {
                in: 'query',
                name: "skip",
                schema: { type: 'number', example: 0 }
            },
            {
                in: 'query',
                name: "limit",
                schema: { type: 'number', example: 100 }
            },
            {
                in: 'query',
                name: "startDate",
                schema: { type: 'string', example: '2020-09-05' }
            },
            {
                in: 'query',
                name: "endDate",
                schema: { type: 'string', example: '2020-09-05' }
            },
            {
                in: 'query',
                name: 'type',
                schema: { type: 'number', example: 1 },
                description: '`1-for App and 2-for Website`'
            }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/get-dept-rules': {
        post: {
            tags: ['Report'],
            summary: 'get department rules',
            description: 'get department rules ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'get department rules',
                description: 'get department rules',
                required: false,
                schema: {
                    type: 'object',
                    required: ['startDate', 'endDate', 'application_id'],
                    properties: {
                        application_id: { type: 'string', example: '5f4e1150a375d062374bef8f' },
                        employee_ids: { type: 'array', example: [1], description: '`if you want for particuler employee`' },
                        location_ids: { type: 'array', example: [1], description: '`if you want for particuler location`' },
                        department_ids: { type: 'array', example: [1], description: '`if you want for particuler department`' },
                        sortColumn: { type: 'string', example: 'name', description: '`columns includes name, duration`' },
                        sortOrder: { type: 'string', example: 'D', description: '`A-ascending and D-descending `' },
                        search: { type: 'string', example: 'name', description: '`you can search for name of app or website`' },
                        skip: { type: 'number', example: 0 },
                        limit: { type: 'number', example: 100 },
                        startDate: {
                            type: 'string',
                            example: '2020-09-05',
                        },
                        endDate: { type: 'string', example: '2020-09-06' },
                        nonAdminId: { type: 'number', example: 25516 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/anomaly-detection': {
        post: {
            tags: ['Report'],
            summary: 'anomaly-detection',
            description: 'anomaly-detection',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'anomaly-detection',
                description: 'anomaly-detection',
                required: false,
                schema: {
                    type: 'object',
                    required: ['startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1], description: '`if you want for particuler employee`' },
                        location_ids: { type: 'array', example: [1], description: '`if you want for particuler location`' },
                        department_ids: { type: 'array', example: [1], description: '`if you want for particuler department`' },
                        sortColumn: { type: 'string', example: 'total_duration' },
                        sortOrder: { type: 'string', example: 'D', description: '`A-ascending and D-descending `' },
                        skip: { type: 'number', example: 0 },
                        limit: { type: 'number', example: 100 },
                        startDate: {
                            type: 'string',
                            example: '2020-09-05',
                        },
                        endDate: { type: 'string', example: '2020-09-05' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/productivity': {
        get: {
            tags: ['Report'],
            description: '',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number' },
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number' },
            },
            {
                in: 'query',
                name: 'employee_id',
                schema: { type: 'string' },
            },
            {
                in: 'query',
                name: 'startDate',
                schema: {
                    type: 'string',
                    example: moment()
                        .subtract(1, 'days')
                        .format('YYYY-MM-DD'),
                },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: {
                    type: 'string',
                    example: moment().format('YYYY-MM-DD'),
                },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/productivity-list': {
        get: {
            tags: ['Report'],
            description: `sortColumn\n
            'Name','Office Time','Productive','Productivity','Unproductive','Unproductivity','Neutral'\n
            'sortOrder:- A- ascending and D- descending '`,
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'number', example: 1 }, required: false, },
                { in: 'query', name: 'skip', schema: { type: 'number', example: 0 }, required: false, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 10 }, required: true, },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 }, required: true, },
                { in: 'query', name: 'department_id', schema: { type: 'number' }, required: false, },
                { in: 'query', name: 'employee_id', schema: { type: 'string' }, required: false, },
                { in: 'query', name: 'startDate', schema: { type: 'string', example: '2020-04-10' }, required: true, },
                { in: 'query', name: 'endDate', schema: { type: 'string', example: '2020-04-11' }, required: true, },
                { in: 'query', name: 'sortColumn', schema: { type: 'string', example: 'Name' }, },
                { in: 'query', name: 'sortOrder', schema: { type: 'string', example: 'D' }, },
                { in: 'query', name: 'nonAdminId', schema: { type: 'number', example: 25516 }, required: false },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/productivity-list-download': {
        get: {
            tags: ['Report'],
            description: '',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number' },
                required: false,
            },
            {
                in: 'query',
                name: 'employee_id',
                schema: { type: 'string' },
                required: false,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-10' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-04-11' },
                required: true,
            },
            {
                in: 'query',
                name: 'nonAdminId',
                schema: { type: 'number', example: 25516 },
                required: false,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/productivity-new': {
        get: {
            tags: ['Report'],
            description: `sortColumn\n
            'Name','Office Time','Productive','Productivity','Unproductive','Unproductivity','Neutral'\n
            'sortOrder:- A- ascending and D- descending '`,
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 }, required: true },
                { in: 'query', name: 'department_id', schema: { type: 'number' }, required: false },
                { in: 'query', name: 'employee_id', schema: { type: 'string' }, required: false },
                { in: 'query', name: 'startDate', schema: { type: 'string', example: '2020-04-10' }, required: true },
                { in: 'query', name: 'endDate', schema: { type: 'string', example: '2020-04-11' }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/productivity-list-new': {
        get: {
            tags: ['Report'],
            description: `sortColumn\n
            'Name','Office Time','Productive','Productivity','Unproductive','Unproductivity','Neutral'\n
            'sortOrder:- A- ascending and D- descending '`,
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: 0 }, required: false },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 10 }, required: true },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 }, required: true },
                { in: 'query', name: 'department_id', schema: { type: 'number' }, required: false },
                { in: 'query', name: 'employee_id', schema: { type: 'string' }, required: false },
                { in: 'query', name: 'startDate', schema: { type: 'string', example: '2020-04-10' }, required: true },
                { in: 'query', name: 'endDate', schema: { type: 'string', example: '2020-04-11' }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/productivity-list-download-new': {
        get: {
            tags: ['Report'],
            description: `sortColumn\n
            'Name','Office Time','Productive','Productivity','Unproductive','Unproductivity','Neutral'\n
            'sortOrder:- A- ascending and D- descending '`,
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 }, required: true },
                { in: 'query', name: 'department_id', schema: { type: 'number' }, required: false },
                { in: 'query', name: 'employee_id', schema: { type: 'string' }, required: false },
                { in: 'query', name: 'startDate', schema: { type: 'string', example: '2020-04-10' }, required: true },
                { in: 'query', name: 'endDate', schema: { type: 'string', example: '2020-04-11' }, required: true },
                { in: 'query', name: 'is_aligned_by_date', schema: { type: 'string', example: 'false' }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/employee-new': {
        post: {
            tags: ['Report'],
            summary: 'Download user report',
            description: 'Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3] },
                        location_id: { type: 'number', example: 1 },
                        role_id: { type: 'number', example: 1 },
                        department_ids: { type: 'string', example: '1,2,3' },
                        startDate: { type: 'string', example: '2019-11-19' },
                        endDate: { type: 'string', example: '2019-11-29' },
                        download_option: { type: 'number', example: 7 },
                        skip: { type: 'number', example: 0 },
                        limit: { type: 'number', example: 100 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/employee-new-csv': {
        post: {
            tags: ['Report'],
            summary: 'Download user report',
            description: 'Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3] },
                        location_id: { type: 'number', example: 1 },
                        role_id: { type: 'number', example: 1 },
                        department_ids: { type: 'string', example: '1,2,3' },
                        startDate: { type: 'string', example: '2019-11-19' },
                        endDate: { type: 'string', example: '2019-11-29' },
                        download_option: { type: 'number', example: 7 },
                        skip: { type: 'number', example: 0 },
                        limit: { type: 'number', example: 100 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/get-activity-logs': {
        get: {
            tags: ['Report'],
            summary: 'Get Report Activity Log',
            description: 'get Report Activity log ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/user-web-usages': {
        post: {
            tags: ['Report'],
            description: 'user WEB usages \n status: \n\t0 = Neutral \n\t1 = Productive \n\t2 = Unproductive',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'web app usage params',
                required: true,
                schema: {
                    type: 'object',
                    required: ["endDate", "endDate", "appIds", "url_id"],
                    properties: {
                        url_id: { type: 'string', example: '5f5cd1a8bc25c839548252fe', },
                        employee_id: { type: 'number', example: 1, },
                        department_id: { type: 'number', example: 1, },
                        location_id: { type: 'number', example: 1, },
                        startDate: { type: 'string', example: moment().subtract(1, 'days').format('YYYY-MM-DD'), },
                        endDate: { type: 'string', example: moment().format('YYYY-MM-DD') },
                        appIds: { type: 'array', example: ["5f5cd1a8bc25c839548252fe", "5f5cd1a8bc25c839548252fe"] },
                        type: { type: 'number', example: 1, description: '1-app, 2-web' },
                        skip: { type: 'number', example: 0, },
                        limit: { type: 'number', example: 10, },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/web-usages-user-list': {
        post: {
            tags: ['Report'],
            description: 'Users list for web app usage reports',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'UserList',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        startDate: { type: 'string', example: moment().subtract(1, 'days').format('YYYY-MM-DD'), },
                        endDate: { type: 'string', example: moment().format('YYYY-MM-DD') },
                        appIds: { type: 'array', example: ["5f5cd1a8bc25c839548252fe", "5f5cd1a8bc25c839548252fe"] },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/web-usages-weekly': {
        post: {
            tags: ['Report'],
            description: 'Users list for web app usage reports. type - 1 for application usage reports, type - 2 for website usage reports',
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'UserList',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ["start_date", "end_date", "employee_id", "type"],
                        properties: {
                            start_date: { type: 'string', example: moment().subtract(7, 'days').format('YYYY-MM-DD') },
                            end_date: { type: 'string', example: moment().format('YYYY-MM-DD') },
                            employee_id: { type: 'number', example: 27043 },
                            type: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /** ========== Settings ========== */
    '/settings/productivity-rankings': {
        get: {
            tags: ['Settings'],
            description: `status => 0=Neutral 1=Productive 2=Unproductive
             pre_request: 0 -Not Activated ,1-Activated `,
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 25 }, },
                { in: 'query', name: 'category_type', type: 'string', enum: ['All', 'Global', 'Custom', 'New'], },
                { in: 'query', name: 'type', type: 'number', enum: ['1', '2'] },
                { in: 'query', name: 'status', type: 'number', example: 1 },
                { in: 'query', name: 'name', type: 'string', schema: { example: 'account' }, },
                { in: "query", name: "sortColumn", schema: { type: "string", example: 'Name' } },
                { in: "query", name: "sortOrder", schema: { type: "string", example: 'D' } },
                { in: "query", name: "skip", schema: { type: "number", example: 0 } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/productivity-ranking': {
        put: {
            tags: ['Settings'],
            summary: 'Update Productivity-Ranking',
            description: 'Update Productivity-Ranking',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Productivity-Ranking',
                required: true,
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    application_id: {
                                        type: 'string',
                                        example: '54759eb3c090d83494e2d804',
                                    },
                                    department_rules: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                department_id: {
                                                    type: 'number',
                                                },
                                                status: { type: 'number' },
                                                pre_request: { type: 'number' },
                                            },
                                        },
                                    },
                                },
                            },
                            example: [{
                                application_id: '54759eb3c090d83494e2d804',
                                department_rules: [
                                    { department_id: 1, status: 0, pre_request: 1 },
                                    { department_id: 2, status: 1, pre_request: 1 },
                                ],
                            },
                            {
                                application_id: '54759eb3c090d83494e2d804',
                                department_rules: [
                                    { department_id: 1, status: 0, pre_request: 1 },
                                    { department_id: 2, status: 1, pre_request: 1 },
                                ],
                            },
                            ],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/get-uninstall-password': {
        get: {
            tags: ['Settings'],
            description: 'Get Password for Agent Uninstall',
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/update-uninstall-password': {
        post: {
            tags: ['Settings'],
            description: 'Update Password for Agent Uninstall',
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Agent',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['data'],
                        properties: {
                            password: {
                                type: 'string',
                                example: 'password@123',
                            },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/update-agent-notification-status': {
        put: {
            tags: ['Settings'],
            description: 'Update Status for Agent Uninstall Notification Status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Agent Uninstall Notification Status',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['is_enable'],
                        properties: {
                            is_enable: { type: 'string', example: 'true' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/get-agent-notification-status': {
        get: {
            tags: ['Settings'],
            description: 'Fetch Status for Agent Uninstall Notification Status',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/roles': {
        get: {
            tags: ['Settings'],
            description: 'Get Permissions',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'role_id', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'skip', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'Employee' }, },
                { in: 'query', name: 'sortOrder', schema: { type: 'string', example: 'A' }, description: "A-ASC D-DESC" },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/role': {
        post: {
            tags: ['Settings'],
            description: 'Add a role',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Role',
                required: true,
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Group Leader',
                        },
                        permission_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        '/settings/add-HRMS-Role': {
        post: {
            tags: ['Settings'],
                summary: 'Add HRMS role',
                description: 'Add HRMS role',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Role',
                required: true,
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                            role_id: { type: 'number',example: '1'},
                            permission_id: { type: 'number',example: '1'},
                            status: {type: 'number',example: '1' }
                    },
                },
                }],
            responses: swaggerHelpers.responseObject,
                security: securityObject
            }
        },
    },
    '/settings/add-role': {
        post: {
            tags: ['Settings'],
            description: 'Add a role',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Role',
                required: true,
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        name: { type: 'string', example: 'Group Leader', },
                        permission: { type: 'object', example: { "read": "1", "write": "0", "delete": "0" }, },
                        location: { type: 'array', example: [{ location_id: 1, department_ids: [1, 2, 3] }], description: 'Role locatoion with department' },
                        department_ids: { type: 'array', example: [2], description: 'Role departments' }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/clone-role': {
        post: {
            tags: ['Settings'],
            description: 'Copy a role from existing role',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Role',
                required: true,
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        name: { type: 'string', example: 'Group Leader', },
                        role_id: { type: 'number', example: 680, }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/role/permissions': {
        get: {
            tags: ['Settings'],
            description: 'Get Permissions',
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    // "/settings/download-productivity-ranking": {
    //     get: {
    //         tags: ["Settings"],
    //         description: "status => 0=Neutral 1=Productive 2=Unproductive",
    //         produces: ["application/json"],
    //         parameters: [
    //             { in: "query", name: "type", type: "number", enum: ["1", "2"], description: '1:Apps ,2:Web' },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    '/settings/download-productivity-ranking': {
        post: {
            tags: ['Settings'],
            description: 'Download Productivity Ranking',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProductivityData',
                description: 'status => 0=Neutral 1=Productive 2=Unproductive',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        type: { type: 'number', example: '1' },
                        status: { type: 'number', example: '1' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/settings/upload-productivity-ranking': {
        post: {
            tags: ['Settings'],
            description: 'Update Productivity Ranking',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload Productivity Ranking',
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/settings/add-url': {
        post: {
            tags: ['Settings'],
            summary: 'Add New URL',
            description: 'Add New URL With Productivity Ranking.   ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Add New URL',
                required: true,
                schema: {
                    type: 'object',
                    required: ['url', 'department_rules'],
                    properties: {
                        url: {
                            type: 'string',
                            example: 'facebook.com',
                        },
                        department_rules: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    department_id: {
                                        type: 'number',
                                    },
                                    status: { type: 'number' },
                                },
                            },
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },



    /** ========== Dashboard ========== */
    '/dashboard/employees': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'string', example: '2020-05-21' },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/employees-status': {
        get: {
            tags: ['Dashboard'],
            description: 'This is a custom API of DashBoard Employees with rate limit of 30 minutes min.',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'string', example: '2020-05-21' },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/employees_old': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'string', example: '2020-05-21' },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/productivity/organization': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'string', example: '2020-05-20' },
                required: true,
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/productivity/employee': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 2 },
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number', example: 6 },
            },
            {
                in: 'query',
                name: 'from_date',
                schema: { type: 'string', example: '2020-05-20' },
                required: true,
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'string', example: '2020-05-21' },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/productivity/location': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 2 },
            },
            {
                in: 'query',
                name: 'from_date',
                schema: { type: 'string', example: '2020-05-20' },
                required: true,
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'string', example: '2020-05-21' },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/productivity/department': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'department_id',
                schema: { type: 'number', example: 6 },
            },
            {
                in: 'query',
                name: 'from_date',
                schema: { type: 'string', example: '2020-05-20' },
                required: true,
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'string', example: '2020-05-21' },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/active-days': {
        get: {
            tags: ['Dashboard'],
            description: 'Dashboard Employees',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 2 },
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number', example: 6 },
            },
            {
                in: 'query',
                name: 'from_date',
                schema: { type: 'string', example: '2020-05-20' },
                required: true,
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'string', example: '2020-05-22' },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/top-app-web': {
        get: {
            tags: ['Dashboard'],
            description: 'Top Apps/Websites',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'type',
                type: 'number',
                enum: [1, 2],
                description: '1: APP\n2: WEB',
                required: true,
            },
            {
                in: 'query',
                name: 'start_date',
                schema: {
                    type: 'string',
                    example: moment().format('YYYY-MM-DD'),
                },
                required: true,
            },
            {
                in: 'query',
                name: 'end_date',
                schema: {
                    type: 'string',
                    example: moment().format('YYYY-MM-DD'),
                },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/performance': {
        get: {
            tags: ['Dashboard'],
            description: 'Location/Department Performance',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'category',
                type: 'string',
                enum: ['location', 'department'],
                required: true,
            },
            {
                in: 'query',
                name: 'type',
                type: 'string',
                enum: ['pro', 'non', 'neu'],
                required: true,
            },
            {
                in: 'query',
                name: 'start_date',
                schema: {
                    type: 'string',
                    example: moment().format('YYYY-MM-DD'),
                },
                required: true,
            },
            {
                in: 'query',
                name: 'end_date',
                schema: {
                    type: 'string',
                    example: moment().format('YYYY-MM-DD'),
                },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/user/fetch-users': {
        post: {
            tags: ['User'],
            summary: 'Get users with filter',
            description: 'Get users with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get users with filter',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location_id', 'department_id', 'role_id', 'skip', 'limit',],
                    properties: {
                        location_id: { type: 'number', example: '1', description: 'Location filter its default option', },
                        department_id: { type: 'number', example: '1,4', description: 'Department filter its default option', },
                        role_id: { type: 'number', example: '1', description: 'Role filter its default option', },
                        name: { type: 'string', example: 'basavaraj', description: 'Search filter based `first name` and min `3` charecters required', },
                        sortColumn: { type: 'string', example: 'Location', description: 'Column sorting `Full Name,Email,Location,Department,Role,EMP-Code,Agent Version,Computer Name,Username,Domain`', },
                        sortOrder: { type: 'string', example: 'A', description: '`A-ascending and D-descending `', },
                        skip: { type: 'number', example: '0' },
                        limit: { type: 'number', example: '10' },
                        start_date: { type: 'string', example: '2020-08-31' },
                        end_date: { type: 'string', example: '2020-08-31' },
                        status: { type: 'number', example: 1, description: "status must be in [1,2,null,'']" },
                        emp_code: { type: 'string', example: 'GLB-123' },
                        expand: { type: 'number', example: 0 },
                        non_admin_id: { type: 'number', example: 25516 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/fetch-employee': {
        post: {
            tags: ['User'],
            summary: 'Custom Get users with filter',
            description: 'Custom Get users with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get users with filter',
                required: true,
                schema: {
                    type: 'object',
                    properties: {
                        start_date: { type: 'string', example: '2022-07-31' },
                        end_date: { type: 'string', example: '2022-08-10' },
                        status: { type: 'number', example: 1, description: "status must be in [1,2,null,'']" },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/employee-list': {
        post: {
            tags: ['User'],
            summary: 'Get users with filter',
            description: 'Get users with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get users with filter',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'location_id',
                        'department_id',
                        'role_id'
                    ],
                    properties: {
                        location_id: { type: 'number', example: '1', description: 'Location filter its default option', },
                        department_id: { type: 'number', example: '1,4', description: 'Department filter its default option', },
                        role_id: { type: 'number', example: '1', description: 'Role filter its default option', },
                        name: { type: 'string', example: 'basavaraj', description: 'Search filter based `first name` and min `3` charecters required', },
                        status: { type: 'number', example: '1', description: 'Role filter its default option', },
                        non_admin_id: { type: 'number', example: '25516', description: 'Non Admin filter its default option', },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/user-profile-update': {
        post: {
            tags: ['User'],
            description: 'Update user',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: ' userData',
                description: ' Update user details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id', 'first_name', 'last_name', 'project_name', 'email', 'password', 'phone', 'emp_code', 'location_id', 'department_id', 'data_join', 'address', 'role_id',],
                    properties: {
                        userId: { type: 'number', example: '1' },
                        first_name: {
                            type: 'string',
                            example: 'Basavaraj',
                        },
                        last_name: {
                            type: 'string',
                            example: 'Basavaraj S',
                        },
                        email: {
                            type: 'string',
                            example: 'basavaraj@gmail.com',
                        },
                        project_name: { type: 'string', example: 'EmpMonitor' },
                        password: {
                            type: 'string',
                            example: 'Basavaraj@1234',
                        },
                        phone: { type: 'string', example: '7829552217' },
                        emp_code: {
                            type: 'string',
                            example: 'GLB-BAN-414',
                        },
                        location_id: { type: 'number', example: '1' },
                        department_id: { type: 'number', example: '1' },
                        address: { type: 'string', example: 'dfjfrf' },
                        role_id: { type: 'number', example: '1,3' },
                        shift_id: { type: 'number', example: 1 },
                        manager_role_id: {
                            type: "number",
                            example: "230"
                        },
                        assigned_manager: {
                            type: "array",
                            example: ["25280", "25277"]
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/user-register': {
        post: {
            tags: ['User'],
            description: 'Add user',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: ' userData',
                description: 'Add User',
                required: true,
                schema: {
                    type: 'object',
                    required: ['first_name', 'last_name', 'email', 'project_name', 'password', 'phone', 'emp_code', 'location_id', 'department_id', 'data_join', 'address', 'role_id',],
                    properties: {
                        first_name: { type: 'string', example: 'Basavaraj' },
                        last_name: { type: 'string', example: 'Basavaraj S' },
                        email: { type: 'string', example: 'basavaraj@gmail.com', },
                        project_name: { type: 'string', example: 'EmpMonitor' },
                        password: { type: 'string', example: 'Basavaraj@1234', description: 'Your Password must atleast consist `1 upppercase 1 lowercase 1numeric charecter 1 special charecter and length 6-20', },
                        phone: { type: 'string', example: '7829552217' },
                        emp_code: { type: 'string', example: 'GLB-BAN-414' },
                        location_id: { type: 'number', example: '1' },
                        department_id: { type: 'number', example: '1' },
                        date_join: { type: 'string', example: '11/18/2019', description: 'Date format `MM-DD-YYYY`', },
                        address: { type: 'string', example: 'dfjfrf' },
                        role_id: { type: 'array', example: "33,120" },
                        timezone: { type: 'string', example: 'Asia/Kolkata' },
                        timezone_offset: { type: 'number', example: '330' },
                        shift_id: { type: 'number', example: 1 },
                        manager_role_id: {
                            type: "number",
                            example: "230"
                        },
                        assigned_manager: {
                            type: "array",
                            example: ["25280", "25277"]
                        },
                        is_mobile: { type: 'number', example: 0 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/get-non-admin': {
        get: {
            tags: ['User'],
            summary: 'Get all non admin list',
            description: 'Get all non admin list who does not have employee role',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                type: 'number',
                default: 613,
            }, {
                in: 'query',
                name: 'department_id',
                type: 'number',
                default: 499,
            }, {
                in: 'query',
                name: 'role_id',
                type: 'number',
                default: 553,
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }

    },
    '/user/users': {
        post: {
            tags: ['User'],
            summary: 'Get users with filter',
            description: 'Get users with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get users with filter',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location_id', 'department_id', 'role_id'],
                    properties: {
                        location_id: { type: 'number', example: '1' },
                        department_id: { type: 'number', example: '1,4' },
                        role_id: { type: 'number', example: '1' },
                        status: { type: 'number', example: '1', description: '1-Active ,2-Inactive' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/get-user': {
        post: {
            tags: ['User'],
            summary: 'Get user details',
            description: 'Get users details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get users details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'number', example: '1' },
                        role_id: { type: 'number', example: '230' }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/user-delete-multiple': {
        delete: {
            tags: ['User'],
            summary: 'Delete multiple user',
            description: 'Delete multiple user',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Delete Employee',
                description: 'Delete multiple user',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_ids'],
                    properties: {
                        user_ids: {
                            type: 'array',
                            example: [1, 2],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/update-user-status': {
        put: {
            tags: ['User'],
            summary: 'Update user status',
            description: 'Update user status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'usereData',
                description: 'Update user status',
                required: true,
                schema: {
                    type: 'object',
                    required: ['status', 'user_ids'],
                    properties: {
                        user_ids: {
                            type: 'array',
                            example: [1, 2],
                            description: 'Pass list of user ids',
                        },
                        status: {
                            type: 'number',
                            example: '2',
                            description: 'status `1-active`, `2-supend or inactive`',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/user-register-bulk': {
        post: {
            tags: ['User'],
            description: 'Upload domain',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'count',
                type: 'number',
                required: true,
                description: 'Total package count in number',
            },
            {
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload User Details.',
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/user-delete-bulk': {
        post: {
            tags: ['User'],
            description: 'Bulk delete user via email',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'count',
                    type: 'number',
                    required: true,
                    description: 'Total package count in number',
                },
                {
                    in: 'formData',
                    name: 'file',
                    type: 'file',
                    required: true,
                    description: 'Upload User Details.',
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/bulk-update': {
        post: {
            tags: ['User'],
            description: 'Bulk Update Employee Details',
            summary: 'Bulk Update Employee Details',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload User Details.',
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/upgrade-downgrade-user': {
        put: {
            tags: ['User'],
            summary: 'Upgrade and downgrade user',
            description: 'Upgrade and downgrade user',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'usereData',
                description: 'Upgrade and downgrade user',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id', 'role_id'],
                    properties: {
                        user_id: {
                            type: 'number',
                            example: '2',
                            description: 'User id for which wants to upgrade or downgrade',
                        },
                        role_id: {
                            type: 'number',
                            example: '2',
                            description: 'Role id of which role wants to upgrade or downgrade',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/user-assign': {
        post: {
            tags: ['User'],
            summary: 'Assign user to manager and teamlead',
            description: 'Assign user to manager',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'usereData',
                description: 'Assign user to manager and teamlead',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'user_multi_manager',
                        'user_teamlead',
                        'user_manager',
                    ],
                    properties: {
                        user_multi_manager: {
                            type: 'object',
                            properties: {
                                user_id: { type: 'number', example: '1' },
                                manager_ids: {
                                    type: 'array',
                                    example: [1, 2, 3, 4],
                                },
                            },
                        },
                        user_teamlead: {
                            type: 'object',
                            properties: {
                                user_ids: {
                                    type: 'array',
                                    example: [1, 2, 3, 4],
                                },
                                teamlead_id: {
                                    type: 'number',
                                    example: '1',
                                },
                            },
                        },
                        user_manager: {
                            type: 'object',
                            properties: {
                                user_ids: {
                                    type: 'array',
                                    example: [1, 2, 3, 4],
                                },
                                manager_id: {
                                    type: 'number',
                                    example: '1',
                                },
                            },
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/employee-assign': {
        post: {
            tags: ['User'],
            summary: 'Assign employee to upperole',
            description: 'Assign employee to upperole',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'usereData',
                description: 'Assign employee to upperole',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'employee_multi_upperole',
                        'employee_to_assign',
                    ],
                    properties: {
                        employee_multi_upperole: {
                            type: 'object',
                            properties: {
                                user_id: { type: 'number', example: '1' },
                                role_id: { type: 'number', example: '1' },
                                to_assign_ids: {
                                    type: 'array',
                                    example: [1, 2, 3, 4],
                                },
                            },
                        },
                        employee_to_assign: {
                            type: 'object',
                            properties: {
                                user_ids: {
                                    type: 'array',
                                    example: [1, 2, 3, 4],
                                },
                                to_assign_id: {
                                    type: 'number',
                                    example: '1',
                                },
                                role_id: { type: 'number', example: '1' },
                            },
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/user/assign-shift-bulk-employees": {
        put: {
            tags: ["User"],
            summary: "Update Shift of Employees",
            description: "Updates Shift-Id for Bulk Employees ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "assignShift",
                description: "Updates Shift-Id",
                required: true,
                schema: {
                    type: "object",
                    required: ["shift_id", "employees_id"],
                    properties: {
                        shift_id: {
                            type: "number",
                            example: 21
                        },
                        employees_id: {
                            type: "array",
                            example: [54244, 54245]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/user/removed-user-list': {
        get: {
            tags: ['User'],
            summary: 'Removed User List',
            description: 'Removed User List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'fromDate',
                schema: { type: 'number', example: '2021-04-21' },
                description: "Date mast be format 'YYYY-MM-DD' (ex. moment(date).format(YYYY-MM-DD))",
                default: `${moment().format('YYYY-MM-DD')}`
            },
            {
                in: 'query',
                name: 'toDate',
                schema: { type: 'number', example: '2021-04-21' },
                description: "Date mast be format 'YYYY-MM-DD' (ex. moment(date).format(YYYY-MM-DD))",
                default: `${moment().format('YYYY-MM-DD')}`
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 10 },
                description: 'Count employees, that will be skip',
                default: 0,
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 5 },
                description: 'The amount of data per page',
                default: 10,
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: 'emp' },
                description: 'Searches for records by keyword',

            },
            {
                in: 'query',
                name: 'sortColumn',
                schema: { type: 'string', example: 'name', },
                description: 'Sort result by selected field',
                enum: ['Full Name', 'Email', 'Removed Admin Email', 'Computer Name', 'Date']

            },
            {
                in: 'query',
                name: 'sortOrder',
                schema: { type: 'string', example: 'D', default: 'A' },
                description: 'Order of sort',
                enum: ['A', 'D']

            },


            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/user-tracking-setting': {
        post: {
            tags: ['Settings'],
            summary: 'Update user tracking setting',
            description: 'Update user tracking setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'settData',
                description: 'Parameters for getting data',
                required: true,
                schema: schemas.empAdvancedSettingsUpdate,
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/settings/get-emp-setting-trac': {
        post: {
            tags: ['Settings'],
            summary: 'Get user tracking setting',
            description: 'Get user tracking setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'settData',
                description: 'Parameters for getting data',
                required: true,
                schema: {
                    type: 'object',
                    required: true,
                    properties: {
                        employee_id: { type: 'number', example: 1 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/options': {
        get: {
            tags: ['Settings'],
            description: 'Settings options',
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/group-web-blocking': {
        post: {
            tags: ['Settings'],
            summary: 'Update user bulk Web Block',
            description: 'Update user bulk Web Block',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'settData',
                description: 'Parameters for update data',
                required: true,
                schema: {
                    type: 'object',
                    required: true,
                    properties: {
                        group_id: { type: 'number', example: 1 },
                        website: { type: 'array', example: ["www.google.com", "www.facebook.com"], },
                        type: { type: 'number', example: 1 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/settings/get-group-web-blocking': {
        get: {
            tags: ['Settings'],
            summary: 'Update user bulk Web Block',
            description: 'Update user bulk Web Block',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{ in: 'query', name: 'group_id', schema: { type: 'number', example: '0' }, }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/organization/get-role': {
        get: {
            tags: ['Organization'],
            summary: 'Get role',
            description: 'Get role',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/organization/upload-logo': {
        get: {
            tags: ['Organization'],
            summary: 'Get org logo',
            description: 'Get org logo',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Organization'],
            summary: 'Get role',
            description: 'Get role',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload Bank/Basic details',
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/add-field-users': {
        post: {
            tags: ['User'],
            summary: 'Export users to field tracking',
            description: 'Export users to field trackings',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'userData',
                    description: 'Parameters for user data',
                    required: true,
                    schema: {
                        type: 'object',
                        required: true,
                        properties: {
                            usersData: { type: 'array', example: [  
                                {
                                    "id": 29017,
                                    "first_name": "Rithika",
                                    "name": "Rithika",
                                    "last_name": "A",
                                    "email": "rithika.r12@globussoft.in",
                                    "phone": "91-8412579632",
                                    "date_join": null,
                                    "address": null,
                                    "photo_path": "/default/profilePic/user.png",
                                    "organization_id": 246,
                                    "location": "belgum",
                                    "emp_code": "Ri24",
                                    "timezone": "Africa/Johannesburg",
                                    "department": "Devops",
                                    "role": "Employee",
                                    "full_name": "Rithika A",
                                    "password": "Rithika@124",
                                   
                         } ] },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    /**Settings */
    '/storage/get-storage-types': {
        get: {
            tags: ['Storage'],
            summary: 'Get storage types',
            description: 'Get storage types',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/storage/add-storage-data': {
        post: {
            tags: ['Storage'],
            summary: 'Add storage data',
            description: 'Add storage data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'storageData',
                description: 'Add storage data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['storage_type_id'],
                    properties: {
                        storage_type_id: {
                            type: 'number',
                            example: '1',
                        },
                        username: {
                            type: 'string',
                            example: 'username',
                        },
                        password: {
                            type: 'string',
                            example: 'password',
                        },
                        port: {
                            type: 'number',
                            example: 21,
                        },
                        host: {
                            type: 'string',
                            example: 'localhost',
                        },
                        ftp_path: {
                            type: 'string',
                            example: 'public',
                        },
                        desktop_access_token: {
                            type: 'string',
                            example: 'desktop',
                        },
                        web_access_token: {
                            type: 'string',
                            example: 'web',
                        },
                        application_id: {
                            type: 'string',
                            example: 'applicationId',
                        },
                        refresh_token: {
                            type: 'string',
                            example: 'refreshtoken',
                        },
                        admin_email: {
                            type: 'string',
                            example: 'admin@gmail.com',
                        },
                        client_id: {
                            type: 'string',
                            example: 'cccccc',
                        },
                        client_secret: {
                            type: 'string',
                            example: 'csssssss',
                        },
                        token: {
                            type: 'string',
                            example: 'ttttttttttt',
                        },
                        api_key: {
                            type: 'string',
                            example: 'apiiiiiiiiiii',
                        },
                        bucket_name: {
                            type: 'string',
                            example: 'bucketname',
                        },
                        region: {
                            type: 'string',
                            example: 'bucket-region',
                        },

                        zoho_client_id: {
                            type: 'string',
                            example: 'zoho_client_id',
                        },
                        zoho_client_secret: {
                            type: 'string',
                            example: 'zoho_client_secret',
                        },
                        zoho_refresh_token: {
                            type: 'string',
                            example: 'zoho_refresh_token'
                        },
                        team_id: {
                            type: 'string',
                            example: 'vl0kjdc43b56c5f754ec1a274c210cffe27f7'
                        },
                        domain: {
                            type: 'string',
                            example: 'com'
                        },

                        onedrive_client_id: {
                            type: 'string',
                            example: 'onedrive_client_id',
                        },
                        onedrive_client_secret: {
                            type: 'string',
                            example: 'onedrive_client_secret',
                        },
                        onedrive_redirect_url: {
                            type: 'string',
                            example: 'onedrive_redirect_url',
                        },

                        auto_delete_period: {
                            type: 'number',
                            example: 30,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/storage/get-storage-type-with-data': {
        get: {
            tags: ['Storage'],
            summary: 'Get storage types with data',
            description: 'Get storage types with data',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/storage/update-storage-option': {
        put: {
            tags: ['Storage'],
            summary: 'Update storage option',
            description: 'Update storage option',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'storageData',
                description: 'Update storage option',
                required: true,
                schema: {
                    type: 'object',
                    required: ['storage_data_id', 'status'],
                    properties: {
                        storage_data_id: {
                            type: 'number',
                            example: '1',
                        },
                        status: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/storage/delete-storage-data': {
        delete: {
            tags: ['Storage'],
            summary: 'Delete storage data',
            description: 'Delete storage data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'storageData',
                description: 'Delete storage data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['storage_data_id'],
                    properties: {
                        storage_data_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/storage/update-storage-data': {
        put: {
            tags: ['Storage'],
            summary: 'Update storage data',
            description: 'Update storage data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'storageData',
                description: 'Update storage data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['storage_data_id'],
                    properties: {
                        storage_data_id: {
                            type: 'number',
                            example: '1',
                        },
                        username: {
                            type: 'string',
                            example: 'username',
                        },
                        password: {
                            type: 'string',
                            example: 'password',
                        },
                        port: {
                            type: 'number',
                            example: 21,
                        },
                        host: {
                            type: 'string',
                            example: 'localhost',
                        },
                        ftp_path: {
                            type: 'string',
                            example: 'public',
                        },
                        desktop_access_token: {
                            type: 'string',
                            example: 'desktop',
                        },
                        web_access_token: {
                            type: 'string',
                            example: 'web',
                        },
                        application_id: {
                            type: 'string',
                            example: 'applicationId',
                        },
                        refresh_token: {
                            type: 'string',
                            example: 'refreshtoken',
                        },
                        admin_email: {
                            type: 'string',
                            example: 'admin@gmail.com',
                        },
                        client_id: {
                            type: 'string',
                            example: 'cccccc',
                        },
                        client_secret: {
                            type: 'string',
                            example: 'csssssss',
                        },
                        token: {
                            type: 'string',
                            example: 'ttttttttttt',
                        },
                        api_key: {
                            type: 'string',
                            example: 'apiiiiiiiiiii',
                        },
                        bucket_name: {
                            type: 'string',
                            example: 'bucketname',
                        },
                        region: {
                            type: 'string',
                            example: 'bucket-region',
                        },

                        zoho_client_id: {
                            type: 'string',
                            example: 'zoho_client_id',
                        },
                        zoho_client_secret: {
                            type: 'string',
                            example: 'zoho_client_secret',
                        },
                        zoho_refresh_token: {
                            type: 'string',
                            example: 'zoho_refresh_token'
                        },
                        team_id: {
                            type: 'string',
                            example: 'vl0kjdc43b56c5f754ec1a274c210cffe27f7'
                        },
                        domain: {
                            type: 'string',
                            example: 'com'
                        },

                        onedrive_client_id: {
                            type: 'string',
                            example: 'onedrive_client_id',
                        },
                        onedrive_client_secret: {
                            type: 'string',
                            example: 'onedrive_client_secret',
                        },
                        onedrive_redirect_url: {
                            type: 'string',
                            example: 'onedrive_redirect_url',
                        },

                        auto_delete_period: {
                            type: 'number',
                            example: 30,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/storage/active-storage-type': {
        get: {
            tags: ['Storage'],
            summary: 'Get active storage types',
            description: 'Get active storage types',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    /**Departments */
    '/department/create-departments': {
        post: {
            tags: ['Department'],
            summary: 'Create department',
            description: 'Create department',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'departmentData',
                description: 'Department details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Android',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/department/get-departments': {
        post: {
            tags: ['Department'],
            summary: 'Get department details',
            description: 'Get departments',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'departmentData',
                description: 'Department details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['skip', 'limit'],
                    properties: {
                        skip: { type: 'number', example: '0' },
                        limit: { type: 'number', example: '10' },
                        name: { type: 'string', example: 'node' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/department/update-department': {
        put: {
            tags: ['Department'],
            summary: 'Update department',
            description: 'Update department',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'departmentData',
                description: 'Update department',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'department_id'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Android',
                        },
                        department_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/department/delete-department': {
        delete: {
            tags: ['Department'],
            summary: 'Delete department',
            description: 'Delete department',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'departmentData',
                description: 'Delete Department',
                required: true,
                schema: {
                    type: 'object',
                    required: ['department_id'],
                    properties: {
                        department_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/department/delete-department-new': {
        delete: {
            tags: ['Department'],
            summary: 'Delete department',
            description: 'Delete department',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'departmentData',
                    description: 'Delete Department',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['department_id'],
                        properties: {
                            department_id: {
                                type: 'number',
                                example: '1',
                            },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    /**Locations */
    '/location/roles': {
        get: {
            tags: ['Location'],
            description: 'Roles',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'role_id', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: '1' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/location/add-location': {
        post: {
            tags: ['Location'],
            summary: 'Add Location.',
            description: 'Add New Location.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'AddLocationData',
                description: 'Add New Location.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location'],
                    properties: {
                        location: {
                            type: 'string',
                            example: 'Bengaluru',
                        },
                        department_id: {
                            type: 'string',
                            example: '1,2,3',
                        },
                        department_name: {
                            type: 'array',
                            example: ['Node js', 'PHP'],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/location/get-locations': {
        post: {
            tags: ['Location'],
            summary: 'Get location',
            description: 'Get location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Get location',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        role_id: { type: 'number', example: '0', }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/location/update-location': {
        put: {
            tags: ['Location'],
            summary: 'Update location',
            description: 'Update location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Update location',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location_id'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Benglore',
                        },
                        timezone: {
                            type: 'string',
                            example: 'Asia/Kolkata',
                        },
                        location_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/location/delete-location': {
        delete: {
            tags: ['Location'],
            summary: 'Delete location',
            description: 'Delete location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Delete location',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location_id'],
                    properties: {
                        location_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/location/get-locations-dept': {
        post: {
            tags: ['Location'],
            summary: 'Get location',
            description: 'Get location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Get location',
                required: true,
                schema: {
                    type: 'object',
                    required: ['skip', 'limit'],
                    properties: {
                        skip: {
                            type: 'number',
                            example: '0',
                        },
                        limit: {
                            type: 'number',
                            example: '10',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/location/add-department-location': {
        post: {
            tags: ['Location'],
            summary: 'Get location',
            description: 'Get location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Get location',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location_id', 'department_ids'],
                    properties: {
                        location_id: {
                            type: 'number',
                            example: '1',
                        },
                        department_ids: {
                            type: 'array',
                            example: [1, 2],
                        },
                        department_name: {
                            type: 'array',
                            example: ['Node js', 'php'],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/location/delete-dept-location': {
        delete: {
            tags: ['Location'],
            summary: 'Delete department from location',
            description: 'Delete department from location',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Delete department from location',
                required: true,
                schema: {
                    type: 'object',
                    required: ['location_id', 'department_id'],
                    properties: {
                        location_id: {
                            type: 'number',
                            example: '1',
                        },
                        department_id: {
                            type: 'number',
                            example: '1,2,3',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/location/get-department-by-location': {
        post: {
            tags: ['Location'],
            summary: 'Get department by locations',
            description: 'Get department by locations',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Get department by locations',
                required: false,
                schema: {
                    type: 'object',
                    properties: {
                        location_id: { type: 'number', example: '1', },
                        role_id: { type: 'number', example: '1', },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/user/get-assigned-employee': {
        post: {
            tags: ['User'],
            summary: 'Get assigned employees ',
            description: 'Get assigned employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get assigned employees',
                required: true,
                schema: {
                    type: 'object',
                    required: ['to_assigned_id'],
                    properties: {
                        to_assigned_id: { type: 'number', example: '1', },
                        location_id: { type: 'number', example: '1', },
                        department_id: { type: 'string', example: '1,2', },
                        sortColumn: { type: 'string', example: 'Location', description: 'Column sorting `Full Name,Email,Location,Department,Role,EMP-Code,Agent Version`', },
                        sortOrder: { type: 'string', example: 'A', description: '`A-ascending and D-descending `', },
                        skip: { type: 'number', example: '0' },
                        limit: { type: 'number', example: '10' },
                        start_date: { type: 'string', example: '2020-08-31' },
                        end_date: { type: 'string', example: '2020-08-31' },
                        status: { type: 'number', example: 1, description: "status must be in [1,2,null,'']" },
                        to_assign_role_id: { type: 'number', example: '1' },
                        emp_code: { type: 'string', example: 'GLB-123' },
                        expand: { type: 'number', example: 0 },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/unassign-user': {
        delete: {
            tags: ['User'],
            summary: 'Unassign user ',
            description: 'Unassign user',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'usereData',
                description: 'Unassign user',
                required: true,
                schema: {
                    type: 'object',
                    required: ['to_assigned_id', 'user_ids'],
                    properties: {
                        user_ids: { type: 'array', example: [1, 2, 3, 4] },
                        to_assigned_id: { type: 'number', example: '1' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/get-screenshots': {
        post: {
            tags: ['User'],
            summary: 'Get screenshot data',
            description: 'Get screenshot data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get screenshot data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id', 'date', 'from_hour', 'to_hour'],
                    properties: {
                        user_id: { type: 'number', example: '1' },
                        date: {
                            type: 'string',
                            example: '2019-12-23',
                            description: 'Date format must be `YYYY-MM-DD`',
                        },
                        from_hour: {
                            type: 'number',
                            example: '10',
                            description: 'From hour `0-23`',
                        },
                        to_hour: {
                            type: 'number',
                            example: '11',
                            description: 'To hour `0-23`',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/user/get-screenshots-new': {
        post: {
            tags: ['User'],
            summary: 'Get screenshot data',
            description: 'Get screenshot data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get screenshot data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id', 'date', 'from_hour', 'to_hour'],
                    properties: {
                        user_id: { type: 'number', example: '1' },
                        date: {
                            type: 'string',
                            example: '2019-12-23',
                            description: 'Date format must be `YYYY-MM-DD`',
                        },
                        from_hour: {
                            type: 'number',
                            example: '10',
                            description: 'From hour `0-23`',
                        },
                        to_hour: {
                            type: 'number',
                            example: '11',
                            description: 'To hour `0-23`',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/user/get-screen-records': {
        post: {
            tags: ['User'],
            summary: 'Get screen records data',
            description: 'Get screen records data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get screen records data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id', 'date', 'from_hour', 'to_hour'],
                    properties: {
                        user_id: { type: 'number', example: '1' },
                        date: {
                            type: 'string',
                            example: '2019-12-23',
                            description: 'Date format must be `YYYY-MM-DD`',
                        },
                        from_hour: {
                            type: 'number',
                            example: '10',
                            description: 'From hour `0-23`',
                        },
                        to_hour: {
                            type: 'number',
                            example: '11',
                            description: 'To hour `0-23`',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/user/employee-assigned-to': {
        post: {
            tags: ['User'],
            summary: 'Get employee assgned to by role id',
            description: 'Get employee assgned to by role id',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Get employee assgned to by role id',
                required: true,
                schema: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'number', example: '1' },
                        role_id: { type: 'number', example: '1' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/upload-profilepic-drive': {
        post: {
            tags: ['User'],
            description: 'Add profilepic',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'user_id',
                type: 'number',
                required: true,
            },
            {
                in: 'formData',
                name: 'avatar',
                type: 'file',
                required: false,
                description: 'Upload profilePic.',
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /**organization Features */

    "/organization/update-org-details": {
        put: {
            tags: ["Organization"],
            summary: "Update Orgnization details.",
            description: "Update Orgnization details.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "OrgData",
                description: "Update Orgnization details.",
                required: true,
                schema: {
                    type: "object",
                    required: ["timezone", 'email'],
                    properties: {
                        timezone: { type: "string", example: "Asia/Kolkata", description: "Organization timezone" },
                        language: {
                            type: "string",
                            enum: ["en", "es", "idn", "fr", "ar"],
                            description: `Organization languages=> [{ 'name': "English", "code": "en" }, { 'name': "Spanish", "code": "es" }, { 'name': "Indonesian", "code": "idn" }, { 'name': "French", "code": "fr" }, { 'name': "Arabic", "code": "ar" }]`
                        },
                        weekday_start: { type: "string", enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], description: "Organization weekday_start" },
                        email: { type: "string", example: "abc@gmail.com", description: "User email" }
                    }
                }
            }],
            security: securityObject,
            responses: swaggerHelpers.responseObject
        }
    },
    "/organization/organization-details": {
        get: {
            tags: ["Organization"],
            summary: "Orgnization details.",
            description: "Orgnization details.",
            consumes: ["application/json"],
            produces: ["application/json"],
            security: securityObject,
            responses: swaggerHelpers.responseObject
        }
    },
    "/organization/admin-feature": {
        get: {
            tags: ['Organization'],
            summary: 'Get Admin Features',
            description: 'Admin Features',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    // '/organization/update-feature': {
    //     post: {
    //         tags: ['Organization'],
    //         summary: 'Update Admin Features',
    //         description: 'Admin Features',
    //         consumes: ['application/json'],
    //         produces: ['application/json'],
    //         parameters: [
    //             {
    //                 in: 'body',
    //                 name: 'features',
    //                 description: 'admin features status',
    //                 required: true,
    //                 schema: {
    //                     type: 'object',
    //                     required: [],
    //                     properties: {
    //                         screenshot_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         website_analytics_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         application_analytics_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         keystroke_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         browser_history_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         user_log_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         firewall_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         domain_enabled: {
    //                             type: 'number',
    //                             example: 1,
    //                         },
    //                         screenshot_capture_interval: {
    //                             type: 'number',
    //                             example: '30',
    //                         },
    //                         ideal_time: {
    //                             type: 'number',
    //                             example: '5',
    //                         },

    //                         product_id: {
    //                             type: 'number',
    //                             example: 1,
    //                         },

    //                         expire_date: {
    //                             type: 'string',
    //                             example: '2019-01-26T18:30:00.000Z',
    //                         },
    //                     },
    //                 },
    //             },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject,
    //     },
    // },

    '/ip-whitelist/add-ip-whitelist': {
        post: {
            tags: ['Ip-Whitelist'],
            summary: 'add IP to whitelist ',
            description: 'add IP to whitelist  ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'add IP to whitelist  ',
                description: 'add IP to whitelist ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['ip'],
                    properties: {
                        ip: {
                            type: 'string',
                            example: '44.21.45.145',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/ip-whitelist/get-ip-whitelist': {
        post: {
            tags: ['Ip-Whitelist'],
            summary: 'get IP whitelist ',
            description: 'get IP whitelist  ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'get IP whitelist ',
                description: 'get IP whitelist ',
                required: false,
                schema: {
                    type: 'object',
                    properties: {
                        skip: {
                            type: 'number',
                            example: '0',
                        },
                        limit: {
                            type: 'number',
                            example: '10',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/ip-whitelist/delete-ip-whitelist': {
        post: {
            tags: ['Ip-Whitelist'],
            summary: 'delete IP ',
            description: 'delete IP from whitelis',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'delete IP from whitelis ',
                description: 'delete IP from whitelis ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['ip_id'],
                    properties: {
                        ip_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/ip-whitelist/edit-ip-whitelist': {
        post: {
            tags: ['Ip-Whitelist'],
            summary: 'Edit IP ',
            description: ' edit whitelis IP',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'edit whitelis IP ',
                description: 'edit whitelis IP',
                required: true,
                schema: {
                    type: 'object',
                    required: ['ip_id', 'ip'],
                    properties: {
                        ip_id: {
                            type: 'number',
                            example: '1',
                        },
                        ip: {
                            type: 'number',
                            example: '14.45.87.123',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /**Firewall */
    '/firewall/add-category': {
        post: {
            tags: ['Firewall'],
            summary: 'Add category ',
            description: '',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Add category ',
                description: 'Add category ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'categoryName',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/get-category': {
        get: {
            tags: ['Firewall'],
            description: 'To get category',
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/firewall/update-category': {
        put: {
            tags: ['Firewall'],
            summary: 'Update category details',
            description: 'Update category details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'categoryData',
                description: 'Update category details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['category_id', 'name'],
                    properties: {
                        category_id: {
                            type: 'number',
                            example: '1',
                        },
                        name: {
                            type: 'string',
                            example: 'Sports',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/delete-category': {
        delete: {
            tags: ['Firewall'],
            summary: 'Delete category details',
            description: 'Delete category details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'categoryData',
                description: 'Delete category details',
                required: true,
                schema: {
                    type: 'object',
                    required: ['category_id'],
                    properties: {
                        category_id: {
                            type: 'number',
                            example: [1, 2],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/firewall/add-domain': {
        post: {
            tags: ['Firewall'],
            summary: 'Add domain ',
            description: 'Create a Post',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Add domain ',
                description: 'Add new domain ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'category_id'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'flipkart.com',
                        },
                        category_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/domains': {
        get: {
            tags: ['Firewall'],
            summary: 'View domain.',
            description: 'View domain.',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/delete-domains': {
        delete: {
            tags: ['Firewall'],
            summary: 'Delete Domains .',
            description: 'Delete Domains .',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'deleteDomain',
                description: 'Delete Domains .',
                required: true,
                schema: {
                    type: 'object',
                    required: ['domain_ids'],
                    properties: {
                        domain_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/update-domain': {
        put: {
            tags: ['Firewall'],
            summary: 'Update domain.',
            description: 'Update domain.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Update domain.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['domain_id', 'domain_name', 'categories_id'],
                    properties: {
                        categories_id: {
                            type: 'number',
                            example: '1',
                        },
                        domain_id: {
                            type: 'number',
                            example: '1',
                        },
                        domain_name: {
                            type: 'string',
                            example: 'www.google.com',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/get-category-domains': {
        get: {
            tags: ['Firewall'],
            description: 'To get category',
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/firewall/add-domain-bulk': {
        post: {
            tags: ['Firewall'],
            summary: 'Add domain in bulk.',
            description: 'Add domain in bulk.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Add domain in bulk.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['categories_id', 'domains'],
                    properties: {
                        categories_id: {
                            type: 'number',
                            example: '1',
                        },
                        domains: {
                            type: 'array',
                            example: ['www.google.com', 'www.w3school.com'],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/block-user-dept-domains': {
        post: {
            tags: ['Firewall'],
            summary: 'Block user and department domains',
            description: 'Block user and department domains',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Block user and department domains',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'entity_type',
                        'entity_ids',
                        'domain_ids',
                        'category_ids',
                        'days_ids',
                    ],
                    properties: {
                        entity_type: {
                            type: 'string',
                            example: 'U',
                        },
                        entity_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        domain_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        category_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        days_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/get-blocked-user-dept-domains': {
        post: {
            tags: ['Firewall'],
            summary: 'Get blocked user and department domains',
            description: 'Get blocked user and department domains',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Get blocked user and department domains',
                required: true,
                schema: {
                    type: 'object',
                    required: ['skip', 'limit'],
                    properties: {
                        skip: {
                            type: 'number',
                            example: '0',
                        },
                        limit: {
                            type: 'number',
                            example: '10',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/update-status-blocked-user-dept-domains': {
        put: {
            tags: ['Firewall'],
            summary: 'Update user and department domains status',
            description: 'Update user and department domains status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ruleData',
                description: 'Update user and department domains status',
                required: true,
                schema: {
                    type: 'object',
                    required: ['blocked_rule_id', 'status'],
                    properties: {
                        rule_data: {
                            type: 'array',
                            example: [{
                                blocked_rule_id: 1,
                                status: 1,
                            },
                            {
                                blocked_rule_id: 2,
                                status: 0,
                            },
                            ],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/delete-blocked-user-dept-domains': {
        delete: {
            tags: ['Firewall'],
            summary: 'Delete blocked user and department domains',
            description: 'Delete blocked user and department domains',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Delete blocked user and department domains',
                required: true,
                schema: {
                    type: 'object',
                    required: ['blocked_rule_id'],
                    properties: {
                        blocked_rule_id: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/update-blocked-user-dept-domains': {
        put: {
            tags: ['Firewall'],
            summary: 'Update user and department domains',
            description: 'Update user and department domains',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Update user and department domains',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'blocked_rule_id',
                        'entity_type',
                        'entity_ids',
                        'domain_ids',
                        'category_ids',
                        'days_ids',
                    ],
                    properties: {
                        blocked_rule_id: {
                            type: 'number',
                            example: '2',
                        },
                        entity_type: {
                            type: 'string',
                            example: 'U',
                        },
                        entity_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        domain_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        category_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        days_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/firewall/upload-category-domains': {
        post: {
            tags: ['Firewall'],
            description: 'Upload domain',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload domain.',
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/change-domain-category': {
        put: {
            tags: ['Firewall'],
            summary: 'Change domain category.',
            description: 'Change domain category.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Change domain category.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['domain_name', 'categories_id', 'domain_id'],
                    properties: {
                        domain_id: {
                            type: 'number',
                            example: 1,
                        },
                        domain_name: {
                            type: 'string',
                            example: 'www.google.com',
                        },
                        categories_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/firewall/user-department-domain-blocked': {
        post: {
            tags: ['Firewall'],
            summary: 'View user and department block.',
            description: 'View user and department block.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'View user and department block.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['domain_id', 'categories_id'],
                    properties: {
                        categories_id: {
                            type: 'number',
                            example: '1',
                        },
                        domain_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/firewall/single-rule-blocked-user-dept-domains': {
        post: {
            tags: ['Firewall'],
            summary: 'Get single rule blocked user and department domains',
            description: 'Get single rule blocked user and department domains',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'domainData',
                description: 'Get single rule blocked user and department domains',
                required: true,
                schema: {
                    type: 'object',
                    required: ['blocked_rule_id'],
                    properties: {
                        blocked_rule_id: {
                            type: 'number',
                            example: '1',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/password/forgot-password': {
        post: {
            tags: ['Open'],
            summary: 'Forgot Password.',
            description: 'Forgot Password.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ForgotPasswordData',
                description: 'Forgot Password.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', example: 'abc@gmail.com' },
                        isClient: { type: 'boolean', example: 'false' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/password/reset-password': {
        put: {
            tags: ['Open'],
            summary: 'Reset Password.',
            description: 'Reset Password.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ResetPasswordData',
                description: 'Reset Password.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email', 'confirm_password', 'new_password'],
                    properties: {
                        email: { type: 'string', example: 'abc@gmail.com' },
                        new_password: {
                            type: 'string',
                            example: 'Abc@123',
                        },
                        confirm_password: {
                            type: 'string',
                            example: 'Abc@123',
                        },
                        token: { type: 'string', example: 'jljll' },
                        isClient: { type: 'boolean', example: 'false' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/password/admin/reset': {
        post: {
            tags: ['Open'],
            summary: 'Forgot Password.',
            description: 'Forgot Password.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ForgotPasswordData',
                description: 'Forgot Password.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', example: 'abc@gmail.com' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/organization/update-feature-new': {
        post: {
            tags: ['Organization'],
            summary: 'Update Admin Features',
            description: 'Admin Features',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'features',
                description: 'admin features status',
                required: true,
                schema: schemas.orgUpdateFeature,
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    /**=============Project Management APIs============= */
    '/project/add-project': {
        post: {
            tags: ['Project'],
            summary: 'Craete Project.',
            description: 'Craete Project.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Craete Project.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'start_date', 'end_date'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'EMP Monitor',
                        },
                        description: {
                            type: 'string',
                            example: 'discription',
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                        user_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                        deadline: {
                            type: 'number',
                            example: 1
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/update-project': {
        put: {
            tags: ['Project'],
            summary: 'Update Project.',
            description: 'Update Project.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Update Project.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'EMP Monitor',
                        },
                        description: {
                            type: 'string',
                            example: 'discription',
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                        status: {
                            type: 'number',
                            example: 1,
                            description: '1:Active,2:Completed,3:On Hold',
                        },
                        progress: {
                            type: 'number',
                            example: 1,
                            description: 'Progress Must be IN Between 0 - 100%',
                        },
                        user_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                        deadline: {
                            type: 'number',
                            example: 1
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/get-project': {
        post: {
            tags: ['Project'],
            summary: 'Get Projects.',
            description: 'Get Projects.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: `column sort 'Project Name','Start Date','End Date','Productive Time','Progress','Status','Assignees','Modules','Tasks',
                    Order-A for ASC D-DESC`,
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        project_id: { type: 'number', example: 1, },
                        status: { type: 'numer', example: 1, },
                        sortColumn: { type: 'string', example: 'Project Name', },
                        sortOrder: { type: 'string', example: 'A', },
                        searchValue: { type: 'string', example: 'Project name', },
                        skip: { type: 'numer', example: 0, },
                        limit: { type: 'numer', example: 10, },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/delete-project': {
        delete: {
            tags: ['Project'],
            summary: 'Delete Project.',
            description: 'Delete Project.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Delete Project.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_ids'],
                    properties: {
                        project_ids: {
                            type: 'array',
                            example: [1, 2],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/add-project-module': {
        post: {
            tags: ['Project'],
            summary: 'Craete Project Module.',
            description: 'Craete Project Module.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Craete Project Module.',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'name',
                        'start_date',
                        'end_date',
                        'project_id',
                    ],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Reports',
                        },
                        description: {
                            type: 'string',
                            example: 'discription',
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/get-project-module': {
        post: {
            tags: ['Project'],
            summary: 'Get Project Module.',
            description: 'Get Project Module.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Get Project Module.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id'],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                        module_id: {
                            type: 'number',
                            example: 1,
                        },
                        status: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/update-project-module': {
        put: {
            tags: ['Project'],
            summary: 'Update Project Module.',
            description: 'Update Project Module.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Update Project Module.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['module_id'],
                    properties: {
                        module_id: {
                            type: 'number',
                            example: 1,
                        },
                        name: {
                            type: 'string',
                            example: 'module',
                        },
                        status: {
                            type: 'number',
                            example: 1,
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/delete-project-module': {
        delete: {
            tags: ['Project'],
            summary: 'Delete Project Module.',
            description: 'Delete Project Module.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Delete Project Module.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['module_ids'],
                    properties: {
                        module_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/get-project-members': {
        post: {
            tags: ['Project'],
            summary: 'Get Project Members.',
            description: 'Get Project Members.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Get Project Members.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id'],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/add-task': {
        post: {
            tags: ['Task'],
            summary: ' Create Task.',
            description: 'Create Task.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'TaskData',
                description: 'Create Task.',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'name',
                        'start_date',
                        'end_date',
                        'project_id',
                        'module_id',
                        'empoyee_id',
                        'priority',
                        'status',
                    ],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Task',
                        },
                        description: {
                            type: 'string',
                            example: 'discription',
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                        module_id: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        priority: {
                            type: 'number',
                            example: 1,
                            description: '1:HIGH,2:MEDIUM,3:LOW	',
                        },
                        status: {
                            type: 'number',
                            example: 1,
                            description: '0:Pending,1:In Progress,2:Completed',
                        },
                        deadline: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/get-task': {
        post: {
            tags: ['Task'],
            summary: ' Get Task.',
            description: 'Get Task.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'TaskData',
                description: 'Get Task.',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                        task_id: {
                            type: 'number',
                            example: 1,
                        },

                        module_id: {
                            type: 'number',
                            example: 1,
                        },
                        status: {
                            type: 'number',
                            example: 1,
                            description: '0:Pending,1:In Progress,2:Completed,4:Todo',
                        },
                        user_id: {
                            type: 'number',
                            example: 1,
                        },

                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/update-task': {
        put: {
            tags: ['Task'],
            summary: ' Update Task.',
            description: 'Update Task.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'TaskData',
                description: 'Update Task.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['task_id'],
                    properties: {
                        task_id: {
                            type: 'number',
                            example: 1,
                        },
                        name: {
                            type: 'string',
                            example: 'task',
                        },
                        status: {
                            type: 'number',
                            example: 1,
                            description: '0:Pending,1:In Progress,2:Completed',
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        priority: {
                            type: 'number',
                            example: 1,
                            description: '1:HIGH,2:MEDIUM,3:LOW	',
                        },
                        description: {
                            type: 'string',
                            example: 'discription',
                        },
                        deadline: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/delete-task': {
        delete: {
            tags: ['Task'],
            summary: ' Delete Task.',
            description: 'Delete Task.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'TaskData',
                description: 'Delete Task.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['task_ids'],
                    properties: {
                        task_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/timesheets': {
        get: {
            tags: ['Task'],
            summary: ' Get Task Timesheet.',
            description: 'Get Task Timesheet.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'task_id',
                schema: { type: 'string', example: 1 },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/delete-timesheet': {
        delete: {
            tags: ['Timesheet'],
            summary: ' Delete Timesheet.',
            description: 'Delete Timesheet.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'TaskData',
                description: 'Delete Timesheet.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['timesheet_ids'],
                    properties: {
                        timesheet_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/add-project-employees': {
        post: {
            tags: ['Project'],
            summary: 'Add Project Employee.',
            description: 'Add Project Employee.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Add Project Employee.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id', 'user_ids'],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                        user_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/delete-project-employees': {
        delete: {
            tags: ['Project'],
            summary: 'Delete Project Employee.',
            description: 'Delete Project Employee.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Delete Project Employee.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id', 'user_ids'],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                        user_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/report/add-report': {
        post: {
            tags: ['Report'],
            summary: 'Add email report.',
            description: 'Add email report.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'reportData',
                description: 'Add reports',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'name',
                        'frequency',
                        'recipients',
                        'content',
                        'filter_type',
                    ],
                    properties: {
                        name: { type: 'string', example: 'User report' },
                        frequency: {
                            type: 'number',
                            example: '1',
                            description: 'frequency `1-Daily`, `2-Weekely`, `3-Monthy`',
                        },
                        recipients: {
                            type: 'array',
                            example: ['abc@gmail.com'],
                        },
                        report_types: {
                            type: 'array',
                            example: ['csv', 'pdf']
                        },
                        content: {
                            type: 'object',
                            example: {
                                productivity: '1',
                                timesheet: '1',
                                apps_usage: '1',
                                websites_usage: '1',
                                keystrokes: '0',
                                projects: '0',
                                tasks: '0',
                                prodInMinutes: '0',
                                timesheetInMinutes: '0',
                                appsInMinutes: '0',
                                websitesInMinutes: '0',
                            },
                            description: '0-inactive 1-active',
                        },
                        filter_type: {
                            type: 'number',
                            example: '1',
                            description: 'filter type `1-Organization`, `2-Employee`, `3-department`',
                        },
                        user_ids: { type: 'array', example: [1, 2, 4] },
                        department_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        custom: {
                            type: 'object',
                            example: {
                                time: "10:00"
                            }
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/test-email': {
        post: {
            tags: ['Report'],
            summary: 'Add email report.',
            description: 'Add email report.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'reportData',
                description: 'Add reports',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'name',
                        'frequency',
                        'recipients',
                        'content',
                        'filter_type',
                    ],
                    properties: {
                        name: { type: 'string', example: 'User report' },
                        frequency: {
                            type: 'number',
                            example: '1',
                            description: 'frequency `1-Daily`, `2-Weekely`, `3-Monthy`',
                        },
                        report_types: {
                            type: 'array',
                            example: ['csv', 'pdf']
                        },
                        recipients: {
                            type: 'array',
                            example: ['abc@gmail.com'],
                        },
                        content: {
                            type: 'object',
                            example: {
                                productivity: '1',
                                timesheet: '1',
                                apps_usage: '1',
                                websites_usage: '1',
                                keystrokes: '0',
                                prodInMinutes: '0',
                                timesheetInMinutes: '0',
                                appsInMinutes: '0',
                                websitesInMinutes: '0',
                                attendance: '0',
                                hrms_attendance: '0',
                            },
                            description: '0-inactive 1-active',
                        },
                        filter_type: {
                            type: 'number',
                            example: '1',
                            description: 'filter type `1-Organization`, `2-Employee`, `3-department`',
                        },
                        user_ids: { type: 'array', example: [1, 2, 4] },
                        department_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        custom: {
                            type: 'object',
                            example: {
                                time: "10:00"
                            }
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/reports': {
        get: {
            tags: ['Report'],
            summary: 'Get email reports.',
            description: `Get email reports details\n
                            sortColumn-'Name','Frequency','Filter Type','Recipients'\n
                            sortOrder-A-ascending and D-descending`,
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'report' }, },
                { in: 'query', name: 'sortColumn', schema: { type: 'string', example: 'Name' }, },
                { in: 'query', name: 'sortOrder', schema: { type: 'string', example: 'D' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/report': {
        get: {
            tags: ['Report'],
            summary: 'Get email report.',
            description: 'Get email report details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'email_report_id',
                schema: { type: 'number', example: '0' },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/delete-reports': {
        delete: {
            tags: ['Report'],
            summary: 'Delete email report.',
            description: 'Delete email report.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'reportData',
                description: 'Delete reports',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email_report_ids'],
                    properties: {
                        email_report_ids: {
                            type: 'array',
                            example: [1, 2, 4],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/edit-report': {
        put: {
            tags: ['Report'],
            summary: 'Edit email report.',
            description: 'Edit email report.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'reportData',
                description: 'Edit reports',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'name',
                        'frequency',
                        'recipients',
                        'content',
                        'filter_type',
                    ],
                    properties: {
                        email_report_id: { type: 'number', example: '13' },
                        name: { type: 'string', example: 'User report' },
                        frequency: {
                            type: 'number',
                            example: '1',
                            description: 'frequency `1-Daily`, `2-Weekely`, `3-Monthy`',
                        },
                        recipients: {
                            type: 'array',
                            example: ['abc@gmail.com'],
                        },
                        report_types: {
                            type: 'array',
                            example: ['csv', 'pdf']
                        },
                        content: {
                            type: 'object',
                            example: {
                                productivity: '1',
                                timesheet: '1',
                                apps_usage: '1',
                                websites_usage: '1',
                                keystrokes: '0',
                                prodInMinutes: '0',
                                timesheetInMinutes: '0',
                                appsInMinutes: '0',
                                websitesInMinutes: '0',
                            },
                            description: '0-inactive 1-active',
                        },
                        filter_type: {
                            type: 'number',
                            example: '1',
                            description: 'filter type `1-Organization`, `2-Employee`, `3-department`',
                        },
                        add_user_ids: { type: 'array', example: [1, 2, 4] },
                        del_user_ids: { type: 'array', example: [1, 2, 4] },
                        add_department_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        del_department_ids: {
                            type: 'array',
                            example: [1, 2, 3, 4],
                        },
                        custom: {
                            type: 'object',
                            example: {
                                time: "10:00"
                            }
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/unsubscribe': {
        get: {
            tags: ['Report'],
            description: 'Unsubscribe mail',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'token', schema: { type: 'string' } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/dashboard/productive-and-nonproductive': {
        get: {
            tags: ['Dashboard'],
            description: 'Top 10 productiive non productivity of user',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'type',
                type: 'number',
                enum: ['1', '2'],
                description: '1-production,2-nonproductive',
            },
            {
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 2 },
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number', example: 6 },
            },
            {
                in: 'query',
                name: 'from_date',
                schema: { type: 'string', example: '2020-06-02' },
                required: true,
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'string', example: '2020-06-08' },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/dashboard/activity-breakdown': {
        get: {
            tags: ['Dashboard'],
            description: 'Activity breakdown data',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'from_date',
                schema: { type: 'string', example: '2020-06-02' },
                required: true,
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'string', example: '2020-06-08' },
                required: true,
            },
            {
                in: 'query',
                name: 'type',
                schema: { type: 'string', example: 'organization' },
                required: true,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/get-urls': {
        post: {
            tags: ['Open'],
            summary: 'Get URL',
            description: 'Get URL ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'CategoryData',
                description: 'Get URL ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['url'],
                    properties: {
                        skip: {
                            type: 'number',
                            example: 1,
                        },
                        limit: {
                            type: 'number',
                            example: 10,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/get-project-production-hours': {
        post: {
            tags: ['Project'],
            summary: 'Get Project Production Time.',
            description: 'Get Project Production Time.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Get Project Production Time.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id'],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    // "/get-app-keystrokes": {
    //     post: {
    //         tags: ["Open"],
    //         summary: "Get App Keystrokes",
    //         description: "Get URL ",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "KeystrokesData",
    //             description: "Get App Keystrokes",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: [],
    //                 properties: {
    //                     skip: {
    //                         type: "number",
    //                         example: 1
    //                     },
    //                     limit: {
    //                         type: "number",
    //                         example: 10
    //                     },
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    '/project/get-project-emp-tasks': {
        post: {
            tags: ['Project'],
            summary: 'Get Project Tasks And Employees.',
            description: 'Get Project Tasks And Employees.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Get Project Tasks And Employees.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['project_id'],
                    properties: {
                        project_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/get-app-names': {
        post: {
            tags: ['Open'],
            summary: 'Get Applications',
            description: 'Get URL ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'AppsData',
                description: 'Get Applications',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        skip: {
                            type: 'number',
                            example: 1,
                        },
                        limit: {
                            type: 'number',
                            example: 10,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/get-application-keystrokes': {
        post: {
            tags: ['Open'],
            summary: 'Get Applications Keystrokes',
            description: 'Get URL ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'KeystrokesData',
                description: 'Get Applications Keystrokes',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', ''],
                    properties: {
                        skip: {
                            type: 'number',
                            example: 1,
                        },
                        limit: {
                            type: 'number',
                            example: 10,
                        },
                        name: {
                            type: 'string',
                            example: 'Telegram.exe',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/logs/users_activity': {
        get: {
            tags: ['Logs'],
            description: '',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 1 },
                required: false,
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
                required: false,
            },
            {
                in: 'query',
                name: 'user_id',
                schema: { type: 'number', example: 59 },
                required: false,
            },
            ],
            responses: {
                ...swaggerHelpers.responseObject,
                403: { description: 'Forbidden' },
            },
            security: securityObject,
        },
    },

    // "/ai/get-keystrokes-new": {
    //     get: {
    //         tags: ["Open"],
    //         summary: "Get KeyStrokes Details",
    //         description: "Get KeyStrokes Details",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [
    //             { in: "query", name: "employee_id", schema: { type: "number", example: 1 }, required: true },
    //             { in: "query", name: "skip", schema: { type: "number", example: "0" }, required: true },
    //             { in: "query", name: "limit", schema: { type: "number", example: 10 }, required: true },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    // "/ai/get-employees": {
    //     get: {
    //         tags: ["Open"],
    //         summary: "Get Employeee Ids",
    //         description: "Get Employeee Ids",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [
    //             { in: "query", name: "skip", schema: { type: "number", example: "0" }, required: true },
    //             { in: "query", name: "limit", schema: { type: "number", example: 10 }, required: true },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    // "/ai/get-days": {
    //     get: {
    //         tags: ["Open"],
    //         summary: "Get days",
    //         description: "Get days",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [
    //             { in: "query", name: "skip", schema: { type: "number", example: "0" }, required: true },
    //             { in: "query", name: "limit", schema: { type: "number", example: 10 }, required: true },
    //             { in: "query", name: "employee_id", schema: { type: "number", example: 1 }, required: true },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    // "/ai/get-screenshots": {
    //     get: {
    //         tags: ["Open"],
    //         summary: "Get Screenshots",
    //         description: "Get Screenshots",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [

    //             { in: "query", name: "date", schema: { type: "date", example: "2020-06-17" }, required: true },
    //             { in: "query", name: "employee_id", schema: { type: "number", example: 1 }, required: true },
    //             { in: "query", name: "pageToken", schema: { type: "number", example: "~!!~AI9FV7S64EuOWI-lOoEyUzPibCvASlR6bdn4KeqdV" }, required: true },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    //=================Organization Shifts =======================

    '/organization-shift/find_by': {
        get: {
            tags: ['Organization Shifts'],
            summary: 'Get organization shifts',
            description: 'Returns organization shifts list',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'name',
                description: 'Shift name',
                type: 'string',
                example: 'name',
            },
            {
                in: 'query',
                name: 'created_by',
                description: 'Shift created by id',
                type: 'number',
                example: 57,
            },
            {
                in: 'query',
                name: 'updated_by',
                description: 'Shift updated by id',
                type: 'number',
                example: 57,
            },
            {
                in: 'query',
                name: 'skip',
                description: 'Skip first n records',
                type: 'number',
                example: 0,
            },
            {
                in: 'query',
                name: 'limit',
                description: 'Select first n records',
                type: 'number',
                example: 0,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/organization-shift': {
        post: {
            tags: ['Organization Shifts'],
            summary: 'Create new organization shift.',
            description: 'Create new organization shift record.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Shift',
                description: 'New shift parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'data'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Shift 1',
                        },
                        data: {
                            type: 'string',
                            example: '{"mon":{"status":false,"time":{"start":"09:00","end":"18:00"}},"tue":{"status":false,"time":{"start":"09:00","end":"18:00"}},"wed":{"status":false,"time":{"start":"09:00","end":"18:00"}},"thu":{"status":false,"time":{"start":"09:00","end":"18:00"}},"fri":{"status":false,"time":{"start":"09:00","end":"18:00"}},"sat":{"status":false,"time":{"start":"09:00","end":"15:00"}},"sun":{"status":false,"time":{"start":"09:00","end":"18:00"}}}',
                        },
                        location_id: {
                            type: 'number',
                            example: '11',
                        },
                        notes: {
                            type: 'string',
                            example: 'Lorem ipsum dolor sit amet, ne sale utroque his, in delectus constituam necessitatibus his. No iisque nostrud vim, ut vis dicam eirmod numquam.',
                        },
                        late_period: { type: 'number', example: '10',description:'time in minutes' },
                        early_login_logout_time: { type: 'number', example: '10',description:'time in minutes' },
                        half_day_hours: { type: 'string', example: '04:00',description:'time in hours' },
                        overtime_period:{ type: 'string', example: '01:00',description:'time in hours' },
                        productivity_halfday:{ type: 'string', example: '04:00',description:'time in hours' },
                        productivity_present:{ type: 'string', example: '06:00',description:'time in hours' },
                        color_code: { type: 'number', example: 1, description: '1-Green ,2-Yellow, 3-Red,4-Blue,5-Black 6-Moderate blue' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        get: {
            tags: ['Organization Shifts'],
            summary: 'Get organization shift by id.',
            description: 'Get organization shift by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'id',
                description: 'Shift id.',
                required: true,
                schema: {
                    type: 'number',
                    example: 7,
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Organization Shifts'],
            summary: 'Update organization shift by id.',
            description: 'Update organization shift by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Shift',
                description: 'Shift parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: {
                            type: 'number',
                            example: 1,
                        },
                        name: {
                            type: 'string',
                            example: 'Shift 1',
                        },
                        data: {
                            type: 'string',
                            example: '{"mon":{"status":false,"time":{"start":"09:00","end":"18:00"}},"tue":{"status":false,"time":{"start":"09:00","end":"18:00"}},"wed":{"status":false,"time":{"start":"09:00","end":"18:00"}},"thu":{"status":false,"time":{"start":"09:00","end":"18:00"}},"fri":{"status":false,"time":{"start":"09:00","end":"18:00"}},"sat":{"status":false,"time":{"start":"09:00","end":"15:00"}},"sun":{"status":false,"time":{"start":"09:00","end":"18:00"}}}',
                        },
                        location_id: {
                            type: 'number',
                            example: '2',
                        },
                        notes: {
                            type: 'string',
                            example: 'Sea viderer temporibus te, ne est vero quaeque voluptatibus. Ut assentior dissentias sit.',
                        },
                        color_code: {
                            type: 'number',
                            example: 1,
                            description: '1-Green ,2-Yellow, 3-Red,4-Blue,5-Black 6-Moderate blue'
                        },
                        late_period: { type: 'number', example: '10',description:'time in minutes' },
                        early_login_logout_time: { type: 'number', example: '10',description:'time in minutes' },
                        half_day_hours: { type: 'string', example: '04:00',description:'time in hours' },
                        overtime_period:{ type: 'string', example: '01:00',description:'time in hours' },
                        productivity_halfday:{ type: 'string', example: '04:00',description:'time in hours' },
                        productivity_present:{ type: 'string', example: '06:00',description:'time in hours' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Organization Shifts'],
            summary: 'Delete organization shift by id.',
            description: 'Delete organization shift by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Shift',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    //================= Alerts and Notifications  =======================

    '/alerts-and-notifications/find-by': {
        get: {
            tags: ['Alerts and Notifications'],
            summary: 'Get organization notification rules',
            description: 'Returns organization notifications rules list',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'name', description: 'Notification rule name', type: 'string', example: 'Rule name' },
                { in: 'query', name: 'sort_by', description: 'Sort coloumn  name', type: 'string', example: 'name' },
                { in: 'query', name: 'sort_order', description: 'Sort order', type: 'string', example: 'ASC' },
                { in: 'query', name: 'skip', description: 'Skip first n records', type: 'number', example: 0 },
                { in: 'query', name: 'limit', description: 'Select first n records', type: 'number', example: 10 },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/alerts-and-notifications': {
        post: {
            tags: ['Alerts and Notifications'],
            summary: 'Create new notification rule.',
            description: 'Create new notification rule record.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Notification rule',
                description: 'New notification rule parameters.',
                required: true,
                schema: schemas.notificationRule,
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        get: {
            tags: ['Alerts and Notifications'],
            summary: 'Get notification rule by id.',
            description: 'Get notification rule by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'id',
                description: 'Notification rule id.',
                required: true,
                schema: schemas.idOnly.properties.id,
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Alerts and Notifications'],
            summary: 'Update notification rule by id.',
            description: 'Update notification rule by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Notification rule',
                description: "Notification rule parameters.",
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        ...schemas.idOnly.required,
                        ...schemas.notificationRule.required,
                    ],
                    properties: {
                        ...schemas.idOnly.properties,
                        ...schemas.notificationRule.properties
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Alerts and Notifications'],
            summary: 'Delete notification rule by id.',
            description: 'Delete notification rule by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Notification rule',
                description: 'Request parameters.',
                required: true,
                schema: schemas.idOnly,
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/alerts-and-notifications/alerts/find-by': {
        get: {
            tags: ['Alerts and Notifications'],
            summary: 'Get organization notification alerts',
            description: 'Returns organization notifications alerts list',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'from', description: 'Date from', type: 'date', example: '2020-01-01' },
                { in: 'query', name: 'to', description: 'Date to', type: 'date', example: '2020-02-01' },
                { in: 'query', name: 'employee_id', description: 'Employee ID', type: 'number', example: 1 },
                { in: 'query', name: 'non_admin_id', description: 'Manager ID', type: 'number', example: 25516 },
                { in: 'query', name: 'department_id', description: 'Employee department ID', type: 'number', example: 1 },
                { in: 'query', name: 'location_id', description: 'Employee location ID', type: 'number', example: 1 },
                { in: 'query', name: 'search_keyword', description: 'Search keyword', type: 'string', example: 'test' },
                { in: 'query', ...schemas.sortBy('datetime') },
                { in: 'query', ...schemas.sortBy('employee') },
                { in: 'query', ...schemas.sortBy('computer') },
                { in: 'query', ...schemas.sortBy('policy') },
                { in: 'query', ...schemas.sortBy('risk_level') },
                { in: 'query', ...schemas.sortBy('behavior_rule') },
                { in: 'query', ...schemas.sortBy('action') },
                { in: 'query', name: 'skip', description: 'Skip first n records', type: 'number', example: 0 },
                { in: 'query', name: 'limit', description: 'Select first n records', type: 'number', example: 10 },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/alerts-and-notifications/add-employee-to-rule': {
        put: {
            tags: ['Alerts and Notifications'],
            summary: 'Add all employees to a rules',
            description: 'Adds all employees to a rules with rule ids given',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Rule_IDs',
                description: 'all_rules - 1 => all rules, 0 => custom rules_ids array.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['all_rules'],
                    properties: {
                        all_rules: { type: 'string', example: '0' },
                        rule_ids: { type: 'array', example: [1, 2, 3, 4, 5] },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    //==============================================================

    //================= User Properties  =======================

    '/user-properties': {
        post: {
            tags: ['User Properties'],
            summary: 'Set user properties values.',
            description: 'Set user properties values.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Properties',
                description: 'Properties parameters.',
                schema: {
                    type: 'object',
                    required: ['properties'],
                    properties: {
                        properties: schemas.userProperties
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        get: {
            tags: ['User Properties'],
            summary: 'Get user properties values.',
            description: 'Get user properties values.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'names[]',
                description: 'Property names',
                required: true,
                collectionFormat: 'multi',
                ...schemas.arrayOfStrings,
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        delete: {
            tags: ['User Properties'],
            summary: 'Delete user properties values.',
            description: 'Delete user properties values.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'names',
                description: 'Property names',
                schema: {
                    type: 'object',
                    required: ['names'],
                    properties: {
                        names: schemas.arrayOfStrings,
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    //==============================================================

    //=================Organization Biuld =======================

    '/organization-build/build': {
        get: {
            tags: ['Organization Build'],
            summary: 'Organization Build',
            description: 'Organization Build',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/organization-build/build-on-premise': {
        get: {
            tags: ['Organization Build'],
            summary: 'Organization Build',
            description: 'Organization Build',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'email', description: 'Admin Email of On Premise User', type: 'string', example: "abhishek@mail.com" },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    //==============================================================

    '/report/get-emails': {
        get: {
            tags: ['Report'],
            summary: 'Get mail report',
            description: 'Get mail report',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'department_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'client_type', schema: { type: 'string', example: 'gmail' } },
                {
                    in: 'query',
                    name: 'type',
                    schema: { type: 'number', example: 1 },
                    description: '1-Incomming, 2-Outgoing',
                },
                { in: 'query', name: 'skip', schema: { type: 'number', example: 0 } },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 10 } },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'search text' } },
                { in: 'query', name: 'sortColumn', schema: { type: 'string', example: 'date_time', default: 'date_time' }, enum: ['date_time', "employee", 'location', 'department', 'from', 'to', 'body', 'subject', 'client_type', 'bcc', 'cc'] },
                { in: 'query', name: 'sortOrder', schema: { type: 'string', example: 'D', default: 'A' }, description: 'Order of sort', enum: ['A', 'D'] },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: { type: 'number', example: '2020-07-18' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: { type: 'number', example: '2020-07-22' },
                    required: true,
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/email-client-types': {
        get: {
            tags: ['Report'],
            summary: 'Get client types',
            description: 'Get clients types',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/report/emails-report-graph': {
        get: {
            tags: ['Report'],
            summary: 'Get mail report',
            description: 'Get mail report',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'department_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'client_type', schema: { type: 'string', example: 'gmail' } },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: { type: 'number', example: '2020-07-18' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: { type: 'number', example: '2020-07-22' },
                    required: true,
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    //sentimental analysis

    "/sentimental-analysis/get-keystrokes-new": {
        get: {
            tags: ["Sentimental-analysis"],
            description: "Get Keystrokes data",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "employee_id", schema: { type: "number", example: 2 } },
                { in: "query", name: "employee_timezone", schema: { type: "string", example: "Antarctica/Troll" }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
        }
    },


    "/sentimental-analysis/add-sentimental-analysis-data": {
        post: {
            tags: ["Sentimental-analysis"],
            description: " Store Keystroke analysis data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Keystroke analysis data",
                description: "Store Keystroke Analysis data",
                required: true,
                schema: {
                    type: "object",
                    required: ["employee_id", "positive", "negative", "neutral", "attendance_id", "date", "phone"],
                    properties: {
                        employee_id: { type: "number", example: 6 },
                        positive: { type: "number", example: 23.08 },
                        negative: { type: "number", example: 67.80 },
                        neutral: { type: "number", example: 144.90 },
                        attendance_id: { type: "number", example: 345 },
                        date: { type: "string", example: "2020-06-16" },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
        }
    },

    "/ai-keystokes/keystrokes": {
        get: {
            tags: ["Sentimental-analysis"],
            description: "Get Keystrokes data",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "skip", schema: { type: "number", example: 2 } },
                { in: "query", name: "limit", schema: { type: "string", example: 1 }, required: true },
                { in: "query", name: "timezone", schema: { type: "string", example: "Asia/Kolkata" }, required: true }
            ],
            responses: swaggerHelpers.responseObject,
        }
    },

    "/ai-keystokes/get-keystrokes": {
        get: {
            tags: ["Sentimental-analysis"],
            description: "Get Keystrokes data",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "skip", schema: { type: "number", example: 2 } },
                { in: "query", name: "limit", schema: { type: "string", example: 1 }, required: true },
                // { in: "query", name: "timezone", schema: { type: "string", example: "Asia/Kolkata" }, required: true }
            ],
            responses: swaggerHelpers.responseObject,
        }
    },

    //=================Notification =======================

    "/employeeNotification/notification-list": {
        get: {
            tags: ["Notification"],
            description: `Employee Notification \n
            sortColumn:- Full Name,Computer,Employee Code,Date`,
            produces: ["application/json"],
            parameters: [

                { in: "query", name: "startDate", schema: { type: "number", example: "2020-07-18" }, required: true },
                { in: "query", name: "endDate", schema: { type: "number", example: "2020-07-22" }, required: true },
                { in: "query", name: "employee_id", schema: { type: "number", example: 1 } },
                { in: "query", name: "department_id", schema: { type: "number", example: 1 } },
                { in: "query", name: "location_id", schema: { type: "number", example: 1 } },
                { in: "query", name: "skip", schema: { type: "number", example: 0 } },
                { in: "query", name: "limit", schema: { type: "number", example: 25 } },
                { in: "query", name: "name", schema: { type: "string", example: 'basavaraj' } },
                { in: "query", name: "sortColumn", schema: { type: "string", example: 'Full Name' } },
                { in: "query", name: "sortOrder", schema: { type: "string", example: 'D' } },
                { in: "query", name: "download", schema: { type: "boolean", example: 'true' } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }

    },
    "/employeeNotification/unread-count": {
        get: {
            tags: ["Notification"],
            description: `Employee notification unread count`,
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }

    },

    "/employeeNotification/notification-status-update": {
        post: {
            tags: ["Notification"],
            summary: "Mark the status of the unread notifications",
            description: "Mark the status of the unread notifications",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "notification ids",
                description: "New notification parameters.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        ids: {
                            type: "array",
                            example: [1, 2]
                        },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    //==============================================================

    '/employee/url-analysis': {
        get: {
            tags: ['Employee'],
            summary: 'Get URL analysis details',
            description: 'Get URL analysis details',
            consumes: ['application/json'],
            produces: ['application/json'],

            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-05-01' },
                required: true,
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: '0' },
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
            },
            {
                in: 'query',
                name: 'category',
                schema: { type: 'string', example: '5f7db3b7b43a7c138ca13b07' },
                required: false,
            },
            {
                in: 'query',
                name: 'sortBy',
                schema: { type: 'string', example: 'url', description: "sort must be in [url ,date,prediction,domain]" },
                required: false,
            },
            {
                in: 'query',
                name: 'order',
                schema: { type: 'number', example: "D", description: "A Ascending ,D Descending" },
                required: false,
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: 'google' },
                required: false,
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/convesation-classification': {
        get: {
            tags: ['Employee'],
            summary: 'Get Convesation Classification Analysis',
            description: 'Get Convesation Classification Analysis',
            consumes: ['application/json'],
            produces: ['application/json'],

            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-05-01' },
                required: true,
            },
            {
                in: 'query',
                name: 'sortBy',
                schema: { type: 'string', example: 'app', description: "sort must be in [app ,date,words]" },
                required: false,
            },
            {
                in: 'query',
                name: 'order',
                schema: { type: 'number', example: "D", description: "A Ascending ,D Descending" },
                required: false,
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/employee/get-sentimental-data': {
        get: {
            tags: ['Employee'],
            summary: 'Get Sentimental Analysis Data',
            description: 'Get Sentimental Analysis Data',
            consumes: ['application/json'],
            produces: ['application/json'],

            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'date',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/ai/domains": {
        get: {
            tags: ["AI"],
            description: "Get Domains",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "skip", schema: { type: "number", example: 2 }, required: true },
                { in: "query", name: "limit", schema: { type: "string", example: 1 }, required: true },

            ],
            responses: swaggerHelpers.responseObject,
        }
    },
    "/ai/add-url-status": {
        post: {
            tags: ['AI'],
            summary: 'Update Domain Prediction',
            description: 'Update Domain Prediction',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Domains',
                description: 'Domains parameters.',
                schema: {
                    type: 'object',
                    required: ['post_lists'],
                    properties: {
                        post_lists: {
                            type: "array",
                            example: [{ domain: "mythicalireland.com", prediction: "Relaible" }]
                            // example: "ASDSAD"

                        },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            // security: securityObject
        },

    },
    "/ai-keystokes/bulk-conversation-classification": {
        post: {
            tags: ['AI'],
            summary: 'Bulk Update Conversation Classification',
            description: 'Bulk Update Conversation Classification',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Connversation-Clasification',
                description: 'Connversation-Clasification parameters.',
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        data: {
                            type: "array",
                            example: [{ employee_id: 1, organization_id: 1, application_id: "5f3bce5dd45b1f577c925e32", prediction: 10, offensive_words: "asdf,ghjk", date: "2020-08-25" }]
                            // example: "ASDSAD"

                        },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            // security: securityObject
        },

    },

    //================= Organization application names  =======================
    '/organization/app-names': {
        get: {
            tags: ['Organization'],
            summary: 'Search through application names',
            description: 'Search through application names',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'keyword',
                description: 'Search keyword',
                type: 'string',
                example: 'google',
                required: true,
            },
            {
                in: 'query',
                name: 'type',
                ...BaseModel.enumDesc('Type', AppNames.TYPES),
                type: 'number',
                required: true,
            },
            { in: 'query', name: 'limit', description: 'Select first n records', type: 'number', example: 10 },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Organization'],
            summary: 'Add a new application name',
            description: 'Add a new application name',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'name',
                description: 'Application name to add',
                required: true,
                schema: schemas.applicationName,
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    }, 
    '/organization/product-tour-status': {
        post: {
            tags: ['Organization'],
            summary: 'To update status of product tour',
            description: 'To update status of product tour',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/organization/get-2fa-status': {
        get: {
            tags: ['Organization'],
            summary: 'To get status of 2FA status',
            description: 'To get status of 2FA status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/organization/update-2fa-status': {
        post: {
            tags: ['Organization'],
            summary: 'To update status of 2FA status',
            description: 'To update status of 2FA status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'To update status of 2FA status',
                    description: 'To update status of 2FA status',
                    schema: {
                        type: 'object',
                        required: ['status'],
                        properties: {
                            status: { type: 'number', example: 1}
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/groups': {
        post: {
            tags: ['Groups'],
            summary: 'Create new croup.',
            description: 'Create newg roup record.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Group',
                description: 'New Group parameter.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'employee_ids'],
                    // properties: {
                    //     name: { type: 'string', example: 'Group Name', description: 'Gropu name' },
                    //     employee_ids: { type: 'array', example: [1, 2, 3], description: 'Group members' },
                    //     location: { type: 'array', example: [{ location_id: 1, department_ids: [1, 2, 3] }], description: 'Group locations' },
                    //     note: { type: 'string', example: 'Group description', description: 'Group description' }
                    // }
                    properties: {
                        name: { type: 'string', example: 'Group Name', description: 'Gropu name' },
                        data: {
                            type: 'array',
                            example: [{
                                role_id: 2,
                                location_id: 44,
                                department_id: 34,
                                employee_ids: [44, 45]
                            }],
                            description: 'Group members'
                        },
                        overwrite: { type: 'boolean', example: 'false' },
                        note: { type: 'string', example: 'Group description', description: 'Group description' }

                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        get: {
            tags: ['Groups'],
            description: 'List of groups or single group',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: '10' }, },
                { in: 'query', name: 'group_id', schema: { type: 'number', example: '1' }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'test' }, },
                { in: 'query', name: 'sortOrder', schema: { type: 'string', example: 'D' }, },
                { in: 'query', name: 'sortColumn', schema: { type: 'string', example: 'name' }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        put: {
            tags: ['Groups'],
            summary: 'Update group by id.',
            description: 'Update group by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Group',
                description: "Group rule parameters.",
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'groupId'
                    ],
                    properties: {
                        name: { type: 'string', example: 'Group Name', description: 'Gropu name' },
                        data: {
                            type: 'array',
                            example: [{
                                role_id: 2,
                                location_id: 44,
                                department_id: 34,
                                employee_ids: [44, 45]
                            }],
                            description: 'Group members'
                        },
                        overwrite: { type: 'boolean', example: 'false' },
                        note: { type: 'string', example: 'Group description', description: 'Group description' },
                        group_id: { type: 'number', example: 11, description: 'Group Id' },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        delete: {
            tags: ['Groups'],
            summary: 'Delete Groupse by id.',
            description: 'Delete Groups by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Groups',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['group_ids'],
                    properties: {
                        group_id: { type: 'number', example: 1, description: 'Delete group single' },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/groups/group-setting': {
        put: {
            tags: ['Groups'],
            summary: 'Update group by id.',
            description: 'Update group by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Group',
                description: "Group rule parameters.",
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'groupId'
                    ],
                    properties: {
                        group_id: { type: 'number', example: '1', description: 'Id of group' },
                        settings: {
                            type: 'string',
                            example: {
                                system: {
                                    type: '0',
                                    visibility: false,
                                    autoUpdate: "0", //0-no update 1-for update
                                    info: {
                                        type: '0-personal or 1-compnay',
                                        visibility: 'true-visible mode , false-stealth mode',
                                    },
                                },
                                screenshot: {
                                    frequencyPerHour: 30,
                                    employeeAccessibility: false,
                                    employeeCanDelete: false,
                                },
                                features: {
                                    application_usage: 1,
                                    keystrokes: 1,
                                    web_usage: 1,
                                    block_websites: 1,
                                    screenshots: 1,
                                },
                                breakInMinute: 30,
                                idleInMinute: 2,
                                trackingMode: 'unlimited',
                                tracking: {
                                    unlimited: {
                                        day: '1,2,3,4,5,6,7',
                                        info: {
                                            day: '1-monday,7-sunday',
                                            time: 'all day',
                                        },
                                    },
                                    fixed: {
                                        mon: {
                                            status: true,
                                            time: {
                                                start: '10:00',
                                                end: '19:00',
                                            },
                                        },
                                        tue: {
                                            status: true,
                                            time: {
                                                start: '10:00',
                                                end: '19:00',
                                            },
                                        },
                                        wed: {
                                            status: false,
                                            time: {
                                                start: '10:00',
                                                end: '19:00',
                                            },
                                        },
                                        thu: {
                                            status: true,
                                            time: {
                                                start: '10:00',
                                                end: '19:00',
                                            },
                                        },
                                        fri: {
                                            status: true,
                                            time: {
                                                start: '10:00',
                                                end: '19:00',
                                            },
                                        },
                                        sat: {
                                            status: true,
                                            time: {
                                                start: '10:00',
                                                end: '15:00',
                                            },
                                        },
                                        sun: {
                                            status: false,
                                            time: {
                                                start: '10:00',
                                                end: '19:00',
                                            },
                                        },
                                        info: {
                                            day: '1-monday,7-sunday',
                                            time: 'fixed, else dont track',
                                            status: 'true means track else no tracking that day',
                                        },
                                    },
                                    networkBased: {
                                        networkName: 'Globussoft',
                                        networkMac: '00-14-22-01-23-45',
                                        info: {
                                            other: 'only track when system in on particular network',
                                        },
                                    },
                                    manual: {
                                        info: {
                                            other: 'when user will start tracking clock-in and stops when clock-out',
                                        },
                                    },
                                    projectBased: {
                                        info: {
                                            other: 'when user will start working on a project',
                                        },
                                    },
                                },
                                task: {
                                    employeeCanCreateTask: true,
                                    info: {
                                        employeeCanCreateTask: 'either true or false',
                                    },
                                },
                                manual_clock_in: 1,
                            },
                        },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

    "/ai/risk-score": {
        get: {
            tags: ["AI"],
            description: "Get Employee Data For Risk Score Analysis",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "skip", schema: { type: "number", example: 2 }, required: true },
                { in: "query", name: "limit", schema: { type: "string", example: 1 }, required: true },

            ],
            responses: swaggerHelpers.responseObject,
        },
        post: {
            tags: ["AI"],
            summary: "Add User Risk Score",
            description: "Add User Risk Score",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Risk score",
                description: "Risk score parameters.",
                required: true,
                schema: {
                    type: "object",
                    required: ["risk_percentage", "employee_id", "date"],
                    properties: {
                        risk_percentage: {
                            type: "number",
                            example: 74.40,
                            description: "risk_score must be in 0 to 100"
                        },
                        employee_id: {
                            type: "number",
                            example: 1,
                        },
                        date: {
                            type: "string",
                            example: "2020-06-02",
                        },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/settings/role': {
        put: {
            tags: ['Settings'],
            summary: 'Update Settings by id.',
            description: 'Update Settings by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Settings',
                description: "Settings rule parameters.",
                required: true,
                schema: {
                    type: 'object',
                    required: ['role_id'],
                    properties: {
                        role_id: { type: 'number', example: '1', description: 'Id of role' },
                        name: { type: 'string', example: 'Group Leader', },
                        permission: { type: 'object', example: { "read": "1", "write": "0", "delete": "0" }, },
                        permission_ids: { type: 'array', example: [1, 2, 3], },
                        type: { type: 'number', example: "1", },
                        loc_dept_edit: { type: 'boolean', example: "false" },
                        location: { type: 'array', example: [{ location_id: 1, department_ids: [1, 2, 3] }], description: 'Role locatoion with department' },
                        department_ids: { type: 'array', example: [2], description: 'Role departments' }
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        delete: {
            tags: ['Settings'],
            summary: 'Delete role by id.',
            description: 'Delete role by id.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Roles',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['group_ids'],
                    properties: {
                        role_id: { type: 'array', example: 1, description: 'Delete role by id' },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/settings/category': {
        get: {
            tags: ['Settings'],
            description: 'status => 0=Neutral 1=Productive 2=Unproductive',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'category_type', type: 'string', enum: ['All', 'Global', 'Custom', 'New'], },
                // { in: 'query', name: 'type', type: 'number', enum: ['1', '2'] },
                { in: 'query', name: 'status', type: 'number', example: 1 },
                { in: 'query', name: 'name', type: 'string', schema: { example: 'account' }, },
                { in: "query", name: "sortColumn", schema: { type: "string", example: 'Name' } },
                { in: "query", name: "sortOrder", schema: { type: "string", example: 'D' } },
                { in: "query", name: "skip", schema: { type: "number", example: 0 } },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 25 }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/category-web-apps': {
        get: {
            tags: ['Settings'],
            description: 'status => 0=Neutral 1=Productive 2=Unproductive',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'category_id', type: 'string', schema: { example: '5f5cd1a8bc25c839548252fe' }, },
                { in: "query", name: "name", schema: { type: "string", example: "google.com", description: "Search Domain Here." } },
                { in: "query", name: "skip", schema: { type: "number", example: 0 } },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 25 }, },
                { in: "query", name: "sortColumn", schema: { type: "string", example: 'Name' } },
                { in: "query", name: "sortOrder", schema: { type: "string", example: 'D' } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/settings/category-productivity-ranking': {
        put: {
            tags: ['Settings'],
            summary: 'Update Category Productivity-Ranking',
            description: 'Update Category Productivity-Ranking',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Category Productivity-Ranking',
                required: true,
                schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    category_id: {
                                        type: 'string',
                                        example: '54759eb3c090d83494e2d804',
                                    },
                                    department_rules: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                department_id: {
                                                    type: 'number',
                                                },
                                                status: { type: 'number' },
                                            },
                                        },
                                    },
                                },
                            },
                            example: [{
                                category_id: '54759eb3c090d83494e2d804',
                                department_rules: [
                                    { department_id: 1, status: 0 },
                                    { department_id: 2, status: 1 },
                                ],
                            },
                            {
                                category_id: '54759eb3c090d83494e2d804',
                                department_rules: [
                                    { department_id: 1, status: 0 },
                                    { department_id: 2, status: 1 },
                                ],
                            },
                            ],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/category-list': {
        get: {
            tags: ['Settings'],
            description: 'Categories',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'name', type: 'string', schema: { example: 'News' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/employee/category-connection': {
        get: {
            tags: ['Employee'],
            summary: 'Get URL Category And Connection Details',
            description: 'Get URL Category And Connection Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'startDate',
                schema: { type: 'string', example: '2020-04-30' },
                required: true,
            },
            {
                in: 'query',
                name: 'endDate',
                schema: { type: 'string', example: '2020-05-01' },
                required: true,
            }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    "/employee/employee-geolocation-logs": {
        get: {
            tags: ['Employee'],
            summary: 'Get Employee Geolocation Logs',
            description: 'Get Employee Geolocation Logs',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, required: true },
                { in: 'query', name: 'start_date', schema: { type: 'string', example: '2020-04-30' }, required: true },
                { in: 'query', name: 'end_date', schema: { type: 'string', example: '2020-05-01' }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/project-complete-details': {
        get: {
            tags: ['Project'],
            summary: 'Get Project Complete-Details.',
            description: 'Get Project Complete-Details.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'project_id',
                schema: { type: 'number', example: 1 },
                required: true,
            }

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/get-ideal-user-details': {
        get: {
            tags: ['Dashboard'],
            description: 'Get ideal users',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: {
                    type: 'date',
                    example: moment().format('YYYY-MM-DD'),
                },
            }, {
                in: 'query',
                name: 'attendance_id',
                schema: {
                    type: 'number',
                    example: 33684,
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    "/feedback/questions": {
        get: {
            tags: ["Feedback"],
            description: "Get Questions",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    "/feedback/answer": {

        post: {
            tags: ["Feedback"],
            summary: "Add Answer",
            description: "Add Answer",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Feedback Answer",
                description: "Feedback Answer",
                required: true,
                schema: {
                    type: "object",
                    required: ["risk_percentage", "employee_id", "date"],
                    properties: {
                        data: {
                            type: "array",
                            example: [{ question_id: 1, option_id: 1, comment: "fine" }],
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "0-add, 1-skip"
                        },

                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/project/app-web': {
        get: {
            tags: ['Project'],
            summary: 'Apllications And Websites Data',
            description: 'Apllications And Websites Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'project_id',
                schema: { type: 'number', example: 1 },
                required: true,
            },
            {
                in: 'query',
                name: 'status',
                schema: { type: 'number', example: 1, description: "status 1-productive, 2-unproductive ,3-neutral ,4-idle,5-All" },
                required: true,
            },
            {
                in: 'query',
                name: 'type',
                type: "string",
                enum: ['ALL', 'APP', 'WEB',],
                required: true,
            },
            {
                in: 'query',
                name: 'sortBy',
                type: 'string',
                enum: ['app', 'duration',],
                required: true,
            },
            {
                in: 'query',
                name: 'order',
                schema: { type: 'string', example: "A" },
                required: true,
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 0 },
                required: true,
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: 'chrome' },
                required: false,
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10 },
                required: true,
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/service/login': {
        post: {
            tags: ['ApiService'],
            summary: 'Employee/Manager login ',
            description: 'Login to the portal',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee signin ',
                description: 'Employee/Manager Signin ',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email', 'password', 'ip'],
                    properties: {
                        email: { type: 'string', example: 'email' },
                        password: { type: 'string', example: '********' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/service/reports/employees': {
        get: {
            tags: ['ApiService'],
            summary: 'Employees List',
            description: 'List Of Assigned Employees </br>  default skip 0 and limit 25',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'department_id',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'role_id',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'name_contains',
                schema: { type: 'number', example: 'abc' },
            },

            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 1, description: "default 0" },
            },

            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10, description: "default 25" },
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/service/reports/applications': {
        get: {
            tags: ['ApiService'],
            summary: 'Applications List',
            description: 'Applications List Of Your Organization',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 1, description: "default 0" },
            },

            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 10, description: "default 25" },
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/service/reports/developer-reports': {
        post: {
            tags: ['ApiService'],
            summary: 'Developer Reports.',
            description: `Developer Reports.  </br>
            # If developer used the given application for single time, then also we say he's using in the whole date range  </br>
            # In the list of applications any one used for single time also, he will be excluded in from reports in give date range
            `,
            consumes: ['application/json'],
            produces: ['application/json'],

            parameters: [{
                in: 'body',
                name: 'ReportsData',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'employee_ids',
                        'applications',
                        'from_date',
                        'to_date'
                    ],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3], description: 'Location filter its default option', },
                        applications: { type: 'array', example: ["vscode", "robo3t"], },
                        from_date: { type: 'date', example: "2020-10-10", },
                        to_date: { type: 'date', example: "2020-10-10", },
                    },
                },
            },],

            // parameters: [
            //     {
            //         in: 'body',
            //         name: 'employee_ids',
            //         schema: { type: 'array', example: [1, 2, 3] },
            //     },

            //     {
            //         in: 'body',
            //         name: 'applications',
            //         schema: { type: 'array', example: ["vscode", "robo3t"] },
            //     },
            //     {
            //         in: 'body',
            //         name: 'from_date',
            //         schema: { type: 'date', example: "2020-10-10" },
            //     },
            //     {
            //         in: 'body',
            //         name: 'to_date',
            //         schema: { type: 'date', example: "2020-12-12" },
            //     },
            // ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/service/reports/absent-employees': {
        get: {
            tags: ['ApiService'],
            summary: 'Absent Employees List',
            description: 'Absent Employees List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'date', example: "2020-01-01" },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/service/reports/employee-reports': {
        post: {
            tags: ['ApiService'],
            summary: 'Download user report',
            description: 'Download user report ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'User Report',
                description: 'Download user report',
                required: false,
                schema: {
                    type: 'object',
                    required: ['employee_ids', 'startDate', 'endDate'],
                    properties: {
                        employee_ids: { type: 'array', example: [1, 2, 3] },
                        location_id: { type: 'number', example: 1 },
                        role_id: { type: 'number', example: 1 },
                        department_ids: { type: 'string', example: '1,2,3' },
                        startDate: { type: 'string', example: '2019-11-19' },
                        endDate: { type: 'string', example: '2019-11-29' },
                        download_option: { type: 'number', example: 1, description: "1-application reports 2-Browser histrory ,3-App and browser history" },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/help/get-page": {
        post: {
            tags: ["Help"],
            summary: "Get page.",
            description: "Get page.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "HTML data",
                description: "Get page.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        page_id: {
                            type: "number",
                            example: 1
                        },
                        page_name: {
                            type: "string",
                            example: "dashboard"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/loss-of-pay': {
        post: {
            tags: ['Hrms'],
            summary: 'Post loss of pay',
            description: 'Post loss of pay',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Data',
                description: 'Post loss of pay',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        LOP: {
                            type: 'array',
                            example: '[]',
                        },
                        verify: {
                            type: 'number',
                            example: '0',
                        },
                    },
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/location': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Locations',
            description: 'Get locations',
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'location_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create Location data',
            description: 'Create Location data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Create Location data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        location: {
                            type: 'string',
                            example: 'text',
                        },
                        timezone: {
                            type: 'string',
                            example: 'Africa/Abidjan',
                        },
                        location_head_id: {
                            type: 'number',
                            example: 1,
                        },
                        location_hr_id: {
                            type: 'number',
                            example: 2,
                        },
                        email: {
                            type: 'string',
                            example: 'text',
                        },
                        phone: {
                            type: 'string',
                            example: 'text',
                        },
                        fax: {
                            type: 'string',
                            example: 'text',
                        },
                        address_one: {
                            type: 'string',
                            example: 'text',
                        },
                        address_two: {
                            type: 'string',
                            example: 'text',
                        },
                        city: {
                            type: 'string',
                            example: 'text',
                        },
                        state: {
                            type: 'string',
                            example: 'text',
                        },
                        country: {
                            type: 'string',
                            example: 'text',
                        },
                        zip: {
                            type: 'string',
                            example: 'text',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update Location data',
            description: 'Update Location data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'locationData',
                description: 'Update Location data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        location_id: {
                            type: 'string',
                            example: "1",
                        },
                        location: {
                            type: 'string',
                            example: 'text',
                        },
                        timezone: {
                            type: 'string',
                            example: 'Africa/Abidjan',
                        },
                        location_head_id: {
                            type: 'number',
                            example: 1,
                        },
                        location_hr_id: {
                            type: 'number',
                            example: 2,
                        },
                        email: {
                            type: 'string',
                            example: 'text',
                        },
                        phone: {
                            type: 'string',
                            example: 'text',
                        },
                        fax: {
                            type: 'string',
                            example: 'text',
                        },
                        address_one: {
                            type: 'string',
                            example: 'text',
                        },
                        address_two: {
                            type: 'string',
                            example: 'text',
                        },
                        city: {
                            type: 'string',
                            example: 'text',
                        },
                        state: {
                            type: 'string',
                            example: 'text',
                        },
                        country: {
                            type: 'string',
                            example: 'text',
                        },
                        zip: {
                            type: 'string',
                            example: 'text',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/department': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Departments',
            description: 'Get Departments List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'department_id',
                schema: { type: 'string', example: "1" },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create department data',
            description: 'Create department data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'departmentData',
                description: 'Create department data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        department_name: {
                            type: 'string',
                            example: 'Node',
                        },
                        location_id: {
                            type: 'number',
                            example: 1,
                        },
                        department_head_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update department data',
            description: 'Update department data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'departmentData',
                description: 'Update department data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        department_id: {
                            type: 'number',
                            example: 1,
                        },
                        department_name: {
                            type: 'string',
                            example: 'Node',
                        },
                        location_id: {
                            type: 'number',
                            example: 1,
                        },
                        department_head_id: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete department data.',
            description: 'Delete department data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Department data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['department_id'],
                    properties: {
                        department_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/policy': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Policies',
            description: 'Get Policy List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'policy_id',
                schema: { type: 'string', example: "1" },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create policy data',
            description: 'Create policy data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'policyData',
                description: 'Create policy data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        title: {
                            type: 'string',
                            example: 'title',
                        },
                        description: {
                            type: 'string',
                            example: 'description',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update policy data',
            description: 'Update policy data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'policyData',
                description: 'Update policy data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        policy_id: {
                            type: 'string',
                            example: '1',
                        },
                        title: {
                            type: 'string',
                            example: 'title',
                        },
                        description: {
                            type: 'string',
                            example: 'description',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete policy data.',
            description: 'Delete policy data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Policy data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['policy_id'],
                    properties: {
                        policy_id: {
                            type: 'string',
                            example: "1",
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/get-companies': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Companies',
            description: '*send either employee_ids or group_ids or nothing  *dont send both employee_ids and group_ids   \n\n employee_ids => employees all projects \n\n  group_ids => groups all projects \n\n  send empty will get organizations all projects',
            produces: ['application/json'],

            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/announcements/events': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Events',
            description: 'Get Events',
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/announcements': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Announcements',
            description: 'Get Organization Announcements',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'title', schema: { type: 'string', example: "Party" }, },
                { in: 'query', name: 'start_date', schema: { type: 'date', example: new Date().toISOString().slice(0, 10) }, },
                { in: 'query', name: 'end_date', schema: { type: 'date', example: new Date().toISOString().slice(0, 10) }, },
                { in: 'query', name: 'location_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'department_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'type', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'is_active', schema: { type: 'number', example: 1 }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create Announcements data.',
            description: 'Create Announcements data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Policy data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', example: "Party" },
                        start_date: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                        end_date: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                        location_id: { type: 'number', example: 1 },
                        department_id: { type: 'number', example: 1 },
                        type: { type: 'number', example: 1, },
                        description: { type: 'string', example: "Party Hard", },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update Announcements data.',
            description: 'Update Announcements data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Policy data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 1 },
                        title: { type: 'string', example: "Party" },
                        start_date: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                        end_date: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                        location_id: { type: 'number', example: 1 },
                        department_id: { type: 'number', example: 1 },
                        type: { type: 'number', example: 1 },
                        description: { type: 'string', example: "Party Hard", },
                        is_active: { type: 'number', example: 1 }
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete Announcements data.',
            description: 'Delete Announcements data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Policy data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 1 },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/award': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Awards',
            description: 'Get Award List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'award_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create award',
            description: 'Create award',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'awardData',
                description: 'Create award data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        award_type: {
                            type: 'string',
                            example: 'text',
                        },
                        award_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        gift: {
                            type: 'string',
                            example: "text",
                        },
                        cash: {
                            type: 'string',
                            example: "1000",
                        },
                        award_info: {
                            type: 'string',
                            example: "text",
                        },
                        award_photo: {
                            type: 'string',
                            example: "text",
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update award',
            description: 'Update award',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'awardData',
                description: 'Update award data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        award_id: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        award_type: {
                            type: 'number',
                            example: 1,
                        },
                        award_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        gift: {
                            type: 'string',
                            example: "text",
                        },
                        cash: {
                            type: 'string',
                            example: "1000",
                        },
                        award_info: {
                            type: 'string',
                            example: "text",
                        },
                        award_photo: {
                            type: 'string',
                            example: "text",
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete award data.',
            description: 'Delete award data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Award data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['award_id'],
                    properties: {
                        award_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/promotion': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Promotion',
            description: 'Get Promotion List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'promotion_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create promotion data',
            description: 'Create promotion data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'promotionData',
                description: 'Create promotion data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        title: {
                            type: 'string',
                            example: 'text',
                        },
                        description: {
                            type: 'string',
                            example: 'text',
                        },
                        date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update promotion data',
            description: 'Update promotion data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'promotionData',
                description: 'Update promotion data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        promotion_id: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        title: {
                            type: 'string',
                            example: 'text',
                        },
                        description: {
                            type: 'string',
                            example: 'text',
                        },
                        date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete promotion data.',
            description: 'Delete promotion data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Promotion data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['promotion_id'],
                    properties: {
                        promotion_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/termination': {
        get: {
            tags: ['Hrms'],
            summary: 'Get termination',
            description: 'Get termination List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'termination_id',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'type',
                schema: { type: 'number', example: 1 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create termination data',
            description: 'Create termination data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'terminationData',
                description: 'Create termination data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        type: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        notice: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        termination: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        reason: {
                            type: 'string',
                            example: 'text',
                        },
                        description: {
                            type: 'string',
                            example: 'text',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update promotion data',
            description: 'Update promotion data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'promotionData',
                description: 'Update promotion data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        type: {
                            type: 'number',
                            example: 1,
                        },
                        termination_id: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        notice: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        termination: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        status: {
                            type: 'number',
                            example: 1,
                        },
                        reason: {
                            type: 'string',
                            example: 'text',
                        },
                        description: {
                            type: 'string',
                            example: 'text',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete termination data.',
            description: 'Delete termination data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Termination data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['termination_id'],
                    properties: {
                        termination_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/hrms/travel': {
        get: {
            tags: ['Hrms'],
            summary: 'Get travel',
            description: 'Get travel List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'travel_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create travel data',
            description: 'Create travel data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'travelData',
                description: 'Create travel data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        purpose: {
                            type: 'string',
                            example: 'text',
                        },
                        place: {
                            type: 'string',
                            example: 'text',
                        },
                        travel_mode: {
                            type: 'string',
                            example: 'text',
                        },
                        arrangement_type: {
                            type: 'string',
                            example: 'text',
                        },
                        expected_travel_budget: {
                            type: 'string',
                            example: 'text',
                        },
                        actual_travel_budget: {
                            type: 'string',
                            example: 'text',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update travel data',
            description: 'Update travel data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'travelData',
                description: 'Update travel data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        travel_id: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        purpose: {
                            type: 'string',
                            example: 'text',
                        },
                        place: {
                            type: 'string',
                            example: 'text',
                        },
                        travel_mode: {
                            type: 'string',
                            example: 'text',
                        },
                        arrangement_type: {
                            type: 'string',
                            example: 'text',
                        },
                        expected_travel_budget: {
                            type: 'string',
                            example: 'text',
                        },
                        actual_travel_budget: {
                            type: 'string',
                            example: 'text',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        patch: {
            tags: ['Hrms'],
            summary: 'Update travel status',
            description: 'Update travel status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'travelData',
                description: 'Update travel status',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        travel_id: {
                            type: 'number',
                            example: 1,
                        },
                        status: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete travel data.',
            description: 'Delete travel data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Travel data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['travel_id'],
                    properties: {
                        travel_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/hrms/get-holidays': {
        get: {
            tags: ['Hrms'],
            summary: 'Get holiday',
            description: 'Get holiday List',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/create-holidays': {
        post: {
            tags: ['Hrms'],
            summary: 'Create holidays data',
            description: 'Create holidays data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'holidayData',
                description: 'Create holiday data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        holiday_name: {
                            type: 'string',
                            example: "text",
                        },
                        holiday_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },

                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/hrms/holiday': {
        put: {
            tags: ['Hrms'],
            summary: 'Update holidays data',
            description: 'Update holidays data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'holidayData',
                description: 'Update holidays data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        id: {
                            type: 'number',
                            example: 1,
                        },
                        holiday_name: {
                            type: 'string',
                            example: 'text',
                        },
                        holiday_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/delete-holidays': {
        delete: {
            tags: ['Hrms'],
            summary: 'Delete holidays data.',
            description: 'Delete holidays data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'holiday data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },


    '/hrms/leave': {
        get: {
            tags: ['Hrms'],
            summary: 'Get leave',
            description: 'Get leave List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'leave_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create leave data',
            description: 'Create leave data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'leavelData',
                description: 'Create leave data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        day_type: {
                            type: 'number',
                            example: 1,
                        },
                        leave_type: {
                            type: 'number',
                            example: 1,
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        reason: {
                            type: 'string',
                            example: 'text',
                        },
                        status: {
                            type: 'number',
                            example: 3,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update leave data',
            description: 'Update leave data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'leaveData',
                description: 'Update leave data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        leave_id: {
                            type: 'number',
                            example: 1,
                        },
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        day_type: {
                            type: 'number',
                            example: 1,
                        },
                        leave_type: {
                            type: 'number',
                            example: 1,
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-11-04',
                        },
                        reason: {
                            type: 'string',
                            example: 'text',
                        },
                        status: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        patch: {
            tags: ['Hrms'],
            summary: 'Update leave status',
            description: 'Update leave status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'leaveData',
                description: 'Update leave status',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        leave_id: {
                            type: 'number',
                            example: 1,
                        },
                        status: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete leave data.',
            description: 'Delete leave data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Leave data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['leave_id'],
                    properties: {
                        leave_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/hrms/leave-by-status': {
        get: {
            tags: ['Hrms'],
            summary: 'Get leaves By Staus',
            description: 'Get leave List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'status', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'month', schema: { type: 'string', example: new Date().toISOString().slice(0, 7) }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/leave-type': {
        get: {
            tags: ['Hrms'],
            summary: 'Get leave',
            description: 'Get leave List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'leave_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create leave type data',
            description: 'Create leave type data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'leavetypeData',
                description: 'Create leave type data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'text',
                        },
                        duration: {
                            type: 'number',
                            example: 1,
                        },
                        number_of_days: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update leave type data',
            description: 'Update leave type data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'leavetypeData',
                description: 'Update leave type data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        leave_id: {
                            type: 'number',
                            example: 1,
                        },
                        name: {
                            type: 'string',
                            example: 'text',
                        },
                        duration: {
                            type: 'number',
                            example: 1,
                        },
                        number_of_days: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete leave type data.',
            description: 'Delete leave type data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Leave type data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['leave_id'],
                    properties: {
                        leave_id: {
                            type: 'number',
                            example: 1,
                        },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/leave-details': {
        get: {
            tags: ['Hrms'],
            summary: 'Get leave details',
            description: 'Get leave details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'leave_id',
                schema: { type: 'number', example: 1 },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update leave details',
            description: 'Update leave details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'leaveDetails',
                description: 'Update leave details',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        leave_id: {
                            type: 'number',
                            example: 1,
                        },
                        approved: {
                            type: 'array',
                            example: ["2022-01-10"],
                        },
                        type: {
                            type: 'number',
                            example: 1,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/leave-override': {
        get: {
            tags: ['Hrms'],
            summary: 'Manual Leaves Override',
            description: 'Get Leaves Overridden for Employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'name', schema: { type: 'string', example: 'Node JS' }, },
                { in: 'query', name: 'skip', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 10 }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Manual Leaves Override',
            description: 'Get Leaves Overridden for Employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employee_id', 'leave_id', 'no_of_leaves'],
                    properties: {
                        employee_id: { type: 'number', example: 1 },
                        leaves: {
                            type: 'array',
                            example: [{ leave_id: 1, no_of_leaves: 1 }]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/attendance': {
        get: {
            tags: ['Hrms'],
            summary: 'Get attendance',
            description: 'Get Employe attendance List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "location_id", schema: { type: "number", example: 1, default: 0 } },
                { in: "query", name: "department_id", schema: { type: "number", example: 1, default: 0 } },
                { in: "query", name: "role_id", schema: { type: "number", example: 1, default: 0 } },
                { in: 'query', name: 'date', schema: { type: 'number', example: 202103 }, description: "Date mast be format 'YYYYMM' (ex. moment(date).format(YYYYMM))", default: `${moment().format('YYYYMM')} (Current month)` },
                { in: 'query', name: "name", schema: { type: 'string', example: 'mahesh' }, description: 'Search filter based `first name` and min `3` charecters required', },
                { in: 'query', name: "sortColumn", schema: { type: 'string', example: 'Location' }, description: 'Column sorting `Full Name,Location,Department,EMP-Code`', },
                { in: 'query', name: "sortOrder", schema: { type: 'string', example: 'A' }, description: '`A-ascending and D-descending `', },
                { in: 'query', name: "skip", schema: { type: 'number', example: '0' } },
                { in: 'query', name: "limit", schema: { type: 'number', example: '10' } },
                { in: 'query', name: "status", schema: { type: 'number', example: 1, }, description: "status must be in [1,2,null,'']" },
                { in: 'query', name: "employee_type", schema: { type: 'number', example: 0, }, description: "employee_type must be in [0,1,2,3,4,5]" },
                { in: 'query', name: "employee_id", schema: { type: 'number', example: 0, }, description: "employee_id" },
                { in: 'query', name: 'start_date', schema: { type: 'string', example: '2021-01-10' }, description: "Date must be in format YYYY-MM-DD ", default: null },
                { in: 'query', name: 'end_date', schema: { type: 'string', example: '2021-01-20' }, description: "Date must be in format YYYY-MM-DD ", default: null }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/attendanceOverride': {
        post: {
            tags: ['Hrms'],
            summary: 'Manual Attendance Override',
            description: 'Overrides Attendance Manually',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'attendanceData',
                description: 'Status - 1 => Present, 2 => Absent, 3 => Half-Day, 4 => Leave, 5 => Week-off',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employee_id', 'date', 'status'],
                    properties: {
                        employee_id: { type: 'number', example: 1 },
                        date: { type: 'string', example: '2021-10-15' },
                        status: { type: 'number', example: 1 },
                        leave_id: { type: 'number', example: 1 },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/attendance/mark': {
        get: {
            tags: ['Hrms'],
            summary: 'get mark attendance',
            description: 'get mark attendance',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'post mark attendance',
            description: 'create Employe attendance',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'markAttendance',
                    schema: {
                        type: 'object',
                        required: ['date', 'check_time'],
                        properties: {
                            date: {
                                type: 'string',
                                example: '2020-01-01',
                            },
                            check_time: {
                                type: 'string',
                                example: new Date().toISOString(),
                            },
                            ip : {
                                type: 'string',
                                example: '192.168.5.111'
                            },
                            device_os : {
                                type: 'string',
                                example: 'Windows'
                            },
                            device_type : {
                                type: 'string',
                                example: 'Mobile'
                            },
                            browser : {
                                type: 'string',
                                example: 'Edge'
                            },
                            city : {
                                type: 'string',
                                example: 'Bhilai'
                            },
                            internet_provider : {
                                type: 'string',
                                example: 'Bharti Airtel Ltd., Telemedia Services'
                            },
                            region : {
                                type: 'string',
                                example: 'Chhattisgarh'
                            },
                            country : {
                                type: 'string',
                                example: 'India'
                            },
                            latitude : {
                                type: 'string',
                                example: '21.2129'
                            },
                            longitude : {
                                type: 'string',
                                example: '81.4293'
                            },
                            geolocation_enabled : {
                                type: 'boolean',
                                example: false
                            }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/attendance-request': {
        post: {
            tags: ['Hrms'],
            summary: 'Manual Attendance Request',
            description: 'Raise request for Attendance changes',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'attendanceData',
                required: true,
                schema: {
                    type: 'object',
                    required: ['date', 'check_in', 'check_out', 'reason'],
                    properties: {
                        date: { type: 'string', example: '2021-10-15' },
                        check_in: { type: 'string', example: new Date().toISOString() },
                        check_out: { type: 'string', example: new Date().toISOString() },
                        reason: { type: 'string', example: 'text' },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/requestAttendance': {
        get: {
            tags: ['Hrms'],
            summary: 'Request Attendance Data',
            description: 'Gives Request Attendance Data.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'id', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'status', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'date', schema: { type: 'string', example: '2021-11-17' }, },
                { in: 'query', name: 'month', schema: { type: 'string', example: '2022-03-12' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Request Attendance',
            description: 'Changes Request Attendance.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'attendanceData',
                description: 'Status - 1 => Approved, 2 => Rejected, 3 => Pending',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id', 'status'],
                    properties: {
                        id: { type: 'number', example: 1 },
                        status: { type: 'number', example: 1 },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/password': {
        get: {
            tags: ['Hrms'],
            summary: 'Check Password',
            description: 'Check HRMS and Bank Button Password',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'type', schema: { type: 'number', example: 1 }, },
                { in: 'query', name: 'password', schema: { type: 'string', example: "text" }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Create Password',
            description: 'Create HRMS and Bank Button Password',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'passwordData',
                description: 'Create HRMS Password',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        type: { type: 'number', example: 1, },
                        password: { type: 'string', example: "text", },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/password/forgot': {
        get: {
            tags: ['Hrms'],
            summary: 'Forgot Password',
            description: 'Forgot HRMS and Bank Button Password',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'type', schema: { type: 'number', example: 1 }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Code sent to Email',
            description: 'Check the code sent to Email',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'passwordData',
                description: 'Create HRMS Password',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        type: { type: 'number', example: 1, },
                        code: { type: 'number', example: 1234, },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/setting': {
        get: {
            tags: ['Hrms'],
            summary: 'Get leave',
            description: 'Get leave List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'name',
                schema: { type: 'string', example: "text" },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update setting data',
            description: 'Update setting data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'settingsData',
                description: 'Update settings data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        name: {
                            type: 'string',
                            example: "text",
                        },
                        type: {
                            type: 'number',
                            example: 1,
                        },
                        values: {
                            type: 'number',
                            example: 1,
                        },
                        manual_hours: {
                            type: 'number',
                            example: 1,
                        },
                        colors: {
                            type: 'object',
                            properties: {
                                leaves: {
                                    type: 'string',
                                    example: "text",
                                },
                                attendance_override: {
                                    type: 'string',
                                    example: "text",
                                },
                                holidays: {
                                    type: 'string',
                                    example: "text",
                                },
                                weekOff: {
                                    type: 'string',
                                    example: "text",
                                },
                                absent: {
                                    type: 'string',
                                    example: "text",
                                },
                            }
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/basic-info': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Basic Information',
            description: 'Get Employe Basic Information',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "location_id", schema: { type: "number", example: 1, default: 0 } },
                { in: "query", name: "department_id", schema: { type: "number", example: 1, default: 0 } },
                { in: "query", name: "role_id", schema: { type: "number", example: 1, default: 0 } },
                { in: 'query', name: "name", schema: { type: 'string', example: 'mahesh' }, description: 'Search filter based `first name` and min `3` charecters required', },
                { in: 'query', name: "sortColumn", schema: { type: 'string', example: 'Location' }, description: 'Column sorting `Full Name,Location,Department,EMP-Code`', },
                { in: 'query', name: "sortOrder", schema: { type: 'string', example: 'A' }, description: '`A-ascending and D-descending `', },
                { in: 'query', name: "skip", schema: { type: 'number', example: '0' } },
                { in: 'query', name: "limit", schema: { type: 'number', example: '10' } },
                { in: 'query', name: "status", schema: { type: 'number', example: 1, }, description: "status must be in [1,2,null,'']" },
                { in: 'query', name: "employee_type", schema: { type: 'number', example: 0, }, description: "employee_type must be in [0,1,2,3,4,5]" },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Update Employee Information',
            description: 'Update Employee Information',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'employeeData',
                description: 'Update Employee Information',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        id: {
                            type: 'number',
                            example: 1,
                        },
                        location_id: {
                            type: 'number',
                            example: 1,
                        },
                        department_id: {
                            type: 'number',
                            example: 1,
                        },
                        father_name: {
                            type: 'string',
                            example: 'text',
                        },
                        mother_name: {
                            type: 'string',
                            example: 'text',
                        },
                        spouse_name: {
                            type: 'string',
                            example: 'text',
                        },
                        marital_status: {
                            type: 'number',
                            example: 1,
                        },
                        date_of_birth: {
                            type: 'date',
                            example: new Date().toISOString().slice(0, 10),
                        },
                        govt_id: {
                            type: 'string',
                            example: '123456',
                        },
                        pt_location: {
                            type: 'number',
                            example: 1,
                        },
                        pt_location_name: {
                            type: 'string',
                            example: 'text',
                        },
                        pan_number: {
                            type: 'string',
                            example: 'ABC123456',
                        },
                        pf_number: {
                            type: 'string',
                            example: '123456',
                        },
                        esi_number: {
                            type: 'string',
                            example: '123456',
                        },
                        eps_number: {
                            type: 'string',
                            example: '123456',
                        },
                        uan_number: {
                            type: 'string',
                            example: '123456',
                        },
                        ctc: {
                            type: 'string',
                            example: '123456',
                        },
                        shift_id: {
                            type: 'number',
                            example: '1',
                        },
                        shift_month: {
                            type: 'string',
                            example: '01',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/get-email-alert-birthday': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Basic Information',
            description: 'Get Employe Basic Information',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/add-email-alert-birthday': {
        post: {
            tags: ['Hrms'],
            summary: 'Update Employee Information',
            description: 'Update Employee Information',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'employeeData',
                    description: 'Update Employee Information',
                    required: true,
                    schema: {
                        type: 'object',
                        required: [],
                        properties: {
                            to_email: {
                                type: 'array',
                                example: ['user@mail.com'],
                            },
                            cc_email: {
                                type: 'array',
                                example: ['user@mail.com'],
                            },
                            bcc_email: {
                                type: 'array',
                                example: ['user@mail.com'],
                            },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /** Employee Shifts Swagger */
    '/hrms/employee-shifts': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Employee Shifts Data',
            description: 'Get Employee Shifts Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "name", schema: { type: "string", example: "globussoft" } },
                { in: "query", name: "employee_id", schema: { type: "number", example: 1 } },
                { in: "query", name: "skip", schema: { type: "number", example: 1 } },
                { in: "query", name: "limit", schema: { type: "number", example: 10 } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Update Employee Shifts Data',
            description: 'Update Employee Shifts Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'employeeShiftsData',
                description: 'Update Employee Shifts Data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        shift_id: { type: 'number', example: 1, },
                        start_date: { type: 'string', example: new Date().toISOString().slice(0, 10) },
                        end_date: { type: 'string', example: new Date().toISOString().slice(0, 10) },
                        employee_ids: { type: 'array', example: [1, 2, 3, 4, 5] }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete Employee Shifts Data',
            description: 'Delete Employee Shifts Data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'employeeShiftsData',
                description: 'Delete Employee Shifts Data',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        shift_id: { type: 'number', example: 1 },
                        employee_id: { type: 'number', example: 1 }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    '/hrms/employee-details': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Employee All Information',
            description: 'Get Employee All Information',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "employee_id", schema: { type: "number", example: 1, default: 0 } },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/compliance': {
        put: {
            tags: ['Hrms'],
            summary: 'Update Employee Compliance Details',
            description: 'Update Employee Compliance Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'employeeData',
                description: 'Update Employee Compliance Details',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        employee_id: {
                            type: 'number',
                            example: 1,
                        },
                        pt_location: {
                            type: 'number',
                            example: 1,
                        },
                        pt_location_name: {
                            type: 'string',
                            example: 'text',
                        },
                        pan_number: {
                            type: 'string',
                            example: 'ABC123456',
                        },
                        pf_number: {
                            type: 'string',
                            example: '123456',
                        },
                        esi_number: {
                            type: 'string',
                            example: '123456',
                        },
                        uan_number: {
                            type: 'string',
                            example: '123456',
                        },
                        ctc: {
                            type: 'string',
                            example: '123456',
                        },
                        eligible_pf: {
                            type: 'number',
                            example: '1',
                        },
                        pf_scheme: {
                            type: 'string',
                            example: 'text',
                        },
                        pf_joining: {
                            type: 'string',
                            example: '2021-06-01',
                        },
                        excess_pf: {
                            type: 'number',
                            example: '1',
                        },
                        excess_eps: {
                            type: 'number',
                            example: '1',
                        },
                        exist_pf: {
                            type: 'number',
                            example: '1',
                        },
                        eligible_esi: {
                            type: 'number',
                            example: '1',
                        },
                        eligible_pt: {
                            type: 'number',
                            example: '1',
                        },
                        effective_date: {
                            type: 'string',
                            example: '2021-06-01',
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            description: 'Upload Compliance',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload Compliance',
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/get-bankdetails': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Employee Bank details',
            description: 'Get Employee Bank details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "location_id", schema: { type: "number", example: 1, default: 0 } },
                { in: "query", name: "department_id", schema: { type: "number", example: 1, default: 0 } },
                { in: "query", name: "role_id", schema: { type: "number", example: 1, default: 0 } },
                { in: 'query', name: "name", schema: { type: 'string', example: 'mahesh' }, description: 'Search filter based `first name` and min `3` charecters required', },
                { in: 'query', name: "sortColumn", schema: { type: 'string', example: 'Location' }, description: 'Column sorting `Full Name,Location,Department,EMP-Code`', },
                { in: 'query', name: "sortOrder", schema: { type: 'string', example: 'A' }, description: '`A-ascending and D-descending `', },
                { in: 'query', name: "skip", schema: { type: 'number', example: '0' } },
                { in: 'query', name: "limit", schema: { type: 'number', example: '10' } },
                { in: 'query', name: "status", schema: { type: 'number', example: 1, }, description: "status must be in [1,2,null,'']" },
                { in: 'query', name: "employee_type", schema: { type: 'number', example: 0, }, description: "employee_type must be in [0,1,2,3,4,5]" },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/update-bankdetails': {
        put: {
            tags: ['Hrms'],
            summary: 'Put Employee experience details',
            description: 'Put Employee experience details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employee_id', 'bank_name', 'account_number', 'ifsc_code', 'bank_address'],
                    properties: {
                        employee_id: { type: 'number', example: 1 },
                        bank_name: { type: 'string', example: "text" },
                        account_number: { type: 'string', example: "1234" },
                        ifsc_code: { type: 'string', example: "abc123" },
                        bank_address: { type: 'string', example: 'text' },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/hrms/bank-details/bulk-update': {
        post: {
            tags: ['Hrms'],
            description: 'Upload Bank/Basic details',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'detailsType',
                schema: { type: 'string', example: 'bank', },
                description: 'File type',
                enum: ['bank', 'basic'],
            },
            {
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload Bank/Basic details',
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/hrms/employee-details/experience': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Employee experience details',
            description: 'Get Employee experience details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "employeeId", schema: { type: "number", example: 1, default: 0 } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Post Employee experience details',
            description: 'Post Employee experience details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employeeId', 'nameOfCompany', 'designation', 'leavingDate'],
                    properties: {
                        employeeId: { type: 'number', example: 1 },
                        nameOfCompany: { type: 'string', example: "Some Dummy Pvt. Ltd." },
                        designation: { type: 'string', example: "Some Sr. Designation" },
                        reportingManager: { type: 'string', example: "Some Manager" },
                        contactOfReportingManager: { type: 'string', example: '8080809999' },
                        joiningDate: { type: 'string', example: "2019-01-01" },
                        leavingDate: { type: 'string', example: "2021-03-01" },
                        reasonForLeaving: { type: 'string', example: "Career Growth" },
                        hrName: { type: 'string', example: 'Some Hr' },
                        hrMailId: { type: 'string', example: 'some.Hr@mail.com' },
                        hrContactNo: { type: 'string', example: "8989890000" }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Put Employee experience details',
            description: 'Put Employee experience details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['_id', 'employeeId', 'nameOfCompany', 'designation', 'leavingDate'],
                    properties: {
                        _id: { type: 'number', example: new Date().getTime() },
                        employeeId: { type: 'number', example: 1 },
                        nameOfCompany: { type: 'string', example: "Some Dummy Pvt. Ltd." },
                        designation: { type: 'string', example: "Some Sr. Designation" },
                        reportingManager: { type: 'string', example: "Some Manager" },
                        contactOfReportingManager: { type: 'string', example: '8080809999' },
                        joiningDate: { type: 'string', example: "2019-01-01" },
                        leavingDate: { type: 'string', example: "2021-03-01" },
                        reasonForLeaving: { type: 'string', example: "Career Growth" },
                        hrName: { type: 'string', example: 'Some Hr' },
                        hrMailId: { type: 'string', example: 'some.Hr@mail.com' },
                        hrContactNo: { type: 'string', example: "8989890000" }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete Employee experience details',
            description: 'Delete Employee experience details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['_id', 'employeeId'],
                    properties: {
                        _id: { type: 'number', example: new Date().getTime() },
                        employeeId: { type: 'number', example: 1 }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/employee-details/family': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Employee family details',
            description: 'Get Employee family details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "employeeId", schema: { type: "number", example: 1, default: 0 } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Post Employee family details',
            description: 'Post Employee family details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee family details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'employeeId', 'nameOfFamilyMember', 'age', 'gender',
                        'relationShipWithEmployee', 'occupation', 'dateOfBirth',
                        'aadharNo', 'panNo', "isContactPerson"
                    ],
                    properties: {
                        employeeId: { type: 'number', example: 1 },
                        nameOfFamilyMember: { type: 'string', example: 1 },
                        age: { type: 'number', example: 10 },
                        gender: { type: 'string', example: 'male' },
                        relationShipWithEmployee: { type: 'string', example: 'son' },
                        occupation: { type: 'string', example: 1 },
                        dateOfBirth: { type: 'string', example: '2020-01-01' },
                        aadharNo: { type: 'string', example: '1234 4567 7890' },
                        panNo: { type: 'string', example: 'ABCD6666Z' },
                        contactNo: { type: 'string', example: "8989890000" },
                        isContactPerson: { type: 'boolean', example: 'false' },
                        bloodGroup: { type: 'string', example: "A+" }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Put Employee family details',
            description: 'Put Employee experience details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'employeeId', 'nameOfFamilyMember', 'age', 'gender',
                        'relationShipWithEmployee', 'occupation', 'dateOfBirth',
                        'aadharNo', 'panNo', 'isContactPerson'
                    ],
                    properties: {
                        _id: { type: 'number', example: new Date().getTime() },
                        employeeId: { type: 'number', example: 1 },
                        nameOfFamilyMember: { type: 'string', example: 1 },
                        age: { type: 'number', example: 10 },
                        gender: { type: 'string', example: 'male' },
                        relationShipWithEmployee: { type: 'string', example: 'son' },
                        occupation: { type: 'string', example: 1 },
                        dateOfBirth: { type: 'string', example: '2020-01-01' },
                        aadharNo: { type: 'string', example: '1234 4567 7890' },
                        panNo: { type: 'string', example: 'ABCD6666Z' },
                        contactNo: { type: 'string', example: "8989890000" },
                        isContactPerson: { type: 'boolean', example: 'false' },
                        bloodGroup: { type: 'string', example: "A+" }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete Employee experience details',
            description: 'Delete setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['_id', 'employeeId'],
                    properties: {
                        _id: { type: 'number', example: new Date().getTime() },
                        employeeId: { type: 'number', example: 1 }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/employee-details/qualification': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Employee qualification details',
            description: 'Get Employee qualification details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "employeeId", schema: { type: "number", example: 1, default: 0 } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Post Employee qualification details',
            description: 'Post Employee qualification details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee experience details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'employeeId', 'qualificationType', 'nameOfInstitue', 'universityBoard',
                        'yearOfPassing', 'percentageGrade'
                    ],
                    properties: {
                        employeeId: { type: 'number', example: 1 },
                        qualificationType: { type: 'string', example: 'Other Qualification' },
                        qualificationDetails: { type: 'string', example: 'Some details for the other qualification' },
                        nameOfInstitue: { type: 'string', example: 'Some institute' },
                        universityBoard: { type: 'string', example: 'some university' },
                        yearOfPassing: { type: 'string', example: '2019-01-01' },
                        percentageGrade: { type: 'string', example: '9.0' }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Put Employee qualification details',
            description: 'Put Employee qualification details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee qualification details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [
                        'employeeId', 'qualificationType', 'nameOfInstitue', 'universityBoard',
                        'yearOfPassing', 'percentageGrade'
                    ],
                    properties: {
                        _id: { type: 'number', example: new Date().getTime() },
                        employeeId: { type: 'number', example: 1 },
                        qualificationType: { type: 'string', example: 'Other Qualification' },
                        qualificationDetails: { type: 'string', example: 'Some details for the other qualification' },
                        nameOfInstitue: { type: 'string', example: 'Some institute' },
                        universityBoard: { type: 'string', example: 'some university' },
                        yearOfPassing: { type: 'string', example: '2019-01-01' },
                        percentageGrade: { type: 'string', example: '9.0' }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        delete: {
            tags: ['Hrms'],
            summary: 'Delete Employee qualification details',
            description: 'Delete setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Employee qualification details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['_id', 'employeeId'],
                    properties: {
                        _id: { type: 'number', example: new Date().getTime() },
                        employeeId: { type: 'number', example: 1 }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/get-geo-field-data': {
        post: {
            tags: ['Hrms'],
            summary: 'API to get the GeoLocation Details',
            description: 'API to get the GeoLocation Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Field Location Details',
                    description: 'Employee/Manager Signin ',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['locationName'],
                        properties: {
                            locationName: { type: 'string', example: 'Bangalore' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/employee-details/requestDetails': {
        get: {
            tags: ['Hrms'],
            summary: 'Request Employee details.',
            description: 'Get Requested Employee details.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: "query", name: "id", schema: { type: "string", example: '61bae98b74e0322f1c30b758' } },
                { in: "query", name: "status", schema: { type: "number", example: 1 }, description: 'status => 1-Pending, 2-Accepted, 3-Rejected.' },
                { in: "query", name: "type", schema: { type: "number", example: 1 }, description: 'type => 1-basic details, 2-bank details, 3-compliance details, 4-qualification details, 5-expirence details, 6-family details.' },
                { in: "query", name: "updated_at", schema: { type: "date", example: new Date().toISOString().slice(0, 10) } },
                { in: "query", name: "created_at", schema: { type: "date", example: new Date().toISOString().slice(0, 10) } },
                { in: "query", name: "employee_id", schema: { type: "number", example: 1 } },
                { in: "query", name: "updated_by", schema: { type: "number", example: 1 }, description: 'Should be user_id' },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Request Employee details.',
            description: 'Create Request Employee details.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Request Employee details data',
                description: 'type => 1-basic details, 2-bank details, 3-compliance details, 4-qualification details, 5-expirence details, 6-family details.',
                required: true,
                schema: {
                    type: 'object',
                    properties: {
                        id: { type: "string", example: '61bae98b74e0322f1c30b758' },
                        delete: { type: 'boolean', example: false },
                        type: { type: 'number', example: 1 },
                        module_name: { type: 'string', example: 'department' },
                        value: { example: 'Node JS' },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms'],
            summary: 'Request Employee details.',
            description: 'Update Request Employee details.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Request Employee details data',
                description: 'status =>  2 - Accept, 3- Reject',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', example: '61bc7ff1ce6c9f37783efb70' },
                        status: { type: 'number', example: 2 },
                        delete: { type: 'boolean', example: false },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    //----------- Organization Details
    '/hrms/organizationDetails': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Organization details',
            description: 'Get Oragnization details',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/organizationDetails/basicDetails': {
        post: {
            tags: ['Hrms'],
            summary: 'Update Basic details',
            description: 'Update Basic details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Basic details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        registeredCompanyName: { type: 'string', example: 'Globussoft' },
                        brandName: { type: 'string', example: 'Globussoft' },
                        director: { type: 'string', example: 'Sumit Ghosh' },
                        domainName: { type: 'string', example: 'Globussoft.com' },
                        website: { type: 'string', example: 'www.Globussoft.com' },
                        email: { type: 'string', example: 'glb@globussoft.in' },
                        contactNumber: { type: 'number', example: '123456789' },
                        registeredOfficeAddress: { type: 'string', example: 'ABCD Building, sector 11, Line Naka, HSR Layout, Banglore.' },
                        corporateOfficeAddress: { type: 'string', example: 'ABCD Building, sector 11, Line Naka, HSR Layout, Banglore.' },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/organizationDetails/bankDetails': {
        post: {
            tags: ['Hrms'],
            summary: 'Update Bank details',
            description: 'Update Bank details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Bank details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        id: { type: 'number', example: '1' },
                        bankName: { type: 'string', example: 'SBI' },
                        ifsc: { type: 'string', example: 'SBIn0123456' },
                        accountNumber: { type: 'string', example: 'BSB3659874' },
                        accountType: { type: 'string', example: 'CA' },
                        branchName: { type: 'string', example: 'Bhilai' },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/organizationDetails/complianceDetails': {
        post: {
            tags: ['Hrms'],
            summary: 'Update Compliance details',
            description: 'Update Compliance details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Compliance details data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        uan: { type: 'number', example: 1 },
                        pfJoiningDate: { type: 'string', example: '2021-12-05' },
                        excessEPF: { type: 'number', example: 0 },
                        excessEPS: { type: 'number', example: 0 },
                        existingPFMember: { type: 'number', example: 0 },
                        employeeEligibleForPT: { type: 'number', example: 0 },
                        employeeEligibleForEsi: { type: 'number', example: 0 },
                        esiNumber: { type: 'number', example: 0 },
                        pan: { type: 'number', example: 0 },
                        ctc: { type: 'number', example: 0 },
                        gross: { type: 'number', example: 0 },
                        effectiveDate: { type: 'string', example: '2021-12-05' },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/organizationDetails/org-logo': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Organization logo',
            description: 'Get Organization Logo',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/organizationDetails/upload-org-logo': {
        post: {
            tags: ['Hrms'],
            summary: 'Update Organization logo',
            description: 'Upload Organization Logo',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload Organization Logo',
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    // -------- HRMS payroll
    '/hrms/payroll/setup/setting': {
        get: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Leave type data',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    // required: ['leave_id'],
                    properties: {
                        pfAllowed: { type: 'boolean', example: true },
                        esiAllowed: { type: 'boolean', example: true },
                        ptAllowed: { type: 'boolean', example: true },
                        pfPercent: { type: 'number', example: 1 },
                        pfCeiling: { type: 'number', example: 1 },
                        paycycleFrom: { type: 'number', example: 1 },
                        isCustomSalary: { type: 'boolean', example: false },
                        contract_scheme_id: { type: 'number', example: 5 }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/setup/create-structure': {
        get: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Create  structure',
                required: true,
                schema: {
                    type: 'object',
                    required: ['policyName', 'description'],
                    properties: {
                        policyName: { type: 'string', example: 'Job Wage' },
                        description: { type: 'string', example: "This Salary Policy is for job wage" },
                        salaryComponents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Over Time', description: 'add the salary componets' },
                                    value: { type: 'string', example: 'basic * 0.12', description: 'give the formula/absolute values' },
                                    type: { type: 'number', example: '1', description: '1 - EARNING, 2 - DEDUCTION' },
                                }
                            }
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Create  structure update',
                required: true,
                schema: {
                    type: 'object',
                    required: ['policyId'],
                    properties: {
                        policyId: { type: 'number', example: 1 },
                        policyName: { type: 'string', example: 'Job Wage' },
                        description: { type: 'string', example: "This Salary Policy is for job wage" },
                        salaryComponents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Over Time', description: 'add the salary componets' },
                                    value: { type: 'string', example: 'basic * 0.12', description: 'give the formula/absolute values' },
                                    type: { type: 'number', example: '1', description: '1 - EARNING, 2 - DEDUCTION' },
                                }
                            }
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/setup/create-structure/salary-component': {
        get: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/setup/assign-structure/get-payroll-policy': {
        get: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/setup/assign-structure': {
        get: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employeeId',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'locationId',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'payrollPolicyId',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: "delhi" },
            },
            {
                in: 'query',
                name: 'sortColumn',
                schema: { type: 'string', example: 'name', },
                description: 'Sort result by selected field',
                enum: ['fullName', 'email', 'location', 'role', 'policyName', 'ctc', 'gross'],
            },
            {
                in: 'query',
                name: 'sortOrder',
                schema: { type: 'string', example: 'D', default: 'A' },
                description: 'Order of sort',
                enum: ['A', 'D']
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'employee_type',
                schema: { type: 'number', example: 0 },
                description: 'employee_type must be in [0,1,2,3,4,5]',
            }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        put: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Create  structure update',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employeeId', 'payrollPolicyId'],
                    properties: {
                        employeeId: { type: 'number', example: 1 },
                        payrollPolicyId: { type: 'number', example: 1 },
                        ctc: { type: 'number', example: 100 },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/payroll/setup/assign-structure/bulk': {
        put: {
            tags: ['HRMS:Payroll'],
            summary: 'Get setup setting',
            description: 'Get setup setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'assign structure bulk update',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employeeId', 'payrollPolicyId'],
                    properties: {
                        employeeIds: { type: 'number', example: [1] },
                        payrollPolicyId: { type: 'number', example: 1 },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/payroll/setup/payslip-settings': {
        get: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Get Payslip setting',
            description: 'Get Payslip setting',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms', 'HRMS:Payroll'],
            summary: 'Update Payslip Settings',
            description: 'Update Payslip Settings',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Update Payslip Settings',
                required: true,
                schema: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: { type: 'number', example: 1 },
                        day: { type: 'number', example: 1 },
                        template_id: { type: 'number', example: 1 },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/biometrics': {
        get: {
            tags: ['Hrms'],
            summary: 'Manual overwrite employee biometrics',
            description: 'Manual overwrite employee biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: 1 } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
        post: {
            tags: ['Hrms'],
            summary: 'Manual overwrite employee biometrics',
            description: 'Manual overwrite employee biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Manual overwrite employee biometrics',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['status'],
                        properties: {
                            employee_id: { type: 'number', example: 1 },
                            start_date: { type: 'date', example: '2024-04-25' },
                            end_date: { type: 'date', example: '2024-04-25' },
                            custom: { type: 'string', example: 'enable' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/get-bio-metric-fetch-employee-password-enable-status': {
        get: {
            tags: ['Hrms'],
            summary: 'fetch employee biometrics fetch status',
            description: 'fetch employee biometrics fetch status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/update-bio-metrics-fetch-employee-password-status': {
        post: {
            tags: ['Hrms'],
            summary: 'Manual overwrite employee biometrics password status',
            description: 'Manual overwrite employee biometrics password status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Manual overwrite employee biometrics password status',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['status'],
                        properties: {
                            status: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    
    '/hrms/get-biometrics_confirmation_status': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Confirmation Status',
            description: 'Get Confirmation Status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/hrms/update-biometrics_confirmation_status': {
        post: {
            tags: ['Hrms'],
            summary: 'Update Confirmation Status',
            description: 'Update Confirmation Status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Update Confirmation Status',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['status'],
                        properties: {
                            status: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/get-camera-overlay-status': {
        get: {
            tags: ['Hrms'],
            summary: 'Get camera overlay status',
            description: 'Get camera overlay status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    
    '/hrms/update-camera-overlay-status': {
        post: {
            tags: ['Hrms'],
            summary: 'Update camera overlay status',
            description: 'Update camera overlay status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Update camera overlay status',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['status'],
                        properties: {
                            status: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/hrms/add-biometrics-department': {
        post: {
            tags: ['Hrms'],
            summary: 'Add deparment for biometrics',
            description: 'Add deparment for biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Add deparment for biometrics',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['name', 'is_main'],
                        properties: {
                            name: { type: 'string', example: 1 },
                            is_main: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/edit-biometrics-department': {
        put: {
            tags: ['Hrms'],
            summary: 'Edit deparment for biometrics',
            description: 'Edit deparment for biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Edit deparment for biometrics',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['name', 'is_main'],
                        properties: {
                            department_id: { type: 'number', example: 1 },
                            name: { type: 'string', example: "Department Name" },
                            is_main: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/get-biometrics-department': {
        get: {
            tags: ['Hrms'],
            summary: 'Get deparment for biometrics',
            description: 'Get deparment for biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'department_id',
                    schema: { type: 'number', example: 0 },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/get-access-log': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Access Log for biometrics',
            description: 'Get Access Log for biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'date',
                    schema: { type: 'string', example: "2024-05-28" },
                },
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 1 },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/get-total-access-log-count': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Access Log count for biometrics from department',
            description: 'Get Access Log count for biometrics from department',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'department_id',
                    schema: { type: 'string', example: "1" },
                },
                {
                    in: 'query',
                    name: 'date',
                    schema: { type: 'string', example: "2024-05-28" },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/get-department-access': {
        get: {
            tags: ['Hrms'],
            summary: 'Get Access Log count for biometrics from department',
            description: 'Get Access Log count for biometrics from department',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'department_id',
                    schema: { type: 'string', example: "1" },
                },
                {
                    in: 'query',
                    name: 'date',
                    schema: { type: 'string', example: "2024-05-28" },
                },
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'string', example: "0" },
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'string', example: "10" },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/hrms/import-depatement-emp': {
        post: {
            tags: ['Hrms'],
            summary: 'Import department from emp to biometrics',
            description: 'Import department from emp to biometrics',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },


    // ------------HRMS run payroll
    ...runPayrollSwagger,
    // ------------HRMS run payroll
    // advnced payroll
    ...advanceSetting,
    // advnced payroll
    // -------- HRMS payroll
    ...payrollGeneral,
    ...declaration,

    // HRMS -- common bulk 
    ...commonBulkSwagger,
    // HRMS -- common bulk 

    '/project/create-project': {
        post: {
            tags: ['Project'],
            summary: 'Create Project.',
            description: 'Create Project.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'ProjectData',
                description: 'Create Project.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['name', 'start_date', 'end_date'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'EMP Monitor',
                        },
                        description: {
                            type: 'string',
                            example: 'discription',
                        },
                        start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },

                        user_ids: {
                            type: 'array',
                            example: [1, 2, 3],
                        },
                        module_name: {
                            type: 'string',
                            example: 'reports',
                        },
                        module_start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        module_end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },

                        task_name: {
                            type: 'string',
                            example: 'reports',
                        },
                        task_user_id: {
                            type: 'number',
                            example: 1,
                        },
                        module: {
                            type: "number",
                            example: 0,
                            description: "1-module exists ,0-module not exist "
                        },
                        priority: {
                            type: 'number',
                            example: 1,
                            description: '1:HIGH,2:MEDIUM,3:LOW	',
                        },
                        status: {
                            type: 'number',
                            example: 1,
                            description: '0:Pending,1:In Progress,2:Completed',
                        },
                        task_start_date: {
                            type: 'date',
                            example: '2020-05-17',
                        },
                        task_end_date: {
                            type: 'date',
                            example: '2020-06-17',
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/get-employees-all-projects': {
        get: {
            tags: ['Project'],
            summary: 'Get Employees All Projects or Groups All Projects or Organizations All Projects',
            description: '*send either employee_ids or group_ids or nothing  *dont send both employee_ids and group_ids   \n\n employee_ids => employees all projects \n\n  group_ids => groups all projects \n\n  send empty will get organizations all projects',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_ids', schema: { type: 'array', example: '[1,2]' }, },
                { in: 'query', name: 'group_ids', schema: { type: 'array', example: '[1,2]' }, }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/project/task-bulk-add': {
        post: {
            tags: ['Project'],
            summary: 'Add tasks by excel file',
            description: 'Add tasks for projects in bulk by excel file.',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload Tasks Details.',
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },

    '/project/project-task-data': {
        get: {
            tags: ['Project'],
            summary: 'Get project and tasks reports.',
            description: `Get project and tasks reports`,
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'projectId', schema: { type: 'array', example: '[1,2,3]' }, },
                { in: 'query', name: 'projectStatus', schema: { type: 'number', example: '0' }, },
                { in: 'query', name: 'taskStartDate', schema: { type: 'string', example: 'date' }, },
                { in: 'query', name: 'taskEndDate', schema: { type: 'string', example: 'date' }, },
                { in: 'query', name: 'taskStatus', schema: { type: 'number', example: '0' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    //geolocation
    "/location/get-geolocation": {
        get: {
            tags: ['Location'],
            description: 'get user geoLocation',
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'employee_id', schema: { type: 'number', example: '1' }, },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    /**Activity modification request API's  */
    '/settings/activity-request/create': {
        post: {
            tags: ['Activity Request'],
            summary: 'Create Activity Request.',
            description: 'Create request to update idle time to active time',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'RequestData',
                description: 'Create Activity Request.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['start_time', 'end_time', 'reason', 'date'],
                    properties: {
                        reason: {
                            type: 'string',
                            example: 'Please make idle time to acive time,attended meeting.',
                        },
                        start_time: {
                            type: 'date',
                            example: new Date().toISOString(),
                        },
                        end_time: {
                            type: "date",
                            example: new Date(new Date().getTime() + 60 * 60000).toISOString(),
                        },
                        date: {
                            type: 'date',
                            example: new Date().toISOString().slice(0, 10),
                        },
                        employee_id: {
                            type: 'number',
                            example: '12'
                        },
                        attendance_id: {
                            type: "number",
                            example: '12'
                        },
                        activity_ids: {
                            type: 'array',
                            example: ["6042296d4a2dfb644673f5b5", "6042296d4a2dfb644673f5b6"]
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/settings/activity-request/get': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Activity request',
            description: 'Get Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'employee_id',
                schema: { type: 'number', example: 1 },
            },
            {
                in: 'query',
                name: 'from_date',
                schema: { type: 'date', example: new Date().toISOString().slice(0, 10) },
            },
            {
                in: 'query',
                name: 'to_date',
                schema: { type: 'date', example: new Date().toISOString().slice(0, 10) },
            },
            {
                in: 'query',
                name: 'start_time',
                schema: { type: 'date', example: new Date().toISOString() },
            },
            {
                in: 'query',
                name: 'end_time',
                schema: { type: 'date', example: new Date(new Date().getTime() + 60 * 60000).toISOString() },
            },
            {
                in: 'query',
                name: 'search',
                schema: { type: 'string', example: "chanti" },
            },
            {
                in: 'query',
                name: 'status',
                type: 'number',
                enum: [0, 1, 2],
                description: '0-PENDING ,1-APPROVER, 2-DECLIENED',
            },
            {
                in: 'query',
                name: 'skip',
                schema: { type: 'number', example: 2 },
                required: true,
            },
            {
                in: 'query',
                name: 'limit',
                schema: { type: 'number', example: 0 },
                required: true,
            },
            {
                in: 'query',
                name: 'order',
                type: 'string',
                enum: ['A', 'D',],
            },
            {
                in: 'query',
                name: 'sortColumn',
                type: 'string',
                enum: ['date', "start_time", 'end_time', 'reason'],
            },
            {
                in: 'query',
                name: 'type',
                type: 'number',
                enum: [1, 2],
                description: '1-idle, 2-offline',
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/activity-request/update': {
        put: {
            tags: ['Activity Request'],
            summary: 'Get Activity request',
            description: 'Get Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'RequestData',
                description: 'Create Activity Request.',
                required: true,
                schema: {
                    type: 'object',
                    required: [],
                    properties: {
                        id: {
                            type: 'string',
                            example: '6030bdbe69542e1d24f918ca',
                        },
                        reason: {
                            type: 'string',
                            example: 'Please make idle time to acive time ',
                        },
                        start_time: {
                            type: 'date',
                            example: new Date().toISOString(),
                        },
                        end_time: {
                            type: "date",
                            example: new Date(new Date().getTime() + 60 * 60000).toISOString(),
                        },
                        date: {
                            type: 'date',
                            example: new Date().toISOString().slice(0, 10),
                        },
                        status: {
                            type: 'number',
                            enum: [0, 1, 2],
                            description: '0-PENDING ,1-APPROVED, 2-DECLIENED',
                        },
                        employee_id: {
                            type: 'number',
                            example: '12'
                        },
                        activity_ids: {
                            type: 'array',
                            example: ["6042296d4a2dfb644673f5b5", "6042296d4a2dfb644673f5b6"]
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/activity': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Activity ',
            description: 'Get Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'date', example: new Date().toISOString().slice(0, 10) },
            },
            {
                in: 'query',
                name: 'start_time',
                schema: { type: 'date', example: new Date().toISOString() },
            },
            {
                in: 'query',
                name: 'end_time',
                schema: { type: 'date', example: new Date(new Date().getTime() + 60 * 60000).toISOString() },
            },
            {
                in: 'query',
                name: 'type',
                schema: { type: 'number', example: 2 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/activity-request/delete': {
        delete: {
            tags: ['Activity Request'],
            summary: 'Delete Activity update request.',
            description: 'Delete Activity update request.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'activity requests',
                description: 'Request parameters.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', example: "6030bdbe69542e1d24f918ca" },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/settings/offline-activity-breakdown': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Activity ',
            description: 'Get Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'date', example: new Date().toISOString().slice(0, 10) },
            },
            {
                in: 'query',
                name: 'employeeId',
                schema: { type: 'number', example: 587 },
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/reseller': {
        get: {
            tags: ['Reseller'],
            summary: 'Reseller setting.',
            description: 'Reseller setting.',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
        post: {
            tags: ['Reseller'],
            summary: 'Upsert reseller details.',
            description: 'Upsert reseller details.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Upsert reseller',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        facebook: { type: 'string', example: "facebook.com" },
                        instagram: { type: 'string', example: "instagram.com" },
                        twitter: { type: 'string', example: "twitter.com" },
                        brand_name: { type: 'string', example: "EmpMonitor" },
                        domain: { type: 'string', example: "empmonitor" },
                        logo: { type: 'string', example: "facebook.com" },
                        copyright_name: { type: 'string', example: "empmonitor" },
                        copyright_year: { type: 'string', example: "2020-2021" },
                        support_text: { type: 'string', example: "support" },
                        support_mail: { type: 'string', example: "support@gmail.com" },
                        skype_email: { type: 'string', example: "support@skype" },
                        help_link: { type: 'string', example: "help.com" },
                        admin_email: { type: 'string', example: "admin.com" },
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/settings/activity-request/notification': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Activity request',
            description: 'Get Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/get-auto-time-claim-status': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Activity request Status',
            description: 'Get Activity request for Auto Claim',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/update-auto-time-claim-status': {
        put: {
            tags: ['Activity Request'],
            summary: 'Update Activity request Status',
            description: 'Update Activity request for Auto Claim',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Time Claim Status',
                required: true,
                schema: {
                    type: 'object',
                    required: ['is_enable'],
                    properties: {
                        is_enable: { type: 'string', example: "true" },
                    }
                },
            }],
        }
    },
    '/settings/break-request/get': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Break Activity request',
            description: 'Get Break Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_id',
                    required: true,
                    schema: { type: 'number', example: 26028 },
                },
                {
                    in: 'query',
                    name: 'date',
                    required: true,
                    schema: { type: 'date', example: new Date().toISOString().slice(0, 10) },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/break-request/update': {
        post: {
            tags: ['Activity Request'],
            summary: 'Update Break Activity request',
            description: 'Update Break Activity request',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' breakData',
                    description: 'Update Break Request Data',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '63eb1e6559879706c4cf4d66' },
                            status: { type: 'number', example: 1 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/break-request/delete': {
        delete: {
            tags: ['Activity Request'],
            summary: 'Delete pending Break request',
            description: 'Delete pending Break request',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'breakData',
                    description: 'Delete pending Break request',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '63eb1e6559879706c4cf4d66' }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/reason/fetch': {
        get: {
            tags: ['Activity Request'],
            summary: 'Get Break reason',
            description: 'Get Break reasons',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'type',
                    type: 'number',
                    enum: [1, 2, 3],
                    description: '1-IDLE, 2-OFFLINE, 3-BREAK',
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/reason/create': {
        post: {
            tags: ['Activity Request'],
            summary: 'Create time claim reason',
            description: 'Create time claim reason',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Create reason',
                    description: 'Create new reason',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'Meeting' },
                            type: { type: 'number', example: 1 }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/reason/delete': {
        delete: {
            tags: ['Activity Request'],
            summary: 'Create time claim reason',
            description: 'Create time claim reason',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'id',
                    type: 'string',
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    /* Activity Modification Request for Attendance time claim */
    '/settings/attendance-request/create': {
            post: {
                tags: ['Activity Request'],
                summary: 'Create Activity Request for Attendance Request.',
                description: 'Create request to Create Attendance Request',
                consumes: ['application/json'],
                produces: ['application/json'],
                parameters: [
                    {
                        in: 'body',
                        name: 'RequestData',
                        description: 'Create Activity Request.',
                        required: true,
                        schema: {
                            type: 'object',
                            required: ['start_time', 'end_time', 'reason', 'date'],
                            properties: {
                                reason: {
                                    type: 'string',
                                    example: 'Please make idle time to acive time,attended meeting.',
                                },
                                start_time: {
                                    type: 'date',
                                    example: new Date().toISOString(),
                                },
                                end_time: {
                                    type: 'date',
                                    example: new Date(new Date().getTime() + 60 * 60000).toISOString(),
                                },
                                date: {
                                    type: 'date',
                                    example: new Date().toISOString().slice(0, 10),
                                },
                                task_id: {
                                    type: 'string',
                                    example: '66cd835d72208531602c8807',
                                },
                            },
                        },
                    },
                ],
                responses: swaggerHelpers.responseObject,
                security: securityObject,
            },
    },
    '/settings/attendance-request/create-by-manager': {
            post: {
                tags: ['Activity Request'],
                summary: 'Create Activity Request for Attendance Request.',
                description: 'Create request to Create Attendance Request',
                consumes: ['application/json'],
                produces: ['application/json'],
                parameters: [
                    {
                        in: 'body',
                        name: 'RequestData',
                        description: 'Create Activity Request.',
                        required: true,
                        schema: {
                            type: 'object',
                            required: ['start_time', 'end_time', 'reason', 'date'],
                            properties: {
                                reason: {
                                    type: 'string',
                                    example: 'Please make idle time to acive time,attended meeting.',
                                },
                                start_time: {
                                    type: 'date',
                                    example: new Date().toISOString(),
                                },
                                end_time: {
                                    type: 'date',
                                    example: new Date(new Date().getTime() + 60 * 60000).toISOString(),
                                },
                                date: {
                                    type: 'date',
                                    example: new Date().toISOString().slice(0, 10),
                                },
                                employee_id: {
                                    type: 'number',
                                    example: 1375
                                },
                                task_id: {
                                    type: 'string',
                                    example: '66cd835d72208531602c8807',
                                },
                            },
                        },
                    },
                ],
                responses: swaggerHelpers.responseObject,
                security: securityObject,
            },
    },
    '/settings/attendance-request/delete': {
            delete: {
                tags: ['Activity Request'],
                summary: 'Delete Activity Request for Attendance Request.',
                description: 'Delete request to delete Attendance Request',
                consumes: ['application/json'],
                produces: ['application/json'],
                parameters: [
                    {
                        in: 'body',
                        name: 'RequestData',
                        description: 'Delete Activity Request.',
                        required: true,
                        schema: {
                            type: 'object',
                            required: ['start_time', 'end_time', 'reason', 'date'],
                            properties: {
                                ids: {
                                    type: 'array',
                                    example: ['64df1fff16be945844ab4c5b'],
                                },
                            },
                        },
                    },
                ],
                responses: swaggerHelpers.responseObject,
                security: securityObject,
            },
    },
    '/settings/attendance-request/update': {
            post: {
                tags: ['Activity Request'],
                summary: 'Update Activity Request for Attendance Request.',
                description: 'Update request to Update Attendance Request',
                consumes: ['application/json'],
                produces: ['application/json'],
                parameters: [
                    {
                        in: 'body',
                        name: 'RequestData',
                        description: `
                        Type: 1. Productive, 2. Unproductive, 3. Neutral, 4. Idle,
                        Status: 1. Accepted, 2. Rejected, 0. Pending`,
                        required: true,
                        schema: {
                            type: 'object',
                            required: ['start_time', 'end_time', 'reason', 'date'],
                            properties: {
                                id: {
                                    type: 'string',
                                    example: '64df1fff16be945844ab4c5b',
                                    required: true,
                                },
                                status: {
                                    type: 'number',
                                    example: '1',
                                    required: true,
                                },
                                type: {
                                    type: 'number',
                                    example: '2',
                                    required: true,
                                },
                            },
                        },
                    },
                ],
                responses: swaggerHelpers.responseObject,
                security: securityObject,
            },
    },
    '/auth/register-client': {
        post: {
            tags: ['Reseller'],
            summary: 'Add Client.',
            description: 'Add Client.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: ' clientData',
                description: 'Add Clent',
                required: true,
                schema: {
                    type: 'object',
                    required: ['first_name', 'last_name', 'email', 'password', 'phone', , 'location_id', 'department_id', 'data_join', 'address', 'role_id',],
                    properties: {
                        first_name: { type: 'string', example: 'client fname' },
                        last_name: { type: 'string', example: 'client lname' },
                        username: { type: 'string', example: 'client' },
                        email: { type: 'string', example: 'client@gmail.com', },
                        password: { type: 'string', example: 'client@1234', description: 'Your Password must atleast consist `1 upppercase 1 lowercase 1numeric charecter 1 special charecter and length 6-20', },
                        contact_number: { type: 'string', example: '7829552217' },
                        date_join: { type: 'string', example: '2021-01-19', description: 'Date format `MM-DD-YYYY`', },
                        address: { type: 'string', example: 'dfjfrf' },
                        expiry_date: { type: 'date', example: '2037-12-12', },
                        timezone: { type: 'string', example: 'Asia/Kolkata' },
                        total_allowed_user_count: { type: 'number', example: '10' },
                        notes: { type: 'string', example: 'some notes' }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/auth/client': {
        post: {
            tags: ['Reseller'],
            summary: 'Reseller Client login',
            description: 'Login to the portal',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Reseller Client signin ',
                description: 'Reseller Client login',
                required: true,
                schema: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'client1' },
                        password: { type: 'string', example: '********' },
                    },
                }
            }],
            responses: swaggerHelpers.responseObject,
        }
    },
    '/auth/client-login': {
        post: {
            tags: ['Reseller'],
            summary: 'Add Client.',
            description: 'Add Client.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' clientData',
                    description: 'Add Clent',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['first_name', 'last_name', 'email', 'password', 'phone', , 'location_id', 'department_id', 'data_join', 'address', 'role_id'],
                        properties: {
                            organization_id: { type: 'number', example: '10' }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/auth/client-employee-login': {
        post: {
            tags: ['Reseller'],
            summary: 'Add Client.',
            description: 'Add Client.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' clientData',
                    description: 'Add Clent',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['first_name', 'last_name', 'email', 'password', 'phone', , 'location_id', 'department_id', 'data_join', 'address', 'role_id'],
                        properties: {
                            organization_id: { type: 'number', example: '10' }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/remove-client': {
        delete: {
            tags: ['Reseller'],
            summary: 'Remove Client.',
            description: 'Remove Client.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'removeClient',
                required: true,
                schema: {
                    type: 'object',
                    required: ['email'],
                    properties: { email: { type: 'string', example: "example@client.com" } }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    '/settings/reseller-stats': {
        get: {
            tags: ['Reseller'],
            summary: 'Reseller Stats.',
            description: 'Reseller stats.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/settings/client-edit': {
        put: {
            tags: ['Reseller'],
            summary: 'Reseller client edit.',
            description: 'Reseller edit.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'userData',
                description: 'Update Employee Details',
                required: true,
                schema: {
                    type: 'object',
                    properties: {
                        client_id: {
                            type: 'Number',
                            example: 2,
                            description: 'Pass client id',
                        },
                        expiry_date: {
                            type: 'date',
                            example: '2037-12-12'
                        },
                        total_allowed_user_count: {
                            type: 'number',
                            example: 10,
                        },
                        notes: {
                            type: 'string',
                            example: 'dummy notes for a client',
                        }
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/settings/client-profile': {
        get: {
            tags: ['Reseller'],
            summary: 'Reseller\'s Client Profile Stats.',
            description: 'Reseller stats.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

    /**==================================== */
    '/settings/offline-activity/create': {
        post: {
            tags: ['Activity Request'],
            summary: 'Get offline time of employee',
            description: 'Get Activity request with filter',

            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Claim offline request',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employee_id', 'date', 'reason', 'offlineTime'],
                    properties: {
                        employee_id: { type: 'number', example: 4252 },
                        date: { type: 'date', example: "2021-03-18" },
                        reason: { type: 'string', example: "Claim my offline hours" },
                        offlineTime: { type: 'number', example: 100 }
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/settings/offline-activity/update': {
        post: {
            tags: ['Activity Request'],
            summary: 'Get offline time of employee',
            description: 'Get Activity request with filter',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'Claim offline request',
                required: true,
                schema: {
                    type: 'object',
                    required: ['employee_id', 'date', 'reason', 'offlineTime'],
                    properties: {
                        id: { type: 'string', example: "6030bdbe69542e1d24f918ca" },
                        employee_id: { type: 'number', example: 4252 },
                        date: { type: 'date', example: "2021-03-18" },
                        reason: { type: 'string', example: "Claim my offline hours" },
                        offlineTime: { type: 'number', example: 100 },
                        status: { type: 'number', example: 0 } // 0 - pending,1 - approveed,2 - declined 
                    }
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/settings/client-stats': {
        get: {
            tags: ['Reseller'],
            summary: 'Reseller stats.',
            description: 'Reseller stats.',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

    '/storage/add-storage-reseller': {
        post: {
            tags: ['Storage'],
            summary: 'Add storage data',
            description: 'Add storage data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'storageData',
                description: 'Add storage data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['storage_type_id'],
                    properties: {
                        client_organization_ids: {
                            type: 'array',
                            example: [13],
                        },
                        enable: {
                            type: 'boolean',
                            example: true,
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/dashboard/get-web-app-activity-productive-employees': {
        post: {
            tags: ['Dashboard'],
            description: 'Web App activities of to productive and non productive employees',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'web app usage params',
                required: true,
                schema: {
                    type: 'object',
                    required: ["endDate", "endDate", "employeeIds"],
                    properties: {
                        employeeIds: { type: 'array', example: [1, 3] },
                        department_id: { type: 'number', example: 1, },
                        location_id: { type: 'number', example: 1, },
                        appId: { type: 'string', example: "5f5cd1a8bc25c839548252fe" },
                        startDate: { type: 'string', example: moment().subtract(1, 'days').format('YYYY-MM-DD'), },
                        endDate: { type: 'string', example: moment().format('YYYY-MM-DD') },
                        skip: { type: 'number', example: 0, },
                        limit: { type: 'number', example: 10, },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/dashboard/get-web-app': {
        post: {
            tags: ['Dashboard'],
            description: 'Web App Data',
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'web app usage params',
                required: true,
                schema: {
                    type: 'object',
                    required: ["endDate", "endDate"],
                    properties: {
                        employeeIds: { type: 'array', example: [1, 2] },
                        appIds: { type: 'array', example: ["5f5cd1a8bc25c839548252fe"] },
                        department_id: { type: 'number', example: 1, },
                        location_id: { type: 'number', example: 1, },
                        startDate: { type: 'string', example: moment().subtract(1, 'days').format('YYYY-MM-DD'), },
                        endDate: { type: 'string', example: moment().format('YYYY-MM-DD') },
                        employee: { type: 'number', example: 1, },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/add-invoice': {
        post: {
            tags: ['Invoice'],
            summary: 'Craete invoice.',
            description: 'Craete invoice.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'InvoiceData',
                description: 'Craete invoice.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['invoice_number', 'template_name', 'issued_date'],
                    properties: {
                        invoice_number: { type: 'string', example: '1234', },
                        template_name: { type: 'string', example: 'Test Invoice', },
                        issued_date: { type: 'date', example: '2021-08-23' },
                        due_date: { type: 'date', example: '2021-09-17' },
                        from_logo: { type: 'string', example: '/default/profilePic/user.png' },
                        from_business_name: { type: 'string', example: 'Sales' },
                        from_details: { type: 'string', example: 'Sales details.' },
                        to_business_name: { type: 'string', example: 'development' },
                        to_details: { type: 'string', example: 'Development details.' },
                        subtotal: { type: 'number', example: 2000 },
                        discount: { type: 'number', example: 0 },
                        total: { type: 'number', example: 2000 },
                        is_template: { type: 'boolean', example: false },
                        is_contactlist: { type: 'boolean', example: false },
                        tax: { type: 'number', example: 0 },
                        tax_type: { type: 'string', example: 'VAT' },
                        currency_type: { type: 'string', example: '$' },
                        projects: { type: 'array', example: [{ project_id: 1, task_ids: [1, 2, 3], total: 10, quantity: 1, price: 10 }], },
                        comments: { type: 'string', example: 'Invoice' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/update-invoice': {
        put: {
            tags: ['Invoice'],
            summary: 'Update invoice.',
            description: 'Update invoice.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'InvoiceData',
                description: 'Update invoice.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id', 'invoice_number', 'template_name', 'issued_date'],
                    properties: {
                        id: { type: 'string', example: '61266313202bc022c6f57deb' },
                        invoice_number: { type: 'string', example: '1234' },
                        template_name: { type: 'string', example: 'Test Invoice' },
                        issued_date: { type: 'date', example: '2021-08-23' },
                        due_date: { type: 'date', example: '2021-09-17' },
                        from_logo: { type: 'string', example: '/default/profilePic/user.png' },
                        from_business_name: { type: 'string', example: 'Sales' },
                        from_details: { type: 'string', example: 'Sales details.' },
                        to_business_name: { type: 'string', example: 'development' },
                        to_details: { type: 'string', example: 'Development details.' },
                        subtotal: { type: 'number', example: 2000 },
                        discount: { type: 'number', example: 0 },
                        total: { type: 'number', example: 2000 },
                        is_template: { type: 'boolean', example: false },
                        is_contactlist: { type: 'boolean', example: false },
                        tax: { type: 'number', example: 0 },
                        tax_type: { type: 'string', example: 'VAT' },
                        currency_type: { type: 'string', example: '$' },
                        projects: { type: 'array', example: [{ project_id: 1, task_ids: [1, 2, 3], total: 10, quantity: 1, price: 10 }] },
                        comments: { type: 'string', example: 'Invoice' },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/project/get-project-stats': {
        get: {
            tags: ['Invoice'],
            summary: 'Get invoice.',
            description: 'Get invoice.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'project_id', schema: { type: 'number', example: 1 } },
                { in: 'query', name: 'task_ids', schema: { type: 'array', example: [1, 2, 3] } }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/project/get-invoice': {
        get: {
            tags: ['Invoice'],
            summary: 'Get invoice.',
            description: 'Get invoice.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: 0 } },
                { in: 'query', name: 'limit', schema: { type: 'number', example: 10 } },
                { in: 'query', name: 'id', schema: { type: 'string', example: "61266313202bc022c6f57deb" } },
                { in: 'query', name: 'search', schema: { type: 'string', example: 'test' } },
                { in: 'query', name: 'status', enum: [1, 2, 3, 4, 5], description: '1-created, 2-cancelled, 3-paid , 4-sent, 5-unpaid' },
                { in: 'query', name: 'sort_order', enum: ['A', 'D'] },
                { in: 'query', name: 'type', enum: ['all', 'contact', 'template'] },
                { in: 'query', name: 'sort_column', enum: ['invoice_number', 'to_business_name', 'created_at', 'sent_date', 'due_date', 'amount', 'status', 'issued_date', 'sent_date'] }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/announcements/add-announcement': {
        post: {
            tags: ['Announcement'],
            summary: 'Add Announcement.',
            description: 'Add Announcement.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'AnnouncementData',
                description: 'Add announcement.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                        title: { type: 'string', example: 'Announcement Title' },
                        description: { type: 'string', example: 'Announcement Description' },
                        type: { type: 'string', example: '0' },
                        users: { type: 'array', example: [1, 2, 3, 4, 5] },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/announcements/get-announcements': {
        get: {
            tags: ['Announcement'],
            summary: 'Get Announcements.',
            description: 'Get Announcements.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'skip', schema: { type: 'number', example: "0" } },
                { in: 'query', name: 'limit', schema: { type: 'number', example: "10" } },
                { in: 'query', name: 'title', schema: { type: 'string', example: "Announcement Title" } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/announcements/update-announcement': {
        put: {
            tags: ['Announcement'],
            summary: 'Update Announcement.',
            description: 'Update Announcement.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'AnnouncementData',
                description: 'Update announcement.',
                required: true,
                schema: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', example: "615421a5bad7a016c820fceb" },
                        title: { type: 'string', example: 'Updated Announcement Title' },
                        description: { type: 'string', example: 'Updated Announcement Description' },
                        type: { type: 'string', example: '0' },
                        users: { type: 'array', example: [1, 2, 3, 4, 5] },
                    },
                },
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/announcements/delete-announcement': {
        delete: {
            tags: ['Announcement'],
            summary: 'Delete Announcement.',
            description: 'Delete Announcement.',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                { in: 'query', name: 'id', schema: { type: 'string', example: "615421a5bad7a016c820fceb" } },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    '/external/get-data-teleworks': {
        get: {
            tags: ['External'],
            summary: 'Get Activity for Teleworks API',
            description: 'Get Activity for Teleworks API',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'date', example: '2023-02-03' },
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'date', example: '2023-02-03' },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/add-token-teleworks': {
        post: {
            tags: ['External'],
            summary: 'Get Activity for Teleworks API',
            description: 'Get Activity for Teleworks API',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Add External token to org',
                    description: 'Add External token to org',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            spToken: { type: 'string', example: 'token' },
                            labourOfficeId: { type: 'string', example: 'office id' },
                            sequenceNumber: { type: 'string', example: 246 },
                            timezone: { type: 'string', example: 'Asia/Dubai' },
                            time: { type: 'string', example: '23:39' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/get-token-teleworks': {
        get: {
            tags: ['External'],
            summary: 'Get Activity for Teleworks API',
            description: 'Get Activity for Teleworks API',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
        '/external/get-assigned-employee-manager': {
        get: {
            tags: ['External'],
            summary: 'Get Assigned Employees',
            description: 'Get Assigned Employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'string', example: '0' },
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'string', example: '10' },
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: 'Test' },
                },
                {
                    in: 'query',
                    name: 'role_id',
                    schema: { type: 'string', example: '10' },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/get-non-admin-list': {
        get: {
            tags: ['External'],
            summary: 'Get Non Admin List',
            description: 'Get Non Admin List',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/assigned-to-employee': {
        post: {
            tags: ['External'],
            summary: 'Assigned Employees to manager',
            description: 'Assigned Employees to manager',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Assigned Employees to manager',
                    description: 'Assigned Employees to manager',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            role_id: { type: 'number', example: 567 },
                            manager_id: { type: 'number', example: 25659 },
                            employee_id: { type: 'number', example: 26227 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/delete-assigned-employees': {
        delete: {
            tags: ['External'],
            summary: 'Delete Assigned Employees to manager',
            description: 'Delete Assigned Employees to manager',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Delete Assigned Employees to manager',
                    description: 'Delete Assigned Employees to manager',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            role_id: { type: 'number', example: 567 },
                            manager_id: { type: 'number', example: 25659 },
                            employee_id: { type: 'number', example: 26227 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    
    '/external/assign-employee-reseller': {
        post: {
            tags: ['External'],
            summary: 'Assign Employee to a reseller dashboard',
            description: 'Assign Employee to a reseller dashboard',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Assign Employee to a reseller dashboard',
                    description: 'Assign Employee to a reseller dashboard',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            employee_id: { type: 'number', example: 28856 },
                            reseller_organization_id: { type: 'number', example: 310 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/external/get-assign-employee-reseller': {
        get: {
            tags: ['External'],
            summary: 'Get Employee assigned under a reseller dashboard',
            description: 'Get Employee assigned under a reseller dashboard',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'reseller_organization_id',
                    schema: { type: 'string', example: '0' },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/external/delete-assign-employee-reseller': {
        delete: {
            tags: ['External'],
            summary: 'Delete Assigned Employees under a reseller dashboard',
            description: 'Delete Assigned Employees under a reseller dashboard',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Delete Assigned Employees under a reseller dashboard',
                    description: 'Delete Assigned Employees under a reseller dashboard',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            employee_id: { type: 'number', example: 28856 },
                            reseller_organization_id: { type: 'number', example: 310 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/external/get-employee-assigned-company': {
        get: {
            tags: ['External'],
            summary: 'Get reseller dashboard registered under employee',
            description: 'Get reseller dashboard registered under employee',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'reseller_organization_id',
                    schema: { type: 'string', example: '310' },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/get-update-status': {
        get: {
            tags: ['External'],
            summary: 'API to get status for sms and late login mail alert',
            description: 'API to get status for sms and late login mail alert',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/update-status': {
        post: {
            tags: ['External'],
            summary: 'API to update status for sms and late login mail alert',
            description: 'API to update status for sms and late login mail alert',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' web usage data',
                    description: 'Add web usage data',
                    required: true,
                    schema: {
                        type: 'object',
                        example: {
                            'is_notification_enable': '0',
                            'is_sms_enable': '0',
                            'email': 'abhishek@globussoft.in',
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/add-on-prem-domain': {
        post: {
            tags: ['External'],
            summary: 'API to add or update on prem domain list and create builds',
            description: 'API to add or update on prem domain list and create builds',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' Domain Data',
                    description: 'Add or update domain data',
                    required: true,
                    schema: {
                        type: 'object',
                        example: {
                            "service1": "https://service.dev.empmonitor.com",
                            "service2": "https://track.dev.empmonitor.com",
                            "service3": "https://report.empmonitor.com",
                            "service4": "https://storelogs.dev.empmonitor.com",
                            "service5": "https://alert.empmonitor.com",
                            
                            "main_domain": "https://empmonitor.com",
                            "frontend_domain": "https://app.empmonitor.com",
                            "organization_id": 1,
                            "admin_email": "abhishek@mail.com", 
                            "a_admin_email": "abhishek@mail.com",
                            "crypto_key": "8ca93a00dd0dd53e08dc4ca982a0fa54",
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/add-env-on-premsie': {
        post: {
            tags: ['External'],
            summary: 'API to add or update on prem envs data',
            description: 'API to add or update on prem envs data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' Env Data',
                    description: 'Add or update env data',
                    required: true,
                    schema: {
                        type: 'object',
                        example: {
                            "dec_key": "3a1b5c7d9e2f4g6h8i0j2k4l6m8n0o",
                            "dec_iv": "a1b3c5d7e9f2g4h6",
                            "dec_OPENSSL_CIPHER_NAME": "AES-256-CBC",
                            "dec_CIPHER_KEY_LEN": "32",
                            "organization_id": 1,
                            "admin_email": "abhishek@mail.com", 
                            "a_admin_email": "abhishek@mail.com"
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/fetch-env-on-premsie': {
        get: {
            tags: ['External'],
            summary: 'API to fetch on prem envs data',
            description: 'API to fetch on prem envs data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'admin_email',
                    schema: { type: 'string', example: 'abhishek@mail.com' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'a_admin_email',
                    schema: { type: 'string', example: 'abhishek@mail.com' },
                    required: true,
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/get-web-usage': {
        get: {
            tags: ['External'],
            summary: 'Get mobile web usage API',
            description: 'Get mobile web usage API',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 1 },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'date', example: '2023-03-13T00:00:00.000Z' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'date', example: '2023-03-14T08:37:11.280Z' },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: 'facebook' },
                },
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 0 },
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 10 },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/external/add-web-usage': {
        post: {
            tags: ['External'],
            summary: 'Add mobile web usage API',
            description: 'Add mobile web usage API',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: ' web usage data',
                    description: 'Add web usage data',
                    required: true,
                    schema: {
                        type: 'object',
                        example: {
                            'user1@gmail.com': [
                                {
                                    link: 'google.com',
                                    start_time: '2023-03-14T10:42:11.093Z',
                                    end_time: '2023-03-14T10:45:11.093Z',
                                },
                                {
                                    link: 'facebook.com',
                                    start_time: '2023-03-14T10:45:12.093Z',
                                    end_time: '2023-03-14T10:47:11.093Z',
                                },
                            ],
                            'user2@gmail.com': [
                                {
                                    link: 'google.com',
                                    start_time: '2023-03-14T10:42:11.093Z',
                                    end_time: '2023-03-14T10:45:11.093Z',
                                },
                            ],
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/get-emp-users': {
        post: {
            tags: ['User'],
            summary: 'Get users for workforce management',
            description: 'Get users for workforce management',
            consumes: ['application/json'],
            produces: ['application/json'],

            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/wm-register': {
        post: {
            tags: ['User'],
            summary: 'Get registered for workforce management',
            description: 'Get registered for workforce management',
            consumes: ['application/json'],
            produces: ['application/json'],

            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/user/wm-user': {
        post: {
            tags: ['User'],
            summary: 'Update Status for registered workforce management users',
            description: 'Update Status for registered workforce management users',
            consumes: ['application/json'],
            produces: ['application/json'],

            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/enable-biometric': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Enabling Bio-metric ',
            description: 'Enabling Bio-metric',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'biometric-details',
                    description: 'Add biometric data',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            secretKey: { type: 'string', example: 'mysecret' },
                            userName: { type: 'string', example: 'myusername' },
                            status: { type: 'string', example: '1', description: 'Status must be 1 or 2. 1 - Enable, 2 - Disable' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/status': {
        get: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric Status',
            description: 'Bio-metric Status',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/set-password': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric Password Reset',
            description: 'Bio-metric Password Reset',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'password',
                    description: 'Add biometric data',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            secretKey: { type: 'string', example: 'mysecret' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/auth': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Login Bio-metric ',
            description: 'Login Bio-metric',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'biometric-creds',
                    description: 'biometric data',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            email: { type: 'string', example: 'john@globussoft.in' },
                            secretKey: { type: 'string', example: 'mysecret' },
                            userName: { type: 'string', example: 'myusername' }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject
        },
    },
    '/bio-metric/get-users': {
        get: {
            tags: ['Bio-Metric'],
            summary: 'fetching  list of users ',
            description: 'fetching  list of users ',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 0 },  
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: '10' },
                },
                {
                    in: 'query',
                    name: 'sortColumn',
                    schema: { type: 'string', example: 'firstname', default: 'firstname' },
                    description: 'Sort by',
                    enum: ['firstname', 'email'], 
                },
                {
                    in: 'query',
                    name: 'sortOrder',
                    schema: { type: 'string', example: 'ASC', default: 'ASC' },
                    description: 'Order of sort',
                    enum: ['ASC', 'DESC'], 
                },
                {
                    in: 'query',
                    name: 'location_id',
                    schema: { type: 'number', example: '616' },
                },
                {
                    in: 'query',
                    name: 'user_id',
                    schema: { type: 'number', example: '57415' },
                },
                {
                    in: 'query',
                    name: 'department_id',
                    schema: { type: 'number', example: '12' },
                },
                {
                    in: 'query',
                    name: 'count',
                    schema: { type: 'number', example: '1' },
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/update-user': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Updating Bio-metric data ',
            description: 'Updating Bio-metric data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'formData',
                    name: 'files',
                    type: 'array',
                    minItems: 1,
                    "collectionFormat": "multi",
                    description: 'The file to upload',
                    items: { type: 'file' }
                    },
                {
                    in: 'body',
                    name: 'biometric-data updation',
                    description: 'biometric data updation',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            user_id: { type: 'string', example: '54241' },
                            finger1: { type: 'string', example: 'sample' },
                            finger2: { type: 'string', example: 'sample' },
                            face: { type: 'string', example: 'sample' },
                            bio_code: { type: 'string', example: 'sample' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/get-locations': {
        get: {
            tags: ['Bio-Metric'],
            summary: 'location details ',
            description: 'location details',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/get-user-info': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric details ',
            description: 'Bio-metric details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'biometric-data fetching',
                    description: 'biometric data fetching',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            finger: { type: 'string', example: 'finger' },
                            face: { type: 'string', example: 'face' },
                            bio_code: { type: 'string', example: 'bio_code' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/bio-metric/forgot-secret-key': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric Password Otp Generation ',
            description: 'Bio-metric Password Otp Generation',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'biometric-email or username ',
                    description: 'biometric-email or username',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            email: { type: 'string', example: 'john@globussoft.in' },
                            userName: { type: 'string', example: 'qtdev' }                
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/bio-metric/verify-secret-key': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric Password reset ',
            description: 'Bio-metric Password reset',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'biometric-data otp & password ',
                    description: 'biometric data otp & password',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            email: { type: 'string', example: 'john@globussoft.in' },
                            otp: { type: 'string', example: '123456' },
                            secretKey: { type: 'string', example: 'mysecret' },              
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    
    '/bio-metric/attendance-summary': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric Attendance Summary ',
            description: 'Bio-metric Attendance Summary',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'biometric-data attendance summary ',
                    description: 'biometric-data attendance summary',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            date: { type: 'string', example: '2023-10-16',description: 'Date must be in format YYYY-MM-DD '},
                            location_id: { type: 'string', example: '618' }              
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

    '/bio-metric/attendance-details': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'Bio-metric Attendance Details ',
            description: 'Bio-metric Attendance Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                    {
                        in: 'query',
                        name: 'skip',
                        schema: { type: 'number', example: 0 },  
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'number', example: '10' },
                    },
                    {
                        in: 'query',
                        name: 'sortColumn',
                        schema: { type: 'string', example: 'firstname', default: 'firstname' },
                        description: 'Sort by',
                        enum: ['firstname','last_name', 'email'], 
                    },
                    {
                        in: 'query',
                        name: 'sortOrder',
                        schema: { type: 'string', example: 'ASC', default: 'ASC' },
                        description: 'Order of sort',
                        enum: ['ASC', 'DESC'], 
                    },
                
                {
                    in: 'body',
                    name: 'biometric-data attendance details ',
                    description: 'status:0-absent,1-checkin,2-checkout,3-suspend',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            date: { type: 'string', example: '2023-10-16', description: 'Date must be in format YYYY-MM-DD ' },
                            location_id: { type: 'string', example: '618' },
                            status: {type:'string',example: '1'},
            
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/bio-metric/holidays': {
        get: {
            tags: ['Bio-Metric'],
            summary: 'Holiday Details ',
            description: 'Holiday Details',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/bio-metric/fetch-employee-password-enable-status': {
        get: {
            tags: ['Bio-Metric'],
            summary: 'API for check status for fetch employee password enable',
            description: 'API for check status for fetch employee password enable',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },
    '/bio-metric/verify-secretKey': {
        post: {
            tags: ['Bio-Metric'],
            summary: 'API for check secret key',
            description: 'API for check secret key',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'API for check status for fetch employee password enable',
                    description: 'API for check status for fetch employee password enable',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            secretKey: { type: 'number', example: 123456 }         
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

     '/bio-metric/delete-user-profile-image': {
        delete: {
            tags: ['Bio-Metric'],
            summary: 'API for delete user profile picture',
            description: 'API for delete user profile picture',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'API for delete user profile picture',
                    description: 'API for delete user profile picture',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            userId: { type: 'number', example: 631 }
                         },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

    '/bio-metric/get-department': {
        get: {
            tags: ['Bio-Metric'],
            summary: 'Get all departments with its main device status',
            description: 'Get all departments with its main device status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        },
    },

    '/external/timesheet-data': {
        get: {
            tags: ['External'],
            summary: 'API for timesheet office time data',
            description: 'API for timesheet office time data',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'location_id',
                    schema: { type: 'number', example: 0 },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'department_id',
                    schema: { type: 'number', example: 0 },
                    required: true,
                },
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 0 },
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'number', example: '' },
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'number', example: '' },
                },
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'date', example: moment().format('YYYY-MM-DD') },
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'date', example: moment().format('YYYY-MM-DD') },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
};