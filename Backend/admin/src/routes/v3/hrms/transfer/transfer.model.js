const mySql = require('../../../../database/MySqlConnection').getInstance();


class TransferModel {

    fetchTransferList(organization_id) {
        let query = `SELECT t.id,t.employee_id,t.transfer_date,t.transfer_department,od.name AS department_name,
                     ol.name AS location_name,t.transfer_location,t.description,u.first_name,u.last_name
                     FROM transfer t 
                     LEFT JOIN organization_departments od ON od.id=t.transfer_department 
                     INNER JOIN organization_locations ol ON ol.id=t.transfer_location 
                     LEFT JOIN employees em ON em.id=t.employee_id
                     INNER JOIN users u ON u.id=em.user_id
                     WHERE t.organization_id='${organization_id}'`;
        return mySql.query(query, [organization_id]);
    }

    fetchTransferListById(transfer_id, organization_id) {
        let query = `SELECT t.id,t.employee_id,t.transfer_date,t.transfer_department,od.name AS department_name,
                     ol.name AS location_name,t.transfer_location,t.description 
                     FROM transfer t 
                     LEFT JOIN organization_departments od ON od.id=t.transfer_department 
                     INNER JOIN organization_locations ol ON ol.id=t.transfer_location 
                     WHERE t.organization_id='${organization_id}'`;
        if (transfer_id) query += ` AND t.id ='${transfer_id}'`;
        return mySql.query(query, [transfer_id]);
    }

    addTransfer(employee_id, transfer_date, transfer_department, transfer_location, description, organization_id) {
        let query = 'INSERT INTO `transfer` (`employee_id`, `transfer_date`, `transfer_department`, `transfer_location`, `description`, `organization_id`) VALUES (?, ?, ?, ?, ?, ?)';
        return mySql.query(query, [employee_id, transfer_date, transfer_department, transfer_location, description, organization_id]);
    }

    updateTransfer(id, employee_id, transfer_date, transfer_department, transfer_location, description) {
        let query = `UPDATE transfer SET employee_id=(?), transfer_date=(?), transfer_department=(?), transfer_location=(?), description=(?)
                     WHERE id =(?)`;
        return mySql.query(query, [employee_id, transfer_date, transfer_department, transfer_location, description, id]);
    }

    deleteTransfer(transfer_id) {
        let query = `DELETE FROM transfer
                     WHERE id =(?)`;
        return mySql.query(query, [transfer_id]);
    }

}

module.exports = new TransferModel;