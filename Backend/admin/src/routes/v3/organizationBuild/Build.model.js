
const mySql = require('../../../database/MySqlConnection').getInstance();

class BuildModel {
    getOrgBuild(organization_id) {
        let query = `
            WITH ranked_builds AS (
                SELECT 
                    ob.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY ob.type, ob.mode, ob.file_type
                        ORDER BY 
                            CAST(SUBSTRING_INDEX(build_version, '.', 1) AS UNSIGNED) DESC,
                            CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(build_version, '.', 2), '.', -1) AS UNSIGNED) DESC,
                            CAST(SUBSTRING_INDEX(build_version, '.', -1) AS UNSIGNED) DESC
                    ) AS rn
                FROM organizations_build ob
                JOIN organizations o ON o.id = ob.organizations_id
                WHERE ob.organizations_id = ?
            )
            SELECT id, organizations_id, build_version, type, mode, url, file_type
            FROM ranked_builds
            WHERE rn = 1;
        `;
        return mySql.query(query, [organization_id]);
    }

    getOrgBuildOnPremise(email) {
        let query = `
            SELECT
                o1.id, o1.organizations_id, o1.build_version, o1.type, o1.mode, o1.url, o1.file_type, o1.email
            FROM onpremise_build o1
            INNER JOIN
            (
                SELECT 
                    Max(build_version) AS build_version, organizations_id, type, mode, file_type, email
                FROM onpremise_build  WHERE email = ?
                GROUP BY email,type, mode, file_type
            ) o2 ON (
                o2.email = o1.email AND
                o2.build_version = o1.build_version AND
                o2.type = o1.type AND
                o2.mode = o1.mode AND
                o2.file_type = o1.file_type
            )
        `;
        return mySql.query(query, [email]);
    }
}
module.exports = new BuildModel;
