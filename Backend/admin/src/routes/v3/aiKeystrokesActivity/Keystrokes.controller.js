const sendResponse = require('../../../utils/myService').sendResponse;
const Logger = require('../../../logger/Logger').logger;
const ConversationModel = require('./Keystokes.model');
const ConversationValidator = require('./Keystokes.validator')

const moment = require('moment');
const _ = require('underscore');

class keystrokesController {
    async addConversationClassification(req, res) {
        try {
            const employee_id = req.body.employee_id;
            const date = req.body.date;
            const organization_id = req.body.organization_id;
            if (!req.body.result) return sendResponse(res, 404, null, 'Validation failed', 'Validation failed');
            const result = JSON.parse(req.body.result);
            const validate = ConversationValidator.addConversationClassification({ employee_id, date, result, organization_id });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let insert_list = result.map(itr => ({ employee_id, date, application_id: itr.application_id, prediction: itr.prediction, offensive_words: itr.offensive_words, organization_id }))
            if (insert_list.length == 0) return sendResponse(res, 400, null, 'No data found.', null);

            const insert_response = await ConversationModel.addConversationClassification(insert_list);
            if (insert_response.length > 0) return sendResponse(res, 200, null, 'success', null);

            return sendResponse(res, 400, null, 'failed to insert', null);
        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Failed To Insert.', err);
        }
    }
    async addBulkConversationClassification(req, res) {
        try {
            const data = req.body.data;
            const validate = ConversationValidator.addBulkConversationClassification(data);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let count = 0;
            for (const itr of data) {
                let upsert_data = await ConversationModel.upsertConversationClassification(itr);
                count += upsert_data.n
            }
            if (!count) return sendResponse(res, 400, null, 'Not Updated', null);
            return sendResponse(res, 200, null, 'Success', null);
        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Failed To Insert.', err);
        }
    }
    async getDayKestrokes(req, res) {
        try {
            const { skip, limit, timezone } = req.query;
            // var previous_date = moment().subtract(1, 'days').format('YYYY-MM-DD');
            var previous_date = moment().tz(timezone).subtract(1, 'days').format('YYYY-MM-DD');
            const validate = ConversationValidator.validateSkipLimit(skip, limit, timezone);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            // var employee_id = ConversationModel.getEmployeeId(skip,limit,timezone);

            let [totalCount, get_attendance_id] = await Promise.all([
                ConversationModel.getAttandanceCount(previous_date, timezone),
                ConversationModel.getAttandanceId(previous_date, skip, limit, timezone)
            ]);

            if (get_attendance_id.length == 0) return sendResponse(res, 400, null, 'No data found', null);

            let employee_id = _.pluck(get_attendance_id, 'employee_id')
            let org_id = _.pluck(get_attendance_id, 'organization_id')
            get_attendance_id = _.pluck(get_attendance_id, 'attendance_id')

            let keyStrokesData = await ConversationModel.getKeyStrokes(get_attendance_id);
            // if (keyStrokesData.length == 0) return sendResponse(res, 400, null, 'No keystrokes found for this user', null);
            if (keyStrokesData.length == 0) return res.json({
                code: 400,
                attendance_id: get_attendance_id[0],
                employee_id: employee_id[0],
                organization_id: org_id[0],
                date: previous_date.toString(),
                totalCount: totalCount[0].count,
                data: null,
                message: 'No keystrokes found for this user',
                error: null
            });

            // keyStrokesData = keyStrokesData.map(item => {
            //     let type = 1;
            //     if (item.domain_name) type = 2;
            //     return {
            //         ...item,
            //         app_name: item.app_name.replace('.exe', ''),

            //     }
            // })
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
                attendance_id: get_attendance_id[0],
                employee_id: employee_id[0],
                organization_id: org_id[0],
                date: previous_date.toString(),
                // totalCount: totalCount > skip + limit ? true : false,
                totalCount: totalCount[0].count,
                message: result.length > 0 ? 'Keystrokes data.' : 'Not Found.',
                error: null
            });
            // return sendResponse(res, 200, KeystrokeData, 'Keystrokes', null);

        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Failed To get.', err);
        }

    }

    async getKestrokes(req, res) {
        try {
            const { skip, limit } = req.query;
            let date = moment().format('YYYY-MM-DD');
            const validate = ConversationValidator.validateSkipLimit(skip, limit, 'timezone');
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let [totalCount, get_attendance_id] = await Promise.all([
                ConversationModel.getAttandanceCount(date, null),
                ConversationModel.getAttandanceId(date, skip, limit, null)
            ]);

            if (get_attendance_id.length == 0) return sendResponse(res, 400, null, 'No data found', null);
            let attendance_ids = _.pluck(get_attendance_id, 'attendance_id')

            let keyStrokesData = await ConversationModel.getKeyStrokes(attendance_ids);

            if (!keyStrokesData.length) return sendResponse(res, 400, { result: [], totalCount: totalCount[0].count, skip, limit }, 'No Data Found.', null);
            let result = [];
            for (const itr of get_attendance_id) {
                let user_keys = keyStrokesData.filter(i => { return i.attendance_id == itr.attendance_id })

                let app_keystrokes = [];
                _.map(_.groupBy(user_keys, elem => elem.application_id),
                    (vals, key) => {
                        let permittedValues = vals.map(value => ({ keystrokes: value.keystrokes }));
                        app_keystrokes.push({
                            app_id: key,
                            keystrokes: permittedValues
                        });
                    })

                result.push({
                    employee_id: itr.employee_id,
                    attendance_id: itr.attendance_id,
                    organization_id: itr.organization_id,
                    date: moment(itr.date).format('YYYY-MM-DD'),
                    keystrokes: app_keystrokes
                })
            }
            return sendResponse(res, 200, { result, totalCount: totalCount[0].count, skip, limit }, 'Keystrokes', null);

        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Failed To get.', err);
        }
    }

    async addSentimentalAnalysis(req, res) {
        try {
            const result = req.body.sentimental_data || []
            if (!result.length) return sendResponse(res, 404, null, 'Validation failed', 'Validation failed');
            for (const itr of result) {
                let employee_id = itr.employee_id;
                let date = itr.date;
                let sentimentalData = itr.overall_sentimental_data
                let organization_id= itr.organization_id
                let insert_list = await itr.data.map(itr1 => ({ employee_id, date, application_id: itr1.app_id, sentimentalAnalysisData: { negative_sentences: itr1.negative_sentences, positive_sentences: itr1.positive_sentences } }))
                let [res1, res2] = await Promise.all([
                    ConversationModel.addApplicationSentimentalData(insert_list,organization_id),
                    ConversationModel.addOverallSentimentalData(employee_id, date, sentimentalData)
                ])
            }
            return sendResponse(res, 200, null, 'inserted successfully')

        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Failed To Insert.', err);
        }
    }
}
module.exports = new keystrokesController;
