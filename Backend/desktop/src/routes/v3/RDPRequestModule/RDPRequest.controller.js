const net = require('net');

let redisService = require("../../../utils/redis/redis.utils");

const jwtService = require('../auth/services/jwt.service');
const errorHandler = require('../../../utils/helpers/ErrorResponse');
const shortnerService = require('../auth/services/shortner.service');


class RDPRequestController {

    async rdpConnectionOpen(req, res, next) {
        try {
            let ip = req.body.ip;
            if(!ip || !isValidIPv4(ip)) {
                return res.status(400).json({ error: 'Invalid IP address', message: 'IP address is required and must be a valid IPv4 address.', data: null, code: 400 });
            }
            let employee_id = req.decoded.employee_id;
            await redisService.setAsync(`${ip}_RDP_TOKEN`, employee_id, 'EX', 60 * 60 * 9);
            return res.status(200).json({ error: null, message: 'Data saved successfully', data: null, code: 200 });
        } catch (error) {
            next(error);
        }
    }

    async rdpConnectionClose(req, res, next) {
        try {
            let ip = req.body.ip;
            if(!ip || !isValidIPv4(ip)) {
                return res.status(400).json({ error: 'Invalid IP address', message: 'IP address is required and must be a valid IPv4 address.', data: null, code: 400 });
            }
            await redisService.delAsync(`${ip}_RDP_TOKEN`);
            return res.status(200).json({ error: null, message: 'Data deleted successfully', data: null, code: 200 });
        } catch (error) {
            next(error);
        }
    }

    async getRDPToken(req, res, next) {
        try {
            let ip = req.query.ip;
            if(!ip || !isValidIPv4(ip)) {
                return res.status(400).json({ error: 'Invalid IP address', message: 'IP address is required and must be a valid IPv4 address.', data: null, code: 400 });
            }
            const employee_id = await redisService.getAsync(`${ip}_RDP_TOKEN`);
            if (employee_id) {

                let token = await redisService.getAsync(`agent:active:token:${employee_id}`);


                const invalidToken = await redisService.getAsync(token);
                if (invalidToken) {
                  const message = invalidToken === "deleted" ? "Invalid token deleted" : "Invalid token";
                  return next(new errorHandler(message, 401));
                }
              
                const decodedToken = await jwtService.verify(token);
                const userData = JSON.parse(decodedToken);
              
                if (!userData?.user_id) {
                  return next(new errorHandler("Invalid token", 401));
                }
              
                const userId = userData.user_id;
              
                const [userMetaData, requestCount] = await Promise.all([
                  redisService.getUserMetaData(userId),
                  redisService.getAsync(`${userId}_agent_request`)
                ]);
              
                if (userMetaData?.code !== 200 || !userMetaData.data) {
                  return next(new errorHandler("Invalid token", 401));
                }
              
                const currentRequestCount = ~~requestCount;
              
                const MAX_REQUEST = process.env.MAX_REQUEST_ALLOWED || 20;
                const REQUEST_WINDOW = process.env.MAX_REQUEST_ALLOWED_TIMEFRAME || 60;
              
                if (currentRequestCount >= MAX_REQUEST) {
                  return next(new errorHandler("Exceeded the number of allotted requests in a specific time frame", 401));
                }
              
                await redisService.setAsync(`${userId}_agent_request`, currentRequestCount + 1, 'EX', REQUEST_WINDOW);
                


                return res.json({
                    success: true, accessToken: token,
                    identifier: shortnerService.shorten(+process.env.SHORTNER_DEFAULT_ADDED_VALUE + userId),
                    ...userMetaData.data
                });
            } else {
                return res.status(404).json({ error: 'Token not found', message: 'No token found for the given IP address.', data: null, code: 404 });
            }
        } catch (error) {
            next(error);
        }
    }

}


module.exports = new RDPRequestController();


function isValidIPv4(ip) {
    return net.isIP(ip) === 4;
}