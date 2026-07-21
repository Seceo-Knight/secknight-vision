// const OrgAppWeb = require('../../../../models/organization_apps_web.schema');
const OrgAppWeb = require('../../models/organization_apps_web.schema');
const OrgCategory = require('../../models/organization_categories.schema');
const mongoose = require('mongoose');

class CategoryModel {
    async getDomainCategory(damain_name, organization_id) {
        return await OrgAppWeb.aggregate([
            { $match: { $expr: { $gt: [{ $size: "$category_ids" }, 0] }, name: damain_name } },
            {
                $lookup: {
                    from: 'organization_categories',
                    let: { cat_id: '$category_ids' },
                    pipeline: [{ $match: { $expr: { $and: [{ $in: ['$_id', "$$cat_id"] }, { $ne: ["$name", "Uncategorized"] }] } } }, { $project: { name: 1 } }],
                    as: 'category'
                }
            },
            { $limit: 1 },
            { $unwind: "$category" },
            { $project: { _id: 0, name: "$category.name", category_id: "$category._id" } }
        ])
    }

    async addCategory(data) {
        return await OrgCategory.insertMany(data)
    }
    async getCategoryByname(category_names, organization_id) {
        return await OrgCategory.find({ name: { $in: category_names }, organization_id: organization_id })
    }

    async addCategoryToDomains(catIds, domain_id) {
        const data = await OrgAppWeb.updateOne({ _id: domain_id }, { $set: { category_ids: catIds } });
        for (const catId of catIds) {
            await OrgCategory.findOneAndUpdate({ _id: catId }, { $inc: { total_webs: 1 } });
        }
        return data;
    }
    async getDistrinctCategory() {
        return await OrgCategory.distinct("name",)
    }

    async getOrganizationCategory(category_type, name, sortColumn, sortOrder, skip, limit, status, organization_id) {
        let columnOrder = null;
        if (sortColumn) {
            columnOrder = sortOrder == 'D' ? { name: -1 } : { name: 1 };
        } else {
            columnOrder = { created_at: -1 };
        }

        let filter = { organization_id }
        if (category_type === 'Global' || category_type === 'Custom') filter = { ...filter, type: category_type === 'Global' ? 1 : 2, }
        if (category_type === 'New') filter = { ...filter, is_new: true }
        if (name) filter = { ...filter, name }
        if (status === 1 || status === 0 || status === 2) {
            filter = { ...filter, status }
        }
        console.log(filter)
        return await OrgCategory.aggregate([
            { $match: filter },
            {
                $sort: { ...columnOrder }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $unwind: { path: "$department_rule", preserveNullAndEmptyArrays: true }
            },
            { $project: { name: 1, organization_id: 1, department_rule: 1, status: 1, type: 1 } }
        ])
    }
    async OrganizationCategoryCount(category_type, name, status, organization_id) {
        let filter = { organization_id }
        if (category_type === 'Global' || category_type === 'Custom') filter = { ...filter, type: 'Global' ? 1 : 2, is_new: false }
        if (category_type === 'New') filter = { ...filter, is_new: true }
        if (name) filter = { ...filter, name }
        if (status === 1 || status === 0 || status === 2) {
            filter = { ...filter, status }
        }
        return await OrgCategory.aggregate([
            { $match: filter },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0 } }
        ])
    }

    async getCategoryWebAppCount(id, organization_id, name) {
        let filter = { "apps.name": { $ne: null } }
        if (name) filter = { "apps.name": { "$regex": name, "$options": "i" } }

        const objectId = new mongoose.Types.ObjectId(id);
        return await OrgCategory.aggregate([
            { $match: { _id: objectId, organization_id: organization_id } },
            {
                $lookup:
                {
                    from: "organization_apps_webs",
                    localField: "_id",
                    foreignField: "category_ids",
                    as: "apps"
                }
            },
            { $unwind: "$apps" },
            { $match: filter },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0 } }
        ])
    }

    async getCategoryWebApp(id, organization_id, skip, limit, name) {
        let filter = { "apps.name": { $ne: null } }
        if (name) filter = { "apps.name": { "$regex": name, "$options": "i" } }
        const objectId = new mongoose.Types.ObjectId(id);
        return await OrgCategory.aggregate([
            { $match: { _id: objectId, organization_id: organization_id } },
            {
                $lookup:
                {
                    from: "organization_apps_webs",
                    localField: "_id",
                    foreignField: "category_ids",
                    as: "apps"
                }
            },
            { $unwind: "$apps" },
            { $match: filter },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup:
                {
                    from: "organization_department_apps_webs",
                    localField: "apps._id",
                    foreignField: "application_id",
                    as: "department_rules"
                }
            },
            {
                $project: {
                    _id: 0,
                    application_id: '$apps._id',
                    category: '$name',
                    category_id: '$_id',
                    name: "$apps.name",
                    type: "$apps.type",
                    organization_id: 1,
                    department_rules: {
                        // _id: 1,
                        type: 1,
                        department_id: 1,
                        status: 1,
                        // createdAt: 1,
                        // updatedAt: 1
                    }
                }
            }

        ])
    }

    async getCategoryByIds(category_ids) {
        return await OrgCategory.find({ _id: { $in: category_ids } })
    }
    async updateCategoryProductivity({ category_id, status, department_rules, type, is_new }) {
        category_id = new mongoose.Types.ObjectId(category_id);
        return await OrgCategory.updateOne(
            { _id: category_id },
            {
                $set: {
                    status,
                    department_rule: department_rules,
                    type,
                    is_new
                }
            }
        )

    }

    async getCategoryDomains(category_ids, organization_id) {
        // let  category_id = new mongoose.Types.ObjectId(category_id);
        let category_id = category_ids.map(itr => new mongoose.Types.ObjectId(itr))
        return await OrgCategory.aggregate([
            { $match: { _id: { $in: category_id }, organization_id: organization_id } },
            {
                $lookup:
                {
                    from: "organization_apps_webs",
                    localField: "_id",
                    foreignField: "category_ids",
                    as: "apps"
                }
            },
            { $unwind: "$apps" },
            { $project: { application_id: "$apps._id", name: "$apps.name" } }
        ])
    }
}
module.exports = new CategoryModel;




