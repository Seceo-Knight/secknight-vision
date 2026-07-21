const mySql = require('../../../database/MySqlConnection').getInstance();
// const {EmployeeActivityModel: EmpActivityModel} = require('../../../../models/employee_activities.schema');
const {EmployeeActivityModel: EmpActivities} = require('../../../models/employee_activities.schema');
const OrgApps = require('../../../models/organization_apps_web.schema');



class FirewallModel {

    async getCategoryByName(name, organization_id) {
        let query = `SELECT id ,name FROM 	organizations_categories  
        WHERE organizations_id=${organization_id}  and  name ='${name}'`
        return mySql.query(query);
    }


    async addCategory(name, organization_id) {
        let query = `INSERT INTO  	organizations_categories  (name,organizations_id)
        VALUES('${name}',${organization_id})`
        return mySql.query(query);
    }

    async fetchCategoies(organization_id) {
        let query = `SELECT id ,name,parent_id,organizations_id AS admin_id FROM  organizations_categories
        WHERE organizations_id =${organization_id}`
        return mySql.query(query);
    }

    async updateCategory(name, category_id) {
        let query = `UPDATE organizations_categories SET name="${name}"
        WHERE id =${category_id}`
        return mySql.query(query);
    }

    async deleteCategory(category_id) {
        let query = `DELETE FROM organizations_categories
        WHERE id  in (${category_id})`
        return mySql.query(query);
    }

    async addDomains(name, category_id, organization_id) {
        let query = `INSERT INTO organizations_categories_domains (categories_id,admin_id,name)
        VALUES (${category_id},${organization_id},'${name}')`

        return mySql.query(query);
    }

    async checkDomainName(name, category_id, organization_id) {
        let query = `SELECT id , name  FROM organizations_categories_domains 
        WHERE  name='${name}' AND categories_id=${category_id} and admin_id=${organization_id}
        `
        return mySql.query(query);
    }

    async fetchDomains(organization_id) {
        let query = `SELECT d.id AS Domain_id , d.name AS domain_name ,d.categories_id  ,c.name AS categories_name 
        FROM organizations_categories_domains d
        INNER JOIN organizations_categories c on c.id=d.categories_id
        WHERE   d.admin_id=${organization_id}
        `
        return mySql.query(query);
    }

    async deleteDomainas(domain_ids) {
        let query = `
        DELETE FROM organizations_categories_domains
        WHERE id IN (${domain_ids})
        `
        return mySql.query(query);
    }

    async updateDomain(domain_name, categories_id, domain_id) {
        let query = `
        UPDATE organizations_categories_domains SET name='${domain_name}'
        WHERE id =${domain_id} AND categories_id= ${categories_id}
        `
        return mySql.query(query);
    }

    getCatecoryDomains(organization_id) {
        let query = `SELECT d.id  , d.name  ,d.categories_id   FROM organizations_categories_domains d
        WHERE   d.admin_id=${organization_id}
        `
        return mySql.query(query);
    }

    checkcategory(categories_id, organization_id) {
        let query = `SELECT id ,name,parent_id,organizations_id AS admin_id FROM  organizations_categories
        WHERE id =${categories_id} AND organizations_id=${organization_id}`
        return mySql.query(query);
    }

    async checkBulkDomain(categories_id, names, admin_id) {
        names = names.map(x => `"${x}"`)
        let query = `
        SELECT d.id AS domain_id,c.id AS categories_id, d.name AS domain_name,c.name AS categories_name,d.admin_id
        FROM organizations_categories_domains d
        INNER JOIN organizations_categories c ON c.id=d.categories_id
        WHERE d.admin_id=${admin_id} AND d.categories_id=${categories_id} AND d.name IN(${names})
        `
        return await mySql.query(query);
    }

    async addBulkDomain(domain_data) {
        return await mySql.query(`
            INSERT INTO organizations_categories_domains (categories_id,name,admin_id)
            VALUES ?`, [domain_data])
    }


    async checkUserDepartmentDomain(admin_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, cb) {
        try {
            let block_domains = await mySql.query(`
                    SELECT id,	entity_type,entity_ids,	days_ids,category_ids,domain_ids ,admin_id,status
                    FROM organizations_domains_blocked_employee
                    WHERE admin_id=${admin_id} AND entity_type='${entity_type}' AND days_ids='${days_ids}' AND entity_ids='${entity_ids}' AND category_ids='${category_ids}' AND domain_ids='${domain_ids}'
                `);
            cb(null, block_domains);
        } catch (err) {
            cb(err, null);
        }
    }

    async blockUserDepartmentDomain(admin_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, cb) {
        try {
            let block_domains = await mySql.query(`
                    INSERT INTO organizations_domains_blocked_employee (entity_type,entity_ids, days_ids, category_ids,domain_ids,admin_id)
                    VALUES ('${entity_type}','${entity_ids}','${days_ids}','${category_ids}','${domain_ids}',${admin_id})
                `);
            cb(null, block_domains);
        } catch (err) {
            cb(err, null);
        }
    }

    async getUserDepartmentDomain(skip, limit, admin_id, cb) {
        try {
            let block_domains = await mySql.query(`
                    SELECT id,	entity_type,entity_ids,	days_ids,category_ids,domain_ids ,admin_id,status
                    FROM organizations_domains_blocked_employee
                    WHERE admin_id=${admin_id}
                    LIMIT ${limit}
                    OFFSET ${skip}
                `);
            cb(null, block_domains);
        } catch (err) {

            cb(err, null);
        }
    }

    async getUserDepartmentDomainCount(cb) {
        try {
            let block_domains = await mySql.query(`
                    SELECT COUNT(id) AS total_count
                    FROM organizations_domains_blocked_employee
                `);
            cb(null, block_domains);
        } catch (err) {
            cb(err, null);
        }
    }

    async getUsersDetails(ids, cb) {
        try {
            let users = await mySql.query(`

                SELECT e.id AS user_id,u.first_name AS name
                FROM users u
                INNER JOIN employees e ON e.user_id=u.id
                WHERE e.id IN (${ids})`);
            cb(null, users);
        } catch (err) {

            cb(err, null);
        }
    }


    async getDepartmentDetails(ids, cb) {
        try {
            let department = await mySql.query(`
                    SELECT d.id AS department_id,d.name
                    FROM organization_departments d
                    WHERE d.id IN (${ids})
                    `);
            cb(null, department);
        } catch (err) {
            cb(err, null);
        }
    }


    async getCategoryDetails(ids, cb) {
        try {
            let category = await mySql.query(`
                    SELECT c.id AS categories_id,c.name
                    FROM organizations_categories c
                    WHERE c.id IN (${ids})
                    `);
            cb(null, category);
        } catch (err) {
            cb(err, null);
        }
    }

    async getDomainDetails(ids, cb) {
        try {
            let domain = await mySql.query(`
                    SELECT d.id AS domain_id,d.name AS domain_name,c.id AS categories_id,c.name AS category_name
                    FROM organizations_categories_domains d
                    LEFT JOIN organizations_categories c ON d.categories_id=c.id
                    WHERE d.id IN (${ids})
                    `);
            cb(null, domain);
        } catch (err) {
            cb(err, null);
        }
    }


    async updateUserDepartmentDomainRuleStatus(blocked_rule_id, status, cb) {
        try {
            let rule = await mySql.query(`
                    UPDATE organizations_domains_blocked_employee
                    SET status=${status}
                    WHERE id = ${blocked_rule_id}
                `);
            cb(null, rule);
        } catch (err) {
            cb(err, null);
        }
    }

    async deleteUserDepartmentDomainRule(blocked_rule_id, admin_id, cb) {
        try {
            let block_domains = await mySql.query(`
                DELETE FROM organizations_domains_blocked_employee 
                WHERE id IN (${blocked_rule_id}) AND admin_id=${admin_id}
                `);
            cb(null, block_domains);
        } catch (err) {
            cb(err, null);
        }
    }


    async updateUserDepartmentDomainRule(blocked_rule_id, entity_ids, days_ids, category_ids, domain_ids, cb) {
        try {
            let block_domains = await mySql.query(`
                    UPDATE organizations_domains_blocked_employee
                    SET entity_ids = '${entity_ids}', days_ids= '${days_ids}', category_ids='${category_ids}' , domain_ids='${domain_ids}'
                    WHERE id = ${blocked_rule_id}
                `);
            cb(null, block_domains);
        } catch (err) {
            cb(err, null);
        }
    }

    async getCategoriesByName(category, organizations_id) {
        try {
            return await mySql.query(`
                    SELECT  id ,name  FROM organizations_categories WHERE name ='${category}' AND organizations_id=${organizations_id}
                `);
        } catch (err) {
            return null;
        }
    }

    async checkDomainByNames(category_id, names, admin_id) {
        try {
            names = names.map(x => `"${x}"`)
            return await mySql.query(`
                SELECT d.id AS domain_id,c.id AS categories_id, d.name AS domain_name,c.name AS categories_name,d.admin_id
                FROM organizations_categories_domains d
                INNER JOIN organizations_categories c ON c.id=d.categories_id
                WHERE d.admin_id=${admin_id} AND c.id=${category_id} AND d.name IN(${names})
                `);
        } catch (err) {
            return null;
        }
    }

    async insertCategories(name, organizations_id) {
        try {
            return await mySql.query(`
                INSERT INTO organizations_categories (name,organizations_id)
                VALUES('${name}',${organizations_id})
                `);
        } catch (err) {
            return null;
        }
    }

    async updateDomainCategories(domain_id, categories_id, cb) {
        try {
            let domain = await mySql.query(`
                    UPDATE organizations_categories_domains
                    SET categories_id = ${categories_id}
                    WHERE id = ${domain_id} 
                `);
            cb(null, domain);
        } catch (err) {
            cb(err, null);
        }
    }

    async CheckDomain(categories_id, name, organizations_id, cb) {
        try {
            let domain = await mySql.query(`
                SELECT id
                FROM organizations_categories
                WHERE id=${categories_id} AND name='${name}' AND organizations_id=${organizations_id}
            `)
            cb(null, domain);
        } catch (err) {
            cb(err, null);
        }
    }

    async userList(admin_id, user_ids, cb) {
        try {
            let users = await mySql.query(`
                 SELECT e.id AS user_id, u.first_name , u.last_name,CONCAT(u.first_name, ' ',u.last_name) AS full_name,
                 e.location_id,e.department_id,ur.role_id,l.name AS location_name,r.name AS role_name,d.name AS department_name
                 FROM users u 
                 INNER JOIN employees e ON e.user_id=u.id 
                 INNER JOIN organization_locations l ON l.id=e.location_id 
                 INNER JOIN organization_departments d ON d.id=e.department_id
                 INNER JOIN user_role ur on ur.user_id=u.id 
                 INNER JOIN roles r ON r.id=ur.role_id
                 WHERE e.organization_id=${admin_id} AND e.id IN(${user_ids})
                `)
            cb(null, users);
        } catch (err) {
            cb(err, null);
        }
    }

    async departmentList(organization_id, department_ids, cb) {
        try {
            let department = await mySql.query(`
                    SELECT d.name,d.id AS department_id
                    FROM organization_departments d
                    WHERE d.organization_id=${organization_id} AND d.id IN(${department_ids})
                `)
            cb(null, department);
        } catch (err) {
            cb(err, null);
        }
    }

    async getSingleUserDepartmentDomain(blocked_rule_id, cb) {
        try {
            let block_domains = await mySql.query(`
                    SELECT id,	entity_type,entity_ids,	days_ids,category_ids,domain_ids ,admin_id,status
                    FROM organizations_domains_blocked_employee
                    WHERE id=${blocked_rule_id}
                `);
            cb(null, block_domains);
        } catch (err) {
            cb(err, null);
        }
    }

    async getAllRules(admin_id) {
        try {
            return await mySql.query(`
                        SELECT id,	entity_type,entity_ids,	days_ids,category_ids,domain_ids ,admin_id,status
                        FROM organizations_domains_blocked_employee
                        WHERE admin_id=${admin_id}
                    `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async getAllCategoryDomains(category_id) {
        let query = `SELECT d.id  , d.name  ,d.categories_id FROM organizations_categories_domains d
        WHERE d.categories_id IN (${category_id})
        `
        return mySql.query(query);
    }



    async getURLs(skip, limit) {
        return EmpActivities
            .aggregate([
                {
                    $match: {
                        domain_id: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: "$url",
                    }
                },
                {
                    $project: {
                        url: 1
                    }
                },

                { $skip: skip },
                { $limit: limit }
            ])
    }

    async getAppNames(skip, limit) {
        return OrgApps.aggregate([
            {
                $match: {
                    type: { $eq: 1 }
                }
            },
            {
                $group: {
                    _id: "$name",
                }
            },
            {
                $project: {
                    name: 1
                }
            },

            { $skip: skip },
            { $limit: limit }
        ])

    }

    async getAppsKeyStrockes(app_names) {
        return OrgApps.aggregate([
            {
                $match: {
                    type: { $eq: 1 },
                    name: { $in: app_names }
                }
            },
            {
                $lookup: {
                    from: "employee_activities",
                    let: { id: "$_id" },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                    { $eq: ["$application_id", "$$id"] },
                                keystrokes: { $nin: ["", null] }
                            }
                        },

                    ],
                    as: "keystrokes"
                }
            },
            { $unwind: "$keystrokes" },

            { $project: { name: 1, _id: 0, keystrokes: "$keystrokes.keystrokes" } },


        ])
    }

    async getAppsKeyStrockes2(app_names, skip, limit) {
        return OrgApps.aggregate([
            {
                $match: {
                    type: { $eq: 1 },
                    name: { $eq: app_names }
                }
            },
            {
                $lookup: {
                    from: "employee_activities",
                    let: { id: "$_id" },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                    { $eq: ["$application_id", "$$id"] },
                                keystrokes: { $nin: ["", null] }
                            }
                        },

                    ],
                    as: "keystrokes"
                }
            },
            { $unwind: "$keystrokes" },

            { $project: { _id: 0, keystrokes: "$keystrokes.keystrokes" } },
            { $skip: skip },
            { $limit: limit }

        ])
    }


}
module.exports = new FirewallModel;



// EmpActivities.distinct('url',{ domain_id: { $ne: null } });

// (async function () {
//     let data = EmpActivities
// .aggregate([
//     {
//         $match: {
//             domain_id: { $e: null }
//         }
//     },
//     {
//         $group: {
//             _id: "$url",
//         }
//     },
//     {
//         $project: {
//             ke: 1
//         }
//     },

//     { $skip: 0 },
//     { $limit: 10 }
// ])
// })
// // let data=()
// console.log('=======================',)


// db.getCollection('organization_apps_webs').aggregate([
//     {
//        $match: {
//            type: { $eq:1 },


//        }
//    },
//          {
//                $lookup: {
//                    from: "employee_activities",
//                    localField:  "_id",
//                    foreignField:"application_id",
//                    as: "app"
//                }
//            },

//     {
//         $project:
//         {
//             name:1,
//             _id:0,
//             keystrokes:1
//         }  
//     },

//    { $skip: 0 },
//    { $limit: 1000 }


//    ])

// db.getCollection('organization_apps_webs').aggregate([
//     {
//         $match: {
//             type: { $eq: 1 },
//             name: {$in:['ASUS Smart Gesture Helper']}
//         }
//     }
// ])



// .aggregate([
//     {
//         $match: {
//             type: { $eq: 1 },
//             name: {$in:['ASUS Smart Gesture Helper']}
//         }
//     },
//     {
//             $lookup: {
//                 from: "employee_activities",
//                 let: { id: "$_id" },
//                 pipeline: [
//                 {$match:
//                    { $expr:


//                  { $eq: [ "$application_id",  "$$id" ] },


//          }
// //                             { $project: { name: 1, _id: 0 } }
//      } ,
//       { $project: { keystrokes: 1, _id: 0 } }
//      ],
//                 as: "app"
//             }
//      },
// ])
// console.log(decodeURIComponent('\u0000\u0000\u0000\u0000\u0000\u0000\u0000C\u0000\u0000\u0000\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000Z\u0000\u0000\u0000C\u0000\u0000\u0000\u0000\u0000\u0000V\u0000V\u0000V\u0000C\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000V\u0000C\u0000V\u0000\u0000\u0000\u0000V\u0000V\u0000\u0000\u0000V\u0000\u0000HTM\u0000C\u0000\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000\u0000C\tpIP\b\b\bPiping layout \u0000 isometrics\ty\tAES\b\bARS\b\b\bRS\u0000\b\u0000C\u0000\u0000C\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000\u0000V\u0000V\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000V\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000SSSSSS'), '=======================')

