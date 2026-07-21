/** Employees Shifts Routes */

/** Imports */
const router = require("express").Router();
const EmployeeShiftsController = require("./employee_shifts.controller");


/**
 * @class EmployeeShifts
 * All employee_shifts routes 
 */
class EmployeeShiftsRoutes {

    constructor() {

        /** router */
        this.router = router;

        /** Initialize Routes */
        this.core();
    }


    /**
     * Initialize Routes
     */
    core() {

        /** Routes */
        this.router.get("/", new EmployeeShiftsController().getEmployeeShifts);
        this.router.post("/", new EmployeeShiftsController().postEmployeeShifts);
        this.router.delete("/", new EmployeeShiftsController().deleteEmployeeShifts);
    };


    /**
     * Get EmployeeShifts Router
     */
    getRouters() {
        return this.router;
    }
}


/** Exports */
module.exports = EmployeeShiftsRoutes;