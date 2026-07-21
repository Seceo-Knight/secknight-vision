const router = require('express').Router();
const {Controller} = require('./Controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {
        this.myRoutes.get('/', Controller.search);
        this.myRoutes.post('/', Controller.create);
    }
    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports.Routes = Routes;