const Joivalidation = require('./Firewall.vatidation');
const sendResponse = require('../../../utils/myService').sendResponse;
const FirewallModel = require('./Firewall.model')

const async = require('async');
const _ = require('underscore');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { isNullOrUndefined } = require('util');
const { url } = require('inspector');
const actionsTracker = require('../services/actionsTracker');


const upload = multer({
    dest: __dirname.split('src')[0] + 'public',
    filename: function (req, file, callback) {
        callback(null, file.filename + '.csv')
    }
}).single('file');

class FirewallController {

    async addCategory(req, res) {
        const organization_id = req.decoded.organization_id;
        let name = req.body.name
        try {
            const validation = Joivalidation.addCategory(name);
            if (validation.error) {
                return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
            }
            const get_category = await FirewallModel.getCategoryByName(name, organization_id);
            if (get_category.length > 0) {
                return sendResponse(res, 400, null, "Category Name Is Already Exists.", null);
            }
            const add_category = await FirewallModel.addCategory(name, organization_id);
            if (add_category) {
                if (add_category.affectedRows > 0) {
                    req.body.category_id = add_category.insertId;
                    actionsTracker(req,'Firewall category %i added.', [req.body.category_id]);
                    return sendResponse(res, 200, req.body, "Successfully Add Category.", null);
                } else {
                    return sendResponse(res, 400, null, "Unable To add Category.", null);
                }
            } else {
                return sendResponse(res, 400, null, "Unable To add Category.", null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, "Failed To add Category.", err);
        }



    }

    async getCategoies(req, res) {
        const organization_id = req.decoded.organization_id;
        actionsTracker(req,'Firewall categories requested.');
        try {
            const get_category = await FirewallModel.fetchCategoies(organization_id);
            if (get_category.length > 0) {
                return sendResponse(res, 200, get_category, "Categories.", null);
            } else {
                return sendResponse(res, 400, null, "Categories Not Found.", null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Get Category.", err);
        }

    }

    async updateCategory(req, res) {
        const organization_id = req.decoded.organization_id;
        let { category_id, name } = req.body;
        try {
            const validation = Joivalidation.updateCategory(name, category_id);
            if (validation.error) {
                return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
            }
            const update_category = await FirewallModel.updateCategory(name, category_id);
            if (update_category) {
                if (update_category.affectedRows > 0) {
                    actionsTracker(req,'Firewall category %i updated.', [category_id]);
                    return sendResponse(res, 200, req.body, "Category Updated Successfully.", null);
                } else {
                    return sendResponse(res, 400, null, "Unable To Update Category.", null);
                }
            } else {
                return sendResponse(res, 400, null, "Failed To Update Category.", null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Update Category.", err);
        }
    }

    async deleteCategory(req, res) {
        let category_id = req.body.category_id;
        const organization_id = req.decoded.organization_id;

        try {
            const validation = Joivalidation.deleteCategory(category_id);
            if (validation.error) {
                return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
            }
            const get_all_category_domain = await FirewallModel.getAllCategoryDomains(category_id);
            let new_array = [];
            if (get_all_category_domain.length > 0) {
                get_all_category_domain.map(el => new_array.push(el.id));
            }
            const delete_category = await FirewallModel.deleteCategory(category_id);
            if (delete_category) {
                if (delete_category.affectedRows > 0) {

                    checkRule(organization_id, category_id.toString().split(','), 1);
                    if (new_array.length > 0) {
                        checkRule(organization_id, new_array.toString().split(','), 2);
                    }
                    actionsTracker(req,'Firewall category %i deleted.', [category_id]);
                    return sendResponse(res, 200, null, "Categories Deleted Successfully.", null);
                } else {
                    return sendResponse(res, 400, null, "Unable To Delete Category.", null);
                }

            } else {
                return sendResponse(res, 400, null, "Failed To Delete Category.", null);
            }

        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Delete Category.", err);
        }

    }

    async addDomains(req, res) {
        let { category_id, name } = req.body;
        const organization_id = req.decoded.organization_id;
        try {
            const validation = Joivalidation.addDomains(name, category_id);
            if (validation.error) {
                return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
            }

            const chech_domain = await FirewallModel.checkDomainName(name, category_id, organization_id);
            if (chech_domain.length > 0) {
                return sendResponse(res, 400, null, "Domain Name Is Already Exists.", null);
            }
            const add_domain = await FirewallModel.addDomains(name, category_id, organization_id);
            if (add_domain) {
                if (add_domain.affectedRows > 0) {
                    req.body.id = add_domain.insertId;
                    actionsTracker(req,'Firewall domain %i added.', [req.body.id]);
                    return sendResponse(res, 200, req.body, "Domain Added.", null);
                } else {
                    return sendResponse(res, 400, null, "Unable To Add Domain.", null);
                }
            } else {
                return sendResponse(res, 400, null, "Failed To Add Domain.", null);
            }

        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Add Domain.", err);
        }

    }

    async fetchDomains(req, res) {
        const organization_id = req.decoded.organization_id;
        actionsTracker(req,'Firewall domains requested.');
        try {
            const get_domains = await FirewallModel.fetchDomains(organization_id);
            if (get_domains.length > 0) {
                return sendResponse(res, 200, get_domains, "Domains.", null);
            } else {
                return sendResponse(res, 400, null, "Domains Not Found.", null);
            }

        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Get Domains.", err);
        }

    }

    async deleteDomains(req, res) {
        let domain_ids = req.body.domain_ids;
        const organization_id = req.decoded.organization_id;
        try {
            const validation = Joivalidation.deleteDomains(domain_ids);
            if (validation.error) {
                return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
            }
            const delete_domains = await FirewallModel.deleteDomainas(domain_ids);
            if (delete_domains) {
                if (delete_domains.affectedRows > 0) {

                    checkRule(organization_id, domain_ids.toString().split(','), 2);
                    actionsTracker(req,'Firewall domains ? deleted.', [domain_ids]);
                    return sendResponse(res, 200, req.body, "Domains Deleted Successfully.", null);
                } else {
                    return sendResponse(res, 400, null, "Unable To Delete Domains.", null);
                }
            } else {
                return sendResponse(res, 400, null, "Failed To Delete Domains.", null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Delete Domains.", err);
        }

    }

    async UpdateDomains(req, res) {
        let {
            domain_id,
            domain_name,
            categories_id
        } = req.body;
        const organization_id = req.decoded.organization_id;

        try {
            const validation = Joivalidation.UpdateDomain(
                domain_id,
                domain_name,
                categories_id);
            if (validation.error) {
                return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
            }

            const chech_domain = await FirewallModel.checkDomainName(domain_name, categories_id, organization_id);
            if (chech_domain.length > 0) {
                return sendResponse(res, 400, null, "Domain Name Is Already Exists.", null);
            }

            const update_domain = await FirewallModel.updateDomain(domain_name, categories_id, domain_id);
            if (update_domain) {
                if (update_domain.affectedRows > 0) {
                    actionsTracker(req,'Firewall domain %i updated.', [domain_id]);
                    return sendResponse(res, 200, req.body, "Domain Updated Sucessfully.", null)
                } else {
                    return sendResponse(res, 400, null, "Unable To Update Domains.", null);
                }
            } else {
                return sendResponse(res, 400, null, "Failed To Update Domains.", null);
            }
        } catch (err) {
            console.log(err)
            return sendResponse(res, 400, null, "Failed To Update Domains.", err);
        }
    }

    async getCategoryDomain(req, res) {
        const organization_id = req.decoded.organization_id;
        actionsTracker(req,'Firewall categories domains requested.');

        let category_damaions = [];
        try {
            const get_category = await FirewallModel.fetchCategoies(organization_id);
            if (get_category.length > 0) {
                const get_domains = await FirewallModel.getCatecoryDomains(organization_id);
                for (let category of get_category) {
                    let domain_list = get_domains.filter((damain) => {
                        return damain.categories_id == category.id
                    })

                    category_damaions.push(
                        {
                            id: category.id,
                            admin_id: category.admin_id,
                            parent_id: category.parent_id,
                            name: category.name,
                            domain: domain_list
                        })
                }
                return sendResponse(res, 200, category_damaions, "Categories Domains", null);

            } else {
                return sendResponse(res, 400, null, "Categories Domains Not Found.", null);
            }

        } catch (err) {
            return sendResponse(res, 400, null, "Failed To Get Categoty Domains.", err);
        }

    }

    async bulkDomainAdd(req, res) {

        let {
            categories_id,
            domains
        } = req.body;
        const organization_id = req.decoded.organization_id;
        const validation = Joivalidation.bulkDomainAdd(domains, categories_id);
        if (validation.error) {
            return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
        }
        let check_category = await FirewallModel.checkcategory(categories_id, organization_id);
        if (check_category.length == 0) {
            return sendResponse(res, 400, null, "Category Not Found.", null);
        }

        let domain = await FirewallModel.checkBulkDomain(categories_id, domains, organization_id);
        if (domain.length > 0) {

            let message = '';
            domain.map(d => message = message + d.domain_name + ',');
            message = message.substring(0, message.length - 1);
            return sendResponse(res, 400, null, `${message} Domain Already Exists In ${domain[0].categories_name} Category`, null);
        }

        let domain_data = domains.map(domain => [categories_id, domain, organization_id]);
        let inserted_domain = await FirewallModel.addBulkDomain(domain_data);
        if (inserted_domain) {
            if (inserted_domain.affectedRows > 0) {
                let finalData = await FirewallModel.checkBulkDomain(categories_id, domains, organization_id);
                if (finalData.length > 0) {
                    actionsTracker(req,'Firewall domains ? added.', [finalData.map(item => item.domain_id)]);
                    return sendResponse(res, 200, finalData, "Successfully Domain Added.", null);
                }
                return sendResponse(res, 400, null, "Unable To Add Domains.", null);
            } else {
                return sendResponse(res, 401, null, "Unable To Add Domains.", null);
            }
        } else {
            return sendResponse(res, 400, null, "Failed To Add Domains.", null);
        }
    }


    async blockUserDepartmentBlock(req, res) {

        const organization_id = req.decoded.organization_id;

        let entity_type = req.body.entity_type ? req.body.entity_type.toUpperCase() : [];
        let entity_ids = req.body.entity_ids;
        let domain_ids = req.body.domain_ids;
        let category_ids = req.body.category_ids;
        let days_ids = req.body.days_ids;
        const validation = Joivalidation.blockUserDepartmentDomain(entity_type, entity_ids, days_ids, category_ids, domain_ids);
        if (validation.error) {
            return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);
        } else {

            FirewallModel.checkUserDepartmentDomain(organization_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, (err, blockData) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (blockData.length > 0) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Rule Already Exists.',
                        error: null
                    });
                } else {
                    FirewallModel.blockUserDepartmentDomain(organization_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, (err, data) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Database Error.',
                                error: err
                            });
                        } else {
                            actionsTracker(
                                req,'Firewall user and department domains blocked (?).',
                                [{...req.body, id: data.insertId}],
                            );
                            return res.json({
                                code: 200,
                                data: {
                                    ...req.body,
                                    id: data.insertId
                                },
                                message: 'Success.',
                                error: null
                            });
                        }
                    })
                }
            })
        }
    }

    async getBlockedUserDepatment(req, res) {
        const organization_id = req.decoded.organization_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let result = [];
        FirewallModel.getUserDepartmentDomain(skip, limit, organization_id, (err, blockedData) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Database Error.',
                    error: err
                });
            } else if (blockedData.length > 0) {
                async.forEachSeries(blockedData, (element, cb) => {
                    async.parallel([
                        callback => {
                            if (element.entity_type == 'U') {
                                FirewallModel.getUsersDetails(element.entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            } else {
                                FirewallModel.getDepartmentDetails(element.entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            }
                        },
                        callback => {
                            getdaysDetails(element.days_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            FirewallModel.getCategoryDetails(element.category_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            FirewallModel.getDomainDetails(element.domain_ids, (err, data) => {
                                callback(err, data);
                            })
                        }
                    ], (err, finalData) => {
                        if (err) {
                            cb();
                        } else {
                            result.push({
                                blocked_rule_id: element.id,
                                status: element.status,
                                entity_type: element.entity_type,
                                entity_data: finalData[0],
                                days: finalData[1],
                                category: finalData[2],
                                domains: finalData[3]
                            });
                            cb();
                        }
                    })
                }, () => {
                    FirewallModel.getUserDepartmentDomainCount((err, data) => {
                        let total_count = blockedData.length > 0 ? data[0].total_count : 0;
                        let has_more_data = (skip + limit) > total_count ? false : true;

                        actionsTracker(req, 'Firewall user and department blocked data requested.');
                        return res.json({
                            code: 200,
                            data: {
                                blocked_user_data: result,
                                total_count: total_count,
                                has_more_data: has_more_data,
                                skip_value: skip + limit,
                                limit: limit
                            },
                            message: 'User and Department blocked data',
                            error: null
                        });
                    })

                })
            } else {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Blocked Data Not Found.',
                    error: null
                });
            }
        })
    }

    updateUserDepartmentBlockDetailsStatus(req, res) {
        const organization_id = req.decoded.organization_id;
        let {
            rule_data
        } = req.body;

        const validate = Joivalidation.ruleStatusUpdate(rule_data);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });
        async.forEach(rule_data, (e, cb) => {
            FirewallModel.updateUserDepartmentDomainRuleStatus(e.blocked_rule_id, e.status, (err, data) => {
                cb();
                actionsTracker(
                    req, 'Firewall rule %i status !',
                    [e.blocked_rule_id, e.status == 1 ? 'enable' : 'disable']
                );
            });
        }, () => {
            let message = rule_data == 1 ? 'Created Rule Successfully Enable' : 'Created Rule Successfully Disable';
            return res.json({
                code: 200,
                data: req.body,
                message: message,
                err: null
            })
        })
    }

    async deleteUserDepartmentBlockDetails(req, res) {
        const organization_id = req.decoded.organization_id;
        const {blocked_rule_id} = req.body;
        const validate = Joivalidation.blockedIdValidation(blocked_rule_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            FirewallModel.deleteUserDepartmentDomainRule(blocked_rule_id, organization_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (data.affectedRows > 0) {
                    actionsTracker(req, 'Firewall rule %i deleted', [blocked_rule_id]);
                    return res.json({
                        code: 200,
                        data: null,
                        message: 'Successfully Deleted.',
                        error: null
                    });
                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Invalid Input.',
                        error: err
                    });
                }
            })
        }
    }

    async updateUserDepartmentBlockDetails(req, res) {
        const organization_id = req.decoded.organization_id;
        let entity_type = req.body.entity_type.toUpperCase();
        let entity_ids = req.body.entity_ids;
        let domain_ids = req.body.domain_ids;
        let category_ids = req.body.category_ids;
        let days_ids = req.body.days_ids;
        let blocked_rule_id = req.body.blocked_rule_id;
        const validate = Joivalidation.blockUserDepartmentDomainUpdate(entity_type, entity_ids, days_ids, category_ids, domain_ids, blocked_rule_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            FirewallModel.updateUserDepartmentDomainRule(blocked_rule_id, entity_ids.toString(), days_ids.toString(), category_ids.toString(), domain_ids.toString(), (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (data.affectedRows > 0) {
                    actionsTracker(req, 'Firewall rule %i updated', [blocked_rule_id]);
                    return res.json({
                        code: 200,
                        data: req.body,
                        message: 'Successfully Updated.',
                        error: null
                    });
                } else {
                    return res.json({
                        code: 400,
                        data: req.body,
                        message: 'InValid Input.',
                        error: null
                    });
                }
            })
        }
    }

    async domainUploadCSVWithCategory(req, res) {
        try {
            upload(req, res, async (err) => {
                let domains = [];
                let d = [];
                let categories_domains = [];
                if (!req.file) return res.json({
                    code: 400,
                    data: null,
                    message: 'File Not Found.',
                    error: null
                })
                fs.createReadStream(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`)
                    .pipe(csv())
                    .on('data', (row) => {
                        d.push(row);
                        categories_domains.push(row);
                    })
                    .on('end', async () => {
                        fs.unlinkSync(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`);
                        if (!(typeof d[0]["Domain"] !== 'undefined')) return res.json({
                            code: 400,
                            data: null,
                            message: 'Header Keys Are Not Matched.',
                            error: 'Header Keys Are Not Matched.'
                        });
                        if (!(typeof d[0]["Category"] !== 'undefined')) return res.json({
                            code: 400,
                            data: null,
                            message: 'Header Keys Are Not Matched.',
                            error: 'Header Keys Are Not Matched.'
                        });
                        const organization_id = req.decoded.organization_id;
                        const validate = Joivalidation.AddBulkCategoryDomains(categories_domains);

                        if (validate.error) {
                            let error_message = validate.error.details[0].message;
                            if (validate.error.details[0].message == '"Domain" is not allowed to be empty' || validate.error.details[0].message == '"Domain" is required') {
                                error_message = 'Domain is not allowed to be empty'
                            }
                            else if (validate.error.details[0].message == 'Category is not allowed to be empty' || validate.error.details[0].message == '"Category" is required') {
                                error_message = 'Category is not allowed to be empty'
                            }
                            else {
                                let custom_msg = validate.error.details[0].message.match("value(.*)fails");
                                error_message = custom_msg[1].match('"(.*)"')[1] + ' Invalid Domain'
                            }
                            return res.json({
                                code: 404,
                                data: null,
                                message: error_message,
                                error: 'Validation Failed.'
                            })
                        }

                        let insert_list = [];
                        let categories_domains_list = [];

                        _.map(_.groupBy(categories_domains, elem => elem.Category),
                            (vals, key) => {
                                categories_domains_list.push({
                                    Category: key,
                                    Domain: vals
                                });
                            })

                        let nonDuplicatCategory = []
                        for (let cats of categories_domains_list) {
                            nonDuplicatCategory.push({ Category: cats.Category, Domain: cats.Domain.map(dd => dd.Domain) })
                        }
                        let check_duplicate_list = [];
                        for (const non_dupplicte_vals of nonDuplicatCategory) {
                            const get_category_list = await FirewallModel.getCategoriesByName(non_dupplicte_vals.Category, organization_id);
                            if (get_category_list.length > 0) {
                                let check_domain_names = await FirewallModel.checkDomainByNames(get_category_list[0].id, non_dupplicte_vals.Domain, organization_id);
                                if (check_domain_names.length > 0) {

                                    check_duplicate_list.push(check_domain_names);
                                }
                            }
                        }

                        if (check_duplicate_list.length > 0) {

                            return res.json({
                                code: 400,
                                data: check_duplicate_list,
                                message: `Selected Domains Are Already Exists.`,
                                error: null
                            });
                        }
                        for (const categories of categories_domains) {
                            let get_category = await FirewallModel.getCategoriesByName(categories.Category, organization_id);
                            if (get_category.length > 0) {

                                let Add_domain = await FirewallModel.addDomains(categories.Domain, get_category[0].id, organization_id);
                                if (Add_domain) {
                                    if (Add_domain.insertId) {
                                        insert_list.push({ category_id: get_category[0].id, category_name: get_category[0].name, domain_id: Add_domain.insertId, domain_name: categories.Domain })
                                    }
                                }
                            } else {
                                let Insert_category = await FirewallModel.insertCategories(categories.Category, organization_id);
                                if (Insert_category) {
                                    if (Insert_category.insertId) {
                                        let Add_domain = await FirewallModel.addDomains(categories.Domain, Insert_category.insertId, organization_id)
                                        if (Add_domain) {
                                            if (Add_domain.insertId) {
                                                insert_list.push({
                                                    category_id: Insert_category.insertId, category_name: categories.Category
                                                    , domain_id: Add_domain.insertId, domain_name: categories.Domain
                                                })
                                            }

                                        }
                                    }
                                }
                            }
                        }
                        actionsTracker(req, 'Firewall domains ? uploaded.', [insert_list.map(item => item.domain_id)]);
                        return res.json({
                            code: 200,
                            data: insert_list,
                            message: 'Success',
                            error: null
                        });
                    });
            });
        } catch (err) {
            return res.json({
                code: 200,
                data: null,
                message: 'Unable To Add Category',
                error: null
            });
        }
    }


    async changeDomainCategory(req, res) {
        const organization_id = req.decoded.organization_id;

        let {
            domain_name,
            categories_id,
            domain_id
        } = req.body;

        const validate = Joivalidation.updateDomains(domain_name, categories_id, organization_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        FirewallModel.CheckDomain(categories_id, domain_name, organization_id, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Error While Changing Category.',
                    error: err
                });
            } else {
                if (data.length === 0) {
                    FirewallModel.updateDomainCategories(domain_id, categories_id, (err, updatedData) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Error While Changing Category.',
                                error: null
                            });
                        } else if (updatedData.affectedRows > 0) {
                            actionsTracker(
                                req, 'Firewall category %i domain %i name changed.',
                                [categories_id, domain_id]
                            );
                            return res.json({
                                code: 200,
                                data: req.body,
                                message: 'Successfully Updated Domain Category.',
                                error: null
                            });
                        } else {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Invalid Input.',
                                error: null
                            });
                        }
                    });

                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'This Domain Already Exists On New Category.',
                        error: null
                    });
                }
            }
        })
    }

    async UserAndDepartmentDomainUsed(req, res) {
        const organization_id = req.decoded.organization_id;
        let domain_id = req.body.domain_id;
        let categories_id = req.body.categories_id;
        let user_ids = [];
        let department_ids = [];
        actionsTracker(
            req, 'Firewall categories ? domain %i blocked rule requested.',
            [categories_id, domain_id]
        );

        const validate = Joivalidation.UserAndDepartmentDomainUsed(domain_id, categories_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        FirewallModel.getUserDepartmentDomain(0, 2000, organization_id, (err, ruleData) => {
            if (err) {

                return res.json({
                    code: 400,
                    data: null,
                    message: 'Unable To Get User Details.',
                    error: null
                });
            } else {
                async.forEach(ruleData, (rule, cb) => {
                    if (rule.entity_type === 'U' && rule.domain_ids.split(',').includes(`${domain_id}`) && rule.category_ids.split(',').includes(`${categories_id}`)) {
                        user_ids.push(rule.entity_ids);
                    } else if (rule.domain_ids.split(',').includes(`${domain_id}`) && rule.category_ids.split(',').includes(`${categories_id}`)) {
                        department_ids.push(rule.entity_ids);
                    }
                    cb();
                }, () => {
                    async.parallel([
                        callback => {
                            if (user_ids.length > 0) {
                                FirewallModel.userList(organization_id, user_ids, (err, userData) => {
                                    console.log(err, userData, user_ids)
                                    callback(err, userData);
                                })
                            } else {
                                callback(null, null);
                            }
                        },
                        callback => {
                            if (department_ids.length > 0) {
                                FirewallModel.departmentList(organization_id, department_ids, (err, departmentData) => {
                                    callback(err, departmentData);
                                })
                            } else {
                                callback(null, null);
                            }
                        }
                    ], (err, result) => {
                        if (err) {

                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Unable To Get User Details.',
                                error: err
                            });
                        } else {
                            return res.json({
                                code: 200,
                                data: {
                                    user_data: result[0],
                                    department_data: result[1]
                                },
                                message: 'Domain Data',
                                error: null
                            });
                        }
                    })
                })
            }
        });
    }

    async getSingleBlockedUserDepatment(req, res) {
        const {blocked_rule_id} = req.body;
        const validate = Joivalidation.idValidate(blocked_rule_id);

        actionsTracker(req, 'Firewall blocked rule %i requested.', [blocked_rule_id]);

        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            FirewallModel.getSingleUserDepartmentDomain(blocked_rule_id, (err, blockedData) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (blockedData.length > 0) {
                    async.parallel([
                        callback => {
                            if (blockedData[0].entity_type == 'U') {
                                FirewallModel.getUsersDetails(blockedData[0].entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            } else {
                                FirewallModel.getDepartmentDetails(blockedData[0].entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            }
                        },
                        callback => {
                            getdaysDetails(blockedData[0].days_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            FirewallModel.getCategoryDetails(blockedData[0].category_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            FirewallModel.getDomainDetails(blockedData[0].domain_ids, (err, data) => {
                                callback(err, data);
                            })
                        }
                    ], (err, finalData) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Database Error.',
                                error: err
                            });
                        } else {
                            return res.json({
                                code: 200,
                                data: {
                                    entity_data: finalData[0],
                                    days: finalData[1],
                                    category: finalData[2],
                                    domains: finalData[3]
                                },
                                status: blockedData[0].status,
                                message: 'User and Department blocked data',
                                error: null
                            });
                        }
                    })
                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Blocked Data Not Found.',
                        error: null
                    });
                }
            })
        }
    }

    async checkUserAndDepartmentRule(admin_id, element, check) {
        checkRule(admin_id, element.toString().split(','), check)
    }

    async getAllUrls(req, res) {
        try {
            const skip = req.body.skip || 0;
            const limit = req.body.limit || 1000;
            const validate = Joivalidation.skipAndLimit(skip, limit);
            actionsTracker(req, 'Urls list requested.');
            if (validate.error) {
                return res.json({
                    code: 404,
                    data: null,
                    message: 'Validation Failed.',
                    error: validate.error.details[0].message
                });
            }

            const get_urls = await FirewallModel.getURLs(skip, limit);
            if (get_urls.length > 0) {

                let result = get_urls.map(urls => ({ url: urls._id }))
                return res.json({
                    code: 200,
                    data: result,
                    message: 'URL List.',
                    error: null
                });
            }
            else {
                return res.json({
                    code: 400,
                    data: null,
                    message: `No URL's Found.`,
                    error: null
                });
            }
        } catch (err) {
            return res.json({
                code: 400,
                data: null,
                message: `Unable To Get URL`,
                error: null
            });
        }
    }

    async getAppKeyStokes(req, res) {
        const skip = req.body.skip || 0;
        const limit = req.body.limit || 10;
        const validate = Joivalidation.skipAndLimit(skip, limit);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        }
        const get_app_names = await FirewallModel.getAppNames(skip, limit);
        if (get_app_names.length == 0) {
            return res.json({ code: 400, data: null, message: `No App's Found.`, error: null });
        }
        let app_names = get_app_names.map(app => app._id)
        const get_app_keystrokes = await FirewallModel.getAppsKeyStrockes(app_names);
        if (get_app_keystrokes.length > 0) {
            let result = [];
            _.map(_.groupBy(get_app_keystrokes, elem => elem.name),
                (vals, key) => {
                    result.push({
                        name: key,
                        keystrokes: vals
                    });
                })
            return res.json({
                code: 200,
                data: result,
                message: 'Application Keystrokes List.',
                error: null
            });
        }
        else {
            return res.json({
                code: 400,
                data: null,
                message: `No App's Found.`,
                error: null
            });
        }

    }

    async appNames(req, res) {
        try {
            let result;
            const skip = req.body.skip || 0;
            const limit = req.body.limit || 1000;
            actionsTracker(req, 'App names list requested.');

            const validate = Joivalidation.skipAndLimit(skip, limit);
            if (validate.error) {
                return res.json({
                    code: 404,
                    data: null,
                    message: 'Validation Failed.',
                    error: validate.error.details[0].message
                });
            }

            const get_app_names = await FirewallModel.getAppNames(skip, limit);
            if (get_app_names.length == 0) {

                return res.json({ code: 400, data: null, message: `No App's Found.`, error: null });
            } else {
                result = get_app_names.map(app => ({ name: app._id }))
                return res.json({ code: 200, data: { app_names: result, skip_value: skip + limit, skip: skip, limit: limit }, message: `Applications.`, error: null });
            }

        } catch (err) {
            return res.json({ code: 400, data: null, message: `Unable To Get Applocations.`, error: null });
        }
    }

    async getApplicationKeystrokes(req, res) {
        try {
            let result;
            const name = req.body.name;
            const skip = req.body.skip || 0;
            const limit = req.body.limit || 10;
            actionsTracker(req, 'Application keystrokes list requested.');

            const validate = Joivalidation.skipAndLimit(skip, limit);
            if (validate.error) {
                return res.json({
                    code: 404,
                    data: null,
                    message: 'Validation Failed.',
                    error: validate.error.details[0].message
                });
            }

            if (name) {
                const get_app_keystrokes = await FirewallModel.getAppsKeyStrockes2(name, skip, limit);
                if (get_app_keystrokes.length > 0) {
                    result = get_app_keystrokes.map(key => ({ keystrokes: decodeURIComponent(key.keystrokes) }))
                    return res.json({
                        code: 200,
                        data: { name: name, keystrokes: result, skip_value: skip + limit, skip: skip, limit: limit },
                        message: 'Application Keystrokes List.',
                        error: null
                    });
                }
                else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: `No Keystrokes Found.`,
                        error: null
                    });
                }

            } else {
                return res.json({
                    code: 404,
                    data: null,
                    message: 'Validation Failed.',
                    error: 'name Is required'
                });
            }

        } catch (err) {
            console.log(err)
            return res.json({ code: 400, data: null, message: `Unable To Get Applocations Keystrokes.`, error: null });
        }
    }


}
module.exports = new FirewallController;

async function getdaysDetails(days_ids, cb) {
    try {
        let date = [
            {
                day_id: 1,
                name: "Monday"
            },
            {
                day_id: 2,
                name: "Tuesday"
            },
            {
                day_id: 3,
                name: "Wednesday"
            },
            {
                day_id: 4,
                name: "Thursday"
            },
            {
                day_id: 5,
                name: "Friday"
            },

            {
                day_id: 6,
                name: "Saturday"
            },
            {
                day_id: 7,
                name: "Sunday"
            }
        ]

        let days_id = [];
        let ids = days_ids.split(",");
        ids.forEach(d => {
            let day_list = date.find((element) => {
                return element.day_id == d
            })

            days_id.push(day_list)
        })


        cb(null, days_id);
    } catch (err) {

        cb(err, null);
    }
}

async function checkRule(admin_id, element, check) {
    let rules = await FirewallModel.getAllRules(admin_id);

    if (rules.length > 0) {
        async.forEachSeries(rules, (rule, cb) => {
            if (check === 1) { //check for category
                let old_data = rule.category_ids.split(',')
                if (_.intersection(old_data, element).length === 0) {
                    cb();
                } else {
                    old_data = old_data.filter((el) => !element.includes(el));
                    if (old_data.length === 0) {
                        FirewallModel.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        FirewallModel.updateUserDepartmentDomainRule(rule.id, rule.entity_ids, rule.days_ids, old_data.toString(), rule.domain_ids, (err, updated) => {
                            cb();
                        })
                    }
                }
            } else if (check === 2) { //check for domain
                let old_data = rule.domain_ids.split(',')
                if (_.intersection(old_data, element).length === 0) {
                    cb();
                } else {
                    old_data = old_data.filter((el) => !element.includes(el));
                    console.log(old_data.toString());
                    if (old_data.length === 0) {
                        FirewallModel.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        FirewallModel.updateUserDepartmentDomainRule(rule.id, rule.entity_ids, rule.days_ids, rule.category_ids, old_data.toString(), (err, updated) => {
                            cb();
                        })
                    }
                }
            } else if (check === 3 && rule.entity_type == 'U') { //check for user
                let old_data = rule.entity_ids.split(',')
                if (_.intersection(old_data, element).length === 0) {
                    cb();
                } else {
                    old_data = old_data.filter((el) => !element.includes(el));
                    if (old_data.length === 0) {
                        FirewallModel.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        FirewallModel.updateUserDepartmentDomainRule(rule.id, old_data.toString(), rule.days_ids, rule.category_ids, rule.domain_ids, (err, updated) => {
                            cb();
                        })
                    }
                }
            } else if (check === 4 && rule.entity_type == 'D') { //check for department
                let old_data = rule.entity_ids.split(',')
                if (_.intersection(old_data, element).length === 0) {
                    cb();
                } else {
                    old_data = old_data.filter((el) => !element.includes(el));
                    if (old_data.length === 0) {
                        FirewallModel.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        FirewallModel.updateUserDepartmentDomainRule(rule.id, old_data.toString(), rule.days_ids, rule.category_ids, rule.domain_ids, (err, updated) => {
                            cb();
                        })
                    }
                }
            } else {
                cb();
            }
        }, () => {
            return;
        })
    }
}


// (async function () {
//     const get_app_names = await FirewallModel.getAppNames(0, 10);
//     let app_names = get_app_names.map(app => app._id)
//     const get_app_keystrokes = await FirewallModel.getAppsKeyStrockes(app_names);
//     console.log('=======================', get_app_keystrokes)

// decodeURIComponent

// })
    // ()