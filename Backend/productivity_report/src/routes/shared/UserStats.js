
'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const mySql = require('../../database/MySqlConnection').getInstance();
// const Logger = require('../../logger/Logger').logger;

class UserStats {

    async topApps(admin_id, location_id, department_id, is_location, is_department, skip, limit, from_date, to_date, is_date, cb) {

        try {
            let top_apps = await mySql.query(`
            SELECT a.id,COUNT(a.app_name) AS count, a.app_name, a.admin_id ,l.name AS Location,l.id AS location_id 
            FROM application_used a
            INNER JOIN users u ON u.id=a.user_id
            INNER JOIN location l ON l.id=u.location_id
            INNER JOIN department d ON d.id=u.department_id
            WHERE a.admin_id=${admin_id}   AND (if(${is_date} ,(a.create_date BETWEEN  '${from_date} 00:00:00' AND  '${to_date} 23:59:59'),(a.create_date IN ( Select create_date FROM application_used  WHERE admin_id=${admin_id}) )) )
            AND if(${is_department} ,(u.department_id =${department_id}),(u.department_id in ( SELECT uu.department_id FROM users uu WHERE uu.admin_id=${admin_id})))      
            AND if(${is_location} ,(u.location_id =${location_id}),(u.location_id in ( SELECT uuu.location_id FROM users uuu WHERE uuu.admin_id=${admin_id}))) 
            GROUP BY a.app_name
            ORDER BY count DESC
            LIMIT ${skip},${limit}
            `)
            cb(null, top_apps)
        } catch (err) {
            cb(err, null)
        }
    }

    async topWebsites(admin_id, location_id, department_id, is_location, is_department, skip, limit, from_date, to_date, is_date, cb) {

        try {
            let top_websites = await mySql.query(`
            SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(REPLACE(REPLACE(LOWER(bh.url), 'https://', ''), 'http://', ''), '/', 1), '?', 1) AS domain,
            COUNT(SUBSTRING_INDEX(SUBSTRING_INDEX(REPLACE(REPLACE(LOWER(bh.url), 'https://', ''), 'http://', ''), '/', 1), '?', 1)) as count,l.name AS location ,l.id AS location_id
            FROM  browser_history bh
            INNER JOIN users u ON u.id=bh.user_id
            INNER JOIN location l ON l.id=u.location_id
            INNER JOIN department d ON d.id=u.department_id
            WHERE bh.admin_id=${admin_id} AND (if(${is_date} ,(bh.create_date BETWEEN  '${from_date} 00:00:00' AND  '${to_date} 23:59:59'),(bh.create_date IN ( Select browser.create_date FROM browser_history browser  WHERE browser.admin_id=${admin_id}) )) )
            AND if(${is_department} ,(u.department_id =${department_id}),(u.department_id in ( SELECT uu.department_id FROM users uu WHERE uu.admin_id=1)))      
            AND if(${is_location} ,(u.location_id =${location_id}),(u.location_id in ( SELECT uuu.location_id FROM users uuu WHERE uuu.admin_id=1))) 
            GROUP BY domain
            ORDER BY count DESC
            LIMIT ${skip}, ${limit}
            `)
            cb(null, top_websites)
        } catch (err) {
            cb(err, null)
        }
    }
}

module.exports = new UserStats;