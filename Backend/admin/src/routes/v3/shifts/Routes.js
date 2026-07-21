const router = require('express').Router();
const {Controller} = require('./Controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {
        this.myRoutes.post('/', Controller.create);
        this.myRoutes.put('/', Controller.update);
        this.myRoutes.get('/', Controller.get);
        this.myRoutes.delete('/', Controller.delete);
        this.myRoutes.get('/find_by', Controller.findBy);
    }
    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports.Routes = Routes;