const mySql = require('../../../database/MySqlConnection').getInstance();

class OrgService {

    getOrganisation(filter) {
        const query = `
            SELECT *
            FROM integration_organization
            WHERE ${filter};
        `;

        return mySql.query(query);
    }

    insertOrganisation(data) {
        const { name, integration_id, integration_creds_id, ext_org_id, admin_id, manager_id } = data;
        const query = `
            INSERT INTO
                integration_organization (name, integration_id, integration_creds_id, ext_org_id, admin_id, manager_id, status)
            VALUES
                ('${name}', ${integration_id}, ${integration_creds_id}, '${ext_org_id}', ${admin_id}, ${manager_id}, 1);
        `;

        return mySql.query(query);
    }

    upsertOrganisation(data) {
        const { name, integration_id, integration_creds_id, ext_org_id, admin_id, manager_id } = data;
        const query = `
            INSERT INTO integration_organization
                (name, integration_id, integration_creds_id, ext_org_id, admin_id, manager_id, status)
            VALUES
                ("${name}", ${integration_id}, ${integration_creds_id}, "${ext_org_id}", ${admin_id}, ${manager_id}, 1)
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                name = "${name}",
                ext_org_id = "${ext_org_id}"
        `;

        return mySql.query(query);
    }

    bulkInsertOrganisation(values) {
        const query = `
            INSERT INTO
                integration_organization (name, integration_id, integration_creds_id, ext_org_id, admin_id, manager_id, status)
            VALUES
                ${values};
        `;

        return mySql.query(query);
    }

    updateOrganisation(update, filter) {
        const query = `
            UPDATE integration_organization
            SET
                ${update}
            WHERE
                ${filter};
        `;

        return mySql.query(query);
    }

}

module.exports = new OrgService;