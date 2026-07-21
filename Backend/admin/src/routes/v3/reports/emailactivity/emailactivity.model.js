const mySql = require('../../../../database/MySqlConnection').getInstance();
const EmailActivityModel = require('../../../../models/email_activity.schema');


class EmailModel {
    getMails(match, skip, limit) {
        return EmailActivityModel
            .find(match)
            .select(`attachments subject body mail_time date computer from to client_type type employee_id`)
            .skip(skip)
            .limit(limit)
            .lean();
    }

    getEmpDetails(ids) {
        let query = `
                    SELECT e.id, CONCAT(u.first_name, ' ', u.last_name) AS name,ol.name AS location_name,od.name AS department_name
                    FROM employees as e
                    LEFT JOIN users AS u ON u.id = e.user_id
                    LEFT JOIN organization_locations ol on ol.id=e.location_id
                    LEFT JOIN organization_departments od on od.id=e.department_id
                    WHERE e.id IN (${ids.toString()})
                `;
        return mySql.query(query);
    }

    getCount(match) {
        return EmailActivityModel.countDocuments(match);
    }

    unicClients(organization_id) {
        return EmailActivityModel.distinct("client_type", { "organization_id": organization_id });
    }

    emailDataGraph(organization_id, startDate, endDate, type, location_id, department_id, employee_id, client_type, employee_ids) {
        let match = {
            organization_id: organization_id,
            type: type,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        };
        if (location_id) match = { location_id: location_id, ...match };
        if (department_id) match = { department_id: department_id, ...match };
        if (employee_id) {
            match = { employee_id: employee_id, ...match };
        } else {
            if (employee_ids) match = { employee_id: { "$in": employee_ids }, ...match };
        }

        if (client_type) match = { client_type: client_type, ...match };

        return EmailActivityModel.aggregate([{ $match: match }, { $group: { _id: '$date', count: { $sum: 1 } } }]);
    }

    getAssignedEmployees(location_id, department_id, to_assigned_id, employee_id, role_id) {
        let query = `SELECT ae.employee_id
                    FROM assigned_employees AS ae
                    LEFT JOIN employees AS e  ON e.id = ae.employee_id
                    WHERE ae.to_assigned_id=${to_assigned_id} AND role_id=${role_id}`;

        if (location_id) {
            query += ` AND e.location_id=${location_id}`;
        }
        if (department_id) {
            query += ` AND e.department_id=${department_id}`;
        }
        if (employee_id) {
            query += ` AND e.id=${employee_id}`;
        }

        return mySql.query(query);
    }
}
module.exports = new EmailModel;

// EmailActivityModel.aggregate([
//     {
//         $match: { type: 2 }
//     },
//     {
//         $group: {
//             _id: '$date',
//             count: {
//                 $sum: 1
//             }
//         }
//     },
// ]).exec((err, data) => {
//     console.log('------------', err, data)
// });