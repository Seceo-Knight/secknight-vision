const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class User {
    /**
     * Add role data.
     *
     * @function addRole
     * @memberof User
     * @param {string} name
     * @param {string} params
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async addRole(name, params, cb) {
        try {
            let role = await mySql.query(
                `INSERT INTO role (name, params)
                    SELECT * FROM (SELECT ?, ?) AS tmp
                    WHERE NOT EXISTS (SELECT name FROM role WHERE name = ?)
                    LIMIT 1`, [name, params, name]
            );
            cb(null, role);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get role data.
     *
     * @function retrieveRole
     * @memberof User
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async retrieveRole(cb) {
        try {
            let role = await mySql.query(`
                    SELECT * FROM role WHERE status=1`);
            cb(null, role);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Register user with all details.
     *
     * @function registerUser
     * @memberof User
     * @param {string} name
     * @param {string} full_name
     * @param {string} email
     * @param {string} email_verified_at
     * @param {string} password
     * @param {string} remember_token
     * @param {string} phone
     * @param {number} location_id
     * @param {number} department_id
     * @param {number} role_id
     * @param {string} date_join
     * @param {string} photo_path
     * @param {string} address
     * @param {number} status
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async registerUser(name, full_name, email, email_verified_at, password, remember_token, phone, emp_code, location_id, department_id, date_join, photo_path, address, role_id, status, created_at, updated_at, admin_id, timezone, timezone_offset, cb) {
        try {
            let user = await mySql.query(
                `INSERT INTO users (name,full_name,email,password,remember_token,phone,emp_code,location_id,department_id,date_join,photo_path,address,role_id,status,admin_id,timezone,timezone_offset)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [name, full_name, email, password, remember_token, phone, emp_code, location_id, department_id, date_join, photo_path, address, role_id, status, admin_id, timezone, timezone_offset]);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Search user by name with all details.
     *
     * @function searchUsers
     * @memberof User
     * @param {string} name
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async searchUsers(admin_id, name, location_id, role_id, department_id, is_location, is_role, is_department, skip, limit, cb) {
        try {
            let user = await mySql.query(
                `SELECT u.id,u.name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.role_id,l.name AS location,CONCAT(u.name, ' ',u.full_name) AS full_name,u.full_name AS last_name,
                r.name AS role,d.name AS department,au.manager_id,mu.name AS manager_name,(SELECT count(*) FROM users us
                WHERE (us.name LIKE ?
                AND if (?, (us.location_id=?), (us.location_id in(select lc.id from location lc) ))
                AND if (?, (us.role_id=?), (us.role_id in(select rl.id from role rl) ))
                AND us.admin_id=?
                AND if (?,(us.department_id in(?)), (us.department_id in(select dept.id from department dept) )) ) ) AS total_count
                FROM users u
                INNER JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON u.role_id = r.id
                INNER JOIN department d ON u.department_id = d.id
                LEFT JOIN assigned_user au ON u.id=au.user_id
                LEFT JOIN users mu ON mu.id=au.manager_id
                WHERE (if (?, (u.location_id=?), (u.location_id in(select lc.id from location lc) ))
                AND if (?, (u.role_id=?), (u.role_id in(select rl.id from role rl) ))
                AND if (?, (u.department_id in(?)), (u.department_id in(select dept.id from department dept) )) )
                AND u.admin_id=?
                AND u.name LIKE ? LIMIT ?,?
                `, [`%${name}%`, is_location, location_id, is_role, role_id, admin_id, is_department, department_id, is_location, location_id, is_role, role_id, is_department, department_id, admin_id, `%${name}%`, skip, limit]);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get all user details,lotal count and filter with location,department,role.
     *
     * @function getUserList
     * @memberof User
     * @param {number} location_id
     * @param {number} role_id
     * @param {number} department
     * @param {boolean} is_location
     * @param {boolean} is_role
     * @param {boolean} is_department
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getUserList_old(location_id, role_id, department, is_location, is_role, is_department, today_date, skip, limit, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList = await mySql.query(`
            SELECT u.id,u.name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.role_id,l.name AS location,r.name AS role,r.params,d.name AS department,ps.updated_at AS last_updated_time,u.status,au.manager_id,u.full_name,mu.name AS manager_name,
            (SELECT count(*) FROM users us 
            WHERE (if (${is_location}, (us.location_id=${location_id}), (us.location_id in(select lc.id from location lc) ))
            AND if (${is_role}, (us.role_id=${role_id}), (us.role_id in(select rl.id from role rl) ))
            AND if (${is_department},(us.department_id in(${department_id})), (us.department_id in(select dept.id from department dept) )) ) ) AS total_count
            FROM users u
            INNER JOIN location l ON u.location_id = l.id
            INNER JOIN role r ON u.role_id = r.id
            INNER JOIN department d ON u.department_id = d.id 
            LEFT JOIN production_stats ps ON u.id=ps.user_id AND ps.day BETWEEN '${today_date} 00:00:00' AND '${today_date} 23:59:59'
            LEFT JOIN assigned_user au ON u.id=au.user_id
            LEFT JOIN users mu ON mu.id=au.manager_id
            WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc) ))
            AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select rl.id from role rl) ))
            AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept) )) )
            LIMIT ${skip},${limit}
            `);
            cb(null, userList);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getUserList_OLD_2_vikash(admin_id, location_id, role_id, department, is_location, is_role, is_department, today_date, skip, limit, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList = await mySql.query(`
                SELECT u.id,u.name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.role_id,l.name AS location,r.name AS role,r.params,d.name AS department,ps.logout_time AS last_updated_time,u.status,u.full_name AS last_name,CONCAT(u.name, ' ',u.full_name) AS full_name,
                (SELECT count(*) FROM users us 
                WHERE (if (${is_location}, (us.location_id=${location_id}), (us.location_id in(select lc.id from location lc) ))
                AND if (${is_role}, (us.role_id=${role_id}), (us.role_id in(select rl.id from role rl) ))
                AND us.admin_id=${admin_id}
                AND if (${is_department},(us.department_id in(${department_id})), (us.department_id in(select dept.id from department dept) )) ) ) AS total_count
                FROM users u
                INNER JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON u.role_id = r.id
                INNER JOIN department d ON u.department_id = d.id 
                LEFT JOIN production_stats ps ON u.id=ps.user_id AND ps.day BETWEEN '${today_date}' AND '${today_date}'
                WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc) ))
                AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select rl.id from role rl) ))
                AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept) )) )
                AND u.admin_id=${admin_id}
                ORDER BY u.created_at DESC
                LIMIT ${skip},${limit}
                
            `);
            cb(null, userList);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getUserList_basavraj(admin_id, location_id, role_id, department, is_location, is_role, is_department, today_date, skip, limit, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList = await mySql.query(`
                SELECT u.id, u.name, u.email, u.phone, u.emp_code, u.location_id, u.department_id, u.role_id, l.name AS location, r.name AS role, r.params, d.name AS department, ps.logout_time AS last_updated_time, u.status, u.full_name AS last_name, CONCAT(u.name, ' ', u.full_name) AS full_name, u.password, u.address, u.date_join,
                (SELECT count(*) FROM users us 
                WHERE (if (${is_location}, (us.location_id=${location_id}), (us.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                AND if (${is_role}, (us.role_id=${role_id}), (us.role_id in(select rl.id from role rl) ))
                AND us.admin_id=${admin_id}
                AND if (${is_department},(us.department_id in(${department_id})), (us.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) ) ) AS total_count
                FROM users u
                INNER JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON u.role_id = r.id
                INNER JOIN department d ON u.department_id = d.id 
                LEFT JOIN production_stats ps ON u.id=ps.user_id AND ps.day = '${today_date}'
                WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select rl.id from role rl) ))
                AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) )
                AND u.admin_id=${admin_id}
                ORDER BY u.created_at DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, userList);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getUserList(admin_id, location_id, role_id, department, is_location, is_role, is_department, today_date, skip, limit, reseller, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList;
            if (reseller === 1) {
                userList = await mySql.query(`
                SELECT u.id, u.name, u.email, u.phone, u.emp_code, u.location_id, u.department_id, u.role_id, l.name AS location, 
                r.name AS role, r.params,d.name AS department, u.status, u.full_name AS last_name, CONCAT(u.name, ' ', u.full_name) AS full_name,
                u.password, u.address, u.date_join, u.timezone, u.timezone_offset, (COUNT( u.id ) OVER()) AS total_count
                FROM users u
                INNER JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON u.role_id = r.id
                INNER JOIN department d ON u.department_id = d.id
                WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select id from role) ))
                AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) )
                AND u.admin_id=${admin_id} AND u.department_id!=12
                ORDER BY u.created_at DESC
                LIMIT ${skip},${limit}
            `);
            } else {
                userList = await mySql.query(`
                   SELECT u.id, u.name, u.email, u.phone, u.emp_code, u.location_id, u.department_id, u.role_id, l.name AS location, 
                   r.name AS role, r.params,d.name AS department, u.status, u.full_name AS last_name, CONCAT(u.name, ' ', u.full_name) AS full_name,
                   u.password, u.address, u.date_join, u.timezone, u.timezone_offset, (COUNT( u.id ) OVER()) AS total_count
                   FROM users u
                   INNER JOIN location l ON u.location_id = l.id
                   INNER JOIN role r ON u.role_id = r.id
                   INNER JOIN department d ON u.department_id = d.id
                   WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                   AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select id from role) ))
                   AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) )
                   AND u.admin_id=${admin_id}
                   ORDER BY u.created_at DESC
                   LIMIT ${skip},${limit}
               `);
            }
            cb(null, userList);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getAssignedMangerDetailsByUserId(user_id, admin_id, cb) {
        try {
            let manager = await mySql.query(`
                SELECT au.manager_id,u.name AS manager_name,u.full_name as last_name,CONCAT(u.name, ' ',u.full_name) AS full_name
                FROM assigned_user au
                LEFT JOIN users u ON u.id=au.manager_id
                WHERE au.user_id=? AND au.admin_id=? AND role_type='Manager'
            `, [user_id, admin_id]);
            cb(null, manager);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getAssignedTeamLeaDetailsByUserId(user_id, admin_id) {
        return await mySql.query(`
                SELECT au.manager_id AS teamlead_id,u.name AS teamlead_name,u.full_name as last_name,CONCAT(u.name, ' ',u.full_name) AS full_name
                FROM assigned_user au
                LEFT JOIN users u ON u.id=au.manager_id
                WHERE au.user_id=? AND au.admin_id=? AND role_type='Team Lead'
            `, [user_id, admin_id]);
    }

    /**
     * Get single user details.
     *
     * @function getSingleUserDetails
     * @memberof User
     * @param {number} user_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getSingleUserDetails(user_id, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT *
                FROM users u
                WHERE u.id=? AND u.admin_id=?
            `, [user_id, admin_id]);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get single user details.
     *
     * @function getEmployeeDetailsByEmail
     * @memberof User
     * @param {number} email
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getEmployeeDetailsByEmail(email, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT *
                FROM users u
                WHERE u.email=?`, [email]);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }


    async getEmployeeDetailsByEmpCode(emp_code, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT *
                FROM users u
                WHERE u.emp_code=? AND u.admin_id=?`, [emp_code, admin_id]);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    /**
     * Get user details with location and departments.
     *
     * @function getUserDetailsLocationDepartment
     * @memberof User
     * @param {number} user_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async getUserDetailsLocationDepartment(user_id, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT u.id,u.admin_id,u.password,u.name,u.full_name AS last_name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.photo_path,u.address,r.params,CONCAT(u.name, ' ',u.full_name) AS full_name,
                u.role_id, u.status, l.name AS location_name, d.name AS department_name, r.name AS role_name, u.date_join, u.timezone, u.timezone_offset
                FROM users u
                LEFT JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON r.id=u.role_id
                INNER JOIN department d ON u.department_id = d.id
                WHERE u.id=? AND u.admin_id=?
                `, [user_id, admin_id]);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get browser history details with filter.
     *
     * @function getBrowserHistory
     * @memberof User
     * @param {number} user_id
     * @param {string} date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async getBrowserHistory(admin_id, user_id, date, skip, limit, cb) {
        try {
            let brower_history = await mySql.query(`
                SELECT b.id,b.browser,b.url,b.user_id,b.create_date,
                (SELECT count(bh.id) FROM browser_history bh WHERE bh.create_date BETWEEN ? AND ? AND bh.user_id=?) AS total_count,
                u.full_name,u.email
                FROM browser_history b
                INNER JOIN  users u ON u.id=b.user_id
                WHERE b.create_date BETWEEN ? AND ? AND b.user_id=? AND b.admin_id=?
                ORDER BY b.create_date DESC
                LIMIT ?,?
            `, [`${date} 00:00:00`, `${date} 23:59:59`, user_id, `${date} 00:00:00`, `${date} 23:59:59`, user_id, admin_id, skip, limit])
            cb(null, brower_history);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getBrowserHistoryFromTo(admin_id, user_id, from_date, to_date, skip, limit, cb) {
        try {
            let brower_history = await mySql.query(`
                SELECT b.id,b.browser,b.url,b.user_id,b.create_date,
                (SELECT count(bh.id) FROM browser_history bh WHERE bh.create_date BETWEEN ? AND ? AND bh.user_id=?) AS total_count,
                u.full_name,u.email
                FROM browser_history b
                INNER JOIN  users u ON u.id=b.user_id
                WHERE b.create_date BETWEEN ? AND ? AND b.user_id=? AND b.admin_id=?
                ORDER BY b.create_date DESC
                LIMIT ?,?
            `, [from_date, to_date, user_id, from_date, to_date, user_id, admin_id, skip, limit]);
            cb(null, brower_history);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get application used details with filter.
     *
     * @function userApplicationUsed
     * @memberof User
     * @param {number} user_id
     * @param {string} date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async userApplicationUsed(admin_id, user_id, from_date, to_date, skip, limit, cb) {
        try {
            let application_used = await mySql.query(`
                SELECT a.id,a.app_name,a.user_id,a.create_date,
                (SELECT count(au.id) FROM application_used au WHERE au.create_date BETWEEN '${from_date}' AND '${to_date}' AND au.user_id=${user_id}) AS total_count
                FROM application_used a
                WHERE a.create_date BETWEEN '${from_date}' AND '${to_date}' AND a.user_id=${user_id} AND a.admin_id=${admin_id}
                ORDER BY a.create_date DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, application_used);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get log details details with filter.
     *
     * @function userLogDetails
     * @memberof User
     * @param {number} user_id
     * @param {string} date
     * @param {string} last_7_days
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async userLogDetails(admin_id, user_id, date, last_7_days, cb) {
        try {
            let user_log = await mySql.query(`
                SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated
                FROM production_stats p
                WHERE p.day BETWEEN '${last_7_days}' AND '${date}' AND p.user_id=${user_id} AND admin_id=${admin_id}
                ORDER BY p.day DESC
            `)
            cb(null, user_log);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    async userLogDetailsKamal(admin_id, user_id, date, last_7_days, cb) {
        try {
            let user_log = await mySql.query(`
                SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated
                FROM production_stats_kamal p
                WHERE p.day BETWEEN '${last_7_days}' AND '${date}' AND p.user_id=${user_id} AND admin_id=${admin_id}
                ORDER BY p.day DESC
            `)
            cb(null, user_log);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    async logDetails(user_id, from_date, to_date, skip, limit, admin_id) {
        return await mySql.query(`
            SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated,
            (SELECT count(ps.id) FROM production_stats ps WHERE ps.admin_id=${admin_id} AND  ps.user_id=${user_id} AND ((ps.day BETWEEN '${from_date}' AND '${to_date}')) )AS total_count
            FROM production_stats p
            WHERE p.admin_id = ${admin_id}
            AND p.user_id = ${user_id} AND((p.day BETWEEN '${from_date}' AND '${to_date}'))
            ORDER BY p.day DESC
            LIMIT ${skip},${limit}
        `);
    }
    async logDetailsKamal(user_id, from_date, to_date, skip, limit, admin_id) {
        return await mySql.query(`
            SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated,
            (SELECT count(*) FROM production_stats_kamal ps WHERE ps.admin_id=${admin_id} AND  ps.user_id=${user_id} AND ((ps.day BETWEEN '${from_date}' AND '${to_date}')) )AS total_count
            FROM production_stats_kamal p
            WHERE p.admin_id = ${admin_id}
            AND p.user_id = ${user_id} AND((p.day BETWEEN '${from_date}' AND '${to_date}'))
            ORDER BY p.day DESC
            LIMIT ${skip},${limit}
        `);
    }
    /**
     * Get top apps details with filter.
     *
     * @function topApps
     * @memberof User
     * @param {number} user_id
     * @param {string} date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async topApps(admin_id, user_id, date, skip, limit, cb) {
        try {
            let top_apps = await mySql.query(`
                SELECT a.id, COUNT(a.app_name) AS total_app, a.app_name, a.user_id
                FROM application_used a
                WHERE a.user_id=${user_id} AND a.create_date BETWEEN '${date} 00:00:00' AND '${date} 23:59:59' AND a.admin_id=${admin_id}
                GROUP BY a.app_name,a.user_id
                ORDER BY total_app DESC
                LIMIT ${skip}, ${limit}
            `);
            cb(null, top_apps);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get top websites details with filter.
     *
     * @function topWebsites
     * @memberof User
     * @param {number} user_id
     * @param {string} date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async topWebsites(admin_id, user_id, date, skip, limit, cb) {
        try {
            let top_website = await mySql.query(`
                SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1) AS domain,
                COUNT (SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '://', -1), '/', 1), '?', 1)) AS count
                FROM browser_history
                WHERE admin_id=${admin_id} AND user_id=${user_id} AND create_date BETWEEN '${date} 00:00:00' AND '${date} 23:59:59' 
                GROUP BY domain
                ORDER BY count DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, top_website);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get ketstroke details with filter.
     *
     * @function keyStrokes
     * @memberof User
     * @param {number} user_id
     * @param {string} date
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async keyStrokes(admin_id, user_id, date, skip, limit, cb) {
        try {
            let keystroke = await mySql.query(`
                SELECT k.id,k.keystroke_data,k.user_id,k.create_date,
                (SELECT count(*) FROM keystroke ks WHERE ks.create_date BETWEEN '${date} 00:00:00' AND '${date} 23:59:59' AND ks.user_id=${user_id}) AS total_count
                FROM keystroke k
                WHERE  k.create_date BETWEEN '${date} 00:00:00' AND '${date} 23:59:59' AND k.user_id=${user_id} AND k.admin_id=${admin_id} 
                ORDER BY k.create_date DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, keystroke);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get single user details.
     *
     * @function userData
     * @memberof User
     * @param {number} user_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async userData(userId, admin_id, cb) {
        try {
            let users = await mySql.query(`
                SELECT  id ,emp_code,date_join,phone,address ,full_name,name,email, location_id  ,department_id,date_join,photo_path,role_id,password
                FROM users 
                WHERE id = ${userId} AND admin_id= ${admin_id}
            `); //status 1-active  ,0-revmoved employee ,2-suspend 
            cb(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Update user details.
     *
     * @function registerUser
     * @memberof User
     * @param {number} userId
     * @param {string} name
     * @param {string} full_name
     * @param {string} email
     * @param {string} email_verified_at
     * @param {string} password
     * @param {string} remember_token
     * @param {string} phone
     * @param {number} location_id
     * @param {number} department_id
     * @param {number} role_id
     * @param {string} date_join
     * @param {string} photo_path
     * @param {string} address
     * @param {number} status
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async updateProfile(admin_id, userId, full_name, email, address, locationId, deptId, emp_code, phone, joinDate, photo_path, name, role_id, password, cb) {
        try {
            let users = await mySql.query(`
                UPDATE users SET full_name='${full_name}',name='${name}',photo_path='${photo_path}',email='${email}',address='${address}',location_id='${locationId}',department_id='${deptId}',emp_code ='${emp_code}',date_join ='${joinDate}',phone ='${phone}',role_id=${role_id} ,password='${password}'
                 WHERE id =${userId} AND admin_id=${admin_id}
            `); //status 1-active employee ,0-ex employee 
            cb(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Remove user details.
     *
     * @function removeUserAccount
     * @memberof User
     * @param {number} user_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async removeUserAccount(user_id, admin_id, callback) {
        try {
            let users = await mySql.query(`
                DELETE FROM users 
                WHERE id = ${user_id} AND admin_id=${admin_id}
            `);
            callback(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Update user status.
     *
     * @function updateUserStatus
     * @memberof User
     * @param {number} user_id
     * @param {number} status
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async updateUserStatus(user_id, status, admin_id, cb) {
        try {
            let user = await mySql.query(`
                UPDATE users SET status=${status}
                WHERE id IN (${user_id}) AND admin_id=${admin_id}
            `);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Assign user to manager.
     *
     * @function assignUserToManger
     * @memberof User
     * @param {number} user_id
     * @param {number} manager_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async assignUserToManger(manager_id_list, cb) {
        try {
            let assign = await mySql.query(`
                INSERT INTO assigned_user (user_id,manager_id,admin_id)
                VALUES ?`, [manager_id_list]);
            cb(null, assign);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    async assignMultiUserToManger(user_id, manager_id, admin_id) {
        return await mySql.query(`
                INSERT INTO assigned_user (user_id,manager_id,admin_id)
                VALUES (${user_id},${manager_id},${admin_id})`)
    }

    async assignMultiUserToTeamLead(user_id, teamlead_id, admin_id) {
        return await mySql.query(`
                INSERT INTO assigned_user (user_id,manager_id,admin_id,role_type)
                VALUES (${user_id},${teamlead_id},${admin_id},'Team Lead')`)
    }
    /**
     * Unassign user to manager.
     *
     * @function unassignUserToManger
     * @memberof User
     * @param {number} user_id
     * @param {number} manager_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async unassignUserToManger(admin_id, user_id, manager_id, cb) {
        try {
            let unassign = await mySql.query(`
                DELETE from assigned_user 
                WHERE user_id IN (${user_id}) AND manager_id=${manager_id}  AND  admin_id=${admin_id}
            `);
            cb(null, unassign);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async unassignUserToTeamLead(admin_id, user_id, teamlead_id) {
        return await mySql.query(`
                DELETE from assigned_user 
                WHERE user_id IN (${user_id}) AND manager_id=${teamlead_id}  AND  admin_id=${admin_id} AND role_type='Team Lead'
            `);
    }

    async removeAlreadyAssigned(admin_id, user_id) {
        return await mySql.query(`
                DELETE from assigned_user 
                WHERE user_id=${user_id} AND admin_id=${admin_id} AND role_type='Manager'
            `);
    }

    /**
     * Assign user to manager.
     *
     * @function checkAssigned
     * @memberof User
     * @param {number} user_id
     * @param {number} manager_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async checkAssigned(user_id, manager_id, admin_id, cb) {
        try {
            let assign = await mySql.query(`
            SELECT a.id, u.name
            FROM assigned_user a
            INNER JOIN users u ON u.id=a.manager_id
            WHERE user_id=${user_id} AND manager_id IN (${manager_id}) AND a.admin_id=${admin_id}
        `);
            cb(null, assign);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    async checkAssignedUserToManager(user_id, manager_id, admin_id) {
        return await mySql.query(`
            SELECT a.id, u.name AS first_name,u.full_name AS last_name,u.id AS user_id,u.status
            FROM assigned_user a
            INNER JOIN users u ON u.id=a.user_id
            WHERE user_id IN (${user_id}) AND manager_id =${manager_id} AND a.admin_id=${admin_id}
        `);
    }

    async checkAssignedUserToTeamLead(user_id, teamlead_id, admin_id) {
        return await mySql.query(`
            SELECT a.id, u.name AS first_name,u.full_name AS last_name,u.id AS user_id,u.status
            FROM assigned_user a
            INNER JOIN users u ON u.id=a.user_id
            WHERE user_id IN (${user_id}) AND manager_id =${teamlead_id} AND a.admin_id=${admin_id} AND role_type='Team Lead'
        `);
    }

    async checkAssignedUserTOtherTeamLead(user_id, admin_id) {
        return await mySql.query(`
            SELECT a.id, u.name AS first_name,u.full_name AS last_name,u.id AS user_id,u.status
            FROM assigned_user a
            INNER JOIN users u ON u.id=a.user_id
            WHERE user_id IN (${user_id}) AND a.admin_id=${admin_id} AND role_type='Team Lead'
        `);
    }

    async deleteAssignedManager(admin_id, manager_id, cb) {
        try {
            let unassign = await mySql.query(`
                DELETE from assigned_user 
                WHERE manager_id=${manager_id}  AND  admin_id=${admin_id}
            `);
            cb(null, unassign);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    async updateRoleType(manager_id, role_type) {
        let query = `UPDATE assigned_user
                    SET role_type = '${role_type}'
                    WHERE manager_id =${manager_id}`

        return await mySql.query(query);
    }
    async deleteAssignedUser(admin_id, user_id, role_type, cb) {
        try {
            let unassign = await mySql.query(`
                DELETE from assigned_user 
                WHERE user_id=${user_id}  AND  admin_id=${admin_id} AND role_type='${role_type}'
            `);
            cb(null, unassign);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    /**
     * Upgrade employee to manager .
     *
     * @function upgradeAndDownGradeManager
     * @memberof User
     * @param {number} user_id
     * @param {number} role_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async upgradeAndDownGradeManager(user_id, role_id, admin_id, cb) {
        try {
            let user = await mySql.query(`
                UPDATE users SET role_id=${role_id}
                WHERE id=${user_id} AND admin_id=${admin_id}
            `);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *Get role by params .
     *
     * @function getRoleByParam
     * @memberof User
     * @param {string} param
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async getRoleByParam(param, cb) {
        try {
            let user = await mySql.query(`
                SELECT * FROM role
                WHERE params='${param}'
            `);
            cb(null, user)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, cb);
        }
    }

    /**
     *Get role and email by user id  .
     *
     * @function getRoleByParam
     * @memberof User
     * @param {string} user_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async getRoleAndMail(user_id, admin_id, cb) {
        try {
            let user = await mySql.query(`
            SELECT u.email, u.name ,r.name,r.params,r.id
            FROM users u
            INNER JOIN role r ON r.id=u.role_id
            WHERE u.id='${user_id}' AND u.admin_id=${admin_id}
            `);
            cb(null, user)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, cb);
        }
    }

    /**
     *Get role by id .
     *
     * @function getRoleById
     * @memberof User
     * @param {string} id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async getRoleById(id, cb) {
        try {
            let user = await mySql.query(`
                SELECT * FROM role
                WHERE id=${id}
            `);
            cb(null, user)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, cb);
        }
    }

    async getRoleDatById(id) {
        return await mySql.query(`
                SELECT * FROM role
                WHERE id=${id}
            `);
    }


    /**
     * Get list of employee assigned to manager,
     * 
     * @async
     * @function getEmployeeeAssiginedToManager
     * @memberof User
     * @param {number} manager_id
     * @param {*} cb
     * @returns {Object} -Data or Error
     */
    async getEmployeeeAssiginedToManager(admin_id, manager_id, department, location_id, is_department, is_location, today_date, skip, limit, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList = await mySql.query(`
                SELECT au.manager_id,au.user_id,u.name AS user_name,d.name AS department_name,l.name location,u.email,u.full_name AS last_name,u.status,ps.logout_time AS last_updated_time,ds.task_manager, ds.block_usb, ds.lock_print,CONCAT(u.name, ' ',u.full_name) AS full_name,
                d.id AS department_id, l.id AS location_id, (COUNT( * ) OVER()) AS total_count
                FROM assigned_user au
                INNER JOIN users u ON au.user_id=u.id
                INNER JOIN department d ON u.department_id=d.id
                INNER JOIN location l ON u.location_id=l.id
                LEFT JOIN desktop_settings ds ON ds.user_id=u.id
                LEFT JOIN production_stats ps ON u.id = ps.user_id AND ps.day = '${today_date}'
                WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) )
                AND manager_id=${manager_id}
                AND au.admin_id=${admin_id}
                ORDER BY u.created_at DESC
                LIMIT ${skip},${limit}
            `);
            cb(null, userList)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, cb);
        }
    }

    async getAssignedMangeIdByUserID(user_id, admin_id, cb) {
        try {
            let manager = await mySql.query(`
                SELECT u.role_id,a.manager_id,u.id AS user_id,u.status
                FROM users u
                LEFT JOIN assigned_user a ON a.user_id=u.id
                WHERE u.id IN(${user_id}) AND u.admin_id=${admin_id}
            `);
            cb(null, manager);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }


    async checkUserExistsByEmail(user_id, email, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT *
                FROM users 
                WHERE id !=${user_id}  AND email='${email}'
            `);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async checkUserExistsByEmpCode(user_id, emp_code, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT *
                FROM users 
                WHERE id !=${user_id} AND admin_id=${admin_id} AND emp_code='${emp_code}'
            `);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async checkEmployeeAssigenedToManager(admin_id, manager_id, cb) {
        try {
            let count = await mySql.query(`
                SELECT COUNT(*) AS tolal_count 
                FROM assigned_user 
                WHERE manager_id = ${manager_id} AND admin_id=${admin_id} AND role_type='Manager'
            `);
            cb(null, count);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async checkEmployeeAssigenedTeamLead(admin_id, manager_id, cb) {
        try {
            let count = await mySql.query(`
                SELECT COUNT(*) AS tolal_count 
                FROM assigned_user
                WHERE manager_id = ${manager_id} AND admin_id=${admin_id} AND role_type='Team Lead'
            `);
            cb(null, count);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
        }
    }


    /** get Useer details to reset password */
    async forgotPassword(email, cb) {
        try {
            let user_data = await mySql.query(`
            SELECT u.* ,r.params FROM users u
            LEFT JOIN role r ON r.id =u.role_id
            WHERE email='${email}'
            `);
            cb(null, user_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async updatePassword(password, email, cb) {
        try {
            let update_password = await mySql.query(`
            UPDATE users SET password ='${password}'WHERE email='${email}'
            `)
            cb(null, update_password);
        } catch (error) {
            cb(error, null);
        }
    }



    async getUserWorkingHours(user_id, from_date, to_date, admin_id, is_user, location_id, is_location) {
        try {
            return await mySql.query(`
            SELECT  u.id as user_id ,u.name ,u.location_id,l.name AS location_name,d.id  AS department_id,
            d.name AS department_name ,
            SUBSTRING(sec_to_time(avg(time_to_sec(ps.non_working_hours) )),1,8)   AS 'non_working_hours', 
			SUBSTRING(sec_to_time(avg(time_to_sec(ps.working_hours) )),1,8) AS 'working_hours',  
			SUBSTRING(sec_to_time(avg(time_to_sec(ps.total_hours) )),1,8) AS 'total_hours'  
            FROM production_stats ps 
            INNER JOIN users u ON u.id =ps.user_id
            INNER join department d ON u.department_id =d.id
            INNER JOIN location l ON l.id =u.location_id
            WHERE ps.admin_id=${admin_id} AND   ps.day BETWEEN '${from_date}' AND '${to_date}'
            AND  (if (${is_user}  ,(ps.user_id in (SELECT id FROM users WHERE admin_id =${admin_id}) ),(ps.user_id=${user_id})  ))
            AND  (if (${is_location}  ,(l.id in (SELECT id FROM location WHERE admin_id =${admin_id}) ),(l.id=${location_id})  ))
           	GROUP BY  u.id  ,u.name ,u.location_id,l.name ,d.id ,d.name 
            `);
        } catch (err) {
            console.log(err)
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async getUserWorkingHoursByDepartment(department_id, from_date, to_date, admin_id, is_depaertment, location_id, is_location) {
        try {
            return await mySql.query(`
            SELECT  d.id AS department_id ,d.name AS department_name ,
            SUBSTRING(sec_to_time(avg(time_to_sec(ps.non_working_hours) )),1,8)   AS 'non_working_hours', 
			SUBSTRING(sec_to_time(avg(time_to_sec(ps.working_hours) )),1,8) AS 'working_hours',  
			SUBSTRING(sec_to_time(avg(time_to_sec(ps.total_hours) )),1,8) AS 'total_hours'  
            FROM production_stats ps 
            INNER JOIN users u ON u.id=ps.user_id
            INNER JOIN department d ON d.id=u.department_id
            INNER JOIN location l ON l.id =u.location_id
            WHERE ps.admin_id=${admin_id} AND  ps.day BETWEEN '${from_date}' AND '${to_date}'
            AND  (if (${is_depaertment}   ,(d.id in (select id from department where admin_id =${admin_id}) ),(d.id=${department_id})  ))
            AND  (if (${is_location}  ,(l.id in (SELECT id FROM location WHERE admin_id =${admin_id}) ),(l.id=${location_id})  ))
            GROUP BY d.id ,d.name
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async getUserWorkingHoursByDepartmentForDepartment(department_id, from_date, to_date, admin_id, is_depaertment, location_id, is_location) {
        try {
            return await mySql.query(`
            SELECT ps.day ,
            SUBSTRING(sec_to_time(avg(time_to_sec(ps.non_working_hours) )),1,8)   AS 'non_working_hours', 
			SUBSTRING(sec_to_time(avg(time_to_sec(ps.working_hours) )),1,8) AS 'working_hours',  
			SUBSTRING(sec_to_time(avg(time_to_sec(ps.total_hours) )),1,8) AS 'total_hours' 
            FROM production_stats ps 
            INNER JOIN users u ON u.id=ps.user_id
            INNER JOIN department d ON d.id=u.department_id
            INNER JOIN location l ON l.id =u.location_id
            WHERE ps.admin_id=${admin_id} AND  ps.day BETWEEN '${from_date} ' AND '${to_date}'
            AND  (if (${is_depaertment}   ,(d.id in (select id from department where admin_id =${admin_id}) ),(d.id=${department_id})  ))
            AND  (if (${is_location}  ,(l.id in (SELECT id FROM location WHERE admin_id =${admin_id}) ),(l.id=${location_id})  ))
            GROUP BY ps.day
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }




    async getUserById(user_id, admin_id) {
        try {
            return await mySql.query(`
            SELECT  u.id ,u.name ,d.name AS department ,d.id AS department_id
            FROM users u
            INNER JOIN department  d ON d.id=u.department_id
            WHERE u.id =${user_id} AND u.admin_id=${admin_id}
             
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getDepartmentById(department_id, admin_id) {
        try {
            return await mySql.query(`
           SELECT id,name
           FROM department
           WHERE id =${department_id} AND admin_id=${admin_id}
             `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getAppData(user_id, admin_id, from_date, to_date) {
        try {
            return await mySql.query(`
            SELECT app_name,time ,day 
            from  application_track 
            WHERE admin_id =${admin_id}   AND user_id=${user_id} 
            AND day BETWEEN '${from_date}'  AND '${to_date}'
             `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getBrowserData(user_id, admin_id, from_date, to_date) {
        try {
            return await mySql.query(`
            SELECT web_url,time ,day 
            from  website_track 
            WHERE admin_id =${admin_id}   AND user_id=${user_id} 
            AND day BETWEEN '${from_date}'  AND '${to_date}'
             `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getAppDataBydepartment(department_id, admin_id, from_date, to_date) {
        try {
            return await mySql.query(`
            SELECT u.id AS user_id,  u.name, a.app_name,a.time ,a.day  
            FROM users u 
            LEFT JOIN application_track a ON a.user_id=u.id 
            WHERE u.admin_id =${admin_id}  AND  u.department_id =${department_id}
            AND a.day BETWEEN '${from_date}'  AND '${to_date}'
             `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getBrowserDataByDepartment(department_id, admin_id, from_date, to_date) {
        try {
            return await mySql.query(`
            SELECT u.id AS user_id,  u.name,w.web_url,w.time ,w.day 
            FROM users u 
            LEFT JOIN  website_track w ON  w.user_id=u.id
            WHERE u.admin_id =${admin_id}  AND  u.department_id =${department_id}
            AND w.day BETWEEN '${from_date}'  AND '${to_date}'
             `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }



    async getUserWorkingHoursForDay(user_id, from_date, to_date, admin_id, is_user, location_id, is_location) {
        try {
            return await mySql.query(`
            SELECT  ps.day ,SUBSTRING(sec_to_time(avg(time_to_sec(ps.non_working_hours) )),1,8)    AS 'non_working_hours', SUBSTRING(sec_to_time(avg(time_to_sec(ps.working_hours) )),1,8) AS 'working_hours',SUBSTRING(sec_to_time(avg(time_to_sec(ps.total_hours) )),1,8)   AS 'total_hours'  
            FROM production_stats ps 
            LEFT JOIN users u ON u.id =ps.user_id
            INNER JOIN location l ON l.id =u.location_id
            WHERE ps.admin_id=${admin_id} AND   ps.day BETWEEN '${from_date}' AND '${to_date}'
            AND  (if (${is_user}  ,(ps.user_id in (select id from users where admin_id =${admin_id} ) ),(ps.user_id=${user_id})  ))
            AND  (if (${is_location}  ,(l.id in (SELECT id FROM location WHERE admin_id =${admin_id}) ),(l.id=${location_id})  ))

            group BY ps.day
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async test() {
        return 1;
    }


    async appsActivityTrack(admin_id, user_id, date, skip, limit) {
        try {
            return await mySql.query(`
            SELECT act.id,act.name AS app_name  ,act.time, act.day,
            (SELECT COUNT(id) FROM activity_track WHERE user_id =${user_id} AND admin_id =${admin_id} AND day= '${date}' AND type='APP' ) AS total_apps
            FROM activity_track act
            INNER JOIN users u ON u.id=act.user_id 
            WHERE act.user_id =${user_id} AND act.admin_id =${admin_id} AND act.day= '${date}' AND act.type='APP'
            ORDER BY time DESC
            LIMIT ${skip},${limit}
        `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async browserActivityTrack(admin_id, user_id, date, skip, limit) {
        try {
            return await mySql.query(`
                SELECT act.id, act.name AS app_name, sum(act.time) AS time, act.day,
                COUNT( * ) OVER() AS total_count
                FROM activity_track act
                WHERE act.user_id = ${user_id} AND act.admin_id =${admin_id} AND act.day = '${date}'
                AND act.type = 'WEB'
                GROUP BY app_name
                ORDER BY time DESC
                LIMIT ${skip},${limit}
    `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getUserData(user_id, admin_id) {
        try {
            return await mySql.query(`
                  SELECT id as user_id ,name  AS user_name , full_name, admin_id FROM users WHERE id =${user_id} AND admin_id =${admin_id}
                 `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getUserByEmail(email) {
        return await mySql.query(`SELECT * FROM users u WHERE u.email='${email}'`);
    }

    async getUserByEmpCode(emp_code, admin_id) {
        return await mySql.query(`SELECT * FROM users u WHERE u.emp_code='${emp_code}' AND u.admin_id=${admin_id}`);
    }

    async userRegister(name, full_name, email, email_verified_at, password, remember_token, phone, emp_code, location_id, department_id, date_join, photo_path, address, role_id, status, created_at, updated_at, admin_id, timezone, timezone_offset) {
        return await mySql.query(`
            INSERT INTO users (name,full_name,email  ,password,remember_token,phone,emp_code,location_id ,department_id ,date_join,photo_path,address,role_id,status,admin_id,timezone,timezone_offset)
            VALUES ('${name}', '${full_name}', '${email}',  '${password}', ${remember_token},'${phone}','${emp_code}',${location_id},${department_id},${date_join},'${photo_path}','${address}',${role_id},${status},${admin_id},'${timezone}','${timezone_offset}')
        `);
    }
    async userInformation(userId, admin_id) {
        return await mySql.query(`
                SELECT  id ,emp_code,date_join,phone,address ,full_name,name,email, location_id  ,department_id,date_join,photo_path,role_id,password,timezone,timezone_offset
                FROM users 
                WHERE id = ${userId} AND admin_id= ${admin_id}
            `); //status 1-active  ,0-revmoved employee ,2-suspend 
    }
    async userInformationWithLocationDepartmentAndRole(userId, admin_id) {
        return await mySql.query(`
        SELECT  u.id ,u.emp_code,u.date_join,u.phone,u.address ,u.full_name,u.name,u.email, u.location_id ,u.password ,u.department_id,u.date_join,u.photo_path,u.role_id,u.timezone,u.timezone_offset,
		        r.name as role, r.params as role_code, 
                l.name as location,
                d.name as department
        FROM users u
        INNER JOIN role r ON r.id = u.role_id
        INNER JOIN location l ON l.id = u.location_id
        INNER JOIN department d ON d.id = u.department_id
        WHERE u.id = ${userId} AND u.admin_id= ${admin_id};
            `); //status 1-active  ,0-revmoved employee ,2-suspend 
    }

    async updateProfileData(admin_id, userId, full_name, email, address, locationId, deptId, emp_code, phone, joinDate, photo_path, name, role_id, password, timezone, timezone_offset) {
        return await mySql.query(`
                UPDATE users SET full_name='${full_name}',name='${name}',photo_path='${photo_path}',email='${email}',address='${address}',location_id='${locationId}',department_id='${deptId}',emp_code ='${emp_code}',date_join =${joinDate},phone ='${phone}',role_id=${role_id} ,password='${password}',timezone='${timezone}',timezone_offset='${timezone_offset}'
                WHERE id =${userId} AND admin_id=${admin_id}
        `); //status 1-active employee ,0-ex employee 
    }

    async getUserDetailsLocDept(user_id, admin_id) {
        return await mySql.query(`
                SELECT u.id,u.admin_id,u.password,u.name,u.full_name AS last_name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.photo_path,u.address,r.params,CONCAT(u.name, ' ',u.full_name) AS full_name,
                u.role_id,u.status,l.name AS location_name,d.name AS department_name,r.name AS role_name,u.date_join,u.timezone,u.timezone_offset
                FROM users u
                LEFT JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON r.id=u.role_id
                INNER JOIN department d ON u.department_id = d.id
                WHERE u.id=${user_id} AND u.admin_id=${admin_id}
            `);
    }

    async getUserDetails(user_id, admin_id) {
        return await mySql.query(`SELECT * FROM users u WHERE u.id=${user_id} AND u.admin_id=${admin_id}`);
    }

    getUsersOfOrg(admin_id, manager_id = null) {
        let query = `
            SELECT
                u.id, u.name, u.email,
                l.id AS location_id, l.name AS location_name,
                d.id AS department_id, d.name AS department_name
            FROM users              AS u
            LEFT JOIN location      AS l ON l.id = u.location_id
            LEFT JOIN department    AS d ON d.id = u.department_id
            WHERE u.admin_id = ${admin_id};
        `;

        if (manager_id) {
            query = `
                SELECT
                    u.id, u.name, u.email,
                    l.id AS location_id, l.name AS location_name,
                    d.id AS department_id, d.name AS department_name
                FROM assigned_user      AS au
                LEFT JOIN users         AS u ON au.user_id = u.id
                LEFT JOIN location      AS l ON l.id = u.location_id
                LEFT JOIN department    AS d ON d.id = u.department_id
                WHERE au.admin_id = ${admin_id} AND au.manager_id = ${manager_id};
            `;
        }

        return mySql.query(query);
    }

    getActiveUsersOfOrg(admin_id, manager_id = null) {
        let query = `
            SELECT
                u.id, u.name, u.email,
                l.id AS location_id, l.name AS location_name,
                d.id AS department_id, d.name AS department_name
            FROM users AS u
            LEFT JOIN location AS l
                ON l.id = u.location_id
            LEFT JOIN department AS d
                ON d.id = u.department_id
            WHERE u.admin_id = ${admin_id} AND u.status = 1
        `;

        if (manager_id) {
            query = `
                SELECT
                    u.id, u.name, u.email,
                    l.id AS location_id, l.name AS location_name,
                    d.id AS department_id, d.name AS department_name
                FROM assigned_user AS au
                LEFT JOIN users AS u
                    ON au.user_id = u.id AND u.status = 1
                LEFT JOIN location AS l
                    ON l.id = u.location_id
                LEFT JOIN department AS d
                    ON d.id = u.department_id
                WHERE au.admin_id = ${admin_id} AND au.manager_id = ${manager_id};
            `;
        }

        return mySql.query(query);
    }

    getSuspendedUsersOfOrg(admin_id, manager_id = null) {
        let query = `
            SELECT
                u.id, u.name, u.email,
                l.id AS location_id, l.name AS location_name,
                d.id AS department_id, d.name AS department_name
            FROM users AS u
            LEFT JOIN location AS l
                ON l.id = u.location_id
            LEFT JOIN department AS d
                ON d.id = u.department_id
            WHERE u.admin_id = ${admin_id} AND u.status = 2
        `;

        if (manager_id) {
            query = `
                SELECT
                    u.id, u.name, u.email,
                    l.id AS location_id, l.name AS location_name,
                    d.id AS department_id, d.name AS department_name
                FROM assigned_user AS au
                LEFT JOIN users AS u
                    ON au.user_id = u.id AND u.status = 2
                LEFT JOIN location AS l
                    ON l.id = u.location_id
                LEFT JOIN department AS d
                    ON d.id = u.department_id
                WHERE au.admin_id = ${admin_id} AND au.manager_id = ${manager_id};
            `;
        }

        return mySql.query(query);
    }

    getPresentUsersOfOrg(columns, admin_id, day, manager_id = null) {
        let query = `
            SELECT ${columns}
            FROM production_stats
            WHERE admin_id = ${admin_id} AND day = "${day}"
        `;

        if (manager_id) {
            query = `
                SELECT ${columns.split(',').map((e) => `ps.${e.trim()}`).join(',')}
                FROM assigned_user AS au
                LEFT JOIN production_stats AS ps
                ON au.user_id = ps.user_id AND ps.day="${day}"
                WHERE
                    au.admin_id = ${admin_id} AND
                    au.manager_id = ${manager_id} AND
                    ps.user_id IS NOT NULL;
            `;
        }

        return mySql.query(query);
    }

    getOnlineUsersOfOrg(admin_id, from_date, to_date, day) {
        const query = `
            SELECT u.id,u.name,u.email,u.photo_path,l.id AS location_id,l.name AS location_name,d.name AS department_name,d.id AS department_id
            FROM users u
            INNER JOIN production_stats ps ON ps.user_id=u.id
            INNER JOIN location l ON l.id=u.location_id
            INNER JOIN department d ON d.id=u.department_id
            WHERE ps.admin_id=${admin_id}  AND ps.day ='${day}'
            AND ps.logout_time BETWEEN '${from_date}' AND '${to_date}'
            `;

        return mySql.query(query);
    }

    getOfflineUsersOfOrg(admin_id, from_date, to_date, day) {
        const query = `
            SELECT u.id,u.name,u.email,u.photo_path,u.photo_path,l.id AS location_id,l.name AS location_name,d.name AS department_name,d.id AS department_id
            FROM users u
            INNER JOIN production_stats ps ON ps.user_id=u.id
            INNER JOIN location l ON l.id=u.location_id
            INNER JOIN department d ON d.id=u.department_id
            WHERE ps.admin_id=${admin_id}  AND ps.day ='${day}'
            AND ps.logout_time NOT BETWEEN '${from_date}' AND '${to_date}'
            `;

        return mySql.query(query);
    }

    getOnlineUsersOfManager(admin_id, from_date, to_date, day, manager_id) {
        const query = `
            SELECT u.id,u.name,u.email,u.photo_path,l.id AS location_id,l.name AS location_name,d.name AS department_name,d.id AS department_id
            FROM users u
            INNER JOIN production_stats ps ON ps.user_id=u.id  
            INNER JOIN assigned_user au ON au.user_id=ps.user_id
            INNER JOIN location l ON l.id=u.location_id
            INNER JOIN department d ON d.id=u.department_id  
            WHERE ps.admin_id=${admin_id}  AND ps.day ='${day}' AND au.manager_id=${manager_id}
            AND ps.logout_time BETWEEN '${from_date}' AND '${to_date}'
            `;

        return mySql.query(query);
    }

    getOfflineUsersOfManager(admin_id, from_date, to_date, day, manager_id) {
        const query = `
            SELECT u.id,u.name,u.email,u.photo_path,l.id AS location_id,l.name AS location_name,d.name AS department_name,d.id AS department_id
            FROM users u
            INNER JOIN production_stats ps ON ps.user_id=u.id  
            INNER JOIN assigned_user au ON au.user_id=ps.user_id
            INNER JOIN location l ON l.id=u.location_id
            INNER JOIN department d ON d.id=u.department_id  
            WHERE ps.admin_id=${admin_id}  AND ps.day ='${day}' AND au.manager_id=${manager_id}
            AND ps.logout_time NOT BETWEEN '${from_date}' AND '${to_date}'
            `;

        return mySql.query(query);
    }
    getEmployees(admin_id, manager_id = null, is_location, location_id, is_role, role_id, is_department, department) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        let query = `
            SELECT
                u.id, u.name as first_name,full_name AS last_name, u.email
            FROM users              AS u
            WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                   AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select id from role) ))
                   AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) )
                   AND u.admin_id=${admin_id};
        `;

        if (manager_id) {
            query = `
                SELECT
                    u.id, u.name as first_name,full_name AS last_name, u.email
                FROM assigned_user AS au
                INNER JOIN users AS u ON au.user_id = u.id
                WHERE (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))
                   AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select id from role) ))
                   AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept where dept.admin_id=${admin_id}) )) )
                   AND u.admin_id=${admin_id} AND au.manager_id = ${manager_id};
            `;
        }

        return mySql.query(query);
    }

    async updateUser(values, condition) {
        let query = `UPDATE users SET ${values}
                     WHERE ${condition}`

        return await mySql.query(query); //status 1-active employee ,0-ex employee 
    }



}



module.exports = new User;