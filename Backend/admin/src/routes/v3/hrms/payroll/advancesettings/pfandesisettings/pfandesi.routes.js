const router = require('express').Router();
const PfRoutes = require('./pfsettings/pf.routes');
const EsiRoutes = require('./esisettings/esi.routes');
const AdminChargesRoutes = require('./adminCharges/adminCharges.routes');
const OverviewRoutes = require('./overview/overview.routes');



class PfAndEsiRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.use('/pf', new PfRoutes().getRouters());
        this.myRoutes.use('/esi', new EsiRoutes().getRouters());
        this.myRoutes.use('/admin-charges', new AdminChargesRoutes().getRouters());
        this.myRoutes.use('/overview', new OverviewRoutes().getRouters());
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = PfAndEsiRoutes;