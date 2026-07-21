const MAC_ADDRESS = require('is-mac-address');
const moment = require('moment')
const UserActivityModel = require('./useractivity.model');
const UserValidation = require('./useractivity.validaton');
const sendResponse = require('../../../utils/myService').sendResponse;
const PasswordEncodeDecoder = require('../../../utils/helpers/PasswordEncoderDecoder');

class UserActivity {
    async updateEmployeeTrackSettings(req, res) {
        let employee_id = req.body.employee_id;
        let track_data = req.body.track_data;
        let columns = `id AS user_id,tracking_rule_type,custom_tracking_rule`;
        let condition = `id=${employee_id}`;
        var validate = UserValidation.customEmpSettingValidation({
            employee_id: employee_id,
            track_data: track_data
            // track_data: { frequencyPerHour: track_data.screenshot.frequencyPerHour || 0, breakInMinut: track_data.breakInMinut || 0 }
        });
        if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });

        try {

            const employee = await UserActivityModel.getEmployee(columns, condition);

            if (employee[0].tracking_rule_type === 3) {
                let data = JSON.parse(employee[0].custom_tracking_rule);

                if (track_data.system) {
                    data.system.type = track_data.system.type;
                    data.system.visibility = track_data.system.visibility;
                }
                if (track_data.screenshot) {
                    data.screenshot.frequencyPerHour = track_data.screenshot.frequencyPerHour || data.screenshot.frequencyPerHour;
                    data.screenshot.employeeAccessibility = track_data.screenshot.employeeAccessibility;
                    data.screenshot.employeeCanDelete = track_data.screenshot.employeeCanDelete;
                }
                data.breakInMinute = track_data.breakInMinute || data.breakInMinute;
                data.idleInMinute = track_data.idleInMinute || data.idleInMinute;
                if (track_data.trackingMode) {
                    var validate = UserValidation.empTrackingModeValidation({ trackingMode: track_data.trackingMode });
                    if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });
                    data.trackingMode = track_data.trackingMode || data.trackingMode;
                }
                if (track_data.tracking) {
                    if (track_data.tracking.unlimited) {
                        data.tracking.unlimited.day = track_data.tracking.unlimited.day;
                    }
                    if (track_data.tracking.fixed) {
                        if (track_data.tracking.fixed.mon) {
                            data.tracking.fixed.mon.status = track_data.tracking.fixed.mon.status;
                            if (track_data.tracking.fixed.mon.time) {
                                let a = track_data.tracking.fixed.mon.time.start.split(":");
                                let a1 = track_data.tracking.fixed.mon.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.mon.time.start = track_data.tracking.fixed.mon.time.start || data.tracking.fixed.mon.time.start;
                                data.tracking.fixed.mon.time.end = track_data.tracking.fixed.mon.time.end || data.tracking.fixed.mon.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.tue) {
                            data.tracking.fixed.tue.status = track_data.tracking.fixed.tue.status;
                            if (track_data.tracking.fixed.tue.time) {
                                let a = track_data.tracking.fixed.tue.time.start.split(":");
                                let a1 = track_data.tracking.fixed.tue.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.tue.time.start = track_data.tracking.fixed.tue.time.start || data.tracking.fixed.tue.time.start;
                                data.tracking.fixed.tue.time.end = track_data.tracking.fixed.tue.time.end || data.tracking.fixed.tue.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.wed) {
                            data.tracking.fixed.wed.status = track_data.tracking.fixed.wed.status;
                            if (track_data.tracking.fixed.wed.time) {
                                let a = track_data.tracking.fixed.wed.time.start.split(":");
                                let a1 = track_data.tracking.fixed.wed.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.wed.time.start = track_data.tracking.fixed.wed.time.start || data.tracking.fixed.wed.time.start;
                                data.tracking.fixed.wed.time.end = track_data.tracking.fixed.wed.time.end || data.tracking.fixed.wed.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.thu) {
                            data.tracking.fixed.thu.status = track_data.tracking.fixed.thu.status;
                            if (track_data.tracking.fixed.thu.time) {
                                let a = track_data.tracking.fixed.thu.time.start.split(":");
                                let a1 = track_data.tracking.fixed.thu.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.thu.time.start = track_data.tracking.fixed.thu.time.start || data.tracking.fixed.thu.time.start;
                                data.tracking.fixed.thu.time.end = track_data.tracking.fixed.thu.time.end || data.tracking.fixed.thu.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.fri) {
                            data.tracking.fixed.fri.status = track_data.tracking.fixed.fri.status;
                            if (track_data.tracking.fixed.fri.time) {
                                let a = track_data.tracking.fixed.fri.time.start.split(":");
                                let a1 = track_data.tracking.fixed.fri.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.fri.time.start = track_data.tracking.fixed.fri.time.start || data.tracking.fixed.fri.time.start;
                                data.tracking.fixed.fri.time.end = track_data.tracking.fixed.fri.time.end || data.tracking.fixed.fri.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sat) {
                            data.tracking.fixed.sat.status = track_data.tracking.fixed.sat.status;
                            if (track_data.tracking.fixed.sat.time) {
                                let a = track_data.tracking.fixed.sat.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sat.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sat.time.start = track_data.tracking.fixed.sat.time.start || data.tracking.fixed.sat.time.start
                                data.tracking.fixed.sat.time.end = track_data.tracking.fixed.sat.time.end || data.tracking.fixed.sat.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sun) {
                            data.tracking.fixed.sun.status = track_data.tracking.fixed.sun.status;
                            if (track_data.tracking.fixed.sun.time.start) {
                                let a = track_data.tracking.fixed.sun.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sun.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sun.time.start = track_data.tracking.fixed.sun.time.start || data.tracking.fixed.sun.time.start
                                data.tracking.fixed.sun.time.end = track_data.tracking.fixed.sun.time.end || data.tracking.fixed.sun.time.end;
                            }
                        }
                    }
                    if (track_data.tracking.networkBased) {
                        data.tracking.networkBased.networkName = track_data.tracking.networkBased.networkName || data.tracking.networkBased.networkName
                        if (track_data.tracking.networkBased.networkMac) {
                            if (MAC_ADDRESS.isMACAddress(track_data.tracking.networkBased.networkMac.replace(/-/g, ":")) === false) return res.json({ code: 404, data: null, message: 'Validation failed', error: 'Invalid MAC address' });
                            data.tracking.networkBased.networkMac = track_data.tracking.networkBased.networkMac || data.tracking.networkBased.networkMac
                        }
                    }
                }
                if (track_data.task) {
                    data.task.employeeCanCreateTask = track_data.task.employeeCanCreateTask;
                }

                let result = JSON.stringify(data);

                let values = `custom_tracking_rule='${result}'`
                let condition = `id=${employee_id}`
                const updated = await UserActivityModel.updateEmployee(values, condition);

                let trackingMode = data.trackingMode;
                data.tracking = { [trackingMode]: data.tracking[trackingMode] };
                if (updated.changedRows === 0) return res.json({ code: 400, data: data, message: 'Not Updated', error: 'Nothing get changed' });
                return res.json({ code: 200, data: data, message: 'Successfully updated tracking data', error: null });

            } else {
                let data = {
                    system: {
                        type: 1,
                        visibility: false,
                    },
                    screenshot: {
                        frequencyPerHour: 0,
                        employeeAccessibility: false,
                        employeeCanDelete: false
                    },
                    breakInMinute: 0,
                    idleInMinute: 10,
                    trackingMode: 'unlimited',
                    tracking: {
                        unlimited: {
                            day: '1,2,3,4,5,6,7',
                        },
                        fixed: {
                            mon: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            tue: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            wed: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            thu: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            fri: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            sat: {
                                status: false,
                                time: { start: '10:00', end: '15:00' }
                            },
                            sun: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                        },
                        networkBased: {
                            networkName: null,
                            networkMac: null,
                        },
                        manual: {
                        },
                        projectBased: {
                        }
                    },
                    task: {
                        employeeCanCreateTask: false
                    }
                }

                if (track_data.system) {
                    data.system.type = track_data.system.type || data.system.type;
                    data.system.visibility = track_data.system.visibility || data.system.visibility;
                }
                if (track_data.screenshot) {
                    data.screenshot.frequencyPerHour = track_data.screenshot.frequencyPerHour || 0;
                    data.screenshot.employeeAccessibility = track_data.screenshot.employeeAccessibility || data.screenshot.employeeAccessibility;
                    data.screenshot.employeeCanDelete = track_data.screenshot.employeeCanDelete || data.screenshot.employeeCanDelete;
                }
                data.breakInMinute = track_data.breakInMinute || 0;
                data.idleInMinute = track_data.idleInMinute || data.idleInMinute;
                if (track_data.trackingMode) {
                    var validate = UserValidation.empTrackingModeValidation({ trackingMode: track_data.trackingMode });
                    if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });
                    data.trackingMode = track_data.trackingMode || data.trackingMode;
                }
                if (track_data.tracking) {
                    if (track_data.tracking.unlimited) {
                        data.tracking.unlimited.day = track_data.tracking.unlimited.day || data.tracking.unlimited.day;
                    }
                    if (track_data.tracking.fixed) {
                        if (track_data.tracking.fixed.mon) {
                            data.tracking.fixed.mon.status = track_data.tracking.fixed.mon.status || data.tracking.fixed.mon.status;
                            if (track_data.tracking.fixed.mon.time) {
                                let a = track_data.tracking.fixed.mon.time.start.split(":");
                                let a1 = track_data.tracking.fixed.mon.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.mon.time.start = track_data.tracking.fixed.mon.time.start || data.tracking.fixed.mon.time.start;
                                data.tracking.fixed.mon.time.end = track_data.tracking.fixed.mon.time.end || data.tracking.fixed.mon.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.tue) {
                            data.tracking.fixed.tue.status = track_data.tracking.fixed.tue.status || data.tracking.fixed.tue.status;
                            if (track_data.tracking.fixed.tue.time) {
                                let a = track_data.tracking.fixed.tue.time.start.split(":");
                                let a1 = track_data.tracking.fixed.tue.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.tue.time.start = track_data.tracking.fixed.tue.time.start || data.tracking.fixed.tue.time.start;
                                data.tracking.fixed.tue.time.end = track_data.tracking.fixed.tue.time.end || data.tracking.fixed.tue.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.wed) {
                            data.tracking.fixed.wed.status = track_data.tracking.fixed.wed.status || data.tracking.fixed.wed.status;
                            if (track_data.tracking.fixed.wed.time) {
                                let a = track_data.tracking.fixed.wed.time.start.split(":");
                                let a1 = track_data.tracking.fixed.wed.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.wed.time.start = track_data.tracking.fixed.wed.time.start || data.tracking.fixed.wed.time.start;
                                data.tracking.fixed.wed.time.end = track_data.tracking.fixed.wed.time.end || data.tracking.fixed.wed.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.thu) {
                            data.tracking.fixed.thu.status = track_data.tracking.fixed.thu.status || data.tracking.fixed.thu.status;
                            if (track_data.tracking.fixed.thu.time) {
                                let a = track_data.tracking.fixed.thu.time.start.split(":");
                                let a1 = track_data.tracking.fixed.thu.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.thu.time.start = track_data.tracking.fixed.thu.time.start || data.tracking.fixed.thu.time.start;
                                data.tracking.fixed.thu.time.end = track_data.tracking.fixed.thu.time.end || data.tracking.fixed.thu.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.fri) {
                            data.tracking.fixed.fri.status = track_data.tracking.fixed.fri.status || data.tracking.fixed.fri.status;
                            if (track_data.tracking.fixed.fri.time) {
                                let a = track_data.tracking.fixed.fri.time.start.split(":");
                                let a1 = track_data.tracking.fixed.fri.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.fri.time.start = track_data.tracking.fixed.fri.time.start || data.tracking.fixed.fri.time.start;
                                data.tracking.fixed.fri.time.end = track_data.tracking.fixed.fri.time.end || data.tracking.fixed.fri.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sat) {
                            data.tracking.fixed.sat.status = track_data.tracking.fixed.sat.status || data.tracking.fixed.sat.status;
                            if (track_data.tracking.fixed.sat.time) {
                                let a = track_data.tracking.fixed.sat.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sat.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sat.time.start = track_data.tracking.fixed.sat.time.start || data.tracking.fixed.sat.time.start
                                data.tracking.fixed.sat.time.end = track_data.tracking.fixed.sat.time.end || data.tracking.fixed.sat.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sun) {
                            data.tracking.fixed.sun.status = track_data.tracking.fixed.sun.status || data.tracking.fixed.sun.status;
                            if (track_data.tracking.fixed.sun.time.start) {
                                let a = track_data.tracking.fixed.sun.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sun.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sun.time.start = track_data.tracking.fixed.sun.time.start || data.tracking.fixed.sun.time.start
                                data.tracking.fixed.sun.time.end = track_data.tracking.fixed.sun.time.end || data.tracking.fixed.sun.time.end;
                            }
                        }
                    }
                    if (track_data.tracking.networkBased) {
                        data.tracking.networkBased.networkName = track_data.tracking.networkBased.networkName || data.tracking.networkBased.networkName
                        if (track_data.tracking.networkBased.networkMac) {
                            if (MAC_ADDRESS.isMACAddress(track_data.tracking.networkBased.networkMac.replace(/-/g, ":")) === false) return res.json({ code: 404, data: null, message: 'Validation failed', error: 'Invalid MAC address' });
                            data.tracking.networkBased.networkMac = track_data.tracking.networkBased.networkMac || data.tracking.networkBased.networkMac
                        }
                    }
                }
                if (track_data.task) {
                    data.task.employeeCanCreateTask = track_data.task.employeeCanCreateTask || data.task.employeeCanCreateTask;
                }

                let result = JSON.stringify(data);
                let values = `tracking_rule_type=3,custom_tracking_rule='${result}'`
                let condition = `id=${employee_id}`
                const updated = await UserActivityModel.updateEmployee(values, condition);

                let trackingMode = data.trackingMode;
                data.tracking = { [trackingMode]: data.tracking[trackingMode] };
                return res.json({ code: 200, data: data, message: 'Successfully updated tracking data', error: null });
            }
        } catch (err) {
            console.log('=======', err);
            return res.json({ code: 400, data: null, message: 'Some error occured', err });
        }
    }

    async getEmpTrackSetting(req, res) {

        var validate = UserValidation.empIdValidation(req.body);
        if (validate.error) return res.json({ code: 404, data: null, message: 'Validation failed', error: validate.error.details[0].message });

        const employee_id = req.body.employee_id;

        try {
            const condition = ` u.id=${employee_id}`;
            const employee = await UserActivityModel.getEmployeefullDetails(condition);
            if (employee.length === 0) return res.json({ code: 400, data: null, message: 'Employee not found', error: 'Employee Not found error' });
            employee[0].custom_tracking_rule = JSON.parse(employee[0].custom_tracking_rule);
            if (employee[0].tracking_rule_type === 3) {
                let trackingMode = employee[0].custom_tracking_rule.trackingMode;
                employee[0].custom_tracking_rule.tracking = { [trackingMode]: employee[0].custom_tracking_rule.tracking[trackingMode] };
            }
            return res.json({ code: 200, data: employee[0], message: 'Employee trac setting data', error: null });
        } catch (err) {
            console.log('========', err)
            res.json({ code: 400, data: null, message: 'Some error occured', error: err });
        }
    }

    async  registerUser(req, res) {
        const first_name = req.body.name;
        const last_name = req.body.full_name;
        const email = req.body.email.toLowerCase();
        const password = req.body.password;
        const emp_code = req.body.emp_code;
        const location_id = parseInt(req.body.location_id);
        const department_id = parseInt(req.body.department_id);
        const role_id = parseInt(req.body.role_id);
        const date_join = moment(req.body.date_join, 'MM/DD/YYYY').format('YYYY-MM-DD') || null;
        const address = req.body.address || null;
        const status = parseInt(req.body.status) || 1;
        const contact_number = req.body.phone.toString() || null;
        const photo_path = '/default/profilePic/user.png';
        const timezone = req.body.timezone;
        const admin_id = req['decoded'].jsonData.admin_id;
        const shift_id = req.body.shift_id || 0
        const tracking_mode = req.body.tracking_mode || 1;
        const tracking_rule_type = req.body.tracking_rule_type || 1;
        const custom_tracking_rule = JSON.stringify({ "screenshot_enabled": 1, "website_analytics_enabled": 1, "application_analytics_enabled": 1, "keystroke_enabled": 1, "browser_history_enabled": 1, "user_log_enabled": 1, "firewall_enabled": 1, "domain_enabled": 1 });

        try {

            let validate = UserValidation.validateUserRegister({
                first_name: first_name, last_name: last_name, email: email, password: password, emp_code: emp_code,
                location_id: location_id, department_id: department_id, role_id: role_id, date_join: date_join, address: address,
                status: status, contact_number: contact_number, timezone: timezone
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const userByEmpCode = await UserActivityModel.getEmployee('id', `emp_code='${emp_code}' AND organization_id=${admin_id}`);
            if (userByEmpCode.length > 0) return sendResponse(res, 400, null, 'With this emp code user already exists.', 'User emp code exists error');

            const userByEmail = await UserActivityModel.getUser('id', `email='${email}'`);
            if (userByEmail.length > 0) return sendResponse(res, 400, null, 'With this email user already exists.', 'Emp code exists error');

            const encripted = await PasswordEncodeDecoder.encryptText(password, process.env.CRYPTO_PASSWORD);

            const user = await UserActivityModel.userRegister(first_name, last_name, email, encripted, contact_number, date_join, address, photo_path, status);

            const employee = await UserActivityModel.addUserToEmp(user.insertId, admin_id, department_id, location_id, emp_code, shift_id, timezone, tracking_mode, tracking_rule_type, custom_tracking_rule);

            const userToRole = await UserActivityModel.addRoleToUser(user.insertId, role_id, admin_id);

            req.body.user_id = user.insertId;

            return sendResponse(res, 200, req.body, 'User successfully registered.', null);
        } catch (err) {
            console.log('=========', err);
            return sendResponse(res, 400, null, 'Error occured while register user.', err);
        }
    }

    async userList(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        const department_id = req.body.department_id;
        const location_id = req.body.location_id || 0;
        const role_id = req.body.role_id || 0;
        const name = req.body.name;

        if (name) {
            if (name.length < 3) return sendResponse(res, 400, null, `Min 'three' characters required.`, null);
        }
        try {
            const validate = UserValidation.usersValidataion({ department_id: department_id, location_id: location_id, role_id: role_id, name: name })
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let users = await UserActivityModel.userList(admin_id, location_id, department_id, role_id, name);
            if (users.length === 0) return sendResponse(res, 400, null, 'Employees not found.', null);

            const total_count = users.length > 0 ? users[0].total_count : 0;
            const has_more_data = (skip + limit) >= total_count ? false : true;

            users.map(e => delete e.total_count);

            return sendResponse(res, 200, {
                user_data: users,
                total_count: total_count,
                has_more_data: has_more_data,
                skip_value: skip + limit,
                limit: limit
            }, 'User data', null);
        } catch (err) {
            console.log('========', err);
            return sendResponse(res, 400, null, 'Error while getting employees', err);
        }
    }
    async updateEmployeeTrackSettings_new(req, res) {
        let employee_id = req.body.employee_id;
        let track_data = req.body.track_data;
        let columns = `user_id,id,tracking_rule_type,custom_tracking_rule`;
        let condition = `id=${employee_id}`;
        var validate = UserValidation.customEmpSettingValidation({
            employee_id: employee_id,
            track_data: track_data
            // track_data: { frequencyPerHour: track_data.screenshot.frequencyPerHour || 0, breakInMinut: track_data.breakInMinut || 0 }
        });
        if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });

        try {

            const employee = await UserActivityModel.getEmployee(columns, condition);

            if (employee[0].tracking_rule_type === 3) {
                let data = JSON.parse(employee[0].custom_tracking_rule);

                if (track_data.system) {
                    data.system.type = track_data.system.type;
                    data.system.visibility = track_data.system.visibility;
                }
                if (track_data.screenshot) {
                    data.screenshot.frequencyPerHour = track_data.screenshot.frequencyPerHour || data.screenshot.frequencyPerHour;
                    data.screenshot.employeeAccessibility = track_data.screenshot.employeeAccessibility;
                    data.screenshot.employeeCanDelete = track_data.screenshot.employeeCanDelete;
                }
                data.breakInMinute = track_data.breakInMinute || data.breakInMinute;
                data.idleInMinute = track_data.idleInMinute || data.idleInMinute;
                if (track_data.trackingMode) {
                    var validate = UserValidation.empTrackingModeValidation({ trackingMode: track_data.trackingMode });
                    if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });
                    data.trackingMode = track_data.trackingMode || data.trackingMode;
                }
                if (track_data.tracking) {
                    if (track_data.tracking.unlimited) {
                        data.tracking.unlimited.day = track_data.tracking.unlimited.day;
                    }
                    if (track_data.tracking.fixed) {
                        if (track_data.tracking.fixed.mon) {
                            data.tracking.fixed.mon.status = track_data.tracking.fixed.mon.status;
                            if (track_data.tracking.fixed.mon.time) {
                                let a = track_data.tracking.fixed.mon.time.start.split(":");
                                let a1 = track_data.tracking.fixed.mon.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.mon.time.start = track_data.tracking.fixed.mon.time.start || data.tracking.fixed.mon.time.start;
                                data.tracking.fixed.mon.time.end = track_data.tracking.fixed.mon.time.end || data.tracking.fixed.mon.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.tue) {
                            data.tracking.fixed.tue.status = track_data.tracking.fixed.tue.status;
                            if (track_data.tracking.fixed.tue.time) {
                                let a = track_data.tracking.fixed.tue.time.start.split(":");
                                let a1 = track_data.tracking.fixed.tue.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.tue.time.start = track_data.tracking.fixed.tue.time.start || data.tracking.fixed.tue.time.start;
                                data.tracking.fixed.tue.time.end = track_data.tracking.fixed.tue.time.end || data.tracking.fixed.tue.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.wed) {
                            data.tracking.fixed.wed.status = track_data.tracking.fixed.wed.status;
                            if (track_data.tracking.fixed.wed.time) {
                                let a = track_data.tracking.fixed.wed.time.start.split(":");
                                let a1 = track_data.tracking.fixed.wed.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.wed.time.start = track_data.tracking.fixed.wed.time.start || data.tracking.fixed.wed.time.start;
                                data.tracking.fixed.wed.time.end = track_data.tracking.fixed.wed.time.end || data.tracking.fixed.wed.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.thu) {
                            data.tracking.fixed.thu.status = track_data.tracking.fixed.thu.status;
                            if (track_data.tracking.fixed.thu.time) {
                                let a = track_data.tracking.fixed.thu.time.start.split(":");
                                let a1 = track_data.tracking.fixed.thu.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.thu.time.start = track_data.tracking.fixed.thu.time.start || data.tracking.fixed.thu.time.start;
                                data.tracking.fixed.thu.time.end = track_data.tracking.fixed.thu.time.end || data.tracking.fixed.thu.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.fri) {
                            data.tracking.fixed.fri.status = track_data.tracking.fixed.fri.status;
                            if (track_data.tracking.fixed.fri.time) {
                                let a = track_data.tracking.fixed.fri.time.start.split(":");
                                let a1 = track_data.tracking.fixed.fri.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.fri.time.start = track_data.tracking.fixed.fri.time.start || data.tracking.fixed.fri.time.start;
                                data.tracking.fixed.fri.time.end = track_data.tracking.fixed.fri.time.end || data.tracking.fixed.fri.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sat) {
                            data.tracking.fixed.sat.status = track_data.tracking.fixed.sat.status;
                            if (track_data.tracking.fixed.sat.time) {
                                let a = track_data.tracking.fixed.sat.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sat.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sat.time.start = track_data.tracking.fixed.sat.time.start || data.tracking.fixed.sat.time.start
                                data.tracking.fixed.sat.time.end = track_data.tracking.fixed.sat.time.end || data.tracking.fixed.sat.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sun) {
                            data.tracking.fixed.sun.status = track_data.tracking.fixed.sun.status;
                            if (track_data.tracking.fixed.sun.time.start) {
                                let a = track_data.tracking.fixed.sun.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sun.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sun.time.start = track_data.tracking.fixed.sun.time.start || data.tracking.fixed.sun.time.start
                                data.tracking.fixed.sun.time.end = track_data.tracking.fixed.sun.time.end || data.tracking.fixed.sun.time.end;
                            }
                        }
                    }
                    if (track_data.tracking.networkBased) {
                        data.tracking.networkBased.networkName = track_data.tracking.networkBased.networkName || data.tracking.networkBased.networkName
                        if (track_data.tracking.networkBased.networkMac) {
                            if (MAC_ADDRESS.isMACAddress(track_data.tracking.networkBased.networkMac.replace(/-/g, ":")) === false) return res.json({ code: 404, data: null, message: 'Validation failed', error: 'Invalid MAC address' });
                            data.tracking.networkBased.networkMac = track_data.tracking.networkBased.networkMac || data.tracking.networkBased.networkMac
                        }
                    }
                }
                if (track_data.task) {
                    data.task.employeeCanCreateTask = track_data.task.employeeCanCreateTask;
                }

                let result = JSON.stringify(data);

                let values = `custom_tracking_rule='${result}'`
                let condition = `id=${employee_id}`
                const updated = await UserActivityModel.updateEmployee(values, condition);

                let trackingMode = data.trackingMode;
                data.tracking = { [trackingMode]: data.tracking[trackingMode] };
                if (updated.changedRows === 0) return res.json({ code: 400, data: data, message: 'Not Updated', error: 'Nothing get changed' });
                return res.json({ code: 200, data: data, message: 'Successfully updated tracking data', error: null });

            } else {
                let data = {
                    system: {
                        type: 1,
                        visibility: false,
                    },
                    screenshot: {
                        frequencyPerHour: 0,
                        employeeAccessibility: false,
                        employeeCanDelete: false
                    },
                    breakInMinute: 0,
                    idleInMinute: 10,
                    trackingMode: 'unlimited',
                    tracking: {
                        unlimited: {
                            day: '1,2,3,4,5,6,7',
                        },
                        fixed: {
                            mon: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            tue: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            wed: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            thu: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            fri: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                            sat: {
                                status: false,
                                time: { start: '10:00', end: '15:00' }
                            },
                            sun: {
                                status: false,
                                time: { start: '10:00', end: '19:00' }
                            },
                        },
                        networkBased: {
                            networkName: null,
                            networkMac: null,
                        },
                        manual: {
                        },
                        projectBased: {
                        }
                    },
                    task: {
                        employeeCanCreateTask: false
                    }
                }

                if (track_data.system) {
                    data.system.type = track_data.system.type || data.system.type;
                    data.system.visibility = track_data.system.visibility || data.system.visibility;
                }
                if (track_data.screenshot) {
                    data.screenshot.frequencyPerHour = track_data.screenshot.frequencyPerHour || 0;
                    data.screenshot.employeeAccessibility = track_data.screenshot.employeeAccessibility || data.screenshot.employeeAccessibility;
                    data.screenshot.employeeCanDelete = track_data.screenshot.employeeCanDelete || data.screenshot.employeeCanDelete;
                }
                data.breakInMinute = track_data.breakInMinute || 0;
                data.idleInMinute = track_data.idleInMinute || data.idleInMinute;
                if (track_data.trackingMode) {
                    var validate = UserValidation.empTrackingModeValidation({ trackingMode: track_data.trackingMode });
                    if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });
                    data.trackingMode = track_data.trackingMode || data.trackingMode;
                }
                if (track_data.tracking) {
                    if (track_data.tracking.unlimited) {
                        data.tracking.unlimited.day = track_data.tracking.unlimited.day || data.tracking.unlimited.day;
                    }
                    if (track_data.tracking.fixed) {
                        if (track_data.tracking.fixed.mon) {
                            data.tracking.fixed.mon.status = track_data.tracking.fixed.mon.status || data.tracking.fixed.mon.status;
                            if (track_data.tracking.fixed.mon.time) {
                                let a = track_data.tracking.fixed.mon.time.start.split(":");
                                let a1 = track_data.tracking.fixed.mon.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.mon.time.start = track_data.tracking.fixed.mon.time.start || data.tracking.fixed.mon.time.start;
                                data.tracking.fixed.mon.time.end = track_data.tracking.fixed.mon.time.end || data.tracking.fixed.mon.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.tue) {
                            data.tracking.fixed.tue.status = track_data.tracking.fixed.tue.status || data.tracking.fixed.tue.status;
                            if (track_data.tracking.fixed.tue.time) {
                                let a = track_data.tracking.fixed.tue.time.start.split(":");
                                let a1 = track_data.tracking.fixed.tue.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.tue.time.start = track_data.tracking.fixed.tue.time.start || data.tracking.fixed.tue.time.start;
                                data.tracking.fixed.tue.time.end = track_data.tracking.fixed.tue.time.end || data.tracking.fixed.tue.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.wed) {
                            data.tracking.fixed.wed.status = track_data.tracking.fixed.wed.status || data.tracking.fixed.wed.status;
                            if (track_data.tracking.fixed.wed.time) {
                                let a = track_data.tracking.fixed.wed.time.start.split(":");
                                let a1 = track_data.tracking.fixed.wed.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.wed.time.start = track_data.tracking.fixed.wed.time.start || data.tracking.fixed.wed.time.start;
                                data.tracking.fixed.wed.time.end = track_data.tracking.fixed.wed.time.end || data.tracking.fixed.wed.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.thu) {
                            data.tracking.fixed.thu.status = track_data.tracking.fixed.thu.status || data.tracking.fixed.thu.status;
                            if (track_data.tracking.fixed.thu.time) {
                                let a = track_data.tracking.fixed.thu.time.start.split(":");
                                let a1 = track_data.tracking.fixed.thu.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.thu.time.start = track_data.tracking.fixed.thu.time.start || data.tracking.fixed.thu.time.start;
                                data.tracking.fixed.thu.time.end = track_data.tracking.fixed.thu.time.end || data.tracking.fixed.thu.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.fri) {
                            data.tracking.fixed.fri.status = track_data.tracking.fixed.fri.status || data.tracking.fixed.fri.status;
                            if (track_data.tracking.fixed.fri.time) {
                                let a = track_data.tracking.fixed.fri.time.start.split(":");
                                let a1 = track_data.tracking.fixed.fri.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.fri.time.start = track_data.tracking.fixed.fri.time.start || data.tracking.fixed.fri.time.start;
                                data.tracking.fixed.fri.time.end = track_data.tracking.fixed.fri.time.end || data.tracking.fixed.fri.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sat) {
                            data.tracking.fixed.sat.status = track_data.tracking.fixed.sat.status || data.tracking.fixed.sat.status;
                            if (track_data.tracking.fixed.sat.time) {
                                let a = track_data.tracking.fixed.sat.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sat.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sat.time.start = track_data.tracking.fixed.sat.time.start || data.tracking.fixed.sat.time.start
                                data.tracking.fixed.sat.time.end = track_data.tracking.fixed.sat.time.end || data.tracking.fixed.sat.time.end;
                            }
                        }
                        if (track_data.tracking.fixed.sun) {
                            data.tracking.fixed.sun.status = track_data.tracking.fixed.sun.status || data.tracking.fixed.sun.status;
                            if (track_data.tracking.fixed.sun.time.start) {
                                let a = track_data.tracking.fixed.sun.time.start.split(":");
                                let a1 = track_data.tracking.fixed.sun.time.end.split(":");
                                let time1 = ((parseInt(a[0]) * 60) + parseInt(a[1]));
                                let time2 = ((parseInt(a1[0]) * 60) + parseInt(a1[1]));
                                if (time1 > time2) return sendResponse(res, 404, null, 'Validation Failed', 'End time must be more than start time');
                                data.tracking.fixed.sun.time.start = track_data.tracking.fixed.sun.time.start || data.tracking.fixed.sun.time.start
                                data.tracking.fixed.sun.time.end = track_data.tracking.fixed.sun.time.end || data.tracking.fixed.sun.time.end;
                            }
                        }
                    }
                    if (track_data.tracking.networkBased) {
                        data.tracking.networkBased.networkName = track_data.tracking.networkBased.networkName || data.tracking.networkBased.networkName
                        if (track_data.tracking.networkBased.networkMac) {
                            if (MAC_ADDRESS.isMACAddress(track_data.tracking.networkBased.networkMac.replace(/-/g, ":")) === false) return res.json({ code: 404, data: null, message: 'Validation failed', error: 'Invalid MAC address' });
                            data.tracking.networkBased.networkMac = track_data.tracking.networkBased.networkMac || data.tracking.networkBased.networkMac
                        }
                    }
                }
                if (track_data.task) {
                    data.task.employeeCanCreateTask = track_data.task.employeeCanCreateTask || data.task.employeeCanCreateTask;
                }

                let result = JSON.stringify(data);
                let values = `tracking_rule_type=3,custom_tracking_rule='${result}'`
                let condition = `id=${employee_id}`
                const updated = await UserActivityModel.updateEmployee(values, condition);

                let trackingMode = data.trackingMode;
                data.tracking = { [trackingMode]: data.tracking[trackingMode] };
                return res.json({ code: 200, data: data, message: 'Successfully updated tracking data', error: null });
            }
        } catch (err) {
            console.log('=======', err);
            return res.json({ code: 400, data: null, message: 'Some error occured', err });
        }
    }

    async getEmpTrackSetting_new(req, res) {

        var validate = UserValidation.empIdValidation(req.body);
        if (validate.error) return res.json({ code: 404, data: null, message: 'Validation failed', error: validate.error.details[0].message });

        const employee_id = req.body.employee_id;

        try {
            const condition = ` e.id=${employee_id}`;
            const employee = await UserActivityModel.getEmployeefullDetails(condition);
            if (employee.length === 0) return res.json({ code: 400, data: null, message: 'Employee not found', error: 'Employee Not found error' });
            employee[0].custom_tracking_rule = JSON.parse(employee[0].custom_tracking_rule);
            if (employee[0].tracking_rule_type === 3) {
                let trackingMode = employee[0].custom_tracking_rule.trackingMode;
                employee[0].custom_tracking_rule.tracking = { [trackingMode]: employee[0].custom_tracking_rule.tracking[trackingMode] };
            }
            return res.json({ code: 200, data: employee[0], message: 'Employee trac setting data', error: null });
        } catch (err) {
            console.log('========', err)
            res.json({ code: 400, data: null, message: 'Some error occured', error: err });
        }
    }

}

module.exports = new UserActivity;