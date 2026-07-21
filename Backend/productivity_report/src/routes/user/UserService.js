const multer = require('multer');
const validator = require("email-validator");
const moment = require('moment');
const async = require('async');
const _ = require('underscore');

const PasswordEncodeDecoder = require('../../utils/helpers/PasswordEncoderDecoder');
const Storage = require('../shared/Storage');
const User = require('../shared/User');
const Admin = require('../shared/Admin');
const GoogleDrive = require('../../utils/helpers/GoogleDrive');
const Dropbox = require('../../utils/helpers/Dropbox');
const JoiValidationUser = require('../../rules/validation/User');
const sendResponse = require('../../utils/myService').sendResponse;
const sendMail = require('../../utils/helpers/Mail');
const FirewallService = require('../firewall/FirewallService');
const AmazonSSS = require('../../utils/helpers/AmazonSSS');
const UserController = require('./details/User.controller');

const upload = multer({
    dest: __dirname.split('src')[0] + 'public/images/profilePic/',
    filename: function (req, file, callback) {
        callback(null, file.filename + '.jpeg')
    }
}).single('avatar');

// const crypto = require('crypto')
// const path = require('path');
// const upload = multer({
//     dest: __dirname.split('src')[0] + 'public/images/profilePic/',
//     filename: (req, file, cb) => {
//         cb(null, path.extname(file.originalname) + '.jpg')
//     }
// }).fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]);

class UserService {

    /**
     * Add role for user.
     *
     * @function addRole
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Role Data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Admin/post_add_role}
     */
    addRole(req, res) {
        let name = req.body.name;
        let params = req.body.params;
        let validate = JoiValidationUser.addRole(name, params);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.addRole(name, params, (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Database Error !', err);
            if (data.affectedRows > 0) return sendResponse(res, 200, null, 'Succefully role added', err);
            return sendResponse(res, 204, null, 'Role already exists', err);
        })
    }

    /**
     * Get list of role .
     *
     * @function getRole
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Role Data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Admin/get_get_role}
     */
    getRole(req, res) {
        User.retrieveRole((err, data) => {
            if (err) return sendResponse(res, 400, null, 'Error while getting role data', err);
            return sendResponse(res, 200, data, 'Role data', err);
        })
    }


    /**
     * Add employee to databse and check profilePic uploaded and also validate email.
     *
     * @function getRole
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Successfull message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_user_register}
     */
    registerUser(req, res) {
        let validate = JoiValidationUser.validateUserRegister(req.body.name, req.body.full_name, req.body.email, req.body.password, req.body.remember_token, req.body.emp_code, req.body.location_id, req.body.department_id, req.body.role_id, req.body.date_join, req.body.address, req.body.status, req.body.phone, req.body.timezone, req.body.timezone_offset);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let name = req.body.name;
        let full_name = req.body.full_name || null;
        let email = req.body.email.toLowerCase();
        let email_verified_at = moment().utc().toDate();
        let password = req.body.password;
        let remember_token = req.body.remember_token || null;
        let emp_code = req.body.emp_code || null;
        let location_id = parseInt(req.body.location_id);
        let department_id = parseInt(req.body.department_id) || null;
        let role_id = parseInt(req.body.role_id);
        let date_join = moment(req.body.date_join, 'MM/DD/YYYY').format('YYYY-MM-DD') || null;
        let address = req.body.address || null;
        let status = parseInt(req.body.status) || 1;
        let phone = req.body.phone.toString() || null;
        let created_at = moment().utc().toDate();
        let updateed_at = moment().utc().toDate();
        let admin_id = req['decoded'].jsonData.admin_id;
        let photo_path = '/default/profilePic/user.png';
        const timezone = req.body.timezone || "Africa/Abidjan";
        const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : 0;

        if (validator.validate(email)) {
            User.getEmployeeDetailsByEmail(email, admin_id, (err, empData) => {
                if (err) return sendResponse(res, 400, null, 'Database error', err);
                if (empData.length > 0) return sendResponse(res, 400, null, 'With This Email Id User Already Exists !', 'User exists error');
                User.getEmployeeDetailsByEmpCode(emp_code, admin_id, (err, empCodeData) => {
                    if (err) return sendResponse(res, 400, null, 'Unable To Add User !', err);
                    if (empCodeData.length > 0) return sendResponse(res, 400, null, 'With This Emp Code User Already Exists !', 'User exists error');
                    PasswordEncodeDecoder.encrypt(password, process.env.CRYPTO_PASSWORD, (err, encripted) => {
                        if (err) return sendResponse(res, 400, null, 'Error while adding user', err);
                        User.registerUser(name, full_name, email, email_verified_at, encripted, remember_token, phone, emp_code, location_id, department_id, date_join, photo_path, address, role_id, status, created_at, updateed_at, admin_id, timezone, timezone_offset, (err, data) => {
                            if (err) return sendResponse(res, 400, null, 'Database error', err);
                            if (data.affectedRows > 0) {
                                if (role_id === 2 || role_id === 3) {
                                    let role_name = (role_id === 2) ? 'Manager' : 'Team Lead'
                                    sendMail.sendMail(email, `Added As ${role_name}`, `Added As ${role_name}`, name, password, 'M', (err, maiData) => {
                                        if (err) {
                                            req.body.photo_path = photo_path;
                                            return sendResponse(res, 200, {
                                                ...req.body,
                                                user_id: data.insertId
                                            }, `Succefully Added ${role_name} And Failed To Send Mail.`, err);
                                        } else {
                                            req.body.photo_path = photo_path;
                                            return sendResponse(res, 200, {
                                                ...req.body,
                                                user_id: data.insertId
                                            }, `Succefully Added ${role_name} And Mail Sent`, err);
                                        }
                                    })
                                } else {
                                    req.body.photo_path = photo_path;
                                    return sendResponse(res, 200, {
                                        ...req.body,
                                        user_id: data.insertId
                                    }, 'Succefully user added !', err);
                                }
                            } else {
                                return sendResponse(res, 400, null, 'Employee Already Exists !', err);
                            }
                        })
                    })
                })
            })
        } else {
            return sendResponse(res, 400, null, 'Invalid Email', 'Invalid email');
        }
    }
    uploadProfilePic(req, res) {
        upload(req, res, function (err) {
            let photo_path;
            let user_id = req.query.user_id;
            let admin_id = req['decoded'].jsonData.admin_id;
            let validate = JoiValidationUser.validateId(user_id);
            if (validate.error) {
                return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            }
            User.userData(user_id, admin_id, (err, userDetails) => {
                if (err) {
                    return sendResponse(res, 400, null, 'Upload Failed', err);
                } else {
                    if (userDetails.length > 0) {
                        let name = req.body.name || userDetails[0].name;
                        let fullName = req.body.full_name || userDetails[0].full_name;
                        let email = req.body.email || userDetails[0].email;
                        let password = req.body.password
                        let remember_token = req.body.remember_token || userDetails[0].remember_token;
                        let address = req.body.address || userDetails[0].address;
                        let phone = req.body.phone || userDetails[0].phone;
                        let locationId = req.body.location_id || userDetails[0].location_id;
                        let role_id = req.body.role_id || userDetails[0].role_id;
                        let emp_code = req.body.emp_code || userDetails[0].emp_code;
                        let deptId = req.body.department_id || userDetails[0].department_id;
                        let joinDate = moment(req.body.joinDate).format('YYYY-MM-DD') || userDetails[0].date_join;
                        let status = req.body.status || userDetails[0].status;
                        let validate = JoiValidationUser.validateUserUpdate(user_id, name, fullName, email, password, remember_token, emp_code, locationId, deptId, role_id, joinDate, address, status, phone);
                        if (validate.error) {
                            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
                        }
                        if (req.file) {
                            photo_path = `/images/profilePic/${req.file.filename}`;
                        } else {
                            photo_path = userDetails[0].photo_path;
                        }
                        var validEmail = validator.validate(email);
                        if (!validEmail) {
                            return sendResponse(res, 400, null, 'email validation failed.', null);
                        }
                        if (!req.body.password) {
                            password = userDetails[0].password;
                        }
                        //updating user details
                        User.updateProfile(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, photo_path, name, role_id, password, (err, data) => {
                            if (err) {
                                return sendResponse(res, 400, null, 'Database error', err);
                            } else {
                                User.getUserDetailsLocationDepartment(user_id, admin_id, (err, userDetails) => {
                                    if (err) {
                                        return sendResponse(res, 400, null, 'Database error', err);
                                    } else {
                                        PasswordEncodeDecoder.decrypt(userDetails[0].password, process.env.CRYPTO_PASSWORD, (err, decriptedPassword) => {
                                            if (err) {
                                                return sendResponse(res, 400, null, 'Error while decripting password', decriptedPassword);
                                            } else {
                                                userDetails[0].password = decriptedPassword;
                                                return sendResponse(res, 200, userDetails, ' Updated successfully !', null);
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        return sendResponse(res, 400, null, 'User does not exists ', error);
                    }
                }
            })
        })
    }

    /**
     * Search users by name and get details of user.
     *
     * @function searchUser
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User list or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_users_search}
     */
    searchUser(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let name = req.body.name;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let is_location = req.body.location_id ? true : false;
        let is_role = req.body.role_id ? true : false;
        let is_department = req.body.department_ids ? (req.body.department_ids.length > 0 ? true : false) : false;
        let department_ids = req.body.department_ids;
        let location_id = req.body.location_id || 0;
        let role_id = req.body.role_id || 0;
        var validate = JoiValidationUser.userSearch(skip, limit, name, department_ids, location_id, role_id);
        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation Failed !', validate.error.details[0].message);
        }
        if (name) {
            department_ids = department_ids ? (department_ids.length > 0 ? department_ids.toString() : 0) : 0
            User.searchUsers(admin_id, name, location_id, role_id, department_ids, is_location, is_role, is_department, skip, limit, (err, data) => {
                if (err) {
                    return sendResponse(res, 400, null, 'Database error', err);
                } else {
                    if (data.length > 0) {
                        async.forEach(data, (user, cb) => {
                            async.parallel([
                                callback => {
                                    User.getAssignedMangerDetailsByUserId(user.id, admin_id, (err, managerData) => {
                                        if (err) {
                                            callback();
                                        } else {
                                            user.manager = managerData.length > 0 ? managerData : null;
                                            callback();
                                        }
                                    })
                                },
                                callback => {
                                    if (user.params == 'M') {
                                        User.checkEmployeeAssigenedToManager(admin_id, user.id, (err, count) => {
                                            if (err) {
                                                callback();
                                            } else {
                                                user.is_employee_assigned = count[0].tolal_count > 0 ? 1 : 0;
                                                callback();
                                            }
                                        });
                                    } else {
                                        user.is_employee_assigned = 0;
                                        callback();
                                    }
                                }
                            ], (err, result) => {
                                cb();
                            })
                        }, () => {
                            let total_count = data.length > 0 ? data[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            data.map(e => delete e.total_count);
                            return sendResponse(res, 200, {
                                user_data: data,
                                total_count: total_count,
                                has_more_data: has_more_data,
                                skip_value: skip + limit,
                                limit: limit
                            }, 'User Data', null);
                        })
                    } else {
                        return sendResponse(res, 400, null, 'Users not found !', null);
                    }
                }
            })
        }
    }


    /**
     * List of user with filteration of department, location and role.
     *
     * @function userList
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User list or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_fetch_users}
     */
    userList_OLD(req, res) {
        var validate = JoiValidationUser.fetchUsers(req.body.skip, req.body.limit, req.body.location_id, req.body.role_id)
        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
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
        User.getUserList(admin_id, location_id, role_id, department_id, is_location, is_role, is_department, today_date, skip, limit, (err, data) => {
            if (err) {
                return sendResponse(res, 400, null, 'Database error', err);
            } else if (data.length > 0) {
                async.forEach(data, (user, cb) => {
                    async.parallel([
                        callback => {
                            User.getAssignedMangerDetailsByUserId(user.id, admin_id, (err, managerData) => {
                                if (err) {
                                    callback();
                                } else {
                                    user.manager = managerData.length > 0 ? managerData : null;
                                    callback();
                                }
                            })
                        },
                        callback => {
                            if (user.params == 'M') {
                                User.checkEmployeeAssigenedToManager(admin_id, user.id, (err, count) => {
                                    if (err) {
                                        callback();
                                    } else {
                                        user.is_employee_assigned = count[0].tolal_count > 0 ? 1 : 0;
                                        callback();
                                    }
                                });
                            } else {
                                user.is_employee_assigned = 0;
                                callback();
                            }
                        }
                    ], (err, result) => {
                        cb();
                    })
                }, () => {
                    let total_count = data.length > 0 ? data[0].total_count : 0;
                    let has_more_data = (skip + limit) >= total_count ? false : true;
                    data.map(e => delete e.total_count);
                    return sendResponse(res, 200, {
                        user_data: data,
                        total_count: total_count,
                        has_more_data: has_more_data,
                        skip_value: skip + limit,
                        limit: limit
                    }, 'User data', null);
                })
            } else {
                return sendResponse(res, 400, null, 'Employees not found !', null);
            }
        })

    }
    userList(req, res) {
        var validate = JoiValidationUser.fetchUsers(req.body.skip, req.body.limit, req.body.location_id, req.body.role_id)
        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        }
        const admin_id = req['decoded'].jsonData.admin_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        const is_location = req.body.location_id ? true : false;
        const is_role = req.body.role_id ? true : false;
        const is_department = req.body.department_id ? true : false;
        const department_id = req.body.department_id || 0;
        const location_id = req.body.location_id || 0;
        const role_id = req.body.role_id || 0;
        const today_date = req.body.day ? moment(req.body.day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');
        let reseller = 0;
        if (req.query && req.query.r && req.query.r === '1') reseller = parseInt(req.query.r);

        User.getUserList(admin_id, location_id, role_id, department_id, is_location, is_role, is_department, today_date, skip, limit, reseller, (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);
            if (data.length === 0) return sendResponse(res, 400, null, 'Employees not found !', null);
            async.forEach(data, (user, cb) => {
                async.parallel([
                    callback => {
                        if (user.params != 'M') {
                            User.getAssignedMangerDetailsByUserId(user.id, admin_id, async (err, managerData) => {
                                if (err) {
                                    callback();
                                } else {
                                    user.password = await PasswordEncodeDecoder.decryptText(user.password, process.env.CRYPTO_PASSWORD);
                                    let teamlead = await User.getAssignedTeamLeaDetailsByUserId(user.id, admin_id);
                                    user.manager = managerData.length > 0 ? managerData : null;
                                    user.teamlead = teamlead.length > 0 ? teamlead : null;
                                    callback();
                                }
                            })
                        } else {
                            (async () => {
                                user.password = await PasswordEncodeDecoder.decryptText(user.password, process.env.CRYPTO_PASSWORD);
                            })();
                            user.manager = null;
                            user.teamlead = null;
                            callback();
                        }
                    },
                    callback => {
                        if (user.params == 'M') {
                            User.checkEmployeeAssigenedToManager(admin_id, user.id, async (err, count) => {
                                if (err) {
                                    callback();
                                } else {
                                    user.is_employee_assigned = count[0].tolal_count > 0 ? 1 : 0;
                                    user.is_employee_assigned_teamlead = 0;
                                    callback();
                                }
                            });
                        } else if (user.params == 'TL') {
                            User.checkEmployeeAssigenedTeamLead(admin_id, user.id, (err, countData) => {
                                if (err) {
                                    callback();
                                } else {
                                    user.is_employee_assigned_teamlead = countData[0].tolal_count > 0 ? 1 : 0;
                                    user.is_employee_assigned = 0;
                                    callback();
                                }
                            });
                        } else {
                            user.is_employee_assigned_teamlead = 0;
                            user.is_employee_assigned = 0;
                            callback();
                        }
                    }
                ], (err, result) => {
                    cb();
                })
            }, async () => {

                const adminData = await Admin.getDetails(admin_id);
                let idealTime = null,
                    offlineTime = null;
                if (adminData.length > 0) {
                    idealTime = adminData[0].ideal_time;
                    offlineTime = adminData[0].offline_time;
                }

                let total_count = data.length > 0 ? data[0].total_count : 0;
                let has_more_data = (skip + limit) >= total_count ? false : true;
                data.map(e => delete e.total_count);
                return sendResponse(res, 200, {
                    status_data: {
                        idealTime,
                        offlineTime
                    },
                    user_data: data,
                    total_count: total_count,
                    has_more_data: has_more_data,
                    skip_value: skip + limit,
                    limit: limit
                }, 'User data', null);
            })

        })

    }

    async getUsers(req, res, next) {
        try {
            let manager_id = null;
            const admin_id = req['decoded'].jsonData.admin_id;
            const is_location = req.body.location_id ? true : false;
            const is_role = req.body.role_id ? true : false;
            const is_department = req.body.department_id ? true : false;
            const department_id = req.body.department_id;
            const location_id = req.body.location_id || 0;
            const role_id = req.body.role_id || 0;

            const validate = JoiValidationUser.usersValidataion({ department_id, location_id, role_id })
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            if (req['decoded'].jsonData.is_manager == true || req['decoded'].jsonData.is_teamlead == true) {
                manager_id = req['decoded'].jsonData.id;
            }

            const employees = await User.getEmployees(admin_id, manager_id, is_location, location_id, is_role, role_id, is_department, department_id);

            if (employees.length === 0) return sendResponse(res, 400, null, 'Employee not found', null);
            return sendResponse(res, 200, employees, 'Employees data', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to get employees', err);
        }
    }
    /**
     * *For get single user details with password decoded.
     *
     * @function getSingleUserDetails
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_get_user}
     */
    getSingleUserDetails(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        var validate = JoiValidationUser.validateId(user_id);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.getUserDetailsLocationDepartment(user_id, admin_id, (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);
            if (data.length === 0) return sendResponse(res, 400, null, 'User not found !', null);
            PasswordEncodeDecoder.decrypt(data[0].password, process.env.CRYPTO_PASSWORD, (err, decriptedPassword) => {
                if (err) return sendResponse(res, 400, null, 'Error while decripting password', decriptedPassword);
                data[0].password = decriptedPassword;
                async.parallel([
                    callback => {
                        User.getAssignedMangerDetailsByUserId(user_id, admin_id, async (err, managerData) => {
                            let teamlead = await User.getAssignedTeamLeaDetailsByUserId(user_id, admin_id);
                            callback(err, {
                                managerData,
                                teamlead
                            });
                        })
                    },
                    callback => {
                        if (data[0].params == 'M') {
                            User.checkEmployeeAssigenedToManager(admin_id, user_id, (err, count) => {
                                callback(err, count[0].tolal_count)
                            });
                        } else if (data[0].params = 'TL') {
                            User.checkEmployeeAssigenedTeamLead(admin_id, user_id, (err, countData) => {
                                callback(err, countData[0].tolal_count);
                            });
                        } else {
                            callback(null, 0);
                        }
                    }
                ], (err, result) => {
                    if (err) {
                        return sendResponse(res, 400, null, 'Database error', err);
                    } else {
                        data[0].manager = result[0].managerData.length > 0 ? result[0].managerData : null;
                        data[0].teamlead = result[0].teamlead.length > 0 ? result[0].teamlead : null;
                        if (data[0].params == 'M') {
                            data[0].is_employee_assigned = result[1] > 0 ? 1 : 0;
                            data[0].is_employee_assigned_teamlead = 0;
                        } else if (data[0].params == 'TL') {
                            data[0].is_employee_assigned = 0;
                            data[0].is_employee_assigned_teamlead = result[1] > 0 ? 1 : 0;
                        } else {
                            data[0].is_employee_assigned = 0;
                            data[0].is_employee_assigned_teamlead = 0;
                        }
                        return sendResponse(res, 200, data[0], 'User Data', null);
                    }
                })

            })

        })
    }

    /**
     * Get browser history details.
     *
     * @function getBrowserHistory
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User browser history data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_get_browser_history}
     */

    getBrowserHistory(req, res, next) {
        if (process.env.API_VERSION === 'v2') return UserController.getBrowserHistory(req, res, next);

        let admin_id = req['decoded'].jsonData.admin_id;
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;
        let user_id = req.body.user_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;

        const validate = JoiValidationUser.userBroweserHistoryValidataion({ user_id, from_date, to_date, skip, limit });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        // var validate = JoiValidationUser.validateBrowserHistory(user_id, date, req.body.skip, req.body.limit);
        // if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        // let from_date = moment(date).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
        // let to_date = moment(date).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
        from_date = moment(from_date).format('YYYY-MM-DD HH:mm:ss');
        to_date = moment(to_date).format('YYYY-MM-DD HH:mm:ss');

        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);
            if (UserData.length === 0) return sendResponse(res, 400, null, 'Employee not found.', 'Employee not found error');

            User.getBrowserHistoryFromTo(admin_id, user_id, from_date, to_date, skip, limit, (err, data) => {
                if (err) {
                    return sendResponse(res, 400, null, 'Unable to get history.', err);
                } else if (data.length > 0) {
                    let total_count = data.length > 0 ? data[0].total_count : 0;
                    let has_more_data = (skip + limit) >= total_count ? false : true;
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    data.map(e => (delete e.total_count));
                    return sendResponse(res, 200, {
                        full_name: full_name,
                        photo_path,
                        email,
                        user_id,
                        browser_history: data,
                        total_count: total_count,
                        has_more_data: has_more_data,
                        skip_value: skip + limit,
                        limit: limit
                    }, 'User Data', null);
                } else {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        browser_history: null
                    }, 'Data not found', null);
                }
            })
        })
    }

    /**
     * User application used.
     *
     * @function userApplicationUsed
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User application used data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_application_used}
     */
    userApplicationUsed(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;

        const validate = JoiValidationUser.userapplicationUsedValidataion({ user_id, from_date, to_date, skip, limit });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        // var validate = JoiValidationUser.validateUserDetails(user_id, date, req.body.skip, req.body.limit);
        // if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        from_date = moment(from_date).format('YYYY-MM-DD HH:mm:ss');
        to_date = moment(to_date).format('YYYY-MM-DD HH:mm:ss');

        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);

            User.userApplicationUsed(admin_id, user_id, from_date, to_date, skip, limit, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get application data', err);
                if (data.length > 0) {
                    let total_count = data.length > 0 ? data[0].total_count : 0;
                    let has_more_data = (skip + limit) >= total_count ? false : true;
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    data.map(e => (delete e.total_count));
                    return sendResponse(res, 200, {
                        full_name,
                        email,
                        user_id,
                        photo_path,
                        application_data: data,
                        total_count: total_count,
                        has_more_data: has_more_data,
                        skip_value: skip + limit,
                        limit: limit
                    }, 'User data', err);
                } else {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        email,
                        photo_path,
                        user_id,
                        application_data: null
                    }, 'Application used data not found !', null);
                }
            })
        })
    }

    /**
     * User log details.
     *
     * @function userLogDetails
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User log details data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_log_detail}
     */
    userLogDetails(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let date = moment(req.body.date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        let last_7_days = moment(date).subtract(7, 'd').format('YYYY-MM-DD');
        var validate = JoiValidationUser.validateUserDetails(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);
            User.userLogDetails(admin_id, user_id, date, last_7_days, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Database error', err);
                if (data.length > 0) {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        email,
                        user_id,
                        photo_path,
                        log_details: data
                    }, 'Log details', err);
                } else {
                    let full_name = UserData[0].full_name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        log_details: null
                    }, 'Log data not found !', 'Log data not found');
                }
            })
        })
    }
    userLogDetailsKamal(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let date = moment(req.body.date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        let last_7_days = moment(date).subtract(7, 'd').format('YYYY-MM-DD');
        var validate = JoiValidationUser.validateUserDetails(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        }
        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) {
                return sendResponse(res, 400, null, 'Database error', err);
            }
            User.userLogDetailsKamal(admin_id, user_id, date, last_7_days, (err, data) => {
                if (err) {
                    return sendResponse(res, 400, null, 'Database error', err);
                } else if (data.length > 0) {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        email,
                        user_id,
                        photo_path,
                        log_details: data
                    }, 'Log details', err);
                } else {
                    let full_name = UserData[0].full_name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        log_details: null
                    }, 'Log data not found !', 'Log data not found');
                }
            })
        })
    }
    async userLogDetailsRange(req, res) {

        const admin_id = req['decoded'].jsonData.admin_id;
        const user_id = req.body.user_id;
        const from_date = moment(req.body.from_date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const to_date = moment(req.body.to_date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 10;
        try {
            const validate = JoiValidationUser.userLogValidataion({
                user_id,
                from_date,
                to_date,
                skip,
                limit
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const user_data = await User.getUserDetails(user_id, admin_id);

            let data = await User.logDetails(user_id, from_date, to_date, skip, limit, admin_id);

            let full_name = user_data[0].name + ' ' + user_data[0].full_name;
            let email = user_data[0].email;
            let photo_path = user_data[0].photo_path;
            if (data.length === 0) return sendResponse(res, 200, {
                full_name,
                photo_path,
                email,
                user_id,
                log_details: null
            }, 'Log Data Not Found.', 'Log Data Not Found.');

            let total_count = data.length > 0 ? data[0].total_count : 0;
            let has_more_data = (skip + limit) >= total_count ? false : true;
            data.map(e => delete e.total_count);
            return sendResponse(res, 200, {
                full_name,
                email,
                user_id,
                photo_path,
                log_details: data,
                total_count: total_count,
                has_more_data: has_more_data,
                skip_value: skip + limit,
                limit: limit
            }, 'Log details', null);
        } catch (err) {
            sendResponse(res, 400, null, 'Unable To Get Log Details.', 'Databse Error.');
        }
    }
    async userLogDetailsRangeKamal(req, res) {

        const admin_id = req['decoded'].jsonData.admin_id;
        const user_id = req.body.user_id;
        const from_date = moment(req.body.from_date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const to_date = moment(req.body.to_date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 10;
        try {
            const validate = JoiValidationUser.userLogValidataion({
                user_id,
                from_date,
                to_date,
                skip,
                limit
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const user_data = await User.getUserDetails(user_id, admin_id);

            let data = await User.logDetailsKamal(user_id, from_date, to_date, skip, limit, admin_id);

            let full_name = user_data[0].name + ' ' + user_data[0].full_name;
            let email = user_data[0].email;
            let photo_path = user_data[0].photo_path;
            if (data.length === 0) return sendResponse(res, 200, {
                full_name,
                photo_path,
                email,
                user_id,
                log_details: null
            }, 'Log Data Not Found.', 'Log Data Not Found.');

            let total_count = data.length > 0 ? data[0].total_count : 0;
            let has_more_data = (skip + limit) >= total_count ? false : true;
            data.map(e => delete e.total_count);
            return sendResponse(res, 200, {
                full_name,
                email,
                user_id,
                photo_path,
                log_details: data,
                total_count: total_count,
                has_more_data: has_more_data,
                skip_value: skip + limit,
                limit: limit
            }, 'Log details', null);
        } catch (err) {
            sendResponse(res, 400, null, 'Unable To Get Log Details.', 'Databse Error.');
        }
    }
    /**
     * Get top app which user used most.
     *
     * @function topApps
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User top app details data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_top_apps}
     */
    topApps(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let date = moment(req.body.date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        var validate = JoiValidationUser.validateUserDetails(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);

            User.topApps(admin_id, user_id, date, skip, limit, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Database error', err);
                if (data.length > 0) {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        email,
                        user_id,
                        photo_path,
                        top_apps: data
                    }, 'Top app data', err);
                } else {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let photo_path = UserData[0].photo_path;
                    let user_id = UserData[0].id;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        top_apps: null
                    }, 'Top Apps data not found !', null);
                }
            })
        })
    }

    /**
     * Get top website which user used most.
     *
     * @function topWebsites
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User top website details data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_top_websites}
     */

    topWebsites(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let date = moment(req.body.date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let validate = JoiValidationUser.validateUserDetails(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);

            User.topWebsites(admin_id, user_id, date, skip, limit, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Database error', err);
                if (data.length > 0) {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        top_websites: data
                    }, 'Top website data', err);
                } else {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        top_websites: null
                    }, 'Top websites data not found !', null);
                }
            })
        })
    }

    /**
     * Get keystroke details.
     *
     * @function getKeyStrokes
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - User key stroke details data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_get_keystrokes}
     */
    getKeyStrokes(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let date = req.body.date;
        let user_id = req.body.user_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let validate = JoiValidationUser.validateUserDetails(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        date = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
        User.getSingleUserDetails(user_id, admin_id, (err, UserData) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);

            User.keyStrokes(admin_id, user_id, date, skip, limit, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Database error', err);
                if (data.length > 0) {
                    let total_count = data.length > 0 ? data[0].total_count : 0;
                    let has_more_data = (skip + limit) >= total_count ? false : true;
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    data.map(e => (delete e.total_count));
                    // data.map(e => delete e.total_count);
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        keystroke_data: data,
                        total_count: total_count,
                        has_more_data: has_more_data,
                        skip_value: skip + limit,
                        limit: limit
                    }, 'Keystroke data', err);
                } else {
                    let full_name = UserData[0].name + ' ' + UserData[0].full_name;
                    let email = UserData[0].email;
                    let user_id = UserData[0].id;
                    let photo_path = UserData[0].photo_path;
                    return sendResponse(res, 200, {
                        full_name,
                        photo_path,
                        email,
                        user_id,
                        keystroke_data: null
                    }, 'KeyStroke data not found !', null);
                }
            })
        })
    }

    /**
     * Update user details.
     *
     * @function updateProfile
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_user_profile_update}
     */
    async updateProfile(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const user_id = req.body.userId;
        //  fetch user details using userId for updating user details
        const user_details = await User.userInformation(user_id, admin_id);
        if (user_details.length === 0) return sendResponse(res, 400, null, 'User Not Found.', 'User Not Found Error.');

        const name = req.body.name || user_details[0].name;
        let fullName = req.body.full_name || user_details[0].full_name;
        let email = req.body.email ? req.body.email.toLowerCase().trim() : user_details[0].email;
        let password = req.body.password;
        let remember_token = req.body.remember_token || user_details[0].remember_token;
        let address = req.body.address || user_details[0].address;
        let phone = req.body.phone || user_details[0].phone;
        let locationId = req.body.location_id || user_details[0].location_id;
        let role_id = req.body.role_id || user_details[0].role_id;
        let emp_code = req.body.emp_code || user_details[0].emp_code;
        let deptId = req.body.department_id || user_details[0].department_id;
        let joinDate = req.body.joinDate ? `'${moment(req.body.joinDate, 'MM/DD/YYYY').format('YYYY-MM-DD')}'` : user_details[0].date_join ? `'${moment(user_details[0].date_join).format('YYYY-MM-DD')}'` : null;
        let status = req.body.status || user_details[0].status;
        let photo_path = user_details[0].photo_path;
        let old_role = user_details[0].role_id;
        const timezone = req.body.timezone || user_details[0].timezone;
        const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : user_details[0].timezone_offset;
        let decriptedPassword;
        let old_password;
        let new_user_details;

        try {
            let validate = JoiValidationUser.validateUserUpdate(user_id, name, fullName, email, password, remember_token, emp_code, locationId, deptId, role_id, joinDate, address, status, phone, timezone, timezone_offset);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            if (req.body.email && req.body.email.toLowerCase().trim() !== user_details[0].email) {
                const email_user_data = await User.getUserByEmail(req.body.email.toLowerCase().trim());
                if (email_user_data.length > 0) return sendResponse(res, 400, null, 'Email already exists.', 'Email exists error.');
            }

            if (req.body.emp_code !== user_details[0].emp_code) {
                const empcode_user_data = await User.getUserByEmpCode(req.body.emp_code, admin_id);
                if (empcode_user_data.length > 0) return sendResponse(res, 400, null, 'Employee Code already exists.', 'Employee Code exists error.');
            }
            if (req.body.password) {
                const encripted = await PasswordEncodeDecoder.encryptText(password, process.env.CRYPTO_PASSWORD);
                password = encripted
            } else {
                password = user_details[0].password;
            }

            const updated = await User.updateProfileData(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, photo_path, name, role_id, password, timezone, timezone_offset);
            new_user_details = await User.getUserDetailsLocDept(user_id, admin_id);

            decriptedPassword = await PasswordEncodeDecoder.decryptText(new_user_details[0].password, process.env.CRYPTO_PASSWORD);
            old_password = await PasswordEncodeDecoder.decryptText(user_details[0].password, process.env.CRYPTO_PASSWORD);
        } catch (err) {
            sendResponse(res, 400, 'Unable To Update User Details.', null, err);
        }

        try {
            if (req.body.role_id == 1 && !(old_role == req.body.role_id)) {
                const mail_res = await sendMail.sendEMail(email, 'You downgraded to Employee', 'You downgraded to Employee', name, decriptedPassword, 'E')
                new_user_details[0].password = decriptedPassword;
                User.deleteAssignedManager(admin_id, user_id, (err, data) => {
                    console.log('========deleted assigned manager======');
                })
                return sendResponse(res, 200, new_user_details, ' Updated Successfully And Mail Sent !', null);

            } else if (req.body.role_id == 2 && user_details[0].role_id === 1 && !(old_role == req.body.role_id)) {
                const mail_res = await sendMail.sendEMail(email, 'Upgraded To Manager', 'Upgraded To Manager', name, decriptedPassword, 'M')
                new_user_details[0].password = decriptedPassword;
                User.deleteAssignedUser(admin_id, user_id, 'Manager', (err, data) => {
                    console.log('========deleted assigned user======');
                })
                User.deleteAssignedUser(admin_id, user_id, 'Team Lead', (err, data) => {
                    console.log('========deleted assigned user======');
                })
                return sendResponse(res, 200, new_user_details, ' Updated Successfully And Mail Sent !', null);

            } else if (req.body.role_id == 2 && user_details[0].role_id === 3 && !(old_role == req.body.role_id)) {
                const mail_res = await sendMail.sendEMail(email, 'Upgraded To Manager', 'Upgraded To Manager', name, decriptedPassword, 'M')
                new_user_details[0].password = decriptedPassword;
                let update = await User.updateRoleType(user_id, 'Manager');
                return sendResponse(res, 200, new_user_details, ' Updated Successfully And Mail Sent !', null);

            } else if (req.body.role_id == 3 && user_details[0].role_id === 1 && !(old_role == req.body.role_id)) {
                const mail_res = await sendMail.sendEMail(email, 'Upgraded To Team Lead', 'Upgraded To Team Lead', name, decriptedPassword, 'M')
                new_user_details[0].password = decriptedPassword;
                User.deleteAssignedUser(admin_id, user_id, 'Team Lead', (err, data) => {
                    console.log('========deleted assigned user======');
                })
                return sendResponse(res, 200, new_user_details, ' Updated Successfully And Mail Sent !', null);

            } else if (req.body.role_id == 3 && user_details[0].role_id === 2 && !(old_role == req.body.role_id)) {
                const mail_res = await sendMail.sendEMail(email, 'You Downgraded To Team Lead', 'You Downgraded To Team Lead', name, decriptedPassword, 'E')
                new_user_details[0].password = decriptedPassword;
                let update = await User.updateRoleType(user_id, 'Team Lead');
                return sendResponse(res, 200, new_user_details, ' Updated Successfully And Mail Sent !', null);

            } else if ((role_id === 2 || role_id === 3) && old_password !== decriptedPassword) {
                const mail_res = await sendMail.sendEMail(email, 'Your Login Password Changed By Admin.', 'Your Login Password Changed By Admin.', name, decriptedPassword, 'M')
                new_user_details[0].password = decriptedPassword;
                return sendResponse(res, 200, new_user_details, ' Updated Successfully And Mail Sent !', null);

            } else {
                new_user_details[0].password = decriptedPassword;
                return sendResponse(res, 200, new_user_details, ' Updated Successfully !', null);
            }
        } catch (err) {
            new_user_details[0].password = decriptedPassword;
            return sendResponse(res, 200, new_user_details, ' Updated Successfully And Failed Send Mail!', null);
        }
    }
    /**
     * Delete single users.
     *
     * @function removeUser
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/delete_user_delete}
     */
    removeUser(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let validate = JoiValidationUser.validateId(user_id);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.removeUserAccount(user_id, admin_id, (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);
            if (data.affectedRows > 0) {
                FirewallService.checkUserAndDepartmentRule(admin_id, [user_id], 3);
                return sendResponse(res, 200, req.body, 'Succefully Deleted  User !', null);
            } else {
                return sendResponse(res, 400, req.body, 'Invalid Input !', null);
            }
        })
    }

    /**
     * Delete multiple users.
     *
     * @function removeMultipleUser
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/delete_user_delete_multiple}
     */
    removeMultipleUser(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_ids = req.body.user_ids;
        if (user_ids.length > 0) {
            let validate = JoiValidationUser.validateMultipleIds(user_ids);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            async.forEachSeries(user_ids, (user_id, cb) => {
                User.removeUserAccount(user_id.user_id, admin_id, (err, data) => {
                    if (err) {
                        cb();
                    } else {
                        cb();
                    }
                })
            }, () => {
                let new_array = [];
                user_ids.map(el => new_array.push(el.user_id));
                FirewallService.checkUserAndDepartmentRule(admin_id, new_array, 3);
                return sendResponse(res, 200, req.body, 'Succefully Deleted Users !', null);
            })

        } else {
            return sendResponse(res, 400, null, 'User ids missing', null);
        }
    }

    /**
     * Get user screenshots.
     *
     * @function getScreenshoot
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Screenshot data or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_get_screenshots}
     */
    getScreenshoot(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let finalData = [];
        let from = parseInt(req.body.from_hour);

        let to = parseInt(req.body.to_hour - 1);
        let date = moment(req.body.date).format('YYYY-MM-DD'); //'2019-12-23'
        let mail = req.body.mail;
        let user_id = req.body.user_id;
        let limit = req.body.limit || 1000
        // let from = 11;
        // let to = 11;
        // let date = '2019-12-23'; //'2019-12-23'
        // let mail = 'my@email.com';
        // let user_id = 1;
        let validate = JoiValidationUser.validateUserDetails(user_id, date, 0, 10, from, to, req.body.pageToken);
        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        }

        User.userData(user_id, admin_id, (err, user_data) => {
            if (err) {
                return sendResponse(res, 400, null, 'Database error', err);
            } else {
                Storage.getStorageDetails(admin_id, (err, credsData) => {
                    if (err) {
                        return sendResponse(res, 400, null, 'Unable to get screenshot !', err);
                    } else if (credsData.length > 0) {
                        if (credsData[0].short_code == 'GD') {
                            let query = '';
                            let pageToken = req.body.pageToken || '';
                            for (let i = from; i <= to; i++) {
                                query = query + `name contains ' ${i}-${date} ' or `
                            }
                            query = query.substring(0, query.length - 3);
                            GoogleDrive.getFolderIdByName(user_data[0].email, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, data) => {
                                if (err) {
                                    return sendResponse(res, 400, null, 'Screenshots not found !', 'Google Drive Error');
                                } else if (data !== null) {
                                    GoogleDrive.getFolderIdByParentId(data, date, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, dateIdData) => {
                                        if (err) {
                                            return sendResponse(res, 400, null, 'Screenshots not found !', 'Google Drive Error');
                                        } else if (dateIdData !== null) {
                                            GoogleDrive.getScreenshootFromToDate(dateIdData, query, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, pageToken, limit, (err, screenshootData) => {
                                                if (err) {
                                                    return sendResponse(res, 400, null, 'Screenshots not found !', 'Google Drive Error');
                                                } else {
                                                    async.forEachSeries(screenshootData.files, (e, cb) => {
                                                        finalData.push({
                                                            id: e.id,
                                                            name: e.name,
                                                            link: e.webContentLink,
                                                            viewLink: e.webViewLink,
                                                            thumbnailLink: e.thumbnailLink,
                                                            created_at: e.createdTime,
                                                            updated_at: e.modifiedTime
                                                        })
                                                        cb();
                                                    }, () => {
                                                        if (finalData.length > 0) {
                                                            return sendResponse(res, 200, {
                                                                name: user_data[0].name + ' ' + user_data[0].full_name,
                                                                email: user_data[0].email,
                                                                photo_path: user_data[0].photo_path,
                                                                user_id: user_data[0].id,
                                                                screenshot: finalData,
                                                                pageToken: screenshootData.nextPageToken || null
                                                            }, 'Screenshot data ', null);
                                                        } else {
                                                            return sendResponse(res, 200, {
                                                                name: user_data[0].name + ' ' + user_data[0].full_name,
                                                                email: user_data[0].email,
                                                                photo_path: user_data[0].photo_path,
                                                                user_id: user_data[0].id,
                                                                screenshot: null,
                                                                pageToken: null
                                                            }, 'Screenshot data not found ', 'Screenshoot data not found on these time');
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            return sendResponse(res, 200, {
                                                name: user_data[0].name + ' ' + user_data[0].full_name,
                                                email: user_data[0].email,
                                                photo_path: user_data[0].photo_path,
                                                user_id: user_data[0].id,
                                                screenshot: null,
                                                pageToken: null
                                            }, 'Screenshot data not found ', 'Screenshoot data not found on this date');
                                        }
                                    })
                                } else {
                                    return sendResponse(res, 200, {
                                        name: user_data[0].name + ' ' + user_data[0].full_name,
                                        email: user_data[0].email,
                                        user_id: user_data[0].id,
                                        photo_path: user_data[0].photo_path,
                                        screenshot: null,
                                        pageToken: null
                                    }, 'Screenshot data not found ', 'Folder does not contain on this email');
                                }
                            })
                        } else if (credsData[0].short_code == 'DB') {
                            let hours = [];
                            for (let i = from; i <= to; i++) {
                                hours.push(i);
                            }
                            async.forEachSeries(hours, (hour, callback1) => {
                                let path = `/EmpMonitor/${user_data[0].email}/${date.substring(0, 4)}/${date.substring(5, 7)}/${date}/${hour}`;
                                Dropbox.getScreenshots(path, credsData[0].token, (err, data) => {
                                    if (err) {
                                        callback1();
                                    } else {
                                        if (data.length === 0) {
                                            callback1();
                                        } else {
                                            async.forEachSeries(data.entries, (e, cb) => {
                                                finalData.push({
                                                    id: e.id,
                                                    name: `${hour}-${e.name}`,
                                                    link: 'https://www.dropbox.com/home' + e.path_display,
                                                    viewLink: 'https://www.dropbox.com/home' + e.path_display,
                                                    thumbnailLink: 'https://www.dropbox.com/home' + e.path_display,
                                                    created_at: e.client_modified,
                                                    updated_at: e.server_modified
                                                })
                                                cb();
                                            }, callback1());
                                        }
                                    }
                                })
                            }, () => {
                                if (finalData.length > 0) {
                                    return sendResponse(res, 200, {
                                        name: user_data[0].name + ' ' + user_data[0].full_name,
                                        email: user_data[0].email,
                                        user_id: user_data[0].id,
                                        photo_path: user_data[0].photo_path,
                                        screenshot: finalData,
                                        pageToken: null
                                    }, 'Screenshot data ', null);
                                } else {
                                    return sendResponse(res, 200, {
                                        name: user_data[0].name + ' ' + user_data[0].full_name,
                                        email: user_data[0].email,
                                        user_id: user_data[0].id,
                                        photo_path: user_data[0].photo_path,
                                        screenshot: null,
                                        pageToken: null
                                    }, 'Screenshot data not found ', 'Screenshoot data not found on these time');
                                }
                            })
                        } else {
                            return sendResponse(res, 400, null, 'Unable to get screenshot !', err);
                        }
                    } else {
                        return sendResponse(res, 400, null, 'Not Found Active Storage !', null);
                    }
                })
            }
        })
    }

    /**
     * Update user status for active and suspend account.
     *
     * @function updateUserStatus
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/put_update_user_status}
     */
    updateUserStatus(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_ids = req.body.user_ids;
        let status = req.body.status;
        let validate = JoiValidationUser.validateMultipleUserId(user_ids, status);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let user = [];
        user_ids.map(user_id => user.push(user_id.user_id));
        User.updateUserStatus(user.toString(), status, admin_id, (err, data) => {
            if (err) return sendResponse(res, 400, req.body, 'Failed To Update Status !', null);
            if (data.affectedRows > 0) {
                User.getAssignedMangeIdByUserID(user.toString(), admin_id, (err, data) => {
                    if (err) return sendResponse(res, 400, req.body, 'Failed To Update Status !', null);
                    let result = [];
                    _.map(_.groupBy(data, elem => elem.user_id),
                        (vals, key) => {
                            result.push({
                                user_id: key,
                                manager: vals
                            });
                        })

                    let messsage = status == 1 ? 'User Get Activated !' : 'User Get Suspended !'
                    return sendResponse(res, 200, result, messsage, null);

                })
                // return sendResponse(res, 200, req.body, 'Succefully updated user status !', null);
            } else {
                return sendResponse(res, 400, req.body, 'Invalid Input !', null);
            }
        })
    }

    /**
     * Assign user to manager.
     *
     * @function assignUserToManger
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_assign_user_manager}
     */

    async assignEmpToTeamleadAndManager(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const user_multi_manager = req.body.user_multi_manager;
        const user_teamlead = req.body.user_teamlead;
        const user_manager = req.body.user_manager;

        let assigned_users_tl = [];
        let assigned_users_manager = [];
        let assigned_manager = [];
        let already_assigned_tl = [];
        let already_assigned_manager = [];

        let validate = JoiValidationUser.assignUserValidation({ user_multi_manager, user_teamlead, user_manager });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        try {
            // if ((user_multi_manager && user_multi_manager.manager_ids.length === 0) && (user_manager && user_manager.user_ids === 0) && (user_teamlead && user_teamlead.user_ids === 0)) return sendResponse(res, 404, null, 'Validation failed', 'user_ids required,')
            if (user_multi_manager && user_multi_manager.user_id) {
                let deleted = await User.removeAlreadyAssigned(admin_id, user_multi_manager.user_id);
                if (user_multi_manager.manager_ids && user_multi_manager.manager_ids.length > 0) {
                    for (const user of user_multi_manager.manager_ids) {
                        let assign_users = await User.assignMultiUserToManger(user_multi_manager.user_id, user, admin_id);
                        let user_details = await User.getUserDetails(user, admin_id);
                        assigned_manager.push({
                            manager_id: user_details[0].id,
                            status: user_details[0].status,
                            first_name: user_details[0].name,
                            last_name: user_details[0].full_name
                        });
                    }
                }
            }
            if (user_manager && user_manager.user_ids.length > 0 && user_manager.manager_id) {
                for (const user of user_manager.user_ids) {
                    let assigned = await User.checkAssignedUserToManager(user, user_manager.manager_id, admin_id);
                    if (assigned.length === 0) {
                        let assign_users = await User.assignMultiUserToManger(user, user_manager.manager_id, admin_id);
                        let user_details = await User.getUserDetails(user, admin_id);
                        assigned_users_manager.push({
                            user_id: user_details[0].id,
                            status: user_details[0].status,
                            first_name: user_details[0].name,
                            last_name: user_details[0].full_name
                        });
                    } else {
                        already_assigned_manager.push(assigned[0]);
                    }
                }
            }
            if (user_teamlead && user_teamlead.user_ids.length > 0 && user_teamlead.teamlead_id) {
                for (const user_id of user_teamlead.user_ids) {
                    let assigned = await User.checkAssignedUserToTeamLead(user_id, user_teamlead.teamlead_id, admin_id);
                    if (assigned.length === 0) {
                        let assign_users = await User.assignMultiUserToTeamLead(user_id, user_teamlead.teamlead_id, admin_id);
                        let user_details = await User.getUserDetails(user_id, admin_id);
                        assigned_users_tl.push({
                            user_id: user_details[0].id,
                            status: user_details[0].status,
                            first_name: user_details[0].name,
                            last_name: user_details[0].full_name
                        });
                    } else {
                        already_assigned_tl.push(assigned[0]);
                    }
                }
            }
            return sendResponse(res, 200, { assigned_users_tl, assigned_users_manager, already_assigned_tl, already_assigned_manager, assigned_manager }, 'Successfully User Assigned.', null);
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, 'Unable to assign user', err);
        }

    }
    async assignUserToMangerMulti(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let manager_ids = req.body.manager_ids;
        let assigned_manager = [];
        try {
            let validate = JoiValidationUser.ManagerMultiValidation({
                user_id,
                manager_ids
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            let deleted = await User.removeAlreadyAssigned(admin_id, user_id);
            for (const user of manager_ids) {
                let assign_users = await User.assignMultiUserToManger(user_id, user, admin_id);
                let user_details = await User.getUserDetails(user, admin_id);
                assigned_manager.push({
                    manager_id: user_details[0].id,
                    status: user_details[0].status,
                    first_name: user_details[0].name,
                    last_name: user_details[0].full_name
                });
            }
            return sendResponse(res, 200, {
                assigned_manager,
            }, 'User Assigned To Manager.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to assign user to manager');
        }
    }
    async assignUserToManger(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_ids;
        let manager_id = req.body.manager_id;
        let already_assigned = [];
        let assigned_users = [];
        try {
            let validate = JoiValidationUser.ManagerValidation({ user_id, manager_id });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            for (const user of user_id) {
                let assigned = await User.checkAssignedUserToManager(user, manager_id, admin_id);
                if (assigned.length === 0) {
                    let assign_users = await User.assignMultiUserToManger(user, manager_id, admin_id);
                    let user_details = await User.getUserDetails(user, admin_id);
                    assigned_users.push({
                        user_id: user_details[0].id,
                        status: user_details[0].status,
                        first_name: user_details[0].name,
                        last_name: user_details[0].full_name
                    });
                } else {
                    already_assigned.push(assigned[0]);
                }
            }
            return sendResponse(res, 200, {
                assigned_users,
                already_assigned
            }, 'User Assigned To Manager.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to assign user to manager');
        }
    }

    /**
     * Upgrade and downgrade to employee and manager.
     *
     * @function upgradeAndDownGradeManager
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/post_get_keystrokes}
     */
    upgradeAndDownGradeManager(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let params = req.body.params;
        let message;
        let subject;

        let validate = JoiValidationUser.validateManagerGrade(user_id, params);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.getRoleAndMail(user_id, admin_id, (err, role_data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);
            if (params === role_data[0].params) return sendResponse(res, 400, null, 'Invalid Input', null);
            User.getRoleByParam(params, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Database error', err);
                User.upgradeAndDownGradeManager(user_id, data[0].id, admin_id, (err, data) => {
                    if (err) return sendResponse(res, 400, null, 'Database error', err);
                    User.getSingleUserDetails(user_id, admin_id, (err, userData) => {
                        if (err) return sendResponse(res, 400, null, 'Database error', err);
                        PasswordEncodeDecoder.decrypt(userData[0].password, process.env.CRYPTO_PASSWORD, async (err, decriptedPassword) => {
                            if (params == 'M' && role_data[0].params === 'E') {
                                message = "Upgraded To Manager"
                                User.deleteAssignedUser(admin_id, user_id, 'Manager', (err, data) => {
                                    console.log('========deleted assigned user======');
                                })
                                User.deleteAssignedUser(admin_id, user_id, 'Team Lead', (err, data) => {
                                    console.log('========deleted assigned user======');
                                })

                            } else if (params == 'TL' && role_data[0].params === 'E') {
                                message = "Upgraded To Team Lead"
                                User.deleteAssignedUser(admin_id, user_id, 'Team Lead', (err, data) => {
                                    console.log('========deleted assigned user======');
                                })
                            } else if (params == 'M' && role_data[0].params === 'TL') {
                                message = "Upgraded To Manager"
                                let update = await User.updateRoleType(user_id, 'Manager');

                            } else if (params == 'TL' && role_data[0].params === 'M') {
                                message = "Degraded To Team Lead"
                                let update = await User.updateRoleType(user_id, 'Team Lead');
                            } else {
                                message = "Degraded To Employee"
                                User.deleteAssignedManager(admin_id, user_id, (err, data) => {
                                    console.log('========deleted assigned manager======');
                                })
                            }
                            sendMail.sendMail(role_data[0].email, message, message, userData[0].name, decriptedPassword, params, (err, data) => {
                                if (err) {
                                    return sendResponse(res, 200, req.body, `${message} And Unable To Send Email`, null);
                                } else {
                                    return sendResponse(res, 200, req.body, `${message} And Mail Send To ${userData[0].name} ${userData[0].full_name}`, null);
                                }
                            })
                        })
                    })
                })
            })
        })
    }

    getAssignedEmployeeToManager(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let {
            manager_id
        } = req.body;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let is_location = req.body.location_id ? true : false;
        let is_department = req.body.department_id ? true : false;
        let department_id = req.body.department_id || 0;
        let location_id = req.body.location_id || 0;
        const today_date = req.body.day ? moment(req.body.day).format('YYYY-MM-DD') : moment().utc().format('YYYY-MM-DD');

        let validate = JoiValidationUser.validateAssignedEmployeeToManager(manager_id, department_id, location_id, skip, limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.getEmployeeeAssiginedToManager(admin_id, manager_id, department_id, location_id, is_department, is_location, today_date, skip, limit, async (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', null);
            if (data.length > 0) {

                const adminData = await Admin.getDetails(admin_id);
                let idealTime = null,
                    offlineTime = null;
                if (adminData.length > 0) {
                    idealTime = adminData[0].ideal_time;
                    offlineTime = adminData[0].offline_time;
                }
                res.json({
                    code: 200,
                    data,
                    status: {
                        idealTime,
                        offlineTime
                    },
                    message: 'Success',
                    error: null
                });
            } else {
                return sendResponse(res, 400, null, 'Not assigned any employee', null);
            }
        })

    }

    /**
     * Unassign user to manager.
     *
     * @function unassignUserToManger
     * @memberof UserService
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success message or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/User/delete_unassign_user_manager}
     */
    unassignUserToManger(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let manager_id = req.body.manager_id;
        let validate = JoiValidationUser.validateUnassignToManager(user_id, manager_id);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        User.unassignUserToManger(admin_id, user_id, manager_id, (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Database Error', err);
            if (data.affectedRows > 0) {
                User.getAssignedMangeIdByUserID(user_id, admin_id, (err, managerData) => {
                    if (err) return sendResponse(res, 400, null, 'Database Error', err);
                    let result = [];
                    _.map(_.groupBy(managerData, elem => elem.user_id),
                        (vals, key) => {
                            result.push({
                                user_id: key,
                                manager_id: manager_id,
                                manager: vals
                            });
                        })
                    return sendResponse(res, 200, result, 'Unassigned Successfully !', null);
                })
            } else {
                return sendResponse(res, 400, null, 'Invalid Input !', null);
            }
        })
    }



    uploadProfilePic_new(req, res) {
        upload(req, res, function (err) {
            let photo_path;
            let user_id = req.query.user_id;
            let admin_id = req['decoded'].jsonData.admin_id;
            let validate = JoiValidationUser.validateId(user_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            User.userData(user_id, admin_id, (err, userDetails) => {
                if (err) return sendResponse(res, 400, null, 'Upload Failed', err);
                if (userDetails.length === 0) return sendResponse(res, 400, null, 'User Does Not Exists.', null);
                let fullName = req.body.full_name || userDetails[0].full_name;
                let email = req.body.email || userDetails[0].email;
                let password = req.body.password
                let remember_token = req.body.remember_token || userDetails[0].remember_token;
                let address = req.body.address || userDetails[0].address;
                let phone = req.body.phone || userDetails[0].phone;
                let locationId = req.body.location_id || userDetails[0].location_id;
                let role_id = req.body.role_id || userDetails[0].role_id;
                let emp_code = req.body.emp_code || userDetails[0].emp_code;
                let deptId = req.body.department_id || userDetails[0].department_id;
                let joinDate = moment(req.body.joinDate).format('YYYY-MM-DD') || userDetails[0].date_join;
                let status = req.body.status || userDetails[0].status;
                let user_name = req.body.name || userDetails[0].name;
                const timezone = req.body.timezone || userDetails[0].timezone;
                const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : userDetails[0].timezone_offset;

                let validate = JoiValidationUser.validateUserUpdate(user_id, user_name, fullName, email, password, remember_token, emp_code, locationId, deptId, role_id, joinDate, address, status, phone, timezone, timezone_offset);
                if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

                if (!req.body.password) {
                    password = userDetails[0].password;
                }
                if (!req.file) return sendResponse(res, 400, null, 'Image Not Found.', null);
                let name = req.file.filename;
                Storage.getStorageDetails(admin_id, (err, credsData) => {
                    if (err) return sendResponse(res, 400, null, 'Error While Getting Storage Details.', null);
                    if (credsData.length === 0) {
                        GoogleDrive.deleteFileFromLocal(name, (err, data));
                        return sendResponse(res, 400, null, 'Storage Data Not Found And Add Storage Data.', null);
                    } else {
                        if (credsData[0].short_code == 'GD') {
                            getFolderId(credsData, (err, folderId) => {
                                if (err) {
                                    GoogleDrive.deleteFileFromLocal(name);
                                    return sendResponse(res, 400, null, 'Unable To Upload To Google Drive.', null);
                                } else {
                                    GoogleDrive.uploadProfileToDrive(folderId, name, credsData[0].client_id, credsData[0].client_secret, credsData[0].refresh_token, (err, uploaded) => {
                                        if (err) {
                                            GoogleDrive.deleteFileFromLocal(name, (err, data));
                                            return sendResponse(res, 400, null, 'Unable To Upload To Google Drive.', null);
                                        } else {
                                            GoogleDrive.getScreenshootFromToDate(folderId, `name contains '${name}'`, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, null, 4, (err, profilData) => {
                                                if (err) {
                                                    GoogleDrive.deleteFileFromLocal(name, (err, data));
                                                    return sendResponse(res, 400, null, 'Unable To Upload To Google Drive.', null);
                                                } else {
                                                    updateUserProfileData(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, profilData.files[0].webContentLink, user_name, role_id, password, (err, user_data) => {
                                                        if (err) {
                                                            GoogleDrive.deleteFileFromLocal(name, (err, data));
                                                            return sendResponse(res, 400, null, ' Unable Upload Profile Picture.', null);
                                                        } else {
                                                            GoogleDrive.deleteFileFromLocal(name);
                                                            return sendResponse(res, 200, user_data, 'Profile Updated Successfully.', null);
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            });
                        } else if (credsData[0].short_code == 'DB') {
                            let token = credsData[0].token
                            Dropbox.UploadProfilePic(name, token, (err, uploaded_data) => {
                                // let profile_url = 'https://www.dropbox.com/home' + uploaded_data.path_display
                                if (err) {
                                    GoogleDrive.deleteFileFromLocal(name);
                                    return sendResponse(res, 400, null, 'Unable Upload Profile Pic To Dropbox.', null);
                                } else {
                                    let profile_url = uploaded_data;
                                    updateUserProfileData(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, profile_url, user_name, role_id, password, (err, user_data) => {
                                        if (err) {
                                            GoogleDrive.deleteFileFromLocal(name);
                                            return sendResponse(res, 400, null, 'Unable Upload Profile Pic To Dropbox.', null);
                                        } else {
                                            GoogleDrive.deleteFileFromLocal(name);
                                            return sendResponse(res, 200, user_data, 'Profile Picture Uploaded successfully.', null);
                                        }
                                    })
                                }
                            })

                        } else if (credsData[0].short_code == 'S3') {
                            AmazonSSS.uploadProfilePic(credsData[0].client_id, credsData[0].client_secret, credsData[0].region, credsData[0].bucket_name, name, (err, uploadData) => {
                                if (err) {
                                    AmazonSSS.deleteFileFromLocal(name);
                                    return sendResponse(res, 400, null, 'Unable To Upload ProfilePic.', err);
                                } else {
                                    let profile_url = uploadData;
                                    updateUserProfileData(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, profile_url, user_name, role_id, password, (err, user_data) => {
                                        if (err) {
                                            GoogleDrive.deleteFileFromLocal(name);
                                            return sendResponse(res, 400, null, 'Unable Upload Profile Pic To Dropbox.', null);
                                        } else {
                                            GoogleDrive.deleteFileFromLocal(name);
                                            return sendResponse(res, 200, user_data, 'Profile Picture Uploaded successfully.', null);
                                        }
                                    })
                                }
                            })
                        } else {
                            return sendResponse(res, 400, null, 'Storage Data Not Found.', null);
                        }
                    }
                })
            })
        })
    }

    getScreenshootParallel(req, res) {

        let admin_id = req['decoded'].jsonData.admin_id;
        let result = [];
        let from = parseInt(req.body.from_hour);

        let to = parseInt(req.body.to_hour - 1);
        let date = moment(req.body.date).format('YYYY-MM-DD'); //'2019-12-23'
        let user_id = req.body.user_id;
        let limit = req.body.limit || 10;
        let pageToken = req.body.pageToken || '';
        let total_hour = [];
        for (let i = from; i <= to; i++) {
            total_hour.push(Array(Math.max(2 - String(i).length + 1, 0)).join(0) + i);
        }
        let validate = JoiValidationUser.validateUserDetails(user_id, date, 0, 10, from, to, req.body.pageToken);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.userData(user_id, admin_id, (err, user_data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);

            Storage.getStorageDetails(admin_id, async (err, credsData) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get screenshot !', err);
                if (credsData.length === 0) return sendResponse(res, 400, null, 'Not Found Active Storage !', null);

                if (credsData[0].short_code == 'GD') {
                    /**Get main EmpMonitor Folder Id */
                    GoogleDrive.getFolderIdByName('EmpMonitor', credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, mainFolder) => {
                        if (err) return sendResponse(res, 400, null, 'Unable To Get Screenshots.', null);
                        if (mainFolder.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);
                        /**Get mail id folder Id like basavarajshiralashetti@globussoft.in */
                        GoogleDrive.getFolderIdByParentId(mainFolder, user_data[0].email, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, mailFolder) => {
                            if (err) return sendResponse(res, 400, null, 'Invalid Client.', err.response.data.error);
                            if (mailFolder.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);
                            /**Get date folder Id like 2020-04-03 */
                            GoogleDrive.getFolderIdByParentId(mailFolder, date, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, dateIdData) => {
                                if (err) return sendResponse(res, 400, null, 'Invalid Client.', err.response.data.error);
                                if (dateIdData.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);
                                /**Get each hour screenshot data */
                                async.forEach(total_hour, (h, callback) => {
                                    GoogleDrive.getScreenshootFromToDate(dateIdData, `name contains ' ${h}-${date}'`, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, pageToken, limit, (err, screenshootData) => {
                                        if (err) {
                                            callback();
                                        } else {
                                            let finalData = [];
                                            async.forEach(screenshootData.files, (e, cb) => {
                                                finalData.push({
                                                    id: e.id,
                                                    name: e.name,
                                                    // link: e.webContentLink,
                                                    link: e.webContentLink.replace(/&amp;/g, "&"),
                                                    viewLink: e.webViewLink,
                                                    thumbnailLink: e.thumbnailLink,
                                                    created_at: e.createdTime,
                                                    updated_at: e.modifiedTime
                                                })
                                                cb();
                                            }, () => {
                                                if (finalData.length > 0) {
                                                    var obj = {
                                                        t: h,
                                                        s: finalData,
                                                        pageToken: screenshootData.nextPageToken ? screenshootData.nextPageToken : null
                                                    }
                                                    result.push(obj);
                                                    callback();
                                                } else {
                                                    var obj = {
                                                        t: h,
                                                        s: finalData,
                                                        pageToken: screenshootData.nextPageToken ? screenshootData.nextPageToken : null
                                                    }
                                                    result.push(obj);
                                                    callback();
                                                }
                                            })
                                        }
                                    })
                                }, () => {
                                    let r = _.sortBy(result, "t");
                                    return sendResponse(res, 200, {
                                        storage: 'GD',
                                        name: user_data[0].name + ' ' + user_data[0].full_name,
                                        photo_path: user_data[0].photo_path,
                                        email: user_data[0].email,
                                        user_id: user_data[0].id,
                                        screenshot: r
                                    }, 'Screenshot data ', null);
                                });


                            })

                        })

                    })
                } else if (credsData[0].short_code == 'DB') {
                    let hours = [];
                    for (let i = from; i <= to; i++) {
                        hours.push(Array(Math.max(2 - String(i).length + 1, 0)).join(0) + i);
                    }
                    async.forEachSeries(hours, (hour, callback1) => {
                        let path = `/EmpMonitor/${user_data[0].email}/${date.substring(0, 4)}/${date.substring(5, 7)}/${date}/${hour}`;
                        Dropbox.getScreenshots(path, credsData[0].token, (err, data) => {
                            if (err) {
                                callback1();
                            } else {
                                if (data.length === 0) {
                                    callback1();
                                } else {
                                    let finalData = [];
                                    async.forEachSeries(data.entries, (e, cb) => {
                                        finalData.push({
                                            id: e.id,
                                            name: `${hour}-${e.name}`,
                                            link: 'https://www.dropbox.com/home' + e.path_display,
                                            viewLink: 'https://www.dropbox.com/home' + e.path_display,
                                            thumbnailLink: 'https://www.dropbox.com/home' + e.path_display,
                                            created_at: e.client_modified,
                                            updated_at: e.server_modified
                                        })
                                        cb();
                                    }, () => {
                                        if (finalData.length > 0) {
                                            var obj = {
                                                t: hour,
                                                s: finalData,
                                                pageToken: null
                                            }
                                            result.push(obj);
                                            callback();
                                        } else {
                                            var obj = {
                                                t: hour,
                                                s: finalData,
                                                pageToken: null
                                            }
                                            result.push(obj);
                                            callback();
                                        }
                                    });
                                }
                            }
                        })
                    }, () => {
                        if (result.length > 0) {
                            return sendResponse(res, 200, {
                                storage: 'DB',
                                name: user_data[0].name + ' ' + user_data[0].full_name,
                                email: user_data[0].email,
                                user_id: user_data[0].id,
                                photo_path: user_data[0].photo_path,
                                screenshot: result,
                                pageToken: null
                            }, 'Screenshot data ', null);
                        } else {
                            return sendResponse(res, 200, {
                                storage: 'DB',
                                name: user_data[0].name + ' ' + user_data[0].full_name,
                                email: user_data[0].email,
                                user_id: user_data[0].id,
                                photo_path: user_data[0].photo_path,
                                screenshot: null,
                                pageToken: null
                            }, 'Screenshot data not found ', 'Screenshoot data not found on these time');
                        }
                    })
                } else if (credsData[0].short_code == 'S3') {
                    /**Get screenshots from s3 bucket */
                    let prefix = `EmpMonitor/${user_data[0].email}/${date}/`;
                    AmazonSSS.checkDataExists(credsData[0].client_id, credsData[0].client_secret, credsData[0].region, credsData[0].bucket_name, prefix, (err, keyData) => {
                        if (err) return sendResponse(res, 400, null, 'Unable To Get Screenshots.', 'Error While Getting Screenshots');
                        if (keyData.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);
                        async.forEach(total_hour, (h, callback) => {
                            let hour_prefix = `EmpMonitor/${user_data[0].email}/${date}/${h}`
                            AmazonSSS.getScreenshots(credsData[0].client_id, credsData[0].client_secret, credsData[0].region, credsData[0].bucket_name, hour_prefix, pageToken, (err, ssData) => {
                                if (err) {
                                    callback();
                                } else {
                                    let finalData = [];
                                    async.forEach(ssData, (e, cb) => {
                                        finalData.push({
                                            id: e.Key,
                                            name: e.Key,
                                            // link: e.webContentLink,
                                            link: `https://${credsData[0].bucket_name}.s3.${credsData[0].region}.amazonaws.com/${e.Key}`,
                                            viewLink: `https://${credsData[0].bucket_name}.s3.${credsData[0].region}.amazonaws.com/${e.Key}`,
                                            thumbnailLink: `https://${credsData[0].bucket_name}.s3.${credsData[0].region}.amazonaws.com/${e.Key}`,
                                            created_at: e.LastModified,
                                            updated_at: e.LastModified
                                        })
                                        cb();
                                    }, () => {
                                        var obj = {
                                            t: h,
                                            s: finalData,
                                            pageToken: null
                                        }
                                        result.push(obj);
                                        callback();
                                    })
                                }
                            })
                        }, () => {
                            let r = _.sortBy(result, "t");
                            return sendResponse(res, 200, {
                                storage: 'S3',
                                name: user_data[0].name + ' ' + user_data[0].full_name,
                                photo_path: user_data[0].photo_path,
                                email: user_data[0].email,
                                user_id: user_data[0].id,
                                screenshot: r
                            }, 'Screenshot data ', null);
                        })
                    });
                } else {
                    return sendResponse(res, 400, null, 'Unable to get screenshot !', err);
                }

            })

        })
    }

    async getUserWorkingHours(req, res) {
        let user_id = req.body.user_id;
        let from_date = req.body.from_date ? moment(req.body.from_date).format('YYYY-MM-DD') : null;
        let to_date = req.body.to_date ? moment(req.body.to_date).format('YYYY-MM-DD') : null;
        let is_department = req.body.department_id == 0 ? true : false
        let is_user = req.body.user_id == 0 ? true : false;
        let is_location = req.body.location_id == 0 ? true : false;
        let location = req.body.location_id ? req.body.location_id : 0;
        let department_id = req.body.department_id ? req.body.department_id : 0;
        let admin_id = req['decoded'].jsonData.admin_id;
        let validate = JoiValidationUser.workingHours(user_id, from_date, to_date, location, department_id);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        let user_data = req.body
        user_data.department = null;
        Promise.all([
            User.getUserWorkingHours(user_id, from_date, to_date, admin_id, is_user, location, is_location),
            User.getUserWorkingHoursForDay(user_id, from_date, to_date, admin_id, is_user, location, is_location),
            User.getUserWorkingHoursByDepartment(department_id, from_date, to_date, admin_id, is_department, location, is_location),
            User.getUserWorkingHoursByDepartmentForDepartment(department_id, from_date, to_date, admin_id, is_department, location, is_location)
        ]).then(function (result) {
            return sendResponse(res, 200, {
                user_data: user_data,
                user_working_hours: result[0] ? result[0] : [],
                user_working_hoursForDay: result[1] ? result[1] : [],
                department_working_hours: result[2] ? result[2] : [],
                department_working_hoursForDay: result[3] ? result[3] : []
            }, 'Woking Hours.', null);
        });

    }

    async AppsActivityTrack(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const user_id = req.body.user_id;
        const date = moment(req.body.date).format('YYYY-MM-DD');
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 20;

        const validate = JoiValidationUser.activityTrack(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let user_data = await User.getUserData(user_id, admin_id);
        if (user_data.length == 0) return sendResponse(res, 400, null, 'User Not Found.', null);

        let apps_activity_track = await User.appsActivityTrack(admin_id, user_id, date, skip, limit);

        let total_apps = 0;
        let has_more_data = false;
        if (apps_activity_track.length != 0) {
            total_apps = apps_activity_track ? apps_activity_track[0].total_apps : 0;
            has_more_data = (skip + limit) >= total_apps ? false : true;
            apps_activity_track.map(data => {
                delete data.total_apps
            })
        }
        return sendResponse(res, 200, {
            user_data: user_data,
            apps: apps_activity_track,
            has_more_data: has_more_data,
            skip_value: skip + limit,
            total_count: total_apps
        }, 'Apps Data.', null);
    }

    async browserActivityTrack(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const user_id = req.body.user_id;
        const date = moment(req.body.date).format('YYYY-MM-DD');
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 20;

        const validate = JoiValidationUser.activityTrack(user_id, date, req.body.skip, req.body.limit);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let user_data = await User.getUserData(user_id, admin_id);
        if (user_data.length == 0) return sendResponse(res, 400, null, 'User Not Found.', null);

        let browser_activity_track = await User.browserActivityTrack(admin_id, user_id, date, skip, limit);

        let has_more_data = false;
        let browser_data_count = 0;
        if (browser_activity_track.length > 0) {
            browser_data_count = browser_activity_track[0].total_count;
            has_more_data = (skip + limit) >= browser_data_count ? false : true;
            browser_activity_track.map(data => {
                delete data.total_count
            })
        }
        return sendResponse(res, 200, {
            user_data: user_data,
            apps: browser_activity_track,
            has_more_data: has_more_data,
            skip_value: skip + limit,
            browser_data_count: browser_data_count
        }, 'Browser Data.', null);
    }


}
async function getFolderId(credsData, cb) {
    GoogleDrive.getFolderIdByName('EmpMonitorProfilePic', credsData[0].client_id, credsData[0].client_secret, null, credsData[0].refresh_token, (err, folderId) => {
        if (err) {
            cb(err, null);
        } else if (folderId != null && folderId.length > 0) {
            cb(null, folderId);
        } else {
            GoogleDrive.createFolder('EmpmonitorProfilePic', credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, newFolderId) => {
                if (err) {
                    cb(err, null);
                } else {
                    cb(null, newFolderId)
                }
            })
        }
    })
}


async function updateUserProfileData(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, profile_url, user_name, role_id, password, cb) {
    User.updateProfile(admin_id, user_id, fullName, email, address, locationId, deptId, emp_code, phone, joinDate, profile_url, user_name, role_id, password, (err, data) => {
        if (err) {
            cb(err, null)
        } else {
            User.getUserDetailsLocationDepartment(user_id, admin_id, (err, userDetails) => {
                if (err) {
                    cb(err, null)
                } else {
                    PasswordEncodeDecoder.decrypt(userDetails[0].password, process.env.CRYPTO_PASSWORD, (err, decriptedPassword) => {
                        if (err) {
                            cb(err, null)
                        } else {
                            userDetails[0].password = decriptedPassword;
                            cb(null, userDetails)
                        }
                    })
                }
            })
        }
    })
}

module.exports = new UserService;

// let client_id = 'YOUR_GOOGLE_CLIENT_ID';
// let client_secret = 'YOUR_GOOGLE_CLIENT_SECRET';
// let refresh_token = 'YOUR_GOOGLE_REFRESH_TOKEN';
// let mainFolderId = null;
// let mailFolderId = null;
// let dayFolderId = null;
// (async () => {
//     const mainFolderData = await GoogleDrive.getFolderByName('EmpMonitor1', client_id, client_secret, refresh_token);

//     if (mainFolderData.files.length === 0) {
//         const newMainFolderData = await GoogleDrive.createNewFolder('EmpMonitor1', client_id, client_secret, refresh_token);
//         mainFolderId = newMainFolderData.data.id;
//         const permision = await GoogleDrive.addSharePermisionToFolder(mainFolderId, client_id, client_secret, refresh_token);
//     } else {
//         mainFolderId = mainFolderData.files[0].id;
//     }

//     const mailFolderData = await GoogleDrive.getFolderByParentId(mainFolderId, 'basavaraj1@gmail.com', client_id, client_secret, refresh_token);
//     if (mailFolderData.files.length === 0) {
//         const newMailFolderData = await GoogleDrive.createNewFolderWithParent('basavaraj1@gmail.com', mainFolderId, client_id, client_secret, refresh_token);
//         mailFolderId = newMailFolderData.data.id;
//     } else {
//         mailFolderId = mailFolderData.files[0].id;
//     }

//     const dayFolderData = await GoogleDrive.getFolderByParentId(mailFolderId, '2020-05-05', client_id, client_secret, refresh_token);
//     if (dayFolderData.files.length === 0) {
//         const newDateFolderData = await GoogleDrive.createNewFolderWithParent('2020-05-05', mailFolderId, client_id, client_secret, refresh_token);
//         dayFolderId = newDateFolderData.data.id;
//     } else {
//         dayFolderId = dayFolderData.files[0].id;
//     }
//     console.log('===============', dayFolderId);
//     // console.log('==============', mailFolderData);

// })