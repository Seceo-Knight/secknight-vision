const _ = require('lodash');

const SystemLogsModel = require('./SystemLogs.model');
const SystemLogsValidator = require('./SystemLogs.validator');
const SystemLogsHelper = require('./SystemLogs.helper');

const sendResponse = require('../../../utils/myService').sendResponse;
const actionsTracker = require('../services/actionsTracker');
const {
	timesheetMessages,
} = require('../../../utils/helpers/LanguageTranslate');

class SystemLogsController {
	getSystemLogs_old = async (req, res, next) => {
		try {
			const {
				organization_id,
				role_id,
				role,
				language,
				timezone,
				employee_id: manager_id,
			} = req.decoded;
			let {
				employee_id,
				startDate,
				endDate,
				offset,
				limit,
				sortColumn,
				sortOrder,
				...queries
			} = await SystemLogsValidator.getSystemLogsValidation().validateAsync(
				req.query,
			);
			actionsTracker(req, 'Get system-logs data (?).', [{
				manager_id,
				startDate,
				endDate
			},]);
			let employee_ids = await this._getEmployeeIds({
				role,
				role_id,
				manager_id,
				employee_id,
				organization_id
			});
			if (_.isEmpty(employee_ids)) {
				return sendResponse(
					res,
					400,
					null,
					timesheetMessages.find((x) => x.id === '1')[language] ||
					timesheetMessages.find((x) => x.id === '1')['en'],
					null,
				);
			}

			const empData = await SystemLogsModel.getEmpDataEndFiltration({
				organization_id,
				queries,
				employee_ids,
			});

			if (_.isEmpty(empData)) {
				return sendResponse(
					res,
					400,
					null,
					timesheetMessages.find((x) => x.id === '1')[language] ||
					timesheetMessages.find((x) => x.id === '1')['en'],
					null,
				);
			}

			const filtrEmployeeIds = _.map(empData, 'id');
			const systemLogsData = await SystemLogsModel.getSystemLogsData({
				organization_id,
				employee_ids: filtrEmployeeIds,
				startDate,
				endDate,
				offset,
				limit,
				sortColumn,
				sortOrder,
			});
			if (_.isEmpty(systemLogsData.docs)) {
				return sendResponse(
					res,
					400,
					null,
					timesheetMessages.find((x) => x.id === '3')[language] ||
					timesheetMessages.find((x) => x.id === '3')['en'],
					null,
				);
			}

			const docs = SystemLogsHelper.assignAndSortedData({
				empData,
				sortColumn,
				sortOrder,
				timezone,
				logsData: systemLogsData.docs,
			});

			return sendResponse(
				res,
				200, {
				...systemLogsData,
				docs
			},
				timesheetMessages.find((x) => x.id === '4')[language] ||
				timesheetMessages.find((x) => x.id === '4')['en'],
				null,
			);
		} catch (err) {
			next(err);
		}
	};

	getSystemLogs = async (req, res, next) => {
		try {
			let searchEmpData = []
			let { organization_id, role_id, role, language, timezone, employee_id: manager_id, } = req.decoded;
			if(req.query.type) req.query.type =  req?.query?.type?.split(',');
			let { employee_id, startDate, endDate, offset, limit, sortColumn, sortOrder, search, non_admin_id, type,
				...queries } = await SystemLogsValidator.getSystemLogsValidation().validateAsync(req.query,);


			if (non_admin_id) manager_id = non_admin_id;
			actionsTracker(req, 'Get system-logs data (?).', [{ manager_id, startDate, endDate },]);

			let employee_ids = await this._getEmployeeIds({ role, role_id, manager_id, employee_id, organization_id });
			if (_.isEmpty(employee_ids)) {
				return sendResponse(
					res,
					400,
					null,
					timesheetMessages.find((x) => x.id === '1')[language] ||
					timesheetMessages.find((x) => x.id === '1')['en'],
					null,
				);
			}

			const empData = await SystemLogsModel.getEmpDataEndFiltration({ organization_id, queries, employee_ids });
			if (_.isEmpty(empData)) {
				return sendResponse(
					res,
					400,
					null,
					timesheetMessages.find((x) => x.id === '1')[language] ||
					timesheetMessages.find((x) => x.id === '1')['en'],
					null,
				);
			}

			if (search) {
				searchEmpData = await SystemLogsModel.getSeachedEmpIds({ organization_id, queries, employee_ids, search });
				searchEmpData = _.map(searchEmpData, "id")
			}
			const filtrEmployeeIds = _.map(empData, 'id');

			const [systemLogsData, totalDocs] = await Promise.all([
				SystemLogsModel.getSystemLogs({ organization_id, employee_ids: filtrEmployeeIds, startDate, endDate, offset, limit, sortColumn, sortOrder, search, searchEmpData, type }),
				SystemLogsModel.getSystemLogsCount({ organization_id, employee_ids: filtrEmployeeIds, startDate, endDate, search, searchEmpData, type })
			]);
			if (_.isEmpty(systemLogsData)) {
				return sendResponse(
					res,
					400,
					null,
					timesheetMessages.find((x) => x.id === '3')[language] ||
					timesheetMessages.find((x) => x.id === '3')['en'],
					null,
				);
			}
			const docs = SystemLogsHelper.assignAndSortedData({
				empData,
				sortColumn,
				sortOrder,
				// timezone,
				logsData: systemLogsData,
			});

			return sendResponse(
				res,
				200, {
				totalDocs,
				offset,
				limit,
				docs
			},
				timesheetMessages.find((x) => x.id === '4')[language] ||
				timesheetMessages.find((x) => x.id === '4')['en'],
				null,
			);
		} catch (err) {
			next(err);
		}
	};

	async _getEmployeeIds_old({
		role,
		role_id,
		manager_id,
		employee_id
	}) {
		let employee_ids = [];

		if (role === 'Employee') {
			employee_ids.push(manager_id);
		} else {
			const asignedEmployeeIds = await SystemLogsModel.getEmployeeAssignedToManager(
				manager_id,
				role_id,
			);

			const filtrEmployeeIds = employee_id ?
				_.filter(asignedEmployeeIds, {
					id: employee_id
				}) :
				asignedEmployeeIds;

			employee_ids = _.map(filtrEmployeeIds, 'id');
		}

		return employee_ids;
	}

	async _getEmployeeIds({
		role,
		role_id,
		manager_id,
		employee_id,
		organization_id
	}) {
		let employee_ids = [];
		let asignedEmployeeIds;
		if (employee_id) {
			if (manager_id) {
				asignedEmployeeIds = await SystemLogsModel.getEmployeeAssignedToManager(
					manager_id,
					role_id,
					employee_id
				);
				employee_ids.push(asignedEmployeeIds)
			} else {
				asignedEmployeeIds = await SystemLogsModel.getEmployeeFromOrganization(
					employee_id,
					organization_id,

				);
			}
		} else {
			if (manager_id) {
				asignedEmployeeIds = await SystemLogsModel.getEmployeeAssignedToManager(
					manager_id,
					role_id
				);
				employee_ids.push(asignedEmployeeIds)
			} else {
				asignedEmployeeIds = await SystemLogsModel.getEmployeeFromOrganization(null,
					organization_id
				);
			}
		}

		employee_ids = _.map(asignedEmployeeIds, 'id');
		return employee_ids;
	}
}

module.exports = new SystemLogsController();
