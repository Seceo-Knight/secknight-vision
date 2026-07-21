'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);
const async = require('async');
const _ = require('underscore');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');


const upload = multer({
    dest: __dirname.split('src')[0] + 'public',
    filename: function (req, file, callback) {
        callback(null, file.filename + '.csv')
    }
}).single('file');

const Firewall = require('../shared/Firewall');
const validator = require("email-validator");
var validateIP = require('validate-ip-node');
const Joivalidation = require('../../rules/validation/Firewall');

class FirewallService {

    /**
     * Add new category
     * @function addCategory
     * @param {*} req
     * @param {*} res
     * @returns {object}-Success message or error 
     * @memberof FirewallService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_add_category }
     */
    addCategory(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let name = req.body.name
        const validate = Joivalidation.addCategory(name);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {

            Firewall.addCategory(name, admin_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Failed To Category Insert.',
                        error: err
                    })
                } else if (data.affectedRows === 0) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Category Alraedy Exists.',
                        error: null
                    })
                } else {
                    req.body.category_id = data.insertId
                    return res.json({
                        code: 200,
                        data: req.body,
                        message: 'New Category Added.',
                        error: null
                    })
                }
            })
        }
    }

    /**
     * Add days 
     * @function addDays
     * @param {*} req
     * @param {*} res
     * @returns {object}-Success message or error 
     * @memberof FirewallService
     */
    addDays(req, res) {
        Firewall.addDays((err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Failed To  Insert Days.',
                    error: err
                })
            } else {
                return res.json({
                    code: 200,
                    data: data,
                    message: 'New Record Added.',
                    error: null
                })
            }
        })

    }

    /**
     * Get days  
     * @function addDays
     * @param {*} req
     * @param {*} res
     * @returns {object}- days data or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/get_get_days }
     */
    getDays(req, res) {
        Firewall.getDays((err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Failed To Fetch Days.',
                    error: err
                })
            } else {
                return res.json({
                    code: 200,
                    data: data,
                    message: 'Success.',
                    error: null
                })
            }
        })
    }

    /**
     * Add domains to categories  
     * @function addDomain
     * @param {*} req
     * @param {*} res
     * @returns {object}- Succaes message or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_add_domain }
     */
    addDomain(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let category_id = req.body.category_id;
        let name = req.body.name
        const validate = Joivalidation.addDomain(name, category_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            Firewall.CheckDomain(category_id, name, admin_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Unable To Add Domain.',
                        error: err
                    })
                } else if (data.length === 0) {
                    Firewall.addDomain(category_id, name, admin_id, (err, data) => {

                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Unable To Add Domain.',
                                error: err
                            })
                        } else {
                            req.body.id = data.insertId;
                            return res.json({
                                code: 200,
                                data: req.body,
                                message: 'Domain Added.',
                                error: null
                            })
                        }
                    })
                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Domain Already exists.',
                        error: null
                    })
                }
            })

        }
    }

    async updateDomain(req, res) {
        let {
            domain_id,
            domain_name,
            categories_id
        } = req.body;
        let admin_id = req['decoded'].jsonData.admin_id;

        const validate = Joivalidation.updateDomain(domain_name, categories_id, domain_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        let domain = await Firewall.checkDomainAlreadyexists(domain_id, domain_name, categories_id, admin_id);
        if (!domain) return res.json({
            code: 400,
            data: null,
            message: 'Unable To Update Domain Name.',
            error: 'Error while updating'
        });

        if (domain.length > 0) return res.json({
            code: 400,
            data: null,
            message: 'Domain Already Exists.',
            error: null
        });

        let updated_domain = await Firewall.updateDomain(domain_id, categories_id, domain_name);
        if (!updated_domain) return res.json({
            code: 400,
            data: null,
            message: 'Unable To Update Domain.',
            error: null
        });

        if (updated_domain.affectedRows > 0) return res.json({
            code: 200,
            data: req.body,
            message: 'Successfully Domain Updated.',
            error: null
        });
        return res.json({
            code: 400,
            data: null,
            message: 'Invalid Input.',
            error: null
        });
    }

    async bulkDomainAdd(req, res) {

        let {
            categories_id,
            domains
        } = req.body;
        let admin_id = req['decoded'].jsonData.admin_id;

        const validate = Joivalidation.bulkDomainAdd(domains, categories_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        let domain = await Firewall.checkBulkDomain(categories_id, domains, admin_id);

        if (!domain) return res.json({
            code: 400,
            data: null,
            message: 'Unable To Add Domain',
            error: null
        });

        let message = '';
        domain.map(d => message = message + d.domain_name + ',');
        message = message.substring(0, message.length - 1);

        if (domain.length > 0) return res.json({
            code: 400,
            data: null,
            message: `${message} Domain Already Exists In ${domain[0].categories_name} Category`,
            error: null
        });

        let domain_data = domains.map(domain => [categories_id, domain, admin_id]);
        let inserted_domain = await Firewall.addBulkDomain(domain_data);
        if (!inserted_domain) return res.json({
            code: 400,
            data: null,
            message: 'Unable To Add Domain',
            error: null
        });

        let finalData = await Firewall.checkBulkDomain(categories_id, domains, admin_id);
        if (!finalData) return res.json({
            code: 400,
            data: null,
            message: 'Unable To Add Domain',
            error: null
        });
        return res.json({
            code: 200,
            data: finalData,
            message: 'Successfully Domain Added.',
            error: null
        });
    }


    /**
     * Get categories with domain 
     * @function getCategoryAndDomainData
     * @param {*} req
     * @param {*} res
     * @returns {object}- categories with domains or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/get_get_category_domains }
     */
    getCategoryAndDomainData(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        Firewall.getCategory(admin_id, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Failed To Get Category.',
                    error: err
                });
            } else {
                if (data.length > 0) {
                    async.forEachSeries(data, (category, cb) => {
                        Firewall.getDomain(category.id, (err, domains) => {
                            if (err) {
                                cb();
                            } else {
                                category.domain = domains;
                                cb();
                            }
                        })
                    }, () => res.json({
                        code: 200,
                        data: data,
                        message: 'Categories Data.',
                        error: null
                    }))
                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Category Not Found.',
                        error: err
                    });
                }
            }
        })
    }

    /**
     * get all categories
     * @function getCategory
     * @param {*} req
     * @param {*} res
     * @returns {object}- categories list or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/get_get_category }
     */
    getCategory(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        Firewall.getCategory(admin_id, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Failed To Get Category.',
                    error: err
                });
            } else if (data.length > 0) {
                return res.json({
                    code: 200,
                    data: data,
                    message: 'Success.',
                    error: null
                });
            } else {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Category Not Found.',
                    error: null
                });
            }
        })
    }


    /**
     * Get domains by category 
     * @function getDomainsByCatId
     * @param {*} req
     * @param {*} res
     * @returns {object}-  domains list or error 
     * @memberof FirewallService
     */
    getDomainsByCatId(req, res) {
        let catId = req.body.catId;
        const validate = Joivalidation.getDomainsByCatId(catId);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            let catIdArray = catId.replace(/, +/g, ",").split(",").map(Number);
            Firewall.getDomains(catIdArray, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Error While Fetching Domins.',
                        error: err
                    })
                } else {
                    return res.json({
                        code: 200,
                        data: data,
                        message: 'Success.',
                        error: null
                    })
                }
            })
        }

    }

    async getblockedUserDomains_old(req, res) {
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        const {
            error,
            data
        } = await Firewall.getblockedUserDomains(skip, limit);
        if (error) {
            return res.json({
                code: 400,
                data: null,
                message: 'Database Error Occurred.',
                error: error
            })
        } else if (data.length > 0) {
            return res.json({
                code: 200,
                data: data,
                message: 'Success.',
                error: null
            });
        } else {
            return res.json({
                code: 400,
                data: null,
                message: 'User Blocked Domain Data Not Found.',
                error: null
            });
        }
    }

    /**
     * Adding IP's to white list
     * @function addIpWhiteList
     * @param {*} req
     * @param {*} res
     * @returns {object}-  Success message or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_add_ip_whitelist }
     */
    addIpWhiteList(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let ip = req.body.ip;
        let admin_email = req['decoded'].jsonData.email;
        const validate = Joivalidation.add_ip_whitelist(ip, admin_email);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            let is_valid_ip = validateIP(ip);
            if (!is_valid_ip) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'IP Validation Failed.',
                    error: null
                });
            }
            var validEmail = validator.validate(admin_email);
            if (!validEmail) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Email Validation Failed.',
                    error: null
                });
            }
            Firewall.whitelist_ips(ip, admin_id, (err, ip_data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Error While Inserting IP.',
                        error: err
                    })
                } else {
                    if (ip_data.length > 0) {
                        return res.json({
                            code: 400,
                            data: null,
                            message: 'This Ip Is Already Added.',
                            error: 'Already Blocked.'
                        })
                    } else {
                        Firewall.add_ip_whitelist(ip, admin_email, admin_id, (err, data) => {
                            if (err) {
                                return res.json({
                                    code: 400,
                                    data: null,
                                    message: 'Database error ',
                                    error: err
                                })
                            } else {
                                req.body.id = data.insertId
                                return res.json({
                                    code: 200,
                                    data: req.body,
                                    message: 'IP Inserted Successfully.',
                                    error: null
                                })
                            }
                        })
                    }
                }
            })

        }
    }

    /**
     *  get all whitelist IP
     * @function getWhiteListIps
     * @param {*} req
     * @param {*} res
     * @returns {object}-  Whitelist IP list or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_get_ip_whitelist}
     */
    getWhiteListIps(req, res) {
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let admin_id = req['decoded'].jsonData.admin_id;
        Firewall.get_whitelist_ips(skip, limit, admin_id, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Error While Fetching Whitelist IPs.',
                    error: err
                })
            } else if (data.length > 0) {
                let total_count = data[0].total_count;
                let has_more_data = (skip + limit) > total_count ? false : true;
                data.map(e => delete e.total_count);
                return res.json({
                    code: 200,
                    data: {
                        total_count: total_count,
                        whitelist_ips: data,
                        has_more_data: has_more_data
                    },
                    message: 'Whitelist IP',
                    error: null
                })
            } else {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Whitelist IP Data Not Found.',
                    error: null
                })
            }
        })
    }

    /**
     *   Delete whitelist ips 
     * @function deleteIpFromWhitelist
     * @param {*} req
     * @param {*} res
     * @returns {object}-  success message or error 
     * @memberof FirewallService
     * @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_delete_ip_whitelist }
     */
    deleteIpFromWhitelist(req, res) {
        let ip_id = req.body.ip_id;
        const validate = Joivalidation.delete_ip_whitelist(ip_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            Firewall.delete_whitelist_ip(ip_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Databse Error.',
                        error: err
                    })
                } else if (data.affectedRows > 0) {
                    return res.json({
                        code: 200,
                        data: null,
                        message: 'Whitelist IP Deleted Successfully.',
                        error: null
                    })
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

    /**
     *  Edit ips from whitelist 
     * @function editWhitelistIp
     * @param {*} req
     * @param {*} res
     * @returns {object}-  success message or error 
     * @memberof FirewallService
     * @see also { @link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_edit_ip_whitelist }
     */
    editWhitelistIp(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let ip_id = req.body.ip_id;
        let ip = req.body.ip;
        const validate = Joivalidation.delete_ip_whitelist(ip_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {

            let is_valid_ip = validateIP(ip);
            if (!is_valid_ip) {
                return res.json({
                    code: 404,
                    data: null,
                    message: 'IP Validation Failed.',
                    error: null
                });
            }
            Firewall.whitelist_ips(ip, admin_id, (err, ip_data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Error While Editing Whitelist IPs.',
                        error: err
                    })
                } else if (ip_data.length > 0) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'This IP Is Already Added.',
                        error: null
                    })
                } else {
                    Firewall.edit_whitelist_ip(ip_id, ip, (err, data) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Database Error.',
                                error: err
                            })
                        } else {
                            return res.json({
                                code: 200,
                                data: req.body,
                                message: 'Whitelist Ip Edited Successfully.',
                                error: null
                            })
                        }
                    })
                }
            })
        }
    }

    /**
     *   Search whitelist ip
     * @function SearchWhitelistIp
     * @param {*} req
     * @param {*} res
     * @returns {object}-  Whitelist IP or error 
     * @memberof FirewallService
     * @see also { @link https://admin.empmonitor.com/api/v1/explorer/#/Firewall/post_search_ip_whitelist }
     */
    searchWhitelistIp(req, res) {
        let ip = req.body.ip;
        let admin_id = req['decoded'].jsonData.admin_id;
        if (ip) {
            Firewall.whitelist_ips(ip, admin_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 404,
                        data: null,
                        message: 'Error While Search Whitelist IPs.',
                        error: err
                    })
                } else {
                    if (data.length > 0) {
                        return res.json({
                            code: 200,
                            data: data,
                            message: ' Whitelist IP.',
                            error: null
                        })
                    } else {
                        return res.json({
                            code: 200,
                            data: null,
                            message: 'IP Not Found.',
                            error: null
                        })
                    }
                }
            })
        } else {
            return res.json({
                code: 400,
                data: null,
                message: 'Field Is Missing.',
                error: null
            })
        }

    }


    /**
     * Blocks Domains or Category Based On Department or User
     * @async
     * @function blockUserDepartmentBlock
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async blockUserDepartmentBlock(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let entity_type = req.body.entity_type ? req.body.entity_type.toUpperCase() : [];
        let entity_ids = req.body.entity_ids;
        let domain_ids = req.body.domain_ids;
        let category_ids = req.body.category_ids;
        let days_ids = req.body.days_ids;
        const validate = Joivalidation.blockUserDepartmentDomain(entity_type, entity_ids, days_ids, category_ids, domain_ids);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            Firewall.checkUserDepartmentDomain(admin_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, (err, blockData) => {
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
                    Firewall.blockUserDepartmentDomain(admin_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, (err, data) => {
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

    /**
     * Get user and department block details
     * @async
     * @function getUserDepartmentBlockDetails
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async getBlockedUserDepatment(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 10;
        let result = [];
        Firewall.getUserDepartmentDomain(skip, limit, admin_id, (err, blockedData) => {
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
                                Firewall.getUsersDetails(element.entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            } else {
                                Firewall.getDepartmentDetails(element.entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            }
                        },
                        callback => {
                            Firewall.getdaysDetails(element.days_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            Firewall.getCategoryDetails(element.category_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            Firewall.getDomainDetails(element.domain_ids, (err, data) => {
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
                    Firewall.getUserDepartmentDomainCount((err, data) => {
                        let total_count = blockedData.length > 0 ? data[0].total_count : 0;
                        let has_more_data = (skip + limit) > total_count ? false : true;
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

    /**
     * Update user and department block details
     * @async
     * @function updateUserDepartmentBlockDetails
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async updateUserDepartmentBlockDetails(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
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
            Firewall.updateUserDepartmentDomainRule(blocked_rule_id, entity_ids.toString(), days_ids.toString(), category_ids.toString(), domain_ids.toString(), (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (data.affectedRows > 0) {
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

    updateUserDepartmentBlockDetailsStatus(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
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
            Firewall.updateUserDepartmentDomainRuleStatus(e.blocked_rule_id, e.status, (err, data) => {
                cb();
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

    /**
     * Delete user and department block details
     * @async
     * @function deleteUserDepartmentBlockDetails
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async deleteUserDepartmentBlockDetails(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        const validate = Joivalidation.blockedIdValidation(req.body.blocked_rule_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            Firewall.deleteUserDepartmentDomainRule(req.body.blocked_rule_id, admin_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (data.affectedRows > 0) {
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

    /**
     * Get single user and department block details
     * @async
     * @function getSingleUserDepartmentBlockDetails
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async getSingleBlockedUserDepatment(req, res) {
        const validate = Joivalidation.idValidate(req.body.blocked_rule_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        } else {
            Firewall.getSingleUserDepartmentDomain(req.body.blocked_rule_id, (err, blockedData) => {
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
                                Firewall.getUsersDetails(blockedData[0].entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            } else {
                                Firewall.getDepartmentDetails(blockedData[0].entity_ids, (err, data) => {
                                    callback(err, data);
                                })
                            }
                        },
                        callback => {
                            Firewall.getdaysDetails(blockedData[0].days_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            Firewall.getCategoryDetails(blockedData[0].category_ids, (err, data) => {
                                callback(err, data);
                            })
                        },
                        callback => {
                            Firewall.getDomainDetails(blockedData[0].domain_ids, (err, data) => {
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

    /**
     * update category details
     * @async
     * @function updateCategory
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async updateCategory(req, res) {
        let {
            category_id,
            name
        } = req.body;
        let admin_id = req['decoded'].jsonData.admin_id;

        const validate = Joivalidation.addDomain(name, category_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        Firewall.getCategoryByName(name, admin_id, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Database Error.',
                    error: err
                });
            } else if (data.length === 0) {
                Firewall.updateCategory(category_id, name, (err, updatedData) => {
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
                            data: req.body,
                            message: 'Category Successfully Updated.',
                            error: null
                        });
                    }
                })
            } else {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Category Already Exists.',
                    error: 'Category Already Exists Error.'
                });
            }
        })
    }

    /**
     * delete category details
     * @async
     * @function deleteCategory
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof FirewallService
     */
    async deleteCategory(req, res) {
        let category_id = req.body.category_id;
        let admin_id = req['decoded'].jsonData.admin_id;

        const validate = Joivalidation.blockedIdValidation(category_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });
        Firewall.getAllDomains(category_id, (err, domainData) => {
            let new_array = [];
            domainData.map(el => new_array.push(el.id));
            Firewall.deleteCategory(category_id, admin_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Database Error.',
                        error: err
                    });
                } else if (data.affectedRows > 0) {
                    checkRule(admin_id, category_id.toString().split(','), 1);
                    checkRule(admin_id, new_array.toString().split(','), 2);
                    return res.json({
                        code: 200,
                        data: req.body,
                        message: 'Category Successfully Deleted.',
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
        })
    }

    async domainSearch(req, res) {
        let name = req.body.name;
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 10;
        let admin_id = req['decoded'].jsonData.admin_id;

        const validate = Joivalidation.domainSearch(name);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        let domains = await Firewall.domainSearch(name, admin_id, skip, limit);
        if (!domains) return res.json({
            code: 400,
            data: null,
            message: 'Unable to get domains',
            err: null
        });

        if (domains.length === 0) return res.json({
            code: 400,
            data: null,
            message: 'Domains Not Found.',
            error: null
        });

        let total_count = domains.length > 0 ? domains[0].total_count : 0;
        let has_more_data = (skip + limit) > total_count ? false : true;
        domains.map(e => delete e.total_count);
        return res.json({
            code: 200,
            data: {
                domain_data: domains,
                total_count: total_count,
                has_more_data: has_more_data,
                skip_value: skip + limit,
                limit: limit
            },
            message: 'User data',
            error: null
        });

    }

    async UserAndDepartmentDomainUsed(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let domain_id = req.body.domain_id;
        let categories_id = req.body.categories_id;
        let user_ids = [];
        let department_ids = [];

        const validate = Joivalidation.UserAndDepartmentDomainUsed(domain_id, categories_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        Firewall.getUserDepartmentDomain(0, 2000, admin_id, (err, ruleData) => {
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
                                Firewall.userList(admin_id, user_ids, (err, userData) => {
                                    callback(err, userData);
                                })
                            } else {
                                callback(null, null);
                            }
                        },
                        callback => {
                            if (department_ids.length > 0) {
                                Firewall.departmentList(admin_id, department_ids, (err, departmentData) => {
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
                                error: null
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
    async domain(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;

        let domain = await Firewall.domain(admin_id);
        if (!domain) return res.json({
            code: 400,
            data: null,
            message: 'Domain Not Found',
            error: null
        });
        return res.json({
            code: 200,
            data: domain,
            message: 'Domain Data.',
            error: null
        });
    }


    async deleteDomains(req, res) {

        let admin_id = req['decoded'].jsonData.admin_id;

        let domain_ids = req.body.domain_ids;
        const validate = Joivalidation.blockedIdValidation(domain_ids);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });
        // domain_ids = domain_ids.toString();
        let delete_domains = await Firewall.deleteDomains(domain_ids, admin_id)
        if (!delete_domains) return res.json({
            code: 400,
            data: null,
            message: 'Domains Not Found',
            error: null
        });
        checkRule(admin_id, domain_ids.toString().split(','), 2);
        return res.json({
            code: 200,
            data: domain_ids,
            message: 'Domains Deleted Successfully .',
            error: null
        });

    }

    async changeDomainCategory(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let {
            domain_name,
            categories_id,
            domain_id
        } = req.body;

        const validate = Joivalidation.updateDomain(domain_name, categories_id, domain_id);
        if (validate.error) return res.json({
            code: 404,
            data: null,
            message: 'Validation Failed.',
            error: validate.error.details[0].message
        });

        Firewall.CheckDomain(categories_id, domain_name, admin_id, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Error While Changing Category.',
                    error: null
                });
            } else {
                if (data.length === 0) {
                    Firewall.updateDomainCategory(domain_id, categories_id, (err, updatedData) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Error While Changing Category.',
                                error: null
                            });
                        } else if (updatedData.affectedRows > 0) {
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

    async domainUploadCSV(req, res) {
        upload(req, res, function (err) {
            let domains = [];
            let d = [];
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
                    domains.push(row.Domain);
                })
                .on('end', () => {
                    fs.unlinkSync(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`);
                    if (!(typeof d[0]["Domain"] !== 'undefined')) return res.json({
                        code: 400,
                        data: null,
                        message: 'Domain Header Key Not Matched.',
                        error: 'Domain Header Key Not Matched.'
                    });
                    let admin_id = req['decoded'].jsonData.admin_id;
                    let categories_id = req.query.categories_id;

                    const validate = Joivalidation.bulkDomainAdd(domains, categories_id);
                    if (validate.error) return res.json({
                        code: 404,
                        data: null,
                        message: 'Validation Failed.',
                        error: validate.error.details[0].message
                    });

                    Firewall.checkBulkDomainFile(categories_id, domains, admin_id, (err, domain) => {
                        if (err) return res.json({
                            code: 400,
                            data: null,
                            message: 'Unable To Add Domain',
                            error: null
                        });

                        let message = '';
                        domain.map(d => message = message + d.domain_name + ',');
                        message = message.substring(0, message.length - 1);

                        if (domain.length > 0) return res.json({
                            code: 400,
                            data: null,
                            message: `${message} Domain Already Exists In ${domain[0].categories_name} Category`,
                            error: null
                        });
                        let domain_data = domains.map(domain => [categories_id, domain, admin_id]);
                        Firewall.addBulkDomainFile(domain_data, (err, inserted_domain) => {
                            if (err) return res.json({
                                code: 400,
                                data: null,
                                message: 'Unable To Add Domain',
                                error: null
                            });
                            Firewall.checkBulkDomainFile(categories_id, domains, admin_id, (err, finalData) => {
                                if (err) return res.json({
                                    code: 400,
                                    data: null,
                                    message: 'Unable To Add Domain',
                                    error: null
                                });
                                return res.json({
                                    code: 200,
                                    data: finalData,
                                    message: 'Successfully Domain Added.',
                                    error: null
                                });
                            });

                        });
                    });
                });
        });
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
                        let admin_id = req['decoded'].jsonData.admin_id;
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
                            const get_category_list = await Firewall.getCategoriesByName(non_dupplicte_vals.Category, admin_id);
                            if (get_category_list.length > 0) {
                                let check_domain_names = await Firewall.checkDomainByNames(get_category_list[0].id, non_dupplicte_vals.Domain, admin_id);
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
                            let get_category = await Firewall.getCategoriesByName(categories.Category, admin_id);
                            if (get_category.length > 0) {
                                let Add_domain = await Firewall.addNewDomaim(get_category[0].id, categories.Domain, admin_id);
                                if (Add_domain) {
                                    if (Add_domain.insertId) {
                                        insert_list.push({ category_id: get_category[0].id, category_name: get_category[0].name, domain_id: Add_domain.insertId, domain_name: categories.Domain })
                                    }
                                }
                            } else {
                                let Insert_category = await Firewall.insertCategories(categories.Category, admin_id);
                                if (Insert_category) {
                                    if (Insert_category.insertId) {
                                        let Add_domain = await Firewall.addNewDomaim(Insert_category.insertId, categories.Domain, admin_id)
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

    async checkUserAndDepartmentRule(admin_id, element, check) {
        checkRule(admin_id, element.toString().split(','), check)
    }
}


module.exports = new FirewallService;


async function checkRule(admin_id, element, check) {
    let rules = await Firewall.getAllRules(admin_id);
    if (rules.length > 0) {
        async.forEachSeries(rules, (rule, cb) => {
            if (check === 1) { //check for category
                let old_data = rule.category_ids.split(',')
                if (_.intersection(old_data, element).length === 0) {
                    cb();
                } else {
                    old_data = old_data.filter((el) => !element.includes(el));
                    if (old_data.length === 0) {
                        Firewall.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        Firewall.updateUserDepartmentDomainRule(rule.id, rule.entity_ids, rule.days_ids, old_data.toString(), rule.domain_ids, (err, updated) => {
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
                        Firewall.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        Firewall.updateUserDepartmentDomainRule(rule.id, rule.entity_ids, rule.days_ids, rule.category_ids, old_data.toString(), (err, updated) => {
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
                    console.log(old_data.toString());
                    if (old_data.length === 0) {
                        Firewall.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        Firewall.updateUserDepartmentDomainRule(rule.id, old_data.toString(), rule.days_ids, rule.category_ids, rule.domain_ids, (err, updated) => {
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
                    console.log(old_data.toString());
                    if (old_data.length === 0) {
                        Firewall.deleteUserDepartmentDomainRule(rule.id, admin_id, (err, deleted) => {
                            cb();
                        })
                    } else {
                        Firewall.updateUserDepartmentDomainRule(rule.id, old_data.toString(), rule.days_ids, rule.category_ids, rule.domain_ids, (err, updated) => {
                            cb();
                        })
                    }
                }
            } else {
                cb();
            }
        }, () => {
            console.log('=================rule modification done=============');
            return;
        })
    }
}



// let data='"Domain" with value "matadoc@#$%%.com" fails to match the required pattern: /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i'


// var test = "My cow always gives milk";

// var testRE = data.match("value(.*)fails");
// console.log(testRE,'================')