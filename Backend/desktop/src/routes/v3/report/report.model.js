const EmailActivitySchema = require('../../../models/email_activity.schema');
const mySql = require('../../../database/MySqlConnection').getInstance();

class ReportModel {
    getStorageDetail(organization_id) {
        let query = `SELECT
                    op.provider_id AS storage_type_id ,p.name,p.short_code ,opc.id AS storage_data_id,opc.creds,op.status
                    FROM organization_providers op 
                    INNER JOIN providers p ON p.id=op.provider_id
                    INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
                    WHERE op.organization_id=? AND opc.status=1`;

        return mySql.query(query, [organization_id]);
    }

    insertEmailActivity(data) {
        return EmailActivitySchema.insertMany(data);
    }
}

module.exports = new ReportModel;