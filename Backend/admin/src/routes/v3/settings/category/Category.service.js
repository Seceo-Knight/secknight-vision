
const CategoryModel = require('./Category.model');
const CategoryController = require('./Category.controller');
const Logger = require('../../../../logger/Logger').logger;


class CategoryService {
    async findAndUpadateDomainCategory(damain_name, domain_id, organization_id) {
        try {
            const get_category = await CategoryModel.getDomainCategory(damain_name);
            /**  Stage-1 For Perticular domain category already added in DB (For=> if domain category found database)*/
            if (get_category.length > 0) {
                // console.log('--------p1------')
                let resultData = await CategoryController.upsertOrgCategory(get_category, domain_id, organization_id)
                return resultData;
            } else {
                /** Stage-2 Finding Domain category from URL metadata */
                // console.log('--------p2------')
                const get_category_metadata = await CategoryController.getCategoryFromMetadate(damain_name, domain_id, organization_id)
                if (get_category_metadata != null) {
                    return get_category_metadata
                } else {
                    // console.log('--------p3------',)
                    let sitereview = await CategoryController.getCategoryFromsitereview(damain_name);
                    if (!sitereview || sitereview.length == 0) return null;
                    sitereview = sitereview.map(itr => ({ name: itr }));
                    let res_Data = await CategoryController.upsertOrgCategory(sitereview, domain_id, organization_id)
                    return res_Data;
                }
            }
        } catch (err) {
            Logger.error(`-V3---error-----${err}------${__filename}----`);
            return null;
        }
    }
}
module.exports = new CategoryService;


//  CategoryController.getCategoryFromsitereview("docs.google.com");