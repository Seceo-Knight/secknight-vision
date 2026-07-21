import * as joi from "@hapi/joi";

export const validateScreenshotDTOSchema = joi.object({
    projectId: joi.number().integer().positive().allow(-1, 0).required(),
    taskId: joi.number().integer().positive().allow(-1, 0).required()
}).required();