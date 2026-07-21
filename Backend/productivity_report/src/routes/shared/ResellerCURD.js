const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class ResellerCURD {
    async createReseller(admin_id, title, logo, favicon, brand) {
        try {
            return await mySql.query(`
            INSERT INTO reseller (admin_id, title,brand, logo_path, favicon_path)
            VALUES (${admin_id},'${title}','${brand}','${logo}','${favicon}')
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getReseller(admin_id) {
        try {
            return await mySql.query(`
             SELECT * FROM reseller WHERE admin_id=${admin_id}
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getResellerById(id) {
        try {
            return await mySql.query(`
             SELECT * FROM reseller WHERE id=${id}
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
}

module.exports = new ResellerCURD;