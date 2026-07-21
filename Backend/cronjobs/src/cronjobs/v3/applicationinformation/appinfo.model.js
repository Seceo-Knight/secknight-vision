const mySql = require("../../../database/MySqlConnection").getInstance();

class AppInfoModel {

    applicationInformation() {
        let query = `SELECT * 
                    FROM application_info 
                    WHERE status=1`;

        return mySql.query(query);
    }
}

module.exports = new AppInfoModel;