'use strict';

const router = require('express').Router();
const authRouter = require('./auth/routes');
const adminDashboard = require('./adminDashboard/routes');
const geoLocation = require('./geoLocation/routes');

class MobileModule {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', (req, res) => res.status(200).send("Everything is fine."));
        this.myRoutes.use('/auth', new authRouter().getRouters());
        this.myRoutes.use('/admin-dashboard', new adminDashboard().getRouters());
        this.myRoutes.use('/geo-location', new geoLocation().getRouters());

        this.myRoutes.get('*', (req, res) => res.sendStatus(404));
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = MobileModule;