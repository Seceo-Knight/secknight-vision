const redis = require("redis");
const client = redis.createClient({
    port: 6379,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
});

client.on("ready", function (conn) {
    console.log("=== Redis server conencted from Utils ===");
});

client.on("error", function (err) {
    console.log("=== Error in connecting redis server ===");
    console.error(err);
});


const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);



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