"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;


class Admin {

    /**
     * Get admin details
     *
     * @function admin_Data
     * @memberof Admin
     * @param {number} adminId
     * @param {*} callback
     * @returns {Object} - Data or Error.
     */
    async admin_Data(adminId, callback) {
        try {
            let users = await mySql.query(
                `SELECT * FROM users WHERE  id= ${adminId} ` //status 1-active ,0-account deleted 
            );
            callback(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }


    /**
     * Update admin details 
     *
     * @function admin_Update
     * @memberof AdminUpdate
     * @param {number} adminId
     * @param {string} fullName
     * @param {string} name
     * @param {string} newPassword
     * @param {string} photo_path
     * @param {*} callback
     * @returns {Object} - Data or Error.
     */
    async admin_Update(adminId, fullName, name, newPassword, photo_path, callback) {
        try {
            let users = await mySql.query(
                `UPDATE users SET full_name='${fullName}',photo_path='${photo_path}' ,name='${name}' ,password='${newPassword}' WHERE id='${adminId}'` //status 1-active ,0-account deleted 
            );
            callback(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Get Admin data by email
     *
     * @function admin_auth
     * @memberof Admin
     * @param {string} userName
     * @param {*} callback
     * @returns {Object} - Data or Error.
     */
    async admin_auth(userName, callback) {
        try {
            let users = await mySql.query(`
                SELECT u.id, u.role_id, u.department_id, u.admin_id, u.name, u.full_name, u.email, u.email_verified_at, u.remember_token, u.phone, u.emp_code, u.location_id, u.photo_path, u.address, u.status, a.product_id, a.begin_date, a.expire_date, u.password
                FROM users u 
                INNER JOIN admin a ON u.admin_id=a.id
                WHERE  u.email='${userName}' AND u.status=1 
            `); //status 1-active ,0-account deleted 
            callback(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    async MangerData(email) {
        return await mySql.query(`
                SELECT u.id, u.role_id, u.department_id, u.admin_id, u.name, u.full_name, u.email, u.email_verified_at,
                u.remember_token, u.phone, u.emp_code, u.location_id, u.photo_path, u.address, u.status, a.product_id, 
                a.begin_date, a.expire_date, u.password,u.timezone,u.timezone_offset
                FROM users u
                INNER JOIN admin a ON u.admin_id=a.id
                WHERE  u.email='${email}' AND u.status=1
            `); //status 1-active ,0-account deleted
    }

    async userWithAdminAndRole(email) {
        return await mySql.query(`
                SELECT u.id, u.role_id, u.department_id, u.admin_id, u.name, u.full_name, u.email, u.email_verified_at, u.remember_token, 
                u.phone, u.emp_code, u.location_id, u.photo_path, u.address, u.status, a.product_id, a.begin_date, a.expire_date, u.password, 
                r.name as role, r.params as role_code,u.timezone,u.timezone_offset
                FROM users u
                INNER JOIN admin a ON u.admin_id=a.id
                INNER JOIN role r ON r.id = u.role_id
                WHERE  u.email='${email}' AND u.status=1
            `); //status 1-active ,0-account deleted,2-suspended
    }

    /**
     * Get Admin data by email
     *
     * @function adminAuthentication
     * @memberof Admin
     * @param {string} email
     * @param {*} callback
     * @returns {Object} - Data or Error.
     */
    async adminAuthentication(email, callback) {
        try {
            let admin = await mySql.query(
                `SELECT * FROM admin WHERE  email='${email}'` //status 1-active ,0-account deleted 
            );
            callback(null, admin);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Register admin with all details.
     *
     * @function registerAdmin
     * @memberof User
     * @param {string} name
     * @param {string} first_name
     * @param {string} last_name
     * @param {string} username
     * @param {string} email
     * @param {string} phone
     * @param {string} address
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async registerAdmin(name, first_name, last_name, username, email, phone, address, product_id, begin_date, expire_date, timezone, timezone_offset, cb) {
        try {
            let admin = await mySql.query(
                `INSERT INTO admin (name,first_name,last_name,username,email,phone,address,product_id, begin_date, expire_date,timezone,timezone_offset)
                    VALUES ('${name}', '${first_name}','${last_name}','${username}', '${email}', '${phone}','${address}',${product_id}, '${begin_date}', '${expire_date}','${timezone}',${timezone_offset})
                `);
            let adminFeature = await mySql.query(`INSERT INTO admin_feature(admin_id) VALUES(${admin.insertId})`);
            cb(null, admin);
        } catch (err) {
            console.log('==========', err);
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async updateDetails(admin_id, name, first_name, last_name, email, username, address, phone, product_id, begin_date, expire_date, cb) {
        try {
            let admin = await mySql.query(`
                UPDATE admin 
                SET name='${name}',first_name='${first_name}' ,last_name='${last_name}' ,email='${email}',username='${username}',address='${address}' ,phone='${phone}' ,product_id=${product_id},begin_date='${begin_date}',expire_date='${expire_date}'
                WHERE id=${admin_id} 
            `); //status 1-active ,0-account inactive 
            cb(null, admin);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getDetails(admin_id) {
        return await mySql.query(`
            SELECT id AS admin_id, name, first_name, last_name, username, email, phone, address, status, screenshot_capture_interval, product_id, begin_date, expire_date, ideal_time, offline_time
            FROM admin
            WHERE id = ${admin_id}
        `)
    }
    async updateInteval(admin_id, screenshot_capture_interval, ideal_time, offline_time) {
        return await mySql.query(`
                UPDATE admin
                SET screenshot_capture_interval=${screenshot_capture_interval}, ideal_time= ${ideal_time}, offline_time = ${offline_time}
                WHERE id=${admin_id}
            `);
    }

    async getAdminFeatures(columns, filter) {
        const query = `
          SELECT ${columns}
          FROM admin_feature
          WHERE ${filter};
        `;

        return mySql.query(query);
    }

    async updateAdminFeature(
        screenshot_enabled, website_analytics_enabled, application_analytics_enabled, keystroke_enabled,
        browser_history_enabled, user_log_enabled, firewall_enabled, domain_enabled, admin_id
    ) {
        let query = `UPDATE admin_feature SET
                screenshot_enabled = ${screenshot_enabled},
                website_analytics_enabled = ${website_analytics_enabled},
                application_analytics_enabled = ${application_analytics_enabled},
                keystroke_enabled = ${keystroke_enabled},
                browser_history_enabled = ${browser_history_enabled},
                user_log_enabled = ${user_log_enabled},
                firewall_enabled = ${firewall_enabled},
                domain_enabled = ${domain_enabled}
            WHERE admin_id = ${admin_id}`;

        return mySql.query(query);
    }

}
module.exports = new Admin;

// const async = require('async');
// (
//     async () => {
//         let admins = await mySql.query(`select id,email from admin`);
//         for (const a of admins) {
//             let admin_feature = await mySql.query(`
//                 INSERT INTO admin_feature (admin_id)
//                 VALUES (${a.id})
//                 `)
//             console.log('==================', a.id);
//             console.log('==================', admin_feature);
//         }
//     }
// )();