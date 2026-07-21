const swaggerHelpers = require('./swagger-helpers');

const securityObject = [{ authenticate: [] }];

module.exports = {
    "/": {
        get: {
            tags: ["Open"],
            description: "Get root request's response from the api - basically server status",
            responses: {
                200: { "description": "Healthy! server status and API status." },
                500: swaggerHelpers.responseObject['500']
            }
        }
    },
    "/server-time": {
        get: {
            tags: ["Open"],
            description: "Get current server time",
            responses: {
                200: swaggerHelpers.responseObject['200']
            }
        }
    },
    "/app-info": {
        get: {
            tags: ["Open"],
            description: "Get application info",
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'agent',
                    schema: { type: 'string', example: 'empmonitor' }
                }
            ],
            responses: {
                200: swaggerHelpers.responseObject['200']
            }
        }
    },
    "/app-info/update": {
        put: {
            tags: ["Open"],
            description: "Update c_version of application",
            produces: ['application/json'],
            parameters: [{
                in: "body",
                name: "data",
                description: "Update application version.",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "id",
                        "c_version"
                    ],
                    properties: {
                        id: {
                            type: "number",
                            example: "1"
                        },
                        c_version: {
                            type: "string",
                            example: "1.0.1"
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                422: swaggerHelpers.responseObject['422']
            }
        }
    },
    "/reset-redis": {
        post: {
            tags: ["Open"],
            description: "Reset redis.",
            produces: ['application/json'],
            parameters: [{
                in: "body",
                name: "data",
                description: "Reset redis.",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "email"
                    ],
                    properties: {
                        email: {
                            type: "string",
                            example: "test@gmail.com"
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200']
            }
        }
    },
    "/get-employee-detail": {
        post: {
            tags: ["Open"],
            description: "For getting organization information",
            produces: ['application/json'],
            parameters: [{
                in: "body",
                name: "data",
                description: "For getting organization information",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "email"
                    ],
                    properties: {
                        email: {
                            type: "string",
                            example: "abhishektrip@globussoft.in"
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200']
            }
        }
    },
    "/get-organization-detail": {
        post: {
             tags: ["Open"],
            description: "For getting organization information",
            produces: ['application/json'],
            parameters: [{
                in: "body",
                name: "data",
                description: "For getting organization information",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "organization_id"
                    ],
                    properties: {
                        organization_id: {
                            type: "number",
                            example: 249
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200']
            }
        }
    },
    "/log": {
        post: {
            tags: ["Open"],
            summary: "Insert Log.",
            description: "Insert Log.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Error Log.",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "timestamp",
                        "message"
                    ],
                    properties: {
                        mac: {
                            type: "string",
                            example: "00-00-00-00-00-00-00-00"
                        },
                        email: {
                            type: "string",
                            example: "test@gmail.com"
                        },
                        timestamp: {
                            type: "string",
                            example: "2020-03-30T05:54:38.201Z"
                        },
                        message: {
                            type: "string",
                            example: "some error"
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                202: swaggerHelpers.responseObject['202'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            // security: securityObject
        }
    },

    // Auth
    "/auth/register": {
        post: {
            tags: ["Auth"],
            summary: "For Console Login",
            description: "Regiter automatically, using mac address and computer name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'If system is on active directory then `domain` has some value and `isActiveDirectory` will be 1 else domain is `` and `isActiveDirectory` is `0`',
                    required: ["macId", "organizationId", "computerName", "firstname", "lastname", "isActiveDirectory"],
                    properties: {
                        macId: { type: "string", example: "6ADE65FB-1F3B-427C-B5A4-81C13E2A838C" },
                        organizationId: { type: "string", example: "xX0x" },
                        computerName: { type: "string", example: "RAHUL-STG40" },
                        firstname: { type: "string", example: "Rahul" },
                        lastname: { type: "string", example: "Agni" },
                        isActiveDirectory: { type: "number", example: 1 },
                        domain: { type: "string", example: 'glb', default: '' },
                        username: { type: "string", example: 'glbemp', default: '' },
                        a_email: { type: "string", example: 'glbemp@gln.com', default: '' },
                        activeDirectoryMeta: {
                            type: "object", default: null, example: {
                                "general": {
                                    "firstName": "Rahul",
                                    "lastName": "Agni",
                                    "intials": "a",
                                    "displayName": "Rahul a",
                                    "description": "Abc",
                                    "office": "Banglore",
                                    "telePhoneNumber": "123344",
                                    "webPage": "google.com"
                                },
                                "address": {
                                    "street": "Xyz",
                                    "poBox": "12333",
                                    "city": "Banglore",
                                    "state": "Karnataka",
                                    "postalCode": "2321",
                                    "country": "India"
                                },
                                "telephones": {
                                    "home": "123432",
                                    "pager": "1234",
                                    "mobile": "917829552214",
                                    "fax": "12343",
                                    "ipPhone": "1234",
                                    "notes": "test",
                                },
                                "organization": {
                                    "jobTitle": "Developer",
                                    "department": "Node js",
                                    "company": "Abc",
                                    "Manager": "xyz@gmail.com",
                                }
                            }
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },
    "/auth/authenticate": {
        post: {
            tags: ["Auth"],
            summary: "For Console Login",
            description: "Login",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                        password: { type: "string", example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5" },
                        macId: { type: "string", example: "00:00:5e:00:53:af" },
                        testing: { type: "string", example: "1" }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },
    "/auth/check-key": {
        post: {
            tags: ["Auth"],
            summary: "For Checking key value",
            description: "Regiter automatically, using mac address and computer name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "key data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'Get shorted key or actual key',
                    required: ["text"],
                    properties: {
                        text: { type: "string", example: "1", description: 'it can be decoded string' },
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },

    "/authenticate/register": {
        post: {
            tags: ["Authenticate"],
            summary: "For Console Login",
            description: "Regiter automatically, using mac address and computer name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'If system is on active directory then `domain` has some value and `isActiveDirectory` will be 1 else domain is `` and `isActiveDirectory` is `0`',
                    required: ["macId", "organizationId", "computerName", "firstname", "lastname", "isActiveDirectory"],
                    properties: {
                        macId: { type: "string", example: "6ADE65FB-1F3B-427C-B5A4-81C13E2A838C" },
                        organizationId: { type: "string", example: "xX0x" },
                        computerName: { type: "string", example: "RAHUL-STG40" },
                        firstname: { type: "string", example: "Rahul" },
                        lastname: { type: "string", example: "Agni" },
                        isActiveDirectory: { type: "number", example: 1 },
                        domain: { type: "string", example: 'glb', default: '' },
                        username: { type: "string", example: 'glbemp', default: '' },
                        a_email: { type: "string", example: 'glbemp@gln.com', default: '' },
                        activeDirectoryMeta: {
                            type: "object", default: null, example: {
                                "general": {
                                    "firstName": "Rahul",
                                    "lastName": "Agni",
                                    "intials": "a",
                                    "displayName": "Rahul a",
                                    "description": "Abc",
                                    "office": "Banglore",
                                    "telePhoneNumber": "123344",
                                    "webPage": "google.com"
                                },
                                "address": {
                                    "street": "Xyz",
                                    "poBox": "12333",
                                    "city": "Banglore",
                                    "state": "Karnataka",
                                    "postalCode": "2321",
                                    "country": "India"
                                },
                                "telephones": {
                                    "home": "123432",
                                    "pager": "1234",
                                    "mobile": "917829552214",
                                    "fax": "12343",
                                    "ipPhone": "1234",
                                    "notes": "test",
                                },
                                "organization": {
                                    "jobTitle": "Developer",
                                    "department": "Node js",
                                    "company": "Abc",
                                    "Manager": "xyz@gmail.com",
                                }
                            }
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },
    "/authenticate/authenticate": {
        post: {
            tags: ["Authenticate"],
            summary: "For Console Login",
            description: "Login",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                        password: { type: "string", example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5" },
                        macId: { type: "string", example: "00:00:5e:00:53:af" },
                        testing: { type: "string", example: "1" }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },

    // User
    "/user/me": {
        get: {
            tags: ["User"],
            summary: "Get Current Employee Details",
            description: "EMP Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/config": {
        get: {
            tags: ["User"],
            summary: "Get Current User Settings for agent",
            description: "EMP Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/system-info": {
        post: {
            tags: ["User"],
            summary: "Get Current User Settings for agent",
            description: "EMP Details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'If system is on active directory then `domain` has some value and `isActiveDirectory` will be 1 else domain is `` and `isActiveDirectory` is `0`',
                    required: ["operating_system", "architecture", "software_version", "service_version"],
                    properties: {
                        operating_system: { type: "string", example: "xX0x" },
                        architecture: { type: "string", example: "RAHUL-STG40" },
                        software_version: { type: "string", example: "Rahul" },
                        service_version: { type: "string", example: "1.1" },
                        computer_name: { type: "string", example: "BAS-123" },
                        mac_id: { type: "string", example: "6ADE65FB-1F3B-427C-B5A4-81C13E2A838C" },
                        geolocation: {
                            properties: {
                                longitude: {
                                    type: 'string', default: null, example: '51.507351',
                                },
                                latitude: {
                                    type: 'string', default: null, example: '-0.127758',
                                },
                            }
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/save-email-monitoring-log": {
        post: {
            tags: ["User"],
            summary: "Save Email Monitoring Log",
            description: "EMP Details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'Email monitoring log from employee agent. It contains email content data along with system info and geolocation. Employee ID and Organization ID are automatically added from authenticated user.',
                    required: ["operating_system", "architecture", "software_version", "service_version"],
                    properties: {
                        from: { type: "string", example: "employee@example.com" },
                        to: { type: "string", example: "manager@example.com" },
                        subject: { type: "string", example: "Meeting Reminder" },
                        content: { type: "string", example: "Please find the attached document." },
                        timestamp: { type: "string", example: "2023-01-01T00:00:00Z" },
                        type: { type: "number", example: 0, },
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/uninstall-auth": {
        post: {
            tags: ["User"],
            summary: "Agent uninstall auth.",
            description: "EMP Details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'Agent uninstall auth.',
                    required: ["uninstallCode"],
                    properties: {
                        uninstallCode: { type: "string", example: "xX0x" }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/log-out": {
        get: {
            tags: ["User"],
            summary: "Agent uninstall auth.",
            description: "EMP Details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/raised-alert": {
        post: {
            tags: ["User"],
            summary: "API to raise alert",
            description: "EMP Details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    description: 'API to raise alert',
                    required: ["message"],
                    properties: {
                        message: { type: "string", example: " is outside of given location" }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/user/save-system-log": {
        post: {
            tags: ["User"],
            summary: "Save system log data",
            description: "Stores any JSON data from employee agent to MongoDB collection 'employee_system_logs'",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Any JSON object to be stored as system log. Can contain any fields.",
                required: true,
                schema: {
                    type: "object",
                    description: 'Flexible JSON object for system logs. Employee ID and Organization ID are automatically added from authenticated user.',
                    properties: {
                        log_type: { type: "string", example: "system_event", description: "Optional: Type of log" },
                        message: { type: "string", example: "Application started", description: "Optional: Log message" },
                        metadata: { 
                            type: "object", 
                            example: { 
                                "cpu_usage": "45%", 
                                "memory_usage": "2.5GB",
                                "disk_space": "50GB"
                            }, 
                            description: "Optional: Any additional metadata" 
                        },
                        timestamp: { type: "number", example: 1638360000000, description: "Optional: Custom timestamp" }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    // ClockIn
    "/clock-in/record": {
        post: {
            tags: ["Clock-In"],
            summary: "For Console Login",
            description: "Regiter automatically, using mac address and computer name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: `"data" is the array of all the data for the session.<br />
                It is an array of json object having all the data of clock-in clock-out`,
                required: true,
                schema: {
                    type: "object",
                    description: 'If system is on active directory then `domain` has some value and `isActiveDirectory` will be 1 else domain is `` and `isActiveDirectory` is `0`',
                    required: ["type", "mode", "startDate", "endDate", "reason"],
                    properties: {
                        data: {
                            type: 'array',
                            default: [],
                            items: {
                                properties: {
                                    type: {
                                        type: 'number', default: 1, example: 1, description: '1 is for ClockIn/ClockOut <br /> 2 is for Break taken', enum: [1, 2]
                                    },
                                    mode: {
                                        type: 'number', default: 1, example: 1, description: '1 - <br /> 2 - Manual', enum: [1, 2]
                                    },
                                    startDate: {
                                        type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock starts / break starts'
                                    },
                                    endDate: {
                                        type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock ends / break ends'
                                    },
                                    reason: {
                                        type: 'string', default: null, example: "System logged out", description: 'Reason for clock out'
                                    }
                                }
                            }
                        }
                    }
                }
            }],
            security: securityObject,
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },
    "/clock-in/details": {
        post: {
            tags: ["Clock-In"],
            summary: "Clock in details",
            description: "Get User\'s clock-in/clock-out time OR break-time",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: `It will return clock in details between 2 timestamps`,
                required: true,
                schema: {
                    type: "object",
                    required: ["startDate", "endDate"],
                    properties: {
                        startDate: { type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock ends / break ends' },
                        endDate: { type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock ends / break ends' }
                    }
                }
            }],
            security: securityObject,
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },

    // Firewall
    "/firewall/blocked-domains": {
        get: {
            tags: ["Firewall"],
            summary: "Get Today's Blocked Domains. (Latest)",
            description: "Blocked Website Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    // Project
    "/project/get-projects": {
        get: {
            tags: ["Project"],
            description: "Get projects.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [
            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/project/get-tasks/{project_id}": {
        get: {
            tags: ["Project"],
            summary: "Get Tasks.",
            description: "Get Tasks.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [
                {
                    in: "path",
                    name: "project_id",
                    required: true,
                    schema: {
                        type: "number",
                        required: true
                    }
                }

            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    // "/project/add-task-stats": {
    //     post: {
    //         tags: ["Project"],
    //         summary: "Insert Project Stats.",
    //         description: "Insert Project Stats",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "data",
    //             description: "Project Stats. ",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["task_id", "start_time", "end_time", "reason"],
    //                 properties: {
    //                     start_time: {
    //                         type: "string",
    //                         example: new Date().toISOString()
    //                     },
    //                     end_time: {
    //                         type: "string",
    //                         example: new Date().toISOString()
    //                     },
    //                     task_id: {
    //                         type: "number",
    //                         example: 1
    //                     },
    //                     type: {
    //                         type: "string",
    //                         example: "auto",
    //                         enum: ['auto', 'manual']
    //                     },
    //                     reason: {
    //                         type: "string",
    //                         example: "Task completed"
    //                     }

    //                 }
    //             }
    //         },

    //         ],
    //         responses: {
    //             200: swaggerHelpers.responseObject['200'],
    //             500: swaggerHelpers.responseObject['500']
    //         },
    //         security: securityObject
    //     }
    // },
    "/project/update-task": {
        put: {
            tags: ["Project"],
            summary: "Update project task.",
            description: "Update project task",
            consumes: ["application/json"],
            produces: ["application/json"],

            parameters: [{
                in: "body",
                name: "data",
                description: "",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "status",
                        "task_id"
                    ],
                    properties: {
                        task_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1
                        },
                        updated_at: {
                            type: "string",
                            example: new Date().toISOString()
                        },
                    }
                }
            },
            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/project/create-project-task": {
        post: {
            tags: ["Project"],
            summary: "Create project Task.",
            description: "Create project Task.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Create project Task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id", "start_time", "end_time", "total_time", "priority"],
                    properties: {
                        name: {
                            type: "string",
                            example: 'task'
                        },
                        description: {
                            type: "string",
                            example: 'task'
                        },
                        start_date: {
                            type: "string",
                            example: '2020-03-30'
                        },
                        end_date: {
                            type: "string",
                            example: '2020-03-30'
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        priority: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            },

            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/project/get-projects-tasks": {
        get: {
            tags: ["Project"],
            description: "Get projects With Tasks.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [
            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    "/project/add-task-stats": {
        post: {
            tags: ["Project"],
            summary: "Insert Project Stats.",
            description: "Insert Project Stats",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Project Stats. ",
                required: true,
                schema: {
                    type: "object",
                    required: ["task_id", "start_time", "end_time", "reason"],
                    properties: {
                        data: {
                            type: 'array',
                            default: [],
                            items: {
                                properties: {
                                    start_time: {
                                        type: 'string', default: null, example: new Date().toISOString(),
                                    },
                                    end_time: {
                                        type: 'string', default: null, example: new Date().toISOString(),
                                    },
                                    reason: {
                                        type: 'string', default: null, example: "Task completed",
                                    },
                                    task_id: {
                                        type: "number",
                                        example: 1
                                    },
                                    type: {
                                        type: "string",
                                        example: "auto",
                                        enum: ['auto', 'manual']
                                    },
                                }
                            }
                        }

                    }
                }
            },

            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    "/report/email-activity": {
        post: {
            tags: ["Report"],
            summary: "For email content report",
            description: `Add email content data \nWhen attacemets there only one object need send at time when its comes no attachements can send multiple array of objects\n
            Example { "email_info": [{"from":"abc@gmail.com","to":"abc@gmail.com,to2@mail.com","cc":"cc1@mail.com,cc2@mail.com", "bcc":"bcc1@mail.com,bcc2@mail.com", "subject":"Mail subject ","body":"Mail body","mail_time":"2020-07-27T13:07:54.298Z","client_type":"gmail","type":1, "attachments":[{ "file_name":"", "file_path":"", "file_size":"", "file_content":"", "attachment_id":"", "mail_id":""}]}]}\n
            type-1 for InComming 2 for outGoing`,
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            parameters: [
                {
                    in: "formData",
                    type: "string",
                    name: "data",
                    required: true,
                    description: "Email content data."
                },
                {
                    in: "formData",
                    type: "file",
                    name: "attachments",
                    required: false,
                    description: "Upload profilePic."
                },
            ],
            // parameters: [{
            //     in: "body",
            //     name: "data",
            //     description: `"data" is the array of all the data for the email content.<br />
            //     It is an array of json object having all the data of email content`,
            //     required: true,
            //     schema: {
            //         type: "object",
            //         description: '',
            //         required: ["attendance_id", "computer", "from", "to", "subject", "body", "mail_time", "date", "client_type", "type"],
            //         properties: {
            //             data: {
            //                 type: 'array',
            //                 default: [],
            //                 items: {
            //                     properties: {
            //                         attendance_id: {
            //                             type: 'number', example: 1, description: 'AttendanceId of employee', enum: [1, 2]
            //                         },
            //                         computer: {
            //                             type: 'string', example: 'GLB-123', description: 'Name of computer',
            //                         },
            //                         from: {
            //                             type: 'string', example: 'abc@gmail.com', description: 'Source person mail id'
            //                         },
            //                         to: {
            //                             type: 'string', example: 'abc@gmail.com', description: 'recipient person mail id'
            //                         },
            //                         subject: {
            //                             type: 'string', default: null, example: 'Mail subject ', description: 'Mail subject.'
            //                         },
            //                         body: {
            //                             type: 'string', default: null, example: 'Mail body', description: 'Mail body.'
            //                         },
            //                         mail_time: {
            //                             type: 'string', example: new Date().toISOString(), description: 'When the mail recived and sent time,'
            //                         },
            //                         date: {
            //                             type: 'string', example: '2020-07-25', description: 'When the mail recived and sent time,'
            //                         },
            //                         client_type: {
            //                             type: 'string', example: "gmail", description: 'Email client type'
            //                         },
            //                         type: {
            //                             type: 'number', example: 1, description: 'Email type 1-Incomming 2-Outgoing', enum: [1, 2]
            //                         }
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }],
            security: securityObject,
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },
    "/announcement/update-announcement": {
        put: {
            tags: ["Announcement"],
            summary: "Update Announcement",
            description: "Update Announcement",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Update Announcement",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        ids: { type: 'array', example: ['6160324b6af5d9724d94c101', '61603810509f6213e420453c'], description: 'Source person mail id' }
                    }
                }
            },

            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/report/add-email-activity": {
        post: {
            tags: ["Report"],
            summary: "For email content report",
            description: `Add email content data \n type-1 for InComming 2 for outGoing`,
            parameters: [{
                in: "body",
                name: "data",
                description: `email_info: is an array of json object having all the data of email content`,
                required: true,
                schema: {
                    type: "object",
                    description: '',
                    required: ["from", "to", "subject", "body", "mail_time", "date", "client_type", "type"],
                    properties: {
                        email_info: {
                            type: 'array',
                            default: [],
                            items: {
                                properties: {
                                    from: {
                                        type: 'string', example: 'abc@gmail.com', description: 'Source person mail id'
                                    },
                                    to: {
                                        type: 'string', example: 'abc@gmail.com,to2@mail.com', description: 'recipient person mail id'
                                    },
                                    cc: {
                                        type: 'string', example: 'cc1@mail.com,cc2@mail.com', description: 'cc person mail id'
                                    },
                                    bcc: {
                                        type: 'string', example: 'bcc1@mail.com,bcc2@mail.com', description: 'bcc person mail id'
                                    },
                                    subject: {
                                        type: 'string', default: null, example: 'Mail subject ', description: 'Mail subject.'
                                    },
                                    body: {
                                        type: 'string', default: null, example: 'Mail body', description: 'Mail body.'
                                    },
                                    mail_time: {
                                        type: 'string', example: new Date().toISOString(), description: 'When the mail recived and sent time,'
                                    },
                                    client_type: {
                                        type: 'string', example: "gmail", description: 'Email client type'
                                    },
                                    type: {
                                        type: 'number', example: 2, description: 'Email type 1-Incomming 2-Outgoing', enum: [1, 2]
                                    },
                                    attachments: {
                                        type: 'array',
                                        default: [],
                                        items: {
                                            properties: {
                                                link: { type: "string", default: '', example: 'some.com/link' },
                                                mail_id: { type: "string", default: '', example: '1' },
                                                attachment_id: { type: "string", default: '', example: '11' },
                                                file_name: { type: "string", default: '', example: 'fileName' },
                                                file_path: { type: "string", default: '', example: 'filepath' },
                                                file_size: { type: "string", default: '', example: 'filesize' },
                                                file_content: { type: "string", default: '', example: 'filecontent' },
                                            }
                                        }
                                    }

                                }
                            }
                        }
                    }
                }
            }],
            security: securityObject,
            responses: {
                200: swaggerHelpers.responseObject['200'],
                400: swaggerHelpers.responseObject['400'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500'],
            }
        }
    },
    "/request/create-request": {
        post: {
            tags: ['Break Request'],
            summary: 'Create Break Activity Request.',
            description: 'Create request to update idle time to active time',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'RequestData',
                description: 'Create Break Activity Request.',
                required: true,
                schema: {
                    type: 'object',
                    // required: ['employee_id', 'date', 'reason', 'offlineTime'],
                    properties: {
                        offline_data: {
                            type: "array", example: [{
                                date: "2023-01-30",
                                start_time: "2023-02-01T07:27:14.439Z",
                                end_time: "2023-02-01T07:39:14.439Z",
                                reason: "Claim my offline hours",
                                offline_time: 105
                            },
                            {
                                date: "2023-01-30",
                                start_time: "2023-02-01T07:27:14.439Z",
                                end_time: "2023-02-01T07:39:14.439Z",
                                reason: "Claim my offline hours",
                                offline_time: 105
                            }]
                        }
                    }
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/request/get-offline-time": {
        get: {
            tags: ['Break Request'],
            summary: 'Fetch offline time.',
            description: 'getting the offline duration',
            parameters: [
                {
                    in: 'query',
                    name: 'date',
                    schema: { type: 'date', example: '2022-11-30' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/request/reasons": {
        get: {
            tags: ['Break Request'],
            summary: 'Fetch offline time.',
            description: 'getting the offline duration',
            parameters: [
                {
                    in: 'query',
                    name: 'type',
                    schema: { type: 'number', example: '1' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/request/create-idle-request": {
        post: {
            tags: ['Idle Request'],
            summary: 'Create Idle Activity Request.',
            description: 'Create request to update idle time to active time',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'RequestData',
                description: 'Create Idle Activity Request.',
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
                        activity_ids: {
                            type: 'array',
                            example: ['6042296d4a2dfb644673f5b5', '6042296d4a2dfb644673f5b6'],
                        },
                    },
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/agent/check-uninstall-password": {
        post: {
            tags: ["Agent"],
            summary: "To check admin uninstall password",
            description: "To check admin uninstall password",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "To check admin uninstall password",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        admin_email: { type: 'string', example: "admin.mail.com", description: 'Source person mail id' },
                        user_email: { type: 'string', example: "user.mail.com", description: 'mail id' },
                        password: { type: 'string', example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5",  },
                        dataId: { type: 'string', example: "",  },
                    }
                }
            },

            ],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    /* Routes for Silah Project Task */
    "/project/get-project-silah": {
        get: {
            tags: ['Project-Silah'],
            summary: 'API to fetch all projects',
            description: 'API to fetch all projects',
            parameters: [
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 0 },
                    required: true
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 10 },
                    required: true
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: 'ProjectName' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/project/get-project-folder-silah": {
        get: {
            tags: ['Project-Silah'],
            summary: 'API to fetch all folder in a project',
            description: 'API to fetch all folder in a project',
            parameters: [
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 0 },
                    required: true
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 10 },
                    required: true
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: 'ProjectName' },
                    required: true
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'number', example: '6124916jbhf2g7343' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/project/get-project-task-silah": {
        get: {
            tags: ['Project-Silah'],
            summary: 'API to fetch all task in a project or folder',
            description: 'API to fetch all task in a project or folder',
            parameters: [
                {
                    in: 'query',
                    name: 'skip',
                    schema: { type: 'number', example: 0 },
                    required: true
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'number', example: 10 },
                    required: true
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: 'ProjectName' },
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'number', example: '6124916jbhf2g7343' },
                },
                {
                    in: 'query',
                    name: 'folder_name',
                    schema: { type: 'number', example: 'Current Folder' },
                },
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'number', example: '6124916jbhf2g7343' },
                },
                {
                    in: 'query',
                    name: 'sort_by',
                    schema: { type: 'number', example: 'A' },
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/project/create-project-tasks": {
        post: {
            tags: ['Project-Silah'],
            summary: "API to create task",
            description: "API to create task",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "API to create task",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        title: { type: 'string', example: "API Development", description: 'Title of a task' },
                        folder_name: { type: 'string', example: "Current Task", description: 'Name of folder' },
                        project_id: { type: 'string', example: "fniufbfuy2491624126",  },
                        is_start: { type: 'boolean', example: false,  },
                    }
                }
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    "/project/update-project-task": {
        post: {
            tags: ['Project-Silah'],
            summary: "API to update task",
            description: "API to update task",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "API to update task",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        title: { type: 'string', example: "API Development", description: 'Title of a task' },
                        folder_name: { type: 'string', example: "Current Task", description: 'Name of folder' },
                        project_id: { type: 'string', example: "fniufbfuy2491624126",  },
                        task_id: { type: 'string', example: "fniufbfuy2491624126",  },
                        is_start: { type: 'boolean', example: false,  },
                    }
                }
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    "/project/delete-project-task": {
        delete: {
            tags: ['Project-Silah'],
            summary: "API to delete task",
            description: "API to delete task",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "API to delete task",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        _id: { type: 'string', example: "fniufbfuy2491624126",  },
                    }
                }
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    "/project/start-project-task": {
        get: {
            tags: ['Project-Silah'],
            summary: 'API to start a task',
            description: 'API to start a task',
            parameters: [
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '471825vasr52vsa' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/project/stop-project-task": {
        get: {
            tags: ['Project-Silah'],
            summary: 'API to stop a task',
            description: 'API to stop a task',
            parameters: [
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '471825vasr52vsa' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/project/finish-project-task": {
        get: {
            tags: ['Project-Silah'],
            summary: 'API to finish a task',
            description: 'API to finish a task',
            parameters: [
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '471825vasr52vsa' },
                    required: true
                }
            ],
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/project/add-remaining-time": {
        post: {
            tags: ['Project-Silah'],
            summary: "API to update the remaining time",
            description: "API to update the remaining time",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "API to update the remaining time",
                required: true,
                schema: {
                    type: "object",
                    required: ["ids"],
                    properties: {
                        remaining_time: { type: 'number', example: 1059 },
                        task_id: { type: 'string', example: "fniufbfuy2491624126" },
                    }
                }
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        }
    },
    "/rdp-request/rdp-connection-open": {
        post: {
            tags: ['RDP Request'],
            summary: 'Open RDP connection',
            description: 'Open RDP connection',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'RequestData',
                description: 'Open RDP connection',
                required: true,
                schema: {
                    type: 'object',
                    required: ['ip'],
                    properties: {
                        ip: { type: 'string', example: '192.168.5.2', description: 'IP address of the machine' },
                    }
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/rdp-request/rdp-connection-close": {
        post: {
            tags: ['RDP Request'],
            summary: 'Close RDP connection',
            description: 'Close RDP connection',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'body',
                name: 'RequestData',
                description: 'Close RDP connection',
                required: true,
                schema: {
                    type: 'object',
                    required: ['ip'],
                    properties: {
                        ip: { type: 'string', example: '192.168.5.2', description: 'IP address of the machine' },
                    }
                },
            },],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    "/rdp-request/get-rdp-token": {
        get: {
            tags: ['RDP Request'],
            summary: 'Get RDP token',
            description: 'Get RDP token',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [{
                in: 'query',
                name: 'ip',
                schema: { type: 'string', example: '192.168.5.2', description: 'IP address of the machine' },
                required: true
            }],
            responses: swaggerHelpers.responseObject
        },
    },

    "/time-sheet/": {
        get: {
            tags: ["Timesheet"],
            summary: "Get employee current timesheet",
            description: "EMP timesheet",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            parameters: [{
                in: 'query',
                name: 'date',
                schema: { type: 'string', example: '2025-06-27', description: 'date of specific timesheet' },
                required: true
            }],
            security: securityObject
        }
    },
};