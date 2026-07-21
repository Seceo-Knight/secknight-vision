const { NotificationRulesModel, NotificationRuleAlertsModel, NotificationRuleToAllEmpModel } = require('./Models');
const { Validation } = require('./Validation');
const sendResponse = require('../../../utils/myService').sendResponse;
const actionsTracker = require('../services/actionsTracker');
const { Model: AppModel } = require('../organization/appNames');
const { commonMessages } = require('../../../utils/helpers/LanguageTranslate');

const ruleDataPrepare = async (organization_id, ruleData) => {
    if ('conditions' in ruleData) {
        const { conditions } = ruleData;
        for (const condition of conditions) {
            switch (condition.type) {
                case 'APP':
                    const app = await AppModel.upsert({ name: condition.cmp_argument, type: 1, organization_id });
                    condition.cmp_argument = app.id;
                    break;
                case 'DMN':
                    const domain = await AppModel.upsert({ name: condition.cmp_argument, type: 2, organization_id });
                    condition.cmp_argument = domain.id;
                    break;
            }
        }
    }
    return ruleData;
};

class Controller {
    static async create(req, res) {
        try {
            const { organization_id, user_id } = req.decoded;

            const validation = Validation.create(req.body);
            if (validation.error) {
                return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
            }
            const dataExist = await NotificationRulesModel.checkSameRuleName(validation.value.name, organization_id)
            if (dataExist.length !== 0) return sendResponse(res, 403, null, 'Alert already exist with same name');
			
            const created = await NotificationRulesModel.create({
                ...(await ruleDataPrepare(organization_id, validation.value)),
                created_by: user_id,
                organization_id,
                updated_by: user_id
            });
            actionsTracker(req, 'Organization notification rule %i created.', [created.insertId]);
            return sendResponse(res, 200, { id: created.insertId }, 'Entity created.', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'Some error occured');
        }
    }

    static async update(req, res) {
        const { organization_id, user_id } = req.decoded;

        const validation = Validation.update(req.body);
        if (validation.error) {
            return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
        }

        const entity = await NotificationRulesModel.getExtended(validation.value.id, organization_id);
        if (!entity) {
            return sendResponse(res, 404, null, 'Not found.');
        }
        if (entity.organization_id != organization_id) {
            return sendResponse(res, 403, null, 'Forbidden');
        }
        await NotificationRulesModel.update(
            validation.value.id,
            await ruleDataPrepare(organization_id, validation.value), user_id
        );

        actionsTracker(req, 'Organization notification rule %i updated.', [entity.id]);
        return sendResponse(res, 200, { id: entity.id }, 'Entity updated.', null);
    }

    static async get(req, res) {
        const organization_id = req.decoded.organization_id;
        const validation = Validation.get(req.query);
        if (validation.error) {
            return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
        }

        const entity = await NotificationRulesModel.getExtended(validation.value.id, organization_id);
        if (!entity) {
            return sendResponse(res, 404, null, 'Not found.');
        }
        if (entity.organization_id != organization_id) {
            return sendResponse(res, 403, null, 'Forbidden');
        }
        actionsTracker(req, 'Organization notification rule %i requested.', [entity.id]);
        return sendResponse(res, 200, entity, 'Entity returned.', null);
    }

    static async delete(req, res) {
        const organization_id = req.decoded.organization_id;
        const validation = Validation.delete(req.body);

        if (validation.error) {
            return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
        }

        const entity = await NotificationRulesModel.getExtended(validation.value.id, organization_id);
        if (!entity) {
            return sendResponse(res, 404, null, 'Not found.');
        }
        if (entity.organization_id != organization_id) {
            return sendResponse(res, 403, null, 'Forbidden');
        }

        await NotificationRulesModel.delete(validation.value.id);
        actionsTracker(req, 'Organization notification rule %i deleted.', [entity.id]);
        return sendResponse(res, 200, { id: entity.id }, 'Entity deleted.', null);
    }

    static async findBy(req, res, next) {
        try {
            const { organization_id, employee_id, user_id } = req.decoded;
            const manager_id = employee_id ? employee_id : null;
            const validation = Validation.findBy(req.query);
            const params = { organization_id };
            if (manager_id) params.created_by = user_id;
            if (validation.error) {
                return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
            }
            const entities = await NotificationRulesModel.findByExtended({ ...validation.value, ...params });
            actionsTracker(req, 'Organization notification rules requested (?).', [validation.value]);
            return sendResponse(res, 200, entities, 'Entities returned.', null);
        } catch (err) {
            next(err);
        }
    }

    static async alertsFindBy(req, res) {
        const { organization_id, employee_id, user_id } = req.decoded;
        const validation = Validation.alertsFindBy(req.query);
        const manager_id = employee_id || validation.value?.non_admin_id ? employee_id || validation.value?.non_admin_id : null;

        if (validation.error) {
            return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
        }

        const entities = await NotificationRuleAlertsModel.findBy({ ...validation.value, organization_id, manager_id, user_id });
        actionsTracker(req, 'Organization notification alerts requested (?).', [validation.value]);
        return sendResponse(res, 200, entities, 'Entities returned.', null);
    }

    static async addAllEmpToRule(req, res) {
        const { organization_id, language = "en" } = req.decoded;
        const validation = Validation.addAllEmpToRule(req.body);

        if (validation.error) {
            return sendResponse(res, 422, null, 'Validation Failed.', validation.errorMessages);
        }

        const data = await NotificationRuleToAllEmpModel.updateRoleToAllEmp(organization_id, validation.value.all_rules, validation.value.rule_ids);

        if (!data) return sendResponse(res, 404, null, 'Rules Not Found.');

        return sendResponse(res, 200, null, commonMessages.find(i => i.id == "5")[language], null);
    }
}

module.exports.Controller = Controller;