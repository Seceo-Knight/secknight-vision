const _ = require('underscore');

const OrgAppWeb = require('../../../../models/organization_apps_web.schema');
const OrgDeptAppWeb = require('../../../../models/organizaton_department_apps_web.schema');
const ObjectId = require('mongoose').Types.ObjectId;
const mysql = require('../../../../database/MySqlConnection').getInstance()

class PRServiceClass {
    getProductivityRankingCount({ organization_id, type = null, category_type, name, status }) {
        let filter = { organization_id }
        if (type) filter = { ...filter, type }
        if (category_type === 'Global' || category_type === 'Custom') filter = { ...filter, is_new: false }
        if (category_type === 'New') filter = { ...filter, is_new: true }


        if (name) filter = { ...filter, name: { "$regex": name, "$options": "i" } }
        let lookupFilter;
        if (category_type === 'Global' || category_type === 'Custom') {
            lookupFilter = { 'type': category_type === 'Global' ? 1 : 2 };
            if (status === 0 || status === 1 || status === 2) {
                lookupFilter = { 'status': status, ...lookupFilter };
                return OrgAppWeb.aggregate([{
                    $match: { ...filter },
                },
                {
                    $lookup: {
                        from: 'organization_department_apps_webs',
                        let: { application_id: "$_id", ...lookupFilter },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$application_id", "$$application_id"] },
                                            { $eq: ["$type", "$$type"] },
                                            { $eq: ["$status", "$$status"] }
                                        ]
                                    }
                                }
                            },
                        ], as: 'department_rules'
                    }
                },
                {
                    $match: {
                        "department_rules": { $ne: [] }
                    }
                },
                { $count: "total" }
                ]).allowDiskUse(true)
            }
            return OrgAppWeb.aggregate([{
                $match: { ...filter },
            },
            {
                $lookup: {
                    from: 'organization_department_apps_webs',
                    let: { application_id: "$_id", ...lookupFilter },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$application_id", "$$application_id"] },
                                        { $eq: ["$type", "$$type"] },
                                        // { $eq: ["$status", "$$status"] }
                                    ]
                                }
                            }
                        },
                    ], as: 'department_rules'
                }
            },
            {
                $match: {
                    "department_rules": { $ne: [] }
                }
            },
            { $count: "total" }
            ]).allowDiskUse(true)
        }
        if (status === 0 || status === 1 || status === 2) {
            lookupFilter = { 'status': status, ...lookupFilter };
            return OrgAppWeb.aggregate([{
                $match: { ...filter },
            },
            {
                $lookup: {
                    from: 'organization_department_apps_webs',
                    let: { application_id: "$_id", ...lookupFilter },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$application_id", "$$application_id"] },
                                        { $eq: ["$status", "$$status"] }
                                    ]
                                }
                            }
                        },
                    ], as: 'department_rules'
                }
            },
            {
                $match: {
                    "department_rules": { $ne: [] }
                }
            },
            { $count: "total" }
            ]).allowDiskUse(true)
        }
        return OrgAppWeb.countDocuments(filter).allowDiskUse(true);
    }
    /**
     * Get productivity ranking status
     * @function getProductivityRanking
     * @memberof PRServiceClass
     * @param {Number} application_id
     * @param {Array} department_rules
     * @param {Number} organization_id
     * @param {Number} type
     * @param {Number} startIndex
     * @param {Number} limit
     * @param {string} category_type
     * @param {string} sortColumn
     * @param {string} sortOrder
     * @param {Number} status
     * @returns {Promise<Object} Success or error
     */
    getProductivityRanking({ organization_id, type = null, startIndex, limit, category_type, name, sortColumn, sortOrder, status }) {
        let columnOrder = null;
        if (sortColumn) {
            columnOrder = sortOrder == 'D' ? { name: -1 } : { name: 1 };
        } else {
            columnOrder = { created_at: -1 };
        }

        let filter = { organization_id }
        if (type) filter = { ...filter, type }
        if (category_type === 'Global' || category_type === 'Custom') filter = { ...filter, is_new: false }
        if (category_type === 'New') filter = { ...filter, is_new: true }
        // let filter = { organization_id }
        // if(type) filter = {...filter, type}
        if (name) filter = { ...filter, name: { "$regex": name, "$options": "i" } }
        if (category_type === 'Global' || category_type === 'Custom') {
            let lookupFilter = { 'type': category_type === 'Global' ? 1 : 2 };
            if (status === 0 || status === 1 || status === 2) {
                lookupFilter = { 'status': status, ...lookupFilter };
                return OrgAppWeb.aggregate([{
                    $match: { ...filter },
                },
                {
                    $sort: { ...columnOrder }
                },
                {
                    $lookup: {
                        from: 'organization_department_apps_webs',
                        let: { application_id: "$_id", ...lookupFilter },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$application_id", "$$application_id"] },
                                            { $eq: ["$type", "$$type"] },
                                            { $eq: ["$status", "$$status"] }
                                        ]
                                    }
                                }
                            },
                        ], as: 'department_rules'
                    }
                },
                {
                    $match: {
                        "department_rules": { $ne: [] }
                    }
                },
                { $skip: startIndex },
                { $limit: startIndex + limit },
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
                            status: 1,
                            pre_request: 1
                            // createdAt: 1,
                            // updatedAt: 1
                        }
                    }
                }
                ]).allowDiskUse(true);
            };
            return OrgAppWeb.aggregate([{
                $match: { ...filter },
            },
            {
                $sort: { ...columnOrder }
            },
            {
                $lookup: {
                    from: 'organization_department_apps_webs',
                    let: { application_id: "$_id", ...lookupFilter },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$application_id", "$$application_id"] },
                                        { $eq: ["$type", "$$type"] },
                                        // { $eq: ["$status", "$$status"] }
                                    ]
                                }
                            }
                        },
                    ], as: 'department_rules'
                }
            },
            {
                $match: {
                    "department_rules": { $ne: [] }
                }
            },
            // { $count: "total" },
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
                        status: 1,
                        pre_request: 1
                        // createdAt: 1,
                        // updatedAt: 1
                    }
                }
            }
            ]).allowDiskUse(true);
        }
        let query = [{
            $match: { ...filter },
        },
        {
            $sort: { ...columnOrder }
        },]
        if (status === 0 || status === 1 || status === 2) {
            query.push({
                $lookup: {
                    from: 'organization_department_apps_webs',
                    let: { application_id: "$_id", status: status },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$application_id", "$$application_id"] },
                                        { $eq: ["$status", "$$status"] }
                                    ]
                                }
                            }
                        },
                    ], as: 'department_rules'
                }
            },
                {
                    $match: {
                        "department_rules": { $ne: [] }
                    }
                })
        }
        else {
            query.push({
                $lookup: {
                    from: 'organization_department_apps_webs',
                    localField: '_id',
                    foreignField: 'application_id',
                    as: 'department_rules'
                }
            },
                {
                    $match: {
                        "department_rules": { $ne: [] }
                    }
                })
        }
        query.push({ $skip: startIndex },
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
                        status: 1,
                        pre_request: 1
                    }
                }
            })
        return OrgAppWeb.aggregate(query).allowDiskUse(true);
    }

    /**
     * Update productivity ranking status
     * @function updateProductivityRanking
     * @memberof PRServiceClass
     * @param {Number} application_id
     * @param {Array} department_rules
     * @param {Number} organization_id
     * @returns {Promise<Object} Success or error
     */
    async updateProductivityRanking({ application_id, department_rules, organization_id }) {

        // Step 1: mark apps as not new
        await OrgAppWeb.updateMany(
            { _id: { $in: application_id } },
            { $set: { is_new: false } }
        );

        const global_setting = department_rules.find(
            x => x.department_id === 0
        );

        // ===============================
        // GLOBAL RULE FLOW
        // ===============================
        if (global_setting) {

            await OrgDeptAppWeb.updateMany(
                {
                    application_id: { $in: application_id },
                    department_id: null
                },
                {
                    $set: {
                        type: 1,
                        status: global_setting.status,
                        pre_request: global_setting.pre_request
                    }
                },
                { upsert: true }
            );

            await OrgDeptAppWeb.deleteMany({
                application_id: { $in: application_id },
                department_id: { $ne: null }
            });

            return { mode: 'GLOBAL' };
        }

        // ===============================
        // DEPARTMENT-SPECIFIC FLOW
        // ===============================
        const toBeInsertedData = application_id.flatMap(appId =>
            department_rules.map(rule => ({
                application_id: appId,
                department_id: rule.department_id,
                status: rule.status,
                type: 2,
                pre_request: rule.pre_request
            }))
        );

        const department_ids = department_rules.map(
            d => d.department_id
        );

        await OrgDeptAppWeb.updateMany(
            {
                application_id: { $in: application_id },
                department_id: null
            },
            {
                $set: { type: 2, status: 4 }
            },
            { upsert: true }
        );

        await OrgDeptAppWeb.deleteMany({
            application_id: { $in: application_id },
            department_id: { $in: department_ids }
        });

        if (toBeInsertedData.length) {
            await OrgDeptAppWeb.insertMany(toBeInsertedData);
        }

        return { mode: 'DEPARTMENT' };
    }



    getApplicationByIds(application_ids) {
        return OrgAppWeb
            .find({ _id: { $in: application_ids } }, { organization_id: 1, name: 1, type: 1 })
            .lean();
    }

    downloadProductivityRanking({ organization_id, type, status }) {
        let filter = { organization_id }
        if (type) filter = { ...filter, type }

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
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            }
        ]);
    }

    getApplicationIdsByName({ organization_id, name }) {
        return OrgAppWeb.aggregate([
            { $match: { organization_id: { $eq: organization_id }, name: { $in: name } } },
            { $project: { _id: 1, name: 1 } },
        ]);
    }

    getStatusesByApplicationIds(applicationIds) {
        return OrgDeptAppWeb.aggregate([
            { $match: { application_id: { $in: applicationIds.map(id => new ObjectId(id)) } } },
            { $project: { application_id: 1, status: 1 } },
        ]);
    }

    async bulkUpdateProductivityRankingStatuses(toUpdateByStatus) {
        let updatedTotal = 0;
        for (const status in toUpdateByStatus) {
            const bulk = OrgDeptAppWeb.collection.initializeOrderedBulkOp();
            const applicationIds = toUpdateByStatus[status].map(row => new ObjectId(row.application_id));
            bulk.find({ 'application_id': { $in: applicationIds } }).update({ $set: { status: +status } });
            const result = await bulk.execute();
            updatedTotal += result.result.nModified;
        }
        return updatedTotal;
    }

    getDomainsIdsByName({ organization_id, name }) {
        return OrgAppWeb.aggregate([
            { $match: { organization_id: organization_id, name: { $regex: `${name}$` } } },
            { $project: { _id: 1, name: 1 } },
        ]);
    }

    async addUrl(organization_id, name) {
        return await new OrgAppWeb({ name, type: 2, organization_id }).save();
    }

    /**
     * get organization department list
     * 
     * @function getDepartments
     * @memberof PRServiceClass
     * @param {*} organization_id 
     * @returns {Promise<Object>} Organization department List or Error
     */
    getDepartments(organization_id) {
        return mysql.query('SELECT id FROM organization_departments WHERE organization_id = ? ', [organization_id])
    }

    getDepartmentByManager(employee_id, role_id) {
        return mysql.query(`
            SELECT od.id as department_id
                FROM employees e 
                JOIN assigned_employees ae ON ae.to_assigned_id = e.id
                JOIN employees aae ON aae.id = ae.employee_id 
                JOIN organization_departments od ON od.id = aae.department_id 
                JOIN user_role ur ON ur.role_id  = ae.role_id 
                JOIN roles r ON r.id = ur.role_id 
                WHERE e.id = ${employee_id} AND r.id = ${role_id}
        `)
    }

}

const PRService = new PRServiceClass;

PRService.STATUSES = ['Neutral', 'Productive', 'Unproductive'];
PRService.TYPES = ['Application', 'Website'];

module.exports = PRService;

