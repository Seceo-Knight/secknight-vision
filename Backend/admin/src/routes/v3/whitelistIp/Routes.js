const router = require('express').Router();
const IpWhitelistController=require('./IpWhitelist.controller')

class ReportRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {
        this.myRoutes.post('/add-ip-whitelist', IpWhitelistController.addIpWhiteList);


        this.myRoutes.post('/get-ip-whitelist', IpWhitelistController.getIp);
        this.myRoutes.post('/delete-ip-whitelist', IpWhitelistController.deleteIp);
        this.myRoutes.post('/edit-ip-whitelist', IpWhitelistController.editIp);
    }

    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports = ReportRoutes;