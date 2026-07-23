const redis = require('./redis');
const jwtService = require('./jwt.services')

const agentValidation = async (ws, wss, parseMessage) => {
    console.log(`[DIAG] agentValidation called, token present: ${!!parseMessage.token}, token length: ${parseMessage.token ? parseMessage.token.length : 0}`);
    if(!parseMessage.token) return ws.close();
    try {
        const invalidToken = await redis.getAsync(parseMessage.token);
        if (invalidToken) {
            console.log(`[DIAG] agentValidation: token found in Redis invalid/blacklist set -> ${invalidToken}`);
            if (invalidToken === "deleted") return false;
            return false;
        }

        let verified;
        try {
            verified = await jwtService.verify(parseMessage.token);
        } catch (verifyErr) {
            console.log(`[DIAG] agentValidation: jwtService.verify threw:`, verifyErr);
            return false;
        }
        let userData = JSON.parse(verified);
        console.log(`[DIAG] agentValidation: token verified OK, decoded user_id = ${userData && userData.user_id}`);
        if (userData && userData.user_id) {
            let [userMetaData, requestCount] = await Promise.all([
                await redis.getUserMetaData(userData.user_id),
                await redis.getAsync(`${userData.user_id}_agent_request`)
            ]);
            console.log(`[DIAG] agentValidation: getUserMetaData code=${userMetaData.code} hasData=${!!userMetaData.data} error=${userMetaData.error}`);
            if (userMetaData.code === 200 && userMetaData.data) {
                let decoded = userMetaData.data;
                return decoded;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (err) {
        console.log(`[DIAG] agentValidation: caught exception:`, err);
        return false;
    }
}


module.exports = agentValidation;