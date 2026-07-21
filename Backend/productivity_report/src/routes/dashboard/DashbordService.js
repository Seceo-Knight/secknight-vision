"use strict";
const moment = require('moment');

if (process.env.IS_DEBUGGING) console.log(__filename);
const dashbord_details = require('../shared/Dashboard');
const DashboardCURD = require('../shared/Dashboard');
const Admin = require('../shared/Admin');
const User = require('../shared/User');
const DashboardValidation = require('.././../rules/validation/Dashboard')
const sendResponse = require('../../utils/myService').sendResponse;

class Dashboard {

    /**
     * Fetching working hours present And absent employees count  and online and offline employees count 
     *
     * @function getDashboardData
     * @memberof DashboardService
     * @param {*} req
     * @param {*} res
     * @returns {Object} -  working hours present And absent employees count  and online and offline employees count  or error .
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Dashboard/get_dashboard}
     * */
    getDashboardData(req, res, next) {
        let admin_id = req['decoded'].jsonData.admin_id;
        const day = req.query.day;
        let reseller = 0;
        if (req.query && req.query.r && req.query.r === '1') reseller = parseInt(req.query.r);

        if (req['decoded'].jsonData.is_manager === true || req['decoded'].jsonData.is_teamlead === true) {
            dashbord_details.regEmployeeCountManager(req['decoded'].jsonData.id, admin_id, day, (err, empCount) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get dashboard data.', null);
                if (empCount.length === 0) return sendResponse(res, 400, null, 'Dashboard Details Data Not Found!', null);

                let total_week_hours = empCount[0].total_week_hours;
                let present_employee = empCount[0].present_emp;
                let register_employees = empCount[0].reg_employees;
                let assigned_employees = empCount[0].assigned_employees;
                let working_hours = (empCount[0].working_hours / present_employee).toFixed(2) || 0;
                let non_working_hours = (empCount[0].non_working_hours / present_employee).toFixed(2) || 0;
                let total_hours = (empCount[0].total_hours / present_employee).toFixed(2) || 0;
                let suspended_employees = empCount[0].suspended_employees;
                let absent_employees = (assigned_employees - present_employee) - suspended_employees;
                let online = empCount[0].online;
                let offline = present_employee - online;
                return res.json({
                    code: 200,
                    data: {
                        register_employees: register_employees || 0,
                        present_employee: present_employee || 0,
                        absent_employees: absent_employees || 0,
                        working_hours: isNaN(working_hours) ? 0 : working_hours,
                        non_working_hours: isNaN(non_working_hours) ? 0 : non_working_hours,
                        total_hours: isNaN(total_hours) ? 0 : total_hours,
                        online_employees: online || 0,
                        offline_employees: offline || 0,
                        suspended_employees: suspended_employees || 0,
                        assigned_employees: assigned_employees || 0

                    },
                    message: 'prodection data ',
                    error: null
                });


            })
        } else if (req['decoded'].jsonData.is_admin === true) {
            dashbord_details.regEmployeeCount(admin_id, day, reseller, (err, empCount) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get dashboard data.', null);
                if (empCount.length === 0) return sendResponse(res, 400, null, 'Dashboard Details Data Not Found!', null);

                let total_week_hours = empCount[0].total_week_hours;
                let present_employee = empCount[0].present_emp;
                let register_employees = empCount[0].reg_employees;
                let working_hours = (empCount[0].working_hours / present_employee).toFixed(2) || 0;
                let non_working_hours = (empCount[0].non_working_hours / present_employee).toFixed(2) || 0;
                let total_hours = (empCount[0].total_hours / present_employee).toFixed(2) || 0;
                let suspended_employees = empCount[0].suspended_employees;
                let absent_employees = (register_employees - present_employee) - suspended_employees;
                let online = empCount[0].online;
                let offline = present_employee - online;
                return res.json({
                    code: 200,
                    data: {
                        register_employees: register_employees || 0,
                        present_employee: present_employee || 0,
                        absent_employees: absent_employees || 0,
                        working_hours: isNaN(working_hours) ? 0 : working_hours,
                        non_working_hours: isNaN(non_working_hours) ? 0 : non_working_hours,
                        total_hours: isNaN(total_hours) ? 0 : total_hours,
                        online_employees: online || 0,
                        offline_employees: offline || 0,
                        suspended_employees: suspended_employees || 0
                    },
                    message: 'production data ',
                    error: null
                });


            })
        } else {
            next();
        }
    }


    /**for manager  */
    getDashboardDataManager(req, res) {
        let manager_id = 0;
        if (req['decoded'].jsonData.is_manager == true) {
            manager_id = req['decoded'].jsonData.id;
        } else {
            return res.json({
                code: 400,
                data: null,
                message: 'Invalid Credentials',
                error: validate.error.details[0].message
            });
        }
        let validate = DashboardValidation.dashbord(req.body.manager_id)
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        }
        dashbord_details.regEmployeeCountManager(manager_id, (err, empCount) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Failed to Fetch Data.',
                    error: err
                });
            } else if (empCount.length > 0) {
                let total_week_hours = empCount[0].total_week_hours;
                let present_employee = empCount[0].present_emp;
                let register_employees = empCount[0].reg_employees;
                let working_hours = (empCount[0].working_hours / present_employee) || 0;
                let non_working_hours = (empCount[0].non_working_hours / present_employee) || 0;
                let total_hours = (empCount[0].total_hours / present_employee) || 0;
                let absent_employees = register_employees - present_employee;
                let online = empCount[0].online;
                let offline = present_employee - online;
                return res.json({
                    code: 200,
                    data: {
                        register_employees: register_employees,
                        present_employee: present_employee,
                        absent_employees: absent_employees,
                        working_hours: working_hours,
                        non_working_hours: non_working_hours,
                        total_hours: total_hours,
                        online_employees: online,
                        offline_employees: offline
                    },
                    message: 'prodection data ',
                    error: null
                });

            } else {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Dashboard Details Data Not Found.',
                    error: err
                });
            }
        })
    }

    /**
     * Fetching total production hours for perticular location and department for dashboard 
     *
     * @function getProductionHours
     * @memberof DashboardService
     * @param {*} req
     * @param {*} res
     * @returns {Object} -  total production hours  or error .
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Dashboard/post_dashboard_production }
     */
    getProductionHours(req, res, next) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req.body.manager_id;
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD')
        let is_location_id = req.body.location_id ? true : false;
        let location_id = req.body.location_id || 0;
        let department_id = req.body.department_id || 0;
        let is_department_id = req.body.department_id ? true : false;
        let validate = DashboardValidation.getProductionHours(req.body.from_date, req.body.to_date, req.body.location_id, req.body.manager_id)
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        const start = moment(from_date, "YYYY-MM-DD");
        const end = moment(to_date, "YYYY-MM-DD");
        const totaldays = Math.abs(moment.duration(start.diff(end)).asDays());
        if (totaldays > 31) return sendResponse(res, 400, null, 'Not allowed more than 31 days', null);

        if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
            dashbord_details.production_hours_for_manager(admin_id, from_date, to_date, location_id, is_location_id, department_id, is_department_id, req['decoded'].jsonData.id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Error While Fetching Production Hours.', err);

                if (data.length > 0) {
                    let total_production_hours = 0;
                    data.forEach(production => {
                        total_production_hours = Number(total_production_hours) + Number(production.total_hours);
                    });
                    return sendResponse(res, 200, {
                        total_production_hours: total_production_hours,
                        data
                    }, 'production hours', null);
                } else {
                    return sendResponse(res, 400, null, 'Production Data Not Found.', null);
                }
            })
        } else if (req['decoded'].jsonData.is_admin == true) {
            dashbord_details.production_hours(admin_id, from_date, to_date, location_id, is_location_id, department_id, is_department_id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Error While Fetching Production Hours.', err);
                if (data.length > 0) {
                    let total_production_hours = 0;
                    data.forEach(production => {
                        total_production_hours = Number(total_production_hours) + Number(production.total_hours);
                        total_production_hours = total_production_hours.toFixed(2);
                    });
                    // let total_hours = data.length > 0 ? data[0].total_hours : 0;
                    // data.map(e => delete e.total_hours);
                    return sendResponse(res, 200, {
                        total_production_hours: total_production_hours,
                        data
                    }, 'production hours', null);
                } else {
                    return sendResponse(res, 400, null, 'Production Data Not Found.', null);
                }
            })
        } else {
            next();
        }
    }


    /**
     *  Active days for perticular location and department for dashboard 
     *
     * @function getActiveDays
     * @memberof DashboardService
     * @param {*} req
     * @param {*} res
     * @returns {Object} -  Active days or error .
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Dashboard/post_dashboard_active_days }
     * */
    getActiveDays(req, res, next) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req.body.manager_id;
        // let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        // let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        let is_location_id = req.body.location_id ? true : false;
        let is_department_id = req.body.department_id ? true : false;
        let location_id = req.body.location_id || 0;
        let department_id = req.body.department_id || 0;
        let validate = DashboardValidation.getActiveDays(req.body.from_date, req.body.to_date, req.body.location_id, req.body.department_id, req.body.manager_id)
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
            dashbord_details.get_active_days_manager(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, req['decoded'].jsonData.id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get active days', err);
                if (data.length === 0) return sendResponse(res, 400, null, 'Active days data not found!', null);

                let active_data = [];
                data.forEach(active_days => {
                    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    var d = new Date(active_days.day);
                    var dayName = days[d.getDay()];
                    var present_percentage = (active_days.total_employees / active_days.registered_users) * 100;
                    active_data.push({
                        total_employees: active_days.total_employees,
                        day: active_days.day,
                        dayName: dayName,
                        present_percentage: present_percentage
                    })
                });
                return sendResponse(res, 200, active_data, 'active days.', null);
            })
        } else if (req['decoded'].jsonData.is_admin == true) {
            dashbord_details.get_active_days(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get active days', err);
                if (data.length === 0) return sendResponse(res, 400, null, 'Active days data not found!', null);
                let active_data = [];
                data.forEach(active_days => {
                    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    var d = new Date(active_days.day);
                    var dayName = days[d.getDay()];
                    var present_percentage = (active_days.total_employees / active_days.registered_users) * 100;
                    active_data.push({
                        total_employees: active_days.total_employees,
                        day: active_days.day,
                        dayName: dayName,
                        present_percentage: present_percentage
                    })
                });
                return sendResponse(res, 200, active_data, 'active days.', null);
            })
        } else {
            next();
        }
    }

    /**
     *  Get working hours for different location 
     *
     * @function getLocationWorkHours
     * @memberof DashboardService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Working hours or error .
     * @see also {@link http://localhost:3003/api/v1/explorer/#/Dashboard/post_dashboard_location_hours }
     * */
    getLocationWorkHours(req, res, next) {
        let admin_id = req['decoded'].jsonData.admin_id
        let manager_id = req.body.manager_id;
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        let is_location_id = req.body.location_id ? true : false;
        let location_id = req.body.location_id || 1;
        let validate = DashboardValidation.getLocationWorkingHours(req.body.from_date, req.body.to_date, req.body.location_id, req.body.manager_id)
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
            dashbord_details.location_work_hours_manager(admin_id, from_date, to_date, location_id, is_location_id, req['decoded'].jsonData.id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get working hours for different location', err);
                if (data.length === 0) return sendResponse(res, 400, null, 'Work hours data not found.', null);
                return sendResponse(res, 200, data, 'Work hours for different location', null);
            })

        } else {
            dashbord_details.location_work_hours(admin_id, from_date, to_date, location_id, is_location_id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get working hours for different location', err);
                if (data.length === 0) return sendResponse(res, 400, null, 'Work hours data not found.', null);
                return sendResponse(res, 200, data, 'Work hours for different location', null);
            })
        }
    }

    /**
     *  present rate of employees for diferent locations
     *
     * @function getPresenceRate
     * @memberof DashboardService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Presence rate or error .
     * @see also {@link http://localhost:3003/api/v1/explorer/#/Dashboard/post_dashboard_present_rate }
     * */
    getPresenceRate(req, res, next) {
        let admin_id = req['decoded'].jsonData.admin_id
        let manager_id = req.body.manager_id;
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        let is_location_id = req.body.location_id ? true : false;
        let is_department_id = req.body.department_id ? true : false;
        let location_id = req.body.location_id || 0;
        let department_id = req.body.department_id || 0;
        let validate = DashboardValidation.getActiveDays(req.body.from_date, req.body.to_date, req.body.location_id, req.body.department_id, req.body.manager_id)
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        if (req['decoded'].jsonData.is_manager === true || req['decoded'].jsonData.is_teamlead === true) {
            dashbord_details.present_rate_manager(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, req['decoded'].jsonData.id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Error while fetching presence rate of employees.', err);
                if (data.length === 0) return sendResponse(res, 400, null, 'Presence rate data not found !', null);
                let sum_working_hour = 0;
                let sum_total_hours = 0;
                data.forEach(hours => {
                    sum_total_hours += hours.sum_total_hours;
                    sum_working_hour += hours.sum_working_hour
                });
                data.map(e => (delete e.sum_total_hours, delete e.sum_working_hour));
                return res.json({
                    code: 200,
                    data: {
                        sum_total_hours: sum_total_hours,
                        sum_working_hour: sum_working_hour,
                        data: data
                    },
                    message: 'presence rate  ',
                    error: null
                });

            })
        } else if (req['decoded'].jsonData.is_admin === true) {
            dashbord_details.present_rate(admin_id, from_date, to_date, location_id, department_id, is_location_id, is_department_id, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Error while fetching presence rate of employees.', err);
                if (data.length === 0) return sendResponse(res, 400, null, 'Presence rate data not found !', null);
                let sum_working_hour = 0;
                let sum_total_hours = 0;
                data.forEach(hours => {
                    sum_total_hours += hours.sum_total_hours;
                    sum_working_hour += hours.sum_working_hour
                });
                // let sum_total_hours = data.length > 0 ? data[0].sum_total_hours : 0;
                // let sum_working_hour = data.length > 0 ? data[0].sum_working_hour : 0;
                data.map(e => (delete e.sum_total_hours, delete e.sum_working_hour));
                return res.json({
                    code: 200,
                    data: {
                        sum_total_hours: sum_total_hours,
                        sum_working_hour: sum_working_hour,
                        data: data
                    },
                    message: 'presence rate  ',
                    error: null
                });
            })
        } else {
            next();
        }
    }
    async userStat(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const day = req.query.day;
        if (req['decoded'].jsonData.is_manager === true) {
            try {
                const admin = await Admin.getDetails(admin_id);
                const stats = await DashboardCURD.assignedUserStat(req['decoded'].jsonData.id, admin_id, admin[0].ideal_time, admin[0].offline_time, day);

                const total_week_hours = stats[0].total_week_hours;
                const present_employee = stats[0].present_emp;
                const register_employees = stats[0].reg_employees;
                const working_hours = (stats[0].working_hours / present_employee).toFixed(2) || 0;
                const non_working_hours = (stats[0].non_working_hours / present_employee).toFixed(2) || 0;
                const total_hours = (stats[0].total_hours / present_employee).toFixed(2) || 0;
                const absent_employees = register_employees - present_employee;
                const online = stats[0].online;
                const idle = stats[0].idle;
                const offline = present_employee - online;
                return res.json({
                    code: 200,
                    data: {
                        register_employees: register_employees || 0,
                        present_employee: present_employee || 0,
                        absent_employees: absent_employees || 0,
                        working_hours: isNaN(working_hours) ? 0 : working_hours,
                        non_working_hours: isNaN(non_working_hours) ? 0 : non_working_hours,
                        total_hours: isNaN(total_hours) ? 0 : total_hours,
                        online_employees: online,
                        idle_employees: idle,
                        offline_employees: offline
                    },
                    message: 'Production Stat Data.',
                    error: null
                });
            } catch (err) {
                console.log(err)
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Unable To Get Production Stats.',
                    error: err
                });
            }
        } else {
            try {
                const admin = await Admin.getDetails(admin_id);
                const stats = await DashboardCURD.usersStat(admin_id, admin[0].ideal_time, admin[0].offline_time, day);

                const total_week_hours = stats[0].total_week_hours;
                const present_employee = stats[0].present_emp;
                const register_employees = stats[0].reg_employees;
                const working_hours = (stats[0].working_hours / present_employee).toFixed(2) || 0;
                const non_working_hours = (stats[0].non_working_hours / present_employee).toFixed(2) || 0;
                const total_hours = (stats[0].total_hours / present_employee).toFixed(2) || 0;
                const absent_employees = register_employees - present_employee;
                const online = stats[0].online;
                const suspended_employees = stats[0].suspended_employees;
                const idle = stats[0].idle;
                const offline = present_employee - (online + idle);

                return res.json({
                    code: 200,
                    data: {
                        register_employees: register_employees || 0,
                        present_employee: present_employee || 0,
                        absent_employees: absent_employees || 0,
                        working_hours: isNaN(working_hours) ? 0 : working_hours,
                        non_working_hours: isNaN(non_working_hours) ? 0 : non_working_hours,
                        total_hours: isNaN(total_hours) ? 0 : total_hours,
                        online_employees: online || 0,
                        idle_employees: idle || 0,
                        offline_employees: offline || 0,
                        suspended_employees: suspended_employees || 0
                    },
                    message: 'Production Stat.',
                    error: null
                });
            } catch (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Unable To Get Production Stats.',
                    error: err
                });
            }
        }
    }

    async getAbsentEmp(req, res, next) {
        let manager_id = null;
        const day = req.query.day;
        const admin_id = req['decoded'].jsonData.admin_id;

        if (!day) {
            res.status(400).json({
                code: 400,
                data: null,
                message: 'Day is required',
                error: 'Bad Request'
            });
        }

        if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
            manager_id = req['decoded'].jsonData.id;
        }

        Promise
            .all([
                User.getActiveUsersOfOrg(admin_id, manager_id),
                User.getPresentUsersOfOrg('user_id', admin_id, day, manager_id)
            ])
            .then(([allUsers, presentUsers]) => {
                const absentEMP = allUsers.filter(item => !presentUsers.find(x => x.user_id === item.id));

                res.json({
                    code: 200,
                    data: absentEMP,
                    message: 'Absent Employees.',
                    error: null
                });
            })
            .catch(err => next(err));
    }

    async getRegisteredEmp(req, res, next) {
        try {
            let manager_id = null;
            const admin_id = req['decoded'].jsonData.admin_id;

            if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
                manager_id = req['decoded'].jsonData.id;
            }

            const employees = await User.getUsersOfOrg(admin_id, manager_id);

            res.json({
                code: 200,
                data: employees,
                message: 'Registered Employees.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async getSuspendedEmp(req, res, next) {
        try {
            let manager_id = null;
            const admin_id = req['decoded'].jsonData.admin_id;

            if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
                manager_id = req['decoded'].jsonData.id;
            }

            const employees = await User.getSuspendedUsersOfOrg(admin_id, manager_id);

            res.json({
                code: 200,
                data: employees,
                message: 'Suspended Employees.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async getOnlineEmp(req, res, next) {
        try {
            const admin_id = req["decoded"].jsonData.admin_id;
            const manager_id = req["decoded"].jsonData.id;
            const day = req.query.day ? moment(req.query.day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
            const from_date = moment().utc().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const to_date = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            const is_admin = req["decoded"].jsonData.is_admin;

            if (is_admin === true) {
                const employees = await User.getOnlineUsersOfOrg(admin_id, from_date, to_date, day);
                return sendResponse(res, 200, employees, 'Online Employeee', null);
            } else if (req["decoded"].jsonData.is_manager === true || req["decoded"].jsonData.is_teamlead === true) {
                const employees = await User.getOnlineUsersOfManager(admin_id, from_date, to_date, day, manager_id);
                return sendResponse(res, 200, employees, 'Online Employeee', null);
            } else {
                next();
            }
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to get Online users', err);
        }
    }

    async getOfflineEmp(req, res, next) {
        try {
            const admin_id = req["decoded"].jsonData.admin_id;
            const manager_id = req["decoded"].jsonData.id;
            const day = req.query.day ? moment(req.query.day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
            const from_date = moment().utc().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const to_date = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            const is_admin = req["decoded"].jsonData.is_admin;

            if (is_admin === true) {
                const employees = await User.getOfflineUsersOfOrg(admin_id, from_date, to_date, day);
                return sendResponse(res, 200, employees, 'Offline Employeee', null);
            } else if (req["decoded"].jsonData.is_manager === true || req["decoded"].jsonData.is_teamlead === true) {
                const employees = await User.getOfflineUsersOfManager(admin_id, from_date, to_date, day, manager_id);
                return sendResponse(res, 200, employees, 'Offline Employeee', null);
            } else {
                next();
            }
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to get Online users', err);
        }
    }
}
module.exports = new Dashboard;