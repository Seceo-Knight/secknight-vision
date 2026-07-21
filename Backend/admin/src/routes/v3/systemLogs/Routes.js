const router = require('express').Router();

const SystemLogsController = require('./SystemLogs.controller');

class SystemLogsRoutes {
	constructor() {
		this.myRoutes = router;
		this.core();
	}

	core() {
		this.myRoutes.get('/', SystemLogsController.getSystemLogs);
	}

	getRouters() {
		return this.myRoutes;
	}
}

module.exports = SystemLogsRoutes;
