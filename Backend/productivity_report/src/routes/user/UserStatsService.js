'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const moment = require('moment');
const UserStats = require('../shared/UserStats')
const joiValidation = require('../../rules/validation/User')

class UserStatsService {

    topApps(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let is_department = req.body.department_id ? true : false;
        let is_location = req.body.location_id ? true : false;
        let location_id = req.body.location_id || 0;
        let department_id = req.body.department_id || 0;
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 1000;
        let is_date = req.body.from_date && req.body.to_date ? true : false
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        var validation = joiValidation.UserStatsServiceValidation(req.body.skip, req.body.limit, req.body.department_id, req.body.location_id, req.body.to_date, req.body.from_date);
        if (validation.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validation.error.details[0].message });
        }
        UserStats.topApps(admin_id, location_id, department_id, is_location, is_department, skip, limit, from_date, to_date, is_date, (err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Error While Fetching Top Apps.', error: err });
            } else if (data.length > 0) {
                return res.json({ code: 200, data: data, message: 'Succsess.', error: null });
            } else {
                return res.json({ code: 400, data: null, message: 'No Apps Found.', error: null });
            }
        })
    }

    topWebsites(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let is_department = req.body.department_id ? true : false;
        let is_location = req.body.location_id ? true : false;
        let location_id = req.body.location_id || 0;
        let department_id = req.body.department_id || 0;
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 1000;
        let is_date = req.body.from_date && req.body.to_date ? true : false
        let from_date = moment(req.body.from_date).format('YYYY-MM-DD');
        let to_date = moment(req.body.to_date).format('YYYY-MM-DD');
        var validation = joiValidation.UserStatsServiceValidation(req.body.skip, req.body.limit, req.body.department_id, req.body.location_id, req.body.to_date, req.body.from_date);
        if (validation.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validation.error.details[0].message });
        }
        UserStats.topWebsites(admin_id, location_id, department_id, is_location, is_department, skip, limit, from_date, to_date, is_date, (err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Error While Fetching Top Visited Websites.', error: err });
            } else if (data.length > 0) {
                return res.json({ code: 200, data: data, message: 'Succsess.', error: null });
            } else {
                return res.json({ code: 400, data: null, message: 'No Websites Found.', error: null });
            }
        })
    }
}

module.exports = new UserStatsService