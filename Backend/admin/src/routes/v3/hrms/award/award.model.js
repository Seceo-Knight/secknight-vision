const mySql = require('../../../../database/MySqlConnection').getInstance();

class AwardModel {

    getAwards(award_id, organization_id) {
        let query = `SELECT oa.id,oa.award_type,oa.employee_id,oa.gift,oa.cash,oa.date, 
                     oa.information,oa.award_photo,concat(u.first_name,' ',u.last_name) AS employee_name, e.emp_code 
                     FROM organization_awards oa LEFT JOIN employees e ON e.id=oa.employee_id 
                     LEFT JOIN users u ON e.user_id=u.id 
                     WHERE oa.organization_id ='${organization_id}'`;
        if (award_id) query += ` AND oa.id='${award_id}'`;
        return mySql.query(query);
    }

    addAward(award_type, employee_id, gift, cash, award_date, award_info, award_photo, organization_id) {
        let query = `INSERT INTO organization_awards (award_type, employee_id, gift, cash, date, information, award_photo, organization_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        return mySql.query(query, [award_type, employee_id, gift, cash, award_date, award_info, award_photo, organization_id]);
    }

    updateAward(award_id, award_type, employee_id, gift, cash, award_date, award_info, award_photo, organization_id) {
        let query = `UPDATE organization_awards SET award_type=(?), employee_id=(?), gift=(?), cash=(?), date=(?), information=(?), award_photo=(?)
                    WHERE id=(?) AND organization_id =(?)`;
        return mySql.query(query, [award_type, employee_id, gift, cash, award_date, award_info, award_photo, award_id, organization_id]);
    }

    deleteAward(award_id, organization_id) {
        let query = `DELETE FROM organization_awards
                    WHERE id=(?) AND organization_id =(?)`;
        return mySql.query(query, [award_id, organization_id]);
    }

}

module.exports = new AwardModel;