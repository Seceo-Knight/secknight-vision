'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

var XLSX = require('xlsx')
const async = require('async');
const _ = require('underscore');
const multer = require('multer');
const fs = require('fs');
const moment = require('moment');
const zipdir = require('zip-dir');
const rimraf = require('rimraf');

const Storage = require('../shared/Storage');
const GoogleDrive = require('../../utils/helpers/GoogleDrive');
const JoiValidationUser = require('../../rules/validation/User');
const UserValidation = require('../../rules/validation/User');
const sendResponse = require('../../utils/myService').sendResponse;
const User = require('../shared/User');
const LocationCRUD = require('../shared/LocationCURD');
const DepartmentCURD = require('../shared/DepartmentCURD');
const PasswordEncodeDecoder = require('../../utils/helpers/PasswordEncoderDecoder');
const Mail = require('../../utils/helpers/Mail');
const timezones = require('../../utils/helpers/Timezone').timezones_details;

const upload = multer({
    dest: __dirname.split('src')[0] + 'public',
    filename: function (req, file, callback) {
        callback(null, file.filename + '.xlsx')
    }
}).single('file');


class UserDetails {

    async userRegisterBulk(req, res) {
        upload(req, res, async function (err) {
            const admin_id = req['decoded'].jsonData.admin_id;
            const count = parseInt(req.query.count);
            let users = [];
            let emp_code_users = [];
            let validation = []
            let final_user = [];
            if (!req.file || err) return sendResponse(res, 400, null, 'File Not Found.', err);
            const workbook = XLSX.readFile(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`, {
                cellDates: true
            });
            const sheet_name_list = workbook.SheetNames;
            const user_data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);



            fs.unlinkSync(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`);
            if (user_data.length === 0) return sendResponse(res, 400, null, 'User Data Not Added In File.', null);

            if (!(typeof user_data[0]["Email"] !== 'undefined')) return sendResponse(res, 400, null, 'Email Header Key Not Matched.', 'Email Header Key Not Matched.');
            if (!(typeof user_data[0]["FirstName"] !== 'undefined')) return sendResponse(res, 400, null, 'FirstName Header Key Not Matched.', 'FirstName Header Key Not Matched.');
            if (!(typeof user_data[0]["Password"] !== 'undefined')) return sendResponse(res, 400, null, 'Password Header Key Not Matched.', 'Password Header Key Not Matched.');
            if (!(typeof user_data[0]["EmployeeCode"] !== 'undefined')) return sendResponse(res, 400, null, 'EmployeeCode Header Key Not Matched.', 'EmployeeCode Header Key Not Matched.');
            if (!(typeof user_data[0]["Department"] !== 'undefined')) return sendResponse(res, 400, null, 'Department Header Key Not Matched.', 'Department Header Key Not Matched.');
            if (!(typeof user_data[0]["Location"] !== 'undefined')) return sendResponse(res, 400, null, 'Location Header Key Not Matched.', 'Location Header Key Not Matched.');
            if (!(typeof user_data[0]["LastName"] !== 'undefined')) return sendResponse(res, 400, null, 'LastName Header Key Not Matched.', 'LastName Header Key Not Matched.');
            if (!(typeof user_data[0]["Address"] !== 'undefined')) return sendResponse(res, 400, null, 'Address Header Key Not Matched.', 'Address Header Key Not Matched.');
            if (!(typeof user_data[0]["DOJ"] !== 'undefined')) return sendResponse(res, 400, null, 'DOJ Header Key Not Matched.', 'DOJ Header Key Not Matched.');
            if (!(typeof user_data[0]["Phone"] !== 'undefined')) return sendResponse(res, 400, null, 'Phone Header Key Not Matched.', 'Phone Header Key Not Matched.');
            if (!(typeof user_data[0]["CountryCode"] !== 'undefined')) return sendResponse(res, 400, null, 'CountryCode Header Key Not Matched.', 'CountryCode Header Key Not Matched.');
            if (!(typeof user_data[0]["Role"] !== 'undefined')) return sendResponse(res, 400, null, 'Role Header Key Not Matched.', 'Role Header Key Not Matched.');

            user_data.map(user => {
                user.Email = user.Email ? user.Email.toLowerCase().trim() : '';
                user.Phone = user.Phone ? user.Phone.toString().trim().replace(/-/g, "") : 0;
                user.FirstName = user.FirstName ? user.FirstName.toString() : '';
                user.LastName = user.LastName ? user.LastName.toString() : '';
                user.CountryCode = user.CountryCode;
                user.Address = user.Address ? user.Address.toString() : '';
                user.Password = user.Password ? user.Password.toString() : '';
                user.EmployeeCode = user.EmployeeCode ? user.EmployeeCode.toString() : '';
                // user.Role = user.Role === 'Manager' ? 2 : 1;
            });

            if (count < user_data.length) return sendResponse(res, 401, null, `You Can Add Ony ${count} Users`, null);
            try {
                for (const user of user_data) {
                    const validate = UserValidation.singleUserValidation({ ...user })
                    if (validate.error) {
                        validation.push({ user: user, message: validate.error.details[0].message })
                    } else {
                        const name = user.FirstName.trim();
                        const full_name = user.LastName ? user.LastName.trim() : null;
                        const email = user.Email.toLowerCase().trim();
                        let password = user.Password;
                        const remember_token = null;
                        const emp_code = user.EmployeeCode || null;
                        const location = user.Location.trim();
                        let location_id;
                        const department = user.Department.trim();
                        let department_id;
                        const date_join = user.DOJ ? `'${moment(user.DOJ, 'MM/DD/YYYY').format('YYYY-MM-DD')}'` : null;
                        const address = user.Address || null;
                        const status = 1;
                        const phone = (user.Phone && user.CountryCode) ? `${user.CountryCode}-${user.Phone}` : null;
                        let photo_path = '/default/profilePic/user.png';
                        let role_id;
                        let timezone = 'Africa/Abidjan';
                        if (user.Timezone) {

                            let zone = timezones.find(t => t.name === user.Timezone);
                            zone ? (timezone = zone.zone) : (timezone = 'Africa/Abidjan');
                        }
                        let timezone_offset = 0;
                        if (user.Role === 'Manager') {
                            role_id = 2;
                        } else if (user.Role === 'Team Lead') {
                            role_id = 3;
                        } else {
                            role_id = 1;
                        }

                        const user_by_email = await User.getUserByEmail(email);
                        if (user_by_email.length > 0) {
                            users.push(user);
                            continue;
                        }

                        const user_by_empcode = await User.getUserByEmpCode(emp_code, admin_id);
                        if (user_by_empcode.length > 0) {
                            emp_code_users.push(user);
                            continue;
                        }
                        const location_data = await LocationCRUD.checkLoc(location, admin_id);
                        if (location_data.length === 0) {
                            const new_location = await LocationCRUD.addLoc(location, location, admin_id, timezone, timezone_offset);
                            location_id = new_location.insertId;
                        } else {
                            location_id = location_data[0].id;
                        }

                        const department_data = await LocationCRUD.checkDept(department, admin_id);
                        if (department_data.length === 0) {
                            const new_department = await DepartmentCURD.createDept(admin_id, department, department);
                            department_id = new_department.insertId;
                        } else {
                            department_id = department_data[0].id;
                        }

                        const encripted = await PasswordEncodeDecoder.encryptText(password, process.env.CRYPTO_PASSWORD);
                        const loc_dept = await LocationCRUD.getSingleLocWithDept(location_id, department_id, admin_id);
                        if (loc_dept.length === 0) {
                            const new_dept_loc = await LocationCRUD.addDeptToLoc(location_id, department_id, admin_id);
                        }

                        const data = await User.userRegister(name.replace(/'/g, "''").replace(/"/g, '""'), full_name.replace(/'/g, "''").replace(/"/g, '""'), email, moment().utc().toDate(), encripted, remember_token, phone, emp_code, location_id, department_id, date_join, photo_path, address.replace(/'/g, "''").replace(/"/g, '""'), role_id, status, null, null, admin_id, timezone, timezone_offset);
                        user.id = data.insertId;
                        final_user.push(user);
                    }
                    // return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
                }
            } catch (err) {
                console.log('-----------------', err);
                return sendResponse(res, 400, null, 'Failed To Add Users', 'Database Error');
            }
            try {
                if (final_user.length > 0) {
                    for (const user of final_user) {
                        if (user.Role === 2) {
                            const a = await Mail.sendEMail(user.Email, 'Added As Manager', 'Added As Manager', user.FirstName, user.Password, 'M');
                        }
                    }
                }
                return sendResponse(res, 200, {
                    already_email_exists_users: users,
                    added_users: final_user,
                    already_empcode_exists: emp_code_users,
                    validation_failed_users: validation
                }, 'Successfully Users Added', null);
            } catch (err) {
                return sendResponse(res, 200, {
                    already_email_exists_users: users,
                    added_users: final_user,
                    already_empcode_exists: emp_code_users,
                    validation_failed_users: validation
                }, 'Successfully Users Added And Failed to send Mail', null);
            }
        })
    }

    async downloadScreenshootParallel(req, res) {

        const admin_id = req['decoded'].jsonData.admin_id;
        let result = [];
        let from = parseInt(req.body.from_hour);

        let to = parseInt(req.body.to_hour - 1);
        let date = moment(req.body.date).format('YYYY-MM-DD'); //'2019-12-19'
        let email = req.body.mail;
        let user_id = req.body.user_id;
        let limit = req.body.limit || 10;
        let pageToken = req.body.pageToken || '';
        let total_hour = [];
        for (let i = from; i <= to; i++) {
            total_hour.push(Array(Math.max(2 - String(i).length + 1, 0)).join(0) + i);
        }

        let validate = await JoiValidationUser.validateUserDetails(user_id, date, 0, 10, from, to, req.body.pageToken);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        User.userData(user_id, admin_id, (err, user_data) => {
            if (err) return sendResponse(res, 400, null, 'Database error', err);

            Storage.getStorageDetails(admin_id, (err, credsData) => {
                if (err) return sendResponse(res, 400, null, 'Unable to get screenshot !', err);
                if (credsData.length === 0) return sendResponse(res, 400, null, 'Not Found Active Storage !', null);

                if (credsData[0].short_code == 'GD') {
                    GoogleDrive.getFolderIdByName('EmpMonitor', credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, mainFolder) => {
                        if (err) return sendResponse(res, 400, null, 'Unable To Get Screenshots.', null);
                        if (mainFolder.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);

                        GoogleDrive.getFolderIdByParentId(mainFolder, user_data[0].email, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, mailFolder) => {
                            if (err) return sendResponse(res, 400, null, 'Invalid Client.', err.response.data.error);
                            if (mailFolder.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);

                            GoogleDrive.getFolderIdByParentId(mailFolder, date, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, (err, dateIdData) => {
                                if (err) return sendResponse(res, 400, null, 'Invalid Client.', err.response.data.error);
                                if (dateIdData.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);

                                async.forEach(total_hour, (h, callback) => {
                                    GoogleDrive.getScreenshootFromToDateAllFiles(dateIdData, `name contains ' ${h}-${date}'`, credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, pageToken, limit, (err, screenshootData) => {
                                        if (err) {
                                            callback();
                                        } else {
                                            let finalData = [];
                                            async.forEach(screenshootData.files, (e, cb) => {
                                                finalData.push({
                                                    id: e.id,
                                                    name: e.name,
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
                                            });
                                        }
                                    });
                                }, () => {
                                    let r = _.sortBy(result, "t");
                                    GoogleDrive.downloadFile(credsData[0].client_id, credsData[0].client_secret, credsData[0].token, credsData[0].refresh_token, user_data[0].email, date, r, (err, downloadSuccess) => {
                                        if (err) {
                                            return sendResponse(res, 400, null, 'Error in downloding Screenshot', user_data[0].email);
                                        } else {
                                            let zipPath = `${downloadSuccess.path}.zip`;
                                            zipdir(downloadSuccess.path, {
                                                saveTo: zipPath
                                            }, function (err, buffer) {
                                                if (err) return sendResponse(res, 400, null, 'Error in downloding Screenshot', null);
                                                rimraf.sync(downloadSuccess.path);
                                                let host;
                                                if (process.env.NODE_ENV === 'development') {
                                                    host = process.env.API_URL_DEV;
                                                } else if (process.env.NODE_ENV === 'production') {
                                                    host = process.env.API_URL_PRODUCTION;
                                                } else {
                                                    host = process.env.API_URL_LOCAL;
                                                }
                                                let path = `${host}/screenshots${zipPath.split('screenshots')[1]}`
                                                return sendResponse(res, 200, path, 'This link in valid for one hour', null);
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                } else if (credsData[0].short_code == 'DB') {
                    return sendResponse(res, 400, null, 'DB---DROP BOX---', 'err');
                }
            });
        });
    }

}

module.exports = new UserDetails;