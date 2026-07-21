const { BaseModel } = require('../../../models/BaseModel');

class OrganizationModel extends BaseModel {
    static get TABLE_NAME() {
        return 'organizations';
    }

    static get TABLE_FIELDS() {
        return [
            'id', 'user_id', 'reseller_id', 'timezone', 'current_user_count', 'total_allowed_user_count', 'language',
            'created_at', 'updated_at',
        ];
    }

    static async getRoles(organization_id, employee_id) {
        let query = 'SELECT id, name, organization_id, type FROM roles WHERE status=1 AND organization_id=?';
        let params = [organization_id]
        if (employee_id) {
            query = `SELECT DISTINCT(r.id) AS id ,r.name,r.organization_id,r.type 
                     FROM assigned_employees ae 
                     INNER JOIN employees e ON e.id=ae.employee_id 
                     INNER JOIN users u ON u.id=e.user_id 
                     INNER JOIN user_role ur ON ur.user_id=u.id 
                     INNER JOIN roles r ON r.id=ur.role_id
                     WHERE r.status=1 AND r.organization_id=? AND  ae.to_assigned_id =?`;
            params = [organization_id, employee_id]
        }

        return this.query(query, params);
    }

    static getOrganizationFeature(organization_id) {
        const query = 'SELECT id, organization_id, rules FROM organization_settings WHERE organization_id=?';
        return this.query(query, [organization_id]);
    }
    static getGroupFeature(organization_id, group_id) {
        const query = 'SELECT id,organization_id,rules FROM organization_groups WHERE organization_id =? AND id =?';
        return this.query(query, [organization_id, group_id]);
    }

    static updateFeature(features, organization_id) {
        const query = 'UPDATE organization_settings SET rules=? WHERE organization_id=?';
        return this.query(query, [features, organization_id]);
    }

    static updateGroupFeature(features, organization_id, group_id) {
        const query = 'UPDATE organization_groups SET rules=? WHERE organization_id=? AND id=?';
        return this.query(query, [features, organization_id, group_id]);
    }

    static updateEmpTrackRule(features, organization_id) {
        const query = 'UPDATE employees SET custom_tracking_rule=? WHERE organization_id=? AND tracking_rule_type=1';
        return this.query(query, [features, organization_id]);
    }

    static updateEmpGroupTrackRule(features, organization_id, group_id) {
        const query = 'UPDATE employees SET custom_tracking_rule=? WHERE organization_id=? AND group_id=? AND tracking_rule_type=2';
        return this.query(query, [features, organization_id, group_id]);
    }

    static employees(organization_id) {
        const query = 'SELECT id, tracking_rule_type FROM employees WHERE organization_id=? AND tracking_rule_type=1';
        return this.query(query, [organization_id]);
    }

    static groupEmployees(organization_id, group_id) {
        const query = 'SELECT id, tracking_rule_type FROM employees WHERE organization_id=? AND group_id=? AND tracking_rule_type=2';
        return this.query(query, [organization_id, group_id]);
    }

    static updateOrgnizationDetails(organization_id, timezone, language, weekday_start) {
        let update = '';
        if (timezone) update += `timezone="${timezone}"`;
        if (language) { update += update ? `, language="${language}"` : `language="${language}"`; }
        if (weekday_start) { update += update ? `, weekday_start="${weekday_start}"` : `weekday_start="${weekday_start}"`; }

        if (!update) {
            return Promise.resolve()
        }
        const query = `
            UPDATE organizations
            SET ${update}
            WHERE id=${organization_id}
        `;
        return this.query(query);
        // const query = 'UPDATE organizations SET timezone=? WHERE id=?';
        // return this.query(query, [timezone, organization_id]);
    }

    static getUser(email, id) {
        let query = `SELECT id FROM users WHERE (email = ? OR a_email = ?) AND id != ? ;`

        return this.query(query, [email, email, id]);
    }

    static updateProfileData(id, email) {
        let query = ` UPDATE users SET a_email=? ,email= ? WHERE id = ? ;`

        return this.query(query, [email, email, id]);
    }

    get employeesIds() {
        const query = 'SELECT id FROM employees WHERE organization_id=?';
        return this.constructor.query(query, [this.id]).then(result => result.map(entity => entity.id));
    }

    static getOrgDetails(organization_id) {
        const query = `
            SELECT 
                o.timezone,o.language,o.weekday_start,
                o.amember_id,o.current_user_count,o.total_allowed_user_count,
                o.logo
            FROM organizations o
            WHERE id=?;
        `

        return this.query(query, [organization_id]);
    }
    static updateEmployeeFeature(features, organization_id, employee_id) {
        const query = 'UPDATE employees SET custom_tracking_rule=? WHERE organization_id=? AND id=?';
        return this.query(query, [features, organization_id, employee_id]);
    }

    static getEmployeeSettings(organization_id, employee_id) {
        const query = 'SELECT id, organization_id, custom_tracking_rule FROM employees WHERE organization_id=? AND id=?';
        return this.query(query, [organization_id, employee_id]);
    }

    static updateCustomEmpTrackRule(features, employee_id) {
        const query = 'UPDATE employees SET custom_tracking_rule=? WHERE id=? AND tracking_rule_type=3';
        return this.query(query, [features, employee_id]);
    }


    /**
        * Getting projects names based on ids
        *
        * @function getProjects
        * @memberof Organization
        * @param {*} req
        * @param {*} res
        * @return {Promise<Object>} with project names or Error.
        */
    static getProjects(projectIdsArray, organizationId) {
        try {
            let query = `
            SELECT id , name
            FROM projects 
            WHERE id IN (${projectIdsArray}) AND organization_id=${organizationId}`

            return this.query(query);

        } catch (err) {
            return null;
        }
    }

    static updateLogoPath(logo, orgnaizationId) {
        const query = `
            UPDATE organizations
                SET    logo = ?
            WHERE 
                id = ?
        `;
        return this.query(query, [logo, orgnaizationId]);
    }
    
    static updateProductTourStatus(organization_id) {
        let query = `
            UPDATE organizations SET product_tour_status = 1 WHERE id = ${organization_id};
        `;
        return this.query(query);
    }

    
    static update2FAStatus(organization_id, status, mfa_config) {
        let query = `
            UPDATE organizations SET is2FAEnable = ${status}, mfa_config = '${mfa_config}' WHERE id = ${organization_id};
        `;
        return this.query(query);
    }

    static get2FAStatus(organization_id) {
        let query = `
            SELECT o.is2FAEnable, o.mfa_config, o.id FROM organizations o WHERE o.id = ${organization_id};
        `;
        return this.query(query);
    }


    static updateMFAStatus(organization_id, status, type, secret) {
        const mfa_config = JSON.stringify({ type, secret });
        const query = `
            UPDATE organizations SET is2FAEnable = ?, mfa_config = ? WHERE id = ?;
        `;
        return this.query(query, [status, mfa_config, organization_id]);
    }

    static getMFAStatus(organization_id) {
        const query = `
            SELECT o.is2FAEnable, o.mfa_config, o.id FROM organizations o WHERE o.id = ?;
        `;
        return this.query(query, [organization_id]);
    }

}

module.exports = OrganizationModel;