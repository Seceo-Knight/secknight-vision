const mySql = require('../../../database/MySqlConnection').getInstance();
const {EmployeeActivityModel: EmpActivities} = require('../../../models/employee_activities.schema');
const EmpKeyStrokesModel = require('../../../models/employee_keystrokes.schema');
const OrgDeptAppWebModel = require('../../../models/organizaton_department_apps_web.schema');

class UserModel {
    getBrowserHistoryCount(attendance_ids) {
        return EmpActivities.distinct('domain_id', { attendance_id: { $in: attendance_ids }, domain_id: { $ne: null } });
    }

    getBrowserHistory({ attendance_ids, skip, limit }) {
        return EmpActivities
            .aggregate([
                {
                    $match: {
                        attendance_id: { $in: attendance_ids },
                        domain_id: { $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: "organization_apps_webs",
                        let: { domain_id: "$domain_id" },
                        pipeline: [
                            { $match: { $expr: { $or: [ { $eq: [ "$id",  "$$domain_id" ] }, { $eq: [ "$_id", "$$domain_id" ] } ] } } },
                            { $project: { name: 1, _id: 0 } }
                        ],
                        as: "domain"
                    }
                },
                { $unwind: "$domain" },
                {
                    $lookup: {
                        from: "organization_apps_webs",
                        let: { application_id: "$application_id" },
                        pipeline: [
                            { $match: { $expr: { $or: [ { $eq: [ "$id",  "$$application_id" ] }, { $eq: [ "$_id", "$$application_id" ] } ] } } },
                            { $project: { name: 1, _id: 0 } }
                        ],
                        as: "browser"
                    }
                },
                { $unwind: "$browser" },
                {
                    $group: {
                        _id: "$domain_id",
                        domain: { $first: "$domain.name" },
                        // browser: { $first: "$browser.name" },
                        total_duration: { $sum: "$total_duration" },
                        active_seconds: { $sum: "$active_seconds" },
                        urls: {
                            $push: {
                                url: "$url",
                                start_time: "$start_time",
                                browser: "$browser.name",
                                total_duration: "$total_duration",
                                active_seconds: "$active_seconds",
                            }
                        }
                    }
                },
                { $sort: { total_duration: -1 } },
                { $skip: skip },
                { $limit: limit },
                // { $project: { _id: 0 } }
            ]);
    }

    getApplicationsUsedCount(attendance_ids) {
        return EmpActivities.distinct('application_id', { attendance_id: { $in: attendance_ids }, application_id: { $ne: null }, domain_id: { $eq: null } });
    }

    getApplicationsUsed({ attendance_ids, skip, limit }) {
        return EmpActivities
            .aggregate([
                {
                    $match: {
                        attendance_id: { $in: attendance_ids },
                        application_id: { $ne: null },
                        domain_id: { $eq: null }
                    }
                },
                {
                    $lookup: {
                        from: "organization_apps_webs",
                        let: { application_id: "$application_id" },
                        pipeline: [
                            { $match: { $expr: { $or: [ { $eq: [ "$id",  "$$application_id" ] }, { $eq: [ "$_id", "$$application_id" ] } ] } } },
                            { $project: { name: 1, _id: 0 } }
                        ],
                        as: "app"
                    }
                },
                { $unwind: "$app" },
                {
                    $group: {
                        _id: "$application_id",
                        app_name: { $first: "$app.name" },
                        total_duration: { $sum: "$total_duration" },
                        active_seconds: { $sum: "$active_seconds" }
                    }
                },
                { $sort: { total_duration: -1 } },
                { $skip: skip },
                { $limit: limit },
                // { $project: { _id: 0 } }
            ]);
    }

    /**
     * @param {Array<String>} application_ids
     * @memberof UserModel
     */
    async getApplicationsProductivity(application_ids) {
        try {
            const results = await OrgDeptAppWebModel.find({ application_id: { $in: application_ids }, department_id: null });
        
            const appProductivityStatus = [];
            for (const result of results) {
                const { application_id, status } = result;
                if(result.type === 1) {
                    appProductivityStatus.push({application_id, status});
                } else {
                    const data = await OrgDeptAppWebModel.findOne({application_id, department_id: {$ne: null}}).select('status');
                    appProductivityStatus.push({application_id, status: data ? data.status : null});
                }
            }

            return Promise.resolve(appProductivityStatus);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    getKeyStrokes(attendance_id) {
        return EmpKeyStrokesModel.findOne({ attendance_id }).lean();
    }

    getKeyStrokesCount(attendance_ids) {
        return EmpKeyStrokesModel.countDocuments({ attendance_id: { $in: attendance_ids } })
    }
    getKeyStrokesMongo(attendance_ids, skip, limit) {
        return EmpKeyStrokesModel
            .aggregate([
                {
                    $match: {
                        attendance_id: { $in: attendance_ids },
                    },

                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
            ])
        return EmpKeyStrokesModel.find({ attendance_id: { $in: attendance_ids } }).lean();
    }

    getAttandanceId({ admin_id, user_id, date }) {
        const query = `
            SELECT id
            FROM employee_attendance
            WHERE
                organization_id = ? AND
                employee_id = ? AND
                date = ?
        `;

        return mySql.query(query, [admin_id, user_id, date])
    }

    attandanceIds({ admin_id, user_id, startDate, endDate }) {
        const query = `
            SELECT id AS attendance_id
            FROM employee_attendance
            WHERE
                organization_id = ${admin_id} AND
                employee_id = ${user_id} AND
                date BETWEEN "${startDate}" AND "${endDate}"
        `;
        return mySql.query(query)

    }
    getAttandanceIds({ admin_id, user_id, startDate, endDate }) {
        // const query = `
        //     SELECT id AS attendance_id
        //     FROM employee_attendance
        //     WHERE
        //         organization_id = ${admin_id} AND
        //         employee_id = ${user_id} AND
        //         date BETWEEN "${startDate}" AND "${endDate}"
        // `;

        const query = `
            SELECT id AS attendance_id
            FROM production_stats
            WHERE
                admin_id = ${admin_id} AND
                user_id = ${user_id} AND
                day BETWEEN "${startDate}" AND "${endDate}"
        `;

        return mySql.query(query)
    }
}

module.exports = new UserModel;

// EmpActivities.aggregate([
//     {
//         $match: {
//             attendance_id: { $in: [1] },
//             domain_id: { $ne: null }
//         }
//     },
//     {
//         $lookup: {
//             from: "organization_apps_webs",
//             let: { domain_id: "$domain_id" },
//             pipeline: [
//                 { $match: { $expr: { $or: [ { $eq: [ "$id",  "$$domain_id" ] }, { $eq: [ "$_id", "$$domain_id" ] } ] } } },
//                 { $project: { name: 1, _id: 0 } }
//             ],
//             as: "domain"
//         }
//     },
//     { $unwind: "$domain" },
//     {
//         $lookup: {
//             from: "organization_apps_webs",
//             let: { application_id: "$application_id" },
//             pipeline: [
//                 { $match: { $expr: { $or: [ { $eq: [ "$id",  "$$application_id" ] }, { $eq: [ "$_id", "$$application_id" ] } ] } } },
//                 { $project: { name: 1, _id: 0 } }
//             ],
//             as: "browser"
//         }
//     },
//     { $unwind: "$browser" },
//     {
//         $group: {
//             _id: "$domain_id",
//             domain: { $first: "$domain.name" },
//             // browser: { $first: "$browser.name" },
//             total_duration: { $sum: "$total_duration" },
//             active_seconds: { $sum: "$active_seconds" },
//             urls: {
//                 $push: {
//                     url: "$url",
//                     start_time: "$start_time",
//                     browser: "$browser.name",
//                     total_duration: "$total_duration",
//                     active_seconds: "$active_seconds",
//                 }
//             }
//         }
//     },
//     { $sort: { total_duration: -1 } },
//     { $project: { _id: 0 } }
// ], (err, results) => {
//     console.log(err)
//     console.log(results[0])
// });

// foo()
// async function foo() {
//     try {
//         const results = await OrgDeptAppWebModel.find({ application_id: { $in: ["5ec2481b4b733c234a1bb9c8", "5ec2176c5c89b31a64242f0c"] }, department_id: null });
    
//         const appProductivityStatus = [];
//         for (const result of results) {
//             const { application_id, status } = result;
//             if(result.type === 1) {
//                 appProductivityStatus.push({application_id, status});
//             } else {
//                 const data = await OrgDeptAppWebModel.findOne({application_id, department_id: {$ne: null}}).select('status');
//                 appProductivityStatus.push({application_id, status: data ? data.status : null});
//             }
//         }
//     } catch (err) {
//         console.log(err);
//     }
// }