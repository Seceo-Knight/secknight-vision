const Model = require("./apiManagement.model");
const PasswordService = require("../auth/services/password.service");
const jwt = require('jsonwebtoken');
const redisService = require('../auth/services/redis.service');
const moment = require('moment');

class APIManagementController {

    async createToken(req, res, next) {
        try {
            let { organization_id, is_admin, ...rest } = req.decoded;
            if (!is_admin) return res.status(401).json({ message: "Unauthorized access" });
            let tokenPayload = {
                ...rest,
                organization_id: organization_id,
            };
            // Create JWT token
            const userToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_TOKEN_SECRET);
            // You can save userToken to DB or return as response
            await Model.saveToken(organization_id, userToken);
            let key = `organization:token:api:${organization_id}`;
            await redisService.setAsync(key, userToken);
            return res.json({ data: userToken, code: 200, message: "Token created successfully" });
        }
        catch (error) {
            next(error);
        }
    }

    verifyJWT(token) {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        } catch (err) {
            return null;
        }
    }

    async getTokens(req, res, next) {
        try {
            let { organization_id, is_admin } = req.decoded;
            if (!is_admin) return res.status(401).json({ message: "Unauthorized access" });
            // Fetch tokens from the database
            const [tokens] = await Model.getTokens(organization_id);
            let countKey = `rate_limit_count:${organization_id}`;
            let currentCount = await redisService.getAsync(countKey);
            return res.json({ data: {token: tokens, api_limit: currentCount}, code: 200, message: "Tokens fetched successfully" });
        }
        catch (error) {
            next(error);
        }
    }

    async deleteToken(req, res, next) {
        try {
            let { organization_id, is_admin } = req.decoded;
            if (!is_admin) return res.status(401).json({ message: "Unauthorized access" });

            // Logic to delete the token from the database
            const result = await Model.deleteToken(organization_id);
            if (result.affectedRows > 0) {
                let key = `organization:token:api:${organization_id}`;
                await redisService.delAsync(key);
                return res.json({ code: 200, message: "Token deleted successfully" });
            } else {
                return res.status(404).json({ message: "Token not found" });
            }
        }
        catch (error) {
            next(error);
        }
    }

    async getAPILogs(req, res, next) {
        try {
            let { organization_id } = req.decoded;
            let { skip = 0, limit = 10, search, start_date, end_date } = req.query;
            if(skip) skip = +skip;
            if(limit) limit = +limit;
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).add(1, 'days').format('YYYY-MM-DD');
            const [data, dataCount] = await Promise.all([
                Model.getAPILogs(skip, limit, search, organization_id, start_date, end_date),
                Model.getAPILogsCount(search, organization_id, start_date, end_date)
            ])
            return res.json({
                code: 200,
                data: { data, dataCount },
                error: null,
                message: "Success"
            })
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new APIManagementController();