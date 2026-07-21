const router = require('express').Router();
const KeystrokeSController = require('./Keystrokes.controller')

class AIKeystrokeRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    core() {
        this.myRoutes.post('/conversation-classification', KeystrokeSController.addConversationClassification);
        this.myRoutes.get('/keystrokes', KeystrokeSController.getDayKestrokes);
        this.myRoutes.get('/get-keystrokes', KeystrokeSController.getKestrokes);
        this.myRoutes.post('/bulk-conversation-classification', KeystrokeSController.addBulkConversationClassification);
        this.myRoutes.post('/add-sentimental-analysis-data', KeystrokeSController.addSentimentalAnalysis);
    }

    getRouters() {
        return this.myRoutes;
    }
}
module.exports = AIKeystrokeRoutes;

