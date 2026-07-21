const mySql = require('../../../database/MySqlConnection').getInstance();

class PwdRecoverModel {

    async getUser(email) {
        let query = ` 
        SELECT u.id,u.a_email,u.email, u.first_name,u.last_name,r.name,re.logo,re.details,o.language, o.id as organization_id
        FROM users u
        INNER JOIN employees e ON e.user_id =u.id
        INNER JOIN  organizations o ON o.id=e.organization_id
        LEFT JOIN user_role ur ON ur.user_id=u.id
        LEFT JOIN roles r ON ur.role_id=r.id
        LEFT JOIN reseller re ON re.id= o.reseller_id
        WHERE  u.a_email=? OR u.email=? `

        return mySql.query(query, [email, email]);
    }

    async updateProfileData(id, password) {
        let query = `UPDATE users SET password='${password}'
                    WHERE id =${id}`

        return mySql.query(query);
    }


    /**
     * getAmemberDetails - function to get the amember
     * @memberof PwdRecoverModel
     * @param {*} email 
     * @returns Object | null
     */
    async getAmemberDetails(email){
        let query = `
            SELECT u.a_email, org.amember_id, org.id as organization_id, org.language
            FROM users u
            INNER JOIN organizations org ON org.user_id = u.id
            WHERE u.a_email = ? AND org.amember_id IS NOT NULL
        `;
        return mySql.query(query, [email]);
    }

    /**
     * getResellerDetails - function to get the reseller data
     * @memberof PwdRecoverModel
     * @param number organisation_id
     * @return object | null
     */
    async getResellerDetails(organisation_id) {
            let query = `
                SELECT 
                    re.logo,re.details
                FROM  
                    organizations o 
                    LEFT JOIN reseller re ON re.id= o.reseller_id
                WHERE  o.id = ?
            `;
    
            const params = [organisation_id];
            return mySql.query(query, params);
        }
    
    async getClient(email) {
        let query = ` 
        SELECT u.id,u.a_email,u.email, u.first_name,u.last_name,r.name,re.logo,re.details,o.language
        FROM users u
        INNER JOIN  organizations o ON o.user_id= u.id
        LEFT JOIN user_role ur ON ur.user_id=u.id
        LEFT JOIN roles r ON ur.role_id=r.id
        INNER JOIN reseller re ON re.id= o.reseller_id
        WHERE  u.a_email=? OR u.email=? `

        return mySql.query(query, [email, email]);
    }
}

module.exports = new PwdRecoverModel;
