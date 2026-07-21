"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);

const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

const moment = require('moment');

class Dashboard {

    /**
 *To get register_employees, present_employee ,absent_employees ,working_hours ,non_working_hour ,total_week_hours, online_employees
  AND  offline_employees for Dashboard.
 *
 * @function regEmployeeCount
 * @memberof Dashboard
 * @param {*} cb
 * @returns {Object} - Data or Error.
 */
    async regEmployeeCount(admin_id, day, reseller, cb) {
        let today_date = day ? moment(day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
        let current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        let time_minus = moment().utc().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        let from_date = moment().utc().subtract(7, 'd').format('YYYY-MM-DD');

        try {
            // let reseller = 1;
            let users
            if (reseller === 1) {
                users = await mySql.query(
                    `SELECT count(p.id) AS 'present_emp',  sum(time_to_sec(p.non_working_hours) )/(60*60) AS 'non_working_hours',  sum(time_to_sec(p.working_hours) )/(60*60) AS 'working_hours', sum(time_to_sec(p.total_hours) )/(60*60) AS 'total_hours',
                (Select  sum(time_to_sec(ps.total_hours) )/(60*60)
                    FROM production_stats ps
                    WHERE ps.admin_id=${admin_id} AND ps.day BETWEEN '${from_date}' AND '${today_date}') AS total_week_hours ,
                (Select  count(  DISTINCT ps2.user_id )
                    FROM production_stats ps2
                    INNER JOIN users u ON u.id=ps2.user_id
                    WHERE ps2.admin_id=${admin_id}  AND ps2.day BETWEEN '${today_date}'  AND '${today_date}' 
                    AND u.department_id != 12 AND ps2.logout_time BETWEEN '${time_minus}' AND '${current_time}') AS online,
                (SELECT COUNT(id)
                    FROM users u
                    WHERE u.admin_id=${admin_id} AND u.department_id != 12) AS 'reg_employees',
                (SELECT COUNT(id)
                    FROM users u
                    WHERE u.admin_id=${admin_id} AND u.department_id != 12 AND u.department_id != 12 AND status=2) AS 'suspended_employees'
                FROM production_stats p
                INNER JOIN users u ON u.id=p.user_id
                WHERE  p.day='${today_date}' AND p.admin_id=${admin_id} AND u.department_id != 12` //status 1-active ,0-ex employee
                );
            } else {
                users = await mySql.query(
                    `SELECT count(p.id) AS 'present_emp',  sum(time_to_sec(p.non_working_hours) )/(60*60) AS 'non_working_hours',  sum(time_to_sec(p.working_hours) )/(60*60) AS 'working_hours', sum(time_to_sec(p.total_hours) )/(60*60) AS 'total_hours',
                    (Select  sum(time_to_sec(ps.total_hours) )/(60*60)
                        FROM production_stats ps
                        WHERE ps.admin_id=${admin_id} AND ps.day BETWEEN '${from_date}' AND '${today_date}') AS total_week_hours ,
                    (Select  count(  DISTINCT ps2.user_id )
                        FROM production_stats ps2
                        WHERE ps2.admin_id=${admin_id}  AND ps2.day BETWEEN '${today_date}'  AND '${today_date}' AND ps2.logout_time BETWEEN '${time_minus}' AND '${current_time}') AS online,
                    (SELECT COUNT(id)
                        FROM users u
                        WHERE u.admin_id=${admin_id}) AS 'reg_employees',
                    (SELECT COUNT(id)
                        FROM users u
                        WHERE u.admin_id=${admin_id} AND status=2) AS 'suspended_employees'
                    FROM production_stats p
                    WHERE  p.day='${today_date}' AND p.admin_id=${admin_id}` //status 1-active ,0-ex employee
                );
            }
            cb(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /** for manager */
    async regEmployeeCountManager(manager_id, admin_id, day, cb) {
        let today_date = day ? moment(day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
        let current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        let time_minus = moment().utc().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        let from_date = moment().utc().subtract(7, 'd').format('YYYY-MM-DD');
        try {
            let users = await mySql.query(
                `SELECT count(p.id) AS 'present_emp',  sum(time_to_sec(p.non_working_hours) )/(60*60)   AS 'non_working_hours',sum(time_to_sec(p.working_hours) )/(60*60) AS 'working_hours', sum(time_to_sec(p.total_hours) )/(60*60) AS 'total_hours',
                    (Select sum(time_to_sec(ps.total_hours) )/(60*60)
                    FROM production_stats ps 
                    INNER JOIN assigned_user assigned ON assigned.user_id=ps.user_id
                    WHERE assigned.admin_id=${admin_id} AND assigned.manager_id=${manager_id} AND ps.day BETWEEN '${from_date}' AND '${today_date}') AS total_week_hours ,
                    (Select  count(  DISTINCT ps2.user_id ) 
                        FROM production_stats ps2 
                        INNER JOIN assigned_user auser  ON auser.user_id=ps2.user_id
                        WHERE auser.admin_id=${admin_id} AND auser.manager_id=${manager_id}  AND ps2.day BETWEEN '${today_date}'  AND '${today_date}'  AND  ps2.logout_time  BETWEEN '${time_minus}' AND '${current_time}') AS online,
                    (SELECT COUNT(*) 
                        FROM users user 
                        INNER JOIN assigned_user ause ON ause.user_id=user.id
                        where user.admin_id=${admin_id} AND ause.manager_id=${manager_id}) AS 'assigned_employees',
                    (SELECT COUNT(*) 
                        FROM users user 
                        INNER JOIN assigned_user ause ON ause.user_id=user.id
                        where user.admin_id=${admin_id} AND ause.manager_id=${manager_id} AND user.status=2) AS 'suspended_employees',
                    (SELECT COUNT(*) 
                        FROM users u 
                        WHERE u.admin_id=${admin_id}) AS 'reg_employees'
                FROM production_stats p 
                INNER JOIN assigned_user au ON au.user_id=p.user_id
                WHERE  p.day='${today_date}' AND au.manager_id=${manager_id}  AND p.admin_id=${admin_id}` //status 1-active ,0-ex employee 
            );
            cb(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }


    /**
     *Production hours for dashbord
     *
     * @function production_hours
     * @memberof Dashboard
     * @param {*} cb
     * @param {String} from_date
     * @param {string} to_date
     * @param {number} location_id
     * @param {boolean} is_location_id
     * @param {number} department_id
     * @param {boolean} is_department_id
     * @returns {Object} - Data or Error.
     */

    // SELECT ps.user_id,sum(ps.working_hours) as total_hours,u.name
    // FROM production_stats ps 
    // INNER JOIN users u ON u.id=ps.user_id
    // WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc) ))) 
    // AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(select d.id from department d) )))
    // AND ps.day BETWEEN '${from_date}00:00:00' AND '${to_date} 23:59:59'
    // GROUP BY ps.user_id
    async production_hours(admin_id, from_date, to_date, location_id, is_location_id, department_id, is_department_id, cb) {
        try {
            let production = await mySql.query(
                `SELECT ps.user_id,sum(time_to_sec(ps.working_hours) )/(60*60) as total_hours, CONCAT(u.name,' ',u.full_name) AS name
                FROM production_stats ps 
                INNER JOIN users u ON u.id=ps.user_id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))) 
                AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(select d.id from department d where d.admin_id=${admin_id}) )))
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND ps.admin_id=${admin_id}
                GROUP BY ps.user_id, name`
            )
            cb(null, production);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**for manager */
    async production_hours_for_manager(admin_id, from_date, to_date, location_id, is_location_id, department_id, is_department_id, manager_id, cb) {
        try {
            let production = await mySql.query(
                `SELECT ps.user_id,sum(time_to_sec(ps.working_hours) )/(60*60) as total_hours, CONCAT(u.name,' ',u.full_name) AS name
                FROM production_stats ps 
                INNER JOIN users u ON u.id=ps.user_id
                INNER JOIN assigned_user au ON au.user_id=u.id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))) 
                AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(select d.id from department d where d.admin_id=${admin_id}) )))
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND au.manager_id=${manager_id}
                AND ps.admin_id=${admin_id}
                GROUP BY ps.user_id, name`
            );
            cb(null, production);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *Total active days for dashbord
     *
     * @function get_active_days
     * @memberof Dashboard
     * @param {String} from_date
     * @param {string} to_date
     * @param {number} location_id
     * @param {boolean} is_location_id
     * @param {number} department_id
     * @param {boolean} is_department_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */

    // SELECT COUNT(*) AS total_employees,ps.day
    // FROM production_stats ps
    // INNER JOIN users u ON u.id=ps.user_id
    // WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(SELECT lc.id FROM location lc) ))) 
    // AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(SELECT d.id FROM department d) )))
    // AND ps.day BETWEEN '${from_date} 00:00:00' AND '${to_date} 23:59:59'
    // AND ps.admin_id=${admin_id}
    // GROUP BY ps.day`
    async get_active_days(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, cb) {
        try {
            let production = await mySql.query(
                `SELECT COUNT(*) AS total_employees,ps.day ,DAYOFWEEK(ps.day) as DAYOFWEEK,
                (SELECT COUNT(id)  FROM users WHERE admin_id=${admin_id} AND status!=2 ) AS registered_users
                FROM production_stats ps
                INNER JOIN users u ON u.id=ps.user_id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(SELECT lc.id FROM location lc where lc.admin_id=${admin_id}) ))) 
                AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(SELECT d.id FROM department d where d.admin_id=${admin_id}) )))
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND ps.admin_id=${admin_id}
                AND u.status!=2
                GROUP BY DAYOFWEEK,ps.day
                ORDER by ps.day ASC`
            );
            cb(null, production);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /** for manager */

    async get_active_days_manager(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, manager_id, cb) {
        try {
            let production = await mySql.query(
                `SELECT COUNT(*) AS total_employees,ps.day ,DAYOFWEEK(ps.day) as DAYOFWEEK,
                (SELECT COUNT(u.id) FROM users u
                INNER JOIN assigned_user au ON au.user_id=u.id 
                WHERE au.manager_id=${manager_id} AND u.status!=2) AS registered_users
                FROM production_stats ps
                INNER JOIN users u ON u.id=ps.user_id
                INNER JOIN assigned_user au ON au.user_id=u.id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(SELECT lc.id FROM location lc where lc.admin_id=${admin_id}) ))) 
                AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(SELECT d.id FROM department d where d.admin_id=${admin_id}) )))
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND au.manager_id=${manager_id}
                AND ps.admin_id=${admin_id}
                GROUP BY DAYOFWEEK,ps.day
                ORDER by ps.day ASC`
            );
            cb(null, production);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }


    /**
     * Work hours for different locations
     *
     * @function location_work_hours
     * @memberof Dashboard
     * @param {String} from_date
     * @param {string} to_date
     * @param {number} location_id
     * @param {boolean} is_location_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */

    async location_work_hours(admin_id, from_date, to_date, location_id, is_location_id, cb) {
        try {
            let locations_work_hours = await mySql.query(
                `SELECT  sum(time_to_sec(ps.total_hours) )/(60*60) AS total_hours,sum(time_to_sec(ps.working_hours) )/(60*60) AS working_hours,sum(time_to_sec(ps.non_working_hours) )/(60*60) AS non_working_hours,l.name
                FROM production_stats ps
                INNER JOIN users u ON u.id= ps.user_id
                INNER JOIN location l ON l.id=u.location_id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))) 
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND ps.admin_id=${admin_id}
                GROUP BY l.id ,l.name `
            )
            cb(null, locations_work_hours);
        } catch (err) {
            // Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**for manager */
    async location_work_hours_manager(admin_id, from_date, to_date, location_id, is_location_id, manager_id, cb) {
        try {
            let locations_work_hours = await mySql.query(
                `SELECT sum(time_to_sec(ps.total_hours) )/(60*60) AS total_hours,sum(time_to_sec(ps.working_hours) )/(60*60) AS working_hours,sum(time_to_sec(ps.non_working_hours) )/(60*60)  AS non_working_hours,l.name
                FROM production_stats ps
                INNER JOIN users u ON u.id= ps.user_id
                INNER JOIN location l ON l.id=u.location_id
                INNER JOIN assigned_user au ON au.user_id=u.id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(select lc.id from location lc where lc.admin_id=${admin_id}) ))) 
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND au.manager_id=${manager_id}
                AND ps.admin_id=${admin_id}
                GROUP BY l.id ,l.name `
            )
            cb(null, locations_work_hours);
        } catch (err) {
            // Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * present rate of employees for diferent locations
     *
     * @function present_rate
     * @memberof Dashboard
     * @param {String} from_date
     * @param {string} to_date
     * @param {number} location_id
     * @param {boolean} is_location_id
     * @param {number} department_id
     * @param {boolean} is_department_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async present_rate(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, cb) {
        try {
            let presence_rate = await mySql.query(
                `SELECT CONCAT(u.name,' ',u.full_name) AS name, ps.user_id, ps.day, sum(time_to_sec(ps.working_hours) )/(60*60) AS sum_working_hour, AVG(time_to_sec(ps.working_hours) )/(60*60) AS woking_avg, SUM(time_to_sec(ps.total_hours) )/(60*60) AS sum_total_hours
                FROM production_stats ps
                INNER JOIN users u ON u.id=ps.user_id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(SELECT lc.id FROM location lc where lc.admin_id=${admin_id}) ))) 
                AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(SELECT d.id FROM department d where d.admin_id=${admin_id}) )))
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND ps.admin_id=${admin_id}
                AND u.status!=2
                GROUP BY u.id, name, ps.user_id`
            )
            cb(null, presence_rate);
        } catch (err) {
            // Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**for manager */
    async present_rate_manager(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, manager_id, cb) {
        try {
            let presence_rate = await mySql.query(
                `SELECT CONCAT(u.name,' ',u.full_name) AS name, ps.user_id,ps.day,sum(time_to_sec(ps.working_hours) )/(60*60) AS sum_working_hour,AVG(time_to_sec(ps.working_hours) )/(60*60) AS woking_avg, SUM(time_to_sec(ps.total_hours) )/(60*60) AS sum_total_hours
                FROM production_stats ps 
                INNER JOIN users u ON u.id=ps.user_id
                INNER JOIN assigned_user au ON au.user_id=u.id
                WHERE (if (${is_location_id}, (u.location_id=${location_id}), (u.location_id in(SELECT lc.id FROM location lc where lc.admin_id=${admin_id}) ))) 
                AND (if (${is_department_id}, (u.department_id=${department_id}), (u.department_id in(SELECT d.id FROM department d where d.admin_id=${admin_id}) )))
                AND ps.day BETWEEN '${from_date}' AND '${to_date}'
                AND au.manager_id=${manager_id}
                AND ps.admin_id=${admin_id}
                AND u.status!=2
                GROUP BY u.id, name, ps.user_id`
            )
            cb(null, presence_rate);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async usersStat(admin_id, ideal_time, offline_time, day) {

        let today_date = day ? moment(day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
        const current_time = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        const time_minus_1 = moment.utc().subtract(ideal_time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const time_minus_2 = moment.utc().subtract(offline_time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const from_date = moment.utc().subtract(7, 'd').format('YYYY-MM-DD');

        return await mySql.query(
            `SELECT count(p.id) AS 'present_emp',  sum(time_to_sec(p.non_working_hours) )/(60*60) AS 'non_working_hours', 
                    sum(time_to_sec(p.working_hours) )/(60*60) AS 'working_hours',
                    sum(time_to_sec(p.total_hours) )/(60*60) AS 'total_hours',
                (Select  sum(time_to_sec(ps.total_hours) )/(60*60)
                    FROM production_stats ps
                    WHERE ps.admin_id=${admin_id} AND ps.day BETWEEN '${from_date}' AND '${today_date}') AS total_week_hours ,
                (Select  count(  DISTINCT ps2.user_id )
                    FROM production_stats ps2
                    WHERE ps2.admin_id=${admin_id}  AND ps2.day ='${today_date}' AND
                        ps2.logout_time BETWEEN '${time_minus_1}' AND '${current_time}') AS online,
                (Select count(DISTINCT ps2.user_id) FROM production_stats ps2 
                    WHERE ps2.admin_id = ${admin_id} AND ps2.day ='${today_date}'  
                    AND ps2.logout_time BETWEEN '${time_minus_2}' AND '${time_minus_1}') AS idle,
                (SELECT COUNT(*)
                    FROM users u
                    WHERE u.admin_id=${admin_id}) AS 'reg_employees',
                (SELECT COUNT(*)
                    FROM users u
                    WHERE u.admin_id=${admin_id} AND status=2) AS 'suspended_employees'
                FROM production_stats p
                WHERE  p.day='${today_date}' AND p.admin_id=${admin_id}` //status 1-active ,0-ex employee
        );
    }

    async assignedUserStat(manager_id, admin_id, ideal_time, offline_time, day) {

        const today_date = day ? moment(day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
        const current_time = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        const time_minus_1 = moment.utc().subtract(ideal_time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const time_minus_2 = moment.utc().subtract(offline_time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const from_date = moment.utc().subtract(7, 'd').format('YYYY-MM-DD');

        return await mySql.query(
            `SELECT count(p.id) AS 'present_emp',  sum(time_to_sec(p.non_working_hours) )/(60*60)   AS 'non_working_hours',
                        sum(time_to_sec(p.working_hours) )/(60*60) AS 'working_hours', 
                        sum(time_to_sec(p.total_hours) )/(60*60) AS 'total_hours',
                    (Select sum(time_to_sec(ps.total_hours) )/(60*60)
                        FROM production_stats ps 
                        INNER JOIN assigned_user assigned ON assigned.user_id=ps.user_id
                        WHERE assigned.admin_id=${admin_id} AND assigned.manager_id=${manager_id} AND 
                        ps.day BETWEEN '${from_date}' AND '${today_date}') AS total_week_hours ,
                    (Select  count(  DISTINCT ps2.user_id ) 
                        FROM production_stats ps2 
                        INNER JOIN assigned_user auser  ON auser.user_id=ps2.user_id
                        WHERE  auser.admin_id=${admin_id} AND auser.manager_id=${manager_id}  AND 
                        ps2.day ='${today_date}' AND
                        ps2.logout_time  BETWEEN '${time_minus_1}'    AND '${current_time}') AS online,
                    (Select count(DISTINCT ps2.user_id) 
                        FROM production_stats ps2 
                        INNER JOIN assigned_user auser ON auser.user_id = ps2.user_id 
                        WHERE auser.admin_id = ${admin_id} AND auser.manager_id = ${manager_id} AND 
                        ps2.day ='${today_date}' AND ps2.logout_time BETWEEN '${time_minus_2}'AND 
                        '${time_minus_1}') AS idle,
                    (SELECT COUNT(*) 
                        FROM users user 
                        INNER JOIN assigned_user ause ON ause.user_id=user.id
                        where user.admin_id=${admin_id} AND ause.manager_id=${manager_id}) AS 'reg_employees'
                FROM production_stats p 
                INNER JOIN assigned_user au ON au.user_id=p.user_id
                WHERE  p.day='${today_date}' AND au.manager_id=${manager_id}  AND p.admin_id=${admin_id}` //status 1-active ,0-ex employee 
        );
    }
}
module.exports = new Dashboard;

// let today_date = moment.utc().format('YYYY-MM-DD');
// let current_time = moment.utc().format('YYYY-MM-DD HH:mm:ss');
// let time_minus_1 = moment.utc().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
// let time_minus_2 = moment.utc().subtract(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
// let from_date = moment.utc().subtract(7, 'd').format('YYYY-MM-DD');

// console.log('=================todat=======================', today_date);
// console.log('=================current=======================', current_time);
// console.log('=================time1=======================', time_minus_1);
// console.log('=================time2=======================', time_minus_2);
// const day_of_week = moment().utc().day('monday').hour(0).minute(0).second(0);
// const endOfToday = moment().utc().hour(23).minute(59).second(59);

// if (day_of_week.isBefore(endOfToday)) {
//     day_of_week.add(1, 'weeks');
// }
// console.log(day_of_week._d);

// const next_day = moment().utc().add(1, 'day');
// console.log('=======================', next_day._d);

// // const month = moment().utc().endOf("month")
// const month = moment().utc('2020-03-30')
// if (month.isBefore(endOfToday)) {
//     month.add(1, 'months');
// }
// console.log('-----------', month._d);


// let day='2020-04-10'
// let today_date = day ? moment(day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
// console.log('===============',today_date);