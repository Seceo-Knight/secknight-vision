const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;


class LocationCURD {

    /**
     * Add location details
     *
     * @function addLocation
     * @memberof LocationCURD
     * @param {string} name
     * @param {string} short_name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async addLocation(name, short_name, admin_id, timezone, timezone_offset, cb) {
        try {
            let location = await mySql.query(`
            INSERT INTO location(name, short_name, admin_id, timezone, timezone_offset)
            VALUES (?,?,?,?,?)
            `, [name, short_name, admin_id, timezone, timezone_offset]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Retrive location details
     *
     * @function retrieveLocation
     * @memberof LocationCURD
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async retrieveLocation(admin_id, skip, limit, cb) {
        try {
            let location = await mySql.query(
                `SELECT id ,name,short_name,timezone,timezone_offset
                FROM location
                WHERE admin_id=?
                LIMIT ?, ?`, [admin_id, skip, limit]
            );
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Retrive single location details
     *
     * @function getSingleLocation
     * @memberof LocationCURD
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getSingleLocation(admin_id, skip, limit, cb) {
        try {
            let location = await mySql.query(
                `SELECT id AS location_id,name AS location,short_name,timezone,timezone_offset
                FROM location
                WHERE admin_id=?
                LIMIT ?, ?`, [admin_id, skip, limit]
            );
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Delete location details
     *
     * @function deleteLocation
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async deleteLocation(location_id, admin_id, cb) {
        try {
            let location = await mySql.query(
                `DELETE FROM location WHERE id=? AND admin_id=?`, [location_id, admin_id]
            );
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Search user By Location Id 
     *
     * @function searchUserByLocation
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async searchUserByLocation(location_id, cb) {
        try {
            let location = await mySql.query(
                `SELECT * FROM users WHERE location_id=?`, [location_id]
            );
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Search user By Location name 
     *
     * @function searchByLocationName
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async searchByLocationName(name, location_id, admin_id) {
        let query = `SELECT name,id
                    FROM location
                    WHERE name=? AND id !=? AND admin_id=?`;

        return await mySql.query(query, [name, location_id, admin_id]);
    }
    /**
     * Update location details 
     *
     * @function updateLocation
     * @memberof LocationCURD
     * @param {string} name
     * @param {number} location_id
     * @param {string} short_name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async updateLocation(values, condition) {
        let query = `UPDATE location
                SET ${values}
                WHERE ${condition};`

        return await mySql.query(query);
    }
    // async updateLocation(name, location_id, short_name, cb) {
    //     try {
    //         let location = await mySql.query(`
    //             UPDATE location
    //             SET name='${name}', short_name= '${short_name}'
    //             WHERE id = ${location_id};
    //         `);
    //         cb(null, location);
    //     } catch (err) {
    //         Logger.error(`----error-----${err}------${__filename}----`);
    //         cb(err, null);
    //     }
    // }

    /**
     * Get location with department details
     *
     * @function fetchLocationWithDepartment
     * @memberof LocationCURD
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async fetchLocationWithDepartment(skip, limit, cb) {
        try {
            let location = await mySql.query(`
                SELECT l.id AS location_id, l.name as location
                FROM location l
                INNER JOIN depart_to_loc dl ON l.id = dl.location_id
                GROUP BY l.id
                LIMIT ?,?`, [skip, limit]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get department and location details
     *
     * @function locationWithDepartment
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async locationWithDepartment(location_id, admin_id, cb) {
        try {
            let location = await mySql.query(`
                SELECT dl.department_id AS department_id,d.name
                FROM depart_to_loc dl
                INNER JOIN department d ON d.id = dl.department_id
                WHERE location_id=? AND dl.admin_id=?`, [location_id, admin_id]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Add department to location 
     *
     * @function addDepartmentToLocation
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {number} department_id 
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async addDepartmentToLocation(location_id, department_id, admin_id, cb) {
        try {
            let location = await mySql.query(`
                INSERT INTO depart_to_loc (location_id,department_id,admin_id)
                VALUES (?,?,?)
            `, [location_id, department_id, admin_id]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Add new department
     *
     * @function addNewDepartment
     * @memberof LocationCURD
     * @param {string} department_name
     * @param {string} dept_short_name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async addNewDepartment(department_name, dept_short_name, admin_id, cb) {
        try {
            let location = await mySql.query(`
            INSERT INTO department (name ,short_name,admin_id)
                 SELECT * FROM (SELECT ? ,?,?) AS tmp
                 WHERE NOT EXISTS (
                 SELECT name FROM department WHERE name = ? AND admin_id=?
                 ) LIMIT 1

            `, [department_name, dept_short_name, admin_id, department_name, admin_id]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Delete department from location  
     *
     * @function deleteDepartmentFromLocation
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {number} department_id 
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async deleteDepartmentFromLocation(location_id, department_id, admin_id, cb) {
        let department_ids_arr = department_id.split(",");
        try {
            let location = await mySql.query(`
            DELETE from depart_to_loc WHERE location_id=? AND department_id IN (?) AND admin_id=?
            `, [location_id, department_ids_arr, admin_id])
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Check user  from departments   
     *
     * @function checkUserDepartment
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {number} department_id 
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    //DELETE from depart_to_loc WHERE location_id=${location_id} AND department_id IN (${department_ids})
    async checkUserInDepartment(location_id, department_id, admin_id, cb) {
        let department_ids_arr = department_id.split(",");
        try {
            let location = await mySql.query(`
            SELECT u.id,u.name ,d.name AS department_name
            FROM users u
            INNER JOIN department d ON d.id=u.department_id
            WHERE u.location_id=? AND u.department_id IN (?) AND d.admin_id=?
        `, [location_id, department_ids_arr, admin_id])
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get get single department and location data 
     *
     * @function getSingleLocationWithDepatment
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {number} department_id 
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getSingleLocationWithDepatment(location_id, department_id, admin_id, cb) {
        try {
            let location = await mySql.query(`
                SELECT * FROM depart_to_loc WHERE location_id=? AND department_id=? AND admin_id=?
            `, [location_id, department_id, admin_id])
            cb(null, location);
        } catch (err) {
            cb(err, null);
        }
    }

    /**
     * Add department to location 
     *
     * @function addDepartmentToLocation
     * @memberof LocationCURD
     * @param {number} location_id
     * @param {number} department_id 
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async checkDepartmentToLocation(location_id, department_ids, admin_id, cb) {
        try {
            let location = await mySql.query(`
            SELECT dl.department_id,dl.location_id,d.name AS department_name ,l.name AS location_name
            FROM depart_to_loc dl
            INNER JOIN   department d ON d.id=dl.department_id
            INNER JOIN   location l ON l.id=dl.location_id
            WHERE location_id=? AND department_id IN (?)  AND dl.admin_id=?
            `, [location_id, department_ids, admin_id]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Check the location in database 
     *
     * @function checkLocation
     * @memberof LocationCURD
     * @param {string} name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async checkLocation(name, admin_id, cb) {
        try {
            let location = await mySql.query(`
                SELECT id
                FROM location
                WHERE name=? AND admin_id=?
            `, [name, admin_id]);
            cb(null, location);
        } catch (err) {
            console.log(err)
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Check the department in database  
     *
     * @function checkDepartment
     * @memberof LocationCURD
     * @param {string} name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async checkDepartment(name, admin_id, cb) {
        try {
            let location = await mySql.query(
                `SELECT id FROM department WHERE name=? AND admin_id=?`, [name, admin_id]
            );
            cb(null, location);
        } catch (err) {
            console.log('==========', err);
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * get all department  
     *
     * @function getDepartment
     * @memberof LocationCURD
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async getDepartment(admin_id, cb) {
        try {
            let location = await mySql.query(
                `SELECT id,name
                 FROM department
                 WHERE admin_id=?
                 `, [admin_id]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    /**SELECT * FROM depart_to_loc WHERE department_id IN (${department_ids}) AND location_id=${location_id} */
    async checkDepartmentExistsToLocation(admin_id, location_id, department_ids, cb) {
        try {
            if (department_ids) {
                let department = await mySql.query(`
                SELECT dl.department_id,dl.location_id,d.name AS department_name ,l.name AS location_name
                FROM depart_to_loc dl
                INNER JOIN   department d ON d.id=dl.department_id
                INNER JOIN   location l ON l.id=dl.location_id
                WHERE location_id=? AND department_id IN (?) AND dl.admin_id=?
                `, [location_id, department_ids, admin_id]);
                cb(null, department);
            } else {
                cb(null, []);
            }
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Check the multple department in database  
     *
     * @function checkMultipleDepartment
     * @memberof LocationCURD
     * @param {string} name
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async checkMultipleDepartment(name, admin_id, cb) {
        try {
            if (!name) {
                name = ['fdgdsfgdsfgsdfg123224234123213', '12132423edewrqweradsfasdfsdf']
            }
            let location = await mySql.query(
                `SELECT name,id FROM department WHERE name IN (?) AND admin_id=?`, [name, admin_id]
            );
            cb(null, location);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Add new department 
     *
     * @function addNewDepartment
     * @memberof LocationCURD
     * @param {string} department_name
     * @param {string} dept_short_name 
     * @param {*} cb
     * @returns {Object} -Data or Error.
     */
    async addMultipeDepartment(department, cb) {
        try {
            let location = await mySql.query(`
            INSERT INTO department (name,short_name,admin_id)
            VALUES ?`, [department]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async addMultipeDepartmentToLoction(department_to_location, cb) {
        try {
            let location = await mySql.query(`
            INSERT INTO depart_to_loc (department_id,location_id,admin_id)
            VALUES ?`, [department_to_location]);
            cb(null, location);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async checkLoc(name, admin_id) {
        return await mySql.query(`SELECT id,timezone,timezone_offset  FROM location WHERE name=? AND admin_id=?`, [name, admin_id]);
    }

    async addLoc(name, short_name, admin_id, timezone, timezone_offset) {
        return await mySql.query(`
            INSERT INTO location (name,short_name,admin_id,timezone,timezone_offset)
            VALUES (?,?,?,?,?)
            `, [name, short_name, admin_id, timezone, timezone_offset]);
    }

    async checkDept(name, admin_id) {
        return await mySql.query(`SELECT id FROM department WHERE name=? AND admin_id=?`, [name, admin_id]);
    }

    async getSingleLocWithDept(location_id, department_id, admin_id) {
        return await mySql.query(`SELECT * FROM depart_to_loc WHERE location_id=? AND department_id=? AND admin_id=?`, [location_id, department_id, admin_id]);
    }

    async addDeptToLoc(location_id, department_id, admin_id) {
        return await mySql.query(`
                INSERT INTO depart_to_loc (location_id,department_id,admin_id)
                VALUES (?,?,?)
            `, [location_id, department_id, admin_id]);
    }

}

module.exports = new LocationCURD;
// DELETE FROM depart_to_loc WHERE location_id=${location_id} AND department_id=${department_id}

// mySql.query(`
// SELECT * FROM depart_to_loc WHERE location_id=${location_id} AND department_id=${department_id}
// `).then(data => {
// return { error: null, data: data }
// }).catch(error => {
// return { error: error, data: null }
// })

// (async function () {
//     try {
//         let location = await mySql.query(`
//         INSERT INTO location (name,short_name) VALUES('bijapur','bij');
//             `)
//         console.log('=====================================', location);
//     } catch (err) {
//         console.log('============================', err);
//     }
// })();


// INSERT INTO location (name, short_name)
//                     SELECT * FROM (SELECT '${name}', '${short_name}') AS tmp
//                     WHERE NOT EXISTS (SELECT name FROM department WHERE name = '${name}') 
//                     LIMIT 1

// INSERT INTO location (name)
// SELECT * FROM (SELECT 'raichure') AS tmp
// WHERE NOT EXISTS (
//     SELECT name FROM location WHERE name = 'raichure'
// ) LIMIT 1;


// INSERT INTO department (name,short_name)
// VALUES ('${department_name}','${dept_short_name}');