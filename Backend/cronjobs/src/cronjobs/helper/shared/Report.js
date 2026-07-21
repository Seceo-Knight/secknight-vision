const moment = require('moment');

const mySql = require('../../../database/MySqlConnection').getInstance();

class Report {
    async getActivatedAdmin() {
        let date = moment().utc().format('YYYY-MM-DD');
        let query = `SELECT a.*
                    FROM auto_email_report a
                    WHERE status=1`;

        return await mySql.query(query);
    }

    async getAllUsers(admin_id) {
        let query = `SELECT u.id,u.admin_id,u.name first_name,u.full_name AS last_name
                    FROM users u
                    WHERE admin_id=${admin_id} AND status=1 `;

        return await mySql.query(query);
    }

    async getLogDetails(user_id, from_date, to_date) {
        let query = ` SELECT p.id, p.day, p.login_time, p.logout_time, p.user_id, p.working_hours, p.non_working_hours, p.total_hours
            FROM production_stats p
            WHERE p.user_id = ${user_id} AND(p.day BETWEEN '${from_date}' AND '${to_date}')
            ORDER BY p.day DESC`;

        return await mySql.query(query);
    }

    async userApplicationUsed(user_id, from_date, to_date) {
        let query = `SELECT a.id,a.app_name,a.user_id,a.create_date
                    FROM application_used a
                    WHERE  (a.create_date BETWEEN '${from_date} 00:00:00' AND '${to_date} 23:59:59') AND a.user_id=${user_id}
                    ORDER BY a.create_date DESC `

        return await mySql.query(query);
    }
    async browserHistory(user_id, from_date, to_date) {
        let query = `SELECT b.id,b.browser,b.url,b.user_id,b.create_date
                    FROM browser_history b
                    WHERE  b.user_id=${user_id} AND (b.create_date BETWEEN '${from_date} 00:00:00' AND '${to_date} 23:59:59' ) 
                    ORDER BY b.create_date DESC`

        return await mySql.query(query);
    }

    async topWebsites(user_id, from_date, to_date) {
        let query = ` SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1) AS domain,
                    count(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1)) AS count
                    FROM  browser_history b
                    WHERE b.user_id=${user_id} AND (b.create_date BETWEEN '${from_date} 00:00:00' AND '${to_date} 23:59:59')
                    GROUP BY domain
                    ORDER BY count DESC
                LIMIT 0,100`;

        return await mySql.query(query);
    }
    async topApps(user_id, from_date, to_date) {
        let query = `SELECT a.id, COUNT(a.app_name) AS count, a.app_name, a.user_id
                    FROM application_used a
                    WHERE a.user_id=${user_id} AND  (a.create_date BETWEEN '${from_date} 00:00:00' AND '${to_date} 23:59:59')
                    GROUP BY a.app_name,a.user_id
                    ORDER BY count DESC
                    LIMIT 0, 100`

        return await mySql.query(query);
    }
}

module.exports = new Report;

// let last_7_days = moment().utc().subtract(7, 'd').format('YYYY-MM-DD');
// const monthStart = moment().utc().endOf("month").format('YYYY-MM-DD')
// const monthEnd = moment().utc().startOf("month").format('YYYY-MM-DD')

// console.log('=============', last_7_days);
// console.log('=============', monthStart);
// console.log('=============', monthEnd);