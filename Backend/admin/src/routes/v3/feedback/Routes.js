const router = require('express').Router();
const FeedbackControlle = require('./Feedback.controller')

class FeedbackRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/answer', FeedbackControlle.addAnswer);
        this.myRoutes.get('/questions', FeedbackControlle.getQuestions);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = FeedbackRoutes;