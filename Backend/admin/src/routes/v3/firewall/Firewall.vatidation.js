const Joi = require('joi');


class FirewallValidation {
    addCategory(name) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
        });
        var result = Joi.validate({
            name
        }, schema);
        return result;
    }

    updateCategory(name, category_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            category_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            name, category_id
        }, schema);
        return result;
    }

    deleteCategory(category_id) {
        const schema = Joi.object().keys({
            category_id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One Category Id Required'),
        });
        var result = Joi.validate({ category_id }, schema);
        return result;
    }

    addDomains(name, category_id) {
        const schema = Joi.object().keys({
            name: Joi.string()
                .regex(/^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i)
                .required().error(() => 'Invalid Domain'),
            category_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            name, category_id
        }, schema);
        return result;
    }

    deleteDomains(domain_ids) {
        const schema = Joi.object().keys({
            domain_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One Domain Required'),
        });
        var result = Joi.validate({
            domain_ids
        }, schema);
        return result;
    }

    UpdateDomain(domain_id, domain_name, categories_id) {
        const schema = Joi.object().keys({
            domain_name: Joi.string().regex(/^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i)
                .required().error(() => 'Invalid Domain'),
            categories_id: Joi.number().integer().required(),
            domain_id: Joi.number().integer().required(),

        });
        var result = Joi.validate({
            domain_id, domain_name, categories_id
        }, schema);
        return result;
    }

    bulkDomainAdd(domains, category_id) {
        const schema = Joi.object().keys({
            domains: Joi.array().items(Joi.string().regex(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/i).error(() => 'Invalid Domain')).required().min(1).error(() => 'Atleast One domain Must Required.'),
            category_id: Joi.number().required()
        });
        var result = Joi.validate({
            domains,
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

    blockedIdValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One Rule Must Required'),
        });
        var result = Joi.validate({
            id
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

    AddBulkCategoryDomains(data) {
        const schema = Joi.object().keys({
            data: Joi.array()
                .items({
                    Domain: Joi.string().regex(/^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i)
                        .required(),
                    Category: Joi.string()
                        .required().error(() => 'Category is not allowed to be empty'),
                })
        });
        var result = Joi.validate({
            data
        }, schema);
        return result;
    }
    updateDomains(name, category_id, domain_id) {
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


    idValidate(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }

    urlValidation(url) {
        const schema = Joi.object().keys({
            url: Joi.string().uri().required(),
        });
        var result = Joi.validate({
            url
        }, schema);
        return result;
    }

    skipAndLimit(skip, limit) {
        const schema = Joi.object().keys({
            skip: Joi.number(),
            limit: Joi.number(),
        });
        var result = Joi.validate({
            skip, limit
        }, schema);
        return result;
    }


}
module.exports = new FirewallValidation;