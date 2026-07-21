const mySql = require('../../../database/MySqlConnection').getInstance();


class StorageModel {
    getStorageTypes(){
        let query = `SELECT id ,name ,short_code ,integration_id,status 
        FROM providers  
        WHERE status=1` 
        return mySql.query(query);
    }



    addStorageData(provider_id, organization_id, user_id) {
        let query = `
        INSERT INTO   organization_providers (organization_id,provider_id,created_by,status)
        VALUES (${organization_id},${provider_id},${user_id},1)`
        return mySql.query(query);
    }


    addStorageCreds(org_provider_id, storage_creds, organization_id, user_id, auto_delete_period, status, note = '') {

        const query = `INSERT INTO organization_provider_credentials 
        (org_provider_id, created_by, creds, auto_delete_period, status, note) 
        VALUES (?, ?, ?, ?, ?, ?)`;
        const paramsArray = [org_provider_id, user_id, storage_creds, auto_delete_period, status === 1 ? 1 : 0, note];

        return mySql.query(query, paramsArray);
    }

    getOrgCredsOneType(provider_id, organization_id) {
        const query = `SELECT opc.creds
        FROM organization_providers op 
        INNER JOIN organization_provider_credentials opc ON opc.org_provider_id = op.id
        WHERE op.organization_id = ? AND op.provider_id = ?`;
        const paramsArray = [organization_id, provider_id];

        return mySql.query(query, paramsArray);
    }

    getStorageTypeWithData(organization_id) {
        let query = `
        SELECT op.provider_id AS storage_type_id, p.name, p.short_code, opc.id AS storage_data_id, opc.creds, opc.status, opc.auto_delete_period, opc.is_expired, opc.note
        FROM organization_providers op
        INNER JOIN providers p ON p.id = op.provider_id
        INNER JOIN organization_provider_credentials opc ON opc.org_provider_id = op.id
        WHERE op.organization_id = ${organization_id} `
        return mySql.query(query);
    }

    // UpdateStorageActiveOption(organization_id) {
    //     let query = `
    //     UPDATE organization_providers op 
    //     INNER JOIN providers p ON p.id=op.provider_id
    //     SET op.status= 0
    //     WHERE op.organization_id=${organization_id} AND p.integration_id=1`
    //     return mySql.query(query);
    // }

    UpdateStorageActiveOption(organization_id) {
        let query = `
        UPDATE organization_provider_credentials opc 
        INNER JOIN organization_providers op ON op.id=opc.org_provider_id
        SET opc.status= 0
        WHERE op.organization_id=${organization_id}`
        return mySql.query(query);
    }



    // activateStorage(storage_data_id, status) {
    //     let query = `
    //     UPDATE organization_providers op 
    //     INNER JOIN organization_provider_credentials opc ON op.id =opc.org_provider_id
    //     SET op.status = ${status}
    //     WHERE opc.id =${storage_data_id} AND  op.provider_id=1`
    //     return mySql.query(query);
    // }
    activateStorage(storage_data_id, status) {
        // let query = `
        // UPDATE organization_provider_credentials op 
        // SET op.status = ${status}
        // WHERE op.id =${storage_data_id}`;
        let query = `
        UPDATE organization_provider_credentials opc
        INNER JOIN organization_providers op ON op.id = opc.org_provider_id  
        SET opc.status = ${status}, op.status = ${status}
        WHERE opc.id = ${storage_data_id}`;
        return mySql.query(query);
    }
    getStorageData(storage_data_id,organization_id){
        let query = ` 
        SELECT opc.id,opc.org_provider_id,opc.status,opc.creds
        FROM  organization_provider_credentials opc
        INNER JOIN organization_providers op ON op.id = opc.org_provider_id
        WHERE opc.id=${storage_data_id} AND op.organization_id=${organization_id}  `
        return mySql.query(query);
    }

    deleteStorageData(storage_data_id) {
        let query = `
        DELETE  FROM organization_provider_credentials
         WHERE id =${storage_data_id}`
        return mySql.query(query);
    }

    getStorageDataByDataId(storage_data_id,organization_id) {
        let query = `
        SELECT op.provider_id AS storage_type_id ,p.name,p.short_code ,opc.id AS storage_data_id,opc.creds,opc.status ,opc.auto_delete_period
        FROM organization_providers op 
        INNER JOIN providers p ON p.id=op.provider_id
        INNER JOIN organization_provider_credentials opc ON opc.org_provider_id = op.id
        WHERE opc.id=${storage_data_id} AND op.organization_id = ${organization_id}`
        return mySql.query(query);
    }

    updateStorageData(storage_data_id, creds, auto_delete_period, note = '') {
        const query = `UPDATE organization_provider_credentials 
        SET creds = ?, auto_delete_period = ?, is_expired = 0, note = ?
        WHERE id = ?`;
        const paramsArray = [creds, auto_delete_period, note, storage_data_id];

        return mySql.query(query, paramsArray);
    }

    getStorageTypeData(storage_type_id) {
        let query = `
        SELECT id ,name ,short_code  FROM providers 
        WHERE id=${storage_type_id}`
        return mySql.query(query);
    }

    checkOrgStorageType(provider_id, organization_id) {
        let query = `SELECT id FROM organization_providers WHERE provider_id=${provider_id} AND organization_id=${organization_id}`
        return mySql.query(query);
    }

    getActiveStorageType(organization_id) {
        const query = `SELECT p.short_code ,op.status, opc.creds, opc.auto_delete_period, p.id as provider_id
                    FROM organization_providers op
                    INNER JOIN providers p ON p.id=op.provider_id
                    INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
                    WHERE op.organization_id=${organization_id} AND opc.status=1`;

        return mySql.query(query);
    }

}
module.exports = new StorageModel;

