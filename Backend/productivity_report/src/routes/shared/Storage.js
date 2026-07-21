const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class Storage {

    /**
     * Add storage type details.
     *
     * @async
     * @function addSorageType
     * @memberof Storage
     * @param {string} name
     * @param {string} short_code
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async addSorageType(name, short_code, cb) {
        try {
            let storage = await mySql.query(`
                INSERT INTO storage_type (name,short_code)
                SELECT * FROM (SELECT '${name}','${short_code}') AS tmp
                WHERE NOT EXISTS (SELECT name FROM storage_type WHERE name = '${name}') 
                LIMIT 1`);
            cb(null, storage);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get storage type details.
     *
     * @async
     * @function getStorageTypes
     * @memberof Storage
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getStorageTypes(cb) {
        try {
            let storage = await mySql.query(`
                SELECT * FROM storage_type WHERE status=1`);
            cb(null, storage);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Add storage data details.
     *
     * @async
     * @function addStorageData
     * @memberof Storage
     * @param {number} storage_type_id
     * @param {string} username
     * @param {string} password
     * @param {string} desktop_access_token
     * @param {string} token
     * @param {string} web_access_token
     * @param {string} api_key
     * @param {string} admin_email
     * @param {string} refresh_token
     * @param {string} client_id
     * @param {string} client_secret
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async addStorageData(storage_type_id, username, password, desktop_access_token, web_access_token, token, api_key, application_id, refresh_token, admin_email, client_id, client_secret, admin_id, bucket_name, region, cb) {
        try {
            let storage_data = await mySql.query(`
                INSERT INTO storage_data (storage_type_id,username,password,desktop_access_token,web_access_token,token,api_key,application_id,refresh_token,admin_email,client_id,client_secret,admin_id, bucket_name, region)
                VALUES (${storage_type_id},'${username}','${password}','${desktop_access_token}','${web_access_token}','${token}','${api_key}','${application_id}','${refresh_token}','${admin_email}','${client_id}','${client_secret}',${admin_id},'${bucket_name}','${region}')
            `);
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get storage data with storage type.
     *
     * @async
     * @function getStorageDataWithsorageType
     * @memberof Storage
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getStorageDataWithsorageType(admin_id, cb) {
        try {
            let storage_data = await mySql.query(`
             SELECT sd.storage_type_id,sd.username,sd.password,sd.desktop_access_token,sd.web_access_token,sd.token,sd.api_key,sd.application_id,
                sd.refresh_token,sd.admin_email,sd.client_id,sd.client_secret,st.username AS is_username,st.password AS is_password,
                st.name,sd.status,st.desktop_access_token AS is_desktop_access_token,st.web_access_token AS is_web_access_token,
                 st.token AS is_token,st.api_key AS is_api_key,st.application_id AS is_application_id,st.refresh_token AS is_refresh_token,
                 st.admin_email AS is_admin_email,st.client_id AS is_client_id,st.client_secret AS is_ent_secret,sd.id AS storage_data_id, sd.bucket_name, sd.region
                FROM storage_data sd
                INNER JOIN  storage_type  st on st.id=sd.storage_type_id
                WHERE sd.admin_id=${admin_id}
            `);
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Delete storage data.
     *
     * @async
     * @function deleteStorageData
     * @memberof Storage
     * @param {number} storage_data_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async deleteStorageData(storage_data_id, admin_id, cb) {
        try {
            let storage_data = await mySql.query(`
                DELETE FROM storage_data WHERE id = ${storage_data_id} AND admin_id=${admin_id}
            `)
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Update storage data details.
     *
     * @async
     * @function updateStorageData
     * @memberof Storage
     * @param {number} storage_type_id
     * @param {string} username
     * @param {string} password
     * @param {string} desktop_access_token
     * @param {string} token
     * @param {string} web_access_token
     * @param {string} api_key
     * @param {string} admin_email
     * @param {string} refresh_token
     * @param {string} client_id
     * @param {string} client_secret
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async updateStorageData(storage_data_id, username, password, desktop_access_token, web_access_token, token, api_key, application_id, refresh_token, admin_email, client_id, client_secret, bucket_name, region, cb) {
        try {
            let storage_data = await mySql.query(`
                UPDATE storage_data 
                SET username='${username}', password='${password}', desktop_access_token='${desktop_access_token}', web_access_token='${web_access_token}', token='${token}', 
                api_key='${api_key}', application_id='${application_id}', refresh_token='${refresh_token}', admin_email='${admin_email}', client_id='${client_id}', client_secret='${client_secret}', bucket_name='${bucket_name}', region='${region}'
                WHERE id=${storage_data_id}
            `)
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Update storage data option
     *
     * @async
     * @function updateStorageDataOption
     * @memberof Storage
     * @param {number} storage_data_id
     * @param {number} status
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async updateStorageDataOption(storage_data_id, status, admin_id, cb) {
        try {
            let storage_data = await mySql.query(`
                UPDATE storage_data 
                SET status=${status}
                WHERE id=${storage_data_id} AND ${admin_id}
            `)
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Deactivate storage data option.
     *
     * @async
     * @function deactivateStorageDataOption
     * @memberof Storage
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async deactivateStorageDataOption(admin_id, storage_data_id, cb) {
        try {
            let storage_data = await mySql.query(`
                UPDATE storage_data
                SET status=0
                WHERE status=1 AND admin_id=${admin_id}
            `)
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get single storage data
     *
     * @async
     * @function getStorageData
     * @memberof Storage
     * @param {number} storage_data_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getStorageData(storage_data_id, admin_id, cb) {
        try {
            let storage = await mySql.query(`
                SELECT * FROM storage_data
                WHERE id=${storage_data_id} AND admin_id=${admin_id} 
            `);
            cb(null, storage);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get storage details
     *
     * @async
     * @function getStorageDetails
     * @memberof Storage
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getStorageDetails(admin_id, cb) {
        try {
            let storage_data = await mySql.query(`
            SELECT sd.storage_type_id,sd.username,sd.password,sd.desktop_access_token,sd.web_access_token,sd.token,sd.api_key,sd.application_id,
            sd.refresh_token,sd.admin_email,sd.client_id,sd.client_secret,st.name,st.short_code,sd.bucket_name,sd.region
            FROM storage_data sd
            INNER JOIN  storage_type st ON st.id=storage_type_id
            WHERE  sd.status=1 AND sd.admin_id=${admin_id}
            `)
            cb(null, storage_data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get single storage type
     *
     * @async
     * @function getStorageType
     * @memberof Storage
     * @param {number} storage_data_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     **/
    async getStorageType(storage_type_id, cb) {
        try {
            let storage = await mySql.query(`
                SELECT name FROM storage_type
                WHERE id=${storage_type_id} 
            `);
            cb(null, storage);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async addDefaultStorageToFreePlan(admin_id, admin_email, plan_id) {
        if (parseInt(plan_id) === parseInt(process.env.FREE_PLAN_ID)) {

            const getQuery = `SELECT * from free_plan_storage WHERE type = 1 AND count < 5 LIMIT 1`;
            let storageData = await mySql.query(getQuery);

            if (storageData.length > 0) {
                storageData = storageData[0];
                storageData.creds = JSON.parse(storageData.creds);
                // add storage
                await mySql.query(`
                    INSERT INTO storage_data (storage_type_id,username,password,desktop_access_token,web_access_token,token,api_key,application_id,refresh_token,admin_email,client_id,client_secret,admin_id, bucket_name, region)
                    VALUES (${storageData.type},null,null,null,null,null,null,null,'${storageData.creds.refresh_token}','${admin_email}','${storageData.creds.client_id}','${storageData.creds.client_secret}',${admin_id},null,null);
                `);
                // update counter
                await mySql.query(`UPDATE free_plan_storage SET count = count + 1 where id = ${storageData.id};`);
            }
        }
    }

}

module.exports = new Storage;