const router = require('express').Router();
const {Controller} = require('./Controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {
        this.myRoutes.post('/', Controller.set);
        this.myRoutes.get('/', Controller.get);
        this.myRoutes.delete('/', Controller.delete);
    }
    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports.Routes = Routes;