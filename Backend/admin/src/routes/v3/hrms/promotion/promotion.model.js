const mySql = require('../../../../database/MySqlConnection').getInstance();

class PromotionModel {

    checkPromotionId(promotion_id, organization_id) {
        let query = `SELECT id, title FROM organization_promotions WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [promotion_id, organization_id]);
    }

    getPromotion(promotion_id, organization_id) {
        let query = `SELECT op.id,op.employee_id,op.title,op.description,op.date,op.added_by,
                     concat(u.first_name,' ',u.last_name) AS employee_name 
                     FROM organization_promotions op 
                     INNER JOIN employees e ON e.id=op.employee_id 
                     INNER JOIN users u ON u.id=e.user_id 
                     WHERE op.organization_id='${organization_id}'`;
        if (promotion_id) query += ` AND op.id='${promotion_id}'`;
        return mySql.query(query);
    }

    addPromotion(employee_id, title, description, date, added_by, organization_id) {
        let query = `INSERT INTO organization_promotions (employee_id, title, description, date, added_by, organization_id)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return mySql.query(query, [employee_id, title, description, date, added_by, organization_id]);
    }

    updatePromotion(employee_id, title, description, date, promotion_id) {
        let query = `UPDATE organization_promotions SET employee_id=(?), title=(?), description=(?), date=(?)
                     WHERE id=(?)`;
        return mySql.query(query, [employee_id, title, description, date, promotion_id]);
    }

    deletePromotion(promotion_id, organization_id) {
        let query = `DELETE FROM organization_promotions WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [promotion_id, organization_id]);
    }
}

module.exports = new PromotionModel;