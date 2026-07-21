const mySql = require('../../../../database/MySqlConnection').getInstance();

class EmailReportsModel {
    addEmailReport(organization_id, name, frequency, recipients, content, filter_type, created_by, report_types, custom, location_ids, shift_ids ) {

        let query = `INSERT INTO email_reports (organization_id, name, frequency, recipients,content,filter_type,created_by, report_types, custom, location_ids, shift_ids)
                    VALUES (${organization_id},'${name}', ${frequency}, '${recipients}','${content}',${filter_type},${created_by}, '${report_types}', '${custom}', '${location_ids?.length ? location_ids.join(',') : ''}', '${shift_ids?.length ? shift_ids.join(',') : ''}')`;

        return mySql.query(query);
    }

    addUserToReports(users) {

        return mySql.query(`INSERT INTO employee_dept_email_reports(email_report_id, employee_id)
                    VALUES ?`, [users]);
    }

    addDeptToReports(departments) {

        return mySql.query(`INSERT INTO employee_dept_email_reports (email_report_id,department_id)
                    VALUES ?`, [departments]);
    }

    getReport(organization_id, skip, limit, name, column, order, user_id) {
        let query = `SELECT id,organization_id,name,frequency,recipients,content,filter_type,(COUNT(id) OVER()) AS total_count, report_types
                    FROM email_reports
                    WHERE organization_id=${organization_id}`;

        if (name) query += ` AND (name LIKE '%${name}%' OR recipients LIKE '%${name}%')`;
        if (user_id) query += ` AND created_by = ${user_id}`;
        query += ` ORDER BY ${column} ${order}`;
        query += ` LIMIT ${skip}, ${limit}`;

        return mySql.query(query);
    }

    getReportUser(email_report_id) {
        let query = `SELECT e.id,u.first_name,u.last_name,u.a_email,u.photo_path
                    FROM employee_dept_email_reports ud
                    INNER JOIN employees e ON e.id=ud.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    WHERE ud.email_report_id=${email_report_id}`;

        return mySql.query(query);
    }

    getReportDept(email_report_id) {
        let query = `SELECT d.id,d.name
                    FROM employee_dept_email_reports ud
                    INNER JOIN organization_departments d ON d.id=ud.department_id
                    WHERE email_report_id=${email_report_id}`;

        return mySql.query(query);
    }

    deleteReports(email_report_ids) {
        let query = `DELETE FROM email_reports
                    WHERE id IN (${email_report_ids})`;

        return mySql.query(query);
    }

    report(condition) {
        let query = `SELECT id,organization_id,name,frequency,recipients,content,filter_type, report_types,custom, location_ids, shift_ids
                    FROM email_reports
                    WHERE ${condition}`

        return mySql.query(query);
    }

    updateEmailReport(name, frequency, recipients, content, filter_type, email_report_id, report_types, custom, location_ids, shift_ids) {
        const sets = [];
        const params = [];
        if (name) { sets.push('name = ?'); params.push(name); }
        if (frequency) { sets.push('frequency = ?'); params.push(frequency); }
        if (recipients) {
            sets.push('recipients = ?');
            params.push(Array.isArray(recipients) ? recipients.join(',') : recipients);
        }
        if (content) { sets.push('content = ?'); params.push(content); }
        if (filter_type) { sets.push('filter_type = ?'); params.push(filter_type); }
        if (report_types) {
            sets.push('report_types = ?');
            params.push(Array.isArray(report_types) ? report_types.join(',') : report_types);
        }
        sets.push('custom = ?');
        params.push(custom || null);
        if (location_ids?.length) { sets.push('location_ids = ?'); params.push(location_ids.join(',')); }
        if (shift_ids?.length) { sets.push('shift_ids = ?'); params.push(shift_ids.join(',')); }

        if (sets.length === 0) return Promise.resolve();

        params.push(email_report_id);
        const query = `UPDATE email_reports SET ${sets.join(', ')} WHERE id = ?`;
        return mySql.query(query, params);
    }

    deleteUserFromReport(employees, email_report_id = null) {
        let query = `DELETE FROM employee_dept_email_reports
                    WHERE employee_id IN (${employees})`;

        if (email_report_id) query += ` AND email_report_id = ${email_report_id} ;`;
        return mySql.query(query);
    }

    deleteDeptFromReport(depts, email_report_id = null) {
        let query = `DELETE FROM employee_dept_email_reports
                    WHERE department_id IN (${depts})`;

        if (email_report_id) query += ` AND email_report_id = ${email_report_id} ;`;
        return mySql.query(query);
    }

    searchByname(name, organization_id) {
        let query = `SELECT id 
                    FROM email_reports
                    WHERE organization_id=${organization_id} AND name='${name}'`;

        return mySql.query(query);
    }

    getReportsLocation(location_ids) {
        let query = `
            SELECT ol.id, ol.name
            FROM organization_locations ol
            WHERE ol.id IN (${location_ids})
        `;
        return mySql.query(query);
    }

    getReportsShift(shift_ids) {
        let query = `
            SELECT s.id, s.name
            FROM organization_shifts s
            WHERE s.id IN (${shift_ids})
        `;
        return mySql.query(query);
    }
}

module.exports = new EmailReportsModel;
