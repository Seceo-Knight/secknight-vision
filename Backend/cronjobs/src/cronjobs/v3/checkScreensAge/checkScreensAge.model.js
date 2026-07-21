const mySql = require('../../../database/MySqlConnection').getInstance();
const moment = require('moment');
class CheckScreensAgeModel {
	getStorageDetail() {
		const query = `SELECT p.short_code as storageType, opc.creds as credsJson,opc.auto_delete_period, op.organization_id
                    FROM organization_providers op 
                    INNER JOIN providers p ON p.id = op.provider_id
                    INNER JOIN organization_provider_credentials opc ON opc.org_provider_id = op.id
					INNER JOIN organization_settings as os ON os.organization_id = op.organization_id
                    WHERE opc.status = 1 AND JSON_EXTRACT(os.rules,'$.pack.expiry')  >= ?`;

		return mySql.query(query, [moment().format("YYYY-MM-DD")]);
	}

	getEmployeeTz(organization_id, email) {
		const query = `SELECT e.timezone
                    FROM employees e 
                    LEFT JOIN users u ON u.id = e.user_id
                    WHERE e.organization_id = ? AND u.email = ?`;

		return mySql.query(query, [organization_id, email]);
	}

	getOrganizationTz(organization_id) {
		const query = `SELECT timezone
					FROM organizations
					WHERE id = ?`;

		return mySql.query(query, [organization_id]);
	}

	async getOrgStorageDetail(organization_id) {
		const query = `SELECT
			op.provider_id AS storage_type_id ,p.name,p.short_code ,opc.id AS storage_data_id,opc.creds,op.status
			FROM organization_providers op 
			INNER JOIN providers p ON p.id=op.provider_id
			INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
			WHERE op.organization_id=${organization_id} AND opc.status=1`;

		return mySql.query(query);
	}
}

module.exports = new CheckScreensAgeModel();
