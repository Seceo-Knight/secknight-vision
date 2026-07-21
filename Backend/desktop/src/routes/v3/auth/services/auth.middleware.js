const jwtService = require('./jwt.service');
const errorHandler = require('../../../../utils/helpers/ErrorResponse');
// let redis = require('./redis.service');
let redis = require('../../../../utils/redis/redis.utils');

const config = require('../../../../../../config/config.js');

let screenshotCustomRequestLimit = [...config.CUSTOM_SCREENSHOT_FREQUENCY_120_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_180_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_240_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_360_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_480_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_600_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_720_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_900_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_1200_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_1800_PER_HOUR, ...config.CUSTOM_SCREENSHOT_FREQUENCY_3600_PER_HOUR];

let MAX_REQUEST_ALLOWED = process.env.MAX_REQUEST_ALLOWED;

class AuthMiddlewareService {

    async authenticate(req, res, next) {
        const authHeader = req.headers['authorization'];
        const accessToken = authHeader && authHeader.split(' ')[1];

        if(accessToken === 'PLAN_EXPIRY_TOKEN') {
            if(req.path !== "/user/config") return next(new errorHandler('Un-Authorized Access(Missing accessToken)', 401));
            return sendPlanExpiryResponse(req, res, next);
        }

        if (!accessToken) {
            return next(new errorHandler('Un-Authorized Access(Missing accessToken)', 401));
            // return next(new errorHandler('Token not verified', 401));
        }

        try {
            const invalidToken = await redis.getAsync(accessToken);
            if (invalidToken) {
                if (invalidToken === "deleted") return next(new errorHandler('Invalid token deleted', 401));
                return next(new errorHandler('Invalid token', 401));
            }

            let userData = JSON.parse(await jwtService.verify(accessToken));
          if (userData && userData.user_id && !userData.extension) {
            let [userMetaData, requestCount] = await Promise.all([
              await redis.getUserMetaData(userData.user_id),
              await redis.getAsync(`${userData.user_id}_agent_request`)
            ]);
            // let userMetaData = await redis.getUserMetaData(userData.user_id);
            if (userMetaData.code == 200 && userMetaData.data) {
              req.decoded = userMetaData.data;
              if (~~requestCount > (MAX_REQUEST_ALLOWED || 20) - 1 && !screenshotCustomRequestLimit.includes(userData?.organization_id)) {
                return next(new errorHandler('Exceeded the number of allotted requests in a specific time frame', 401));
              }
              if (!screenshotCustomRequestLimit.includes(userData?.organization_id)) {
                await redis.setAsync(`${userData.user_id}_agent_request`, ~~requestCount + 1, 'EX', (process.env.MAX_REQUEST_ALLOWED_TIMEFRAME || 60));
              }
              next();
            } else {
              return next(new errorHandler('Invalid token', 401));
              // next(new errorHandler('Token not verified', 401));
            }
          }
          else if (userData && userData.user_id && userData.extension) {
            let [userMetaData] = await Promise.all([
              await redis.getUserMetaData(`${userData.user_id}_extension`),
            ]);
            // let userMetaData = await redis.getUserMetaData(userData.user_id);
            if (userMetaData.code == 200 && userMetaData.data) {
              req.decoded = userMetaData.data;
              next();
            } else {
              return next(new errorHandler('Invalid token', 401));
              // next(new errorHandler('Token not verified', 401));
            }
          }
          else {
            return next(new errorHandler('Invalid token', 401));
            // next(new errorHandler('Token not verified', 401));
          }
        } catch (err) {
            return next(new errorHandler('Invalid token', 401));
        }
    }
}

module.exports = new AuthMiddlewareService;



const sendPlanExpiryResponse = (req, res, next) => {
    try {
        return res.json({
            "code": 200,
            "error": null,
            "message": "User configs",
            "data": {
              "system": {
                "type": 0,
                "visibility": true,
                "autoUpdate": 1,
                "tracking": 1
              },
              "screenshot": {
                "frequencyPerHour": 60,
                "employeeAccessibility": false,
                "employeeCanDelete": false
              },
              "features": {
                "application_usage": 1,
                "keystrokes": 1,
                "web_usage": 1,
                "block_websites": 1,
                "screenshots": 1,
                "screen_record": 0
              },
              "screenRecord": {
                "ultrafast_1280_21": 0,
                "ultrafast_1080_21": 0,
                "ultrafast_720_21": 0
              },
              "pack": {
                "id": "1",
                "expiry": "2029-12-07"
              },
              "breakInMinute": 30,
              "idleInMinute": 10,
              "timesheetIdleTime": "00:00",
              "trackingMode": "unlimited",
              "tracking": {
                "unlimited": {
                  "day": "1,2,3,4,5,6"
                },
                "fixed": {
                  "mon": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "18:00"
                    }
                  },
                  "tue": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "18:00"
                    }
                  },
                  "wed": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "18:00"
                    }
                  },
                  "thu": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "18:00"
                    }
                  },
                  "fri": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "18:00"
                    }
                  },
                  "sat": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "15:00"
                    }
                  },
                  "sun": {
                    "status": false,
                    "time": {
                      "start": "09:00",
                      "end": "18:00"
                    }
                  }
                },
                "domain": {
                  "suspendPrivateBrowsing": false,
                  "suspendKeystrokesPasswords": false,
                  "monitorOnly": [],
                  "suspendMonitorWhenVisited": [],
                  "suspendMonitorWhenVisitedInCategory": [],
                  "suspendMonitorWhenContains": [],
                  "suspendKeystrokesWhenVisited": [],
                  "daysAndTimes": {},
                  "websiteBlockList": []
                },
                "networkBased": [],
                "projectBased": [],
                "geoLocation": []
              },
              "task": {
                "employeeCanCreateTask": false
              },
              "logoutOptions": {
                "option": 2,
                "specificTimeUTC": "23:59",
                "specificTimeUser": "23:59",
                "afterFixedHours": 8
              },
              "productiveHours": {
                "mode": "fixed",
                "hour": "08:00"
              },
              "manual_clock_in": 0,
              "productivityCategory": 0,
              "usbDisable": 1,
              "agentUninstallCode": "",
              "systemLock": 0,
              "logo": "",
              "announcemnts": [],
              "roomId": "931d6d471c1fb7c24c44defc1393b99:2db7c45f689ca974529827939594008",
              "first_name": "Plan",
              "last_name": "Expiry"
            }
        })
    } catch (error) {
        next(error);
    }
}