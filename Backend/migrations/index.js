require("dotenv").config();
const _ = require("underscore");

const OrganizationCategorySchema = require('./model/Organization.Schema');
const { default: mongoose } = require("mongoose");

const mySql = require('./mysql.connection').getInstance;
const fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'emp-monitor.sql');

// Close a mysql2 pool exactly once, tolerating an already-closed pool.
// pool.end() here uses the callback API and may throw synchronously if the
// pool is already closed, so guard it and resolve on the callback.
function endPool(pool) {
    return new Promise((resolve) => {
        try {
            pool.end(() => resolve());
        } catch (e) {
            resolve();
        }
    });
}

fs.readFile(filePath, { encoding: 'utf-8' }, async function (err, data) {
    if (err) {
        console.log(err);
        return;
    }

    console.log("=========MIGRATION ON PROCESS===============");

    const dbName = process.env.MYSQL_DATABASE_NAME;

    // Pool A: no database selected — used only to (re)create the database.
    //
    // This dump is NOT idempotent: the PRIMARY KEYs are added in separate
    // `ALTER TABLE ... ADD PRIMARY KEY` statements (no IF NOT EXISTS), so
    // re-running it over an existing schema fails with ER_MULTIPLE_PRI_KEY.
    // Dropping first guarantees a clean schema on every run. Set
    // FRESH_DB=false in the env to skip the drop (e.g. to protect real data).
    const freshDb = (process.env.FRESH_DB || 'true').toLowerCase() !== 'false';
    let mySqlPrime;
    try {
        if (freshDb) {
            console.log(`Dropping database \`${dbName}\` for a clean migration...`);
            await mySql.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        }
        await mySql.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    } catch (error) {
        console.log({ error });
        await endPool(mySql);
        return;
    }
    await endPool(mySql);

    // Pool B: connected with the database selected — runs the schema dump.
    try {
        mySqlPrime = require('./mysql.connection').getInstanceDb;
        await mySqlPrime.query(data);
        await mongoose.connect(process.env.MONGO_URL);
        await OrganizationCategorySchema.insertData();
        console.log("=========MIGRATION COMPLETED===============");
    } catch (error) {
        console.log({ error });
    } finally {
        if (mySqlPrime) await endPool(mySqlPrime);
        await mongoose.connection.close().catch(() => {});
    }
});