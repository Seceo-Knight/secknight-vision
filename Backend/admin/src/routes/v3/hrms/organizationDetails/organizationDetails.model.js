// OrganizationDetails Model

const mySql = require('../../../../database/MySqlConnection').getInstance();


class OrganizationDetailsModel {

    /**
     * Get Organization Details
     * @param {*} organization_id 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in> 
     */
    getOrganizationDetails(organization_id) {
        const query = `SELECT compliance_details, basic_details 
                    FROM organization_hrms_settings
                    WHERE organization_id = ?`;

        return mySql.query(query, [organization_id]);
    }

    /**
     * Get Bank Details
     * @param {*} organization_id 
     * @param {*} id 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getBankDetails(organization_id, id = 0) {
        let query = `SELECT id, bank_name, account_number, ifsc, account_type, branch_name
                    FROM organization_hrms_banks 
                    WHERE organization_id = ?`;

        if (id && id != 0) query += ` AND id = ${id}`;

        return mySql.query(query, [organization_id]);
    }

    /**
     * Update Compliance Details
     * @param {*} organization_id 
     * @param {*} value 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in> 
     */
    updateBasicDetails(organization_id, value) {
        const query = `UPDATE organization_hrms_settings 
                    SET basic_details = ?
                    WHERE organization_id = ?`;

        return mySql.query(query, [value, organization_id]);
    }

    /**
     * Add new bank account for organization
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in> 
     */
    addBankDetails({ organization_id, bankName, accountNumber, ifsc, accountType, branchName }) {
        const query = `INSERT INTO organization_hrms_banks 
                    (organization_id, bank_name, account_number, ifsc, account_type, branch_name) 
                    VALUES (?,?,?,?,?,?)`;

        return mySql.query(query, [organization_id, bankName, accountNumber, ifsc, accountType, branchName])
    }

    /**
     * update bank details
     * @param {*} param0 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    updateBankDetails({ id, organization_id, bankName, accountNumber, ifsc, accountType, branchName }) {
        const query = `UPDATE organization_hrms_banks 
                    SET  bank_name = ?, account_number = ?, ifsc = ?, 
                    account_type = ?, branch_name = ?
                    WHERE organization_id = ? AND id = ?`;

        return mySql.query(query, [bankName, accountNumber, ifsc, accountType, branchName, organization_id, id])
    }

    /**
     * Update Basic Details
     * @param {*} organization_id 
     * @param {*} value 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in> 
     */
    updateComplianceDetails(organization_id, value) {
        const query = `UPDATE organization_hrms_settings 
                    SET compliance_details = ?
                    WHERE organization_id = ?`;

        return mySql.query(query, [value, organization_id]);
    }

    /**
     * Get Organization logo path
     * @param {*} organization_id 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in> 
     */
    getOrgLogo(organization_id) {
        const query = `SELECT logo FROM organization_hrms_settings
                    WHERE organization_id = ?`;

        return mySql.query(query, [organization_id]);
    }

    /**
     * Upload file path
     * @param {*} logoFilePath 
     * @param {*} organization_id
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    updateLogoPath(logoFilePath, organization_id) {
        const query = `UPDATE organization_hrms_settings
                    SET logo = ? WHERE organization_id = ?`;

        return mySql.query(query, [logoFilePath, organization_id]);
    }
}


// exports
module.exports = new OrganizationDetailsModel();