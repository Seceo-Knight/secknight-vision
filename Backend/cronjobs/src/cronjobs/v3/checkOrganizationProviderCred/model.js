const mySql = require("../../../database/MySqlConnection").getInstance();

class Model {
    checkIsExpired() {
        return mySql.query(`
            SELECT 
 				u.email,
 				opc.id AS organization_provider_cred,
 				opc.org_provider_id,
 				opc.creds,
 				opc.status AS organization_provider_cred_status,
 				opc.is_expired,
 				op.organization_id,
 				op.provider_id,
 				op.status AS organization_provider_status,
 				p.name AS provide_name,
 				p.short_code,
 				p.integration_id,
 				JSON_EXTRACT(os.rules,'$.pack') as rules
			FROM organization_provider_credentials opc
			JOIN organization_providers op ON op.id = opc.org_provider_id
			JOIN providers p ON p.id = op.provider_id
			JOIN organizations o ON o.id = op.organization_id
			JOIN organization_settings os ON o.id = os.organization_id
			JOIN users u ON u.id = o.user_id
			WHERE o.amember_id IS NOT NULL AND opc.status = 1 AND opc.is_expired = 0;
        `);
	}
	
	updateIsExpired(id) {
		return mySql.query(`
			UPDATE organization_provider_credentials 
			SET is_expired = 1
			WHERE id = ${id};
		`)		
	}
	
	getReseller(id) {
		return mySql.query(`
			SELECT 
                re.logo,re.details
            FROM  
                organizations o 
                LEFT JOIN reseller re ON re.id= o.reseller_id
            WHERE  o.id = ${id};
		`)		
	}
}

module.exports = new Model;