const mysql = require('../../../../../../database/MySqlConnection').getInstance();

class DeclarationSettingModel {
    // getter of tables
    get ORG_PAYROLL_SETTINGS_TABLE() {
        return 'organization_payroll_settings';
    }

    /**
     * checkOrganizationPayrollSettingExists - function to check org payroll setting exist or not
     * @param {s} employeeId 
     * @param {*} organizationId 
     * @returns 
     */
     checkOrganizationPayrollSettingExists(organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT id
                FROM ${this.ORG_PAYROLL_SETTINGS_TABLE}
                WHERE organization_id = ?
            ) as has_org_payroll_setting;
        `;
        return mysql.query(query, [ organizationId ]);
    }

    /**
     * checkDeclarationSettingExists
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    checkDeclarationSettingExists(organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT 
                    declaration_settings
                FROM ${ this.ORG_PAYROLL_SETTINGS_TABLE }
                WHERE organization_id = ?
            ) as has_org_declaration_setting;
        `;
        return mysql.query(query, [ organizationId ]);
    }

    /**
     * getDeclarationSettings - function to get declaration setting
     * 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getDeclarationSettings(organizationId) {
        const query = `
            SELECT 
                declaration_settings
            FROM ${ this.ORG_PAYROLL_SETTINGS_TABLE }
            WHERE organization_id = ?
        `;
        return mysql.query(query, [ organizationId ]); 
    }

    /**
     * createDeclarationSettings - function to create declaration settings
     * 
     * @param {*} declarationsettings 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    createDeclarationSettings(declarationsettings, organizationId) {

        const query = `
            INSERT INTO ${this.ORG_PAYROLL_SETTINGS_TABLE} (organization_id, declaration_settings) 
            values ('${ organizationId }', '${ JSON.stringify(declarationsettings) }')
        `;

        return mysql.query(query);
    }

    /**
     * updateDeclarationSettings -function to update declaration settings
     * 
     * @param {*} declarationsettings 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@gloubussoft.in>
     */
    updateDeclarationSettings(declarationsettings, organizationId) {
        const query = `
            update ${this.ORG_PAYROLL_SETTINGS_TABLE} 
            SET declaration_settings = '${ JSON.stringify(declarationsettings) }'
            WHERE organization_id = '${ organizationId }'
        `;
        return mysql.query(query);
    }

}

module.exports = new DeclarationSettingModel();