const Joi = require('@hapi/joi');
const SystemLogsHelper = require('./SystemLogs.helper');

class SystemLogsValidator {
	getSystemLogsValidation() {
		const { columns, orders } = SystemLogsHelper.getAllowSortValue();
		return Joi.object().keys({
			offset: Joi.number().integer().min(0).default(0),
			employee_id: Joi.number().positive(),
			startDate: Joi.string().isoDate().required(),
			endDate: Joi.string().isoDate().required(),
			limit: Joi.number().integer().default(null),
			sortColumn: Joi.string().valid(...columns),
			sortOrder: Joi.string()
				.valid(...orders)
				.default(orders[1]),
			locationId: Joi.number().integer().positive(),
			departmentId: Joi.number().integer().positive(),
			search: Joi.string().default(null),
			non_admin_id: Joi.number(),
			type: Joi.array().items(Joi.number())
		});
	}
}

module.exports = new SystemLogsValidator();
