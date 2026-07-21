const _ = require('underscore');
const moment = require('moment');

const PrService = require('./Productivity.model_old');
const PrValidator = require('./Productivity.validator_old');
const Common = require('../../../utils/helpers/Common');

class PrController {

    async getProductivity(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const { location_id, department_id, user_id, startDate, endDate } = await PrValidator.getProductivity().validateAsync(req.query);

            let department_ids = [];
            
            if(department_id) { department_ids.push(department_id); }

            else if(location_id) {
                // Find all departments of specified location
                department_ids = _.pluck(await PrService.getAllDepartmentIdsOfLocation(admin_id, location_id), 'department_id');

                if(department_ids.length === 0) {
                    return res.json({ code: 404, data: null, message: 'Not Found', error: null });
                }
            }

            const result = _.groupBy(await PrService.getProductivity({admin_id, startDate, endDate, user_id, department_ids}), 'day');

            if(Object.keys(result).length === 0) {
                return res.json({ code: 404, data: [], message: 'Not Found', error: null });
            }

            const data = Object.keys(result).map(date => {
                const total_time_duration = result[date].reduce((acc, obj) => acc + obj.time_duration, 0);

                return {
                    [moment(date).format('YYYY-MM-DD')]: result[date].map(item => {
                        return {
                            status: item.status,
                            percentage: (item.time_duration / total_time_duration) * 100
                        }
                    })
                }
            })
            
            return res.json({ code: 200, data: data, message: 'Productivity.', error: null });
        } catch (err) {
            next(err);
        }
    }

    async getProductivityList(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            let {day, page} = await PrValidator.getProductivityList().validateAsync(req.query);

            page = parseInt(page) || 1;
            const limit = process.env.PAGINATION_LIMIT || 500;
            const offset = (page - 1) * limit;

            let promiseArr = [
                PrService.getProductionStatsCount({admin_id, day}),
                PrService.getProductionStats({admin_id, day, limit, offset})
            ];

            let [[{count}], results] = await Promise.all(promiseArr);
            console.log(count);

            res.json({
                code: 200,
                data: results,
                hasMoreData: (page * limit) >= count ? false : true,
                message: 'Productivity List',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

}

module.exports = new PrController;