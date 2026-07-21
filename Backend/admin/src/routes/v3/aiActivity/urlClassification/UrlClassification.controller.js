const sendResponse = require('../../../../utils/myService').sendResponse;
const Logger = require('../../../../logger/Logger').logger;
const JoiValidation = require('./UrlClassification.valdator');
const UrlClassificationModel = require('./UrlClassifiactin.model');
const ConversationModel = require('../../aiKeystrokesActivity/Keystokes.model')
const { EmployeeActivityModel: EmpActivities } = require('../../../../models/employee_activities.schema');
const EmployeeModel = require('../../employee/Employee.model')

const moment = require('moment');
const _ = require('underscore');

class UrlClassificationController {
    async UpdatePredictStatus(req, res) {
        try {

            let data = req.body.post_lists;

            let validate = JoiValidation.updateUrlStatus(data);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let result = []
            _.map(_.groupBy(data, elem => elem.prediction),
                (vals, key) => {
                    result.push({ prediction: key, domains: vals });
                })
            let final_list = [];
            for (const itr of result) {
                final_list.push({ prediction: itr.prediction, domains: itr.domains.map(i => i.domain) })
            }
            if (!final_list.length) return sendResponse(res, 400, null, 'Invalid Inputs.', null);

            const total_updated = await UrlClassificationModel.bulkUpdateDomainPrediction(final_list);
            if (!total_updated) return sendResponse(res, 400, null, 'Not Updated.', null);
            return sendResponse(res, 200, { total_updated }, 'Success', null)
        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable to Update.', err);
        }
    }

    async getDomains(req, res) {
        try {
            const { skip, limit } = req.query;

            let validation = JoiValidation.getDomains(skip, limit);
            if (validation.error) return sendResponse(res, 404, null, 'Validation failed', validation.error.details[0].message);
            // console.log(skip, limit, validation.value)
            const [domains, count] = await Promise.all([
                UrlClassificationModel.getDomains(validation.value),
                UrlClassificationModel.domainCount()
            ])

            return res.json({
                code: domains.length > 0 ? 200 : 400,
                data: domains.length > 0 ? { domains, count: count[0].total } : null,
                message: domains.length > 0 ? 'Domains' : 'No Domains Found',
                error: null
            })

        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable to Get.', err);
        }
    }

    async riskAnalysis(req, res) {
        try {

            const { skip } = req.query;
            let limit = 1;
            let date = moment().format('YYYY-MM-DD');
            let org_idle_time;
            let validation = JoiValidation.getDomains(skip, limit);
            if (validation.error) return sendResponse(res, 404, null, 'Validation failed', validation.error.details[0].message);

            let [totalCount, get_attendance_id] = await Promise.all([
                ConversationModel.getAttandanceCount(date, null),
                ConversationModel.getAttandanceId(date, skip, limit, null)
            ]);
            if (get_attendance_id.length == 0) return sendResponse(res, 400, null, 'No data found', null);
            let employee_ids = _.pluck(get_attendance_id, 'employee_id');
            const orgIdleTime = await UrlClassificationModel.getOrgIdleTime(1)
            if (orgIdleTime.length) {
                org_idle_time = JSON.parse(orgIdleTime[0].rules).idleInMinute || 10;
            }

            let [idle, app_ids, website_ids, convesration, sentiment] = await Promise.all([
                UrlClassificationModel.getEmployeeIdleTime(get_attendance_id[0].employee_id, get_attendance_id[0].date),
                UrlClassificationModel.getAppsIds(get_attendance_id[0].attendance_id),
                UrlClassificationModel.getWebIds(get_attendance_id[0].attendance_id),
                UrlClassificationModel.getoffensiveWordsCount(get_attendance_id[0].employee_id, get_attendance_id[0].date),
                UrlClassificationModel.getSentimentDataCount(get_attendance_id[0].employee_id, get_attendance_id[0].date)
            ])
            idle = idle.length > 0 ? idle[0].idle_duration : 0
            let promissList = [];
            if (app_ids.length) {
                promissList.push(
                    UrlClassificationModel.getAppsCount(app_ids, get_attendance_id[0].department_id))
            }
            if (website_ids.length) {
                promissList.push(
                    UrlClassificationModel.getAppsCount(website_ids, get_attendance_id[0].department_id))
            }
            let result;
            if (promissList.length) {
                result = await Promise.all(promissList)
            }
            let productiveAppCount = { productive: { _id: 1, count: 0 }, unproductive: { _id: 2, count: 0 }, neutral: { _id: 0, count: 0 }, };
            let productiveWebCount = { productive: { _id: 1, count: 0 }, unproductive: { _id: 2, count: 0 }, neutral: { _id: 0, count: 0 }, };

            if (app_ids.length && website_ids.length) {
                productiveAppCount.neutral = result[0].find(x => { return x._id == 0 }) || productiveAppCount.neutral
                productiveAppCount.productive = result[0].find(x => { return x._id == 1 }) || productiveAppCount.productive
                productiveAppCount.unproductive = result[0].find(x => { return x._id == 2 }) || productiveAppCount.unproductive

                productiveWebCount.neutral = result[1].find(x => { return x._id == 0 }) || productiveWebCount.neutral
                productiveWebCount.productive = result[1].find(x => { return x._id == 1 }) || productiveWebCount.productive
                productiveWebCount.unproductive = result[1].find(x => { return x._id == 2 }) || productiveWebCount.unproductive
            }
            else if (app_ids.length && !website_ids.length) {
                productiveAppCount.neutral = result[0].find(x => { return x._id == 0 }) || productiveAppCount.neutral
                productiveAppCount.productive = result[0].find(x => { return x._id == 1 }) || productiveAppCount.productive
                productiveAppCount.unproductive = result[0].find(x => { return x._id == 2 }) || productiveAppCount.unproductive
            } else if (!app_ids.length && website_ids.length) {
                productiveWebCount.neutral = result[0].find(x => { return x._id == 0 }) || productiveWebCount.neutral
                productiveWebCount.productive = result[0].find(x => { return x._id == 1 }) || productiveWebCount.productive
                productiveWebCount.unproductive = result[0].find(x => { return x._id == 2 }) || productiveWebCount.unproductive
            }
            let final_date = {
                employee_id: get_attendance_id[0].employee_id,
                date: get_attendance_id[0].date,
                idle: idle > (org_idle_time * 60) ? 1 : 0,
                productiveAppCount,
                productiveWebCount,
                offensive_words_count: convesration.length ? convesration[0].count : 0,
                has_offensive_words: convesration.length > 0 ? convesration[0].count > 0 ? 1 : 0 : 0,
                negative_sentiment_count: sentiment.length > 0 ? sentiment[0].negative_count : 0,
                positive_sentiment_count: sentiment.length > 0 ? sentiment[0].positive_count : 0,
                totalCount: totalCount[0].count,
                skip
            }
            return res.json({ code: 200, data: final_date, message: 'Success', error: null })
        } catch (err) {
            console.log(err)
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable to Get.', err);
        }

    }

    async updateUserRiskScore(req, res) {
        try {
            const validate = JoiValidation.updateUserRiskScore(req.body);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const { risk_percentage, employee_id } = validate.value;
            const date = moment(validate.value.date).format('YYYY-MM-DD');

            const entity = await UrlClassificationModel.updateUserRiskScore(risk_percentage, employee_id, date);
            if (!entity.nModified) return sendResponse(res, 400, null, 'Not Update.', null);
            return sendResponse(res, 200, null, 'Success.', null);

        } catch (err) {
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable to Update.', err);
        }
    }


}
module.exports = new UrlClassificationController;

