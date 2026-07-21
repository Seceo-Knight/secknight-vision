'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const mysql = require('mysql2');
const util = require('util');
const testConfig = require('../config/test.json');

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

    constructor() {
        if (process.env.NODE_ENV === 'test') {
            this.mySqlPool = mysql.createPool({
                connectionLimit: parseInt(process.env.MYSQL_POOL_CONNECTION_LIMIT),
                host: testConfig.dbConfig.host,
                user: testConfig.dbConfig.username,
                database: testConfig.dbConfig.dbName,
                timezone: 'Z',
                charset: 'utf8mb4'
            });
        } else {
            this.mySqlPool = mysql.createPool({
                connectionLimit: parseInt(process.env.MYSQL_POOL_CONNECTION_LIMIT),
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USERNAME,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DBNAME,
                timezone: 'Z',
                charset: 'utf8mb4',
                // mysql2 v3 auto-parses MySQL JSON columns into JS objects;
                // the legacy `mysql` driver returned them as strings. Keep
                // the legacy behavior so existing JSON.parse(row.pack) /
                // JSON.parse(user.shift) call sites continue to work.
                typeCast: function (field, next) {
                    if (field.type === 'JSON') {
                        return field.string();
                    }
                    return next();
                }
            });
        }

        // Disable ONLY_FULL_GROUP_BY to maintain MariaDB-compatible GROUP BY behavior
        this.mySqlPool.on('connection', function (connection) {
            connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        });
    }

    static getInstance() {
        if (!this.mySqlPool) {
            this.mySqlPool = new MySqlSingelton().mySqlPool;
        }

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
                if (err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
                    console.error('Query timedout, takin too much time');
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