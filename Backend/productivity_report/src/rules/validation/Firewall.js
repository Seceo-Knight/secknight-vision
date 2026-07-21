const Joi = require('joi');

class Firewall {

    /**validation for add category */
    addCategory(name) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
        });
        var result = Joi.validate({
            name
        }, schema);
        return result;
    }

    /* Add domaim to category */
    addDomain(name, category_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required().required(),
            category_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            name,
            category_id
        }, schema);
        return result;
    }

    updateDomain(name, category_id, domain_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required().required(),
            category_id: Joi.number().integer().required(),
            domain_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            name,
            category_id,
            domain_id
        }, schema);
        return result;
    }

    bulkDomainAdd(domains, category_id) {
        const schema = Joi.object().keys({
            domains: Joi.array().items(Joi.string().regex(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/i).error(() => 'Invalid Domain')).min(1).error(() => 'Atleast One domain Must Required.'),
            category_id: Joi.number().required()
        });
        var result = Joi.validate({
            domains,
            category_id
        }, schema);
        return result;
    }

    block_user_domain(category_domain_ids, days_ids, user_id) {
        const schema = Joi.object().keys({
            category_domain_ids: Joi.array().items(Joi.object().keys({
                domain_id: Joi.number(),
                category_id: Joi.number(),
            })),
            days_ids: Joi.array().items(Joi.object().keys({
                days_id: Joi.number()
            })),
            user_id: Joi.number().required()
        });
        var result = Joi.validate({
            category_domain_ids,
            days_ids,
            user_id
        }, schema);
        return result;
    }

    block_department_domain(category_domain_ids, days_ids, department_id) {
        const schema = Joi.object().keys({
            category_domain_ids: Joi.array().items(Joi.object().keys({
                domain_id: Joi.number(),
                category_id: Joi.number(),
            })),
            days_ids: Joi.array().items(Joi.object().keys({
                days_id: Joi.number()
            })),
            department_id: Joi.number().required()
        });
        var result = Joi.validate({
            category_domain_ids,
            days_ids,
            department_id
        }, schema);
        return result;
    }

    /** Add IP to whitelist */
    add_ip_whitelist(ip, admin_email) {
        const schema = Joi.object().keys({
            ip: Joi.string().required(),
            admin_email: Joi.string().email({
                minDomainSegments: 2,
                tlds: {
                    allow: ['com', 'net', 'in']
                }
            }).required(),
        });
        var result = Joi.validate({
            ip,
            admin_email
        }, schema);
        return result;

    }

    /** Delete ip from whitelist */
    delete_ip_whitelist(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }

    /**Edit IP whitelist */
    edit_ip(id, ip) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
            ip: Joi.string().required(),
        });
        var result = Joi.validate({
            id,
            ip
        }, schema);
        return result;
    }

    getDomainsByCatId(category_id) {
        const schema = Joi.object().keys({
            category_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            category_id
        }, schema);
        return result;
    }

    blockUserDepartmentDomain(entity_type, entity_ids, days_ids, category_ids, domain_ids) {
        const schema = Joi.object().keys({
            entity_type: Joi.string().required(),
            entity_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Entity ids must be a valid.'),
            days_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Days ids must be a valid.'),
            category_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Category ids must be a valid.'),
            domain_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Domain ids must be a valid.'),
            blocked_rule_id: Joi.number()
        });
        var result = Joi.validate({
            entity_type,
            entity_ids,
            days_ids,
            category_ids,
            domain_ids
        }, schema);
        return result;
    }
    blockUserDepartmentDomainUpdate(entity_type, entity_ids, days_ids, category_ids, domain_ids, blocked_rule_id) {
        const schema = Joi.object().keys({
            entity_type: Joi.string().required(),
            entity_ids: Joi.array().items(Joi.number()).min(1),
            days_ids: Joi.array().items(Joi.number()).min(1),
            category_ids: Joi.array().items(Joi.number()).min(1),
            domain_ids: Joi.array().items(Joi.number()).min(1),
            blocked_rule_id: Joi.number().required()
        });
        var result = Joi.validate({
            entity_type,
            entity_ids,
            days_ids,
            category_ids,
            domain_ids,
            blocked_rule_id
        }, schema);
        return result;
    }

    idValidate(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }

    UserAndDepartmentDomainUsed(domain_id, categories_id) {
        const schema = Joi.object().keys({
            domain_id: Joi.number().required(),
            categories_id: Joi.number().required(),
        });
        var result = Joi.validate({
            domain_id,
            categories_id
        }, schema);
        return result;
    }

    blockedIdValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One Rule Must Required'),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }

    ruleStatusUpdate(rule_data) {
        const schema = Joi.object().keys({
            rule_data: Joi.array().items(Joi.object({
                blocked_rule_id: Joi.number().required(),
                status: Joi.number().required()
            })).required().min(1),
        });
        var result = Joi.validate({
            rule_data
        }, schema);
        return result;
    }

    domainSearch(name) {
        const schema = Joi.object().keys({
            name: Joi.string().min(3).required().error(() => 'Minimum Three Charecter Required.'),
        });
        var result = Joi.validate({
            name
        }, schema);
        return result;
    }

    AddBulkCategoryDomains(data) {
        const schema = Joi.object().keys({
            data: Joi.array()
            .items({
                Domain: Joi.string().regex(/^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i)
                .required(),
                Category : Joi.string()
                .required().error(() => 'Category is not allowed to be empty'),
            })
        });
        var result = Joi.validate({
            data
        }, schema);
        return result;
    }
    

}

module.exports = new Firewall;



