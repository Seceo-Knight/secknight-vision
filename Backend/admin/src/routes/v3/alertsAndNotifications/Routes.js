const router = require('express').Router();
const AuthMiddleware = require('../auth/services/auth.middleware');

const { Controller } = require('./Controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // this.myRoutes.use(AuthMiddleware.adminOnly);

        this.myRoutes.post('/', Controller.create);
        this.myRoutes.put('/', Controller.update);
        this.myRoutes.get('/', Controller.get);
        this.myRoutes.delete('/', Controller.delete);
        this.myRoutes.get('/find-by', Controller.findBy);
        this.myRoutes.get('/alerts/find-by', Controller.alertsFindBy);
        this.myRoutes.put('/add-employee-to-rule', Controller.addAllEmpToRule);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports.Routes = Routes;