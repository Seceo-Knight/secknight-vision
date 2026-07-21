const info = {
    version: '3.0.1',
    title: 'EMP Monitor 2.3 -V3 Api Documentation ',
    description: 'Detailed V3 Api documentaion for the `EMP-Monitor App`',
    license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
        email: 'vikash.verma@globussoft.in',
    },
};

const tags = [{ name: 'Open' }, { name: 'Auth' }];

/**
 * 1xx: Informational (request has been received and the process is continuing).
 * 2xx: Success (action was successfully received, understood, and accepted).
 * 3xx: Redirection (further action must be taken in order to complete the request).
 * 4xx: Client Error (request contains incorrect syntax or cannot be fulfilled).
 * 5xx: Server Error (server failed to fulfill an apparently valid request).
 */
const responseObject = {
    200: { description: 'Success response with data' },
    400: { description: 'Bad Request with error data' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found with error data' },
    500: { description: 'Server is down' },
};

const definitions = {
    UserAuth: {
        required: ['contactNo'],
        properties: {
            contactNo: {
                type: 'string',
                example: '+9197XXXXXX94',
                uniqueItems: true,
            },
        },
    },
};
const securityObject = [
    {
        authenticate: [],
    },
];

module.exports = { info, tags, responseObject, definitions, securityObject };
