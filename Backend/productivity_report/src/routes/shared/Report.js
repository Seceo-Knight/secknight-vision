'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class ReportService {

    /**
     * Get employee details.
     *
     * @async
     * @function employeeReport
     * @memberof ReportService
     * @param {number} location_id
     * @param {string} role_id
     * @param {*} callback
     * @returns {Object} - Data or Error.
     **/
    async employeeReport(location_id, role_id, callback) {
        try {
            let emplyoees = await mySql.query(`
                SELECT u.id, u.full_name ,u.email, r.name ,r.id AS 'role_id', l.name,l.id AS 'location_id' 
                FROM users u INNER JOIN role r ON  u.role_id=r.id 
                INNER JOIN location l ON  u.role_id=l.id 
                WHERE u.location_id='${location_id}' AND u.role_id='${role_id}'
                `);
            callback(null, emplyoees);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Get user List with filterartion on location,department and role.
     *
     * @async
     * @function getReportUserList
     * @memberof employeeReport
     * @param {number} location_id
     * @param {number} role_id
     * @param {string} department
     * @param {boolean} is_department
     * @param {boolean} is_location
     * @param {boolean} is_role
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getReportUserList(admin_id, location_id, role_id, department, is_location, is_role, is_department, skip, limit, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList = await mySql.query(`
            SELECT u.id,u.name,u.full_name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.role_id,l.name AS location,r.name AS role,d.name AS department,
            (SELECT count(*) FROM users us 
            WHERE (if (${is_location}, (us.location_id=${location_id}), (us.location_id in(select lc.id from location lc) ))
            AND if (${is_role}, (us.role_id=${role_id}), (us.role_id in(select rl.id from role rl) ))
            AND admin_id=${admin_id}
            AND if (${is_department},(us.department_id in(${department_id})), (us.department_id in(select dept.id from department dept) )) ) ) AS total_count
            FROM users u
            LEFT JOIN location l ON u.location_id = l.id
            LEFT JOIN role r ON u.role_id = r.id
            LEFT JOIN department d ON u.department_id = d.id
            WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc) ))
            AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select rl.id from role rl) ))
            AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept) )) )
            AND admin_id=${admin_id}
            LIMIT ${skip},${limit}
            `);
            cb(null, userList)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get user log details .
     *
     * @async
     * @function logDetails
     * @memberof employeeReport
     * @param {number} user_id
     * @param {string} from_date
     * @param {string} to_date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async logDetails(user_id, from_date, to_date, skip, limit, admin_id, callback) {
        try {
            let log_details = await mySql.query(
                `SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id,u.name AS user_name, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated,
                (SELECT count(*) FROM production_stats ps WHERE ps.admin_id=${admin_id} AND  ps.user_id=${user_id} AND (ps.day BETWEEN '${from_date}' AND '${to_date}')) AS total_count
                 FROM production_stats p
                 INNER JOIN users u ON u.id=p.user_id
                 WHERE p.admin_id=${admin_id} AND p.user_id=${user_id} AND (p.day BETWEEN '${from_date}' AND '${to_date}')
                 ORDER BY p.day DESC
                 LIMIT ${skip},${limit}`
            );
            callback(null, log_details);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Get browser history details.
     *
     * @async
     * @function getBrowserHistory
     * @memberof employeeReport
     * @param {number} user_id
     * @param {string} from_date
     * @param {string} to_date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getBrowserHistory(user_id, skip, limit, from_date, to_date, cb) {
        try {
            let brower_history = await mySql.query(`
                SELECT b.id,b.browser,b.url,b.user_id,u.name AS user_name,b.create_date,
                (SELECT count(*) FROM browser_history bh WHERE  bh.user_id=${user_id} AND (bh.create_date BETWEEN '${from_date}' AND '${to_date}' )) AS total_count
                FROM browser_history b
                INNER JOIN users u ON u.id=b.user_id
                WHERE  b.user_id=${user_id} AND (b.create_date BETWEEN '${from_date}' AND '${to_date}' ) 
                ORDER BY b.create_date DESC
                LIMIT ${skip},${limit}
            `)
            cb(null, brower_history);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get keystroke data with filter option.
     *
     * @async
     * @function keyStrokes
     * @memberof employeeReport
     * @param {number} user_id
     * @param {string} from_date
     * @param {string} to_date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async keyStrokes(user_id, skip, limit, from_date, to_date, admin_id, cb) {
        try {
            let keystroke = await mySql.query(`
                SELECT k.id,k.keystroke_data,k.user_id,u.name as user_name,k.date AS create_date,
                (SELECT count(*) FROM keystroke ks WHERE (ks.date BETWEEN '${from_date}' AND '${to_date}') AND ks.user_id = ${user_id} AND ks.admin_id = ${admin_id}) AS total_count
                FROM keystroke k
                INNER JOIN users u ON u.id=k.user_id
                WHERE (k.date BETWEEN '${from_date}' AND '${to_date}') AND k.user_id=${user_id} AND k.admin_id=${admin_id}
                ORDER BY k.date DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, keystroke);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get topwebsites data with filter option.
     *
     * @async
     * @function topWebsites
     * @memberof employeeReport
     * @param {number} user_id
     * @param {string} from_date
     * @param {string} to_date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async topWebsites(user_id, skip, limit, from_date, to_date, cb) {
        try {
            let top_website = await mySql.query(`
                SELECT act.id, act.name AS domain, sum(act.time) AS time, act.day,act.user_id,u.name AS user_name,
                COUNT( * ) OVER() AS total_count
                FROM activity_track act
                INNER JOIN users u ON u.id=act.user_id
                WHERE act.user_id =${user_id} AND act.day BETWEEN '${from_date}' AND '${to_date}'
                AND act.type = 'WEB'
                GROUP BY domain
                ORDER BY time DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, top_website);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }

    }

    async topWebsitesCount(user_id, from_date, to_date, cb) {
        try {
            let top_website = await mySql.query(`
                SELECT count(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1)) AS total_count,
                SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1) AS domain,
                count(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1)) AS count
                FROM browser_history
                WHERE user_id =${user_id} AND(create_date BETWEEN '${from_date} 00:00:00'
                AND '${to_date} 23:59:59')
                GROUP BY domain
                ORDER BY count DESC
            `);
            cb(null, top_website);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get top apps data with filter option.
     *
     * @async
     * @function topApps
     * @memberof employeeReport
     * @param {number} user_id
     * @param {string} from_date
     * @param {string} to_date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async topApps(user_id, skip, limit, from_date, to_date, cb) {
        try {
            let top_apps = await mySql.query(`
                SELECT act.id, act.name AS app_name, act.user_id, u.name AS user_name,SUM(act.time) time, COUNT( * ) OVER() AS total_count
                FROM activity_track act
                INNER JOIN users u ON u.id = act.user_id
                WHERE act.user_id = ${user_id} AND  act.DAY BETWEEN '${from_date}' AND '${to_date}' AND act.type = 'APP'
                GROUP BY act.name, act.user_id
                ORDER BY time DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, top_apps);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get user application used data with filter option.
     *
     * @async
     * @function userApplicationUsed
     * @memberof employeeReport
     * @param {number} user_id
     * @param {string} from_date
     * @param {string} to_date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async userApplicationUsed(user_id, skip, limit, from_date, to_date, cb) {
        try {
            let application_used = await mySql.query(`
                SELECT a.id,a.app_name,a.user_id,u.name AS user_name,a.create_date,
                (SELECT count(*) FROM application_used au WHERE (au.create_date BETWEEN '${from_date}' AND '${to_date}') AND au.user_id=${user_id}) AS total_count
                FROM application_used a
                INNER JOIN users u ON u.id=a.user_id
                WHERE  (a.create_date BETWEEN '${from_date}' AND '${to_date}') AND a.user_id=${user_id}
                ORDER BY a.create_date DESC
                LIMIT ${skip},${limit}
            `)
            cb(null, application_used);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async autoEmailData(admin_id) {
        return await mySql.query(`
            SELECT *
            FROM auto_email_report
            WHERE admin_id =${admin_id}
        `)
    }

    async addAutoEmailReport(admin_id, recipient_email, website_analytics, application_analytics, keystroke, browser_history, user_log, top_website_analytics, top_application_analytics, status, frequency_type, next_send_on) {
        return await mySql.query(`
            INSERT INTO auto_email_report(admin_id, recipient_email, website_analytics, application_analytics, keystroke, browser_history, user_log, top_website_analytics, top_application_analytics, status, frequency_type, next_send_on)
            VALUES (${admin_id},'${recipient_email}',${website_analytics},${application_analytics},${keystroke},${browser_history},${user_log},${top_website_analytics},${top_application_analytics},${status},${frequency_type},'${next_send_on}')
        `)
    }

    getProductionStats(columns, filter) {
        const query = `
            SELECT ${columns}
            FROM production_stats
            WHERE ${filter}
        `;

        return mySql.query(query);
    }

    getProductionStatsWithUsers(admin_id, day) {
        const query = `
            SELECT ps.day, ps.working_hours, ps.non_working_hours, ps.total_hours, ps.user_id, u.name, u.email
            FROM production_stats AS ps
            
            LEFT JOIN users AS u
            ON ps.user_id = u.id
            
            WHERE ps.admin_id=${admin_id} AND ps.day = "${day}";
        `;

        return mySql.query(query);
    }

    async updateAutoReport(
        admin_id, recipient_email, website_analytics, application_analytics, top_application_analytics,
        keystroke, browser_history, user_log, top_website_analytics, status, frequency_type, next_send_on
    ) {
        let query = `UPDATE auto_email_report SET
                recipient_email = '${recipient_email}',
                website_analytics = ${website_analytics},
                application_analytics = ${application_analytics},
                top_application_analytics=${top_application_analytics},
                keystroke = ${keystroke},
                browser_history = ${browser_history},
                user_log = ${user_log},
                top_website_analytics = ${top_website_analytics},
                status=${status},
                frequency_type=${frequency_type},
                next_send_on='${next_send_on}'
            WHERE admin_id = ${admin_id}`;

        return mySql.query(query);
    }

    async logDetailsMultipleUser(user_id, from_date, to_date, skip, limit, admin_id, callback) {
        try {
            let log_details = await mySql.query(
                `SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated,
                (SELECT count(*) FROM production_stats ps WHERE ps.admin_id=${admin_id} AND  ps.user_id IN(${user_id}) AND (ps.day BETWEEN '${from_date}' AND '${to_date}')) AS total_count
                 FROM production_stats p
                 WHERE p.admin_id=${admin_id} AND p.user_id IN (${user_id}) AND (p.day BETWEEN '${from_date}' AND '${to_date}')
                 ORDER BY p.day DESC
                 LIMIT ${skip},${limit}`
            );
            callback(null, log_details);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    async keyStrokesMultipleUsers(user_id, skip, limit, from_date, to_date, admin_id, cb) {
        try {
            let keystroke = await mySql.query(`
                SELECT k.id,k.keystroke_data,k.user_id,k.date AS create_date,
                (SELECT count(*) FROM keystroke ks WHERE (ks.date BETWEEN '${from_date}' AND '${to_date}') AND ks.user_id  IN (${user_id})  AND ks.admin_id = ${admin_id}) AS total_count
                FROM keystroke k
                WHERE (k.date BETWEEN '${from_date}' AND '${to_date}') AND k.user_id IN (${user_id}) AND k.admin_id=${admin_id}
                ORDER BY k.date DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, keystroke);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async topWebsitesMultipleUsers(user_id, skip, limit, from_date, to_date, cb) {
        try {
            let top_website = await mySql.query(`
                SELECT act.id, act.name AS domain, sum(act.time)  AS time, act.day,act.user_id
                COUNT( * ) OVER() AS total_count
                FROM activity_track act
                WHERE act.user_id  in ${user_id} AND act.day BETWEEN '${from_date}' AND '${to_date}'
                AND act.type = 'WEB'
                GROUP BY domain
                ORDER BY time DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, top_website);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }

    }

    async getUsr(user_id, cb) {
        try {
            let user = await mySql.query(`
            SELECT id ,name AS user_name FROM users WHERE  id=${user_id}
            `);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }

    }

    async topAppsUser(user_id, from_date, to_date, cb) {
        try {
            let top_apps = await mySql.query(`
                SELECT act.id, act.name AS app_name, act.user_id, u.name AS user_name,SEC_TO_TIME(SUM(act.time)) time, COUNT( * ) OVER() AS total_count
                FROM activity_track act
                INNER JOIN users u ON u.id = act.user_id
                WHERE act.user_id = ${user_id} AND  act.DAY BETWEEN '${from_date}' AND '${to_date}' AND act.type = 'APP'
                GROUP BY act.name, act.user_id
                ORDER BY time DESC
               
            `);
            cb(null, top_apps);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
}
module.exports = new ReportService;