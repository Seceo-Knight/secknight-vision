/** HRMSPassword Routes */

/** Imports */
const router = require("express").Router();
const HRMSPasswordController = require("./hrmsPassword.controller");


/**
 * @class HRMSPasswordRoutes
 * All HRMSPassword routes 
 */
class HRMSPasswordRoutes {

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

        /** Password Routes */
        this.router.get("/", new HRMSPasswordController().checkPassword);
        this.router.post("/", new HRMSPasswordController().addPassword);

        /** Forgot Password Routes */
        this.router.get("/forgot", new HRMSPasswordController().forgotPassword);
        this.router.put("/forgot", new HRMSPasswordController().checkForgotPasswordCode);
    }


    /**
     * Get HRMSPassword Router
     */
    getRouters() {
        return this.router;
    }
}


/** Exports */
module.exports = HRMSPasswordRoutes;