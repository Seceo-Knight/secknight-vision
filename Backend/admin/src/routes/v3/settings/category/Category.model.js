const OrgAppWeb = require('../../../../models/organization_apps_web.schema');
const OrgCategory = require('../../../../models/organization_categories.schema');
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
        return await OrgAppWeb.updateOne({ _id: domain_id }, { $set: { category_ids: catIds } })
    }
    async getDistrinctCategory() {
        return await OrgCategory.distinct("name",)
    }

    async getOrganizationCategory(category_type, name, sortColumn, sortOrder, skip, limit, status, organization_id) {
        const filter = buildCategoryFilter(category_type, name, status, organization_id);

        const sort = sortColumn
            ? { name: sortOrder === 'D' ? -1 : 1 }
            : { name: -1 };  // Default sort

        return OrgCategory.aggregate([
            { $match: filter },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $unwind: {
                    path: "$department_rule",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    name: 1,
                    organization_id: 1,
                    department_rule: 1,
                    status: 1,
                    type: 1,
                    pre_request: 1,
                    total_webs: 1 // Count the number of matching docs in the 'result' array
                }
            }
        ]);
            
    }

    async OrganizationCategoryCount(category_type, name, status, organization_id) {
        const filter = buildCategoryFilter(category_type, name, status, organization_id);

        return OrgCategory.aggregate([
            { $match: filter },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0 } }
        ]);
    }


    async getCategoryWebAppCount(id, organization_id, name) {
        const objectId = new mongoose.Types.ObjectId(id);
        let filter = { organization_id, category_ids: objectId }
        if (name) filter = { ...filter, "name": { "$regex": name, "$options": "i" } }

        return await OrgAppWeb.aggregate([
            { $match: filter },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0 } }

        ])
    }
    async getCategoryWebApp(id, organization_id, skip, limit, name, sortColumn, sortOrder) {
        let columnOrder;
        let filter = {
            category_ids: new mongoose.Types.ObjectId(id),
            organization_id
        }
        if (name) filter = { ...filter, "name": { "$regex": name, "$options": "i" } };
        let query = [
            {
                $match: filter
            }
        ];
        if (sortColumn) {
            columnOrder = sortOrder == 'D' ? { "name": -1 } : { "name": 1 };
            query.push({ $sort: columnOrder });
        };
        query.push(
            { $skip: skip },
            { $limit: limit },
            {
                $lookup:
                {
                    from: "organization_department_apps_webs",
                    localField: "_id",
                    foreignField: "application_id",
                    as: "department_rules"
                }
            },
            {
                $project: {
                    _id: 0,
                    application_id: '$_id',
                    name: 1,
                    type: 1,
                    organization_id: 1,
                    pre_request: 1,
                    department_rules: {
                        type: 1,
                        department_id: 1,
                        status: 1,
                        pre_request: 1,
                    }
                }
            });
        return await OrgAppWeb.aggregate(query)
    }

    async getCategoryByIds(category_ids) {
        return await OrgCategory.find({ _id: { $in: category_ids } })
    }
    async updateCategoryProductivity({ category_id, status, department_rules, type, is_new, pre_request }) {
        category_id = new mongoose.Types.ObjectId(category_id);
        return await OrgCategory.updateOne(
            { _id: category_id },
            {
                $set: {
                    status,
                    department_rule: department_rules,
                    type,
                    is_new,
                    pre_request
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

    async getCategoryList(organization_id, name) {
        let filter = { organization_id }
        if (name) {
            filter = { name: { "$regex": name, "$options": "i" }, ...filter }
        }
        return await OrgCategory.find(filter, { name: 1 }).sort({ name: 1 })
    }
}
module.exports = new CategoryModel;




// (async () => {
//     let organization_id = 185;
//     const categries = await OrgCategory.find({ organization_id }, { _id: 1, name: 1 });
//     console.log('------', categries.length);
//     for (const { _id, name } of categries) {
//         const objectId = new mongoose.Types.ObjectId(_id);
//         const [countData] = await OrgCategory.aggregate([
//             { $match: { _id: objectId, organization_id } },
//             {
//                 $lookup:
//                 {
//                     from: "organization_apps_webs",
//                     localField: "_id",
//                     foreignField: "category_ids",
//                     as: "apps"
//                 }
//             },
//             { $unwind: "$apps" },
//             { $group: { _id: null, count: { $sum: 1 } } },
//             { $project: { _id: 0 } }
//         ])
//         console.log(name, '-----------------', countData);
//         if (countData) {

//             await OrgCategory.findOneAndUpdate({ _id: _id }, { total_webs: countData.count })
//         }
//     }
// })

    // ()

// (async () => {
//     const data = await OrgCategory.findOneAndUpdate({ _id: '5f6c28b1c82e0007504e8b0a' }, { $inc: { total_webs: 1 } });
//     console.log('-----------------', data);
// })



function buildCategoryFilter(category_type, name, status, organization_id) {
    const filter = { organization_id };

    if (category_type === 'Global' || category_type === 'Custom') {
        filter.type = category_type === 'Global' ? 1 : 2;
        filter.is_new = false;
    }

    if (category_type === 'New') {
        filter.is_new = true;
    }

    if (name) {
        filter.name = { $regex: name, $options: "i" };
    }

    if ([0, 1, 2].includes(status)) {
        filter.status = status;
    }

    return filter;
}