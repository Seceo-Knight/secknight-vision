const mySql = require('../../../database/MySqlConnection').getInstance();
const conversationClassificationModel = require('../../../models/conversation_classification.schema');
const { EmployeeActivityModel: EmpActivities } = require('../../../models/employee_activities.schema');
const EmpProductivityReportSchema = require('../../../models/employee_productivity.schema')

class keystrokesModel {
    addConversationClassification(predictionArray) {
        return conversationClassificationModel.insertMany(predictionArray)
    }

    getAttandanceCount(date, timezone) {

        let query = `SELECT count(employee_attendance.id) as count 
            FROM employee_attendance INNER JOIN employees ON employee_attendance.employee_id = employees.id
            WHERE date = '${date}'`;
        if (timezone) {
            query += ` AND employees.timezone='${timezone}'`;
        }
        return mySql.query(query)
    }

    getAttandanceId(date, skip, limit, timezone) {

        let query = `SELECT employee_attendance.id AS attendance_id,employee_attendance.employee_id,employee_attendance.organization_id, DATE_FORMAT(employee_attendance.date, "%Y-%m-%d") as date,employees.department_id
            FROM employee_attendance INNER JOIN employees ON employee_attendance.employee_id = employees.id
            WHERE date = '${date}'`

        if (timezone) {
            query += ` AND employees.timezone = '${timezone}'`;
        }
        query += ` ORDER BY employee_attendance.id ASC  LIMIT ${skip},${limit} `;

        return mySql.query(query)
    }

    getKeyStrokes(attendance_ids) {
        return EmpActivities.aggregate([
            {
                $match: {
                    attendance_id: { $in: attendance_ids },
                    domain_id: { $eq: null },
                    application_id: { $ne: null },
                    keystrokes: { $nin: ["", null] }
                }
            },
            {
                $lookup: {
                    from: "organization_apps_webs",
                    let: { application_id: "$application_id" },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: ["$_id", "$$application_id"] } },
                        },
                        { $project: { name: 1 } }
                    ],
                    as: "app"
                }
            },
            { $unwind: "$app" },
            { $sort: { start_time: -1 } },
            {
                $project: {
                    _id: 0,
                    application_id: "$app._id",
                    app_name: "$app.name",
                    keystrokes: 1,
                    attendance_id: 1
                }
            }
        ]);
    }

    getEmployeeId(skip, limit, timezone) {
        const query = `
            SELECT id AS employee_id 
            FROM employees where timezone='${timezone}'
            LIMIT ${skip},${limit} 
        
        `;
        return mySql.query(query)
    }

    async addApplicationSentimentalData(insert_list,organization_id) {
        for (let itr of insert_list) {
            await conversationClassificationModel.findOneAndUpdate({ employee_id: itr.employee_id, date: itr.date, application_id: itr.application_id }, {organization_id:organization_id, sentimentalAnalysis: { positive_sentences: itr.sentimentalAnalysisData.positive_sentences, negative_sentences: itr.sentimentalAnalysisData.negative_sentences } }, { upsert: true })
        }
        return 'done';
    }
    async addOverallSentimentalData(employee_id, date, overallSentimentalData) {
        return EmpProductivityReportSchema.findOneAndUpdate({ employee_id: employee_id, date: date }, { sentimentalAnalysis: { positive: overallSentimentalData.positive, negative: overallSentimentalData.negative, neutral: overallSentimentalData.neutral } })
    }
    /** Insert record if no exists */
    async upsertConversationClassification({ employee_id, date, organization_id, application_id, prediction, offensive_words }) {
        return await conversationClassificationModel.updateOne(
            { employee_id: employee_id, date: date, application_id: application_id },   // Query parameter
            {
                employee_id: employee_id,
                application_id: application_id,
                organization_id: organization_id,
                prediction: prediction,
                offensive_words: offensive_words,
                date: date,
                // sentimentalAnalysis: {
                //     negative_sentences: [],
                //     positive_sentences: []
                // }
            }
            , { upsert: true }    // Options
        )
    }
}
module.exports = new keystrokesModel;