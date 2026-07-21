const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi)

class CategoryValidator {
    getCategoryWebApps() {
        return Joi.object().keys({
            category_id: Joi.objectId(),
            limit: Joi.number().integer().positive().default(50),
            skip: Joi.number().default(0).optional(),
            name: Joi.string().default(null).optional(),
            sortColumn: Joi.string().optional().default(null),
            sortOrder: Joi.string().optional().default(null),
        });
    };

    UpdateCategoryProductivityRanking() {
        const objectSchema = Joi.object().keys(
            {
                category_id: Joi.string().required(),
                department_rules: Joi.array().items(
                    Joi.object({
                        department_id: Joi.number().integer().positive().required().allow(0),
                        status: Joi.number().valid(0, 1, 2).required(),
                        pre_request: Joi.number().min(0).max(parseInt(process.env.MAX_PRE_REQUEST)).required(),
                    }).required()
                ).required().unique((a, b) => a.department_id === b.department_id),
            }
        ).required();

        // cannot have duplicate data for category_id
        const arraySchema = Joi.array().items(objectSchema).unique((a, b) => a.category_id === b.category_id);

        return Joi.object({
            data: Joi.alternatives().try(arraySchema).required()
        }).required();
    }

}
module.exports = new CategoryValidator;