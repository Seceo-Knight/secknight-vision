const swaggerHelpers = require('../swagger-helpers');
const { securityObject } = require('../swagger-helpers');

exports.commonBulkSwagger = {
    '/hrms/common-bulk/upload': {
        post: {
            tags: ['HRMS'],
            description: 'Upload common bulk',
            consumes: ['multipart/form-data'],
            produces: ['application/json'],
            parameters: [{
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Upload common bulk',
            }],
            responses: swaggerHelpers.responseObject,
            security: securityObject,
        },
    }
};