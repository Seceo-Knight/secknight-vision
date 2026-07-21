const router = require('express').Router();

const SentimentalAnalysisController = require('./SentimentalAnalysis.controller');

class SentimentalAnalysisRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/get-keystrokes-new', SentimentalAnalysisController.getKeyStrokes);
        this.myRoutes.get('/get-employees', SentimentalAnalysisController.getEmployeeIds);
        this.myRoutes.post('/add-sentimental-analysis-data', SentimentalAnalysisController.addSentimentalAnalysisData)
        this.myRoutes.post('/add-url-category',SentimentalAnalysisController.urlCategory)
    }
    getRouters() {
        return this.myRoutes;
    }
}

module.exports = SentimentalAnalysisRoutes;

