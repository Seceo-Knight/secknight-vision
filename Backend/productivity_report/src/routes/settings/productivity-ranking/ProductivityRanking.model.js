const _ = require('underscore');

const OrgAppWeb = require('../../../models/organization_apps_web.schema');
const OrgDeptAppWeb = require('../../../models/organizaton_department_apps_web.schema');

class PRService {

    getProductivityRankingCount({ organization_id, type = null, category_type, name }) {
        let filter = { organization_id }
        if (type) filter = { ...filter, type }
        if (category_type === 'Global' || category_type === 'Custom') filter = { ...filter, is_new: false }
        if (category_type === 'New') filter = { ...filter, is_new: true }
        // let filter = { organization_id }
        // if(type) filter = {...filter, type}

        if (name) filter = { ...filter, name: { "$regex": name, "$options": "i" } }

        if (category_type === 'Global' || category_type === 'Custom') {
            return OrgAppWeb.aggregate([
                { $match: filter },
                { $lookup: { from: 'organization_department_apps_webs', localField: '_id', foreignField: 'application_id', as: 'department_rules' } },
                { $match: { 'department_rules.type': category_type === 'Global' ? 1 : 2 } },
                { $count: "total" }
            ]);
        }

        return OrgAppWeb.countDocuments(filter);
    }

    getProductivityRanking({ organization_id, type = null, startIndex, limit, category_type, name }) {
        let filter = { organization_id }
        if (type) filter = { ...filter, type }
        if (category_type === 'Global' || category_type === 'Custom') filter = { ...filter, is_new: false }
        if (category_type === 'New') filter = { ...filter, is_new: true }
        // let filter = { organization_id }
        // if(type) filter = {...filter, type}
        if (name) filter = { ...filter, name: { "$regex": name, "$options": "i" } }
        if (category_type === 'Global' || category_type === 'Custom') {
            return OrgAppWeb.aggregate([
                { $match: filter },
                { $sort: { created_at: -1 } },
                { $lookup: { from: 'organization_department_apps_webs', localField: '_id', foreignField: 'application_id', as: 'department_rules' } },
                { $match: { 'department_rules.type': category_type === 'Global' ? 1 : 2 } },
                { $skip: startIndex },
                { $limit: limit },
                {
                    $project: {
                        _id: 0,
                        application_id: '$_id',
                        name: 1,
                        type: 1,
                        organization_id: 1,
                        department_rules: {
                            _id: 1,
                            type: 1,
                            department_id: 1,
                            status: 1
                        }
                    }
                }
            ]);
        }

        return OrgAppWeb.aggregate([
            { $match: filter },
            { $sort: { created_at: -1 } },
            {
                $lookup: {
                    from: 'organization_department_apps_webs',
                    localField: '_id',
                    foreignField: 'application_id',
                    as: 'department_rules'
                }
            },
            { $skip: startIndex },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    application_id: '$_id',
                    name: 1,
                    type: 1,
                    organization_id: 1,
                    department_rules: {
                        _id: 1,
                        type: 1,
                        department_id: 1,
                        status: 1
                    }
                }
            }
        ]);
    }

    getApplicationById(application_id) {
        return OrgAppWeb.findById(application_id);
    }

    updateProductivityRanking({ application_id, department_rules }) {
        // on update organization_apps_webs => is_new value becomes false
        OrgAppWeb.updateOne({ _id: application_id }, { $set: { is_new: false } }, (err, info) => { });

        const global_setting = department_rules.find(x => x.department_id === 0);
        if (global_setting) {
            // Set For Whole Org
            // Delete department Data

            OrgDeptAppWeb.findOneAndUpdate(
                { application_id, department_id: null },
                { $set: { type: 1, status: global_setting.status } },
                { upsert: true },
                (err, data) => {
                    if (err) return Promise.reject(err);

                    OrgDeptAppWeb.deleteMany({ application_id, department_id: { $ne: null } }, (err, info) => { if (err) console.error(err); });
                    return Promise.resolve(data);
                }
            );
        } else {
            // Update (department_id === null) Data
            // Update all department Data

            OrgDeptAppWeb.findOneAndUpdate(
                { application_id, department_id: null },
                { $set: { type: 2, status: 4 } },
                { upsert: true },
                (err, data) => {
                    if (err) return Promise.reject(err);

                    const department_ids = _.pluck(department_rules, 'department_id');

                    OrgDeptAppWeb.deleteMany({ application_id, department_id: { $in: department_ids } }, (err, info) => {
                        if (err) return Promise.reject(err);

                        const toBeInsertedData = department_rules.map(item => {
                            return {
                                application_id: application_id,
                                department_id: item.department_id,
                                status: item.status,
                                type: 2
                            }
                        });

                        return OrgDeptAppWeb.insertMany(toBeInsertedData);
                    })

                    // OrgDeptAppWeb.find({ application_id, department_id: { $in: department_ids } }, (err, results) => {
                    //     if(err) return Promise.reject(err);

                    //     const foundIds = _.pluck(results, 'department_id')
                    //     const toBeInsertedIds = department_ids.filter(item => !foundIds.find(x => x === item));
                    //     const toBeInsertedData = toBeInsertedIds.map(item => {
                    //         return {
                    //             application_id, application_id,
                    //             department_id: item,
                    //             status: status
                    //         }
                    //     });

                    //     results.forEach((dept_app_web) => {
                    //         dept_app_web.status = status;
                    //         dept_app_web.save();
                    //     })

                    //     OrgDeptAppWeb.insertMany(toBeInsertedData, (err, data) => {});

                    //     return Promise.resolve();
                    // })
                }
            );
        }
        // OrgDeptAppWeb.find({ application_id, department_id: { $in: department_ids } }, (err, results) => {
        //     if(err) return Promise.reject(err);

        //     const foundIds = _.pluck(results, 'department_id')
        //     const toBeInsertedIds = department_ids.filter(item => !foundIds.find(x => x === item));
        //     const toBeInsertedData = toBeInsertedIds.map(item => {
        //         return {
        //             application_id, application_id,
        //             department_id: item,
        //             status: status
        //         }
        //     });

        //     results.forEach((dept_app_web) => {
        //         dept_app_web.status = status;
        //         dept_app_web.save();
        //     })

        //     OrgDeptAppWeb.insertMany(toBeInsertedData, (err, data) => {});

        //     return Promise.resolve();
        // })
    }

    getApplicationByIds(application_ids) {
        return OrgAppWeb
            .find({ _id: { $in: application_ids } }, { organization_id: 1 })
            .lean();
    }
}

module.exports = new PRService;