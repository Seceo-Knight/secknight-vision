const { WebSocketNotification } = require("../../../messages/WebSocketNotification");

class WsNotificationController {
    async sendReportBeforeDeleteMessage(req, res, next) {
        const notificationData = req.query;
        /** send socket notification */
        if(notificationData.type == 'newReportBeforeDelete') {
            await WebSocketNotification.sendReportBeforeDeleteMessage({ message: notificationData.message || 'Delete',  userId: notificationData.userId });
            return res.json({code: 200, message: 'done'});
        } 
        if(notificationData.type == 'newReportAfterDelete') {
            await WebSocketNotification.sendReportAfterDeleteMessage({ message: notificationData.message, links: notificationData.links, userId: notificationData.userId });
            return res.json({code: 200, message: 'done'});
        } 

        return res.json({code: 200, message: 'message'});
    }
}

module.exports = new WsNotificationController;