const router = require('express').Router();
// const AIController = require('./AI.controller');
const urlClassification = require('./urlClassification/UrlClassification.controller')

class AIRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    core() {

        this.myRoutes.post('/add-url-status', urlClassification.UpdatePredictStatus);
        this.myRoutes.get('/domains', urlClassification.getDomains);
        this.myRoutes.get('/risk-score', urlClassification.riskAnalysis);
        this.myRoutes.post('/risk-score', urlClassification.updateUserRiskScore);



    }

    getRouters() {
        return this.myRoutes;
    }
}
module.exports = AIRoutes;

