const async = require('async');
const moment = require('moment');

const Desktop = require('../shared/Desktop');
const desktopValidation = require('../../rules/validation/User');
const validateDesktop = require('../../rules/validation/Desktop');
const JoiValidationUser = require('../../rules/validation/User');

class DesktopService {

    /**
     * Desktop setting like shutdown,restart etc.
     *
     * @function DesktopControls
     * @memberof DesktopService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Desktop/post_desktop_settings}
     */
    desktopControl(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let validation = desktopValidation.validateId(user_id)
        if (validation.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validation.error.details[0].message });
        } else {
            Desktop.getUserDesktopData(user_id, admin_id, (err, data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Unable To Update Desktop Data.', error: err });
                } else {
                    if (data.length > 0) {
                        let shutdown = req.body.shutdown || data[0].shutdown;
                        let restart = req.body.restart || data[0].restart;
                        let logoff = req.body.logoff || data[0].logoff;
                        let lock_computer = req.body.lock_computer || data[0].lock_computer;
                        let task_manager = req.body.task_manager || data[0].task_manager;
                        let block_usb = req.body.block_usb || data[0].block_usb;
                        let lock_print = req.body.lock_print || data[0].lock_print;
                        let signout = req.body.signout || data[0].signout;
                        let hibernate = req.body.hibernate || data[0].hibernate;
                        let sleep = req.body.sleep || data[0].sleep;
                        Desktop.updateDesktop(admin_id, user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep, (err, updatedData) => {
                            if (err) {
                                return res.json({ code: 400, data: null, message: 'Unable To Update Desktop Data.', error: err });
                            } else {
                                return res.json({ code: 200, data: req.body, message: 'Succefully Updated Desktop Data.', error: err });
                            }
                        })
                    } else {
                        let shutdown = req.body.shutdown || false;
                        let restart = req.body.restart || false;
                        let logoff = req.body.logoff || false;
                        let lock_computer = req.body.lock_computer || false;
                        let task_manager = req.body.task_manager || false;
                        let block_usb = req.body.block_usb || false;
                        let lock_print = req.body.lock_print || false;
                        let signout = req.body.signout || false;
                        let hibernate = req.body.hibernate || false;
                        let sleep = req.body.sleep || false;
                        Desktop.addDesktopData(admin_id, user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep, (err, updatedData) => {
                            if (err) {
                                return res.json({ code: 400, data: null, message: 'Unable To Update Desktop Data.', error: err });
                            } else {
                                return res.json({ code: 200, data: req.body, message: 'Succefully Updated Desktop Data.', error: err });
                            }
                        })
                    }
                }
            })
        }
    }

    /**
     * Desktop setting like shutdown,restart etc for multiple user.
     *
     * @function desktopControlMultipleUser
     * @memberof DesktopService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Desktop/post_desktop_settings_multi_user}
     */
    desktopControlMultipleUser(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_ids = req.body.user_ids;
        let shutdown = req.body.shutdown;
        let restart = req.body.restart;
        let logoff = req.body.logoff;
        let lock_computer = req.body.lock_computer;
        let task_manager = req.body.task_manager;
        let block_usb = req.body.block_usb;
        let lock_print = req.body.lock_print;
        let signout = req.body.signout;
        let hibernate = req.body.hibernate;
        let sleep = req.body.sleep;

        let validation = validateDesktop.validateDesktopData(user_ids, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep);
        if (validation.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validation.error.details[0].message });
        } else {
            async.forEachSeries(user_ids, (user_id, cb) => {
                Desktop.getUserDesktopData(user_id, admin_id, (err, data) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Unable To Update Desktop Data.', error: err });
                    } else {
                        if (data.length > 0) {
                            let shutdown = req.body.shutdown || data[0].shutdown;
                            let restart = req.body.restart || data[0].restart;
                            let logoff = req.body.logoff || data[0].logoff;
                            let lock_computer = req.body.lock_computer || data[0].lock_computer;
                            let task_manager = req.body.task_manager || data[0].task_manager;
                            let block_usb = req.body.block_usb || data[0].block_usb;
                            let lock_print = req.body.lock_print || data[0].lock_print;
                            let signout = req.body.signout || data[0].signout;
                            let hibernate = req.body.hibernate || data[0].hibernate;
                            let sleep = req.body.sleep || data[0].sleep;
                            Desktop.updateDesktop(admin_id, user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep, (err, updatedData) => {
                                if (err) {
                                    cb();
                                } else {
                                    cb();
                                }
                            })
                        } else {
                            let shutdown = req.body.shutdown || false;
                            let restart = req.body.restart || false;
                            let logoff = req.body.logoff || false;
                            let lock_computer = req.body.lock_computer || false;
                            let task_manager = req.body.task_manager || false;
                            let block_usb = req.body.block_usb || false;
                            let lock_print = req.body.lock_print || false;
                            let signout = req.body.signout || false;
                            let hibernate = req.body.hibernate || false;
                            let sleep = req.body.sleep || false;
                            Desktop.addDesktopData(admin_id, user_id, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep, (err, updatedData) => {
                                if (err) {
                                    cb();
                                } else {
                                    cb();
                                }
                            })
                        }
                    }
                })
            }, () => {
                let obj = req.body;
                delete req.body.user_ids;
                let action = Object.keys(obj);
                let message;
                switch (action[0]) {
                    case 'shutdown':
                        message = 'System(s) Has Been Shutdown.'
                        break;
                    case 'restart':
                        message = 'System(s) Has Been Restarted.'
                        break;
                    case 'logoff':
                        message = 'System(s) Has Been Logged Off.'
                        break;
                    case 'lock_computer':
                        message = 'System(s) Has Been Locked.'
                        break;
                    case 'task_manager':
                        message = 'System(s) Task Manager Has Been Disabled.'
                        break;
                    case 'block_usb':
                        message = 'System(s) USB Port Has Been Disabled'
                        break;
                    case 'lock_print':
                        message = 'System(s) Print Has Been Disabled'
                        break;
                    case 'signout':
                        message = 'System(s) Has Been Signed Out'
                        break;
                    case 'hibernate':
                        message = 'System(s) Has Been Set In Hibernate Mode'
                        break;
                    case 'sleep':
                        message = 'System(s) Has Been Set In sleep Mode'
                        break;
                }
                return res.json({ code: 200, data: req.body, message: `${message}`, error: null });
            })
        }
    }

    userList(req, res) {
        var validate = JoiValidationUser.fetchUsers(req.body.skip, req.body.limit, req.body.location_id, req.body.role_id)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation failed', error: validate.error.details[0].message });
        }
        let admin_id = req['decoded'].jsonData.admin_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let is_location = req.body.location_id ? true : false;
        let is_role = req.body.role_id ? true : false;
        let is_department = req.body.department_id ? true : false;
        let department_id = req.body.department_id || 0;
        let location_id = req.body.location_id || 0;
        let role_id = req.body.role_id || 0;
        let today_date = moment().format('YYYY-MM-DD');
        Desktop.getUserList(admin_id, location_id, role_id, department_id, is_location, is_role, is_department, today_date, skip, limit, (err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Database error', error: err });
            } else if (data.length > 0) {
                let total_count = data.length > 0 ? data[0].total_count : 0;
                let has_more_data = (skip + limit) > total_count ? false : true;
                data.map(e => delete e.total_count);
                return res.json({ code: 200, data: { user_data: data, total_count: total_count, has_more_data: has_more_data, skip_value: skip + limit, limit: limit }, message: 'User data', error: null });
            } else {
                return res.json({ code: 400, data: null, message: 'Employees not found !', error: null });
            }
        })

    }
}

module.exports = new DesktopService;



