'use strict';

const router = require('express').Router();

const openModule = require('./open/open.module');
const authModule = require('./auth/auth.module');
const authMiddleware = require('./auth/services/auth.middleware');
const userModule = require('./user/user.module');
const clockInModule = require('./clock-in/clock-in.module');
const projectModule = require('./project/project.module');
const firewallModule = require('./firewall/firewall.module');
const reportModule = require('./report/report.module');
const AnnouncementModule = require('./announcements/announcement.module');
const RequestModule = require('./break-request/request.module');
const UninstallAgentModule = require("./uninstall-agent/uninstall-agent.module");
const RDPRequestModule = require('./RDPRequestModule/RDPRequest.module');
const TimesheetModule = require('./timesheet/timesheet.module');
class Routes {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.use('/', new openModule().getRouters());
        this.myRoutes.use('/auth', new authModule().getRouters());
        this.myRoutes.use('/authenticate', new authModule().getRouters());
        this.myRoutes.use('/agent', new UninstallAgentModule().getRouters());
        // this.myRoutes.use('/project', (req, res) => res.status(406).send());
        this.myRoutes.use('/rdp-request', new RDPRequestModule().getRouters());
        this.myRoutes.use(authMiddleware.authenticate);
        this.myRoutes.use('/user', new userModule().getRouters());
        // this.myRoutes.use('/clock-in', new clockInModule().getRouters());
        this.myRoutes.use('/project', new projectModule().getRouters());
        this.myRoutes.use('/firewall', new firewallModule().getRouters());
        this.myRoutes.use('/report', new reportModule().getRoutes());
        this.myRoutes.use('/announcement', new AnnouncementModule().getRouters());
        this.myRoutes.use('/request', new RequestModule().getRouters());
        this.myRoutes.use('/time-sheet', new TimesheetModule().getRouters());

        this.myRoutes.get('*', (req, res) => res.sendStatus(404));
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;