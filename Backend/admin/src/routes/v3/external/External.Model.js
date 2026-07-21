const mySql = require('../../../database/MySqlConnection').getInstance();
const ExternalTeleWorkModel = require("../../../models/externalTeleWorks.schema");
const ExternalMobileWebUsageModel = require("../../../models/external_mobile_web.schema");
const EmployeeProductivityReport = require('../../../models/employee_productivity.schema');

class ExternalModel {
    static getTeleWorksTokens(organization_id) {
        return mySql.query(`
            SELECT * FROM external_teleworks WHERE organization_id = ${organization_id};
        `)
    }

    static createTokenData({ spToken, labourOfficeId, sequenceNumber, timezone, time, organization_id }) {
        let query = `INSERT INTO external_teleworks (spToken, labourOfficeId, sequenceNumber, timezone, time, organization_id) 
            values ("${spToken}", "${labourOfficeId}", "${sequenceNumber}", "${timezone}", "${time}", ${organization_id});`
        return mySql.query(query)
    }

    static updateTokenData({ spToken, labourOfficeId, sequenceNumber, timezone, time, organization_id, }) {
        let query = `UPDATE external_teleworks SET timezone = "${timezone}", sequenceNumber = "${sequenceNumber}", labourOfficeId = "${labourOfficeId}", spToken = "${spToken}", time = "${time}" WHERE organization_id = ${organization_id}; `
        return mySql.query(query)
    }

    static getOrgTeleWorksData({ getOrgUnderReseller, start_date, end_date }) {
        return ExternalTeleWorkModel.aggregate([
            {
                $match: {
                    $and: [
                        { date: { $gte: start_date } },
                        { date: { $lte: end_date } },
                        { organization_id: { $in : getOrgUnderReseller} },
                    ]
                }
            },
            {
                $project: {
                    organization_id: 1,
                    date: 1,
                    employeesDetails: 1,
                    _id: 1
                }
            }
        ])
    }
    
    static getResellerId(user_id) {
        let query = `
            SELECT *
            FROM reseller r
            WHERE user_id = ${user_id}
        `;
        return mySql.query(query);
    }
    static getOrganizations(resellerId) {
        let query = `
            SELECT *
            FROM organizations o
            WHERE reseller_id = ${resellerId}
        `;
        return mySql.query(query);
    }
    /* New Start */
    static getEmployees(organization_id, skip, limit, search) {
        let query = `
        SELECT
            e.id AS employee_id,
            CONCAT(u.first_name, " ", u.last_name) AS employee_name,
            e.emp_code AS employee_code,
            u.email,
            e.system_type,
            m.email AS org_email,
            o.reseller_id_client AS org_id,
            o.reseller_number_client AS org_no
            FROM employees e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN organizations o ON e.organization_id = o.id
            LEFT JOIN users m ON o.user_id = m.id
            WHERE e.organization_id in (${organization_id}) 
        `;
        if (search) query += ` AND u.first_name LIKE '%${search}%' OR u.last_name LIKE '%${search}%' OR CONCAT(u.first_name, " ", u.last_name) LIKE '%${search}%' OR u.email LIKE '%${search}%' OR m.email LIKE '%${search}%' `
        query += ` LIMIT ${limit} OFFSET ${skip} `;
        return mySql.query(query);
    }

    static getEmployeesCount(organization_id, search) {
        let query = `
        SELECT count(e.id) as total_count
            FROM employees e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN organizations o ON e.organization_id = o.id
            LEFT JOIN users m ON o.user_id = m.id
            WHERE e.organization_id in (${organization_id}) 
        `;
        if(search) query += ` AND u.first_name LIKE '%${search}%' OR u.last_name LIKE '%${search}%' OR CONCAT(u.first_name, " ", u.last_name) LIKE '%${search}%' OR u.email LIKE '%${search}%' OR m.email LIKE '%${search}%'  `
        return mySql.query(query);
    }

    static getAssignedEmployeeList(employee_id, role_id) {
        let query = `
            SELECT e.id as manager_id, CONCAT(u.first_name, " ", u.last_name) AS manager_name, e.emp_code as manager_code, r.name as role_name, r.id as role_id
                FROM employees e
                JOIN users u ON u.id = e.user_id
                JOIN assigned_employees ae ON ae.to_assigned_id = e.id
                JOIN roles r ON r.id = ae.role_id
                WHERE ae.employee_id = ${employee_id}
        `;
        if(role_id) query += ` AND r.id = ${role_id}`;

        return mySql.query(query);
    }

    static async getNonAdminList(organization_id) {
        let query = `
        SELECT  E.id as emp_id, U.first_name, U.last_name, U.id as user_id, R.name as role_name, R.id as role_id, E.emp_code
            FROM users as U
            JOIN employees E ON U.id=E.user_id
            JOIN user_role UR ON UR.user_id=U.id 
            JOIN roles R ON R.id = UR.role_id AND R.organization_id = E.organization_id AND R.name != "Employee"
            JOIN organization_departments OD ON OD.id=E.department_id
            JOIN organization_locations OL ON OL.id=E.location_id
            WHERE E.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    static assignedEmployee(role_id, manager_id, employee_id) {
        let query = `INSERT INTO assigned_employees (employee_id, to_assigned_id, role_id) VALUES (${employee_id}, ${manager_id}, ${role_id})`;
        return mySql.query(query);
    }

    static removedAssignedEmployee(role_id, manager_id, employee_id) {
        let query = `DELETE FROM assigned_employees WHERE employee_id = ${employee_id} AND to_assigned_id = ${manager_id} AND role_id = ${role_id} `;
        return mySql.query(query);
    }

    static checkIsOrgEmployee(organization_id, employee_id) {
        let query = ` SELECT e.id FROM employees e WHERE e.id = ${employee_id} AND e.organization_id = ${organization_id}`;
        return mySql.query(query);
    }

    static getOrganizationUnderReseller(organization_id) {
        let query = `
            SELECT o.id as organization_id
                FROM organizations o
                JOIN reseller org_re ON org_re.id = o.reseller_id
                JOIN users ru ON ru.id = org_re.user_id
                JOIN organizations ro ON ro.user_id = ru.id
                WHERE ro.id = ${organization_id};
        `;
        return mySql.query(query);
    }

    
    static getEmployeesData(employee_id) {
        let query = `
            SELECT e.id, u.id as user_id, u.first_name, u.last_name
                FROM employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.id IN (${employee_id})
        `;
        return mySql.query(query);
    }

    static getReseller({ user_id }) {
        const query = `SELECT r.id AS reseller_id, r.user_id, r.logo, r.domain,r.status, r.details
                    FROM reseller r
                    WHERE user_id = ?`;

        return mySql.query(query, [user_id]);
    }

    static getResellerDetails (resellerId, reseller_organization_id) {
        let condition = `o.reseller_id = ${resellerId} AND o.id = ${reseller_organization_id}`;

        const query = `SELECT u.a_email, current_user_count, o.total_allowed_user_count, o.amember_id, u.username, o.notes,
                    JSON_EXTRACT(os.rules,'$.pack.expiry') AS expiry,o.id AS client_organization_id, u.id AS client_user_id, o.reseller_id_client, o.reseller_number_client
                    FROM organizations o
                    JOIN users u ON u.id = o.user_id
                    JOIN organization_settings os ON os.organization_id=o.id
                    WHERE ${condition}`;
        return mySql.query(query);
    }

    static assignEmployeeReseller(client_organization_id, eid) {
        let query = `
            INSERT INTO silah_assigned_reseller (reseller_organization_id, employee_id) VALUES (${client_organization_id}, ${eid});
        `
        return mySql.query(query);
    }

    static getResellerAssignedEmployee(reseller_organization_id) {
        let query = `
            SELECT e.id, u.first_name, u.last_name, sar.reseller_organization_id, od.name as department_name, ol.name as location_name, e.emp_code 
                FROM silah_assigned_reseller sar
                JOIN employees e ON e.id = sar.employee_id
                JOIN organization_departments od ON od.id = e.department_id         
                JOIN organization_locations ol ON ol.id = e.location_id    
                JOIN users u ON u.id = e.user_id
                WHERE reseller_organization_id = ${reseller_organization_id}
        `;
        return mySql.query(query);
    }

    static removeResellerAssignedEmployee(reseller_organization_id, employee_id) {
        let query = `
            DELETE FROM silah_assigned_reseller WHERE employee_id = ${employee_id} AND reseller_organization_id = ${reseller_organization_id}
        `;
        return mySql.query(query);
    }

    static removeResellerAssignedEmployeeMultiple(reseller_organization_id, employee_ids) {
        let query = `
            DELETE FROM silah_assigned_reseller WHERE employee_id NOT IN (${employee_ids}) AND reseller_organization_id = ${reseller_organization_id}
        `;
        return mySql.query(query);
    }

    static getEmployeeReseller( employee_id ) {
        let query = `
            SELECT o.id, u.first_name, u.last_name, u.email, o.id as organization_id, o.current_user_count, o.total_allowed_user_count, u.username
                FROM organizations o
                JOIN users u ON u.id = o.user_id
                JOIN silah_assigned_reseller sar ON sar.reseller_organization_id = o.id
                WHERE sar.employee_id = ${employee_id}
        `;
        return mySql.query(query);
    }

    static isDomainReachable(domain) {
        const {default: axios} = require('axios');
        return axios.get(`${domain}`);
    }

    static isDomainExist(organization_id, admin_email, a_admin_email) {
        let query = `SELECT * FROM ?? WHERE admin_email = ? OR a_admin_email = ?`;
        return mySql.query(query, ['on_prem_domain', admin_email, a_admin_email]);
    }

    static insertDomainDetails({ service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain, frontend_domain, organization_id, main_domain, admin_email, a_admin_email }) {
        let query = `
            INSERT INTO ?? (serviceDomain, desktopDomain, reportDomain, storelogsDomain, socketDomain, frontendDomain, organizationId, main_domain, admin_email, a_admin_email) values ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
        return mySql.query(query, ['on_prem_domain', service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain, frontend_domain, organization_id, main_domain, admin_email, a_admin_email ]);
    }

    static updateDomainDetails({ service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain, frontend_domain, organization_id, main_domain, admin_email, a_admin_email }) {
        let query = `
            UPDATE  ?? 
            SET serviceDomain = ?, desktopDomain = ?, reportDomain= ?, storelogsDomain= ?, socketDomain= ?, frontendDomain= ?, main_domain= ?
            WHERE admin_email = ? OR a_admin_email = ?
        `
        return mySql.query(query, ['on_prem_domain', service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain, frontend_domain, main_domain, admin_email, a_admin_email ]);
    }

    static getAgentInfo() {
        const query = `SELECT
            operating_system, c_version, meta_name FROM application_info WHERE status = 1 AND agent_name='empmonitor'`;
        return mySql.query(query)
    }

    static updateEnvDetails({ dec_key, dec_iv, dec_OPENSSL_CIPHER_NAME, dec_CIPHER_KEY_LEN, organization_id, admin_email, a_admin_email }) {
        let query = `
            UPDATE  ?? 
            SET dec_key = ?, dec_iv = ?, dec_OPENSSL_CIPHER_NAME= ?, dec_CIPHER_KEY_LEN= ?
            WHERE admin_email = ? OR a_admin_email = ?
        `
        return mySql.query(query, ['on_prem_domain', dec_key, dec_iv, dec_OPENSSL_CIPHER_NAME, dec_CIPHER_KEY_LEN, admin_email, a_admin_email]);
    }

    static getEnvDetails(admin_email, a_admin_email) {
        let query = `SELECT dec_key, dec_iv, dec_OPENSSL_CIPHER_NAME, dec_CIPHER_KEY_LEN FROM ?? WHERE admin_email = ? OR a_admin_email = ?`;
        return mySql.query(query, ['on_prem_domain', admin_email, a_admin_email]);
    }

    static getWebUsage({ employeeId, orgId, startDate, endDate, search, skip, limit }) {
        const match = {
            employee_id: employeeId,
            organization_id: orgId,
            $and: [
                { date: { $gte: startDate } },
                { date: { $lte: endDate } }
            ]
        };
        if (search?.length) match['link'] = { '$regex': search, '$options': 'i' };
        return ExternalMobileWebUsageModel.aggregate([
            { $match: match },
            { $project: { organization_id: 1, employee_id: 1, link: 1, start_time: 1, end_time: 1, date: 1 } }
        ]).skip(skip).limit(limit);
    }

    static getWebUsageCount({ employeeId, orgId, startDate, endDate, search, }) {
        const match = {
            employee_id: employeeId,
            organization_id: orgId,
            $and: [
                { date: { $gte: startDate } },
                { date: { $lte: endDate } }
            ]
        };
        if (search?.length) match['link'] = { '$regex': search, '$options': 'i' };
        return ExternalMobileWebUsageModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$employee_id",
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, count: 1 } }
        ]);
    }

    static getUsersOfOrganization(emails, organization_id) {
        let query = `SELECT 
	                    e.id AS employee_id, u.email, e.organization_id
                    FROM users u 
                    INNER JOIN employees e ON u.id = e.user_id
                    WHERE u.email IN (`

        emails.map((email, i) => {
            query += i === emails.length - 1 ? `'${email}'` : `'${email}',`
        });
        query += `) AND organization_id = ${organization_id};`;
        return mySql.query(query);
    }

    static addWebUsage({ data }) {
        return ExternalMobileWebUsageModel.insertMany(data);
    }

    
    static getEmployeeIdsByFilter ({ location_id, department_id, employee_id, search, organization_id, manager_id }) {
        let query = `
            SELECT e.id, u.first_name, u.last_name 
                FROM employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.organization_id = ${organization_id}
        `;
        if(manager_id) {
            query  = `
                SELECT e.id, u.first_name, u.last_name 
                    FROM employees e
                    JOIN users u ON u.id = e.user_id
                    JOIN assigned_employees ae ON ae.employee_id = e.id
                    WHERE e.organization_id = ${organization_id} AND ae.to_assigned_id = ${manager_id}
            `
        }
        if (location_id) query += ` AND e.location_id = ${location_id}`;
        if (department_id) query += ` AND e.department_id = ${department_id}`;
        if (employee_id) query += ` AND e.id = ${employee_id}`;
        if (search) query += ` AND (u.first_name LIKE '%${search}%' OR u.last_name LIKE '%${search}%' OR CONCAT(u.first_name,'', u.last_name) LIKE '%${search}%' OR u.email LIKE '%${search}%' OR u.a_email LIKE '%${search}%')`;
        return mySql.query(query);
    }

    static getTimesheetData({ employeeIds, organization_id, start_date, end_date }) {
        let match = {
            organization_id: +organization_id,
            yyyymmdd: { $gte: +start_date.split('-').join(''), $lte: +end_date.split('-').join('') }
        }
        if(employeeIds?.length) match.employee_id = { $in: employeeIds };
        return EmployeeProductivityReport.aggregate([
            {
                $match: match,
            },
            {
                $project: {
                    id: 1,
                    employee_id: 1,
                    yyyymmdd: 1,
                    date: 1,
                    office_duration: { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration', '$offline_time'] },
                }
            }
        ]);
    }

    static getAttendanceData({ employeeIds, organization_id, start_date, end_date }) {
        let query = `
            SELECT e.id as employee_id, ea.id, ea.start_time, ea.end_time, u.first_name, u.last_name, ea.date, e.emp_code
                FROM employees e
                JOIN employee_attendance ea on ea.employee_id = e.id
                JOIN users u ON u.id = e.user_id
                WHERE e.organization_id = ${organization_id}
                AND ea.date BETWEEN '${start_date}' AND '${end_date}'
        `;

        if(employeeIds?.length) query += ` AND e.id IN (${employeeIds})`;
        return mySql.query(query);
    }

    static getAllEmployee(organization_id, skip, limit, search ) {
        let query = `
            SELECT e.id as employee_id, CONCAT(u.first_name, " ", u.last_name) AS employee_name, e.emp_code as employee_code, u.email, u.a_email
                FROM employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.organization_id IN (${organization_id})
        `;
        if (search) query += ` AND (u.first_name LIKE '%${search}%' OR u.last_name LIKE '%${search}%' OR CONCAT(u.first_name, " ", u.last_name) LIKE '%${search}%' OR u.email LIKE '%${search}%' OR u.a_email LIKE '%${search}%') `
        query += ` LIMIT ${limit} OFFSET ${skip} `;
        return mySql.query(query);
    }

    static getAllEmployeeCount(organization_id, search) {
        let query = `
            SELECT count(e.id) as total_count
                FROM employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.organization_id IN (${organization_id})
        `;
        if (search) query += ` AND (u.first_name LIKE '%${search}%' OR u.last_name LIKE '%${search}%' OR CONCAT(u.first_name, " ", u.last_name) LIKE '%${search}%' OR u.email LIKE '%${search}%' OR u.a_email LIKE '%${search}%') `
        return mySql.query(query);
    }

    static getEmployeeStatistics(resellersOrganizationIds) {
        let query = `
            SELECT e.id, concat(u.first_name, ' ', u.last_name) as employee_name, u.email, e.emp_code, e.created_at, u.computer_name,  concat(ru.first_name, ' ', ru.last_name) as organization_name, u.password, e.mobile_os
                FROM employees e
                JOIN users u ON u.id = e.user_id
                JOIN organizations o ON o.id = e.organization_id
                JOIN users ru ON ru.id = o.user_id
                WHERE e.organization_id IN (${resellersOrganizationIds})
        `;
        return mySql.query(query);
    }

    static getEmployeeStatisticsCount(resellersOrganizationIds) {
        let query = `
            SELECT COUNT(*) AS total
                FROM employees e
                WHERE e.organization_id IN (${resellersOrganizationIds})
        `;
        return mySql.query(query);
    }

      static getManagerStatistics(resellersOrganizationIds) {
        let query = `
            SELECT e.id, concat(u.first_name, " ", u.last_name) as employee_name, u.email as employee_email,
                u.password as employee_password, e.created_at as employee_created_at, 
                concat(org_usr.first_name, " ", org_usr.last_name) as organization_name, org_usr.email, org_usr.username,
                org_usr.created_at as organization_created_at, org_usr.password as organization_password, r.name, u.computer_name, e.mobile_os
                FROM employees e
                JOIN users u ON u.id = e.user_id
				JOIN user_role ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                JOIN organizations o ON o.id = e.organization_id
                JOIN users org_usr ON org_usr.id = o.user_id
                WHERE (r.name = 'Manager' OR r.name = 'manager')
                AND e.organization_id IN (${resellersOrganizationIds})
        `;
        return mySql.query(query);
    }

    static getManagerStatisticsCount(resellersOrganizationIds) {
        let query = `
            SELECT COUNT(*) AS total
            FROM employees e
            JOIN users u ON u.id = e.user_id
            JOIN user_role ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE (r.name = 'Manager' OR r.name = 'manager')
            AND e.organization_id IN (${resellersOrganizationIds})
        `;
        return mySql.query(query);
    }

    static getAssignedEmployeeCount(employeeIds) {
        let query = `
            SELECT count(ae.id) as count, ae.to_assigned_id
                FROM assigned_employees ae
                WHERE ae.to_assigned_id IN (${employeeIds})
                GROUP BY ae.to_assigned_id;
        `;
        return mySql.query(query);
    }

}

module.exports = ExternalModel;