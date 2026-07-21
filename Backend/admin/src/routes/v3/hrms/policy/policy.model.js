const mySql = require('../../../../database/MySqlConnection').getInstance();

class PolicyModel {

    checkPolicyId(policy_id, organization_id) {
        let query = `SELECT id, title FROM policies WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [policy_id, organization_id]);
    }

    checkPolicyName(title, organization_id) {
        let query = `SELECT id, title FROM policies WHERE title=(?) 
                    AND organization_id=(?)`;
        return mySql.query(query, [title, organization_id]);
    }

    addPolicy(title, description, user_id, organization_id) {
        let query = `INSERT INTO policies (title, description, added_by_id, organization_id)
                    VALUES (?, ?, ?, ?)`;
        return mySql.query(query, [title, description, user_id, organization_id]);
    }

    getPolicies(policy_id, organization_id) {
        let query = `SELECT p.id, p.title, p.description, p.added_by_id, p.organization_id, p.created_at,
                     CONCAT(u.first_name, ' ', u.last_name) AS added_by 
                     FROM policies p INNER JOIN users u ON u.id=p.added_by_id 
                     WHERE p.organization_id='${organization_id}'`;
        if (policy_id) query += ` AND p.id='${policy_id}'`;
        return mySql.query(query);
    }

    updatePolicy(title, description, policy_id, organization_id) {
        let query = `UPDATE policies SET title=(?), description=(?)
                     WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [title, description, policy_id, organization_id]);
    }

    deletePolicy(policy_id, organization_id) {
        let query = `DELETE FROM policies WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [policy_id, organization_id]);
    }
}

module.exports = new PolicyModel;