"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;
class OrganazationService {
    async createOrganazation(name, admin_id) {
        // Type '1-Own 2-Trello 3-Assan 4-jira 5-Zoho'
        try {
            return await mySql.query(`
                 INSERT INTO integration_organization (name, admin_id, status ,type)
                 VALUES (?,?,1,1)
            `, [name, admin_id]);

        } catch (err) {
            console.log(err)
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getOrganazationByName(name, admin_id) {
        try {
            return await mySql.query(`
                SELECT * FROM integration_organization  WHERE name =? AND admin_id=?  AND type=1
            `, [name, admin_id]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getAllOrganazation(admin_id) {
        try {
            return await mySql.query(`
                 SELECT * FROM integration_organization  WHERE admin_id =?
            `, [admin_id]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async getSingleOrganazation(admin_id, organazation_id, is_organazation_id) {
        try {
            return await mySql.query(`
                SELECT org.*,u.name AS manager_name
                FROM integration_organization org
                LEFT JOIN users u ON u.id =org.manager_id
                WHERE org.type='1' AND  (if (? ,(org.id=? ),(org.id in (SELECT id FROM integration_organization WHERE admin_id =?) )  ))
            `, [is_organazation_id, organazation_id, admin_id]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getOrganazationById(admin_id, organazation_id,) {
        try {
            return await mySql.query(`
                SELECT * FROM integration_organization
                WHERE  id=? AND admin_id =?
            `, [organazation_id, admin_id]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async deleteOrganization(admin_id, organazation_id) {
        try {
            return await mySql.query(`
                 DELETE FROM integration_organization  WHERE id =? AND admin_id =?
            `, [organazation_id, admin_id]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateOrganiation(admin_id, organization_id, name, status) {
        try {
            return await mySql.query(`
                UPDATE integration_organization SET name = ?, status = ?
                WHERE id =? AND admin_id =?
            `, [name, status, organization_id, admin_id]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkOrganizationName(organization_id, name, admin_id) {
        try {
            return await mySql.query(`
             SELECT * FROM integration_organization  WHERE id !=? AND admin_id =?  AND name=?
        `, [organization_id, admin_id, name]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
}

module.exports = new OrganazationService;