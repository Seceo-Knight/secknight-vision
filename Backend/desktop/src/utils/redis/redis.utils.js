const redis = require("redis");

const redisPassword = process.env.REDIS_PASSWORD;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisUrl = redisPassword
    ? `redis://:${encodeURIComponent(redisPassword)}@${redisHost}:6379`
    : `redis://${redisHost}:6379`;

const client = redis.createClient({ url: redisUrl });

client.on("ready", function () {
    console.log("=== Redis server connected (utils) ===");
});

client.on("error", function (err) {
    console.log("=== Error in connecting redis server (utils) ===");
    console.error(err.message);
});

client.connect().catch(err => console.error("Redis utils connect failed:", err.message));

const getAsync = (key) => client.get(String(key));
const setAsync = (key, value) => client.set(String(key), String(value));
const delAsync = (key) => client.del(String(key));



const setUserMetaData = (userId, userData) => {
    if (userId && parseInt(userId) > 0) {
        if (userData) {
            return setAsync(userId, JSON.stringify(userData))
                .then(data => {
                    return { code: 201, status: data === 'OK' }
                })
                .catch(err => {
                    return { code: 400, error: err };
                });
        } else {
            return { code: 404, error: 'UserData missing' };
        }
    } else {
        return { code: 404, error: 'UserId missing' };
    }
};

const getUserMetaData = (userId) => {
    if (userId && parseInt(userId) > 0) {

        return getAsync(userId)
            .then(data => {
                if (data === null) return { code: 404, error: 'Data not found', data: null };
                else return { code: 200, data: JSON.parse(data) };
            })
            .catch(err => {
                return { code: 404, error: err, data: null }
            });
    } else {
        return { code: 404, error: 'UserId missing' };
    }
};

const getApplicationInfo = () => {
    return getAsync('app-info')
        .then(data => {
            if (data === null) return { code: 404, error: 'Data not found', data: null };
            else return { code: 200, data: JSON.parse(data) };
        })
        .catch(err => {
            return { code: 404, error: err, data: null }
        });
};

module.exports = {
    setUserMetaData,
    getUserMetaData,
    getApplicationInfo,
    getAsync,
    setAsync,
    delAsync
};