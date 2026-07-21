const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class Desktop {

    /**
    *  Get desktop details
    *
    * @function getUserDesktopData
    * @memberof Desktop
    * @param {number} user_id
    * @param {*} cb
    * @returns {Object} -Data or Error.
    */
    async getUserDesktopData(user_id, admin_id, cb) {
        try {
            let desktop = await mySql.query(`
                SELECT * 
                FROM desktop_settings
                WHERE user_id=${user_id} AND admin_id=${admin_id}
            `);
            cb(null, desktop);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
    * Update desktop details
    *
    * @function updateDesktop
    * @memberof Desktop
    * @param {number} user_id
    * @param {boolean} shutdown
    * @param {boolean} restart
    * @param {boolean} logoff
    * @param {boolean} lock_computer
    * @param {boolean} task_manager
    * @param {boolean} block_usb
    * @param {boolean} lock_print
    * @param {boolean} signout
    * @param {boolean} hibernate
    * @param {boolean} sleep
    * @param {*} cb
    * @returns {Object} -Data or Error.
    */
    async updateDesktop(admin_id, user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep, cb) {
        try {
            let desktop = await mySql.query(`
                UPDATE desktop_settings
                SET shutdown=${shutdown},restart=${restart},logoff=${logoff},lock_computer=${lock_computer},task_manager=${task_manager},block_usb=${block_usb},lock_print=${lock_print},signout=${signout},hibernate=${hibernate},sleep=${sleep}
                WHERE user_id = ${user_id} AND admin_id=${admin_id}
            `)
            cb(null, desktop);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
   * Add user desktop control data 
   *
   * @function addDesktopData
   * @memberof Desktop
   * @param {number} user_id
   * @param {boolean} shutdown
   * @param {boolean} restart
   * @param {boolean} logoff
   * @param {boolean} lock_computer
   * @param {boolean} task_manager
   * @param {boolean} block_usb
   * @param {boolean} lock_print
   * @param {boolean} signout
   * @param {boolean} hibernate
   * @param {boolean} sleep
   * @param {*} cb
   * @returns {Object} -Data or Error.
   */
    async addDesktopData(admin_id, user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep, cb) {
        try {
            let desktop = await mySql.query(`
            INSERT INTO desktop_settings (user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep,admin_id)
            VALUES (${user_id}, ${shutdown}, ${restart}, ${logoff}, ${lock_computer}, ${task_manager}, ${block_usb}, ${lock_print}, ${signout}, ${hibernate}, ${sleep},${admin_id})
            `)
            cb(null, desktop);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }

    async getUserList(admin_id, location_id, role_id, department, is_location, is_role, is_department, today_date, skip, limit, cb) {
        let department_id = department ? "'" + department.split(",").join("','") + "'" : 0;
        try {
            let userList = await mySql.query(`
                SELECT u.id,u.name,u.email,u.phone,u.emp_code,u.location_id,u.department_id,u.role_id,l.name AS location,r.name AS role,r.params,d.name AS department,ps.updated_at AS last_updated_time,u.status,u.full_name AS last_name,ds.task_manager, ds.block_usb, ds.lock_print,CONCAT(u.name, ' ',u.full_name) AS full_name,
                (SELECT count(*) FROM users us 
                WHERE (if (${is_location}, (us.location_id=${location_id}), (us.location_id in(select lc.id from location lc) ))
                AND if (${is_role}, (us.role_id=${role_id}), (us.role_id in(select rl.id from role rl) ))
                AND us.admin_id=${admin_id}
                AND if (${is_department},(us.department_id in(${department_id})), (us.department_id in(select dept.id from department dept) )) ) ) AS total_count
                FROM users u
                INNER JOIN location l ON u.location_id = l.id
                INNER JOIN role r ON u.role_id = r.id
                INNER JOIN department d ON u.department_id = d.id 
                LEFT JOIN desktop_settings ds ON ds.user_id=u.id
                LEFT JOIN production_stats ps ON u.id=ps.user_id AND ps.day BETWEEN '${today_date} 00:00:00' AND '${today_date} 23:59:59'
                WHERE  (if (${is_location}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc) ))
                AND if (${is_role}, (u.role_id=${role_id}), (u.role_id in(select rl.id from role rl) ))
                AND if (${is_department}, (u.department_id in(${department_id})), (u.department_id in(select dept.id from department dept) )) )
                AND u.admin_id=${admin_id}
                LIMIT ${skip},${limit}
            `);
            cb(null, userList);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
}

module.exports = new Desktop;



