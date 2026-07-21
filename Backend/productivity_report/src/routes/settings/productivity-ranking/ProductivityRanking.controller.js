
const XLSX = require('xlsx');
const _ = require('underscore');
const mongoose = require('mongoose');

const Common = require('../../../utils/helpers/Common');
const PRService = require('./ProductivityRanking.model');
const PRValidator = require('./ProductivityRanking.validator');

class ProductivityRanking {

    async getProductivityRankingNew(req, res, next) {
        try {
            const { page, limit, type } = await PRValidator.getProductivityRanking().validateAsync(req.query);
            const organization_id = req['decoded'].jsonData.admin_id;

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            let promiseArr = [
                PRService.getProductivityRankingCount({ organization_id, type }),
                PRService.getProductivityRanking({ organization_id, type, startIndex, endIndex })
            ];
            let [total, results] = await Promise.all(promiseArr);

            // Pagination result
            const pagination = {};

            if (startIndex > 0) {
                pagination.prev = { page: page - 1, };
            }

            if (endIndex < total) {
                pagination.next = { page: page + 1, };
            }

            res.json({
                code: 200,
                total,
                pagination,
                data: results,
                hasMoreData: (page * limit) >= total ? false : true,
                message: 'Productivity Ranking.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async updateProductivityRankingNew(req, res, next) {
        try {
            const { application_id, department_rule } = await PRValidator.updateProductivityRanking().validateAsync(req.body);
            const organization_id = req['decoded'].jsonData.admin_id;

            if (!mongoose.Types.ObjectId.isValid(application_id)) {
                return res.status(400).json({ code: 400, error: "ValidationError", message: "application_id: Invalid object id", data: null });
            }

            const application = await PRService.getApplicationById(application_id);

            if (!application) {
                return res.status(404).json({ code: 404, error: "Not Found", message: `application_id \"${application_id}\" Does Not Exist`, data: null });
            }

            if (application.organization_id !== organization_id) {
                return res.status(404).json({ code: 404, error: "Not Found", message: `application_id \"${application_id}\" Does Not Exist For this organization`, data: null });
            }

            const result = await PRService.updateProductivityRanking({ application_id, department_rule })

            return res.json({ code: 200, data: result, message: 'success', error: false });
        } catch (err) {
            next(err);
        }
    }

    async getProductivityRanking(req, res, next) {
        try {
            const { page, limit, type, category_type, name } = await PRValidator.getProductivityRanking().validateAsync(req.query);
            const organization_id = req['decoded'].jsonData.admin_id;

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            let promiseArr = [
                PRService.getProductivityRankingCount({ organization_id, type, category_type, name }),
                PRService.getProductivityRanking({ organization_id, type, startIndex, limit, category_type, name })
            ];
            let [total, results] = await Promise.all(promiseArr);

            results = results.map(item => {
                // delete item.department_rules._id;
                let rule_type = "Global"
                if (item.department_rules.length > 0) {
                    const global = item.department_rules.find(x => x.department_id == null);
                    if (global) {
                        if (global.type === 1) {
                            return { ...item, status: global.status, department_rules: [], rule_type }
                        } else {
                            rule_type = "Custom";
                            item['status'] = global.status
                            item['department_rules'] = item.department_rules.filter(x => x.department_id !== null)
                        }
                    } else {
                        rule_type = "Custom"
                    }
                }
                return { ...item, rule_type }
            });

            // Pagination result
            const pagination = {};

            if (startIndex > 0) {
                pagination.prev = { page: page - 1, };
            }

            if (endIndex < total) {
                pagination.next = { page: page + 1, };
            }

            // return res.json({total, pagination, results})

            res.json({
                code: 200,
                total,
                pagination,
                data: results,
                hasMoreData: (page * limit) >= total ? false : true,
                message: 'Productivity Ranking.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async updateProductivityRanking(req, res, next) {
        try {
            const { application_id, department_rules } = await PRValidator.updateProductivityRanking().validateAsync(req.body);
            const organization_id = req['decoded'].jsonData.admin_id;

            if (!mongoose.Types.ObjectId.isValid(application_id)) {
                return res.status(400).json({ code: 400, error: "ValidationError", message: "application_id: Invalid object id", data: null });
            }

            const application = await PRService.getApplicationById(application_id);

            if (!application) {
                return res.status(404).json({ code: 404, error: "Not Found", message: `application_id \"${application_id}\" Does Not Exist`, data: null });
            }

            if (application.organization_id !== organization_id) {
                return res.status(404).json({ code: 404, error: "Not Found", message: `application_id \"${application_id}\" Does Not Belong to this organization`, data: null });
            }

            await PRService.updateProductivityRanking({ application_id, department_rules })

            return res.json({ code: 200, data: null, message: 'success', error: false });
        } catch (err) {
            next(err);
        }
    }

    async bulkUpdateProductivityRanking(req, res, next) {
        try {
            const { data: reqData } = await PRValidator.bulkUpdateProductivityRanking().validateAsync(req.body);
            const organization_id = req['decoded'].jsonData.admin_id;

            const application_ids = _.pluck(reqData, 'application_id')

            application_ids.forEach(application_id => {
                if (!mongoose.Types.ObjectId.isValid(application_id)) {
                    return res.status(400).json({ code: 400, error: "ValidationError", message: `application_id: \"${application_id}\" Invalid object id`, data: null });
                }
            });

            const applications = await PRService.getApplicationByIds(application_ids);

            if (applications.length === 0) {
                return res.status(404).json({ code: 404, error: "Not Found", message: `application_ids Does Not Exist`, data: null });
            }

            const nonExistingIds = application_ids.filter(app_id => !applications.find(x => x._id.toString() === app_id));

            if (nonExistingIds.length > 0) {
                return res.status(404).json({ code: 404, error: "Not Found", message: `some application_ids Does Not Belong to this organization`, data: nonExistingIds });
            }

            applications.forEach(application => {
                if (application.organization_id !== organization_id) {
                    return res.status(404).json({ code: 404, error: "Not Found", message: `application_id \"${application._id}\" Does Not Belong to this organization`, data: null });
                }
            });

            const promiseArr = reqData.map(item => { return PRService.updateProductivityRanking(item) })

            await Promise.all(promiseArr);

            return res.json({ code: 200, data: null, message: 'success', error: false });
        } catch (err) {
            next(err);
        }
    }
    // async updateProductivityRanking(req, res, next) {
    //     try {
    //         const {application_id, department_ids, status} = await PRValidator.updateProductivityRanking().validateAsync(req.body);
    //         const organization_id = req['decoded'].jsonData.admin_id;

    //         if (!mongoose.Types.ObjectId.isValid(application_id)) {
    //             return res.status(400).json({code: 400, error: "ValidationError", message: "application_id: Invalid object id", data: null });
    //         }

    //         const application = await PRService.getApplicationById(application_id);

    //         if(!application) {
    //             return res.status(404).json({code: 404, error: "Not Found", message: `application_id \"${application_id}\" Does Not Exist`, data: null });
    //         }

    //         if(application.organization_id !== organization_id) {
    //             return res.status(404).json({code: 404, error: "Not Found", message: `application_id \"${application_id}\" Does Not Exist For this organization`, data: null });
    //         }

    //         await PRService.updateProductivityRanking({application_id, department_ids, status})

    //         return res.json({ code: 200, data: null, message: 'success', error: false });
    //     } catch (err) {
    //         next(err);
    //     }
    // }

}

module.exports = new ProductivityRanking;


// const reqData = {
//     data: [
//         {
//             application_id: "5eb67ce3aaa8ea0134510f13",
//             department_rules: [
//                 {
//                     department_id: 1,
//                     status: 0,
//                 },
//                 {
//                     department_id: 1,
//                     status: 0,
//                 },
//             ],
//         },
//         {
//             application_id: "5eb67ce3aaa8ea0134510f14",
//             department_rules: [
//                 {
//                     department_id: null,
//                     status: 0,
//                 },
//             ],
//         }
//     ]
// };

// (async () => {
//     try {
//         const data = await PRValidator.bulkUpdateProductivityRanking().validateAsync(reqData);
//         console.log(data)
//     } catch (err) {
//         console.log(err)
//     }
// })()