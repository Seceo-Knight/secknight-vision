const mySql = require('../../../../database/MySqlConnection').getInstance();
const moment = require('moment');

const biometricsAccessLogSchema = require('../../../../models/biometrics_access_logs.schema');
class InformationModel {

    /**
    * Get Employee Basic Information
    *
    * @function employeeBasicInfo
    * @memberof  InformationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    employeeBasicInfo(admin_id, location_id, department_id, role_id, name, skip, limit, to_assigned_id, sortColumn, sortOrder, status, employee_type, employee_ids = []) {
        let column, order;

        if (sortOrder === 'D') {
            order = `DESC`;
        } else {
            order = `ASC`;
        }

        switch (sortColumn) {
            case 'Full Name':
                column = `u.first_name`
                break;
            case 'Email':
                column = `u.a_email`
                break;
            case 'Location':
                column = `ol.name`
                break;
            case 'Department':
                column = `od.name`
                break;
            case 'Role':
                column = `rn.name`
                break;
            case 'EMP-Code':
                column = `e.emp_code`
                break;
            case 'Username':
                column = `u.username`
                break;
            default:
                column = `e.created_at`;
                order = `DESC`
                break;
        }

        let query;
        query = `SELECT e.id As id,u.id AS u_id,u.first_name,u.last_name,u.contact_number AS phone,u.a_email as email,u.contact_number AS phone,eps.details,
                    e.organization_id,e.location_id,ol.name AS location,e.department_id,e.emp_code,od.name AS department,u.address,
                    rn.name AS role,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count,CONCAT(u.first_name,' ', u.last_name) AS full_name,
                    (SELECT COUNT(id) FROM employees WHERE organization_id=${admin_id}) as org_total_count, e.geolocation,u.email AS employee_unique_id
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    INNER JOIN roles rn ON rn.id=ur.role_id
                    LEFT JOIN employee_payroll_settings eps ON eps.employee_id=e.id
                    JOIN organization_settings os ON e.organization_id=os.organization_id              
                    WHERE e.organization_id=${admin_id}`;
        if (location_id != 0) query += ` AND e.location_id = (${location_id})`;
        if (role_id && role_id != 0) query += ` AND ur.role_id= ${role_id}`;
        if (department_id != 0) query += ` AND e.department_id =(${department_id})`;
        if (name) query += ` AND (u.first_name LIKE '%${name}%' OR u.last_name LIKE '%${name}%' OR u.a_email LIKE '%${name}%' OR e.emp_code LIKE '%${name}%' 
                                OR CONCAT(u.first_name,' ',u.last_name) LIKE '%${name}%')`;
        if (status) query += ` AND u.status=${status}`;
        if (employee_type != 0) query += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`;
        if (employee_ids.length) {
            query += ` AND e.id IN( ${employee_ids} ) `;
        }
        //  if (employee_type != 0)query +=` AND JSON_CONTAINS(details, ${employee_type},'$.type') = 1`;
        query += ` GROUP BY e.id`;
        query += ` ORDER BY ${column} ${order}`;
        // query += ` LIMIT ${skip},${limit};`
        if (limit) {
            query += ` LIMIT ${skip},${limit};`;
        };

        if (to_assigned_id) {
            query = `SELECT e.id As user_id, u.id AS u_id,a.to_assigned_id, u.first_name,u.first_name AS name,u.last_name,u.a_email as email,u.contact_number AS phone,u.date_join,u.address,u.photo_path,u.status, e.organization_id,eps.details,
                    e.location_id,ol.name AS location,e.department_id,e.emp_code,e.shift_id,e.timezone,e.tracking_mode,e.tracking_rule_type,od.name AS department,ur.role_id,JSON_EXTRACT(os.rules,'$.ideal_time') as ideal_time,
                    rn.name AS role,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count,CONCAT(u.first_name, ' ', u.last_name) AS full_name,JSON_EXTRACT(os.rules,'$.offline_time') as offline_time,e.software_version, e.geolocation,u.email AS employee_unique_id
                    FROM assigned_employees a
                    INNER JOIN employees e ON e.id=a.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles rn ON rn.id=ur.role_id
                    LEFT JOIN employee_payroll_settings eps ON eps.employee_id=e.id
                    JOIN organization_settings os ON e.organization_id=os.organization_id
                    WHERE e.organization_id=${admin_id} AND a.to_assigned_id=${to_assigned_id}`;

            if (location_id) query += ` AND e.location_id=(${location_id})`;
            if (department_id) query += ` AND e.department_id=(${department_id})`;
            if (name) query += ` AND u.first_name LIKE '%${name}%'`;
            if (status) query += ` AND u.status=${status}`;
            if (employee_type != 0)` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`;
            if (employee_ids.length) {
                query += ` AND e.id IN( ${employee_ids} ) `;
            }
            query += ` GROUP BY e.id`;
            query += ` ORDER BY ${column} ${order}`;
            if (limit) {
                query += ` LIMIT ${skip},${limit};`;
            }

        }

        return mySql.query(query);
    }

    /**
    * Update Employee Basic Information
    *
    * @function updateEmployeeBasicInfo
    * @memberof  InformationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateEmployeeBasicInfo(id, first_name, last_name) {
        let query = `Update users SET first_name=(?), last_name=(?) WHERE id=(?)`;
        return mySql.query(query, [first_name, last_name, id]);
    }

    /**
    * Update Location Department
    *
    * @function updateLocationDepartment
    * @memberof  InformationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateLocationDepartment(id, location_id, department_id) {
        let query = `Update employees SET location_id=(?), department_id=(?) WHERE id=(?)`;
        return mySql.query(query, [location_id, department_id, id]);
    }

    /**
    * Get Employee details
    *
    * @function getBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @returns {Array} -  return promise.
    */
    getBasicInfo(organization_id, employee_id) {
        return mySql.query(`SELECT id, employee_id, organization_id, esi_applicable, pf_applicable, details, settings 
                            FROM employee_payroll_settings 
                            WHERE employee_id=? AND organization_id=?`, [employee_id, organization_id])
    }

    /**
    * Add Employee basic details
    *
    * @function addBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @param {*} details
    * @returns {8} -  return promise.
    */
    addBasicInfo(organization_id, employee_id, details, settings, eligible_esi, eligible_pf) {
        let query = `INSERT INTO employee_payroll_settings
                    (employee_id, organization_id,details,settings,esi_applicable,pf_applicable)
                    VALUES(?,?,?,?,?,?)`
        return mySql.query(query, [employee_id, organization_id, details, settings, eligible_esi, eligible_pf])
    }

    /**
    * Update Employee basic details
    *
    * @function updateBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @param {*} details
    * @returns {Array} -  return promise.
    */
    updateBasicInfo(organization_id, employee_id, details, settings, eligible_esi, eligible_pf) {
        let query = `UPDATE employee_payroll_settings
                     SET details=?, settings=? ,esi_applicable=? ,pf_applicable=? 
                     WHERE employee_id=?  AND organization_id=?`
        return mySql.query(query, [details, settings, eligible_esi, eligible_pf, employee_id, organization_id]);
    }

    /**
    * Update Employee basic details
    *
    * @function updateBasicInfo
    * @memberof  InformationModel
    * @param {Number} employee_id
    * @param {String} phone
    * @param {String} email
    * @param {String} address
    * @returns {Array} -  return promise.
    */
    updateUserInfo(employee_id, phone, email, address) {
        let query = `UPDATE users SET a_email=?, contact_number=?, address=?
                     WHERE id=?`
        return mySql.query(query, [email, phone, address, employee_id]);
    }

    getBasicInfoByEmpCode({ organization_id, emp_codes }) {
        let query = `SELECT eps.id,eps.employee_id ,eps.details, e.emp_code ,u.email AS employee_unique_id
                     FROM employee_payroll_settings eps 
                     INNER JOIN employees e ON e.id =eps.employee_id
                     INNER JOIN users u ON u.id=e.user_id
                     WHERE e.organization_id=?  AND u.email IN (?) `
        return mySql.query(query, [organization_id, emp_codes])
    }



    /**
    * Update Employee basic details
    *
    * @function bulkUpdateBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @param {*} details
    * @returns {Array} -  return promise.
    */
    bulkUpdateBasicInfo(organization_id, employee_id, details) {
        let query = `UPDATE employee_payroll_settings
                     SET details=?
                     WHERE employee_id=?  AND organization_id=?`
        return mySql.query(query, [details, employee_id, organization_id]);
    }

    employeeDetails(employee_id, organization_id) {
        let query = `SELECT e.id As id, u.id AS u_id, concat(u.first_name,' ',u.last_name) AS name, u.status, e.organization_id, 
                     e.location_id, ol.name AS location, rn.name AS role,rn.type AS role_type, e.department_id, od.name AS department, e.emp_code, u.date_join, 
                     bd.bank_name, bd.account_number, bd.ifsc_code, bd.address, u.contact_number AS phone, u.a_email as email, 
                     ed.family, ed.experience, ed.qualification, eps.pf_applicable AS eligible_pf,  eps.esi_applicable AS eligible_esi,
                     eps.details, eps.salary_components, JSON_UNQUOTE(JSON_EXTRACT(eps.settings, "$.pf_date_joined")) AS pf_date_joined,
                     JSON_UNQUOTE(JSON_EXTRACT(ops.settings, "$.isCustomSalary")) AS isCustomSalary
                     FROM employees e
                     INNER JOIN users u ON u.id=e.user_id
                     INNER JOIN user_role ur ON ur.user_id=u.id
                     INNER JOIN roles rn ON rn.id=ur.role_id
                     INNER JOIN organization_locations ol ON e.location_id=ol.id
                     INNER JOIN organization_departments od ON od.id=e.department_id
                     LEFT JOIN bank_account_details bd ON bd.employee_id=e.id
                     LEFT JOIN employee_payroll_settings eps ON eps.employee_id=e.id
                     LEFT JOIN employee_details ed ON ed.employee_id=e.id
                     LEFT JOIN organization_payroll_settings ops ON e.organization_id=ops.organization_id
                     WHERE e.id=? AND e.organization_id=? GROUP by e.id`;
        return mySql.query(query, [employee_id, organization_id]);
    }

    orgDetails({ organization_id }) {
        const query = `SELECT contract_scheme_id
                     FROM organization_payroll_settings
                     WHERE organization_id = ? AND contract_scheme_id IS NOT NULL`;

        return mySql.query(query, [organization_id]);
    }

    updateEmpTaxScheme({ organizationId, adminApprovedSchemeId, employeeId }) {
        const query = `UPDATE employee_payroll_settings eps
                     SET eps.admin_approved_scheme_id=?
                     WHERE organization_id = ? AND employee_id = ? 
                        AND eps.admin_approved_scheme_id IS NULL
                    `;

        return mySql.query(query, [adminApprovedSchemeId, organizationId, employeeId]);
    }

    deleteEmpTaxScheme({ organization_id, employee_id }) {
        const query = `UPDATE employee_payroll_settings eps
                    SET eps.admin_approved_scheme_id = null
                    WHERE organization_id = ? AND employee_id = ? 
                    `;

        return mySql.query(query, [organization_id, employee_id]);
    }

    /**
     * getEmployeeAssignedToManager- function to employee_ids for manager
     * 
     * @param {*} manager_id 
     * @param {*} role_id 
     * @returns Promise | null
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployeeAssignedToManager(manager_id, role_id) {
        const query = `
            SELECT 
                employee_id
            FROM assigned_employees
            WHERE 
                to_assigned_id = ? AND role_id = ?
        `;
        return mySql.query(query, [manager_id, role_id])
    }

    async getEmployeeData(employee_id, organization_id) {
        let query = `
            SELECT e.id, u.id as user_id, o.id as organization_id, pr.permission_id, bd.user_id as bio_user_id, bd.manual_status, e.timezone
                FROM employees e
                JOIN organizations o ON o.id = e.organization_id
                JOIN users u ON u.id = e.user_id
                JOIN user_role ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                LEFT JOIN biometric_data bd ON bd.user_id = u.id                                   
                LEFT JOIN permission_role pr ON pr.role_id = r.id AND pr.permission_id = 215
                WHERE e.id = ${employee_id} AND r.name = "Employee" AND o.id = ${organization_id}
        `;
        return mySql.query(query); 
    }

    async insertBioMetricsData(user_id, organization_id, manualData) {
        let query = `
            INSERT INTO biometric_data (user_id, organization_id, manual_status) VALUES (${user_id}, ${organization_id}, '${JSON.stringify(manualData)}')
        `;
        return mySql.query(query); 
    }

    async updateBioMetricsData(user_id, organization_id, manualData) {
        let query = `
            UPDATE biometric_data SET manual_status = '${JSON.stringify(manualData)}' 
                WHERE user_id = ${user_id} AND organization_id = ${organization_id}
        `;
        return mySql.query(query); 
    }

    async getEmployeePasswordStatus(organization_id) {
        let query = `
            SELECT o.id, o.is_biometrics_employee 
            FROM organizations o
            WHERE o.id = ${organization_id}
        `;
        return mySql.query(query);
    }

    async updateEmployeePasswordStatus(organization_id, status) {
        let query = `
            UPDATE organizations
                SET is_biometrics_employee=${status}
                WHERE id = ${organization_id}
        `;
        return mySql.query(query);
    }

    async fetchOrganizationBioMetricsConfirmationStatus(organization_id) {
        let query = `
            SELECT o.id, o.biometrics_confirmation_status 
            FROM organizations o
            WHERE o.id = ${organization_id}
        `;
        return mySql.query(query);
    }
    async updateOrganizationBioMetricsConfirmationStatus(organization_id, status) {
        let query = `
            UPDATE organizations
                SET biometrics_confirmation_status=${status}
                WHERE id = ${organization_id}
        `;
        return mySql.query(query);
    }

    async fetchOrganizationCameraOverLayStatus(organization_id) {
        let query = `
            SELECT o.id, o.camera_overlay_status 
            FROM organizations o
            WHERE o.id = ${organization_id}
        `;
        return mySql.query(query);
    }
    async updateOrganizationCameraOverLayStatus(organization_id, status) {
        let query = `
            UPDATE organizations
                SET camera_overlay_status=${status}
                WHERE id = ${organization_id}
        `;
        return mySql.query(query);
    }

    
    async checkSameNameDepartment(organization_id, name) {
        let query = `
            SELECT id, name
                FROM biometric_department
                WHERE organization_id = ${organization_id} and name = "${name}"
        `;
        return mySql.query(query);
    }

    async addBiometricsDepartment(organization_id, name, is_main) {
        let query = `
            INSERT INTO biometric_department
            (organization_id, name, is_main) VALUES (${organization_id}, "${name}", ${is_main});
        `;
        return mySql.query(query);
    }

    async getBiometricsDepartment(organization_id, department_id) {
        let query = `
            SELECT * FROM biometric_department WHERE organization_id=${organization_id}
        `;
        if(department_id) query += ` AND id=${department_id}`
        return mySql.query(query);
    }

    async updateBiometricsDepartment(department_id, name, is_main) {
        let query = `
            UPDATE biometric_department SET name="${name}", is_main=${is_main} WHERE id = ${department_id}
        `;
        return mySql.query(query);
    }

    async getBiometricsAccessLogSchema(employee_id, date, organization_id) {
        return biometricsAccessLogSchema.aggregate([
            {
                "$match": {
                    employee_id : +employee_id,
                    organization_id: +organization_id,
                    yyyymmdd: +date.split('-').join('')
                }
            },
            {
                "$sort": { createdAt: -1 }
            }
        ])
    }

    async getTotalAccessLogsCount(start_date, end_date, organization_id, department_id) {
        return biometricsAccessLogSchema.aggregate([
            {
                "$match": {
                    organization_id: +organization_id,
                    department_id: +department_id,
                    yyyymmdd: {
                        "$gte": +start_date.split('-').join(""),
                        "$lte": +end_date.split('-').join("")
                    },
                },
            },
            {
                "$count": "totalDocuments",
            }
        ])
    }

    async getTotalDepartmentAccess(start_date, end_date, organization_id, department_id, skip, limit) {
        return biometricsAccessLogSchema.aggregate([
            {
                "$match": {
                    organization_id: +organization_id,
                    department_id: +department_id,
                    yyyymmdd: {
                        "$gte": +start_date.split('-').join(""),
                        "$lte": +end_date.split('-').join("")
                    },
                },
            },
            {
                "$group": {
                    "_id": "$employee_id",
                    "total_access": { "$sum": 1 }
                }
            },
            { "$skip": +skip },
            { "$limit": +limit }
        ])
    }

    async getTotalDepartmentAccessCount(start_date, end_date, organization_id, department_id) {
        return biometricsAccessLogSchema.aggregate([
            {
                "$match": {
                    organization_id: +organization_id,
                    department_id: +department_id,
                    yyyymmdd: {
                        "$gte": +start_date.split('-').join(""),
                        "$lte": +end_date.split('-').join("")
                    },
                },
            },
            {
                "$group": {
                    "_id": "$employee_id",
                    "total_access": { "$sum": 1 }
                }
            },
            {
                "$count": "totalDocuments",
            }
        ])
    }

    async getBiometricsDepartmentData(department_id, organization_id) {
        let query = `
            SELECT id, name FROM biometric_department WHERE organization_id=${organization_id}
        `;
        if(department_id.length) query += ` AND id IN (${department_id})`
        return mySql.query(query);
    }


    async getEmployeeTimezone (employee_ids, organization_id) {
        let query = `
            SELECT e.id, e.timezone
                FROM employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.id IN (${employee_ids}) AND e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    async getOrganizationDepartment(organization_id) {
        let query = `
            SELECT od.name
                FROM organization_departments od
                WHERE od.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    getCheckInOutRecords(date, employee_id) {
        let query = `
            SELECT * FROM hrms_employee_attendance WHERE employee_id = ${employee_id} AND date = "${date}"
        `;
        return mySql.query(query);
    }

    getEmployeeDetails (employee_id, organization_id) {
        let query = `
            SELECT e.id as employee_id, e.organization_id, u.first_name, u.last_name, u.email
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.organization_id=${organization_id} AND e.id IN (${employee_id})
        `;
        return mySql.query(query);
    }

}

module.exports = new InformationModel;