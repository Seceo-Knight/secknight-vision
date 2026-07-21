const mySql = require('../../../database/MySqlConnection').getInstance();
const SystemLogsHelper = require('./SystemLogs.helper');
const EmpSystemLogsModel = require('../../../models/user-system-logs.schema');

class SystemLogsModel {
	getEmpDataEndFiltration_old({
		organization_id,
		queries,
		employee_ids
	}) {
		const condition = SystemLogsHelper.parseConditionQuery(queries);

		const query = `SELECT e.id, u.first_name, u.last_name, od.name as departament, ol.name as location
            FROM employees e
            JOIN users u ON u.id = e.user_id 
            JOIN organization_departments od ON od.id = e.department_id
            JOIN organization_locations ol ON ol.id = e.location_id 
			WHERE e.organization_id = ? AND e.id IN (?) ${condition}`;
		const paramsArray = [organization_id, employee_ids];

		return mySql.query(query, paramsArray);
	}

	getSystemLogsData_old({
		organization_id,
		employee_ids,
		startDate,
		endDate,
		offset,
		limit,
		sortColumn,
		sortOrder,
	}) {
		const {
			startStr,
			endStr
		} = SystemLogsHelper.parseTimeToStr(
			startDate,
			endDate,
		);
		const sort =
			sortColumn === 'date' ?
				{
					start: SystemLogsHelper.getSortOrder(sortOrder)
				} :
				null;
		const query = {
			organization_id,
			employee_id: {
				$in: employee_ids
			},
			date: {
				$gte: startStr,
				$lte: endStr
			},
		};
		const options = {
			offset,
			limit,
			sort,
			lean: true,
			select: [
				'title',
				'type',
				'description',
				'_id',
				'computer',
				'duration',
				'start',
				'end',
				'employee_id',
			],
		};
		return EmpSystemLogsModel.paginate(query, options);
	}

	getEmpDataEndFiltration({
		organization_id,
		queries,
		employee_ids
	}) {
		const condition = SystemLogsHelper.parseConditionQuery(queries);

		const query = `SELECT e.id,CONCAT(u.first_name," ", u.last_name) full_name , od.name as departament, ol.name as location,e.timezone as timezone
            FROM employees e
            JOIN users u ON u.id = e.user_id 
            JOIN organization_departments od ON od.id = e.department_id
            JOIN organization_locations ol ON ol.id = e.location_id 
			WHERE e.organization_id = ? AND e.id IN (?) ${condition}`;
		const paramsArray = [organization_id, employee_ids];
		return mySql.query(query, paramsArray);
	}

	getSystemLogsData({
		organization_id,
		employee_ids,
		startDate,
		endDate,
		offset,
		limit,
		sortColumn,
		sortOrder,
		search
	}) {
		const { startStr, endStr } = SystemLogsHelper.parseTimeToStr(startDate, endDate,);
		let sort;
		switch (sortColumn) {
			case 'date':
				sort = { date: SystemLogsHelper.getSortOrder(sortOrder) }
				break
			case 'title':
				sort = { title: SystemLogsHelper.getSortOrder(sortOrder) }
				break
			case 'description':
				sort = { description: SystemLogsHelper.getSortOrder(sortOrder) }
				break
			case 'computer':
				sort = { computer: SystemLogsHelper.getSortOrder(sortOrder) }
				break
			default:
				sort = null
				break

		}

		let query = {
			organization_id,
			employee_id: {
				$in: employee_ids
			},
			date: {
				$gte: startStr,
				$lte: endStr
			},


		};

		if (search) {
			query = {
				...query, $or: [
					{ type: { '$regex': search, '$options': 'i' } },
					{ description: { '$regex': search, '$options': 'i' } },
					{ computer: { '$regex': search, '$options': 'i' } },
					{ title: { '$regex': search, '$options': 'i' } },
				]
			}
		}
		const options = {
			offset,
			limit: 1000,
			sort,
			lean: true,
			select: [
				'title',
				'type',
				'description',
				'_id',
				'computer',
				'duration',
				'start',
				'end',
				'employee_id',
			],
		};
		return EmpSystemLogsModel.paginate(query, options);
	}

	getEmployeeAssignedToManager_old(manager_id, role_id) {
		const query = `SELECT employee_id as id
            FROM assigned_employees
			WHERE to_assigned_id = ? AND role_id = ?`;

		return mySql.query(query, [manager_id, role_id]);
	}

	getEmployeeAssignedToManager(manager_id, role_id, employee_id) {
		let query = `SELECT employee_id as id
            FROM assigned_employees
			WHERE to_assigned_id = ${manager_id} `;
		if (role_id) query += ` AND role_id = ${role_id}`
		if (employee_id) query += ` AND employee_id=${employee_id}`

		return mySql.query(query);
	}

	getEmployeeFromOrganization(employee_id, organization_id) {
		let query = `SELECT id
            FROM employees e where
			e.organization_id = ${organization_id}`;
		if (employee_id) query += ` AND e.id=${employee_id}`

		return mySql.query(query);
	}

	getSystemLogs({ organization_id, employee_ids, startDate, endDate, offset, limit, sortColumn, sortOrder = 'D', search, searchEmpData, type }) {
		const { startStr, endStr } = SystemLogsHelper.parseTimeToStr(startDate, endDate);
		let sort;
		switch (sortColumn) {
			case 'time':
				sort = { start: SystemLogsHelper.getSortOrder(sortOrder) }
				break;
			case 'date':
				sort = { date: SystemLogsHelper.getSortOrder(sortOrder) }
				break;
			case 'title':
				sort = { title: SystemLogsHelper.getSortOrder(sortOrder) }
				break;
			case 'description':
				sort = { description: SystemLogsHelper.getSortOrder(sortOrder) }
				break;
			case 'computer':
				sort = { computer: SystemLogsHelper.getSortOrder(sortOrder) }
				break;
			default:
				sort = { start: SystemLogsHelper.getSortOrder(sortOrder) }
				break;
		}
		let query = {
			organization_id,
			employee_id: {
				$in: employee_ids
			},
			date: {
				$gte: startStr,
				$lte: endStr
			},
		};
		if(type?.length) query.type = { $in: type};
		if (search) {

			query = {
				...query, $or: [
					{ type: { '$regex': search, '$options': 'i' } },
					{ description: { '$regex': search, '$options': 'i' } },
					{ computer: { '$regex': search, '$options': 'i' } },
					{ title: { '$regex': search, '$options': 'i' } },
					{ employee_id: { $in: searchEmpData } }
				]
			}
		}
		let select = { title: 1, type: 1, description: 1, _id: 1, computer: 1, start: 1, date: 1, employee_id: 1 }
		if (limit) {
			return EmpSystemLogsModel.find(query, select).skip(offset).limit(limit).sort(sort).lean()
		} else {
			return EmpSystemLogsModel.find(query, select).sort(sort).lean()
		}
	}

	getSystemLogsCount({ organization_id, employee_ids, startDate, endDate, search, searchEmpData, type }) {
		const { startStr, endStr } = SystemLogsHelper.parseTimeToStr(startDate, endDate);
		let query = {
			organization_id,
			employee_id: {
				$in: employee_ids
			},
			date: {
				$gte: startStr,
				$lte: endStr
			},
		};

		if (search) {
			query = {
				...query, $or: [
					{ type: { '$regex': search, '$options': 'i' } },
					{ description: { '$regex': search, '$options': 'i' } },
					{ computer: { '$regex': search, '$options': 'i' } },
					{ title: { '$regex': search, '$options': 'i' } },
					{ employee_id: { $in: searchEmpData } }
				]
			}
		}
		if(type?.length) query.type = { $in: type};
		return EmpSystemLogsModel.countDocuments(query)
	}


	getSeachedEmpIds({ organization_id, queries, employee_ids, search }) {
		const condition = SystemLogsHelper.parseConditionQuery(queries);

		const query = `SELECT e.id
            FROM employees e
            JOIN users u ON u.id = e.user_id 
            JOIN organization_departments od ON od.id = e.department_id
            JOIN organization_locations ol ON ol.id = e.location_id 
			WHERE e.organization_id = ? AND e.id IN (?)  ${condition}  AND CONCAT(u.first_name," ", u.last_name) LIKE '%${search}%'  `;
		const paramsArray = [organization_id, employee_ids];

		return mySql.query(query, paramsArray);
	}
}

module.exports = new SystemLogsModel()
