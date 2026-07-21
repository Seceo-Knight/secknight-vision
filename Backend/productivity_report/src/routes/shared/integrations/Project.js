const mySql = require('../../../database/MySqlConnection').getInstance();

class ProjectService {

    getProject(filter) {
        const query = `
            SELECT *
            FROM project
            WHERE ${filter};
        `;

        return mySql.query(query);
    }

    insertProject(data) {
        const {
            name,
            description,
            admin_id,
            manager_id,
            ext_project_id,
            integration_org_id,
            start_date,
            end_date,
            actual_start_date,
            actual_end_date,
            status,
            progress
        } = data;

        const query = `
            INSERT INTO
                project (name, description, admin_id, manager_id, ext_project_id, integration_org_id, start_date, end_date, actual_start_date, actual_end_date, status, progress)
            VALUES
                ('${name}', '${description}', ${admin_id}, ${manager_id}, '${ext_project_id}', ${integration_org_id}, '${start_date}', '${end_date}', '${actual_start_date}', '${actual_end_date}', ${status}, ${progress});
        `;

        return mySql.query(query);
    }

    bulkInsertProject(values) {
        const query = `
            INSERT INTO
                project (name, description, admin_id, manager_id, ext_project_id, integration_org_id, start_date, end_date, actual_start_date, actual_end_date, status, progress)
            VALUES
                ${values};
        `;

        return mySql.query(query);
    }

    upsertProject(data) {
        const {
            name,
            description,
            admin_id,
            manager_id,
            ext_project_id,
            integration_org_id,
            start_date,
            end_date,
            actual_start_date,
            actual_end_date,
            status,
            progress
        } = data;

        const query = `
            INSERT INTO project
                (name, description, admin_id, manager_id, ext_project_id, integration_org_id, start_date, end_date, actual_start_date, actual_end_date, status, progress)
            VALUES
                ("${name}", "${description}", ${admin_id}, ${manager_id}, "${ext_project_id}", ${integration_org_id}, "${start_date}", "${end_date}", "${actual_start_date}", "${actual_end_date}", ${status}, ${progress})
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                name = "${name}",
                description = "${description}",
                manager_id = ${manager_id},
                ext_project_id = "${ext_project_id}",
                integration_org_id = ${integration_org_id},
                start_date = "${start_date}",
                end_date = "${end_date}",
                actual_start_date = "${actual_start_date}",
                actual_end_date = "${actual_end_date}",
                status = ${status},
                progress = ${progress}
        `;

        return mySql.query(query);
    }

    updateProject(update, filter) {
        const query = `
            UPDATE project
            SET
                ${update}
            WHERE
                ${filter};
        `;

        return mySql.query(query);
    }

}

module.exports = new ProjectService;