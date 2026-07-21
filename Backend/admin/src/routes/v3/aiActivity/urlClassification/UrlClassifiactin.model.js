const { EmployeeActivityModel } = require('../../../../models/employee_activities.schema');
const OrganizationWebApps = require('../../../../models/organization_apps_web.schema');
const EmployeeProductivityModel = require('../../../../models/employee_productivity.schema');
const OrganizationDeptWebApps = require('../../../../models/organizaton_department_apps_web.schema');
const mySql = require('../../../../database/MySqlConnection').getInstance();
const conversationClassificationModel = require('../../../../models/conversation_classification.schema');

class UrlClassifictionModel {

    async updateUrlPredictionStatus(id, prediction) {
        return await EmployeeActivityModel.updateOne({ _id: id }, { prediction: prediction })
    }
    async getPredictionURL(attendance_id, urls) {
        return await EmployeeActivityModel.find({
            attendance_id: attendance_id,
            url: { $in: urls },
            prediction: { $ne: null }
        }, { prediction: 1, url: 1 })
    }

    async getDomains({ skip, limit }) {
        return await OrganizationWebApps.aggregate([{
            $match: {
                prediction: null, type: 2
            }
        }, { $group: { _id: '$name' } }, { $project: { _id: 0, "domain": "$_id" } }, { $skip: skip }, { $limit: limit }])
    }

    async domainCount() {
        return await OrganizationWebApps.aggregate([{
            $match: {
                prediction: null, type: 2
            }
        }, { $group: { _id: '$name' } },
        {
            $count: "total"
        }
        ])
        // return await OrganizationWebApps.distinct("name", { "prediction": null, "type": 2 }).length;
    }

    async bulkUpdateDomainPrediction(updateDomais) {

        // console.log(typeof updateDomais, '----------sss-ccccccccccccc------', updateDomais)
        let updatedTotal = 0;
        for (const itr of updateDomais) {
            // const bulk = OrganizationWebApps.collection.initializeOrderedBulkOp();
            // // const applicationIds = updateDomais[status].map(row => new ObjectId(row.application_id));
            // bulk.find({ 'name': { $in: itr.domains } }).update({ $set: { prediction: itr.prediction } });
            // const result = await bulk.execute();
            const result = await OrganizationWebApps.updateMany(
                { name: { $in: itr.domains }, prediction: null },
                { $set: { "prediction": itr.prediction } }
            )
            updatedTotal += result.nModified;
        }
        return updatedTotal;
    }

    async getEmployeeIdleTime(employee_id, date) {
        return await EmployeeProductivityModel.find({ employee_id: employee_id, date: date }, { _id: 0, idle_duration: 1, employee_id: 1 })
        // return await EmployeeProductivityModel.find().limit(5)
    }

    async getAppsIds(attendance_id) {
        return await EmployeeActivityModel.distinct("application_id", { attendance_id: attendance_id, domain_id: null })
    }

    async getWebIds(attendance_id) {
        return await EmployeeActivityModel.distinct("domain_id", { attendance_id: attendance_id, domain_id: { $ne: null } })
    }

    async getAppsCount(applicationIds, deparment_id) {
        let match = {
            $match: {
                $and: [
                    { application_id: { $in: applicationIds } },
                    {
                        $or: [{ deparment_id: null, },
                        { deparment_id: deparment_id },]
                    }]
            }
        }

        return await OrganizationDeptWebApps.aggregate([
            match,
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])
    }
    async getOrgIdleTime(organization_id) {
        let query = 'SELECT rules FROM organization_settings WHERE ??=?'
        return mySql.query(query, ['organization_id', organization_id])
    };

    async getoffensiveWordsCount(employee_id, date) {
        return await conversationClassificationModel.aggregate([
            {
                $match: { employee_id: employee_id, date: { $gte: date, $lte: date }, offensive_words: { $nin: [null, ""], $exists: true }, }
            },
            {
                $project: { offensive_words: 1, _id: 0 }
            },
            {
                $addFields: { wordsArr: { $size: { $split: ["$offensive_words", ","] } } }
            },
            {
                $group:
                {
                    _id: null,
                    count: { $sum: "$wordsArr" }
                }
            },
            {
                $project: { count: 1, _id: 0 }
            }
        ])
    }

    async getSentimentDataCount(employee_id, date) {
        return await conversationClassificationModel.aggregate([
            {
                $match: {
                    employee_id: employee_id, date: date,
                    "sentimentalAnalysis.negative_sentences": { $type: 4 }
                }
            },
            {
                $group: {
                    _id: "$employee_id",
                    negative_count: { $sum: { $size: "$sentimentalAnalysis.negative_sentences" } },
                    positive_count: { $sum: { $size: "$sentimentalAnalysis.positive_sentences" } },
                }
            },
            {
                $project: { positive_count: 1, negative_count: 1, _id: 0 }
            }
        ])
    }

    async updateUserRiskScore(risk_percentage, employee_id, date) {
        return await EmployeeProductivityModel.updateOne(
            { employee_id: employee_id, date: date },
            { $set: { risk_percentage: risk_percentage } })
    }
}
module.exports = new UrlClassifictionModel;