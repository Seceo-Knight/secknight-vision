"use strict";

const firewallService = require('./firewall.service');

/**
 * contains unauthenticated routes's and server status routes's callback
 *
 * @class RootIndex
 */
class FirewallController {
    async getBlockedDomainsMongo(req, res, next) {
        return await firewallService.getBlockedDomainsMongo(req, res, next);
    }
}

module.exports = new FirewallController;