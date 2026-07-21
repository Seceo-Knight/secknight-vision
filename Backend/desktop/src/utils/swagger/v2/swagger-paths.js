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
    "/admin-feature": {
        post: {
            tags: ["Open"],
            summary: "Get Admin Features",
            description: "Admin Features",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "user",
                description: "email id of the user",
                required: true,
                schema: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            }
        }
    },

    // Auth
    "/register": {
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
                        username: { type: "string", example: 'glbemp', default: '' }
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
    "/auth/user": {
        post: {
            tags: ["Auth"],
            summary: "For Console Login",
            description: "Login",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "user data.",
                required: true,
                schema: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                        password: { type: "string", example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5" }
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
    "/authenticate": {
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
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                        password: { type: "string", example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5" }
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
    "/authenticate-sherii": {
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
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                        password: { type: "string", example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5" }
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
    "/login": {
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
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", example: "test@gmail.com" },
                        password: { type: "string", example: "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5" }
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
    "/token": {
        post: {
            tags: ["Auth"],
            summary: "To Regenerate AccessToken From RefeshToken",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "RefeshToken",
                required: true,
                schema: {
                    type: "object",
                    required: ["token"],
                    properties: {
                        token: { type: "string", example: "e0603e9b361da4b47891a03403484f63:55fccc1caeb95aa8e1ff063f98478636a093bdb562946ed7691cc5b36fe12c0486bb8b35c325b982e849d5b798fb1649e44626ec747d36f7ee3979fd986fdf032da88bfcd6a616035efc292039732f7ef000d92cafe327a826bab545262bf4090d720e83f1a8419772a04545d3c126735f980ae7e9f61bff8cb28b3f9282680ed39733f011b8940de80fb57735a3bdecb53a4707c524d28f12c0e5623ef20540d9c9f8f00c2b5a9162a18b6ee512d84ec790574008b4aa5348cc74e60d792f36a68728a6d0f7fe603dfde913a9dac0d3ba111c994c28ed2542d4304a72f6efaebf64bdf74e2e020d6aabb68c2de76dffae77c48e2af9303d21d30d5d704b190a067905b989aa4e068109a6f94fe04acf2bf2446874cd1b29d5a1996d176dd4e34f078e49d99680c7b9ecb09da74e057bf80104d975ce312095116c055392567f35798fd351642083f048aee7f52a08ee90bfa477377f3aaf8f890c1f1f3a7a5f8dec7086feb603aea76bc064a305284bc4a4537c8c6da4b73373603b6a3e5f8298f60681f6f073d67348e65ae29185e6" },
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
    "/users/me": {
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

    // Admin
    "/admin/me": {
        get: {
            tags: ["Admin"],
            summary: "Get Admin Info",
            description: "Admin Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    // Application
    "/application-info": {
        get: {
            tags: ["Desktop"],
            description: "Get The Application Information.",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            }
        }
    },

    // Firewall
    "/blocked-domains": {
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


    "/domains/blocked": {
        get: {
            tags: ["Firewall"],
            summary: "Get Today's Blocked Domains.",
            deprecated: true,
            description: "Blocked Website Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    // Production Stats
    "/production-stats": {
        get: {
            tags: ["Production Stats"],
            description: "Get Production Stats of Current user.",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/production-stat": {
        post: {
            tags: ["Production Stats"],
            summary: "Insert Production Stats.",
            description: "Insert Production Stats.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Production Stats.",
                required: true,
                schema: {
                    type: "object",
                    required: ["logsheetId", "dateOfEntry", "loginTime", "logoutTime", "workingHours", "nonWorkingHours", "totalHours", "isReportGenerated"],
                    properties: {
                        day: {
                            type: "string",
                            example: '2020-01-17'
                        },
                        login_time: {
                            type: "string",
                            example: '2019-01-17 18:33:55'
                        },
                        logout_time: {
                            type: "string",
                            example: '2020-01-07 18:33:55'
                        },
                        working_hours: {
                            type: "string",
                            example: '16:41:47'
                        },
                        non_working_hours: {
                            type: "string",
                            example: '16:41:47'
                        },
                        total_hours: {
                            type: "string",
                            example: '16:41:47'
                        },
                        is_report_generated: {
                            type: "boolean",
                            example: false
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    // Desktop
    "/desktop-settings": {
        get: {
            tags: ["Desktop"],
            description: "Get Desktop Settings of Logged-in User",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/desktop-settings": {
        put: {
            tags: ["Desktop"],
            summary: "Update Desktop Settings.",
            description: "Update Desktop Settings.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Desktop Settings.",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        shutdown: {
                            type: "boolean",
                            example: false
                        },
                        restart: {
                            type: "boolean",
                            example: false
                        },
                        logoff: {
                            type: "boolean",
                            example: false
                        },
                        lock_computer: {
                            type: "boolean",
                            example: false
                        },
                        task_manager: {
                            type: "boolean",
                            example: false
                        },
                        block_usb: {
                            type: "boolean",
                            example: false
                        },
                        lock_print: {
                            type: "boolean",
                            example: false
                        },
                        signout: {
                            type: "boolean",
                            example: false
                        },
                        hibernate: {
                            type: "boolean",
                            example: false
                        },
                        sleep: {
                            type: "boolean",
                            example: false
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
            security: securityObject
        }
    },
    "/usage-data": {
        post: {
            tags: ["Desktop"],
            summary: "For Browser-History && Applications-Used Data Upload",
            description: "Update Usage Data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Usage data.",
                required: true,
                schema: {
                    type: "object",
                    required: ["browserHistories", "applicationsUsed"],
                    properties: {
                        browserHistories: {
                            type: "array",
                            example: [
                                { browser: "Google Chrome", url: "http://nuget.org/packages/toastr", timeStamp: "2019-12-12 18:33:55" },
                                { browser: "Google Chrome", url: "http://nuget.org/packages/toastr1", timeStamp: "2019-12-12 19:33:55" }
                            ]
                        },
                        applicationsUsed: {
                            type: "array",
                            example: [
                                { applicationName: "VS Code", timeStamp: "2019-12-12 18:33:55" },
                                { applicationName: "Robo 3t", timeStamp: "2019-12-12 19:33:55" }
                            ]
                        },
                        keyStrokes: {
                            type: "string",
                            example: 'asdasdasd'
                        },
                        date: {
                            type: "string",
                            example: '2020-01-18'
                        },
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    // Activity Track
    "/activity": {
        post: {
            tags: ["Desktop"],
            summary: "Insert/Update Activity Time",
            description: "Insert/Update Activity Time",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Activity Time",
                required: true,
                schema: {
                    type: "object",
                    required: ["app_data", "website_data", "day"],
                    properties: {
                        app_data: {
                            type: "array",
                            example: [
                                { "name": "vs code", "time": "00:01:25" },
                                { "name": "Robo 3t", "time": "00:01:25" },
                                { "name": "Telegram", "time": "00:01:25" }
                            ]
                        },
                        website_data: {
                            type: "array",
                            example: [
                                { "name": "https://www.youtube.com/", "time": "00:01:25" },
                                { "name": "https://www.google.com/", "time": "00:01:25" },
                                { "name": "https://stackoverflow.com/", "time": "00:01:25" }
                            ]
                        },
                        day: {
                            type: "string",
                            example: '2020-02-07'
                        },
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },

    //Project Management
    "/projects/{day}/day": {
        get: {
            tags: ["Project Management"],
            description: "Get projects.",
            consumes: ["application/json"],
            deprecated: true,
            produces: ["application/json"],
            parameters: [{
                in: "path",
                name: "day",
                description: "",
                required: true,
                schema: {
                    type: "string",
                    required: true
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
    "/projects/{project_id}/todos/{day}/day": {
        get: {
            tags: ["Project Management"],
            summary: "Get tasks to assigned by user.",
            description: "Get tasks",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "path",
                name: "project_id",
                description: "Project Todos.",
                required: true,
                schema: {
                    type: "integer",
                    required: true
                }
            }, {
                in: "path",
                name: "day",
                description: "day",
                required: true,
                schema: {
                    type: "string",
                    required: true
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/projects/{project_id}/stats": {
        post: {
            tags: ["Project Management"],
            summary: "Insert Project Stats.",
            description: "Insert Project Stats.",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Project Stats.",
                required: true,
                schema: {
                    type: "object",
                    required: ["start_time", "end_time", "total_time"],
                    properties: {
                        start_time: {
                            type: "string",
                            example: '2019-01-17 18:33:55'
                        },
                        end_time: {
                            type: "string",
                            example: '2020-01-07 18:33:55'
                        },
                        total_time: {
                            type: "string",
                            example: '16:41:47'
                        },
                        day: {
                            type: "string",
                            example: '2019-01-17'
                        }
                    }
                }
            },
            {
                in: "path",
                name: "project_id",
                description: "Project Stats.",
                required: true,
                schema: {
                    type: "integer",
                    required: true
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/todos/{project_todo_id}/stats": {
        post: {
            tags: ["Project Management"],
            summary: "Insert Project Stats.",
            description: "Insert Project Stats.",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Project Stats.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_todo_id", "start_time", "end_time", "total_time"],
                    properties: {
                        start_time: {
                            type: "string",
                            example: '2020-03-30T05:54:38.201Z'
                        },
                        end_time: {
                            type: "string",
                            example: '2020-03-30T05:54:38.201Z'
                        },
                        total_time: {
                            type: "string",
                            example: '16:41:47'
                        },
                        day: {
                            type: "string",
                            example: '2019-01-17'
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        }
                    }
                }
            },
            {
                in: "path",
                name: "project_todo_id",
                description: "Project Todos Stats.",
                required: true,
                schema: {
                    type: "integer",
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

    // LOG
    "/log": {
        post: {
            tags: ["Log"],
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


    "/projects/tasks/{day}/day": {
        get: {
            tags: ["Project Management"],
            summary: "Get tasks to assigned by user.",
            description: "Get tasks",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],

            parameters: [{
                in: "body",
                name: "data",
                description: "Get tasks to assigned by user",
                required: true,
                schema: {
                    type: "object",
                    required: [

                    ],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        }

                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },
    "/projects/tasks/{day}/day": {
        get: {
            tags: ["Project Management"],
            description: "Get tasks to assigned by user.",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "path",
                name: "day",
                description: "",
                required: true,
                schema: {
                    type: "string",
                    required: true
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

    "/project/{project_todo_id}/update-task": {
        put: {
            tags: ["Project Management"],
            summary: "Update project todo.",
            description: "Update project task",
            deprecated: true,
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
                        "status"
                    ],
                    properties: {
                        status: {
                            type: "number",
                            example: 1
                        }

                    }
                }
            }, {
                in: "path",
                name: "project_todo_id",
                description: "",
                required: true,
                schema: {
                    type: "number",
                    required: true
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            },
            security: securityObject
        }
    },




    //New project management apis
    "/get-projects": {
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

    "/get-tasks/{project_id}": {
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

    "/add-task-stats": {
        post: {
            tags: ["Project"],
            summary: "Insert Project Stats.",
            description: "Insert Project Stats.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Project Stats.",
                required: true,
                schema: {
                    type: "object",
                    required: ["task_id", "start_time", "end_time", "total_time"],
                    properties: {
                        start_time: {
                            type: "string",
                            example: '2020-03-30 05:00:00'
                        },
                        end_time: {
                            type: "string",
                            example: '2020-03-30 12:00:00'
                        },
                        total_time: {
                            type: "string",
                            example: '1623'
                        },
                        task_id: {
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

    "/update-task": {
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
    // "/get-task-stats": {
    //     get: {
    //         tags: ["Project"],
    //         description: "Get Task stats.",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],

    //         responses: {
    //             200: swaggerHelpers.responseObject['200'],
    //             404: swaggerHelpers.responseObject['404'],
    //             500: swaggerHelpers.responseObject['500']
    //         },
    //         security: securityObject
    //     }
    // },

    // "/add-employee-time-track": {
    //     post: {
    //         tags: ["Project"],
    //         summary: "Add Empoyee Time Track.",
    //         description: "Add Empoyee Time Track.",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "data",
    //             description: "Add Empoyee Time Track..",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: [ "start_time", "end_time", "duration"],
    //                 properties: {
    //                     start_time: {
    //                         type: "string",
    //                         example: '2020-03-30 00:00:00'
    //                     },
    //                     end_time: {
    //                         type: "string",
    //                         example: '2020-03-30 05:00:00'
    //                     },
    //                     duration: {
    //                         type: "string",
    //                         example: '16:41:47'
    //                     },
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
    // "/get-employee/{from_date}/time/{to_date}/track": {
    //     get: {
    //         tags: ["Project"],
    //         summary: "Get Empoyee Time Track.",
    //         description: "Get Empoyee Time Track.",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "path",
    //             name: "from_date",
    //             description: "Time Track.",
    //             required: true,
    //             schema: {
    //                 type: "string",
    //                 required: true
    //             }
    //         }, {
    //             in: "path",
    //             name: "to_date",
    //             description: "day",
    //             required: true,
    //             schema: {
    //                 type: "string",
    //                 required: true
    //             }
    //         }],
    //         responses: {
    //             200: swaggerHelpers.responseObject['200'],
    //             500: swaggerHelpers.responseObject['500']
    //         },
    //         security: securityObject
    //     }
    // },

    "/create-project-task": {
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

    "/get-projects-tasks": {
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

    "/my-test-api-vikash'": {
        get: {
            tags: ["VikashTest"],
            description: "Only for testing",
            deprecated: true,
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


};