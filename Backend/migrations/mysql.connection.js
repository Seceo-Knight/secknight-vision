'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const mysql = require('mysql2');
const util = require('util');

/**
 * MySQL Class for DB connection availability
 * It's follows Singlton Design Pattern
 * 
 * Once the connection is made it is stored in the conenction pool
 * and when ever is need it is being pulled and used 
 * 
 * Only 1 object of this class is created 
 */
class MySqlSingelton {

    constructor(flag) {
        this.createPool(flag);
    }

    createPool(ifDatabase) {
        const poolObj = {
            connectionLimit: parseInt(process.env.MYSQL_POOL_CONNECTION_LIMIT),
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            timezone: 'Z',
            charset: 'utf8mb4',
            multipleStatements: true
        };
        if (ifDatabase) poolObj.database = process.env.MYSQL_DATABASE_NAME;
        this.mySqlPool = mysql.createPool(poolObj);

        // Disable ONLY_FULL_GROUP_BY to maintain MariaDB-compatible GROUP BY behavior
        this.mySqlPool.on('connection', function (connection) {
            connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        });
    }

    static get getInstance() {
        if (!this.mySqlPool) {
            this.mySqlPool = new MySqlSingelton(0).mySqlPool;
        }
        return this.getMysqlConnection();
    }

    static get getInstanceDb() {
        this.mySqlPool = new MySqlSingelton(1).mySqlPool;
        return this.getMysqlConnection();
    }

    static getMysqlConnection() {
        this.mySqlPool.getConnection(function (err, connection) {
            if (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.error('Database connection was closed.')
                }
                if (err.code === 'ER_CON_COUNT_ERROR') {
                    console.error('Database has too many connections.')
                }
                if (err.code === 'ECONNREFUSED') {
                    console.error('Database connection was refused.')
                }
            }
            if (connection) connection.release();
        });

        // Refactoring MySQL to Node.js 8’s Async/Await
        this.mySqlPool.query = util.promisify(this.mySqlPool.query);
        return this.mySqlPool;
    }
}

module.exports = MySqlSingelton;