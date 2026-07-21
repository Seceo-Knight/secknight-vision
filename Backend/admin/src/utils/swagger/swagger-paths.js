const swaggerHelpers = require('./swagger-helpers');

const securityObject = [{
    authenticate: []
}];

module.exports = {
    "/": {
        get: {
            tags: ["Open"],
            description: "Get root request's response from the api - basically server status",
            responses: {
                200: {
                    "description": "Healthy! server status and API status."
                },
                500: swaggerHelpers.responseObject['500']
            }
        }
    },
    "/details": {
        get: {
            tags: ["Admin"],
            description: "This will get a user based on the given token",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/admin-feature": {
        get: {
            tags: ["Admin"],
            summary: "Get Admin Features",
            description: "Admin Features",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/admin-feature-update": {
        post: {
            tags: ["Admin"],
            summary: "Update Admin Features",
            description: "Admin Features",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "features",
                description: "admin features status",
                required: true,
                schema: {
                    type: "object",
                    required: [
                        "screenshot_enabled", "website_analytics_enabled", "application_analytics_enabled",
                        "keystroke_enabled", "browser_history_enabled", "user_log_enabled", "firewall_enabled",
                        "domain_enabled"
                    ],
                    properties: {
                        screenshot_enabled: {
                            type: "number",
                            example: 1
                        },
                        website_analytics_enabled: {
                            type: "number",
                            example: 1
                        },
                        application_analytics_enabled: {
                            type: "number",
                            example: 1
                        },
                        keystroke_enabled: {
                            type: "number",
                            example: 1
                        },
                        browser_history_enabled: {
                            type: "number",
                            example: 1
                        },
                        user_log_enabled: {
                            type: "number",
                            example: 1
                        },
                        firewall_enabled: {
                            type: "number",
                            example: 1
                        },
                        domain_enabled: {
                            type: "number",
                            example: 1
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/emp/auth": {
        post: {
            tags: ["Employee"],
            summary: " employee login ",
            description: "Create a Post",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "manager sinup ",
                description: "manager sinup ",
                required: true,
                schema: {
                    type: "object",
                    required: ["userName", "password"],
                    properties: {
                        userName: {
                            type: "string",
                            example: "username"
                        },
                        password: {
                            type: "string",
                            example: "********"
                        },
                        ip: {
                            type: "string",
                            example: "123.123.123.128"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject
        }
    },
    "/emp/user": {
        get: {
            tags: ["Employee"],
            description: "This will get a user based on the given token",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/emp/log": {
        post: {
            tags: ["Employee"],
            summary: "Get user log details",
            description: "Get user log details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get user log details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date", "skip", "limit"],
                    properties: {
                        from_date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        to_date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        skip: {
                            type: "number",
                            example: '0'
                        },
                        limit: {
                            type: "number",
                            example: '10'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/emp/update-user": {
        put: {
            tags: ["Employee"],
            summary: "Update Employee Details",
            description: "Update Employee Detailss",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Update Employee Details",
                required: true,
                schema: {
                    type: "object",
                    required: ["new_password", "confirmation_password"],
                    properties: {
                        new_password: {
                            type: "string",
                            example: "Basavaraj@123"
                        },
                        confirmation_password: {
                            type: "string",
                            example: "Basavaraj@123"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/create-departments": {
        post: {
            tags: ["Department"],
            summary: "Create department",
            description: "Create department",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "departmentData",
                description: "Department details",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "short_name"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Android"
                        },
                        short_name: {
                            type: "string",
                            example: "AND"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-departments": {
        post: {
            tags: ["Department"],
            summary: "Get department details",
            description: "Get departments",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "departmentData",
                description: "Department details",
                required: true,
                schema: {
                    type: "object",
                    required: ["skip", "limit"],
                    properties: {
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-department": {
        put: {
            tags: ["Department"],
            summary: "Update department",
            description: "Update department",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "departmentData",
                description: "Update department",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "short_name", "dept_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Android"
                        },
                        short_name: {
                            type: "string",
                            example: "AND"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-department": {
        delete: {
            tags: ["Department"],
            summary: "Delete department",
            description: "Delete department",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "departmentData",
                description: "Department details",
                required: true,
                schema: {
                    type: "object",
                    required: ["dept_id"],
                    properties: {
                        department_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-role": {
        post: {
            tags: ["Admin"],
            summary: "Add role",
            description: "Add role",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "roleData",
                description: "Add role",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "params"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Employee"
                        },
                        params: {
                            type: "string",
                            example: "EMP"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-role": {
        get: {
            tags: ["Admin"],
            summary: "Get role",
            description: "Get role",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-location": {
        post: {
            tags: ["Location"],
            summary: "Add location",
            description: "Add location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Add location",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "short_name"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Bangalore"
                        },
                        short_name: {
                            type: "string",
                            example: "BNG"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-locations": {
        post: {
            tags: ["Location"],
            summary: "Get location",
            description: "Get location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Get location",
                required: true,
                schema: {
                    type: "object",
                    required: ["skip", "limit"],
                    properties: {
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-location": {
        put: {
            tags: ["Location"],
            summary: "Update location",
            description: "Update location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Update location",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "short_name", "location_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Benglore"
                        },
                        short_name: {
                            type: "string",
                            example: "BENG"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-locations-dept": {
        post: {
            tags: ["Location"],
            summary: "Get location",
            description: "Get location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Get location",
                required: true,
                schema: {
                    type: "object",
                    required: ["skip", "limit"],
                    properties: {
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-dept-location": {
        post: {
            tags: ["Location"],
            summary: "Get location",
            description: "Get location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Get location",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_id"],
                    properties: {
                        department_ids: {
                            type: "array",
                            example: [{
                                department_id: 1,
                                location_id: 2
                            }, {
                                department_id: 2,
                                location_id: 2
                            }]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-department-location": {
        post: {
            tags: ["Location"],
            summary: "Get location",
            description: "Get location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Get location",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_ids"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_ids: {
                            type: "array",
                            example: [1, 2]
                        },
                        department_name: {
                            type: "string",
                            example: "Node js"
                        },
                        short_name: {
                            type: "string",
                            example: "NODE"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-dept-location": {
        delete: {
            tags: ["Location"],
            summary: "Delete department from location",
            description: "Delete department from location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Delete department from location",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_id"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1,2,3"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-location": {
        delete: {
            tags: ["Location"],
            summary: "Delete location",
            description: "Delete location",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Delete location",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-old-dept-location-by-name": {
        post: {
            tags: ["Location"],
            summary: "Add location ",
            description: " Add location and department by name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: " locationData",
                description: " Add location and department by name",
                required: true,
                schema: {
                    type: "object",
                    required: ["location", "depatment_id"],
                    properties: {
                        location: {
                            type: "string",
                            example: "mysore"
                        },
                        short_name: {
                            type: "string",
                            example: "myr"
                        },
                        department_id: {
                            type: "string",
                            example: "1,2,3,4"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-dept-location-by-name": {
        post: {
            tags: ["Location"],
            summary: "Add location ",
            description: " Add location and department by name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: " locationData",
                description: " Add location and department by name",
                required: true,
                schema: {
                    type: "object",
                    required: ["location"],
                    properties: {
                        location: {
                            type: "string",
                            example: "mysore"
                        },
                        short_name: {
                            type: "string",
                            example: "myr"
                        },
                        department_id: {
                            type: "string",
                            example: "1,2,3,4"
                        },
                        department_name: {
                            type: "string",
                            example: "javascript"
                        },
                        dept_short_name: {
                            type: "string",
                            example: "js"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-register": {
        "post": {
            tags: ["User"],
            description: "Add user",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: " userData",
                description: "Add User",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "full_name", "email", "password", "phone", "emp_code", "location_id", "department_id", "data_join", "address", "role_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Basavaraj"
                        },
                        full_name: {
                            type: "string",
                            example: "Basavaraj S"
                        },
                        email: {
                            type: "string",
                            example: "basavaraj@gmail.com"
                        },
                        password: {
                            type: "string",
                            example: "Basavaraj@1234"
                        },
                        phone: {
                            type: "string",
                            example: "7829552217"
                        },
                        emp_code: {
                            type: "string",
                            example: "GLB-BAN-414"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        },
                        date_join: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        address: {
                            type: "string",
                            example: "dfjfrf"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        timezone: {
                            type: "string",
                            example: "Asia/Kolkata",
                        },
                        timezone_offset: {
                            type: "number",
                            example: "330"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-register-new": {
        "post": {
            tags: ["User"],
            description: "Add user",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: " userData",
                description: "Add User",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "full_name", "email", "password", "phone", "emp_code", "location_id", "department_id", "data_join", "address", "role_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Basavaraj"
                        },
                        full_name: {
                            type: "string",
                            example: "Basavaraj S"
                        },
                        email: {
                            type: "string",
                            example: "basavaraj@gmail.com"
                        },
                        password: {
                            type: "string",
                            example: "Basavaraj@1234"
                        },
                        phone: {
                            type: "string",
                            example: "7829552217"
                        },
                        emp_code: {
                            type: "string",
                            example: "GLB-BAN-414"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        },
                        date_join: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        address: {
                            type: "string",
                            example: "dfjfrf"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        timezone: {
                            type: "string",
                            example: "Asia/Kolkata",
                        },
                        timezone_offset: {
                            type: "number",
                            example: "330"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-register-bulk": {
        "post": {
            tags: ["User"],
            description: "Upload domain",
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            "parameters": [{
                in: "query",
                name: "count",
                type: "number",
                required: true,
            }, {
                in: "formData",
                name: "file",
                type: "file",
                required: true,
                description: "Upload User Details."
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/upload-profilepic": {
        "post": {
            tags: ["User"],
            description: "Add user",
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            "parameters": [{
                in: "query",
                name: "user_id",
                type: "number",
                required: true,
            },
            {
                in: "formData",
                name: "avatar",
                type: "file",
                required: false,
                description: "Upload profilePic."
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/users-search": {
        post: {
            tags: ["User"],
            summary: "Search user by name",
            description: "Search user",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Search user",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "skip", "limit"],
                    properties: {
                        name: {
                            type: "string",
                            example: "basavaraj"
                        },
                        department_ids: {
                            type: "array",
                            example: [1, 2]
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/fetch-users": {
        post: {
            tags: ["User"],
            summary: "Get users with filter",
            description: "Get users with filter",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get users with filter",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_id", "role_id", "skip", "limit"],
                    properties: {
                        day: {
                            type: "string",
                            example: '2020-03-27'
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1,4"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/fetch-users-new": {
        post: {
            tags: ["User"],
            summary: "Get users with filter",
            description: "Get users with filter",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get users with filter",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_id", "role_id", "skip", "limit"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1,4"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/users": {
        post: {
            tags: ["User"],
            summary: "Get users with filter",
            description: "Get users with filter",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get users with filter",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_id", "role_id", "skip", "limit"],
                    properties: {
                        location_id: { type: "number", example: "1" },
                        department_id: { type: "number", example: "1,4" },
                        role_id: { type: "number", example: "1" }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-user": {
        post: {
            tags: ["User"],
            summary: "Get users details",
            description: "Get users details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get users details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-browser-history": {
        post: {
            tags: ["User"],
            summary: "Get browser history details",
            description: "Get browser history details",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get browser history details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        from_date: {
                            type: "string",
                            example: "2020-04-30 18:30:00"
                        },
                        to_date: {
                            type: "string",
                            example: "2020-05-01 18:29:59"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-browser-history-new": {
        post: {
            tags: ["User"],
            summary: "Get browser history details",
            description: "Get browser history details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get browser history details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        startDate: {
                            type: "string",
                            example: "2020-04-30"
                        },
                        endDate: {
                            type: "string",
                            example: "2020-05-01"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/desktop-settings": {
        post: {
            tags: ["Desktop"],
            summary: "Update desktop operation",
            description: "Update desktop operation",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "desktopData",
                description: "Update desktop operation",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "shutdown", "restart", "logoff", "lock_computer", "task_manager", "block_usb", "lock_print", "signout", "hibernate", "sleep"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        shutdown: {
                            type: "boolean",
                            example: "true"
                        },
                        restart: {
                            type: "boolean",
                            example: "true"
                        },
                        logoff: {
                            type: "boolean",
                            example: "true"
                        },
                        lock_computer: {
                            type: "boolean",
                            example: "true"
                        },
                        task_manager: {
                            type: "boolean",
                            example: "true"
                        },
                        block_usb: {
                            type: "boolean",
                            example: "true"
                        },
                        lock_print: {
                            type: "boolean",
                            example: "true"
                        },
                        signout: {
                            type: "boolean",
                            example: "true"
                        },
                        hibernate: {
                            type: "boolean",
                            example: "true"
                        },
                        sleep: {
                            type: "boolean",
                            example: "true"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/desktop-settings-multi-user": {
        post: {
            tags: ["Desktop"],
            summary: "Update desktop operation",
            description: "Update desktop operation",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "desktopData",
                description: "Update desktop operation",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_ids", "shutdown", "restart", "logoff", "lock_computer", "task_manager", "block_usb", "lock_print", "signout", "hibernate", "sleep"],
                    properties: {
                        user_ids: {
                            type: "array",
                            example: [1, 2]
                        },
                        shutdown: {
                            type: "boolean",
                            example: "true"
                        },
                        restart: {
                            type: "boolean",
                            example: "true"
                        },
                        logoff: {
                            type: "boolean",
                            example: "true"
                        },
                        lock_computer: {
                            type: "boolean",
                            example: "true"
                        },
                        task_manager: {
                            type: "boolean",
                            example: "true"
                        },
                        block_usb: {
                            type: "boolean",
                            example: "true"
                        },
                        lock_print: {
                            type: "boolean",
                            example: "true"
                        },
                        signout: {
                            type: "boolean",
                            example: "true"
                        },
                        hibernate: {
                            type: "boolean",
                            example: "true"
                        },
                        sleep: {
                            type: "boolean",
                            example: "true"
                        }

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-storage-type": {
        post: {
            tags: ["Storage"],
            summary: "Add storage types",
            description: "Add storage types",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "storageData",
                description: "Add storage types",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "short_code"],
                    properties: {
                        name: {
                            type: "string",
                            example: "GoogleDrive"
                        },
                        short_code: {
                            type: "string",
                            example: "GD"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-storage-types": {
        get: {
            tags: ["Storage"],
            summary: "Get storage types",
            description: "Get storage types",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-storage-type-with-data": {
        get: {
            tags: ["Storage"],
            summary: "Get storage types with data",
            description: "Get storage types with data",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-storage-data": {
        post: {
            tags: ["Storage"],
            summary: "Add storage data",
            description: "Add storage data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "storageData",
                description: "Add storage data",
                required: true,
                schema: {
                    type: "object",
                    required: ["storage_type_id"],
                    properties: {
                        storage_type_id: {
                            type: "number",
                            example: "1"
                        },
                        username: {
                            type: "string",
                            example: "username"
                        },
                        password: {
                            type: "string",
                            example: "password"
                        },
                        desktop_access_token: {
                            type: "string",
                            example: "desktop"
                        },
                        web_access_token: {
                            type: "string",
                            example: "web"
                        },
                        application_id: {
                            type: "string",
                            example: "applicationId"
                        },
                        refresh_token: {
                            type: "string",
                            example: "refreshtoken"
                        },
                        admin_email: {
                            type: "string",
                            example: "admin@gmail.com"
                        },
                        client_id: {
                            type: "string",
                            example: "cccccc"
                        },
                        client_secret: {
                            type: "string",
                            example: "csssssss"
                        },
                        token: {
                            type: "string",
                            example: "ttttttttttt"
                        },
                        api_key: {
                            type: "string",
                            example: "apiiiiiiiiiii"
                        },
                        bucket_name: {
                            type: "string",
                            example: 'bucketname'
                        },
                        region: {
                            type: "string",
                            example: 'bucket-region'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-storage-data": {
        put: {
            tags: ["Storage"],
            summary: "Update storage data",
            description: "Update storage data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "storageData",
                description: "Update storage data",
                required: true,
                schema: {
                    type: "object",
                    required: ["storage_data_id"],
                    properties: {
                        storage_data_id: {
                            type: "number",
                            example: "1"
                        },
                        username: {
                            type: "string",
                            example: "username"
                        },
                        password: {
                            type: "string",
                            example: "password"
                        },
                        desktop_access_token: {
                            type: "string",
                            example: "desktop"
                        },
                        web_access_token: {
                            type: "string",
                            example: "web"
                        },
                        application_id: {
                            type: "string",
                            example: "applicationId"
                        },
                        refresh_token: {
                            type: "string",
                            example: "refreshtoken"
                        },
                        admin_email: {
                            type: "string",
                            example: "admin@gmail.com"
                        },
                        client_id: {
                            type: "string",
                            example: "cccccc"
                        },
                        client_secret: {
                            type: "string",
                            example: "csssssss"
                        },
                        token: {
                            type: "string",
                            example: "ttttttttttt"
                        },
                        api_key: {
                            type: "string",
                            example: "apiiiiiiiiiii"
                        },
                        bucket_name: {
                            type: "string",
                            example: 'bucketname'
                        },
                        region: {
                            type: "string",
                            example: 'bucket-region'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-storage-option": {
        put: {
            tags: ["Storage"],
            summary: "Update storage option",
            description: "Update storage option",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "storageData",
                description: "Update storage option",
                required: true,
                schema: {
                    type: "object",
                    required: ["storage_data_id", "status"],
                    properties: {
                        storage_data_id: {
                            type: "number",
                            example: "1"
                        },
                        status: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-storage-data": {
        delete: {
            tags: ["Storage"],
            summary: "Delete storage data",
            description: "Delete storage data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "storageData",
                description: "Delete storage data",
                required: true,
                schema: {
                    type: "object",
                    required: ["storage_data_id"],
                    properties: {
                        storage_data_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/application-used": {
        post: {
            tags: ["User"],
            summary: "Get application used details",
            description: "Get application used details",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get application used details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        from_date: {
                            type: "string",
                            example: "2020-04-30 18:30:00"
                        },
                        to_date: {
                            type: "string",
                            example: "2020-05-01 18:29:59"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/application-used-new": {
        post: {
            tags: ["User"],
            summary: "Get application used details",
            description: "Get application used details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get application used details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "startDate", "endDate", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        startDate: {
                            type: "string",
                            example: "2020-04-30"
                        },
                        endDate: {
                            type: "string",
                            example: "2020-05-01"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/log-detail": {
        post: {
            tags: ["User"],
            summary: "Get user log details",
            description: "Get user log details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get user log details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "11/18/2019"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/log-detail-kamal": {
        post: {
            tags: ["User"],
            summary: "Get user log details",
            description: "Get user log details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get user log details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "11/18/2019"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/log-detail-range": {
        post: {
            tags: ["User"],
            summary: "Get user log details",
            description: "Get user log details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get user log details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        from_date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        to_date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        skip: {
                            type: "number",
                            example: '0'
                        },
                        limit: {
                            type: "number",
                            example: '10'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "log-detail-range-kamal": {
        post: {
            tags: ["User"],
            summary: "Get user log details",
            description: "Get user log details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get user log details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        from_date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        to_date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        skip: {
                            type: "number",
                            example: '0'
                        },
                        limit: {
                            type: "number",
                            example: '10'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/top-apps": {
        post: {
            tags: ["User"],
            summary: "Get top application details",
            description: "Get top application details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get top application details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-screenshots": {
        post: {
            tags: ["User"],
            summary: "Get screenshot data",
            description: "Get screenshot data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get screenshot data",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "from_hour", "to_hour", "mail"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "2019-12-23"
                        },
                        mail: {
                            type: "string",
                            example: "abc@gmail.com"
                        },
                        from_hour: {
                            type: "number",
                            example: "10"
                        },
                        to_hour: {
                            type: "number",
                            example: "11"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/download-screenshots": {
        post: {
            tags: ["User"],
            summary: "Download screenshot data",
            description: "Download screenshot data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Download screenshot data",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "from_hour", "to_hour"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "2019-12-23"
                        },
                        from_hour: {
                            type: "number",
                            example: "10"
                        },
                        to_hour: {
                            type: "number",
                            example: "11"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/top-websites": {
        post: {
            tags: ["User"],
            summary: "Get top websites details",
            description: "Get top websites details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get top websites details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-keystrokes": {
        post: {
            tags: ["User"],
            summary: "Get top keystroke details",
            description: "Get top keystroke details",
            deprecated: true,
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get top keystroke details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "11/18/2019"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-keystrokes-new": {
        post: {
            tags: ["User"],
            summary: "Get top keystroke details",
            description: "Get top keystroke details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get top keystroke details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "startDate", "endDate", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        startDate: {
                            type: "string",
                            example: "2020-05-17"
                        },
                        endDate: {
                            type: "string",
                            example: "2020-05-17"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-delete": {
        delete: {
            tags: ["User"],
            summary: "Delete Employee ",
            description: "Delete Employee ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Delete Employee details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id",],
                    properties: {
                        user_id: {
                            type: "string",
                            example: "1"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-delete-multiple": {
        delete: {
            tags: ["User"],
            summary: "Delete multiple user",
            description: "Delete multiple user",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Delete Employee",
                description: "Delete multiple user",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_ids",],
                    properties: {
                        user_ids: {
                            type: "array",
                            example: [{
                                user_id: 1
                            }, {
                                user_id: 2
                            }]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-user-status": {
        put: {
            tags: ["User"],
            summary: "Update user status",
            description: "Update user status",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Update user status",
                required: true,
                schema: {
                    type: "object",
                    required: ["status", "user_ids"],
                    properties: {
                        user_ids: {
                            type: "array",
                            example: [{
                                user_id: 1
                            }, {
                                user_id: 2
                            }]
                        },
                        status: {
                            type: "number",
                            example: "2"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/upgrade-downgrade-manager": {
        put: {
            tags: ["User"],
            summary: "Upgrade to manager",
            description: "Upgrade to manager",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Update user status",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "params"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "2"
                        },
                        params: {
                            type: "String",
                            example: "M"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/assign-user-manager": {
        post: {
            tags: ["User"],
            summary: "Assign user to manager",
            description: "Assign user to manager",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Assign user to manager",
                required: true,
                schema: {
                    type: "object",
                    required: ["manager_id", "user_ids"],
                    properties: {
                        user_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        manager_id: {
                            type: "number",
                            example: '1'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-assign": {
        post: {
            tags: ["User"],
            summary: "Assign user to manager",
            description: "Assign user to manager",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Assign user to manager",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_multi_manager", "user_teamlead", "user_manager"],
                    properties: {
                        user_multi_manager: {
                            type: "object",
                            properties: {
                                user_id: { type: "number", example: "1" },
                                manager_ids: { type: "array", example: [1, 2, 3, 4] }
                            }
                        },
                        user_teamlead: {
                            type: "object",
                            properties: {
                                user_ids: { type: "array", example: [1, 2, 3, 4] },
                                teamlead_id: { type: "number", example: "1" },
                            }
                        },
                        user_manager: {
                            type: "object",
                            properties: {
                                user_ids: { type: "array", example: [1, 2, 3, 4] },
                                manager_id: { type: "number", example: "1" },
                            }
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/assign-user-teamlead": {
        post: {
            tags: ["User"],
            summary: "Assign user to teamlead",
            description: "Assign user to teamlead",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Assign user to teamlead",
                required: true,
                schema: {
                    type: "object",
                    required: ["teamlead_id", "user_ids"],
                    properties: {
                        user_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        teamlead_id: {
                            type: "number",
                            example: '1'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/assign-user-manager-multi": {
        post: {
            tags: ["User"],
            summary: "Assign user to manager multiple",
            description: "Assign user to manager multiple",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Assign user to manager",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "manager_ids"],
                    properties: {
                        user_id: {
                            type: "array",
                            example: "1"
                        },
                        manager_ids: {
                            type: "number",
                            example: [1, 2, 3, 4]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/unassign-user-manager": {
        delete: {
            tags: ["User"],
            summary: "Unassign user from manager",
            description: "Unassign user from manager",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Unassign user from manager",
                required: true,
                schema: {
                    type: "object",
                    required: ["manager_id", "user_id"],
                    properties: {
                        user_id: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        manager_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/unassign-user-teamlead": {
        delete: {
            tags: ["User"],
            summary: "Unassign user from teamlead",
            description: "Unassign user from teamlead",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "usereData",
                description: "Unassign user from teamlead",
                required: true,
                schema: {
                    type: "object",
                    required: ["teamlead_id", "user_ids"],
                    properties: {
                        user_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        teamlead_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/manager-auth": {
        post: {
            tags: ["Open"],
            summary: " manager sinup ",
            description: "Create a Post",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "manager sinup ",
                description: "manager sinup ",
                required: true,
                schema: {
                    type: "object",
                    required: ["userName", "password"],
                    properties: {
                        userName: {
                            type: "string",
                            example: "username"
                        },
                        password: {
                            type: "string",
                            example: "********"
                        },
                        ip: {
                            type: "string",
                            example: "123.123.123.128"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject
        }
    },
    "/update-interval": {
        put: {
            tags: ["Admin"],
            summary: "Interval time update",
            description: "Interval time update",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "adminData",
                description: "Interval time update",
                required: true,
                schema: {
                    type: "object",
                    required: ["screenshot_capture_interval", "ideal_time", "offline_time"],
                    properties: {
                        screenshot_capture_interval: {
                            type: "number",
                            example: "30"
                        },
                        ideal_time: {
                            type: "number",
                            example: "5"
                        },
                        offline_time: {
                            type: "number",
                            example: "10"
                        },
                        manager_ip_restriction: {
                            type: "number",
                            example: '1'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/admin-profile-update": {
        "post": {
            "tags": ["Admin"],
            "description": "Update Admin",
            "consumes": ["multipart/form-data"],
            "produces": ["application/json"],
            "parameters": [{
                in: "formData",
                name: "admin_id",
                type: "number",
                required: true,
            },
            {
                in: "formData",
                name: "name",
                type: "string",
                required: false,
            },
            {
                in: "formData",
                name: "full_name",
                type: "string",
                required: false,
            },


            {
                in: "formData",
                name: "password",
                type: "string",
                required: false,
            },
            {
                in: "formData",
                name: "new_password",
                type: "string",
                required: false,
            },
            {
                in: "formData",
                name: "confirm_password",
                type: "string",
                required: false,
            },

            {
                in: "formData",
                name: "avatar",
                type: "file",
                required: false,
                description: "Upload profilePic."
            },

            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-profile-update": {
        "post": {
            tags: ["User"],
            description: "Update user",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: " userData",
                description: " Update user details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "name", "full_name", "email", "password", "phone", "emp_code", "location_id", "department_id", "data_join", "address", "role_id"],
                    properties: {
                        userId: {
                            type: "number",
                            example: "1"
                        },
                        name: {
                            type: "string",
                            example: "Basavaraj"
                        },
                        full_name: {
                            type: "string",
                            example: "Basavaraj S"
                        },
                        email: {
                            type: "string",
                            example: "basavaraj@gmail.com"
                        },
                        password: {
                            type: "string",
                            example: "Basavaraj@1234"
                        },
                        phone: {
                            type: "string",
                            example: "7829552217"
                        },
                        emp_code: {
                            type: "string",
                            example: "GLB-BAN-414"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        },
                        address: {
                            type: "string",
                            example: "dfjfrf"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-category": {
        post: {
            tags: ["Firewall"],
            summary: "Add category ",
            description: "",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Add category ",
                description: "Add category ",
                required: true,
                schema: {
                    type: "object",
                    required: ["name",],
                    properties: {
                        name: {
                            type: "string",
                            example: "categoryName"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-category-domains": {
        get: {
            tags: ["Firewall"],
            description: "To get category",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-category": {
        get: {
            tags: ["Firewall"],
            description: "To get category",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-days": {
        get: {
            tags: ["Firewall"],
            description: "To get days",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-domain": {
        post: {
            tags: ["Firewall"],
            summary: "Add domain ",
            description: "Create a Post",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Add domain ",
                description: "Add new domain ",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "catId"],
                    properties: {
                        name: {
                            type: "string",
                            example: "domainName"
                        },
                        category_id: {
                            type: "number",
                            example: "1"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/auto-email": {
        get: {
            tags: ["Report"],
            summary: "Get Auto Email Data",
            description: "Get Auto Email Data",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-auto-email": {
        put: {
            tags: ["Report"],
            summary: "Update Auto Email Data",
            description: "Update Auto Email Data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "reportData",
                description: "Update Auto Email Data",
                required: true,
                schema: {
                    type: "object",
                    required: ["recipient_email", "website_analytics", "application_analytics", "keystroke", "browser_history", "user_log", "top_website_analytics", "top_application_analytics", "status", "frequency_type"],
                    properties: {
                        recipient_email: {
                            type: "string",
                            example: "basavaraj@gmail.com"
                        },
                        website_analytics: {
                            type: "number",
                            example: "1"
                        },
                        application_analytics: {
                            type: "number",
                            example: "1"
                        },
                        keystroke: {
                            type: "number",
                            example: "1"
                        },
                        browser_history: {
                            type: "number",
                            example: "1"
                        },
                        user_log: {
                            type: "number",
                            example: "1"
                        },
                        top_website_analytics: {
                            type: "number",
                            example: "1"
                        },
                        top_application_analytics: {
                            type: "number",
                            example: "1"
                        },
                        status: {
                            type: "number",
                            example: "1"
                        },
                        frequency_type: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-download-option": {
        get: {
            tags: ["Report"],
            description: "Report download option",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/employees-list-report": {
        post: {
            tags: ["Report"],
            summary: "Employees List For Reports",
            description: "Employees List Report ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Employee List",
                description: "Employee List  For Report",
                required: false,
                schema: {
                    type: "object",
                    properties: {
                        department_id: {
                            type: "number",
                            example: "1"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                        skip: {
                            type: "number",
                            example: "1"
                        },

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-department-by-location": {
        post: {
            tags: ["Location"],
            summary: "Get department by locations",
            description: "Get department by locations",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "locationData",
                description: "Get department by locations",
                required: false,
                schema: {
                    type: "object",
                    properties: {
                        location_id: {
                            type: "number",
                            example: "1"
                        }

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/employees-list-report": {
        post: {
            tags: ["Report"],
            summary: "Employee list for report",
            description: "Employee list for report",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Employee List",
                description: "Employee list for report",
                required: false,
                schema: {
                    type: "object",
                    properties: {
                        department_id: {
                            type: "number",
                            example: "1"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                        skip: {
                            type: "number",
                            example: "1"
                        },

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/download-user-report": {
        post: {
            tags: ["Report"],
            summary: "Download user report",
            description: "Download user report ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Employee Report",
                description: `from_date_utc('YYYY-MM-DD HH:mm:ss') to_date_utc('YYYY-MM-DD HH:mm:ss') from_date('YYYY-MM-DD')  to_date('YYYY-MM-DD')`,
                required: false,
                schema: {
                    type: "object",
                    required: ["from_date_utc", "to_date_utc", "from_date", "to_date", "user_id", "downloadOption",],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        downloadOption: {
                            type: "number",
                            example: "1"
                        },
                        from_date_utc: {
                            type: "string",
                            example: "2020-05-03 18:30:00"
                        },
                        to_date_utc: {
                            type: "string",
                            example: "2020-05-03 18:29:59"
                        },
                        from_date: {
                            type: "string",
                            example: "2020-05-03"
                        },
                        to_date: {
                            type: "string",
                            example: "2020-05-03"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-report": {
        post: {
            tags: ["Report"],
            summary: "Download user report",
            description: "Download user report ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "User Report",
                description: "Download user report",
                required: false,
                schema: {
                    type: "object",
                    required: ["user_id", "from_date", "to_date"],
                    properties: {
                        user_id: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        from_date: {
                            type: "string",
                            example: "2019-11-19"
                        },
                        to_date: {
                            type: "string",
                            example: "2019-11-29"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/dashboard": {
        get: {
            tags: ["Dashboard"],
            description: "Dashboard data",
            produces: ["application/json"],
            parameters: [{
                in: "query",
                name: "day",
                schema: {
                    type: "string",
                    example: "2020-04-07"
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/stats": {
        get: {
            tags: ["Dashboard"],
            description: "Dashboard data",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/registered-emp": {
        get: {
            tags: ["Dashboard"],
            description: "Dashboard data",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/suspended-emp": {
        get: {
            tags: ["Dashboard"],
            description: "Dashboard data",
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/absent-emp": {
        get: {
            tags: ["Dashboard"],
            description: "Dashboard data",
            produces: ["application/json"],
            parameters: [{
                in: "query",
                name: "day",
                schema: {
                    type: "string",
                    example: "2020-04-07"
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/online-emp": {
        get: {
            tags: ["Dashboard"],
            description: "Online Employees",
            produces: ["application/json"],
            parameters: [{
                in: "query",
                name: "day",
                schema: {
                    type: "string",
                    example: "2020-04-07"
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/offline-emp": {
        get: {
            tags: ["Dashboard"],
            description: "Offline Employees",
            produces: ["application/json"],
            parameters: [{
                in: "query",
                name: "day",
                schema: {
                    type: "string",
                    example: "2020-04-07"
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/production-stats": {
        get: {
            tags: ["Report"],
            description: "Dashboard data",
            produces: ["application/json"],
            parameters: [{
                in: "query",
                name: "day",
                schema: {
                    type: "string",
                    example: "2020-04-07"
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    /** Settings */
    "/settings/productivity-rankings": {
        get: {
            tags: ["Settings"],
            description: "status => 0=Neutral 1=Productive 2=Unproductive",
            produces: ["application/json"],
            parameters: [
                {
                    in: "query",
                    name: "page",
                    schema: {
                        type: "number",
                        example: 1
                    }
                },
                {
                    in: "query",
                    name: "limit",
                    schema: {
                        type: "number",
                        example: 25
                    }
                },
                {
                    in: "query",
                    name: "category_type",
                    type: "string",
                    enum: ["All", "Global", "Custom", "New"]
                },
                {
                    in: "query",
                    name: "type",
                    type: "number",
                    enum: ["1", "2"]
                },
                {
                    in: "query",
                    name: "name",
                    type: "string",
                    schema: {
                        example: "account"
                    }
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    // "/settings/productivity-ranking-not-for-bulk": {
    //     put: {
    //         tags: ["Settings"],
    //         summary: "Update Productivity-Ranking",
    //         description: "Update Productivity-Ranking",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "Productivity-Ranking",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["application_id", "department_rules"],
    //                 properties: {
    //                     application_id: {
    //                         type: "string",
    //                         example: "54759eb3c090d83494e2d804"
    //                     },
    //                     department_rules: {
    //                         type: "array",
    //                         example: [
    //                             { department_id: 1, status: 1 },
    //                             { department_id: 2, status: 2 }
    //                         ],
    //                         // items: {
    //                         //     productive: {
    //                         //         type: "array",
    //                         //         example: [1, 2]
    //                         //     },
    //                         //     unproductive: {
    //                         //         type: "array",
    //                         //         example: [3, 4]
    //                         //     },
    //                         //     neutral: {
    //                         //         type: "array",
    //                         //         example: [5, 6]
    //                         //     }
    //                         // }
    //                     }
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    "/settings/productivity-ranking": {
        put: {
            tags: ["Settings"],
            summary: "Update Productivity-Ranking",
            description: "Update Productivity-Ranking",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Productivity-Ranking",
                required: true,
                schema: {
                    type: "object",
                    required: ["data"],
                    properties: {
                        data: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    application_id: {
                                        type: "string",
                                        example: "54759eb3c090d83494e2d804"
                                    },
                                    department_rules: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                department_id: { type: "number" },
                                                status: { type: "number" }
                                            }
                                        }
                                    },
                                }
                            },
                            example: [
                                {
                                    application_id: "54759eb3c090d83494e2d804",
                                    department_rules: [
                                        { department_id: 1, status: 0 },
                                        { department_id: 2, status: 1 },
                                    ]
                                },
                                {
                                    application_id: "54759eb3c090d83494e2d804",
                                    department_rules: [
                                        { department_id: 1, status: 0 },
                                        { department_id: 2, status: 1 },
                                    ]
                                },
                            ],
                            // items: [
                            //     { department_id: 1, status: 1 },
                            //     { department_id: 2, status: 2 }
                            // ],
                            // items: {
                            //     productive: {
                            //         type: "array",
                            //         example: [1, 2]
                            //     },
                            //     unproductive: {
                            //         type: "array",
                            //         example: [3, 4]
                            //     },
                            //     neutral: {
                            //         type: "array",
                            //         example: [5, 6]
                            //     }
                            // }
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    // "/settings/productivity-ranking": {
    //     put: {
    //         tags: ["Settings"],
    //         summary: "Update Productivity-Ranking",
    //         description: "Update Productivity-Ranking",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "Productivity-Ranking",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["application_id", "department_ids", "status"],
    //                 properties: {
    //                     application_id: {
    //                         type: "string",
    //                         example: "54759eb3c090d83494e2d804"
    //                     },
    //                     department_rule: {
    //                         type: "object",
    //                         properties: {
    //                             productive: {
    //                                 type: "array",
    //                                 example: [1, 2]
    //                             },
    //                             unproductive: {
    //                                 type: "array",
    //                                 example: [3, 4]
    //                             },
    //                             neutral: {
    //                                 type: "array",
    //                                 example: [5, 6]
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    // "/settings/productivity-rankings": {
    //     get: {
    //         tags: ["Settings"],
    //         description: "status => 0=Neutral 1=Productive 2=Unproductive \n Per Page 500 data",
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "query",
    //             name: "page",
    //             schema: {
    //                 type: "number",
    //                 example: "1"
    //             }
    //         },
    //         {
    //             in: "query",
    //             name: "type",
    //             type: "string",
    //             enum: ["APP", "WEB"]
    //         },
    //         {
    //             in: "query",
    //             name: "department_id",
    //             schema: {
    //                 type: "number",
    //                 // example: "1"
    //             }
    //         },
    //         {
    //             in: "query",
    //             name: "startDate",
    //             schema: {
    //                 type: "string",
    //                 // example: "2020-02-07"
    //             },
    //             required: false
    //         },
    //         {
    //             in: "query",
    //             name: "endDate",
    //             schema: {
    //                 type: "string",
    //                 // example: "2020-02-12"
    //             },
    //             required: false
    //         },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    // "/settings/productivity-ranking": {
    //     put: {
    //         tags: ["Settings"],
    //         summary: "Update Productivity-Ranking",
    //         description: "Update Productivity-Ranking",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "Productivity-Ranking",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["app_domain_id", "status"],
    //                 properties: {
    //                     app_domain_id: {
    //                         type: "number",
    //                         example: 1
    //                     },
    //                     department_id: {
    //                         type: "number",
    //                         example: 1
    //                     },
    //                     status: {
    //                         type: "number",
    //                         example: 1
    //                     }
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    // "/settings/productivity-ranking-single": {
    //     post: {
    //         tags: ["Settings"],
    //         summary: "Add Single Productivity-Ranking",
    //         description: "status => 0=Neutral 1=Productive 2=Unproductive \n type => APP or WEB",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //          deprecated: true,
    //         parameters: [{
    //             in: "body",
    //             name: "Productivity-Ranking",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["name", "type", "status"],
    //                 properties: {
    //                     name: {
    //                         type: "string",
    //                         example: "stackoverflow.com"
    //                     },
    //                     type: {
    //                         type: "string",
    //                         enum: ["APP", "WEB"],
    //                         example: "WEB"
    //                     },
    //                     status: {
    //                         type: "number",
    //                         example: 1
    //                     }
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    // "/settings/productivity-ranking-bulk": {
    //     post: {
    //         tags: ["Settings"],
    //         summary: "Update Productivity-Ranking",
    //         description: "Update Productivity-Ranking",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "Productivity-Ranking",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["data"],
    //                 properties: {
    //                     data: {
    //                         type: "array",
    //                         example: [
    //                             { app_domain_id: 1, department_id: 1, status: 1 },
    //                             { app_domain_id: 2, department_id: 2, status: 2 }
    //                         ]
    //                     }
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    /** Reports */
    "/reports/productivity": {
        get: {
            tags: ["Report"],
            description: "",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "location_id", schema: { type: "number" } },
                { in: "query", name: "department_id", schema: { type: "number", } },
                { in: "query", name: "user_id", schema: { type: "number" } },
                { in: "query", name: "startDate", schema: { type: "string", example: "2020-04-10" }, required: true },
                { in: "query", name: "endDate", schema: { type: "string", example: "2020-04-11" }, required: true },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/reports/productivity-list": {
        get: {
            tags: ["Report"],
            description: "",
            produces: ["application/json"],
            parameters: [
                { in: "query", name: "page", schema: { type: "number", example: 1 }, required: false },
                { in: "query", name: "limit", schema: { type: "number", example: 10 }, required: true },
                { in: "query", name: "location_id", schema: { type: "number", example: 1 }, required: true },
                { in: "query", name: "department_id", schema: { type: "number" }, required: false },
                { in: "query", name: "employee_id", schema: { type: "number" }, required: false },
                { in: "query", name: "startDate", schema: { type: "string", example: "2020-04-10" }, required: true },
                { in: "query", name: "endDate", schema: { type: "string", example: "2020-04-11" }, required: true }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    /** production hours fordashboard */
    "/dashboard-production": {
        post: {
            tags: ["Dashboard"],
            summary: "Production",
            description: "production ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Production",
                description: "Production hours",
                required: true,
                schema: {
                    type: "object",
                    required: ["from_date,to_date"],
                    properties: {
                        from_date: {
                            type: "string",
                            example: "2019-11-19"
                        },
                        to_date: {
                            type: "string",
                            example: "2019-11-29"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/dashboard-active-days": {
        post: {
            tags: ["Dashboard"],
            summary: "Active days",
            description: "Active days ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Active days",
                description: "Active days",
                required: true,
                schema: {
                    type: "object",
                    required: ["from_date,to_date"],
                    properties: {
                        from_date: {
                            type: "string",
                            example: "2019-11-19"
                        },
                        to_date: {
                            type: "string",
                            example: "2019-11-29"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/dashboard-location-hours": {
        post: {
            tags: ["Dashboard"],
            summary: "Location",
            description: "production for location ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Location",
                description: "production for location",
                required: true,
                schema: {
                    type: "object",
                    required: ["from_date,to_date"],
                    properties: {
                        from_date: {
                            type: "string",
                            example: "2019-11-19"
                        },
                        to_date: {
                            type: "string",
                            example: "2019-11-29"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/dashboard-present-rate": {
        post: {
            tags: ["Dashboard"],
            summary: "Presence",
            description: "Presence rate ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Presence ",
                description: "Presence rate",
                required: true,
                schema: {
                    type: "object",
                    required: ["from_date,to_date"],
                    properties: {
                        from_date: {
                            type: "string",
                            example: "2019-11-19"
                        },
                        to_date: {
                            type: "string",
                            example: "2019-11-29"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-ip-whitelist": {
        post: {
            tags: ["Firewall"],
            summary: "add IP to whitelist ",
            description: "add IP to whitelist  ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "add IP to whitelist  ",
                description: "add IP to whitelist ",
                required: true,
                schema: {
                    type: "object",
                    required: ["admin_email", "ip"],
                    properties: {
                        admin_email: {
                            type: "string",
                            example: "abc@gamil.com"
                        },
                        ip: {
                            type: "string",
                            example: "44.21.45.145"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-ip-whitelist": {
        post: {
            tags: ["Firewall"],
            summary: "get IP whitelist ",
            description: "get IP whitelist  ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "get IP whitelist ",
                description: "get IP whitelist ",
                required: false,
                schema: {
                    type: "object",
                    properties: {
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-ip-whitelist": {
        post: {
            tags: ["Firewall"],
            summary: "delete IP ",
            description: "delete IP from whitelis",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "delete IP from whitelis ",
                description: "delete IP from whitelis ",
                required: true,
                schema: {
                    type: "object",
                    required: ["ip_id"],
                    properties: {
                        ip_id: {
                            type: "number",
                            example: "1"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/edit-ip-whitelist": {
        post: {
            tags: ["Firewall"],
            summary: "Edit IP ",
            description: " edit whitelis IP",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "edit whitelis IP ",
                description: "edit whitelis IP",
                required: true,
                schema: {
                    type: "object",
                    required: ["ip_id", "ip"],
                    properties: {
                        ip_id: {
                            type: "number",
                            example: "1"
                        },
                        ip: {
                            type: "number",
                            example: "14.45.87.123"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/search-ip-whitelist": {
        post: {
            tags: ["Firewall"],
            summary: "Search IP ",
            description: " Search whitelis IP",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Search whitelis IP ",
                description: "Search whitelis IP",
                required: true,
                schema: {
                    type: "object",
                    required: ["ip"],
                    properties: {
                        ip: {
                            type: "number",
                            example: "14.45.87.123"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/block-user-dept-domains": {
        post: {
            tags: ["Firewall"],
            summary: "Block user and department domains",
            description: "Block user and department domains",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Block user and department domains",
                required: true,
                schema: {
                    type: "object",
                    required: ["entity_type", "entity_ids", "domain_ids", "category_ids", "days_ids"],
                    properties: {
                        entity_type: {
                            type: "string",
                            example: "U"
                        },
                        entity_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        domain_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        category_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        days_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-blocked-user-dept-domains": {
        post: {
            tags: ["Firewall"],
            summary: "Get blocked user and department domains",
            description: "Get blocked user and department domains",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Get blocked user and department domains",
                required: true,
                schema: {
                    type: "object",
                    required: ["skip", "limit"],
                    properties: {
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/single-rule-blocked-user-dept-domains": {
        post: {
            tags: ["Firewall"],
            summary: "Get single rule blocked user and department domains",
            description: "Get single rule blocked user and department domains",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Get single rule blocked user and department domains",
                required: true,
                schema: {
                    type: "object",
                    required: ["blocked_rule_id"],
                    properties: {
                        blocked_rule_id: {
                            type: "number",
                            example: "1"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-blocked-user-dept-domains": {
        delete: {
            tags: ["Firewall"],
            summary: "Delete blocked user and department domains",
            description: "Delete blocked user and department domains",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Delete blocked user and department domains",
                required: true,
                schema: {
                    type: "object",
                    required: ["blocked_rule_id"],
                    properties: {
                        blocked_rule_id: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-blocked-user-dept-domains": {
        put: {
            tags: ["Firewall"],
            summary: "Update user and department domains",
            description: "Update user and department domains",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Update user and department domains",
                required: true,
                schema: {
                    type: "object",
                    required: ["blocked_rule_id", "entity_type", "entity_ids", "domain_ids", "category_ids", "days_ids"],
                    properties: {
                        blocked_rule_id: {
                            type: "number",
                            example: "2"
                        },
                        entity_type: {
                            type: "string",
                            example: "U"
                        },
                        entity_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        domain_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        category_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                        days_ids: {
                            type: "array",
                            example: [1, 2, 3, 4]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-status-blocked-user-dept-domains": {
        put: {
            tags: ["Firewall"],
            summary: "Update user and department domains status",
            description: "Update user and department domains status",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ruleData",
                description: "Update user and department domains status",
                required: true,
                schema: {
                    type: "object",
                    required: ["blocked_rule_id", "status"],
                    properties: {
                        rule_data: {
                            type: 'array',
                            example: [{
                                blocked_rule_id: 1,
                                status: 1
                            }, {
                                blocked_rule_id: 2,
                                status: 0
                            }]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-assigned-employee-to-manager": {
        post: {
            tags: ["User"],
            summary: "Get assigned employees to manager",
            description: "Get assigned employees to manager",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get assigned employees to manager",
                required: true,
                schema: {
                    type: "object",
                    required: ["manager_id"],
                    properties: {
                        manager_id: {
                            type: "number",
                            example: "1"
                        },
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "string",
                            example: "1,2"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-category": {
        put: {
            tags: ["Firewall"],
            summary: "Update category details",
            description: "Update category details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "categoryData",
                description: "Update category details",
                required: true,
                schema: {
                    type: "object",
                    required: ["category_id", "name"],
                    properties: {
                        category_id: {
                            type: "number",
                            example: "1"
                        },
                        name: {
                            type: "string",
                            example: "Sports"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-category": {
        delete: {
            tags: ["Firewall"],
            summary: "Delete category details",
            description: "Delete category details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "categoryData",
                description: "Delete category details",
                required: true,
                schema: {
                    type: "object",
                    required: ["category_id"],
                    properties: {
                        category_id: {
                            type: "number",
                            example: [1, 2]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/admin-authentication": {
        post: {
            tags: ["Open"],
            summary: "Admin authentication",
            description: " Admin authentication",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: " adminData",
                description: "Admin authentication",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "first_name", "last_name", "username", "email", "address", "phone"],
                    properties: {
                        name: {
                            type: "string",
                            example: "basavaraj s"
                        },
                        first_name: {
                            type: "string",
                            example: "basavaraj"
                        },
                        last_name: {
                            type: "string",
                            example: "s"
                        },
                        email: {
                            type: "string",
                            example: "basavaraj@gmail.com"
                        },
                        username: {
                            type: "string",
                            example: "basavarajs"
                        },
                        address: {
                            type: "string",
                            example: "basavaraj s"
                        },
                        phone: {
                            type: "string",
                            example: "+7829552254"
                        },
                        product_id: {
                            type: "number",
                            example: '1'
                        },
                        begin_date: {
                            type: "date",
                            example: "2019-01-27"
                        },
                        expire_date: {
                            type: "date",
                            example: "2019-01-27"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
        }
    },
    "/user-list-desktop": {
        post: {
            tags: ["Desktop"],
            summary: "Get users with filter",
            description: "Get users with filter",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get users with filter",
                required: true,
                schema: {
                    type: "object",
                    required: ["location_id", "department_id", "role_id", "skip", "limit"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: "1"
                        },
                        department_id: {
                            type: "number",
                            example: "1,4"
                        },
                        role_id: {
                            type: "number",
                            example: "1"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/domain-search": {
        post: {
            tags: ["Firewall"],
            summary: "Search domain by name",
            description: "Search domain by name",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domain Data",
                description: "Search domains",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "skip", "limit"],
                    properties: {
                        name: {
                            type: "string",
                            example: "bbc"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-domain-bulk": {
        post: {
            tags: ["Firewall"],
            summary: "Add domain in bulk.",
            description: "Add domain in bulk.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Add domain in bulk.",
                required: true,
                schema: {
                    type: "object",
                    required: ["categories_id", "domains"],
                    properties: {
                        categories_id: {
                            type: "number",
                            example: "1"
                        },
                        domains: {
                            type: "array",
                            example: ["www.google.com", "www.w3school.com"]
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-domain": {
        put: {
            tags: ["Firewall"],
            summary: "Update domain.",
            description: "Update domain.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Update domain.",
                required: true,
                schema: {
                    type: "object",
                    required: ["domain_id", "domain_name", "categories_id"],
                    properties: {
                        categories_id: {
                            type: "number",
                            example: "1"
                        },
                        domain_id: {
                            type: "number",
                            example: "1"
                        },
                        domain_name: {
                            type: "string",
                            example: "www.google.com"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-department-domain-blocked": {
        post: {
            tags: ["Firewall"],
            summary: "View user and department block.",
            description: "View user and department block.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "View user and department block.",
                required: true,
                schema: {
                    type: "object",
                    required: ["domain_id", "categories_id"],
                    properties: {
                        categories_id: {
                            type: "number",
                            example: "1"
                        },
                        domain_id: {
                            type: "number",
                            example: "1"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/domains": {
        get: {
            tags: ["Firewall"],
            summary: "View domain.",
            description: "View domain.",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-domains": {
        delete: {
            tags: ["Firewall"],
            summary: "Delete Domains .",
            description: "Delete Domains .",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "deleteDomain",
                description: "Delete Domains .",
                required: true,
                schema: {
                    type: "object",
                    required: ["domain_ids",],
                    properties: {

                        domain_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/forgot-password": {
        post: {
            tags: ["Open"],
            summary: "Forgot Password.",
            description: "Forgot Password.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ForgotPasswordData",
                description: "Forgot Password.",
                required: true,
                schema: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: {
                            type: "string",
                            example: "abc@gmail.com"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject
        }
    },
    "/reset-password": {
        put: {
            tags: ["Open"],
            summary: "Reset Password.",
            description: "Reset Password.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ResetPasswordData",
                description: "Reset Password.",
                required: true,
                schema: {
                    type: "object",
                    required: ["email", "confirm_password", "new_password"],
                    properties: {
                        email: {
                            type: "string",
                            example: "abc@gmail.com"
                        },
                        new_password: {
                            type: "string",
                            example: "Abc@123"
                        },
                        confirm_password: {
                            type: "string",
                            example: "Abc@123"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject
        }
    },
    "/add-multiple-dept-location-by-name": {
        post: {
            tags: ["Location"],
            summary: "Add Multiple Department.",
            description: "Add Multiple Department To New Location.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "AddDepartmentData",
                description: "Add Multiple Department To New Location.",
                required: true,
                schema: {
                    type: "object",
                    required: ["location"],
                    properties: {
                        location: {
                            type: "string",
                            example: "Bengaluru"
                        },
                        department_id: {
                            type: "string",
                            example: "1,2,3"
                        },
                        department_name: {
                            type: "array",
                            example: ["Node js", "PHP"]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/top-apps-admin": {
        post: {
            tags: ["Admin"],
            summary: "Top Apps For Admin.",
            description: "Top Used Apps of All Employees Under Admin.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TopAppsData",
                description: "Top Used Apps of All Employees Under Admin.",
                required: true,
                schema: {
                    type: "object",
                    required: ["location"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: 1
                        },
                        department_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "string",
                            example: "2019-02-03"
                        },
                        to_date: {
                            type: "string",
                            example: "2020-02-03"
                        },
                        skip: {
                            type: "number",
                            example: 1
                        },
                        limit: {
                            type: "number",
                            example: 10
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/top-websites-admin": {
        post: {
            tags: ["Admin"],
            summary: "Top Websites For Admin.",
            description: "Top Websites Visited of All Employees Under Admin.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TopWebsiteData",
                description: "Top Websites Visited of All Employees Under Admin.",
                required: true,
                schema: {
                    type: "object",
                    required: ["location"],
                    properties: {
                        location_id: {
                            type: "number",
                            example: 1
                        },
                        department_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "string",
                            example: "2019-02-03"
                        },
                        to_date: {
                            type: "string",
                            example: "2020-02-03"
                        },
                        skip: {
                            type: "number",
                            example: 1
                        },
                        limit: {
                            type: "number",
                            example: 10
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/change-domain-category": {
        put: {
            tags: ["Firewall"],
            summary: "Change domain category.",
            description: "Change domain category.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "domainData",
                description: "Change domain category.",
                required: true,
                schema: {
                    type: "object",
                    required: ["domain_name", "categories_id", "domain_id"],
                    properties: {

                        domain_id: {
                            type: "number",
                            example: 1
                        },
                        domain_name: {
                            type: "string",
                            example: "www.google.com"
                        },
                        categories_id: {
                            type: "number",
                            example: 1
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/upload-domains": {
        "post": {
            tags: ["Firewall"],
            description: "Upload domain",
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            "parameters": [{
                in: "query",
                name: "categories_id",
                type: "number",
                required: true,
            },
            {
                in: "formData",
                name: "file",
                type: "file",
                required: true,
                description: "Upload domain."
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-working-hours": {
        post: {
            tags: ["User"],
            summary: "User Working Hours.",
            description: "User Working Hours.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "WorkingHoursData",
                description: "User Working Hours.",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "admin_id", "to_date", "from_date"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "date",
                            example: "2019-01-01"
                        },
                        to_date: {
                            type: "date",
                            example: "2020-12-12"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/user-working-hours-department": {
        post: {
            tags: ["User"],
            summary: "User Working Hours For Department.",
            description: "User Working Hours.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "WorkingHoursData",
                description: "User Working Hours For Department.",
                required: true,
                schema: {
                    type: "object",
                    required: ["department_id", "admin_id", "to_date", "from_date"],
                    properties: {
                        department_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "date",
                            example: "2019-01-01"
                        },
                        to_date: {
                            type: "date",
                            example: "2020-12-12"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/authenticate": {
        "get": {
            tags: ["Zoho"],
            summary: "Authenticate user on zoho.",
            description: "Authenticate user on zoho.",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/access-token": {
        post: {
            tags: ["Zoho"],
            summary: "Get access token.",
            description: "Get access token.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Get access token.",
                required: true,
                schema: {
                    type: "object",
                    required: ["code", "name", "integration_id"],
                    properties: {
                        integration_id: {
                            type: "number",
                            example: '2'
                        },
                        code: {
                            type: "string",
                            example: 'fdfd'
                        },
                        name: {
                            type: "string",
                            example: 'Zoho Projects'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/regenarate-access-token": {
        "get": {
            tags: ["Zoho"],
            summary: "Regenarate access token.",
            description: "Regenarate access token.",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integration": {
        get: {
            tags: ["Zoho"],
            summary: "Integration details",
            description: "Integration details",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integration-data": {
        get: {
            tags: ["Zoho"],
            summary: "Integration Data",
            description: "Integration Data",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-integration": {
        delete: {
            tags: ["Zoho"],
            summary: "Delete integration data",
            description: "Delete integration data",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Delete integration data",
                required: true,
                schema: {
                    type: "object",
                    required: ["integration_data_id"],
                    properties: {
                        integration_data_id: {
                            type: "string",
                            example: '1000'
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/portals-sync": {
        get: {
            tags: ["Zoho"],
            summary: "Get portals.",
            description: "Get portals.",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    // "/integrations/zoho/user-sync": {
    //     get: {
    //         tags: ["Zoho"],
    //         summary: "Get portals.",
    //         description: "Get portals.",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    "/integrations/zoho/project-sync": {
        post: {
            tags: ["Zoho"],
            summary: "Project sync.",
            description: "Project sync.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Project sync.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id"],
                    properties: {
                        project_id: {
                            type: "string",
                            example: '1000'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/portals": {
        get: {
            tags: ["Zoho"],
            summary: "Integration details",
            description: "Integration details",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/projects-zoho": {
        post: {
            tags: ["Zoho"],
            summary: "Get projects.",
            description: "Get projects.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Get projects.",
                required: true,
                schema: {
                    type: "object",
                    required: ["integration_org_id"],
                    properties: {
                        integration_org_id: {
                            type: "string",
                            example: '1000'
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/project-user": {
        post: {
            tags: ["Zoho"],
            summary: "Get project users.",
            description: "Get projects.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Get project users.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: '1000'
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/add-user-project": {
        post: {
            tags: ["Zoho"],
            summary: "Add user to project.",
            description: "Add user to project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Add user to project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "email", "role"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        email: {
                            type: "string",
                            example: "basavaraj@gmail.com"
                        },
                        role: {
                            type: "string",
                            example: 'employee'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/remove-user-from-project": {
        delete: {
            tags: ["Zoho"],
            summary: "Remove user from project.",
            description: "Remove user from project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Remove user from project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "email", "role"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        user_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_user_id: {
                            type: "string",
                            example: '277'
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/overview-zoho": {
        post: {
            tags: ["Zoho"],
            summary: "Projects overview.",
            description: "Projects overview.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Projects overview.",
                required: true,
                schema: {
                    type: "object",
                    required: ["integration_org_id"],
                    properties: {
                        integration_org_id: {
                            type: "number",
                            example: '1000'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/issues": {
        post: {
            tags: ["Zoho"],
            summary: "Projects issues.",
            description: "Projects issues.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Projects issues.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id", "status"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: '1'
                        },
                        status: {
                            type: "number",
                            example: '1'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    // "/integrations/zoho/update-project": {
    //     put: {
    //         tags: ["Zoho"],
    //         summary: "Dlete project.",
    //         description: "Dlete project.",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "zohoData",
    //             description: "Dlete project.",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["access_token", "portal_id", "project_name", "project_id", "status"],
    //                 properties: {
    //                     access_token: { type: "string", example: '1000.57a30e163adbe4dcc516203cf66589dd.69d6615395e1983de609ba91ac11c3f5' },
    //                     portal_id: { type: "string", example: '1000' },
    //                     project_id: { type: "string", example: '111' },
    //                     project_name: { type: "string", example: 'archived' },
    //                     status: { type: "string", example: 'archived' }
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    "/integrations/zoho/tasks": {
        post: {
            tags: ["Zoho"],
            summary: "Get project tasks.",
            description: "Get project tasks.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Get project tasks.",
                required: true,
                schema: {
                    type: "object",
                    required: ["access_token", "portal_id", "project_id"],
                    properties: {
                        project_id: {
                            type: "string",
                            example: '111'
                        },
                        project_list_id: {
                            type: "string",
                            example: '111'
                        },
                        status: {
                            type: "string",
                            example: '111'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/due-task-issue": {
        post: {
            tags: ["Zoho"],
            summary: "Due tasks and Issue",
            description: "Due tasks and Issue",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Due tasks and Issue",
                required: true,
                schema: {
                    type: "object",
                    required: ["integration_org_id"],
                    properties: {
                        integration_org_id: {
                            type: "number",
                            example: '117'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/create-project": {
        post: {
            tags: ["Zoho"],
            summary: "Create project.",
            description: "Create project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Create project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_name", "description", "start_date", "end_date", "integration_org_id"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '1000'
                        },
                        integration_org_id: {
                            type: "number",
                            example: '1'
                        },
                        project_name: {
                            type: "string",
                            example: 'GrocBasket'
                        },
                        description: {
                            type: "string",
                            example: 'GrocBasket'
                        },
                        start_date: {
                            type: "string",
                            example: '03-15-2020'
                        },
                        end_date: {
                            type: "string",
                            example: '11-03-2020'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/delete-project": {
        delete: {
            tags: ["Zoho"],
            summary: "Delete project.",
            description: "Delete project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Delete project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '1000'
                        },
                        project_id: {
                            type: "number",
                            example: '123'
                        },
                        ext_project_id: {
                            type: "string",
                            example: 'GrocBasket'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/create-task-list": {
        post: {
            tags: ["Zoho"],
            summary: "Create tasklist of project.",
            description: "Create tasklist of project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Create tasklist.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "name"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        name: {
                            type: "string",
                            example: 'Project Management'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/delete-tasklist": {
        delete: {
            tags: ["Zoho"],
            summary: "Delete project tasklist.",
            description: "Delete project tasklist.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Delete project tasklist.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "task_list_id", "ext_list_id"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '1000'
                        },
                        project_id: {
                            type: "number",
                            example: '123'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '123'
                        },
                        task_list_id: {
                            type: "number",
                            example: '123'
                        },
                        ext_list_id: {
                            type: "string",
                            example: '1000'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/create-task": {
        post: {
            tags: ["Zoho"],
            summary: "Create task of project.",
            description: "Create task of project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Create task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "name"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        name: {
                            type: "string",
                            example: 'Project Management'
                        },
                        ext_user_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        user_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_list_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        project_list_id: {
                            type: "number",
                            example: '277'
                        },
                        start_date: {
                            type: "string",
                            example: '03-15-2020'
                        },
                        end_date: {
                            type: "string",
                            example: '03-16-2020'
                        },
                        duration: {
                            type: "number",
                            example: '6'
                        },
                        duration_type: {
                            type: "string",
                            example: ' days or hrs'
                        },
                        description: {
                            type: "string",
                            example: 'Project Management'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/update-task": {
        put: {
            tags: ["Zoho"],
            summary: "Update task of project.",
            description: "Update task of project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Update task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        name: {
                            type: "string",
                            example: 'Project Management'
                        },
                        ext_user_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        user_id: {
                            type: "number",
                            example: '277'
                        },
                        start_date: {
                            type: "string",
                            example: '03-15-2020'
                        },
                        end_date: {
                            type: "string",
                            example: '03-16-2020'
                        },
                        duration: {
                            type: "number",
                            example: '6'
                        },
                        duration_type: {
                            type: "string",
                            example: ' days or hrs'
                        },
                        description: {
                            type: "string",
                            example: 'Project Management'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/delete-task": {
        delete: {
            tags: ["Zoho"],
            summary: "Delete project task",
            description: "Delete project task.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Delete project task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "task_id", "ext_task_id"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '1000'
                        },
                        project_id: {
                            type: "number",
                            example: '123'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '123'
                        },
                        task_id: {
                            type: "number",
                            example: '123'
                        },
                        ext_task_id: {
                            type: "string",
                            example: '1000'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/create-bug": {
        post: {
            tags: ["Zoho"],
            summary: "Create bug of project.",
            description: "Create bug of project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Create bug.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "name"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '277'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        name: {
                            type: "string",
                            example: 'Project Management'
                        },
                        ext_assignee_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        assignee_user_id: {
                            type: "number",
                            example: '277'
                        },
                        description: {
                            type: "string",
                            example: 'Project Management'
                        },
                        due_date: {
                            type: "string",
                            example: '03-16-2020'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/integrations/zoho/delete-bug": {
        delete: {
            tags: ["Zoho"],
            summary: "Delete project issue",
            description: "Delete project issue.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "zohoData",
                description: "Delete project issue.",
                required: true,
                schema: {
                    type: "object",
                    required: ["ext_org_id", "project_id", "ext_project_id", "issue_id", "ext_issue_id"],
                    properties: {
                        ext_org_id: {
                            type: "string",
                            example: '708528408'
                        },
                        project_id: {
                            type: "number",
                            example: '299'
                        },
                        ext_project_id: {
                            type: "string",
                            example: '1557478000000038025'
                        },
                        issue_id: {
                            type: "number",
                            example: '123'
                        },
                        ext_issue_id: {
                            type: "string",
                            example: '1000'
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    // "/upload-profilepic-drive": {
    //     "post": {
    //         tags: ["User"],
    //         description: "Add user",
    //         consumes: ["multipart/form-data"],
    //         produces: ["application/json"],
    //         "parameters": [{
    //             in: "query",
    //             name: "user_id",
    //             type: "number",
    //             required: true,
    //         },
    //         {
    //             in: "formData",
    //             name: "image1",
    //             type: "file",
    //             required: false,
    //             description: "Upload profilePic."
    //         },
    //         {
    //             in: "formData",
    //             name: "image2",
    //             type: "file",
    //             required: false,
    //             description: "Upload profilePic."
    //         },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },
    "/upload-profilepic-drive": {
        "post": {
            tags: ["User"],
            description: "Add user",
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            "parameters": [{
                in: "query",
                name: "user_id",
                type: "number",
                required: true,
            },
            {
                in: "formData",
                name: "avatar",
                type: "file",
                required: false,
                description: "Upload profilePic."
            },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/working-hours": {
        post: {
            tags: ["User"],
            summary: "User Working Hours.",
            description: "User Working Hours.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "WorkingHoursData",
                description: "User Working Hours.",
                required: true,
                schema: {
                    type: "object",
                    required: ["admin_id", "to_date", "from_date"],
                    properties: {
                        department_id: {
                            type: "number",
                            example: 1
                        },
                        location_id: {
                            type: "number",
                            example: 1
                        },
                        user_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "date",
                            example: "2019-01-01"
                        },
                        to_date: {
                            type: "date",
                            example: "2020-12-12"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/create-organization": {
        post: {
            tags: ["Organization"],
            summary: "Craete Organization.",
            description: "Craete Organization.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "OrganizationData",
                description: "Craete Organization.",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "status"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Globussoft"
                        },
                        manager_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-organization": {
        post: {
            tags: ["Organization"],
            summary: "Get Organization.",
            description: "Get Organization.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "OrganizationData",
                description: "Get Organization.",
                required: true,
                schema: {
                    type: "object",
                    required: [""],
                    properties: {
                        organization_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-organization": {
        delete: {
            tags: ["Organization"],
            summary: "Delete Organization.",
            description: "Delete Organization.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "OrganizationData",
                description: "Delete Organization.",
                required: true,
                schema: {
                    type: "object",
                    required: ["organization_id"],
                    properties: {
                        organization_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-organization": {
        put: {
            tags: ["Organization"],
            summary: "Update Organization.",
            description: "Update Organization.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "OrganizationData",
                description: "Update Organization.",
                required: true,
                schema: {
                    type: "object",
                    required: ["organization_id",],
                    properties: {
                        organization_id: {
                            type: "number",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "gs"
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "0-Inactive 1-Active"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    // "/project-management/create-internal-projects": {
    //     post: {
    //         tags: ["Project"],
    //         summary: "Craete Project.",
    //         description: "Craete Project.",
    //         consumes: ["application/json"],
    //         produces: ["application/json"],
    //         parameters: [{
    //             in: "body",
    //             name: "ProjectData",
    //             description: "Craete Project.",
    //             required: true,
    //             schema: {
    //                 type: "object",
    //                 required: ["name", "start_date", "end_date"],
    //                 properties: {
    //                     name: {
    //                         type: "string",
    //                         example: "EMP Monitor"
    //                     },
    //                     description: {
    //                         type: "string",
    //                         example: "discription"
    //                     },
    //                     start_date: {
    //                         type: "date",
    //                         example: "2020-02-17"
    //                     },
    //                     end_date: {
    //                         type: "date",
    //                         example: "2020-02-17"
    //                     },
    // manager_id: {
    //     type: "array",
    //     example: [1,2 ]
    // },
    // organization_id: {
    //     type: "number",
    //     example: 1
    // },
    // role_id: {
    //     type: "number",
    //     example: 1
    // },
    //                 }
    //             }
    //         }],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    "/project-management/get-project": {
        post: {
            tags: ["Project"],
            summary: "Get project.",
            description: "Get project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "projectData",
                description: "Get project.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-internal-project": {
        put: {
            tags: ["Project"],
            summary: "Update Project.",
            description: "Update Project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Update Project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id",],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "gs"
                        },
                        description: {
                            type: "string",
                            example: "discription"
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "1-In Progress 2-Hold 3-Completed"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-05-17"
                        },
                        progress: {
                            type: "number",
                            example: 25,
                            description: "0-100%"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-project": {
        delete: {
            tags: ["Project"],
            summary: "Delete Project.",
            description: "Delete Project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Delete Project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/create-project-module": {
        post: {
            tags: ["Project"],
            summary: "Craete Project Module.",
            description: "Craete Project Module.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Craete Project Module.",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "type", "projrct_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "module"
                        },
                        project_id: {
                            type: "number",
                            example: 3
                        },
                        start_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-project-module": {
        post: {
            tags: ["Project"],
            summary: "Get Project Module.",
            description: "Get Project Module.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Get Project Module.",
                required: true,
                schema: {
                    type: "object",
                    required: ["module_id", "projrct_id"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 3
                        },
                        module_id: {
                            type: "number",
                            example: 3
                        },
                        status: {
                            type: "number",
                            example: 3
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-project-module": {
        put: {
            tags: ["Project"],
            summary: "Update Project Module.",
            description: "Update Project Module.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Update Project Module.",
                required: true,
                schema: {
                    type: "object",
                    required: ["module_id", "projrct_id", "name", "status"],
                    properties: {
                        module_id: {
                            type: "number",
                            example: 3
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "1-In Progress 2-Hold 3-Completed"
                        },
                        name: {
                            type: "string",
                            example: "Projectmodule"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-project-module": {
        delete: {
            tags: ["Project"],
            summary: "Delete Project Module.",
            description: "Delete Project Module.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Delete Project Module.",
                required: true,
                schema: {
                    type: "object",
                    required: ["module_ids", "projrct_id"],
                    properties: {
                        module_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/create-todo": {
        post: {
            tags: ["Todo"],
            summary: "Craete Todo.",
            description: "Craete Todo.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TodoData",
                description: "Craete Todo.",
                required: true,
                schema: {
                    type: "object",
                    module_id: {
                        type: "number",
                        example: 1
                    },
                    required: ["name", "start_date", "end_date", "status", "module_id", "project_id", "assigned_user_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "todo"
                        },
                        description: {
                            type: "string",
                            example: "todo"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-02-17 00:00:00"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-02-17 00:00:00"
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        module_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "1-In Progress 2-Hold 3-Completed"
                        },
                        progress: {
                            type: "number",
                            example: 10
                        },
                        assigned_user_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-todo": {
        post: {
            tags: ["Todo"],
            summary: "Fetch Todo.",
            description: "Fetch Todo.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TodoData",
                description: "Fetch Todo.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        todo_id: {
                            type: "number",
                            example: 1
                        },
                        module_id: {
                            type: "number",
                            example: 1
                        },
                        user_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-todo": {
        delete: {
            tags: ["Todo"],
            summary: "Delete Todo.",
            description: "Delete Todo.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TodoData",
                description: "Delete Todo.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        todo_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-todo": {
        put: {
            tags: ["Todo"],
            summary: "Update Todo.",
            description: "Update Todo.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TodoData",
                description: "Update Todo.",
                required: true,
                schema: {
                    type: "object",
                    required: ["todo_id"],
                    properties: {
                        todo_id: {
                            type: "number",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "todo"
                        },
                        description: {
                            type: "string",
                            example: "todo"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-02-17 00:00:00"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-02-17 00:00:00"
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "1-In Progress 2-Hold 3-Completed"
                        },
                        progress: {
                            type: "number",
                            example: 1
                        },
                        assigned_user_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/create-team": {
        post: {
            tags: ["Team"],
            summary: "Craete Team.",
            description: "Craete Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Craete Team.",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "status"],
                    properties: {
                        name: {
                            type: "string",
                            example: "team1"
                        },
                        description: {
                            type: "string",
                            example: "team1"
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "1-Active 2-Free"
                        },

                        user_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },

                        team_lead_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-team": {
        post: {
            tags: ["Team"],
            summary: "Get Teams.",
            description: "Get Teams.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Get Team.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-team": {
        put: {
            tags: ["Team"],
            summary: "Update Team.",
            description: "Update Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Update Team",
                required: true,
                schema: {
                    type: "object",
                    required: ["team_id"],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "team1"
                        },
                        description: {
                            type: "string",
                            example: "team1"
                        },
                        manager_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1,
                            description: "1-Active 2-Free"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-team": {
        delete: {
            tags: ["Team"],
            summary: "Delete Team.",
            description: "Delete Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Delete Team",
                required: true,
                schema: {
                    type: "object",
                    required: ["team_id"],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/add-users-to-team": {
        post: {
            tags: ["Team"],
            summary: "Add Users Team.",
            description: "Add Users Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Add Users Team.",
                required: true,
                schema: {
                    type: "object",
                    required: ["team_id", "role_id", "user_ids"],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },
                        user_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        role_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-users-team": {
        post: {
            tags: ["Team"],
            summary: "Get Users Team.",
            description: "Get Users Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Get Users Team.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-users-from-team": {
        delete: {
            tags: ["Team"],
            summary: "Delete Users From Team.",
            description: "Delete Users From Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Delete Users From Team.",
                required: true,
                schema: {
                    type: "object",
                    required: ["team_id"],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },
                        user_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-users-from-team": {
        put: {
            tags: ["Team"],
            summary: "Update Users From Team.",
            description: "Update Users From Team.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamData",
                description: "Update Users From Team.",
                required: true,
                schema: {
                    type: "object",
                    required: ["team_id", "user_id"],
                    properties: {
                        team_id: {
                            type: "number",
                            example: 1
                        },
                        user_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example: 1
                        },
                        reason: {
                            type: "string",
                            example: "reason"
                        },
                        role_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/add-team-to-project": {
        post: {
            tags: ["Team"],
            summary: "Add Team To Project.",
            description: "Add Team To Project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamProjectData",
                description: "Add Team To Project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["team_ids", "project_id"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        team_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-team-from-project": {
        post: {
            tags: ["Team"],
            summary: "Get Team From Project.",
            description: "Get Team From Project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamProjectData",
                description: "Get Team From Project.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-team-from-project": {
        delete: {
            tags: ["Team"],
            summary: "Delete Team From Project.",
            description: "Delete Team From Project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TeamProjectData",
                description: "Delete Team From Project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id", "team_ids"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        team_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/create-timesheet": {
        post: {
            tags: ["Timesheet"],
            summary: "Create Timesheet.",
            description: "Create Timesheet",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TimesheetData",
                description: "Create Timesheet.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id", "todo_id", "user_id", "reason", "note", "start_time", , "end_time"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        todo_id: {
                            type: "number",
                            example: 1
                        },
                        user_id: {
                            type: "number",
                            example: 1
                        },
                        reason: {
                            type: "string",
                            example: "reason"
                        },
                        note: {
                            type: "string",
                            example: "note"
                        },
                        start_time: {
                            type: "string",
                            example: "2020-02-25 01:45:45"
                        },
                        end_time: {
                            type: "string",
                            example: "2020-02-26 01:45:45"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-timesheet": {
        post: {
            tags: ["Timesheet"],
            summary: "Get Timesheet.",
            description: "Get Timesheet",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TimesheetData",
                description: "Get Timesheet.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {
                        user_id: {
                            type: "number",
                            example: 1
                        },

                        timesheet_id: {
                            type: "number",
                            example: 1
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "date",
                            example: "2020-01-01"
                        },
                        to_date: {
                            type: "date",
                            example: "2020-05-01"
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-timesheet": {
        put: {
            tags: ["Timesheet"],
            summary: "Update Timesheet.",
            description: "Update Timesheet",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TimesheetData",
                description: "Update Timesheet.",
                required: true,
                schema: {
                    type: "object",
                    required: ["timesheet_id"],
                    properties: {
                        timesheet_id: {
                            type: "number",
                            example: 1
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        todo_id: {
                            type: "number",
                            example: 1
                        },
                        user_id: {
                            type: "number",
                            example: 1
                        },
                        reason: {
                            type: "string",
                            example: "reason"
                        },
                        note: {
                            type: "string",
                            example: "note"
                        },
                        start_time: {
                            type: "string",
                            example: "2020-02-25 01:45:45"
                        },
                        end_time: {
                            type: "string",
                            example: "2020-02-26 01:45:45"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-timesheet": {
        delete: {
            tags: ["Timesheet"],
            summary: "Delete Timesheet.",
            description: "Delete Timesheet",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TimesheetData",
                description: "Delete Timesheet.",
                required: true,
                schema: {
                    type: "object",
                    required: ["timesheet_id"],
                    properties: {
                        timesheet_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/apps-activity-track": {
        post: {
            tags: ["User"],
            summary: "Get top application details",
            description: "Get top application details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get top application details",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "2020-03-11"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/browser-activity-track": {
        post: {
            tags: ["User"],
            summary: "Get Browser Activity",
            description: "Get Browser Activity",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Get Browser Activity",
                required: true,
                schema: {
                    type: "object",
                    required: ["user_id", "date", "skip", "limit"],
                    properties: {
                        user_id: {
                            type: "number",
                            example: "1"
                        },
                        date: {
                            type: "string",
                            example: "2020-03-11"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-reseller-data": {
        "post": {
            tags: ["Reseller"],
            description: "Add user",
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            "parameters": [

                {
                    in: "query",
                    name: "title",
                    type: "string",
                    required: "true",

                },
                {
                    in: "query",
                    name: "brand",
                    type: "string",
                    required: "true"
                },
                {
                    in: "formData",
                    name: "logo",
                    type: "file",
                    required: false,
                    description: "Upload logo"
                },
                {
                    in: "formData",
                    name: "favicon",
                    type: "file",
                    required: false,
                    description: "Upload favicon."
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-reseller-data": {
        get: {
            tags: ["Reseller"],
            description: "This Will Get Reseller Data.",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/create-internal-projects-team": {
        post: {
            tags: ["Project"],
            summary: "Craete Project.",
            description: "Craete Project.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Craete Project.",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "start_date", "end_date"],
                    properties: {
                        name: {
                            type: "string",
                            example: "EMP Monitor"
                        },
                        description: {
                            type: "string",
                            example: "discription"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-02-17"
                        },
                        manager_id: {
                            type: "array",
                            example: [1, 2]
                        },
                        role_id: {
                            type: "number",
                            example: 1
                        },

                        team_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        members_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        members_role_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/get-project-members/{project_id}": {
        get: {
            tags: ["Project"],
            description: "Get projects.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "path",
                name: "project_id",
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
    "/download-user-report-multiple-users": {
        post: {
            tags: ["Report"],
            summary: "Download user report",
            description: "Download user report ",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Employee Report",
                description: `from_date_utc('YYYY-MM-DD HH:mm:ss') to_date_utc('YYYY-MM-DD HH:mm:ss') from_date('YYYY-MM-DD')  to_date('YYYY-MM-DD')`,
                required: false,
                schema: {
                    type: "object",
                    required: ["day", "user_id", "downloadOption",],
                    properties: {
                        user_id: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        downloadOption: {
                            type: "number",
                            example: "1"
                        },
                        from_date_utc: {
                            type: "string",
                            example: "2020-05-03 18:30:00"
                        },
                        to_date_utc: {
                            type: "string",
                            example: "2020-05-03 18:29:59"
                        },
                        from_date: {
                            type: "string",
                            example: "2020-05-03"
                        },
                        to_date: {
                            type: "string",
                            example: "2020-05-03"
                        },
                        limit: {
                            type: "number",
                            example: "10"
                        },
                        skip: {
                            type: "number",
                            example: "0"
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/add-project-members": {
        post: {
            tags: ["Project"],
            summary: "Add Project Members.",
            description: "Add Project Members",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Add Project Members",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id", "members_ids", "role_id"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        members_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        role_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/delete-project-members": {
        delete: {
            tags: ["Project"],
            summary: "Delete Project Members.",
            description: "Delete Project Members.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Delete Project Members.",
                required: true,
                schema: {
                    type: "object",
                    required: ["members_ids", "projrct_id"],
                    properties: {
                        members_ids: {
                            type: "array",
                            example: [1, 2, 3]
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/project-management/update-project-members": {
        put: {
            tags: ["Project"],
            summary: "Update Project Members.",
            description: "Delete Project Members.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Update Project Members.",
                required: true,
                schema: {
                    type: "object",
                    required: ["member_id", "projrct_id", "role_id"],
                    properties: {
                        member_id: {
                            type: "number",
                            example: 1
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        role_id: {
                            type: "number",
                            example: 1
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/timesheet/user-attendance": {
        post: {
            tags: ["Timesheet"],
            summary: "Get all user logs based on filters",
            description: "Get all users from attendance to timesheet breakup.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "userData",
                description: "Parameters for getting data",
                required: true,
                schema: {
                    type: "object",
                    required: true,
                    properties: {
                        location_id: {
                            type: "number",
                            example: 1,
                            default: 0
                        },
                        department_id: {
                            type: "number",
                            example: 1,
                            default: 0
                        },
                        user_id: {
                            type: "number",
                            example: 1,
                            default: 0
                        },
                        start_date: {
                            type: "string",
                            example: new Date().toISOString()
                        },
                        end_date: {
                            type: "number",
                            example: new Date().toISOString()
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/timesheet/user-timesheet-details": {
        post: {
            tags: ["Timesheet"],
            summary: "Get all data for a user's timesheet",
            description: "Timesheet breakup details",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "attnData",
                description: "Parameters for getting data",
                required: true,
                schema: {
                    type: "object",
                    required: true,
                    properties: {
                        attendance_id: {
                            type: "number",
                            example: 1,
                            default: 0
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/settings/user-tracking-setting": {
        post: {
            tags: ["Settings"],
            summary: "Update user tracking setting",
            description: "Update user tracking setting",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "settData",
                description: "Parameters for getting data",
                required: true,
                schema: {
                    type: "object",
                    required: true,
                    properties: {
                        employee_id: { type: "number", example: 1 },
                        track_data: {
                            type: "string",
                            example: {
                                system: {
                                    type: 'personal',
                                    visibility: false,
                                    info: { type: 'personal or computer', visibility: 'true-visible mode , false-stealth mode' }
                                },
                                screenshot: {
                                    frequencyPerHour: 30,
                                    employeeAccessibility: false,
                                    employeeCanDelete: false
                                },
                                breakInMinute: 30,
                                idleInMinute: 2,
                                trackingMode: 'unlimited',
                                tracking: {
                                    unlimited: {
                                        day: '1,2,3,4,5,6,7',
                                        info: { day: '1-monday,7-sunday', time: 'all day' }
                                    },
                                    fixed: {
                                        mon: {
                                            status: true,
                                            time: { start: '10:00', end: '19:00' }
                                        },
                                        tue: {
                                            status: true,
                                            time: { start: '10:00', end: '19:00' }
                                        },
                                        wed: {
                                            status: false,
                                            time: { start: '10:00', end: '19:00' }
                                        },
                                        thu: {
                                            status: true,
                                            time: { start: '10:00', end: '19:00' }
                                        },
                                        fri: {
                                            status: true,
                                            time: { start: '10:00', end: '19:00' }
                                        },
                                        sat: {
                                            status: true,
                                            time: { start: '10:00', end: '15:00' }
                                        },
                                        sun: {
                                            status: false,
                                            time: { start: '10:00', end: '19:00' }
                                        },
                                        info: { day: '1-monday,7-sunday', time: 'fixed, else dont track', status: 'true means track else no tracking that day' }

                                    },
                                    networkBased: {
                                        networkName: 'Globussoft',
                                        networkMac: '00-14-22-01-23-45',
                                        info: {
                                            other: 'only track when system in on particular network',
                                        }
                                    },
                                    manual: {
                                        info: {
                                            other: 'when user will start tracking clock-in and stops when clock-out',
                                        }
                                    },
                                    projectBased: {
                                        info: {
                                            other: 'when user will start working on a project',
                                        }
                                    }
                                },
                                task: {
                                    employeeCanCreateTask: true,
                                    info: {
                                        employeeCanCreateTask: 'either true or false',
                                    }
                                }
                            }
                        }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/settings/get-emp-setting-trac": {
        post: {
            tags: ["Settings"],
            summary: "Get user tracking setting",
            description: "Get user tracking setting",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "settData",
                description: "Parameters for getting data",
                required: true,
                schema: {
                    type: "object",
                    required: true,
                    properties: {
                        employee_id: { type: "number", example: 1 }
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },


    // "/upload-category-domains": {
    //     "post": {
    //         tags: ["Firewall"],
    //         description: "Upload domain",
    //         consumes: ["multipart/form-data"],
    //         produces: ["application/json"],
    //         "parameters": [
    //         {
    //             in: "formData",
    //             name: "file",
    //             type: "file",
    //             required: true,
    //             description: "Upload category domain."
    //         },
    //         ],
    //         responses: swaggerHelpers.responseObject,
    //         security: securityObject
    //     }
    // },

    "/upload-category-domains": {
        "post": {
            tags: ["Firewall"],
            description: "Upload domain",
            consumes: ["multipart/form-data"],
            produces: ["application/json"],
            "parameters": [
                {
                    in: "formData",
                    name: "file",
                    type: "file",
                    required: true,
                    description: "Upload domain."
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
};