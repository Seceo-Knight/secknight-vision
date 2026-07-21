const swaggerHelpers = require('./swagger-helpers');

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
    "/body": {
        post: {
            tags: ["Open"],
            description: "Create a Post",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "dummy",
                description: "SAdasdasd34535435345",
                required: true,
                schema: {
                    type: "object",
                    required: ["userId", "postId"],
                    properties: {
                        userId: { type: "string", example: "5c0251181835c34d347e23fc" },
                        postId: { type: "string", example: "5c02511xxxxxxxxd347e23fc" }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
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

    // USER
    "/login": {
        post: {
            tags: ["User"],
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
    "/logout": {
        get: {
            tags: ["User"],
            summary: "For Console Logout",
            description: "Logout",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            }
        }
    },
    "/employee": {
        get: {
            tags: ["User"],
            summary: "Get Employee Details",
            description: "EMP Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            }
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
            }
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
            }
        }
    },
    "/all-application-info": {
        get: {
            tags: ["Desktop"],
            description: "Get All The Application Information.",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            }
        }
    },
    "/application-info": {
        post: {
            tags: ["Desktop"],
            summary: "Get Application Information.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "App Type.",
                required: true,
                schema: {
                    type: "object",
                    required: ["app_type"],
                    properties: {
                        app_type: {
                            type: "string",
                            example: 'Stealth'
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            }
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
            }
        }
    },
    // "/application-track": {
    //     post: {
    //         tags: ["Desktop"],
    //         summary: "Insert/Update Applications-Used Time",
    //         description: "Insert/Update Applications-Used Time",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "data",
    //             description: "Applications-Used Time",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["app_data", "day"],
    //                 properties: {
    //                     app_data: {
    //                         type: "array",
    //                         example: [
    //                             { "app_name": "vs code", "time": 25 },
    //                             { "app_name": "Robo 3t", "time": 30 },
    //                             { "app_name": "Telegram", "time": 50 }
    //                         ]
    //                     },
    //                     day: {
    //                         type: "string",
    //                         example: '2020-02-05'
    //                     },
    //                 }
    //             }
    //         }],
    //         responses: {
    //             200: swaggerHelpers.responseObject['200'],
    //             500: swaggerHelpers.responseObject['500']
    //         }
    //     }
    // },
    // "/website-track": {
    //     post: {
    //         tags: ["Desktop"],
    //         summary: "Insert/Update Websites-Used Time",
    //         description: "Insert/Update Websites-Used Time",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "data",
    //             description: "Websites-Used Time",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["website_data", "day"],
    //                 properties: {
    //                     website_data: {
    //                         type: "array",
    //                         example: [
    //                             { "web_url": "https://www.youtube.com/", "time": 25 },
    //                             { "web_url": "https://www.google.com/", "time": 30 },
    //                             { "web_url": "https://stackoverflow.com/", "time": 50 }
    //                         ]
    //                     },
    //                     day: {
    //                         type: "string",
    //                         example: '2020-02-07'
    //                     },
    //                 }
    //             }
    //         }],
    //         responses: {
    //             200: swaggerHelpers.responseObject['200'],
    //             500: swaggerHelpers.responseObject['500']
    //         }
    //     }
    // },
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
            }
        }
    },
    "/get-production-stat": {
        post: {
            tags: ["Desktop"],
            summary: "Get Production Stats.",
            description: "Get Production Stats.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "data",
                description: "Production Stats.",
                required: true,
                schema: {
                    type: "object",
                    required: ["logsheetId"],
                    properties: {
                        logsheetId: {
                            type: "string",
                            example: 'test@gmail.com-17-01-2020'
                        }
                    }
                }
            }],
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['200'],
                500: swaggerHelpers.responseObject['500']
            }
        }
    },
    "/update-desktop-settings": {
        post: {
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
                    required: [
                        "shutdown",
                        "restart",
                        "logoff",
                        "lock_computer",
                        "task_manager",
                        "block_usb",
                        "lock_print",
                        "signout",
                        "hibernate",
                        "sleep"
                    ],
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
            }
        }
    },
    "/update-production-stats": {
        post: {
            tags: ["Desktop"],
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
                        log_sheet_id: {
                            type: "string",
                            example: 'test@gmail.com-17-01-2020'
                        },
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
            }
        }
    },
    "/update-production-stats-kamal": {
        post: {
            tags: ["Desktop"],
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
                    required: ["sessions", "isReportGenerated"],
                    properties: {
                        sessions: {
                            type: 'array',
                            example: [{
                                id: "timestamp",
                                startTime: "2020-04-10T18:34:28",
                                endTime: "2020-04-10T18:37:28",
                                activeSeconds: 120
                            },
                            {
                                id: "timestamp2",
                                startTime: "2020-04-10T18:37:28",
                                endTime: "2020-04-10T18:40:28",
                                activeSeconds: 180
                            },
                            {
                                id: "timestamp2",
                                startTime: "2020-04-10T18:45:28",
                                endTime: "2020-04-10T18:47:28",
                                activeSeconds: 60
                            }
                                ,
                            {
                                id: "timestamp2",
                                startTime: "2020-04-10T18:51:28",
                                endTime: "2020-04-10T18:54:28",
                                activeSeconds: 0
                            }
                                ,
                            {
                                id: "timestamp2",
                                startTime: "2020-05-10T12:51:28",
                                endTime: "2020-05-10T12:54:28",
                                activeSeconds: 60
                            }]
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
            }
        }
    },
    "/blocked-websites": {
        get: {
            tags: ["User"],
            summary: "Get Today's Blocked Websites.",
            description: "Blocked Website Details",
            responses: {
                200: swaggerHelpers.responseObject['200'],
                404: swaggerHelpers.responseObject['404'],
                500: swaggerHelpers.responseObject['500']
            }
        }
    },
};