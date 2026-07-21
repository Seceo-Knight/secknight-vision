'use strict';
const _ = require('underscore');
const async = require("async");
const moment = require('moment');

if (process.env.IS_DEBUGGING) console.log(__filename);
const reportService = require('../shared/Report');
const JoiValidationReport = require('../../rules/validation/Report')


class Reports {
    /**Employee list */
    employee_report(req, res) {
        let date = req.body.date;
        let location_id = req.body.location_id;
        let role_id = req.body.role_id;
        if (date && location_id && role_id) {
            reportService.employeeReport(location_id, role_id, (errReport, employeeData) => {
                if (errReport) {
                    return res.json({ code: 400, data: null, message: 'Error While Fetching Employees.', error: errReport })
                } else {
                    return res.json({ code: 200, data: employeeData, message: 'Employees.', error: errReport })
                }
            })
        } else {
            return res.json({ code: 400, data: null, message: 'Field Is Missing.', error: null });
        }
    }

    ReportUserList(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let is_location = req.body.location_id ? true : false;
        let is_role = req.body.role_id ? true : false;
        let is_department = req.body.department_id ? true : false;
        let department_id = req.body.department_id || 0;
        let location_id = req.body.location_id || 0;
        let role_id = req.body.role_id || 0;
        let validate = JoiValidationReport.employee_list_report(req.body.skip, req.body.limit, req.body.department_id, req.body.location_id, req.body.role_id)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        } else {
            reportService.getReportUserList(admin_id, location_id, role_id, department_id, is_location, is_role, is_department, skip, limit, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Error While Getting User Data.',
                        error: err
                    });
                } else {
                    if (data.length > 0) {
                        let total_count = data.length > 0 ? data[0].total_count : 0;
                        let has_more_data = (skip + limit) >= total_count ? false : true;
                        data.map(e => delete e.total_count);
                        return res.json({
                            code: 200,
                            data: {
                                userData: data,
                                total_count: total_count,
                                has_more_data: has_more_data,
                                skip_value: skip + limit
                            },
                            message: 'User data',
                            error: err
                        });
                    } else {
                        return res.json({
                            code: 400,
                            data: null,
                            message: 'Users Not Found.',
                            error: null
                        });
                    }
                }
            })
        }

    }

    /**
     *Report for log details, keystrokes, top websites,top apps,browser history.
     *
     * @function downloadReport
     * @memberof Reports
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Report/post_download_user_report}
     */
    downloadReport(req, res) {
        let from_date_utc = req.body.from_date_utc;
        let to_date_utc = req.body.to_date_utc;
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;
        let day = req.body.day;
        let user_id = req.body.user_id;
        let downloadOption = req.body.downloadOption;
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 10;
        let admin_id = req['decoded'].jsonData.admin_id;

        let validate = JoiValidationReport.downloadUserReport(user_id, downloadOption, req.body.from_date, req.body.to_date, req.body.from_date_utc, req.body.to_date_utc, req.body.skip, req.body.limit)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        } else {
            from_date_utc = moment(from_date_utc).format('YYYY-MM-DD HH:mm:ss');
            to_date_utc = moment(to_date_utc).format('YYYY-MM-DD HH:mm:ss');
            from_date = moment(req.body.from_date).format("YYYY-MM-DD");
            to_date = moment(req.body.to_date).format("YYYY-MM-DD");

            // from_date = moment(from_date).startOf('day').tz(req['decoded'].jsonData.timezone || 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
            // to_date = moment(to_date).endOf('day').tz(req['decoded'].jsonData.timezone || 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
            /*Option 1 for log details   */
            if (downloadOption == 1) {
                reportService.logDetails(user_id, from_date, to_date, skip, limit, admin_id, (logErr, logData) => {
                    if (logErr) {
                        return res.json({ code: 400, data: null, message: 'Error While Getting Data.', error: logErr });
                    } else {
                        if (logData.length > 0) {
                            let total_count = logData.length > 0 ? logData[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            logData.map(e => delete e.total_count);
                            return res.json({
                                code: 200,
                                data: {
                                    total_count: total_count,
                                    log_data: logData,
                                    has_more_data: has_more_data,
                                    skip_value: skip + limit,
                                    limit: limit
                                },
                                message: 'Log Details',
                                error: null
                            });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Log Details Not Found.', error: null });
                        }
                    }
                })
            }

            /*Option 2 for key strokes  */
            else if (downloadOption == 2) {
                reportService.keyStrokes(user_id, skip, limit, from_date, to_date, admin_id, (err, data) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Error While Getting Data.', error: err });
                    } else {
                        if (data.length > 0) {
                            let total_count = data.length > 0 ? data[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            data.map(e => delete e.total_count);
                            return res.json({
                                code: 200,
                                data: {
                                    total_count: total_count,
                                    keyStokeData: data,
                                    has_more_data: has_more_data,
                                    skip_value: skip + limit,
                                    limit: limit
                                },
                                message: 'Keystrokes',
                                error: null
                            });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Key Stoke Data Not Found.', error: null });
                        }
                    }
                })
            }
            /*Option 3 for top websites  */
            else if (downloadOption == 3) {
                let top_websites;
                reportService.topWebsites(user_id, skip, limit, from_date, to_date, (err, data) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Error While Getting Data.', error: err });
                    } else {
                        if (data.length > 0) {
                            let total_count = data.length > 0 ? data[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            data.map(e => delete e.total_count);
                            top_websites = data;
                            return res.json({
                                code: 200,
                                data: {
                                    top_websites: top_websites,
                                    total_count: total_count,
                                    has_more_data: has_more_data,
                                    skip_value: skip + limit
                                },
                                message: 'Top Visited Website',
                                error: null
                            });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Top Visited Website Not Found.', error: null });
                        }
                    }
                })
            }
            /*Option 4 for top Apps */
            else if (downloadOption == 4) {
                reportService.topApps(user_id, skip, limit, from_date, to_date, (err, data) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Error While Getting Data.', error: err });
                    } else {
                        if (data.length > 0) {
                            let total_count = data.length > 0 ? data[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            data.map(e => delete e.total_count);
                            return res.json({
                                code: 200,
                                data: {
                                    total_count: total_count,
                                    top_used_apps: data,
                                    has_more_data: has_more_data,
                                    skip_value: skip + limit
                                },
                                message: 'Top Applications',
                                error: null
                            });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Top Applications Not Found.', error: null });
                        }
                    }
                })
            }
            /*Option 5 for used top Apps */
            else if (downloadOption == 5) {
                reportService.userApplicationUsed(user_id, skip, limit, from_date_utc, to_date_utc, (err, data) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Error While Getting Data.', error: err });
                    } else {
                        if (data.length > 0) {
                            let total_count = data.length > 0 ? data[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            data.map(e => delete e.total_count);
                            return res.json({
                                code: 200,
                                data: {
                                    total_count: total_count,
                                    appsUsed: data,
                                    has_more_data: has_more_data,
                                    skip_value: skip + limit
                                },
                                message: 'Application Used',
                                error: null
                            });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Application Not Found', error: null });
                        }
                    }
                })
            }
            /*Option 6 for browser history  */
            else if (downloadOption == 6) {
                reportService.getBrowserHistory(user_id, skip, limit, from_date_utc, to_date_utc, (err, data) => {
                    if (err) {
                        return res.json({ code: 400, data: null, message: 'Error While Getting Data.', error: err });
                    } else {
                        if (data.length > 0) {
                            let total_count = data.length > 0 ? data[0].total_count : 0;
                            let has_more_data = (skip + limit) >= total_count ? false : true;
                            data.map(e => delete e.total_count);
                            return res.json({
                                code: 200,
                                data: {
                                    total_count: total_count,
                                    Browser_history: data,
                                    has_more_data: has_more_data,
                                    skip_value: skip + limit
                                },
                                message: 'Browser History',
                                error: null
                            });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Browser History Not Found.', error: null });
                        }
                    }
                })
            } else {
                return res.json({ code: 400, data: null, message: 'Invalid Download Option.', error: null });
            }
        }

    }

    /**
     * Data for report page.
     *
     * @function getDownloadOption
     * @memberof Reports
     * @param {*} req
     * @param {*} res
     * @returns {Object} - Success or Error.
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Report/get_get_download_option}
     */
    getDownloadOption(req, res) {
        var data = {
            choice_option: "DropDown",
            data: [{
                name: "Log Details",
                actual: "1"
            }, {
                name: "Keystrokes",
                actual: "2"
            },
            {
                name: "Top Website",
                actual: "3"
            }, {
                name: "Top Apps",
                actual: "4"
            }, {
                name: "Application Used",
                actual: "5"
            }, {
                name: "Browser History",
                actual: "6"
            }
            ]
        }
        return res.json({
            code: 200,
            data: data,
            message: 'Success.',
            error: null
        });
    }

    MultipleUserAllReport(req, res) {
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id;
        let validate = JoiValidationReport.multipleUserReport(user_id, from_date, to_date)
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {

            let result = [];
            async.forEach(user_id, (user, cb) => {
                async.parallel([
                    callback => {
                        reportService.logDetails(user, from_date, to_date, 0, 400, admin_id, (err, data) => {
                            callback(err, data);
                        })
                    },
                    callback => {
                        reportService.keyStrokes(user, 0, 400, from_date, to_date, admin_id, (err, data) => {
                            callback(err, data);
                        })
                    },
                    callback => {
                        reportService.getBrowserHistory(user, 0, 2000, from_date, to_date, (err, data) => {
                            callback(err, data);
                        })
                    },
                    callback => {
                        reportService.userApplicationUsed(user, 0, 2000, from_date, to_date, (err, data) => {
                            callback(err, data);
                        })
                    },
                    callback => {
                        reportService.topApps(user, 0, 100, from_date, to_date, (err, data) => {
                            callback(err, data);
                        })
                    },
                    callback => {
                        reportService.topWebsites(user, 0, 100, from_date, to_date, (err, data) => {
                            callback(err, data);
                        })
                    }
                ], (err, finalData) => {
                    if (err) {
                        cb();
                    } else {
                        result.push({
                            user_id: user,
                            log_details: finalData[0].length > 0 ? finalData[0] : null,
                            key_stroke: finalData[1].length > 0 ? finalData[1] : null,
                            browser_history: finalData[2].length > 0 ? finalData[2] : null,
                            application_used: finalData[3].length > 0 ? finalData[3] : null,
                            top_apps: finalData[4].length > 0 ? finalData[4] : null,
                            top_websites: finalData[5].length > 0 ? finalData[5] : null
                        });
                        cb();
                    }
                })
            }, () => {
                return res.json({
                    code: 200,
                    data: result,
                    message: 'Users Report',
                    error: null
                });
            })
        }
    }

    async getProductionStats(req, res, next) {
        try {
            const day = req.query.day;
            const admin_id = req['decoded'].jsonData.admin_id;
            const productionStats = await reportService.getProductionStatsWithUsers(admin_id, day);

            return res.json({
                code: 200,
                data: productionStats,
                message: 'Production Stats.',
                error: null
            });
        } catch (err) {
            return res.status(500).json({
                code: 500,
                data: null,
                message: err.message,
                error: err.message
            });
        }
    }

    async multipleUserWithMultpleReport(req, res) {
        let from_date_utc = req.body.from_date_utc;
        let to_date_utc = req.body.to_date_utc;
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;
        let day = req.body.day;
        let user_id = req.body.user_id;
        let downloadOption = req.body.downloadOption;
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 1000;
        let admin_id = req['decoded'].jsonData.admin_id;

        let validate = JoiValidationReport.downloadUserReportMultipleUsers(user_id, downloadOption, req.body.from_date, req.body.to_date, req.body.skip, req.body.limit, from_date_utc, to_date_utc)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        } else {
            from_date = moment(from_date_utc).format('YYYY-MM-DD HH:mm:ss');
            to_date = moment(to_date_utc).format('YYYY-MM-DD HH:mm:ss');
            let local_from_date = moment(req.body.from_date).format("YYYY-MM-DD");
            let local_to_date = moment(req.body.to_date).format("YYYY-MM-DD");

            /*Option 1 for log details   */
            if (downloadOption == 1) {
                let result = [];
                async.forEach(user_id, (user, cb) => {
                    reportService.logDetails(user, local_from_date, local_to_date, 0, 2000, admin_id, (err, data) => {
                        reportService.getUsr(user, (err, dataU) => {
                            result.push({
                                user_id: user,
                                user_name: dataU.length > 0 ? dataU[0].user_name : null,
                                log_details: data.length > 0 ? data : null,
                            });
                            cb();
                        })
                    })
                }, () => {
                    if (result.length == 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            }

            /*Option 2 for key strokes  */
            else if (downloadOption == 2) {
                let result = [];
                async.forEach(user_id, (user, cb) => {

                    reportService.keyStrokes(user, 0, 2000, local_from_date, local_to_date, admin_id, (err, data) => {
                        reportService.getUsr(user, (err, dataU) => {
                            result.push({
                                user_id: user,
                                user_name: dataU.length > 0 ? dataU[0].user_name : null,
                                key_stroke: data.length > 0 ? data : null,
                            });
                            cb();
                        })
                    })
                }, () => {
                    if (result.length === 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            }
            /*Option 3 for top websites  */
            else if (downloadOption == 3) {
                let result = [];
                async.forEach(user_id, (user, cb) => {
                    reportService.topWebsites(user, 0, 1000, local_from_date, local_to_date, (err, data) => {
                        reportService.getUsr(user, (err, dataU) => {
                            result.push({
                                user_id: user,
                                user_name: dataU.length > 0 ? dataU[0].user_name : null,
                                top_websites: data.length > 0 ? data : null
                            });
                            cb();
                        })
                    })
                }, () => {
                    if (result.length === 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            }
            /*Option 4 for top Apps */
            else if (downloadOption == 4) {
                let result = [];
                async.forEach(user_id, (user, cb) => {
                    reportService.topApps(user, 0, 2000, local_from_date, local_to_date, (err, data) => {
                        reportService.getUsr(user, (err, dataU) => {
                            result.push({
                                user_id: user,
                                user_name: dataU.length > 0 ? dataU[0].user_name : null,
                                top_apps: data.length > 0 ? data : null,
                            });
                            cb();
                        })
                    })
                }, () => {
                    if (result.length == 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            }
            /*Option 5 for used top Apps */
            else if (downloadOption == 5) {
                let result = [];
                async.forEach(user_id, (user, cb) => {
                    reportService.userApplicationUsed(user, 0, 2000, from_date, to_date, (err, data) => {

                        reportService.getUsr(user, (err, dataU) => {
                            result.push({
                                user_id: user,
                                user_name: dataU.length > 0 ? dataU[0].user_name : null,
                                application_used: data.length > 0 ? data : null,
                            });
                            cb();
                        })
                    })
                }, () => {
                    if (result.length == 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            }
            /*Option 6 for browser history  */
            else if (downloadOption == 6) {
                let result = [];
                async.forEach(user_id, (user, cb) => {
                    reportService.getBrowserHistory(user, 0, 2000, from_date, to_date, (err, data) => {
                        reportService.getUsr(user, (err, dataU) => {
                            result.push({
                                user_id: user,
                                user_name: dataU.length > 0 ? dataU[0].user_name : null,
                                browser_history: data.length > 0 ? data : null,
                            });
                            cb();
                        })
                    })
                }, () => {
                    if (result.length === 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            } else if (downloadOption == 7) {
                let result = [];
                async.forEach(user_id, (user, cb) => {
                    async.parallel([
                        callback => {
                            reportService.logDetails(user, local_from_date, local_to_date, 0, 1000, admin_id, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            reportService.keyStrokes(user, 0, 1000, local_from_date, local_to_date, admin_id, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            reportService.getBrowserHistory(user, 0, 2000, from_date, to_date, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            reportService.userApplicationUsed(user, 0, 2000, from_date, to_date, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            reportService.topApps(user, 0, 2000, local_from_date, local_to_date, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            reportService.topWebsites(user, 0, 1000, local_from_date, local_to_date, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            reportService.getUsr(user, (err, data) => {
                                callback(err, data);
                            })
                        }
                    ], (err, finalData) => {
                        if (err) {
                            cb();
                        } else {
                            result.push({
                                user_id: user,
                                user_name: finalData[6].length > 0 ? finalData[6][0].user_name : null,
                                log_details: finalData[0].length > 0 ? finalData[0] : null,
                                key_stroke: finalData[1].length > 0 ? finalData[1] : null,
                                browser_history: finalData[2].length > 0 ? finalData[2] : null,
                                application_used: finalData[3].length > 0 ? finalData[3] : null,
                                top_apps: finalData[4].length > 0 ? finalData[4] : null,
                                top_websites: finalData[5].length > 0 ? finalData[5] : null
                            });
                            cb();
                        }
                    })
                }, () => {
                    if (result.length === 0) return res.json({ code: 400, data: result, message: 'Users Report Not Found.', error: null });
                    return res.json({ code: 200, data: result, message: 'Users Report', error: null });
                })
            } else {
                return res.json({ code: 400, data: null, message: 'Invalid Download Option.', error: null });
            }
        }
    }
}
module.exports = new Reports;