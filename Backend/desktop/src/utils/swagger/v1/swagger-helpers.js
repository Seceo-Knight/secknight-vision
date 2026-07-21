const info = {
    "version": "1.0.0",
    "title": "EMP Monitor 2.0 - Api Documentation",
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
    // { name: "Posts", description: "API for Posts - related in the app" },
    { name: "User", description: "API for Users - related in the app" },
    { name: "Admin", description: "API for Admin - related in the app" },
    { name: "Desktop", description: "API for Desktop - related in the app" },
    { name: "Log", description: "API for Logs - related in the app" },
    // { name: "News-OLD", description: "API for News - related in the app" },
    // { name: "News", description: "API for News - related in the app" },
    // { name: "GamePix", description: "API for GamePix" },
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
    }
};

module.exports = { info, tags, responseObject, definitions }