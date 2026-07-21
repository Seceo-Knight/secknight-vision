const Joi = require('joi');
const { NotificationRulesModel: Rules, NotificationRuleConditionsModel: Conditions } = require('./Models');
const Common = require('../../../utils/helpers/Common');

const processErrors = (validation) => {
    if (!validation.error) return validation;
    const errorMessages = {};
    validation.error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errorMessages[key] = key in errorMessages ? errorMessages[key] : [];
        errorMessages[key].push(detail.message);
    });
    return { ...validation, errorMessages };
};

const conditionSchema = Joi.object().keys({
    type: Joi.string().valid(Object.keys(Conditions.TYPES)).required(),
    cmp_operator: Joi.string().valid(Object.keys(Conditions.CMD_OPERATORS)).required(),
    cmp_argument: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
});

const recipientSchema = Joi.object().keys({
    user_id: Joi.number().required(),
});

const idsSchema = Joi.array().items(Joi.number());
const isAllSchema = Joi.number().allow(1, 0).default(0);

const includedSchema = Joi.object().keys({
    ids: idsSchema,
    departments: idsSchema,
    locations: idsSchema,
    all_employees: isAllSchema,
    all_locations: isAllSchema,
    all_departments: isAllSchema
});

const ruleSchema = Joi.object().keys({
    name: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
        return Common.joiErrorMessage(errors)
    }),
    note: Joi.string().default(''),
    type: Joi.string().valid(Object.keys(Rules.TYPES)).required(),
    risk_level: Joi.string().valid(Object.keys(Rules.RISK_LEVELS)),
    is_multiple_alerts_in_day: Joi.boolean().default(false),
    is_action_notify: Joi.boolean().default(false),
    conditions: Joi.array().items(conditionSchema),
    recipients: Joi.array().items(recipientSchema),
    include_employees: includedSchema.default({}),
    exclude_employees: includedSchema.default({}),
});

const idOnlySchema = Joi.object().keys({
    id: Joi.required().default(0),
});

const sortByEnum = Joi.string().valid(['ASC', 'DESC']).default(undefined);
const sortBy = Joi.object().keys({
    datetime: sortByEnum,
    employee: sortByEnum,
    computer: sortByEnum,
    policy: sortByEnum,
    risk_level: sortByEnum,
    behavior_rule: sortByEnum,
    action: sortByEnum,
});

class Validation {
    static create(params) {
        return processErrors(Joi.validate(params, ruleSchema, { abortEarly: false }));
    }

    static update(params) {
        const schema = ruleSchema.keys({ id: Joi.required() });
        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

    static get(params) {
        return processErrors(Joi.validate(params, idOnlySchema, { abortEarly: false }));
    }

    static delete(params) {
        return processErrors(Joi.validate(params, idOnlySchema, { abortEarly: false }));
    }

    static findBy(params) {
        const schema = Joi.object().keys({
            name: Joi.string().default(undefined),
            sort_by: Joi.string().default(undefined),
            sort_order: Joi.string().valid(['ASC', 'DESC']).default('DESC'),
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(100),
        });
        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

    static alertsFindBy(params) {
        const schema = Joi.object().keys({
            from: Joi.date(),
            to: Joi.date(),
            employee_id: Joi.number().integer().default(undefined),
            non_admin_id: Joi.number().integer().default(undefined),
            department_id: Joi.number().integer().default(undefined),
            location_id: Joi.number().integer().default(undefined),
            search_keyword: Joi.string().default(undefined),
            sort_by: sortBy,
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(100),
        });
        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

    static addAllEmpToRule(params) {
        const schema = Joi.object().keys({
            all_rules: Joi.string().valid('0', '1').required(),
            rule_ids: Joi.array().items(Joi.number().integer()),
        });

        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }
}

module.exports.Validation = Validation;