const mySql = require('../../../database/MySqlConnection').getInstance();

class CheckItemService {

    getCheckItem(filter) {
        const query = `
            SELECT *
            FROM check_items
            WHERE ${filter};
        `;

        return mySql.query(query);
    }

    insertCheckItem(data) {
        const { ext_id, name, state, check_list_id, ext_checklist_id, status } = data;

        const query = `
            INSERT INTO
                check_items (ext_id, name, state, check_list_id, ext_checklist_id, status)
            VALUES
                ("${ext_id}", "${name}", "${state}", ${check_list_id}, "${ext_checklist_id}", ${status});
        `;

        return mySql.query(query);
    }

    bulkInsertCheckItem(values) {
        const query = `
            INSERT INTO
                check_items (ext_id, name, state, check_list_id, ext_checklist_id, status)
            VALUES
                ${values};
        `;

        return mySql.query(query);
    }

    bulkUpsertCheckItem(values) {
        const query = `
            INSERT INTO check_items
                (ext_id, name, state, check_list_id, ext_checklist_id, status)
            VALUES
                ${values}
            ON DUPLICATE KEY UPDATE
                ext_id = VALUES(ext_id),
                name = VALUES(name),
                state = VALUES(state),
                check_list_id = VALUES(check_list_id),
                ext_checklist_id = VALUES(ext_checklist_id),
                status = VALUES(status)
        `;

        return mySql.query(query);
    }

    updateCheckItem(update, filter) {
        const query = `
            UPDATE check_items
            SET
                ${update}
            WHERE
                ${filter};
        `;

        return mySql.query(query);
    }

}

module.exports = new CheckItemService;