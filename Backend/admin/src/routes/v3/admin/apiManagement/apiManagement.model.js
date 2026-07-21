const mySql = require('../../../../database/MySqlConnection').getInstance();

class Model {
    async getAdmin(skip = 0, limit = 10, search = '') {
        let query = `
            SELECT o.id, u.email, u.a_email, u.first_name, u.last_name
            FROM users u
            JOIN organizations o ON o.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += `
                AND (
                    o.id LIKE ? OR
                    u.email LIKE ? OR
                    u.a_email LIKE ? OR
                    u.first_name LIKE ? OR
                    u.last_name LIKE ?
                )
            `;
            const likeSearch = `%${search}%`;
            params.push(likeSearch, likeSearch, likeSearch, likeSearch, likeSearch);
        }

        query += ` ORDER BY o.id DESC LIMIT ?, ?`;
        params.push(Number(skip), Number(limit));

        return mySql.query(query, params);
    }

    async getAdminCount(search = '') {
        let query = `
            SELECT COUNT(*) AS total
            FROM users u
            JOIN organizations o ON o.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += `
                AND (
                    o.id LIKE ? OR
                    u.email LIKE ? OR
                    u.a_email LIKE ? OR
                    u.first_name LIKE ? OR
                    u.last_name LIKE ?
                )
            `;
            const likeSearch = `%${search}%`;
            params.push(likeSearch, likeSearch, likeSearch, likeSearch, likeSearch);
        }

        const result = await mySql.query(query, params);
        return result[0]?.total || 0;
    }
}

module.exports = new Model();