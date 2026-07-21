
// Imports
const mySql = require('../../../../database/MySqlConnection').getInstance();


/**
 * @class AnnouncementModel
 * Model class for all the queries for the Api's
 */
class AnnouncementModel {

    getAnnouncementData({
        title, id, start_date, end_date, location_id, type,
        department_id, is_active, organization_id
    }) {
        let query = `SELECT * FROM announcements
                WHERE organization_id = ${organization_id} `;

        if (id) query += ` AND id = ${id} `;
        if (type) query += ` AND type = ${type} `;
        if (title) query += ` AND title LIKE ${title} `;
        if (end_date) query += ` AND end_date < ${end_date} `;
        if (is_active >= 0) query += ` AND is_active = ${is_active} `;
        if (start_date) query += ` AND start_date > ${start_date} `;
        if (location_id) query += ` AND (location_id = ${location_id} OR location_id IS NULL)`;
        if (department_id) query += ` AND (department_id = ${department_id} OR department_id IS NULL) `;

        return mySql.query(query);
    }


    getWorkAnniversaryData({ organization_id, months }) {
        let query = `SELECT CONCAT(u.first_name,' ', u.last_name) AS name,
                u.date_join AS date 
                FROM users AS u 
                INNER JOIN employees AS e ON u.id = e.user_id 
                WHERE e.organization_id = ${organization_id} 
                AND MONTH(u.date_join) IN (${months}) `;

        return mySql.query(query);
    }


    getBirthdaysData({ organization_id, months }) {
        let query = `SELECT CONCAT(u.first_name,' ', u.last_name) AS name,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.details, '$.date_of_birth')) as date
                    FROM employees e
                    INNER JOIN users u ON u.id = e.user_id
                    INNER JOIN employee_payroll_settings eps ON e.id = eps.employee_id
                    WHERE e.organization_id = ${organization_id} 
                    AND MONTH(CAST(JSON_EXTRACT(eps.details, '$.date_of_birth') AS DATE))
                    IN (${months})`;

        return mySql.query(query);
    }


    checkLocationAndDepartment({ location_id, department_id, organization_id }) {
        let query = `SELECT o.id 
                FROM organizations o
                LEFT JOIN organization_locations ol ON ol.organization_id = o.id
                LEFT JOIN organization_departments od ON od.organization_id = od.id 
                WHERE o.id = ${organization_id} `

        if (location_id) query += ` AND ol.id = ${location_id} `;
        if (department_id) query += ` AND od.id = ${department_id} `;

        return mySql.query(query);
    }


    createAnnouncements({
        title, start_date, end_date, location_id, department_id,
        type, description, organization_id, user_id, is_active = 1
    }) {
        let query = `INSERT INTO announcements 
                (title, start_date, end_date, location_id, department_id,
                type, description, organization_id, published_by, is_active)
                VALUES (?) `;

        return mySql.query(query, [[title, start_date, end_date, location_id, department_id,
            type, description, organization_id, user_id, is_active]]);
    }


    updateAnnouncements({ id, title, start_date, end_date, location_id, department_id,
        type, description, is_active, organization_id }) {
        let query = `UPDATE announcements SET `;

        let updateValues = [];
        if (title) {
            query += ` title = ? `;
            updateValues.push(title);
        }
        if (start_date) {
            query += updateValues.length ? `, start_date = ? ` : ` start_date = ? `;
            updateValues.push(start_date);
        }
        if (end_date) {
            query += updateValues.length ? `, end_date = ? ` : ` end_date = ? `;
            updateValues.push(end_date);
        }
        if (location_id) {
            query += updateValues.length ? `, location_id = ? ` : ` location_id = ? `;
            updateValues.push(location_id);
        }
        if (department_id) {
            query += updateValues.length ? `, department_id = ? ` : ` department_id = ? `;
            updateValues.push(department_id);
        }
        if (type) {
            query += updateValues.length ? `, type = ? ` : ` type = ? `;
            updateValues.push(type);
        }
        if (description) {
            query += updateValues.length ? `, description = ? ` : ` description = ? `;
            updateValues.push(description);
        }
        if (is_active) {
            query += updateValues.length ? `, is_active = ? ` : ` is_active = ? `;
            updateValues.push(is_active);
        }

        query += ` WHERE id = ${id} AND organization_id = ${organization_id} ;`;

        return mySql.query(query, updateValues);
    }


    deleteAnnouncements({ id, organization_id }) {
        let query = `DELETE FROM announcements 
            WHERE id = ? AND organization_id = ? ;`;

        return mySql.query(query, [id, organization_id]);
    }
}

// Exports
module.exports = AnnouncementModel;