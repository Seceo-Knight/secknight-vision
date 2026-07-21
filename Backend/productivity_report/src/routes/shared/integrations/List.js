const mySql = require('../../../database/MySqlConnection').getInstance();

class ListService {

    getList(filter) {
        const query = `
            SELECT *
            FROM project_list
            WHERE ${filter};
        `;

        return mySql.query(query);
    }

    insertList(data) {
        const { ext_list_id, name, project_id, board_id, closed, status } = data;

        const query = `
            INSERT INTO
                project_list (ext_list_id, name, project_id, board_id, closed, status)
            VALUES
                ('${ext_list_id}', '${name}', ${project_id}, '${board_id}', ${closed}, ${status});
        `;

        return mySql.query(query);
    }

    bulkInsertList(values) {
        const query = `
            INSERT INTO
                project_list (ext_list_id, name, project_id, board_id, closed, status)
            VALUES
                ${values};
        `;

        return mySql.query(query);
    }

    upsertList(data) {
        const { ext_list_id, name, project_id, board_id, closed, status } = data;

        const query = `
            INSERT INTO project_list
                (ext_list_id, name, project_id, board_id, closed, status)
            VALUES
                ("${ext_list_id}", "${name}", ${project_id}, "${board_id}", ${closed}, ${status})
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                ext_list_id = "${ext_list_id}",
                name = "${name}",
                project_id = ${project_id},
                board_id = "${board_id}",
                closed = ${closed},
                status = ${status}
        `;

        return mySql.query(query);
    }

    updateList(update, filter) {
        const query = `
            UPDATE project_list
            SET
                ${update}
            WHERE
                ${filter};
        `;

        return mySql.query(query);
    }

}

module.exports = new ListService;