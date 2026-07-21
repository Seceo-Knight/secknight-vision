// Salary in Hand Routes 

// Imports 
const router = require("express").Router();
const SalaryInHandController = require("./salaryInHand.controller");


/**
 * @class SalaryInHand
 * All SalaryInHand routes 
 */
class SalaryInHandRoutes {

    constructor() {

        // router
        this.router = router;

        // Initialize Routes
        this.core();
    }


    // Initialize Routes
    core() {

        // Routes
        this.router.get("/", new SalaryInHandController().getSalaryInHandEmployees);
        this.router.post("/", new SalaryInHandController().postSalaryInHand);
        this.router.delete("/", new SalaryInHandController().disableSalaryInHand);
    }


    // Get SalaryInHand Router
    getRouters() {
        return this.router;
    }
}


// Exports
module.exports = SalaryInHandRoutes;