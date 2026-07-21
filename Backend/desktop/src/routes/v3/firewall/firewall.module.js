'use strict';

const router = require('express').Router();

const firewallController = require('./firewall.controller');

class FirewallModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/blocked-domains', firewallController.getBlockedDomainsMongo);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = FirewallModule;