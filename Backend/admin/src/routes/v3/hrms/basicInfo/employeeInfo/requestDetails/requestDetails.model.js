// Request Details Model

const moment = require('moment');
const { RequestDetailsModel } = require('../../../../../../models/requestDetails.schema');
const mySql = require('../../../../../../database/MySqlConnection').getInstance();


class RequestDetails {

    /**
     * Create request details
     * @param {*} param 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    createRequestDetails(values) {
        return new RequestDetailsModel(values).save();
    }


    /**
     * Get Request details
     * @param {*} param 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getRequestDetails({ id, module_name, delete: deleteRequest, employee_id, status, type,
        updated_at, created_at, updated_by, organization_id, empIDs
    }) {
        let match = { organization_id };

        if (updated_at || created_at) {
            let startDate = moment(updated_at || created_at).startOf('day').toISOString();
            let endDate = moment(updated_at || created_at).endOf('day').toISOString();
            if (updated_at) match = { ...match, updated_date: { $gte: startDate, $lte: endDate } }
            if (created_at) match = { ...match, createdAt: { $gte: startDate, $lte: endDate } }
        }

        if (empIDs?.length) match = { ...match, employee_id: { $in: empIDs } };
        if (id) match = { ...match, _id: id };
        if (type) match = { ...match, type };
        if (updated_by) match = { ...match, updated_by };
        if (status) match = { ...match, status };

        /** Checking for same request with status pending */
        if (module_name || deleteRequest) {
            if (id || deleteRequest) return [];
            else match = { organization_id, module_name, employee_id, status: 1 };
        }

        return RequestDetailsModel.find(match);
    }

    /**
     * If request gets rejected/accepted
     * @param {*} data 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    updateRequest(data) {
        return data.save();
    }

    /**
     * updates request on id
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    updateRequestById({ id, data }) {
        let match = { _id: id };
        let update = { value: data };

        return RequestDetailsModel.findOneAndUpdate(match, update);
    }

    /**
     * Delete request
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    deleteRequest({ organization_id, id }) {
        let match = { organization_id, _id: id };

        return RequestDetailsModel.deleteOne(match);
    }

    /**
     * get Employee Details
     * @param {*} employee_id 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getEmployeeDetails(employee_id) {
        let query = `SELECT eps.details, ed.qualification, ed.family, ed.experience 
                    FROM employee_payroll_settings eps
                    LEFT JOIN employee_details ed ON eps.employee_id = ed.employee_id
                    WHERE eps.employee_id = ?`;

        return mySql.query(query, [employee_id]);
    }

    /**
     * Get name and emp_Code of emp
     * @param {*} empIDs 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getEmployee(empID, location_id = 0, department_id = 0) {
        let query = `SELECT e.id AS employee_id, e.emp_code,
                    CONCAT(u.first_name,' ',u.last_name) AS name `;

        if (location_id) query += ',ol.name AS value ';
        if (department_id) query += ', od.name AS value ';
        query += `FROM employees e
                LEFT JOIN users u ON e.user_id = u.id`;

        if (location_id) query += ` LEFT JOIN organization_locations ol ON ol.organization_id = e.organization_id`;
        if (department_id) query += ` LEFT JOIN organization_departments od ON od.organization_id = e.organization_id`;
        query += ` WHERE e.id = ? `;

        if (location_id) query += ` AND ol.id = ${location_id}`;
        if (department_id) query += ` AND od.id = ${department_id}`;

        return mySql.query(query, empID);
    }

    /**
     * Update Data
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    UpdateDetails({ module_name, value, employee_id, table_name }) {
        let query;
        if (table_name == 'users') {
            query = `UPDATE users u
                    LEFT JOIN employees e ON e.user_id = u.id 
                    SET u.${module_name} = '${value}'
                    WHERE e.id = ?`;
        }
        else if (table_name == 'employees') {
            query = `Update employees
                    SET ${module_name} = '${value}'
                    WHERE id = ?`;
        }
        else {
            query = `Update ${table_name}
                    SET ${module_name} = '${value}'
                    WHERE employee_id = ?`;
        }

        return mySql.query(query, [employee_id])
    }

    assignedEmployees(to_assigned_id, role_id) {
        let query = `SELECT employee_id 
        FROM assigned_employees
        WHERE to_assigned_id = ${to_assigned_id} 
        AND role_id = ${role_id}`;

        return mySql.query(query);
    }
}

//exports
module.exports = new RequestDetails();