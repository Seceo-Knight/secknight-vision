const redis = require("redis");

// Main Redis client
const client = redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
});

// Subscriber client
const subClient = redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST_SUBSCRIBER,
    password: process.env.REDIS_PASSWORD_SUBSCRIBER
}).duplicate();

// Publisher client
const pubClient = redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST_PUBLISHER,
    password: process.env.REDIS_PASSWORD_PUBLISHER
}).duplicate();

// Connection Event Handlers
client.on("ready", () => {
    console.log("=== Redis server connected (main client) ===");
});

client.on("error", (err) => {
    console.error("=== Error connecting to Redis server (main client) ===", err);
});

subClient.on("ready", () => {
    console.log("=== Redis subscriber connected ===");
});

subClient.on("error", (err) => {
    console.error("=== Error connecting to Redis subscriber ===", err);
});

pubClient.on("ready", () => {
    console.log("=== Redis publisher connected ===");
});

pubClient.on("error", (err) => {
    console.error("=== Error connecting to Redis publisher ===", err);
});

// Promisified Redis Methods
const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

// Utility Functions
const setUserMetaData = (userId, userData) => {
    if (userId && parseInt(userId) > 0) {
        if (userData) {
            return setAsync(userId, JSON.stringify(userData))
                .then((data) => ({ code: 201, status: data === "OK" }))
                .catch((err) => ({ code: 400, error: err }));
        } else {
            return { code: 404, error: "UserData missing" };
        }
    } else {
        return { code: 404, error: "UserId missing" };
    }
};

const getUserMetaData = (userId) => {
    if (userId && parseInt(userId) > 0) {
        return getAsync(userId)
            .then((data) => {
                if (data === null) return { code: 404, error: "Data not found", data: null };
                else return { code: 200, data: JSON.parse(data) };
            })
            .catch((err) => ({ code: 404, error: err, data: null }));
    } else {
        return { code: 404, error: "UserId missing" };
    }
};

const getApplicationInfo = () => {
    return getAsync("app-info")
        .then((data) => {
            if (data === null) return { code: 404, error: "Data not found", data: null };
            else return { code: 200, data: JSON.parse(data) };
        })
        .catch((err) => ({ code: 404, error: err, data: null }));
};

// Subscriber Function
const subscribeToChannel = (channel, callback) => {
    subClient.on("message", (receivedChannel, message) => {
        if (receivedChannel === channel) {
            // console.log(`Message received on channel "${channel}":`, message);
            try {
                const parsedMessage = message ? JSON.parse(message) : null;
                if (parsedMessage) callback(parsedMessage);
                else console.warn(`Empty or invalid message received on channel "${channel}"`);
            } catch (err) {
                console.error(`Error parsing message on channel "${channel}":`, err);
            }
        }
    });
    subClient.subscribe(channel);
};

// Publisher Function
const publishToChannel = async (channel, message) => {
    try {
        // console.log(`Publishing to channel "${channel}":`, message); // Log for debugging
        const response = await pubClient.publish(channel, JSON.stringify(message));
        return { code: 200, status: response };
    } catch (err) {
        console.error(`Error publishing to channel "${channel}":`, err);
        return { code: 500, error: err };
    }
};

// Graceful Shutdown
process.on("SIGINT", async () => {
    await client.quit();
    await subClient.quit();
    await pubClient.quit();
    console.log("Redis connections closed. Exiting...");
    process.exit(0);
});

module.exports = {
    setUserMetaData,
    getUserMetaData,
    getApplicationInfo,
    subscribeToChannel,
    publishToChannel,
    getAsync,
    setAsync,
    delAsync,
};
