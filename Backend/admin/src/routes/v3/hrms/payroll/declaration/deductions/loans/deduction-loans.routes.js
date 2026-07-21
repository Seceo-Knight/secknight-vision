const Router = require('express').Router();
const { DeductionLoansController } = require('./deduction-loans.controller');

class DeductionLoansRoutes {

    constructor() {
        this.router = Router;
        this.core()
    }

    core() {
        this.router.get('/', DeductionLoansController.getLoans);
        this.router.post('/', DeductionLoansController.postLoans);
        this.router.delete('/', DeductionLoansController.deleteLoans);
    }
    getRouters() {
        return this.router;
    }

}
module.exports = { DeductionLoansRoutes };