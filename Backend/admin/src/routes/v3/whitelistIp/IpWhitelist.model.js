const mySql = require('../../../database/MySqlConnection').getInstance();

class IpWhitelistModel{

   async checkIp(ip,organization_id){
        let query = `SELECT id ,ip FROM  organizations_whitelist_ips
        WHERE admin_id=${organization_id} AND ip='${ip}'`

        return mySql.query(query);
    }

    async addIp(organization_id,ip,admin_email){
        let query = `INSERT INTO  organizations_whitelist_ips (admin_id,admin_email,ip)
         VALUES (${organization_id},'${admin_email}','${ip}')
        `
        return mySql.query(query);
    }
    
    async updateIp(ip,ip_id){
            let query = `UPDATE organizations_whitelist_ips SET ip='${ip}'
            WHERE id=${ip_id}
            `
            return mySql.query(query);
    }

    async deleteIp(ip_id,organization_id){
        let query = `DELETE FROM  organizations_whitelist_ips 
        WHERE id=${ip_id} AND admin_id=${organization_id}`
        return mySql.query(query);
    }

    async getIp(skip,limit,organization_id){
        let query = `              
        SELECT id, ip, 
        (SELECT COUNT(id)  FROM organizations_whitelist_ips WHERE admin_id=${organization_id} ) AS 'total_count'
        FROM organizations_whitelist_ips 
        WHERE admin_id=${organization_id}
        LIMIT ${skip},${limit}`
        return mySql.query(query);
    }

}
module.exports=new IpWhitelistModel;