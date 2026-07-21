const _ = require('underscore');
// const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Logger = require('../../../../logger/Logger').logger;


const sendResponse = require('../../../../utils/myService').sendResponse;
const PRValidator = require('../productivity-ranking/ProductivityRanking.validator')
const CategoryValidator = require('./Category.validator')
const urlMetadata = require('url-metadata');
const CategoryModel = require('./Category.model');
const ProductivityModel = require('../productivity-ranking/ProductivityRanking.model')
const { categorypMessages } = require("../../../../utils/helpers/LanguageTranslate");
const PRService = require('../productivity-ranking/ProductivityRanking.model')


class CategoryController {
    async getCategoryFromMetadate(domain) {
        // IF THERE, REMOVES 'http://', 'https://' or 'ftp://' FROM THE START
        domain = domain.replace(new RegExp(/^http\:\/\/|^https\:\/\/|^ftp\:\/\//i), "");
        // IF THERE, REMOVES 'www.' FROM THE START OF THE STRING
        domain = domain.replace(new RegExp(/^www\./i), "");
        try {
            let metadata = await urlMetadata('http://' + domain)
            let keywords = await metadata.keywords + metadata.description;
            // let keywords = 'sports,eduction'
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
            Logger.error(`-V3---error-----${err}------${__filename}----`);
            return null;
        }
    }

    // async getCategoryFromsitereview(damain_name, domain_id, organization_id) {
    //     try {
    //         let category = [];
    //         const browser = await puppeteer.launch({
    //             // headless: false,
    //             // slowMo: 250 // slow down by 250ms
    //         });
    //         const page = await browser.newPage();
    //         await page.setDefaultNavigationTimeout(0)
    //         await page.goto('https://sitereview.bluecoat.com/#/', { waitUntil: 'networkidle2' });
    //         await page.waitForSelector('input[type=url]');
    //         await page.type('input[type=url]', damain_name);
    //         await page.$eval('#btnLookup', form => form.click());

    //         try {
    //             await page.waitForSelector(".clickable-category");
    //             category = await page.evaluate(() => Array.from(document.querySelectorAll('.clickable-category'), element => element.textContent));
    //         } catch (err) {
    //             Logger.error(`-V3---error-----${err}------${__filename}----`);
    //         }
    //         await browser.close();
    //         return category;
    //     } catch (err) {
    //         Logger.error(`-V3---error-----${err}------${__filename}----`);
    //         return [];

    //     }
    // }

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
            // console.log(get_category_data, '--------------------Adding old org category to new domain-------------')
        }
        if (insert_list.length > 0) {
            const add_category = await CategoryModel.addCategory(insert_list);
            if (add_category.length > 0) {
                // console.log(add_category, '---------add new org cat-------------', insert_list)
                let newCatIds = _.pluck(add_category, "_id");
                catIds = catIds.concat(newCatIds);
            }
        }
        if (catIds.length > 0) {
            const add_category_to_domains = await CategoryModel.addCategoryToDomains(catIds, domain_id);
            // console.log(catIds, '------------update new category for new domain-----------', add_category_to_domains)
            return add_category_to_domains;
        } else {
            Logger.error(`-V3---error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getOrgCategories(req, res, next) {
        try {
            const { language, organization_id } = req.decoded;
            const { type, category_type, name, sortColumn, sortOrder, skip, limit, status } = await PRValidator.getProductivityRanking().validateAsync(req.query);

            let [count, category, departmentList] = await Promise.all([
                CategoryModel.OrganizationCategoryCount(category_type, name, status, organization_id),
                CategoryModel.getOrganizationCategory(category_type, name, sortColumn, sortOrder, skip, limit, status, organization_id),
                PRService.getDepartments(organization_id)
            ])
            if (category.length == 0) return sendResponse(res, 400, null, categorypMessages.find(x => x.id === "1")[language] || categorypMessages.find(x => x.id === "1")["en"], null);

            let categories_list = [];
            departmentList = _.pluck(departmentList, "id")

            _.map(_.groupBy(category, elem => elem._id),
                (vals, key) => {
                    categories_list.push({
                        _id: key,
                        status: vals[0].status,
                        details: vals
                    });
                })
            let categories = [];
            for (const itr of categories_list) {
                if (itr.status != null) {
                    categories.push({
                        _id: itr._id,
                        name: itr.details[0].name,
                        organization_id: itr.details[0].organization_id,
                        department_rule: [],
                        rule_type: "Global",
                        status: itr.status,
                        domain_count: itr.details[0].total_webs,
                        pre_request: itr.details[0].pre_request || 0
                    })
                }
                else if (itr.status == null) {
                    let dept_rule = itr.details.map(x => x.department_rule)

                    /**Adding newly added departments which is not there in custom category list */
                    let nonExistsDepts = _.difference(departmentList, _.pluck(dept_rule, "department_id"))
                    if (nonExistsDepts.length !== 0) {
                        nonExistsDepts = nonExistsDepts.map(itr => ({ department_id: itr, status: 0, pre_request: 0 }))
                        dept_rule = nonExistsDepts.length !== 0 ? dept_rule.concat(nonExistsDepts) : dept_rule
                    }
                    categories.push({
                        _id: itr._id,
                        name: itr.details[0].name,
                        organization_id: itr.details[0].organization_id,
                        department_rule: dept_rule,
                        rule_type: "Custom",
                        status: 4,
                        domain_count: itr.details[0].total_webs,
                        pre_request: null
                    })
                }
            }
            return sendResponse(res, 200, { categories, totalCount: count.length ? count[0].count : 0, skip, limit }, categorypMessages.find(x => x.id === "3")[language] || categorypMessages.find(x => x.id === "3")["en"], null);
        } catch (err) {
            Logger.error(`-V3---error-----${err}------${__filename}----`);
            next(err);
        }

    }

    async getCategoryWebApps(req, res, next) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const { category_id, skip, limit, name, sortColumn, sortOrder } = await CategoryValidator.getCategoryWebApps().validateAsync(req.query);
            // const get_categories = await CategoryModel.getCategoryWebApp(id, organization_id, skip, limit)
            let [count, webApps, departmentList] = await Promise.all([
                CategoryModel.getCategoryWebAppCount(category_id, organization_id, name),
                CategoryModel.getCategoryWebApp(category_id, organization_id, skip, limit, name, sortColumn, sortOrder),
                PRService.getDepartments(organization_id)
            ])
            if (webApps.length == 0) return sendResponse(res, 400, null, 'No Websites Found.', null);
            departmentList = _.pluck(departmentList, "id")
            webApps = webApps.map(item => {
                // delete item.department_rules._id;
                let rule_type = "Global"
                if (item.department_rules.length > 0) {
                    const global = item.department_rules.find(x => x.department_id == null);
                    if (global) {
                        if (global.type === 1) {
                            return { ...item, status: global.status, department_rules: [], rule_type, pre_request: global.pre_request }
                        } else {
                            rule_type = "Custom";
                            item['status'] = global.status
                            item['department_rules'] = item.department_rules.filter(x => x.department_id !== null)

                            /**Adding newly added departments which is not there in custom productivity list */
                            let nonExistsDepts = _.difference(departmentList, _.pluck(item.department_rules, "department_id"))
                            if (nonExistsDepts.length !== 0) {
                                nonExistsDepts = nonExistsDepts.map(itr => ({ _id: null, department_id: itr, status: 0, type: 2, pre_request: 0 }))
                                item['department_rules'] = nonExistsDepts.length !== 0 ? item['department_rules'].concat(nonExistsDepts) : item['department_rules'];
                            }
                        }
                    } else {
                        rule_type = "Custom"
                    }
                }
                return { ...item, rule_type }
            });
            return res.json({
                code: 200,
                data: webApps,
                skip,
                limit,
                total: count.length ? count[0].count : 0,
                message: categorypMessages.find(x => x.id === "4")[language] || categorypMessages.find(x => x.id === "4")["en"],
                error: null
            })
        } catch (err) {
            Logger.error(`-V3---error-----${err}------${__filename}----`);
            next(err)
        }
    }

    async updateCategoryProductivity(req, res, next) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            let { data: reqData } = await CategoryValidator.UpdateCategoryProductivityRanking().validateAsync(req.body);
            const category_ids = _.pluck(reqData, 'category_id');
            category_ids.forEach(category_id => {
                if (!mongoose.Types.ObjectId.isValid(category_id)) {
                    return res.status(400).json({ code: 400, error: categorypMessages.find(x => x.id === "2")[language] || categorypMessages.find(x => x.id === "2")["en"], message: `category_id: \"${category_id}\" Invalid object id`, data: null });
                }
            });

            const categories = await CategoryModel.getCategoryByIds(category_ids);

            if (categories.length === 0) {
                return res.status(404).json({ code: 404, error: categorypMessages.find(x => x.id === "6")[language] || categorypMessages.find(x => x.id === "6")["en"], message: categorypMessages.find(x => x.id === "5")[language] || categorypMessages.find(x => x.id === "5")["en"], data: null });
            }

            const nonExistingIds = category_ids.filter(cat_id => !categories.find(x => x._id.toString() === cat_id));

            if (nonExistingIds.length > 0) {
                return res.status(404).json({ code: 404, error: categorypMessages.find(x => x.id === "6")[language] || categorypMessages.find(x => x.id === "6")["en"], message: categorypMessages.find(x => x.id === "7")[language] || categorypMessages.find(x => x.id === "7")["en"], data: nonExistingIds });
            }

            categories.forEach(category => {
                if (category.organization_id !== organization_id) {
                    return res.status(404).json({ code: 404, error: categorypMessages.find(x => x.id === "6")[language] || categorypMessages.find(x => x.id === "6")["en"], message: `category_id \"${category._id}\" Does Not Belong to this organization`, data: null });
                }
            });

            let update_category_list = [];
            for (const itr of reqData) {
                if (itr.department_rules[0].department_id == 0) {
                    update_category_list.push({
                        category_id: itr.category_id,
                        status: itr.department_rules[0].status,
                        department_rules: [],
                        type: 1,
                        is_new: false,
                        pre_request: itr.department_rules[0].pre_request
                    })
                }
                if (itr.department_rules[0].department_id != 0) {
                    update_category_list.push({
                        category_id: itr.category_id,
                        status: null,
                        department_rules: itr.department_rules,
                        type: 2,
                        is_new: false,
                        pre_request: null
                    })
                }
            }
            const promiseArr = update_category_list.map(item => { return CategoryModel.updateCategoryProductivity(item) })
            let updatePro = await Promise.all(promiseArr);
            const get_category_domain = await CategoryModel.getCategoryDomains(category_ids, organization_id);
            // if (get_category_domain.length == 0) return sendResponse(res, 400, null, categorypMessages.find(x => x.id === "8")[language] || categorypMessages.find(x => x.id === "8")["en"], null);
            let update_category_domain = []
            if (get_category_domain.length !== 0) {
                for (const item of reqData) {
                    let category_appIds = get_category_domain.filter(i => i._id == item.category_id);
                    if (category_appIds.length > 0) {
                        category_appIds = _.pluck(category_appIds, "application_id");
                        update_category_domain.push({
                            application_id: category_appIds,
                            department_rules: item.department_rules,
                            organization_id
                        })
                    }
                }
            }

            if (update_category_domain.length != 0) {
                const DoainPromiseArr = update_category_domain.map(item => { return ProductivityModel.updateProductivityRanking(item) })
                await Promise.all(DoainPromiseArr);
            }

            return sendResponse(res, 200, update_category_domain, categorypMessages.find(x => x.id === "9")[language] || categorypMessages.find(x => x.id === "9")["en"], null);
        } catch (err) {
            Logger.error(`-V3---error-----${err}------${__filename}----`);
            next(err)
        }

    }

    async getCategories(req, res) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const name = req.query.name || null;
            const category = await CategoryModel.getCategoryList(organization_id, name)
            if (category.length == 0) return sendResponse(res, 400, null, categorypMessages.find(x => x.id === "1")[language] || categorypMessages.find(x => x.id === "1")["en"], null);
            return sendResponse(res, 200, category, categorypMessages.find(x => x.id === "3")[language] || categorypMessages.find(x => x.id === "3")["en"], null);
        } catch (err) {
            return sendResponse(res, 400, null, categorypMessages.find(x => x.id === "10")[language] || categorypMessages.find(x => x.id === "10")["en"], err.message);
        }
    }
}




module.exports = new CategoryController;


(async () => {
    // const [count, category] = await Promise.all([
    //     CategoryModel.OrganizationCategoryCount('Custom', null, null, 1),
    //     CategoryModel.getOrganizationCategory('Custom', null, null, null, 0, 100, null, 1),

    // ])
    // let [count, websites] = await Promise.all([
    //     CategoryModel.getCategoryWebAppCount("5f5cd1a8bc25c839548252fe", 1),
    //     CategoryModel.getCategoryWebApp("5f5cd1a8bc25c839548252fe", 1, 0, 100)
    // // ])
    // const get_category_domain = await CategoryModel.getCategoryDomains(["5f5cd1a8bc25c839548252fd"], 1);
    // console.log(get_category_domain, '----------------',)
})
    // ()




// console.log(update_category_list)