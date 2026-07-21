const router = require('express').Router();

const FirewallController = require('./Firewall.controller')
// const Url = require('../urlCategarazation/Url.service');




class FirewallRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {

        this.myRoutes.post('/add-category', FirewallController.addCategory);
        this.myRoutes.get('/get-category', FirewallController.getCategoies);
        this.myRoutes.put('/update-category', FirewallController.updateCategory);
        this.myRoutes.delete('/delete-category', FirewallController.deleteCategory);
        this.myRoutes.post('/add-domain', FirewallController.addDomains);
        this.myRoutes.get('/domains', FirewallController.fetchDomains);
        this.myRoutes.delete('/delete-domains', FirewallController.deleteDomains);
        this.myRoutes.put('/update-domain', FirewallController.UpdateDomains);
        this.myRoutes.get('/get-category-domains', FirewallController.getCategoryDomain);
        this.myRoutes.post('/add-domain-bulk', FirewallController.bulkDomainAdd);
        this.myRoutes.post('/block-user-dept-domains', FirewallController.blockUserDepartmentBlock);
        this.myRoutes.put('/update-status-blocked-user-dept-domains', FirewallController.updateUserDepartmentBlockDetailsStatus);
        this.myRoutes.delete('/delete-blocked-user-dept-domains', FirewallController.deleteUserDepartmentBlockDetails);
        this.myRoutes.put('/update-blocked-user-dept-domains', FirewallController.updateUserDepartmentBlockDetails);
        this.myRoutes.post('/upload-category-domains', FirewallController.domainUploadCSVWithCategory);
        this.myRoutes.put('/change-domain-category', FirewallController.changeDomainCategory);
        this.myRoutes.post('/get-blocked-user-dept-domains', FirewallController.getBlockedUserDepatment);
        this.myRoutes.post('/user-department-domain-blocked', FirewallController.UserAndDepartmentDomainUsed);
        this.myRoutes.post('/single-rule-blocked-user-dept-domains', FirewallController.getSingleBlockedUserDepatment);
        // this.myRoutes.post('/get-url-category', Url.checkCategory);
        // this.myRoutes.post('/get-urls', FirewallController.getAllUrls);


    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = FirewallRoutes;