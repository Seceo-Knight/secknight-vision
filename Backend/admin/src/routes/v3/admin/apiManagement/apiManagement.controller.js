const redisService = require('../../auth/services/redis.service');
const Model = require('./apiManagement.model');

class Controller {
    updateAdminLimit = async (req, res) => {
        try {
            let { organization_id, limit } = req.body;
            if(limit) limit = +limit;
            if(limit == NaN) return res.status(400).json({
                code: 400,
                message: 'Invalid limit value. It should be a non-negative number.'
            });
            // check if limit is a valid number either positive or zero
            if (typeof limit !== 'number' || limit < 0) {
                return res.status(400).json({
                    code: 400,
                    message: 'Invalid limit value. It should be a non-negative number.'
                });
            }
            let countKey = `rate_limit_count:${organization_id}`;
            await redisService.setAsync(countKey, limit);
            return res.json({
                code: 200,
                message: 'Admin limit updated successfully.',
                data: { currentCount: limit }
            });
        }
        catch (error) {
            res.status(500).json({
                code: 500,
                message: 'An error occurred while updating the admin limit.',
                error: error.message
            });
        }
    }

    getAdminLimit = async (req, res) => {
        try {
            let { organization_id } = req.body;
            let countKey = `rate_limit_count:${organization_id}`;
            let currentCount = await redisService.getAsync(countKey);
            if (currentCount === null) {
                currentCount = 0; // Default to 0 if no count is found
            } else {
                currentCount = parseInt(currentCount, 10);
            }
            return res.json({
                code: 200,
                message: 'Admin limit retrieved successfully.',
                data: { currentCount }
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: 'An error occurred while retrieving the admin limit.',
                error: error.message
            });
        }
    }

    async getAllAdmin(req, res, next) {
        try {
            let { skip, limit, search } = req.query;
            let [data, count] = await Promise.all([
                Model.getAdmin(skip, limit, search),
                Model.getAdminCount(search)
            ]);
            return res.json({
                code: 200,
                data: { data, count},
                message: "Success"
            })
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: 'An error occurred while retrieving the admin limit.',
                error: error.message
            });
        }
    }
}

module.exports = new Controller();