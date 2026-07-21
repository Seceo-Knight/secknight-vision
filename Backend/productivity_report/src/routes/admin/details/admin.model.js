const mySql = require('../../../database/MySqlConnection').getInstance();


class AdminModel {
    async getRoles(admin_id) {
        let query = `SELECT id,name,type,created_at,updated_at
                    FROM roles_new
                    WHERE organization_id=${admin_id}`

        return mySql.query(query);
    }
}
module.exports = new AdminModel;
