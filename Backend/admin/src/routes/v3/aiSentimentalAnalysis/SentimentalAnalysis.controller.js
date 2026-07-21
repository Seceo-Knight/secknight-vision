const JoiValidation = require('./SentimentalAnalysis.validator');
const UserActivityModel = require('../useractivity/useractivity.model');
const SentimentalAnalysisModel = require('./SentimentalAnalysis.Model');
const moment = require('moment-timezone');
const _ = require('underscore');
const async = require('async');

const CloudStorageService = require('../useractivity/service/cloudstorage.service');
const sendResponse = require('../../../utils/myService').sendResponse;
const Logger = require('../../../logger/Logger').logger;
// const AIService = require('./AI.service');

class SentimentalAnalysisController {

    async getKeyStrokes(req, res, next) {
        try {

            const { employee_id, employee_timezone } = await JoiValidation.getKeyStrokes().validateAsync(req.query);
            var previous_date = moment().tz(employee_timezone).subtract(1, 'days').format('YYYY-MM-DD');

            const attendanceData = await SentimentalAnalysisModel.getAttandanceIds({ employee_id, previous_date });
            if (attendanceData.length === 0) {
                return res.json({ code: 404, data: [], message: 'Not Found.', hasMoreData: false, error: null });
            }

            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [totalCount, keyStrokesData] = await Promise.all([
                SentimentalAnalysisModel.getAttandanceCount(employee_id),
                SentimentalAnalysisModel.getKeyStrokes(attendance_ids)
            ]);
            keyStrokesData = keyStrokesData.map(item => {
                let type = 1;
                if (item.domain_name) type = 2;
                return {
                    ...item,
                    app_name: item.app_name.replace('.exe', ''),

                }
            })
            let result = [];
            _.map(_.groupBy(keyStrokesData, elem => elem.app_name),
                (vals, key) => {
                    result.push({
                        app_name: key,
                        keystrokes: vals
                    });
                })
            return res.json({
                code: result.length > 0 ? 200 : 404,
                data: result,
                attendance_id: attendance_ids[0],
                date: previous_date.toString(),
                // hasMoreData: totalCount > skip + limit ? true : false,
                message: result.length > 0 ? 'Keystrokes data.' : 'Not Found.',
                error: null
            });
            // return res.json({
            //     code: result.length > 0 ? 200 : 404,
            //     data: result,
            //     hasMoreData: totalCount > skip + limit ? true : false,
            //     message: result.length > 0 ? 'Keystrokes data.' : 'Not Found.',
            //     error: null
            // });
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            next(err);
        }
    }
    async addSentimentalAnalysisData(req, res, next) {
        try {
            let validate = JoiValidation.validateSentimentalAnalysisData(req.body)
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            const { employee_id, date, positive, negative, neutral, attendance_id, negative_sentences, positive_sentences } = req.body;
            const insert_sentimental = await SentimentalAnalysisModel.addSentimentalAnalysisData(employee_id, date, positive, negative, neutral, attendance_id, positive_sentences, negative_sentences);
            if (insert_sentimental == null) return sendResponse(res, 404, null, 'Date or employeeId is mismatching', null);
            return sendResponse(res, 200, null, 'inserted successfully', null)
        }
        catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            next(err);
        }
    }

    async urlCategory(req, res, next) {
        try {
            let validate = JoiValidation.validateUrlCategorizationData(req.body)
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            const { url, category } = req.body;
            const insert_sentimental = await SentimentalAnalysisModel.addUrlCategory(url, category);
            if (insert_sentimental == null) return sendResponse(res, 404, null, 'some error occured', null);
            return sendResponse(res, 200, null, 'inserted successfully', null)
        }
        catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            next(err);
        }
    }

    async getEmployeeIds(req, res) {
        try {
            let validate = JoiValidation.validateSkipLimit(req.query.skip, req.query.limit);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            const skip = parseInt(req.query.skip);
            const limit = parseInt(req.query.limit);

            let employees_ids = await SentimentalAnalysisModel.getEmployeeId(skip, limit);
            if (employees_ids.length == 0) {
                return sendResponse(res, 400, null, 'Employees Not Found', null);
            }
            return sendResponse(res, 200, { employees_ids: employees_ids, skip_value: skip + limit, skip: skip, limit: limit }, 'Employees Data', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, ' Unable To get Employees', null);
        }
    }

}
module.exports = new SentimentalAnalysisController;

// (async function () {
//     const insert_prediction = await AIModel.addkeystrokePrediction(1, 'app_name', 1, 'keystrokes', 'sentiment');
//     console.log(insert_prediction)
// })()

