const moment = require('moment');
const swaggerHelpers = require('./swagger-helpers');
const schemas = require('./swagger-schemas');

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
    '/auth/user': {
        post: {
            tags: ['Auth'],
            summary: 'Employee/Manager login ',
            description: 'Login to the portal',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Employee signin ',
                    description: 'Employee/Manager Signin ',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email', 'password', 'ip'],
                        properties: {
                            email: { type: 'string', example: 'email' },
                            password: { type: 'string', example: 'password@123' },
                            language: { type: 'string', example: 'en' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/send-otp': {
        post: {
            tags: ['Auth'],
            summary: 'Employee/Manager forgot password send otp',
            description: 'Employee/Manager forgot password send otp',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Employee/Manager forgot password send otp',
                    description: 'Employee/Manager forgot password send otp',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email'],
                        properties: {
                            email: { type: 'string', example: 'user@mail.com' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/validate-otp': {
        post: {
            tags: ['Auth'],
            summary: 'Employee/Manager validate otp',
            description: 'Employee/Manager validate otp',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Employee/Manager validate otp',
                    description: 'Employee/Manager validate otp',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['email', 'otp'],
                        properties: {
                            email: { type: 'string', example: 'user@mail.com' },
                            otp: { type: 'string', example: '1254' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
        },
    },
    '/auth/update-password': {
        post: {
            tags: ['Auth'],
            summary: 'Employee/Manager update password',
            description: 'Employee/Manager update password',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Employee/Manager update password',
                    description: 'Employee/Manager update password',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['password', 'confirm_password'],
                        properties: {
                            password: { type: 'string', example: '********' },
                            confirm_password: { type: 'string', example: '********' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/auth/logout': {
        get: {
            tags: ['Auth'],
            summary: 'Employee/Manager logout',
            description: 'Employee/Manager logout',
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/admin-dashboard/create-project': {
        post: {
            tags: ['Dashboard-Project'],
            summary: 'Create new project',
            description: 'Create new project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Create new project',
                    description: 'Create new project',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            description: { type: 'string', example: 'description' },
                            assigned_non_admin_users: { type: 'array', example: [123,125] },
                            assigned_users: { type: 'array', example: [123,125] },
                            start_date: { type: 'date', example: "2024-05-23" },
                            end_date: { type: 'date', example: "2024-05-23" },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/update-project': {
        put: {
            tags: ['Dashboard-Project'],
            summary: 'Update project',
            description: 'Update project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Update project',
                    description: 'Update project',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description', '_id'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            description: { type: 'string', example: 'description' },
                            _id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            assigned_non_admin_users: { type: 'array', example: [123,125] },
                            assigned_users: { type: 'array', example: [123,125] },
                            start_date: { type: 'date', example: "2024-05-23" },
                            end_date: { type: 'date', example: "2024-05-23" },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/delete-project': {
        delete: {
            tags: ['Dashboard-Project'],
            summary: 'Delete project',
            description: 'Delete project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Delete project',
                    description: 'Delete project',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            _id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project': {
        get: {
            tags: ['Dashboard-Project'],
            summary: 'Fetch project',
            description: 'Fetch project',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'number', example: "Task" },  
                },
                {
                    in: 'query',
                    name: 'sort',
                    schema: { type: 'number', example: "ASC" },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/assign-employee-project': {
        post: {
            tags: ['Dashboard-Project'],
            summary: 'Assign an employee to project',
            description: 'Assign an employee to project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Assign an employee to project',
                    description: 'Assign an employee to project',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id', 'employee_id'],
                        properties: {
                            _id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            employee_id: { type: 'number', example: 28854 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/remove-employee-project': {
        post: {
            tags: ['Dashboard-Project'],
            summary: 'Remove assigned employee from project',
            description: 'Remove assigned employee from project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Remove assigned employee from project',
                    description: 'Remove assigned employee from project',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id', 'employee_id'],
                        properties: {
                            _id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            employee_id: { type: 'number', example: 28854 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/view-project-assigned-employee': {
        get: {
            tags: ['Dashboard-Project'],
            summary: 'Remove assigned employee from project',
            description: 'Remove assigned employee from project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: '_id',
                    schema: { type: 'string', example: '66337f6542dcea3f5cf665ef' },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project-mobile': {
        get: {
            tags: ['Mobile-Project'],
            summary: 'Fetch project mobile',
            description: 'Fetch project mobile',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'number', example: "Task" },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/admin-dashboard/create-project-folder': {
        post: {
            tags: ['Dashboard-Project-Folder'],
            summary: 'Create a folder inside of the project',
            description: 'Create a folder inside of the project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Create a folder inside of the project',
                    description: 'Create a folder inside of the project',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            project_id: { type: 'string', example: '66347b2c2831ce38bc09216b' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/update-project-folder': {
        put: {
            tags: ['Dashboard-Project-Folder'],
            summary: 'Update project folder',
            description: 'Update project folder',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Update project folder',
                    description: 'Update project folder',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description', '_id'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            project_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            _id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/delete-project-folder': {
        delete: {
            tags: ['Dashboard-Project-Folder'],
            summary: 'Delete project folder',
            description: 'Delete project folder',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Delete project folder',
                    description: 'Delete project folder',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            _id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project-folder': {
        get: {
            tags: ['Dashboard-Project-Folder'],
            summary: 'Fetch folder in project',
            description: 'Fetch folder in project',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: "Task" },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/admin-dashboard/fetch-project-folder-mobile': {
        get: {
            tags: ['Mobile-Project-Folder'],
            summary: 'Fetch folder in project',
            description: 'Fetch folder in project',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: "Task" },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/admin-dashboard/create-project-task': {
        post: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Create a task inside of the project & folder',
            description: 'Create a task inside of the project & folder',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Create a task inside of the project & folder',
                    description: 'Create a task inside of the project & folder',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            project_id: { type: 'string', example: '66347b2c2831ce38bc09216b' },
                            folder_id: { type: 'string', example: '66347b2c2831ce38bc09216b' },
                            employee_id: { type: 'number', example: 28888 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/update-project-task': {
        put: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Update task for project & folder',
            description: 'Update task for project & folder',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Update task for project & folder',
                    description: 'Update task for project & folder',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description', '_id'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            project_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            folder_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            task_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/delete-project-task': {
        delete: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Delete project task',
            description: 'Delete project task',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: '_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/assign-employee-task': {
        post: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Assign employees to task',
            description: 'Assign employees to task',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Dashboard-Project-Task',
                    description: 'Dashboard-Project-Task',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            task_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            employee_id: { type: 'number', example: 1478 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/remove-assign-employee-task': {
        post: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Remove assign employees to task',
            description: 'Remove assign employees to task',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Remove assign employees to task',
                    description: 'Remove assign employees to task',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            task_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            employee_id: { type: 'number', example: 1478 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/task-assign-to-employee': {
        post: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Fetch employee detail assigned to a task',
            description: 'Fetch employee detail assigned to a task',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Fetch employee detail assigned to a task',
                    description: 'Fetch employee detail assigned to a task',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            task_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project-task': {
        get: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Fetch task in folder project',
            description: 'Fetch task in folder project',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: "Task" },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
                {
                    in: 'query',
                    name: 'folder_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
                {
                    in: "query",
                    name: "assigned_non_admin_users",
                    schema: { type: 'number', example: 28888 }, 
                },
                {
                    in: "query",
                    name: "assigned_users",
                    schema: { type: 'number', example: 29875 }, 
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-task-list': {
        get: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Fetch task list in folder project',
            description: 'Fetch task list in folder project',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                   in: 'query',
                   name: 'search',
                   schema: { type: 'string', example: "Task" },  
               },
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 3214 },  
                },
                {
                    in: 'query',
                    name: 'manager_id',
                    schema: { type: 'number', example: 1234 },  
                },
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'folder_id',
                    schema: { type: 'string', example: "6655707a54e2a32bdcc46700" },  
                },
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-task-list-download': {
        get: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Fetch task list in folder project',
            description: 'Fetch task list in folder project',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                   in: 'query',
                   name: 'search',
                   schema: { type: 'string', example: "Task" },  
               },
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 3214 },  
                },
                {
                    in: 'query',
                    name: 'manager_id',
                    schema: { type: 'number', example: 1234 },  
                },
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'folder_id',
                    schema: { type: 'string', example: "6655707a54e2a32bdcc46700" },  
                },
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project-details': {
        get: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Fetch project details',
            description: 'Fetch project details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [ 
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                } 
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/admin-dashboard/create-project-task-mobile': {
        post: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Create a task inside of the project & folder for mobile applications',
            description: 'Create a task inside of the project & folder for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Create a task inside of the project & folder for mobile applications',
                    description: 'Create a task inside of the project & folder for mobile applications',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            project_id: { type: 'string', example: '66347b2c2831ce38bc09216b' },
                            folder_name: { type: 'string', example: 'Finished Task' },
                            is_start: { type: 'boolean', default: false }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/update-project-task-mobile': {
        put: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Update task for project & folder for mobile applications',
            description: 'Update task for project & folder for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Update task for project & folder for mobile applications',
                    description: 'Update task for project & folder for mobile applications',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description', '_id'],
                        properties: {
                            title: { type: 'string', example: 'title' },
                            project_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            folder_name: { type: 'string', example: 'Finished Task' },
                            task_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            is_start: { type: 'boolean', default: false }
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/delete-project-task-mobile': {
        delete: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Delete project task for mobile applications',
            description: 'Delete project task for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [ 
                {
                    in: 'query',
                    name: '_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                } 
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/delete-project-task-multiple-mobile': {
        post: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Delete project task for mobile applications',
            description: 'Delete project task for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [ 
                {
                    in: 'body',
                    name: 'Delete project task multiple',
                    description: 'Delete project task multiple',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            _ids: { type: 'array', example: ['66b082d684c5560578e6a5e1', '66b082d384c5560578e6a5dc', '66b082cf84c5560578e6a5d7', '66b082cc84c5560578e6a5d2', '66b082c884c5560578e6a5cd', '66a9de30d62abf449c874236'] },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project-task-mobile': {
        get: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Fetch task in folder project  for mobile applications',
            description: 'Fetch task in folder project for mobile applications',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: "Task" },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
                {
                    in: 'query',
                    name: 'folder_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/fetch-project-task-mobile-list': {
        get: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Fetch task list in folder project mobile',
            description: 'Fetch task list in folder project mobile',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                   in: 'query',
                   name: 'search',
                   schema: { type: 'string', example: "Task" },  
                },
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'folder_name',
                    schema: { type: 'string', example: "6655707a54e2a32bdcc46700" },  
                },
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                },
                {
                    in: 'query',
                    name: 'sort_by',
                    schema: { type: 'string', example: 'ASC', description: "Must be ASC or DESC" },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/start-project-task-mobile': {
        get: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Start task in folder project  for mobile applications',
            description: 'Start task in folder project for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/stop-project-task-mobile': {
        get: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Stop task in folder project  for mobile applications',
            description: 'Stop task in folder project for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/finish-project-task-mobile': {
        get: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Finish task in folder project  for mobile applications',
            description: 'Finish task in folder project for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: "66337f6542dcea3f5cf665ef" },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/finish-project-task-multiple-mobile': {
        post: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Finish task in folder project  for mobile applications',
            description: 'Finish task in folder project for mobile applications',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Finish task multiple',
                    description: 'Finish task multiple',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            _ids: { type: 'array', example: ['639aecedbd505a72be57ec86'] },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/add-task-reminder': {
        post: {
            tags: ['Dashboard-Project-Task-Mobile'],
            summary: 'Add task reminder time',
            description: 'Add task reminder time',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Delete project task for mobile applications',
                    description: 'Delete project task for mobile applications',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['_id'],
                        properties: {
                            task_id: { type: 'string', example: '639aecedbd505a72be57ec86' },
                            remaining_time: { type: 'number', example: 10 },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/admin-dashboard/get-dashboard-stats': {
        get: {
            tags: ['Mobile-Dashboard-Stats'],
            summary: 'API to fetch all stats for employee',
            description: 'API to fetch all stats for employee',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/admin-dashboard/get-assigned-user-status': {
        get: {
            tags: ['Mobile-Teams'],
            summary: 'APi to check if any employee is assigned or not',
            description: 'APi to check if any employee is assigned or not',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/get-assigned-user-list': {
        get: {
            tags: ['Mobile-Teams'],
            summary: 'APi to get all assigned employees',
            description: 'APi to get all assigned employees',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
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
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string', example: "employee" },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/admin-dashboard/get-assigned-dashboard-stats': {
        get: {
            tags: ['Mobile-Teams'],
            summary: 'Get assigned employee dashboard stats',
            description: 'Get assigned employee dashboard stats',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'string', example: "25566" },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/geo-location/get-geo-log': {
        post: {
            tags: ['GeoLocation-Dashboard'],
            summary: 'Get Employee GeoLocation Logs',
            description: 'Get Employee GeoLocation Logs',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Get Employee GeoLocation Logs',
                    description: 'Get Employee GeoLocation Logs',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description', '_id'],
                        properties: {
                            employee_id: { type: 'number', example: '28881' },
                            start_date: { type: 'string', example: '2024-05-16' },
                            end_date: { type: 'string', example: '2024-05-16' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/geo-location/get-total-task-time': {
        post: {
            tags: ['GeoLocation-Dashboard'],
            summary: 'Get total task time',
            description: 'Get total task time',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Get total task time',
                    description: 'Get total task time',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['employee_id', 'start_date', 'end_date'],
                        properties: {
                            employee_id: { type: 'number', example: '28881' },
                            start_date: { type: 'string', example: '2024-05-16' },
                            end_date: { type: 'string', example: '2024-05-16' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
    '/geo-location/get-all-employees': {
        get: {
            tags: ['GeoLocation-Dashboard'],
            summary: 'Get employee according to geo location enable disable status',
            description: 'Get employee according to geo location enable disable status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'status',
                    schema: { type: 'number', example: "1", description: 'Enable - 1, Disable - 0' },    
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/geo-location/add-geo-log': {
        post: {
            tags: ['GeoLocation-Mobile'],
            summary: 'Add Employee GeoLocation Logs',
            description: 'Add Employee GeoLocation Logs',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'Add Employee GeoLocation Logs',
                    description: 'Add Employee GeoLocation Logs',
                    required: true,
                    schema: {
                        type: 'object',
                        required: ['title', 'description', '_id'],
                        properties: {
                            longitude: { type: 'string', example: '81.3233339' },
                            latitude: { type: 'string', example: '21.2188348' },
                        },
                    },
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/geo-location/fetch-geo-log-status': {
        get: {
            tags: ['GeoLocation-Mobile'],
            summary: 'Get Employee GeoLocation Logs Status',
            description: 'Get Employee GeoLocation Logs Status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/admin-dashboard/get-task-details': {
        get: {
            tags: ['GeoLocation-Dashboard'],
            summary: 'For Employee dashboard',
            description: 'For Employee dashboard',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: "28888"},    
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: { type: 'number', example: "1" },    
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: { type: 'number', example: "1" },    
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },


    '/admin-dashboard/current-localization-status': {
        get: {
            tags: ['Localization'],
            summary: 'Get current localization status',
            description: 'Get current localization status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/admin-dashboard/update-localization-status': {
        get: {
            tags: ['Localization'],
            summary: 'Update employee localization status',
            description: 'Update employee localization status',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'language',
                    schema: { type: 'string', example: "en" },    
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/admin-dashboard/project-employee-wise': {
        get: {
            tags: ['Dashboard-Project'],
            summary: 'Get Employee wise project details',
            description: 'Get Employee wise project details',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'string', example: '15987' },  
                },
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },

    '/admin-dashboard/fetch-task-list-attendance-claim': {
        get: {
            tags: ['Dashboard-Project-Task'],
            summary: 'Fetch task list in folder project',
            description: 'Fetch task list in folder project',
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
                    schema: { type: 'number', example: 10 },  
                },
                {
                   in: 'query',
                   name: 'search',
                   schema: { type: 'string', example: "Task" },  
               },
                {
                    in: 'query',
                    name: 'employee_id',
                    schema: { type: 'number', example: 3214 },  
                },
                {
                    in: 'query',
                    name: 'manager_id',
                    schema: { type: 'number', example: 1234 },  
                },
                {
                    in: 'query',
                    name: 'task_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'project_id',
                    schema: { type: 'string', example: '6655707a54e2a32bdcc466fc' },  
                },
                {
                    in: 'query',
                    name: 'folder_id',
                    schema: { type: 'string', example: "6655707a54e2a32bdcc46700" },  
                },
                {
                    in: 'query',
                    name: 'start_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                },
                {
                    in: 'query',
                    name: 'end_date',
                    schema: { type: 'string', example: '2024-05-16' },  
                }
            ],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    },
}