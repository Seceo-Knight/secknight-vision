const moment = require('moment');
const swaggerHelpers = require('../swagger-helpers');
const schemas = require('../swagger-schemas');

const securityObject = [
    {
        authenticate: [],
    },
];

module.exports = {
    '/': {
        get: {
            tags: ['Open'],
            description: "Get root request's response from the API - basically server status",
            responses: {
                200: {
                    description: 'Healthy! server status and API status.',
                },
                500: swaggerHelpers.responseObject['500'],
            },
        },
    },
    '/report/employee-activity': {
        post: {
            tags: ["Report"],
            description: "Get employee activity for one hour",
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Get employee activity for one hour',
                    description: 'Get employee activity for one hour',
                    required: true,
                    schema: {
                        type: 'object',
                        properties: {
                            date: { type: 'string', example: moment().format('YYYY-MM-DD') },
                            startTime: { type: 'string', example: "10:00 AM" },
                            endTime: { type: 'string', example: "11:00 AM" },
                        },
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Success',
                },
                500: swaggerHelpers.responseObject['500'],
            },
            security: [
                {
                    authenticate: [],
                },
            ],
        }
    },
    "/timesheet/employee-timesheet-details": {
        get: {
            tags: ["Timesheet"],
            description: "Get employee timesheet for one month",
            produces: ['application/json'],
            parameters: [
                {
                    name: 'start_date',
                    in: 'query',
                    required: true,
                    type: 'string',
                    example: '2025-06-01',
                    description: 'Start date in YYYY-MM-DD format'
                },
                {
                    name: 'end_date',
                    in: 'query',
                    required: true,
                    type: 'string',
                    example: '2025-06-30',
                    description: 'End date in YYYY-MM-DD format'
                }
            ],
            responses: {
                200: {
                    description: 'Success',
                },
                500: swaggerHelpers.responseObject['500'],
            },
            security: [
                {
                    authenticate: [],
                },
            ],
        }
    },

    '/user/fetch-all-employees': {
        post: {
            tags: ["Employee"],
            description: "Get all employee records",
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: {
                200: {
                    description: 'Success',
                },
                500: swaggerHelpers.responseObject['500'],
            },
            security: [
                {
                    authenticate: [],
                },
            ],
        }
    },

    '/dashboard/employees-stats': {
        get: {
            tags: ["Dashboard"],
            description: "Get all employee stats for active, idle, offline & more",
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'date',
                    schema: { type: 'number', example: moment().format('YYYY-MM-DD') },
                },
            ],
            responses: {
                200: {
                    description: 'Success',
                },
                500: swaggerHelpers.responseObject['500'],
            },
            security: [
                {
                    authenticate: [],
                },
            ],
        }
    }

}