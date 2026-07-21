const _ = require('underscore');
const UserModel = require('./User.model');
const UserValidator = require('./User.validator');

class UserController {
    async getBrowserHistorySingleDate(req, res, next) {
        try {
            // const {user_id, from_date, to_date, skip, limit} = await UserValidator.getBrowserHistory().validateAsync(req.body);
            const admin_id = req['decoded'].jsonData.admin_id;
            const { user_id, date, skip, limit } = await UserValidator.getBrowserHistory().validateAsync(req.body);


            // const [attendance_id] = [2905];
            const [attendanceData] = await UserModel.getAttandanceId({ admin_id, user_id, date });

            if (!attendanceData) {
                return res.json({ code: 200, data: null, message: 'Not Found.', error: null })
            }

            const attendance_id = attendanceData.id;

            const [distinctDataArr, browserHistories] = await Promise.all([
                UserModel.getBrowserHistoryCount(attendance_id),
                UserModel.getBrowserHistory({ attendance_id, skip, limit })
            ]);

            return res.json({ code: 200, data: browserHistories, hasMoreData: distinctDataArr.length > skip + limit ? true : false, error: null });
        } catch (err) {
            next(err);
        }
    }
    async getApplicationsUsedSingleDate(req, res, next) {
        try {
            // const {user_id, from_date, to_date, skip, limit} = await UserValidator.getBrowserHistory().validateAsync(req.body);
            const admin_id = req['decoded'].jsonData.admin_id;
            const { user_id, date, skip, limit } = await UserValidator.getBrowserHistory().validateAsync(req.body);


            // const [attendance_id] = [2905];
            const [attendanceData] = await UserModel.getAttandanceId({ admin_id, user_id, date });

            if (!attendanceData) {
                return res.json({ code: 200, data: null, message: 'Not Found.', error: null })
            }

            const attendance_id = attendanceData.id;

            const [distinctDataArr, applications] = await Promise.all([
                UserModel.getApplicationsUsedCount(attendance_id),
                UserModel.getApplicationsUsed({ attendance_id, skip, limit })
            ]);

            return res.json({ code: 200, data: applications, hasMoreData: distinctDataArr.length > skip + limit ? true : false, error: null });
        } catch (err) {
            next(err);
        }
    }

    async getBrowserHistory(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const { user_id, startDate, endDate, skip, limit } = await UserValidator.getBrowserHistory().validateAsync(req.body);

            const attendanceData = await UserModel.getAttandanceIds({ admin_id, user_id, startDate, endDate });

            if (attendanceData.length === 0) {
                return res.json({ code: 404, data: [], message: 'Not Found.', hasmoredata: false, error: null })
            }

            // const attendance_ids = [1];
            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [distinctDataArr, browserHistories] = await Promise.all([
                UserModel.getBrowserHistoryCount(attendance_ids),
                UserModel.getBrowserHistory({ attendance_ids, skip, limit })
            ]);

            if(browserHistories.length > 0) {
                const application_ids = _.pluck(browserHistories, '_id');
                const appProductivityStatus = await UserModel.getApplicationsProductivity(application_ids);

                browserHistories = browserHistories.map(item => {
                    const appProductivity = appProductivityStatus.find(x => x.application_id.toString() === item._id.toString());
                    const data = { ...item, productivity_status: appProductivity ? appProductivity.status : null }
                    delete data._id;

                    return data;
                });
            }

            return res.json({
                code: browserHistories.length > 0 ? 200 : 404,
                data: browserHistories,
                hasMoreData: distinctDataArr.length > skip + limit ? true : false,
                message: browserHistories.length > 0 ? 'Browser history data.' : 'Not Found.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }
    async getApplicationsUsed(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const { user_id, startDate, endDate, skip, limit } = await UserValidator.getApplicationsUsed().validateAsync(req.body);

            const attendanceData = await UserModel.getAttandanceIds({ admin_id, user_id, startDate, endDate });

            if (attendanceData.length === 0) {
                return res.json({ code: 404, data: [], message: 'Not Found.', hasmoredata: false, error: null })
            }

            // const attendance_ids = [1];
            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [distinctDataArr, applications] = await Promise.all([
                UserModel.getApplicationsUsedCount(attendance_ids),
                UserModel.getApplicationsUsed({ attendance_ids, skip, limit })
            ]);

            if(applications.length > 0) {
                const application_ids = _.pluck(applications, '_id');
                const appProductivityStatus = await UserModel.getApplicationsProductivity(application_ids);

                applications = applications.map(item => {
                    const appProductivity = appProductivityStatus.find(x => x.application_id.toString() === item._id.toString());
                    const data = { ...item, productivity_status: appProductivity ? appProductivity.status : null }
                    delete data._id;

                    return data;
                });
            }

            return res.json({
                code: applications.length > 0 ? 200 : 404,
                data: applications, hasMoreData: distinctDataArr.length > skip + limit ? true : false,
                message: applications.length > 0 ? 'Application used data.' : 'Not Found.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async getKeyStrokes_old(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const { user_id, date } = await UserValidator.getKeyStrokes().validateAsync(req.body);

            // const [attendance_id] = [14790];
            const [{ id: attendance_id }] = await UserModel.getAttandanceId({ admin_id, user_id, date });

            if (!attendance_id) {
                return res.json({ code: 200, data: null, message: 'Not Found.', error: null })
            }

            const keyStrokes = await UserModel.getKeyStrokes(attendance_id);

            return res.json({ code: 200, data: keyStrokes, message: 'KeyStrokes Data.', error: null });
        } catch (err) {
            next(err);
        }
    }
    async getKeyStrokes(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const { user_id, startDate, endDate, skip, limit } = await UserValidator.getKeyStrokesRange().validateAsync(req.body);

            const attendanceData = await UserModel.attandanceIds({ admin_id, user_id, startDate, endDate });

            if (attendanceData.length === 0) {
                return res.json({ code: 404, data: [], message: 'Not Found.', hasmoredata: false, error: null })
            }

            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            const [totalCount, keyStrokesData] = await Promise.all([
                UserModel.getKeyStrokesCount(attendance_ids),
                UserModel.getKeyStrokesMongo(attendance_ids, skip, limit)
            ]);

            return res.json({
                code: keyStrokesData.length > 0 ? 200 : 404,
                data: keyStrokesData, hasMoreData: totalCount > skip + limit ? true : false,
                message: keyStrokesData.length > 0 ? 'Keystrokes data.' : 'Not Found.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    // TODO: Finish this API
    async getLogDetails(req, res, next) {
        try {
            const { user_id, from_date, to_date, skip, limit } = await UserValidator.getBrowserHistory().validateAsync(req.body);
            const admin_id = req['decoded'].jsonData.admin_id;


            // const [attendance_id] = [2905];
            const [{ id: attendance_id }] = await UserModel.getAttandanceId({ admin_id, user_id, date });

            if (!attendance_id) {
                return res.json({ code: 200, data: null, message: 'Not Found.', error: null })
            }

            const [distinctDataArr, applications] = await Promise.all([
                UserModel.getApplicationsUsedCount(attendance_id),
                UserModel.getApplicationsUsed({ attendance_id, skip, limit })
            ]);

            return res.json({ code: 200, data: applications, hasMoreData: distinctDataArr.length > skip + limit ? true : false, error: null });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController;