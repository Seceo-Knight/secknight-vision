const router = require('express').Router();

const NotificationController = require('./Notification.controller');

class NotificationRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/notification-list', NotificationController.notificationList);
        this.myRoutes.post('/notification-status-update', NotificationController.notificationStatusUpdate);
        this.myRoutes.get('/unread-count', NotificationController.unreadMessageWithCount);
    }

    getRouters() {
        return this.myRoutes;
    }
}
module.exports = NotificationRoutes;