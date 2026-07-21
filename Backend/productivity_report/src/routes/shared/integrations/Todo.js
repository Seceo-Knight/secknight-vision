const mySql = require('../../../database/MySqlConnection').getInstance();

class TodoService {

    getTodo(filter) {
        const query = `
            SELECT *
            FROM project_todo
            WHERE ${filter};
        `;

        return mySql.query(query);
    }

    insertTodo(data) {
        const {
            ext_id,
            name,
            description,
            project_id,
            project_list_id,
            list_id,
            check_list_ids,
            check_items,
            check_items_checked,
            due_date,
            due_complete,
            start_date,
            end_date,
            status,
            progress
        } = data;

        const query = `
            INSERT INTO
                project_todo (ext_id, name, description, project_id, project_list_id, list_id, check_list_ids, check_items, check_items_checked, due_date, due_complete, start_date, end_date, status, progress)
            VALUES
                ("${ext_id}", "${name}", "${description}", ${project_id}, ${project_list_id}, "${list_id}", "${check_list_ids}", ${check_items}, ${check_items_checked}, "${due_date}", ${due_complete}, "${start_date}", "${end_date}", ${status}, ${progress});
        `;

        return mySql.query(query);
    }

    bulkInsertTodo(values) {
        const query = `
            INSERT INTO
                project_todo (ext_id, name, description, project_id, project_list_id, list_id, check_list_ids, check_items, check_items_checked, due_date, due_complete, start_date, end_date, status, progress)
            VALUES
                ${values};
        `;

        return mySql.query(query);
    }

    upsertTodo(data) {
        const {
            ext_id,
            name,
            description,
            project_id,
            project_list_id,
            list_id,
            check_list_ids,
            check_items,
            check_items_checked,
            due_date,
            due_complete,
            start_date,
            end_date,
            status,
            progress
        } = data;

        const query = `
            INSERT INTO project_todo
                (ext_id, name, description, project_id, project_list_id, list_id, check_list_ids, check_items, check_items_checked, due_date, due_complete, start_date, end_date, status, progress)
            VALUES
                ("${ext_id}", "${name}", "${description}", ${project_id}, ${project_list_id}, "${list_id}", "${check_list_ids}", ${check_items}, ${check_items_checked}, "${due_date}", ${due_complete}, "${start_date}", "${end_date}", ${status}, ${progress})
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                ext_id = "${ext_id}",
                name = "${name}",
                description = "${description}",
                project_id = ${project_id},
                project_list_id = ${project_list_id},
                list_id = "${list_id}",
                check_list_ids = "${check_list_ids}",
                check_items = ${check_items},
                check_items_checked = ${check_items_checked},
                due_date = "${due_date}",
                due_complete = ${due_complete},
                start_date = "${start_date}",
                end_date = "${end_date}",
                status = ${status},
                progress = ${progress}
        `;

        return mySql.query(query);
    }

    updateTodo(update, filter) {
        const query = `
            UPDATE project_todo
            SET
                ${update}
            WHERE
                ${filter};
        `;

        return mySql.query(query);
    }

}

module.exports = new TodoService;