const mySql = require('../../../../database/MySqlConnection').getInstance();

class ComplaintModel {

    fetchComplaintsList(organization_id) {
        let query = `SELECT c.id,c.complaint_from,c.title,c.complaint_date,c.complaint_against,c.description,c.status,c.organization_id,u.first_name,u.last_name,us.first_name as firstname,us.last_name as lastname
         FROM organization_complaint_warnings c
         LEFT JOIN employees e ON e.id=c.complaint_from
         INNER JOIN users u ON u.id=e.user_id
         LEFT JOIN employees em ON em.id=c.complaint_against
         INNER JOIN users us ON us.id=em.user_id
         WHERE c.organization_id =(?) AND c.type =(?)`;
        return mySql.query(query, [organization_id, 1]);
    }

    addComplaints(complaint_from, title, complaint_date, complaint_against, description, status, type, organization_id) {
        let query = 'INSERT INTO `organization_complaint_warnings` (`complaint_from`, `title`, `complaint_date`, `complaint_against`, `description`, `status`, `type`, `organization_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        return mySql.query(query, [complaint_from, title, complaint_date, complaint_against, description, status, type, organization_id]);
    }

    deleteComplaints(complaint_id) {
        let query = `DELETE FROM organization_complaint_warnings
                     WHERE id =(?)`;
        return mySql.query(query, [complaint_id]);
    }

}

module.exports = new ComplaintModel;