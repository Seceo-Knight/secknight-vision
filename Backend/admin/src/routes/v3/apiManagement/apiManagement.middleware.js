const Controller = require('./apiManagement.controller');
const Model = require('./apiManagement.model');
const redisService = require('../auth/services/redis.service');
const APILoggingSchema = require("../../../models/api_logging.schema");

const moment = require('moment-timezone');

const verifyAdmin = async (req, res, next) => {
    try {
        let token = req.headers['token'];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized access" });
        }
        let decoded = Controller.verifyJWT(token);
        req.decoded = decoded;
        req.tailored = true;
        let organization_id = req.decoded.organization_id;
        let key = `organization:token:api:${organization_id}`;
        let redisToken = await redisService.getAsync(key);
        if(redisToken !== token) return res.status(401).json({ message: "Unauthorized access" });
        // Optimize Redis calls using Promise.all
        let [planExpiry, organizationTimezone] = await Promise.all([
            redisService.getAsync(`plan_expiry:${organization_id}`),
            redisService.getAsync(`organization_timezone:${organization_id}`)
        ]);
        if (!planExpiry || !organizationTimezone) {
            let [orgPlan] = await Model.getOrganizationPlan(organization_id);
            if (!orgPlan) {
                return res.status(403).json({ message: "Organization plan not found." });
            }
            planExpiry = orgPlan.expiry;
            organizationTimezone = orgPlan.timezone;
            // Set both values in Redis concurrently
            await Promise.all([
                redisService.setAsync(`plan_expiry:${organization_id}`, planExpiry, 'EX', 60 * 60 * 6), // Cache for 6 hours
                redisService.setAsync(`organization_timezone:${organization_id}`, organizationTimezone, 'EX', 60 * 60 * 6) // Cache for 6 hours
            ]);
        }

        const expiryMoment = moment.tz(planExpiry, "YYYY-MM-DD", organizationTimezone);
        if (moment().tz(organizationTimezone).isAfter(expiryMoment)) {
            return res.status(403).json({ message: "Your plan has expired. Please renew your subscription." });
        }

        const path = req.path;
        const rateLimitKey = `rate_limit:${organization_id}:${path}`;
        // Check if rate limit key exists
        const limitExists = await redisService.getAsync(rateLimitKey);
        if (limitExists) {
            // Log the blocked request
            await APILoggingSchema.create({
                organization_id,
                method: req.method,
                endpoint: path,
                status_code: 429,
                request_body: req.body,
                response_body: { message: `Rate limit exceeded for this endpoint. Try again after 30 minutes.` },
                user_id: req.decoded.user_id || null
            });
            return res.status(429).json({ message: `Rate limit exceeded for this endpoint. Try again after 30 minutes.` });
        }
        // Wrap res.json to set rate limit only on 200 and log all requests
        const originalJson = res.json.bind(res);
        res.json = async (body) => {
            try {
                if (res.statusCode === 200) {
                    // await redisService.setAsync(rateLimitKey, '1', 'EX', 60 * 30);
                    let countKey = `rate_limit_count:${organization_id}`;
                    let currentCount = await redisService.getAsync(countKey);
                    currentCount = parseInt(currentCount, 10);
                    if (isNaN(currentCount)) {
                        currentCount = 0;
                    }
                    if (currentCount <= 0) {
                        // Log the blocked request
                        await APILoggingSchema.create({
                            organization_id,
                            method: req.method,
                            endpoint: path,
                            status_code: 429,
                            request_body: req.body,
                            response_body: { message: `API call limit reached for this organization.` },
                            user_id: req.decoded.user_id || null
                        });
                        return res.status(429).json({ message: `API call limit reached for this organization.` });
                    }
                    currentCount = currentCount - 1;
                    await redisService.setAsync(countKey, currentCount);
                }
                // Log every API call
                await APILoggingSchema.create({
                    organization_id,
                    method: req.method,
                    endpoint: path,
                    status_code: res.statusCode,
                    request_body: req.body,
                    response_body: body,
                    user_id: req.decoded.user_id || null
                });
            } catch (e) {
                console.log('API Logging error:', e);
            }
            return originalJson(body);
        };
        return next();
    } catch (error) {
        next(error);
    }
}

module.exports = verifyAdmin;