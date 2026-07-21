
const mySql = require('../../../database/MySqlConnection').getInstance();

class PrModel {

    /**
     * @description
     * Get Productivity.
     *
     * @param {Object} dataObj
     * @param {Number} dataObj.admin_id
     * @param {String} dataObj.startDate
     * @param {String} dataObj.endDate
     * @param {Number} dataObj.user_id
     * @param {Array<Number>} dataObj.department_ids
     */
    getProductivity(dataObj) {
        const {admin_id, startDate, endDate, user_id, department_ids} = dataObj;

        let query = `SELECT at.day, adp.status AS status, SUM(at.time) time_duration `;

        if(user_id) {
            query += `
                FROM users AS u
                LEFT JOIN activity_track  AS at
                    ON at.user_id = u.id
                INNER JOIN app_domain AS ad
                    ON ad.name = at.name
                INNER JOIN app_domain_productivity AS adp
                    ON adp.app_domain_id = ad.id
                    AND adp.admin_id=${admin_id}
                    AND adp.department_id IS NULL
                WHERE
                    u.id=${user_id} AND
                    at.admin_id=${admin_id} AND
                    at.day BETWEEN "${startDate}" AND "${endDate}"
                GROUP BY at.day, adp.status
            `;
        }

        else if(department_ids.length === 0) {
            query +=   `
                FROM activity_track AS at
                INNER JOIN app_domain AS ad
                    ON ad.name = at.name
                INNER JOIN app_domain_productivity AS adp
                    ON  adp.app_domain_id=ad.id
                    AND adp.admin_id=${admin_id}
                    AND adp.department_id IS NULL
                WHERE
                    at.admin_id=${admin_id} AND
                    at.day BETWEEN "${startDate}" AND "${endDate}"
                GROUP BY at.day, adp.status
            `;
        }

        else {
            query += `
                FROM users AS u
                LEFT JOIN activity_track  AS at
                    ON at.user_id = u.id
                INNER JOIN app_domain AS ad
                    ON ad.name = at.name
                INNER JOIN app_domain_productivity AS adp
                    ON  adp.app_domain_id=ad.id
                    AND adp.admin_id=${admin_id}
                    AND adp.department_id IN (${department_ids.toString()})
                WHERE
                    u.admin_id=${admin_id} AND
                    u.department_id IN (${department_ids.toString()}) AND
                    at.admin_id=${admin_id} AND
                    at.day BETWEEN "${startDate}" AND "${endDate}"
                GROUP BY at.day, adp.status
            `;
        }

        return mySql.query(query);
    }

    getAllDepartmentIdsOfLocation(admin_id, location_id) {
        const query = `
            SELECT department_id
            FROM depart_to_loc
            WHERE admin_id = ? AND location_id = ?
        `;

        return mySql.query(query, [admin_id, location_id]);
    }

    /**
     * @description
     * Get Production Stats Count.
     *
     * @param {Object} dataObj
     * @param {Number} dataObj.admin_id
     * @param {String} dataObj.day
     */
    getProductionStatsCount(dataObj) {
        const { admin_id, day } = dataObj;

        const query = `
            SELECT COUNT(*) AS count
            FROM production_stats AS ps
            LEFT JOIN users AS u
                ON u.id = ps.user_id
            LEFT JOIN department AS d
                ON u.department_id = d.id
            WHERE ps.admin_id=? AND ps.day=?
        `;

        return mySql.query(query, [admin_id, day]);
    }

    /**
     * @description
     * Get Production Stats.
     *
     * @param {Object} dataObj
     * @param {Number} dataObj.admin_id
     * @param {String} dataObj.day
     * @param {Number} dataObj.limit
     * @param {Number} dataObj.offset
     */
    getProductionStats(dataObj) {
        const { admin_id, day, limit, offset } = dataObj;

        const query = `
            SELECT
                u.name,
                ps.login_time,
                ps.logout_time,
                ps.working_hours,
                ps.non_working_hours,
                ps.total_hours,
                d.id AS domain_id,
                d.name AS domain_name
            FROM production_stats AS ps
            LEFT JOIN users AS u
                ON u.id = ps.user_id
            LEFT JOIN department AS d
                ON u.department_id = d.id
            WHERE ps.admin_id=? AND ps.day=?
            LIMIT ? OFFSET ?;
        `;

        return mySql.query(query, [admin_id, day, parseInt(limit), parseInt(offset)]);
    }
}

module.exports = new PrModel;