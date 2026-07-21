"use strict";

const firewallModel = require('./firewall.model');
const moment = require('moment-timezone');

class FirewallService {
    async getBlockedDomainsMongo(req, res, next) {
        const user = req.decoded;
        const dayId = moment().day();
        let userId = user.employee_id, departmentId = user.department_id;

        /**
         * parallely runs two function.
         * returns a single Promise that fulfills when both functions passed as an iterable have been fulfilled.
         * @returns {Promise.<Array.<*>>}
         */
        Promise
            .all([
                firewallModel.getBlockedUserDomainFromMongo(dayId, userId),
                firewallModel.getBlockedDepartmentDomainFromMongo(dayId, departmentId)
            ])
            .then(results => {
                let userBData = results[0], domainBData = results[1];
                if (userBData.length > 0 || domainBData.length > 0) {
                    return results;
                } else {
                    throw new Error('Blocked domains not found for today', 404);
                }
            })
            .then(domainNames => res.status(200).json({
                code: 200,
                message: 'Domain found',
                error: null,
                success: true,
                data: {
                    blockedForUser: domainNames[0][0],
                    blockedForDepartment: domainNames[1][0]
                }
            }))
            .catch(err => {
                return res.status(422).json({
                    code: err.statusCode,
                    error: err.message,
                    data: null,
                    success: false,
                    message: err.message
                });
            });
    }
}

module.exports = new FirewallService;