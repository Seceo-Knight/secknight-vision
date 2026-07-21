'use strict';

const router = require('express').Router();
const amemberHookController = require('./amemberHook.controller');

const middleware = (req, res, next) => {
    try{
       const authHeader = req.headers['authorization'];
       const accessToken = authHeader && authHeader.split(' ')[1];
       if (!accessToken) {
           return res.status(401).json({error : null, data: null, code : 401, message : 'Invalid token'});
       }
       if(accessToken == process.env.AMEMBER_PAYMENT_SECRET_KEY) return next();
       else return res.status(401).json({error : null, data: null, code : 401, message : 'Invalid token'});
    }catch(error){
       return res.status(400).json({error : error.message, data: null, code : 400, message : 'something went wrong'});
    }
}

class AmemberModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/update-expairy-data', amemberHookController.updateExpiryData);
        this.myRoutes.post('/add-payment-logs', amemberHookController.addPaymentLogs);
        this.myRoutes.get('/payment-logs', middleware, amemberHookController.getPaymentLogs);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AmemberModule;