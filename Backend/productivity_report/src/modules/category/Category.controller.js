const _ = require('underscore');
const mongoose = require('mongoose');
// const urlMetadata = require('url-metadata');
const getMetaData = require('metadata-scraper')
const CategoryModel = require('./Category.model');

class CategoryController {
    async getCategoryFromMetadate(domain, domain_id, organization_id) {
        // IF THERE, REMOVES 'http://', 'https://' or 'ftp://' FROM THE START
        domain = domain.replace(new RegExp(/^http\:\/\/|^https\:\/\/|^ftp\:\/\//i), "");
        // IF THERE, REMOVES 'www.' FROM THE START OF THE STRING
        domain = domain.replace(new RegExp(/^www\./i), "");
        try {
            // let metadata = await urlMetadata('http://' + domain)
            let { keywords, description } = await getMetaData('http://' + domain);
            keywords = keywords?.join(",") ?? "" + description ?? "";

            if (keywords == '') return null;
            const get_category = await CategoryModel.getDistrinctCategory()

            let Category_names = []
            for (let itr of get_category) {
                if (keywords.search(new RegExp(itr, "i")) != -1) {
                    Category_names.push(itr)
                }
            }
            if (Category_names.length == 0) return null;
            const get_org_category = await CategoryModel.getCategoryByname(Category_names, organization_id);
            let org_cat_ids = [];
            if (get_org_category.length > 0) {
                org_cat_ids = _.pluck(get_org_category, "_id")
                Category_names = Category_names.filter(item1 =>
                    !get_org_category.some(item2 => item2.name == item1))
            }
            if (Category_names.length > 0) {
                let insert_list = Category_names.map(i => ({ name: i, organization_id: organization_id }));
                insert_list = _.uniq(insert_list, 'name');
                const insertCategory = await CategoryModel.addCategory(insert_list);
                if (insertCategory.length > 0) {
                    const cat_ids = _.pluck(insertCategory, "_id");
                    org_cat_ids = org_cat_ids.concat(cat_ids)
                }
            }
            if (org_cat_ids.length > 0) {
                const add_domain_category = await CategoryModel.addCategoryToDomains(org_cat_ids, domain_id);
                return add_domain_category;
            } else {
                return null
            }
        } catch (err) {
            console.log(err, '-------------error----------------------')
            return null;
        }
    }

    async upsertOrgCategory(categories, domain_id, organization_id) {
        let insert_list = categories.map(itr => ({ name: itr.name, organization_id }));
        insert_list = _.uniq(insert_list, 'name');
        let category_names = _.pluck(insert_list, 'name')

        const get_category_data = await CategoryModel.getCategoryByname(category_names, organization_id);
        let catIds = [];
        if (get_category_data.length > 0) {
            catIds = _.pluck(get_category_data, "_id");
            insert_list = insert_list.filter(item1 =>
                !get_category_data.some(item2 => item2.name == item1.name))
        }
        if (insert_list.length > 0) {
            const add_category = await CategoryModel.addCategory(insert_list);
            if (add_category.length > 0) {
                let newCatIds = _.pluck(add_category, "_id");
                catIds = catIds.concat(newCatIds);
            }
        }
        if (catIds.length > 0) {
            const add_category_to_domains = await CategoryModel.addCategoryToDomains(catIds, domain_id);
            return add_category_to_domains;
        } else {
            return null;
        }
    }

}

module.exports = new CategoryController;

