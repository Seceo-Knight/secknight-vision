const _ = require('underscore');
const moment = require('moment');
const NotificationModel = require('./Notification.model');
const NotificationValidator = require('./Notification.validator');

const actionsTracker = require('../services/actionsTracker');
const { constant } = require('lodash');
const { employeeNotificationMessages } = require("../../../utils/helpers/LanguageTranslate")


class NotificationController {
    async notificationList(req, res, next) {
        try {

            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const { skip, limit, location_id, department_id, employee_id, startDate, endDate, name, sortOrder, sortColumn, download } = await NotificationValidator.notificationList().validateAsync(req.query);

            const notificationData = await NotificationModel.getNotificationList({ organization_id, skip, limit, location_id, department_id, employee_id, startDate, endDate, sortColumn, sortOrder, name, download });
            if (notificationData.length === 0) return res.json({ code: 400, data: null, message: employeeNotificationMessages.find(x => x.id === "1")[language] || employeeNotificationMessages.find(x => x.id === "1")["en"], error: null });
            return res.json({
                code: 200,
                data: {
                    totalCount: notificationData[0].total_count,
                    unreadNotification: notificationData[0].unread_notification,
                    hasMoreData: ((skip + limit) >= notificationData[0].total_count ? false : true),
                    skipValue: skip + limit,
                    notificationData: notificationData
                },
                message: employeeNotificationMessages.find(x => x.id === "3")[language] || employeeNotificationMessages.find(x => x.id === "3")["en"],
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async notificationStatusUpdate(req, res, next) {
        try {
            const { organization_id } = req.decoded;

            let { ids } = await NotificationValidator.notificationStatusUpdate().validateAsync(req.body);
            const status = await NotificationModel.updateNotificationStatus(organization_id, ids);
            const statusMessage = status.message;
            return res.json({
                code: 200,
                data: [],
                message: statusMessage,
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async unreadMessageWithCount(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const [count] = await NotificationModel.unreadMessageWithCount(organization_id);
            return res.json({ code: 200, data: count, message: employeeNotificationMessages.find(x => x.id === "4")[language] || employeeNotificationMessages.find(x => x.id === "4")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new NotificationController;