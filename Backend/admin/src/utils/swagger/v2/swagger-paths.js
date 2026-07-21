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
    "/add-project": {
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
                            example: "2020-05-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-06-17"
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
    "/update-project": {
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
                    required: ["project_id"],
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
                            example: "2020-05-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-06-17"
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        status: {
                            type: "number",
                            example:1
                        },
                 
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-project": {
        post: {
            tags: ["Project"],
            summary: "Get Projects.",
            description: "Get Projects.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Get Projects.",
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
                            type: "numer",
                            example: 1
                        },
                 
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-project": {
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
                    required: ["project_ids"],
                    properties: {

                        project_ids: {
                            type: "array",
                            example: [1,2]
                        },
                                   
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-project-module": {
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
                    required: ["name", "start_date", "end_date","project_id"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Reports"
                        },
                        description: {
                            type: "string",
                            example: "discription"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-05-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-06-17"
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

    "/get-project-module": {
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
                    required: ["project_id"],
                    properties: {
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
                            example: 1
                        },
                
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/update-project-module": {
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
                    required: ["module_id"],
                    properties: {
                        module_id: {
                            type: "number",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "module"
                        },
                        status: {
                            type: "number",
                            example: 1
                        },
                        start_date: {
                            type: "date",
                            example: "2020-05-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-06-17"
                        },
                
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-project-module": {
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
                    required: ["module_ids"],
                    properties: {
                        module_ids: {
                            type: "array",
                            example: [1,2,3]
                        },
               
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/get-project-members": {
        post: {
            tags: ["Project"],
            summary: "Get Project Members.",
            description: "Get Project Members.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Get Project Members.",
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

    "/add-task": {
        post: {
            tags: ["Task"],
            summary: " Create Task.",
            description: "Create Task.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TaskData",
                description: "Create Task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["name", "start_date", "end_date","project_id","module_id","empoyee_id","priority"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Task"
                        },
                        description: {
                            type: "string",
                            example: "discription"
                        },
                        start_date: {
                            type: "date",
                            example: "2020-05-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-06-17"
                        },
                        due_date: {
                            type: "date",
                            example: "2020-06-17"
                        },
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        module_id: {
                            type: "number",
                            example: 1
                        },
                        employee_id: {
                            type: "number",
                            example: 1
                        },
                        priority: {
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
    "/get-task": {
        post: {
            tags: ["Task"],
            summary: " Get Task.",
            description: "Get Task.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TaskData",
                description: "Get Task.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {

                        project_id: {
                            type: "number",
                            example: 1
                        },
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
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    "/update-task": {
        put: {
            tags: ["Task"],
            summary: " Update Task.",
            description: "Update Task.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TaskData",
                description: "Update Task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["task_id"],
                    properties: {

                        task_id: {
                            type: "number",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "task"
                        },
                        status: {
                            type: "number",
                            example: 1
                        },
                        start_date: {
                            type: "date",
                            example: "2020-05-17"
                        },
                        end_date: {
                            type: "date",
                            example: "2020-06-17"
                        },


                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-task": {
        delete: {
            tags: ["Task"],
            summary: " Delete Task.",
            description: "Delete Task.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TaskData",
                description: "Delete Task.",
                required: true,
                schema: {
                    type: "object",
                    required: ["task_ids"],
                    properties: {
                        task_ids: {
                            type: "array",
                            example: [1,2,3]
                        },
                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    "/get-timesheets": {
        post: {
            tags: ["Timesheet"],
            summary: " Get Timesheet.",
            description: "Get Timesheet.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TaskData",
                description: "Get Timesheet.",
                required: true,
                schema: {
                    type: "object",
                    required: [],
                    properties: {

                        project_id: {
                            type: "number",
                            example: 1
                        },
                        employee_id: {
                            type: "number",
                            example: 1
                        },
                        from_date: {
                            type: "date",
                            example: "2020-05-17"
                        },
                        to_date: {
                            type: "date",
                            example: "2020-06-17"
                        },

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },

    "/delete-timesheet": {
        delete: {
            tags: ["Timesheet"],
            summary: " Delete Timesheet.",
            description: "Delete Timesheet.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "TaskData",
                description: "Delete Timesheet.",
                required: true,
                schema: {
                    type: "object",
                    required: ["timesheet_ids"],
                    properties: {

                        timesheet_ids: {
                            type: "array",
                            example: [1,2,3]
                        },


                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/add-project-employees": {
        post: {
            tags: ["Project"],
            summary: "Add Project Employee.",
            description: "Add Project Employee.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Add Project Employee.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id","user_ids"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        user_ids: {
                            type: "array",
                            example: [1,2,3]
                        },

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
    "/delete-project-employees": {
        delete: {
            tags: ["Project"],
            summary: "Delete Project Employee.",
            description: "Delete Project Employee.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "ProjectData",
                description: "Delete Project Employee.",
                required: true,
                schema: {
                    type: "object",
                    required: ["project_id","user_ids"],
                    properties: {
                        project_id: {
                            type: "number",
                            example: 1
                        },
                        user_ids: {
                            type: "array",
                            example: [1,2,3]
                        },

                    }
                }
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject
        }
    },
};