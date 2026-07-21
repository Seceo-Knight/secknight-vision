const { cos } = require('mathjs');

const mySql = require('../../../../database/MySqlConnection').getInstance();

class BankdetailModel {

    fetchbankDetailsList(location_id, role_id, department_id, name, status, sortColumn, sortOrder, skip, limit, organization_id, employee_type, employee_ids = []) {

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
            case 'Bankname':
                column = `bd.bank_name`
                break;
            default:
                column = `e.created_at`;
                order = `DESC`
                break;
        }

        let query = "";
        query += `SELECT e.id As id,u.id AS u_id,concat(u.first_name,' ',u.last_name) AS name,u.status, e.organization_id,
                        e.location_id,ol.name AS location,e.department_id,od.name AS department,e.emp_code,eps.details, 
                        bd.bank_name,bd.account_number,bd.ifsc_code,bd.address,
                        JSON_UNQUOTE(JSON_EXTRACT(eps.details, "$.salaryRevision.effectiveDate")) as effective_date,
                        JSON_UNQUOTE(JSON_EXTRACT(eps.settings, "$.pf_date_joined")) as pf_joining, 
                        JSON_UNQUOTE(JSON_EXTRACT(eps.settings, "$.ptSettings.ptAllowed")) as eligible_pt, eps.pf_applicable AS eligible_pf, eps.esi_applicable AS eligible_esi,  
                        (COUNT( e.id ) OVER()) AS total_count, (SELECT COUNT(id) FROM employees 
                        WHERE organization_id='${organization_id}') as org_total_count,u.email AS employee_unique_id
                        FROM employees e
                        LEFT JOIN bank_account_details bd ON bd.employee_id=e.id
                        LEFT JOIN employee_payroll_settings eps ON eps.employee_id=e.id
                        INNER JOIN users u ON u.id=e.user_id
                        INNER JOIN organization_locations ol ON e.location_id=ol.id
                        INNER JOIN organization_departments od ON od.id=e.department_id
                        INNER JOIN user_role ur ON ur.user_id=u.id
                        INNER JOIN roles rn ON rn.id=ur.role_id
                        LEFT JOIN organization_shifts osh ON osh.id=e.shift_id
                        JOIN organization_settings os ON e.organization_id=os.organization_id              
                        WHERE e.organization_id=${organization_id}`;
        if (location_id && location_id != 0) query += ` AND e.location_id in(${location_id})`;
        if (role_id && role_id != 0) query += ` AND ur.role_id= ${role_id}`;
        if (department_id && department_id != 0) query += ` AND e.department_id  in(${department_id})`;
        if (name) query += ` AND (u.first_name LIKE '%${name}%' OR u.last_name LIKE '%${name}%' OR bd.bank_name LIKE '%${name}%' OR bd.account_number LIKE '%${name}%' OR bd.ifsc_code LIKE '%${name}%' 
                             OR bd.address LIKE '%${name}%' OR CONCAT(u.first_name,' ',u.last_name) LIKE '%${name}%')`;
        if (status) query += ` AND u.status=${status}`;
        if (employee_type != 0) query += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`
        if (employee_ids.length) {
            query += ` AND e.id IN( ${employee_ids} ) `;
        }
        query += ` GROUP BY e.id`;
        query += ` ORDER BY ${column} ${order}`;
        if ((skip || skip == 0) && limit) query += ` LIMIT ${skip},${limit};`;

        return mySql.query(query);
    }

    addbankDetails(employee_id, bank_name, account_number, ifsc_code, address, organization_id) {
        let query = 'INSERT INTO `bank_account_details` (`employee_id`, `bank_name`, `account_number`, `ifsc_code`, `address`, `organization_id`) VALUES (?, ?, ?, ?, ?, ?)';
        return mySql.query(query, [employee_id, bank_name, account_number, ifsc_code, address, organization_id]);
    }

    deleteBankDetails(ids, organization_id) {
        let query = `DELETE FROM bank_account_details
                     WHERE id=(?)`;
        return mySql.query(query, [ids]);
    }

    updateBankDetails(employee_id, bank_name, account_number, ifsc_code, address, organization_id) {
        let query = `Update bank_account_details SET bank_name=(?), account_number=(?), ifsc_code=(?), address=(?)
                     WHERE employee_id =(?) AND organization_id=(?)`;
        return mySql.query(query, [bank_name, account_number, ifsc_code, address, employee_id, organization_id]);
    }

    getBankDetails(employee_id, organization_id) {
        let query = `SELECT account_number FROM bank_account_details 
                      WHERE employee_id=? AND organization_id=?`;
        return mySql.query(query, [employee_id, organization_id]);
    }

    getEmployeesByEmpCode({ organization_id, codes }) {
        let query = `SELECT id AS employeeId,emp_code FROM employees WHERE organization_id=? AND id IN(?) `;
        return mySql.query(query, [organization_id, codes]);
    }

    getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids }) {
        let query = `SELECT e.id AS employeeId,e.emp_code ,u.email AS employee_unique_id
                     FROM employees e
                     INNER JOIN users u ON u.id=e.user_id
                     WHERE e. organization_id=? AND u.email IN(?)`;
        return mySql.query(query, [organization_id, employee_unique_ids]);
    }

    getBankDetailsByEmpIds({ ids, organization_id }) {
        let query = `SELECT employee_id, bank_name, account_number, ifsc_code, address FROM bank_account_details
                      WHERE employee_id IN(?) AND organization_id=?`;
        return mySql.query(query, [ids, organization_id]);
    }

    getBankDetailsByEmpUniqueIds({ employee_unique_ids, organization_id }) {
        let query = `SELECT b.employee_id, b.bank_name, b.account_number, b.ifsc_code, b.address
                     FROM bank_account_details b
                     INNER JOIN employees e ON e.id=b.employee_id
                     INNER JOIN users u ON u.id=e.user_id
                     WHERE u.email IN(?) AND e.organization_id=?`;

        return mySql.query(query, [employee_unique_ids, organization_id]);
    }

    bulkInsertBankDetails(params) {
        let query = 'INSERT INTO `bank_account_details` (`employee_id`, `bank_name`, `account_number`, `ifsc_code`, `address`, `organization_id`) VALUES ?';
        return mySql.query(query, [params]);

    }

    getBasicDetailsByEmpIds({ ids, organization_id }) {
        let query = `SELECT e.id,e.user_id ,eps.details,u.address,eps.employee_id ,
                     u.contact_number AS phone ,u.a_email as email,u.email AS employee_unique_id

                     FROM employees e
                     INNER JOIN users u ON u.id=e.user_id
                     LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id
                     
                     WHERE e.id IN(?) AND  e.organization_id=?`;
        return mySql.query(query, [ids, organization_id]);
    }

    bulkInsertBasicDetails(params) {
        let query = 'INSERT INTO employee_payroll_settings (employee_id, organization_id,details) VALUES ?';
        return mySql.query(query, [params]);
    }

    updateUsers(id, a_email, contact_number) {
        let query = 'UPDATE users SET ';
        let params = [];
        let queryArr = [];
        if (a_email) {
            queryArr.push(` a_email= ?`);
            params.push(a_email);
        }
        if (contact_number) {
            queryArr.push(` contact_number= ?`);
            params.push(contact_number);
        }
        if (params.length !== 0 && queryArr.length !== 0) {
            query += queryArr
            params.push(id)
            query += ` WHERE id=?`
            return mySql.query(query, params);
        }
        return;
    }

    getUserByEmail(emailList) {
        let query = `
        SELECT e.id ,u.a_email 
        FROM users u 
        INNER JOIN employee ON u.id =e.user_id
        WHERE a_email IN (?)
        `
        return mySql.query(query, [emailList]);
    }

    bulkUpdateBankDetails(employee_id, bank_name, account_number, ifsc_code, address, organization_id) {

        let params = [];
        let query = ` UPDATE bank_account_details SET  `;
        let queryArray = [];

        if (bank_name) {
            queryArray.push(` bank_name = ?`);
            params.push(bank_name)
        }

        if (account_number) {
            queryArray.push(` account_number = ?`);
            params.push(account_number)
        }

        if (ifsc_code) {
            queryArray.push(` ifsc_code = ?`);
            params.push(ifsc_code)
        }

        if (address) {
            queryArray.push(` address= ? `);
            params.push(address)
        }

        if (queryArray.length != 0 && params.length != 0) {
            query += queryArray;

            query += `  WHERE employee_id = ? AND organization_id = ? `
            params.push(employee_id, organization_id);


            console.log(query, "===", params);


            return mySql.query(query, params);

        }

        return null;

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
}

module.exports = new BankdetailModel;
