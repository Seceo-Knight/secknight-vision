const router = require('express').Router();

const { GroupController: GroupController } = require('./groups.controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/', GroupController.createGroup);
        this.myRoutes.get('/', GroupController.listGroups);
        this.myRoutes.delete('/', GroupController.deleteGroup);
        this.myRoutes.put('/', GroupController.editGroup)
        this.myRoutes.put('/group-setting', GroupController.groupSetting);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports.Routes = Routes;