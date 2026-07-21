const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../logger/Logger').logger;

// const EmpActivityModel = require('../../../models/employee_activities.schema');
const EmpKeyStrokesModel = require('../../../models/employee_keystrokes.schema');
const EmpActivities = require('../../../models/employee_activities.schema');
const EmpProductivityReportSchema = require('../../../models/employee_productivity.schema')



class SentimentalAnalysisModel {
    /**get attendence */
    getAttandanceIds({ employee_id, previous_date }) {
        const query = `
            SELECT id AS attendance_id,DATE(date) as date,employee_id
            FROM employee_attendance
            WHERE employee_id = ${employee_id} AND date ='${previous_date}'
        `;
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
                        // { $project: { name: 1, _id: 0 } }
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
                    keystrokes: 1
                }
            }
        ]);
    }

    getAttandanceCount(employee_id) {
        const query = `
            SELECT count(id) as count 
            FROM employee_attendance
            WHERE employee_id = ${employee_id} 
            `;

        return mySql.query(query)
    }

    getEmployeeId(skip, limit) {
        const query = `
            SELECT id AS employee_id , timezone AS employee_timezone
            FROM employees
            LIMIT ${skip},${limit} 
        
        `;
        return mySql.query(query)
    }

    async addSentimentalAnalysisData(employee_id, date, positive, negative, neutral, attendance_id, positive_sentences, negative_sentences) {
        return EmpProductivityReportSchema.findOneAndUpdate({ employee_id: employee_id, date: date }, { sentimentalAnalysis: { positive: positive, negative: negative, neutral: neutral, positive_sentences, negative_sentences } })
    }

    async addUrlCategory(url, category) {
        return new UrlCategoryModel({ url: url, category: category }).Save();
    }
}
module.exports = new SentimentalAnalysisModel;