const Joi = require('@hapi/joi');
let JoiVailddation = require('joi')

class PRValidator {
    getProductivityRanking() {
        return Joi.object().keys({
            page: Joi.number().integer().positive().allow(null).optional(),
            limit: Joi.number().integer().positive().default(25),
            type: Joi.number().valid(1, 2),
            status: Joi.number().valid(0, 1, 2).optional().default(null),
            category_type: Joi.string().valid('All', 'Global', 'Custom', 'New').default('All'),
            name: Joi.string().allow(null).allow(""),
            sortColumn: Joi.string().optional().default(null),
            sortOrder: Joi.string().optional().default(null),
            skip: Joi.number().default(0).optional()
        });
    }
    bulkUpdateProductivityRanking() {
        const objectSchema = Joi.object().keys(
            {
                application_id: Joi.string().required(),
                department_rules: Joi.array().items(
                    Joi.object({
                        department_id: Joi.number().integer().positive().required().allow(0),
                        status: Joi.number().valid(0, 1, 2).required(),
                        pre_request: Joi.number().min(0).max(parseInt(process.env.MAX_PRE_REQUEST)).default(0).required(),//
                    }).required()
                ).required().unique((a, b) => a.department_id === b.department_id),
            }
        ).required();

        // cannot have duplicate data for application_id
        const arraySchema = Joi.array().items(objectSchema).unique((a, b) => a.application_id === b.application_id);

        return Joi.object({
            data: Joi.alternatives().try(arraySchema).required()
        }).required();
    }

    DownloadProductivityRanking() {
        return Joi.object().keys({
            type: Joi.number().valid(1, 2).allow('', null),
            status: Joi.number().valid(1, 2, 0,).allow('', null).optional().default(null),
        });
    }

    bulkUpdateProductivityRankingByFile(statusKeys) {
        return Joi.array().items(
            Joi.object().keys({
                status: Joi.string().valid(...statusKeys).required().required(),
                Activity: Joi.string().required().required(),
                Type: Joi.string().valid(...statusKeys).required(),
                CreatedAt: Joi.any(),
                UpdatedAt: Joi.any()
            }).required()
        ).required()
    };

    addUrl() {
        return Joi.object().keys({
            url: Joi.string().required().required(),
            department_rules: Joi.array().items(
                Joi.object({
                    department_id: Joi.number().integer().positive().required().allow(0),
                    status: Joi.number().valid(0, 1, 2).required(),
                }).required()
            ).required().unique((a, b) => a.department_id === b.department_id),
        }).required()
    }

    bulkUpdateProductivityRankingByFileBulkImport() {
        return Joi.array().items(
            Joi.object().keys({
                status: Joi.string().trim().valid('Productive', 'Unproductive', 'Neutral').required().required(),
                Activity: Joi.string().trim().required().required(),
                Type: Joi.string().trim().valid('Website').required(),
            }).required()
        ).required()
    };
}

module.exports = new PRValidator;



   // bulkUpdateProductivityRankingByFile() {
    //     return JoiVailddation.array().items(
    //         JoiVailddation.object().keys({
    //             status: JoiVailddation.string().valid('Productive', 'Unproductive', 'Neutral').empty().required().message({'status must in [Productive,Unproductive,Neutral]'}),
    //             Activity: JoiVailddation.string().empty().required().message({'Invalid Activity In File'}),
    //             Type: JoiVailddation.string().valid('Application', 'Website').empty().required().message({'Type must in [Application,Website]'}),

    //         }).required()
    //     ).required()
    // }