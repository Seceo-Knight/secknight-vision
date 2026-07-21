const mySql = require('../../../../database/MySqlConnection').getInstance();

class NotificationRuleToAllEmpModel {

    static allRules(organization_id) {
        const query = `SELECT id FROM notification_rules ` +
            `WHERE organization_id = ?`;

        return mySql.query(query, [organization_id]);
    }

    static getAllEmpIDs(organization_id) {
        const query = `SELECT id FROM employees ` +
            `WHERE organization_id = ?`;

        return mySql.query(query, [organization_id]);
    }

    static checkRules(organization_id, ruleIDs) {
        const query = `SELECT include_employees FROM notification_rules `
            + `WHERE organization_id = ${organization_id} `
            + `AND id IN(?)`;

        return mySql.query(query, [ruleIDs]);
    }

    static getRule(organization_id, ruleID) {
        const query = `SELECT include_employees FROM notification_rules `
            + `WHERE organization_id = ? `
            + `AND id = ?`;

        return mySql.query(query, [organization_id, ruleID]);
    }

    static updateRule(data, ruleID) {
        const query = `UPDATE notification_rules ` +
            `SET include_employees = '${data}' ` +
            `WHERE id = ?`;

        return mySql.query(query, [ruleID]);
    }

    static async updateRoleToAllEmp(organization_id, all_rules, ruleIDs) {
        try {
            all_rules = parseInt(all_rules);
            if (all_rules) {
                ruleIDs = await this.allRules(organization_id);
                ruleIDs = ruleIDs.map(x => x.id);
            }

            const result = await this.getAllEmpIDs(organization_id);
            const empIDs = result.map(x => x.id);

            let rules_data = await this.checkRules(organization_id, ruleIDs);
            if (ruleIDs.length != rules_data.length) return false;

            ruleIDs.forEach(async element => {
                const result = await this.getRule(organization_id, element);

                let rule_obj = JSON.parse(result[0].include_employees);
                rule_obj.ids = empIDs;

                let rule = JSON.stringify(rule_obj);

                await this.updateRule(rule, element);
            });

            return true;
        } catch (err) {
            return false;
        }
    }

}


module.exports.NotificationRuleToAllEmpModel = NotificationRuleToAllEmpModel;