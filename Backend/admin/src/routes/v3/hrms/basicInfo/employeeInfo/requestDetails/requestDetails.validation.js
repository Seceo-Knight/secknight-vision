// Request Details Validator

const Joi = require('joi');

// Request Details Validation
class RequestDetailsValidator {

    /**
     * Get request details
     * @param {*} params 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getRequestDetails(params) {
        const schema = Joi.object().keys({
            id: Joi.string().length(24).default(null),
            status: Joi.number().valid(1, 2, 3).default(null),
            type: Joi.number().valid(1, 2, 3, 4, 5, 6).default(null),
            updated_at: Joi.date().default(null),
            created_at: Joi.date().default(null),
            employee_id: Joi.number().integer().default(null),
            updated_by: Joi.number().integer().default(null),
        });

        return Joi.validate(params, schema);
    }

    /**
     * Create request details 
     * @param {*} params 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    createRequestDetails(params) {
        const schema = Joi.object().keys({
            id: Joi.string().length(24).default(null),
            delete: Joi.boolean().allow(0, 1).default(false),
            type: Joi.any().when('delete', {
                is: Joi.boolean().valid(false, 0),
                then: Joi.number().valid(1, 2, 3, 4, 5, 6).required(),
                otherwise: Joi.default(null)
            }),
            module_name: Joi.any().when('delete', {
                is: Joi.boolean().valid(false, 0),
                then: Joi.string().required(),
                otherwise: Joi.default(null)
            }),
            value: Joi.any().when('delete', {
                is: Joi.boolean().valid(false, 0),
                then: Joi.required(),
                otherwise: Joi.default(null)
            })
        });

        return Joi.validate(params, schema);
    }

    /**
     * Update request Details
     * @param {*} params 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    updateRequestDetails(params) {
        const schema = Joi.object().keys({
            id: Joi.string().length(24).required(),
            delete: Joi.boolean().allow(0, 1).default(false),
            status: Joi.when('delete', {
                is: Joi.boolean().valid(false, 0),
                then: Joi.number().valid(2, 3).required(),
                otherwise: Joi.default(null)
            }),
        });

        return Joi.validate(params, schema);
    }
}

// exports
module.exports = new RequestDetailsValidator();