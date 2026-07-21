const info = {
    "version": "3.0.1",
    "title": "EMP Monitor 2.3 - Api Documentation",
    "description": "Detailed Api documentaion for the `EMP-Monitor App`",
    "license": {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    "contact": {
        "email": "vikash.verma@globussoft.in"
    }
}

const tags = [
    { name: "Open", description: "OpenAPI - these soes not require any authetication" },
    { name: "Auth", description: "API for User Authentication" },
    { name: "Authenticate", description: "API for User Authentication New" },
    { name: "User", description: "API for Users - related in the app" },
    { name: "Clock-In", description: "API for Clock-In and timesheet related in the app" },
    { name: "Project", description: "Project related API" },
    { name: "Firewall", description: "Firewall related API" },

];

/**
 * 1xx: Informational (request has been received and the process is continuing).
 * 2xx: Success (action was successfully received, understood, and accepted).
 * 3xx: Redirection (further action must be taken in order to complete the request).
 * 4xx: Client Error (request contains incorrect syntax or cannot be fulfilled).
 * 5xx: Server Error (server failed to fulfill an apparently valid request).
 */
const responseObject = {
    200: { description: "Success response with data" },
    202: { description: "Accepted" },
    400: { description: "Bad Request with error data" },
    401: { description: "Unauthorized" },
    404: { description: "Not found with error data" },
    500: { description: "Server is down" }
};

const definitions = {
    UserAuth: {
        required: ["contactNo"],
        properties: {
            contactNo: { type: "string", example: "+9197XXXXXX94", uniqueItems: true }
        }
    },
    UserAutoRegistration: {
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
};

module.exports = { info, tags, responseObject, definitions }