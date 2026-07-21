const redis = require("redis");
const { promisify } = require("util");
let client = null;

client = redis.createClient({
    port: 6379,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
});


client.on("ready", (conn) => console.log("=== Redis server conencted ==="));
client.on("error", (err) => console.log("=== Error in connecting redis server === \n", err));

module.exports = {
    getAsync: promisify(client.get).bind(client),
    setAsync: promisify(client.set).bind(client)
};