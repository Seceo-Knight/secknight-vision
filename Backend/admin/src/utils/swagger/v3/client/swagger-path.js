const swaggerHelpers = require('../swagger-helpers');
const swaggerPaths = require('./swagger-schema');

let schemes = ['http', 'https'];
let host = process.env.API_URL_LOCAL;

if (process.env.NODE_ENV === 'development') {
    host = process.env.API_URL_DEV;
    schemes = ['https', 'http'];
} else if (process.env.NODE_ENV === 'production') {
    host = process.env.API_URL_PRODUCTION;
    schemes = ['https'];
}

/**
 * Swagger API Docs
 *
 * This is the main JSON (from module exports) where all the config and paths are defined
 *
 * But to make it modular, a few things are present in different files
 * Swagger-path -  contains all the paths/routes of the project
 * Swagger-helpers
 *      - infos object
 *      - tags object
 *      - definitions for paths
 *      - response object
 */
module.exports = {
    swagger: '2.0',
    info: {
        version: '3.0.0',
        title: 'EMP Monitor 2.3 -V3 Api Documentation ',
        description: 'Detailed V3 API documentation for the "EMP-Monitor"',
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
        contact: {
            email: 'support@empmonitor.com',
        },
    },
    host: host,
    basePath: '/api/v3/',
    tags:  [{ name: 'Open' }],
    schemes: schemes,
    consumes: ['application/json'],
    produces: ['application/json'],
    paths: swaggerPaths,
    // definitions: swaggerHelpers.definitions,
    securityDefinitions: {
        authenticate: {
            type: 'apiKey',
            in: 'header',
            name: 'token',
            description:
                `Please provide the valid access token, if you don't have please connect with support team.`,
        },
    },
};
