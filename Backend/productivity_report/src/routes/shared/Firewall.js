'use strict';
const _ = require('underscore');
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class FirewallService {

    /**
     *  Add category details
     *
     * @function addCategory
     * @memberof FirewallService
     * @param {string} name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async addCategory(name, admin_id, cb) {
        try {
            // INSERT INTO categories (name)VALUES ('${name}')
            let categories = await mySql.query(`
                INSERT INTO categories (name,admin_id)
                SELECT * FROM (SELECT '${name}',${admin_id}) AS tmp
                WHERE NOT EXISTS (
                SELECT name FROM categories WHERE name = '${name}' AND admin_id=${admin_id}
                ) LIMIT 1;
            `);
            cb(null, categories);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *  Update category details
     *
     * @function updateCategory
     * @memberof FirewallService
     * @param {string} name
     * @param {number} category_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async updateCategory(category_id, name, cb) {
        try {
            let categories = await mySql.query(`
            UPDATE categories
            SET name = '${name}'
            WHERE id = ${category_id}
        `);
            cb(null, categories);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *  delete category details
     *
     * @function deleteCategory
     * @memberof FirewallService
     * @param {number} category_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async deleteCategory(category_id, admin_id, cb) {
        try {
            let categories = await mySql.query(`
                    DELETE FROM categories WHERE id IN(${category_id}) AND admin_id=${admin_id}
                `);
            cb(null, categories);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *  Update category details
     *
     * @function getCategoryByName
     * @memberof FirewallService
     * @param {string} name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getCategoryByName(name, admin_id, cb) {
        try {
            let categories = await mySql.query(`
                SELECT * FROM categories
                WHERE name='${name}' AND admin_id=${admin_id}
                `);
            cb(null, categories);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *   get category get category details
     *
     * @function getCategory
     * @memberof FirewallService
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getCategory(admin_id, cb) {
        try {
            let category = await mySql.query(`
                SELECT * FROM categories
                WHERE admin_id=${admin_id}
            `);
            cb(null, category);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get domains details
     *
     * @function getDomain
     * @memberof FirewallService
     * @param {number} categories_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getDomain(categories_id, cb) {
        try {
            let days = await mySql.query(`
                SELECT d.id,d.name,d.categories_id
                FROM domains d
                WHERE categories_id=${categories_id}
            `);
            cb(null, days);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Add days
     *
     * @function addDays
     * @memberof FirewallService
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async addDays(cb) {
        try {
            let days = await mySql.query(`
                INSERT INTO days (name)VALUES  ('Sunday'),('Monday'),('Tuesday'),('Wednesday'),('Thursday'),('Friday'),('Saturday')
            `);
            cb(null, days);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get days details
     *
     * @function getDays
     * @memberof FirewallService
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */
    async getDays(callback) {
        try {
            let days = await mySql.query(`
            SELECT * FROM days
            `);
            callback(null, days);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Add new domaines 
     *
     * @function addDomain
     * @memberof FirewallService
     * @param {number} categories_id
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */
    async addDomain(categories_id, name, admin_id, cb) {
        try {
            let domain = await mySql.query(`
                INSERT INTO domains (name,categories_id,admin_id)
                VALUES ('${name}','${categories_id}',${admin_id})
            `);
            cb(null, domain);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Add new domaines 
     *
     * @function addBulkDomain
     * @memberof FirewallService
     * @param {number} categories_id
     * @param {string} name
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */

    async addBulkDomain(domain_data) {
        try {
            return await mySql.query(`
            INSERT INTO domains (categories_id,name,admin_id)
            VALUES ?`, [domain_data])
        } catch (err) {
            console.log(err)
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async addBulkDomainFile(domain_data, cb) {
        try {
            let data = await mySql.query(`
            INSERT INTO domains (categories_id,name,admin_id)
            VALUES ?`, [domain_data])
            cb(null, data);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Check domaines 
     *
     * @function CheckDomain
     * @memberof FirewallService
     * @param {number} categories_id
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */
    async CheckDomain(categories_id, name, admin_id, cb) {
        try {
            let domain = await mySql.query(`
            SELECT * 
            FROM domains
            WHERE categories_id=${categories_id} AND name='${name}' AND admin_id=${admin_id}
        `)
            cb(null, domain);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *bulk Check domaines 
     *
     * @function CheckDomain
     * @memberof FirewallService
     * @param {number} categories_id
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */
    async checkBulkDomain(categories_id, names, admin_id) {
        names = names.map(x => `"${x}"`)
        try {
            return await mySql.query(`
            SELECT d.id AS domain_id,c.id AS categories_id, d.name AS domain_name,c.name AS categories_name,d.admin_id
            FROM domains d
            INNER JOIN categories c ON c.id=d.categories_id
            WHERE d.admin_id=${admin_id} AND d.categories_id=${categories_id} AND d.name IN(${names})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async checkBulkDomainFile(categories_id, names, admin_id, cb) {
        names = names.map(x => `"${x}"`)
        try {
            let data = await mySql.query(`
            SELECT d.id AS domain_id,c.id AS categories_id, d.name AS domain_name,c.name AS categories_name,d.admin_id
            FROM domains d
            INNER JOIN categories c ON c.id=d.categories_id
            WHERE d.admin_id=${admin_id} AND d.categories_id=${categories_id} AND d.name IN(${names})
            `)
            cb(null, data);
        } catch (err) {
            console.log('=========', err);
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }

    async checkDomainAlreadyexists(domain_id, domain_name, categories_id, admin_id) {
        try {
            let domain = await mySql.query(`
                SELECT *
                FROM domains
                WHERE id !=${domain_id} AND admin_id=${admin_id} AND categories_id='${categories_id}' AND name='${domain_name}'
            `);
            return domain;
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateDomain(domain_id, categories_id, name) {
        try {
            return await mySql.query(`
            UPDATE domains
            SET name = '${name}'
            WHERE id = ${domain_id} AND categories_id=${categories_id}
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    // / WHERE d.admin_id=2 AND d.categories_id=55 AND d.name IN("youtube.com")
    // WHERE d.admin_id=${admin_id} AND d.categories_id=${categories_id} AND d.name IN(${names})

    /**
     * Get domains uasing category_id
     *
     * @function getDomains
     * @memberof FirewallService
     * @param {number} catId
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */
    async getDomains(catId, callback) {
        try {
            let days = await mySql.query(
                `SELECT id,name ,categories_id FROM domains WHERE categories_id IN(${catId})`
            );
            callback(null, days);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Get all domain details
     *
     * @function getAllDomains
     * @memberof FirewallService
     * @param {number} catId
     * @param {*} callback
     * @returns {Object} -Data or Error.
     */
    async getAllDomains(catId, callback) {
        try {
            let days = await mySql.query(`
                SELECT id,name ,categories_id FROM domains WHERE categories_id IN(${catId})
            `);
            callback(null, days);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            callback(err, null);
        }
    }

    /**
     * Adding IP's to white list
     *
     * @function add_ip_whitelist
     * @memberof FirewallService
     * @param {number} catId
     * @param {string} admin_email
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async add_ip_whitelist(ip, admin_email, admin_id, cb) {
        try {
            let insert_ip = await mySql.query(`
                INSERT INTO whitelist_ips (ip,admin_email,admin_id) 
                VALUES ('${ip}' ,'${admin_email}',${admin_id})`)
            cb(null, insert_ip)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }

    /**
     * Get all whitelist ips 
     *
     * @function get_whitelist_ips
     * @memberof FirewallService
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async get_whitelist_ips(skip, limit, admin_id, cb) {
        try {
            let ips = await mySql.query(`
                SELECT id, ip, 
                (SELECT COUNT(*)  FROM whitelist_ips WHERE admin_id=${admin_id} ) AS 'total_count'
                FROM whitelist_ips 
                WHERE admin_id=${admin_id}
                LIMIT ${skip},${limit} `)
            cb(null, ips)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }
    async getWhitelistCount(admin_id) {
        return await mySql.query(`SELECT COUNT(*) AS count FROM whitelist_ips WHERE admin_id=${admin_id}`);
    }

    /**
     * Whitelist ips 
     *
     * @function whitelist_ips
     * @memberof FirewallService
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async whitelist_ips(ip, admin_id, cb) {
        try {
            let ips = await mySql.query(`
                SELECT id,ip 
                FROM whitelist_ips 
                WHERE ip='${ip}' AND admin_id=${admin_id} 
                `)
            cb(null, ips)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }

    async whitelistIPs(ip, admin_id) {
        return await mySql.query(`
                SELECT id,ip 
                FROM whitelist_ips 
                WHERE ip='${ip}' AND admin_id=${admin_id} 
                `);
    }

    /**
     * delete whitelist ips 
     *
     * @function delete_whitelist_ip
     * @memberof FirewallService
     * @param {string} ip
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async delete_whitelist_ip(ip, cb) {
        try {
            let delete_ip = await mySql.query(
                `DELETE from whitelist_ips WHERE id IN (${ip})  `
            )
            cb(null, delete_ip)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }
    /** edit whitelist ip */
    async edit_whitelist_ip(id, ip, cb) {
        try {
            let ip_edit = await mySql.query(
                `UPDATE whitelist_ips  SET ip='${ip}' WHERE id=${id}`
            )
            cb(null, ip_edit)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null)
        }
    }

    /**
     * Block user and department domains  
     *
     * @function blockUserDepartmentDomain
     * @memberof FirewallService
     * @param {string} entity_type
     * @param {array} entity_ids
     * @param {array} days_ids
     * @param {array} category_ids
     * @param {array} domain_ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async blockUserDepartmentDomain(admin_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, cb) {
        try {
            let block_domains = await mySql.query(`
                INSERT INTO blocked_user_dept_domains (entity_type,entity_ids, days_ids, category_ids,domain_ids,admin_id)
                VALUES ('${entity_type}','${entity_ids}','${days_ids}','${category_ids}','${domain_ids}',${admin_id})
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Check user department domains 
     *
     * @function checkUserDepartmentDomain
     * @memberof FirewallService
     * @param {string} entity_type
     * @param {array} entity_ids
     * @param {array} days_ids
     * @param {array} category_ids
     * @param {array} domain_ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async checkUserDepartmentDomain(admin_id, entity_type, entity_ids, days_ids, category_ids, domain_ids, cb) {
        try {
            let block_domains = await mySql.query(`
                SELECT * 
                FROM blocked_user_dept_domains
                WHERE admin_id=${admin_id} AND entity_type='${entity_type}' AND days_ids='${days_ids}' AND entity_ids='${entity_ids}' AND category_ids='${category_ids}' AND domain_ids='${domain_ids}'
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get user details 
     *
     * @function getUsersDetails
     * @memberof FirewallService
     * @param {array} ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getUsersDetails(ids, cb) {
        try {
            let users = await mySql.query(`
                SELECT u.id AS user_id,u.name
                FROM users u
                WHERE u.id IN (${ids})
                `);
            cb(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get department  details 
     *
     * @function getDepartmentDetails
     * @memberof FirewallService
     * @param {array} ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getDepartmentDetails(ids, cb) {
        try {
            let department = await mySql.query(`
                SELECT d.id AS department_id,d.name
                FROM department d
                WHERE d.id IN (${ids})
                `);
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    /**
     * Get days details 
     *
     * @function getdaysDetails
     * @memberof FirewallService
     * @param {array} ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getdaysDetails(ids, cb) {
        try {
            let days = await mySql.query(`
                SELECT d.id AS day_id,d.name
                FROM days d
                WHERE d.id IN (${ids})
                `);
            cb(null, days);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get category details 
     *
     * @function getCategoryDetails
     * @memberof FirewallService
     * @param {array} ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getCategoryDetails(ids, cb) {
        try {
            let category = await mySql.query(`
                SELECT c.id AS categories_id,c.name
                FROM categories c
                WHERE c.id IN (${ids})
                `);
            cb(null, category);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    /**
     * Get domains details 
     *
     * @function getDomainDetails
     * @memberof FirewallService
     * @param {array} ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getDomainDetails(ids, cb) {
        try {
            let domain = await mySql.query(`
                SELECT d.id AS domain_id,d.name AS domain_name,c.id AS categories_id,c.name AS category_name
                FROM domains d
                LEFT JOIN categories c ON d.categories_id=c.id
                WHERE d.id IN (${ids})
                `);
            cb(null, domain);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get  depsrtment domains details 
     *
     * @function getUserDepartmentDomain
     * @memberof FirewallService
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getUserDepartmentDomain(skip, limit, admin_id, cb) {
        try {
            let block_domains = await mySql.query(`
                SELECT * 
                FROM blocked_user_dept_domains
                WHERE admin_id=${admin_id}
                LIMIT ${limit}
                OFFSET ${skip}
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getUserDepartmentDomainCount(cb) {
        try {
            let block_domains = await mySql.query(`
                SELECT COUNT(*) AS total_count
                FROM blocked_user_dept_domains
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get single user depsrtment domains details 
     *
     * @function getSingleUserDepartmentDomain
     * @memberof FirewallService
     * @param {number} blocked_rule_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getSingleUserDepartmentDomain(blocked_rule_id, cb) {
        try {
            let block_domains = await mySql.query(`
                SELECT * 
                FROM blocked_user_dept_domains
                WHERE id=${blocked_rule_id}
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Delete user department  domain rule 
     *
     * @function deleteUserDepartmentDomainRule
     * @memberof FirewallService
     * @param {number} blocked_rule_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async deleteUserDepartmentDomainRule(blocked_rule_id, admin_id, cb) {
        try {
            let block_domains = await mySql.query(`
            DELETE FROM blocked_user_dept_domains 
            WHERE id IN (${blocked_rule_id}) AND admin_id=${admin_id}
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Update user department  domain rule 
     *
     * @function deleteUserDepartmentDomainRule
     * @memberof FirewallService
     * @param {number} blocked_rule_id
     * @param {array} entity_ids
     * @param {array} days_ids
     * @param {array} category_ids
     * @param {array} domain_ids
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async updateUserDepartmentDomainRule(blocked_rule_id, entity_ids, days_ids, category_ids, domain_ids, cb) {
        try {
            let block_domains = await mySql.query(`
                UPDATE blocked_user_dept_domains
                SET entity_ids = '${entity_ids}', days_ids= '${days_ids}', category_ids='${category_ids}' , domain_ids='${domain_ids}'
                WHERE id = ${blocked_rule_id}
            `);
            cb(null, block_domains);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async updateUserDepartmentDomainRuleStatus(blocked_rule_id, status, cb) {
        try {
            let rule = await mySql.query(`
                UPDATE blocked_user_dept_domains
                SET status=${status}
                WHERE id = ${blocked_rule_id}
            `);
            cb(null, rule);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async domainSearch(name, admin_id, skip, limit) {
        try {
            return await mySql.query(`
                SELECT d.id AS domain_id,d.categories_id,d.name AS domain_name, c.name AS categories_name,d.admin_id,
                (SELECT count(*) FROM domains dm WHERE (dm.name LIKE '%${name}%' AND d.admin_id=${admin_id})) AS total_count
                FROM domains d
                INNER JOIN categories c ON c.id=d.categories_id
                WHERE d.name LIKE '%${name}%' AND d.admin_id=${admin_id}
                LIMIT ${skip},${limit}    
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async userList(admin_id, user_ids, cb) {
        try {
            let users = await mySql.query(`
                SELECT u.id AS user_id, u.name AS first_name, u.full_name AS last_name,CONCAT(u.name, ' ',u.full_name) AS full_name,
                u.location_id,u.department_id,u.role_id,l.name AS location_name,r.name AS role_name,d.name AS department_name
                FROM users u 
                INNER JOIN location l ON l.id=u.location_id
                INNER JOIN department d ON d.id=u.department_id
                INNER JOIN role r ON r.id=u.role_id
                WHERE u.admin_id=${admin_id} AND u.id IN(${user_ids})
            `)
            cb(null, users);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async departmentList(admin_id, department_ids, cb) {
        try {
            let department = await mySql.query(`
                SELECT d.name,d.id AS department_id
                FROM department d
                WHERE d.admin_id=${admin_id} AND d.id IN(${department_ids})
            `)
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async domain(admin_id) {
        try {
            return await mySql.query(`
            SELECT d.categories_id,d.id AS domain_id,d.name AS domain_name, c.name AS categories_name
            FROM domains d
            INNER JOIN categories c ON c.id=d.categories_id 
            WHERE d.admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteDomains(domain_ids, admin_id) {
        try {
            return await mySql.query(`
            DELETE FROM domains WHERE id IN (${domain_ids}) AND admin_id =${admin_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateDomainCategory(domain_id, categories_id, cb) {
        try {
            let domain = await mySql.query(`
                UPDATE domains
                SET categories_id = ${categories_id}
                WHERE id = ${domain_id} 
            `);
            cb(null, domain);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async getAllRules(admin_id) {
        try {
            return await mySql.query(`
                        SELECT * 
                        FROM blocked_user_dept_domains
                        WHERE admin_id=${admin_id}
                    `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getCategoriesByName(category, admin_id) {
        try {
            return await mySql.query(`
                SELECT  id ,name  FROM categories WHERE name ='${category}' AND admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async addNewDomaim(category_id, name, admin_id) {
        try {
            return await mySql.query(`
               INSERT INTO domains (categories_id,name,admin_id)
               VALUES(${category_id},'${name}',${admin_id})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async insertCategories(name, admin_id) {
        try {
            return await mySql.query(`
            INSERT INTO categories (name,admin_id)
            VALUES('${name}',${admin_id})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkDomainByName(category_id, name, admin_id) {
        try {
            return await mySql.query(`
             SELECT id ,name FROM domains where name='${name}' and admin_id= ${admin_id} and categories_id=${category_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async checkDomainByNames(category_id, names, admin_id) {
        names = names.map(x => `"${x}"`)
        try {
            return await mySql.query(`
            SELECT d.id AS domain_id,c.id AS categories_id, d.name AS domain_name,c.name AS categories_name,d.admin_id
            FROM domains d
            INNER JOIN categories c ON c.id=d.categories_id
            WHERE d.admin_id=${admin_id} AND d.categories_id=${category_id} AND d.name IN(${names})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

}

module.exports = new FirewallService;