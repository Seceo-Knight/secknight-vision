const mySql = require('../../../database/MySqlConnection').getInstance();

class CheckListService {

    getCheckList(filter) {
        const query = `
            SELECT *
            FROM check_list
            WHERE ${filter};
        `;

        return mySql.query(query);
    }

    insertCheckList(data) {
        const { ext_id, name, todo_id, board_id, card_id, check_items, status } = data;

        const query = `
            INSERT INTO
                check_list (ext_id, name, todo_id, board_id, card_id, check_items, status)
            VALUES
                ("${ext_id}", "${name}", ${todo_id}, "${board_id}", "${card_id}", "${check_items}", ${status});
        `;

        return mySql.query(query);
    }

    bulkInsertCheckList(values) {
        const query = `
            INSERT INTO
                check_list (ext_id, name, todo_id, board_id, card_id, check_items, status)
            VALUES
                ${values};
        `;

        return mySql.query(query);
    }

    upsertCheckList(data) {
        const { ext_id, name, todo_id, board_id, card_id, check_items, status } = data;

        const query = `
            INSERT INTO check_list
                (ext_id, name, todo_id, board_id, card_id, check_items, status)
            VALUES
                ("${ext_id}", "${name}", ${todo_id}, "${board_id}", "${card_id}", "${check_items}", ${status})
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                ext_id = "${ext_id}",
                name = "${name}",
                todo_id = ${todo_id},
                board_id = "${board_id}",
                card_id = "${card_id}",
                check_items = "${check_items}",
                status = ${status}
        `;

        return mySql.query(query);
    }

    updateCheckList(update, filter) {
        const query = `
            UPDATE check_list
            SET
                ${update}
            WHERE
                ${filter};
        `;

        return mySql.query(query);
    }

}

module.exports = new CheckListService;