const mySql = require('../../../database/MySqlConnection').getInstance();

class TrelloModel {

    getIntegration(filter, cb) {
        const query = `
            SELECT *
            FROM integration
            WHERE ${filter};
        `;

        mySql.query(query, function (err, results, fields) {
            cb(err, results)
        });
    }

    getIntegrationData(filter, cb) {
        const query = `
            SELECT *
            FROM integration_creds
            WHERE ${filter};
        `;

        mySql.query(query, function (err, results, fields) {
            cb(err, results)
        });
    }

    insertIntegrationData(values, cb) {
        const query = `
            INSERT INTO integration_creds (integration_id, admin_id, manager_id, name, access_token, access_token_secret, member_id, status)
            VALUES ${values};
        `;

        mySql.query(query, function (err, results, fields) {
            cb(err, results)
        });
    }

    updateIntegrationData(update, filter, cb) {
        const query = `
            UPDATE integration_creds
            SET
                ${update}
            WHERE
                ${filter};
        `;

        mySql.query(query, function (err, results, fields) {
            cb(err, results)
        });
    }

}

module.exports = new TrelloModel;