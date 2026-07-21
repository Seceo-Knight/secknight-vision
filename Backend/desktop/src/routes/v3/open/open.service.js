"use strict";

const momentTz = require('moment-timezone');
momentTz.tz.setDefault('Asia/Kolkata');
const openModel = require('./open.model');
const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../../../utils/helpers/ErrorResponse');
const redis = require('../../../utils/redis/redis.utils');
const { filter } = require('underscore');
const moment = require('moment-timezone');

const clientDir = path.join(__dirname, '../../../../', '/public/logs/client');
const applicationDir = path.join(__dirname, '../../../../', '/public/logs/application');

const authService = require("../auth/services/auth.service");


class OpenService {
    entryRoute(req, res, next) {
        return res.status(200).json({ message: 'Hello !!!' });
    }

    serverTime(req, res, next) {
        return res.status(200).json({
            success: 'true',
            data: {
                dateTime: momentTz().utc().format("DD-MMM-YYYY HH:mm:ss"),
                timeStamp: parseInt(momentTz().utc().valueOf('x') / 1000),
                ztime: parseInt(momentTz().utc().valueOf('x') / 1000) + 330 * 60,
                utc: momentTz().utc()
            }
        });
    }

    /**
        * Sends application information.
        *
        * @function appInfo
        * @param {*} req
        * @param {*} res
        * @param {*} next
        * @returns {Object} - appinfo or error.
        * @memberof OpenService
        */
    async appInfo(req, res, next) {
        try {
            const agent = req.query.agent || 'empmonitor';
            let appInfo = await redis.getApplicationInfo();
            /**Get from agent request */
            if (appInfo && appInfo.data && appInfo.data.length) {
                const tempData = appInfo.data.filter(app => app.agent_name == agent);
                /**Get default appinfo */
                if (tempData && tempData.length === 0) {
                    appInfo.data = appInfo.data.filter(app => app.agent_name == 'empmonitor');
                } else {
                    appInfo.data = tempData;
                }
            }
            if (appInfo && appInfo.code == 200 && appInfo.data && appInfo.data.length) {
                return res.status(200).json({
                    code: 200,
                    error: null,
                    message: 'Application info',
                    data: appInfo.data
                });
            } else {
                // get it from database
                appInfo = await openModel.getInfo(agent);
                if (appInfo) return res.status(200).json({
                    code: 200,
                    error: null,
                    message: 'Application info',
                    data: appInfo
                });
                else return res.status(404).json({
                    code: 404,
                    error: 'No data found',
                    message: 'Application info not available',
                    data: null
                });
            }
        } catch (err) {
            return res.status(422).json({ code: 422, error: err && err.sqlMessage ? err.sqlMessage : err, data: false, message: 'Some Error Occurred.' });
        }
    }

    async updateAppInfo(req, res, next) {
        try {
            const SECRET_KEY = process.env.SECRET_KEY;
            const { id, c_version, key } = req.body;
            if (!key || key !== SECRET_KEY) return res.status(400).json({ code: 400, error: 'Unable to update application.', data: null, message: 'Unable to update application.' });
            const [ifIdExist] = await openModel.checkIdExist({ id });
            if (!ifIdExist) return res.status(404).json({
                code: 404,
                error: 'No data found.',
                message: 'Id not present.',
                data: null
            });
            const updateData = await openModel.updateApplicationInfo({ id, c_version });
            if (updateData?.affectedRows === 0) return res.status(400).json({ code: 400, error: 'Unable to update application.', data: null, message: 'Unable to update application.' });
            res.status(200).json({
                code: 200,
                error: null,
                message: 'Application info updated',
                data: { id, c_version }
            });
        } catch (err) {
            return res.status(422).json({ code: 422, error: err && err.sqlMessage ? err.sqlMessage : err, data: false, message: 'Some Error Occurred.' });
        }
    }
    
    async resetRedis(req, res, next) {
        try {
            const { email, key, type = 1 } = req.body;
            const SECRET_KEY = process.env.SECRET_KEY;
            if (!key || key !== SECRET_KEY) return res.status(400).json({ code: 400, error: 'Unable to reset.', data: null, message: 'Unable to reset.' });
            if (!email) return res.status(404).json({ code: 404, error: 'Not found.', data: null, message: 'Email is required.' });

            if(type === 1 ) {
                // For Registered Users
                const [userData] = await openModel.getUserIdByEmail({ email });
                const user_id = userData?.id;
                if (!user_id) return res.status(400).json({ code: 400, error: 'Unable to reset.', data: null, message: 'Invalid email.' });
                await redis.delAsync(user_id);
                await redis.delAsync(`${email.toLowerCase()}_pack`);
                await redis.delAsync(`${email.toLowerCase()}_agent_auth`);
                await redis.delAsync(`${email.toLowerCase()}_system`);
                await redis.delAsync(`${email.toLowerCase()}_user_id`);
                await redis.delAsync(`${email.toLowerCase()}_invalid_email_cred`);
            }
            else if(type === 2) {
                // For Unregistered Users
                await redis.delAsync(`${email.toLowerCase()}_pack`);
                await redis.delAsync(`${email.toLowerCase()}_agent_auth`);
                await redis.delAsync(`${email.toLowerCase()}_system`);
                await redis.delAsync(`${email.toLowerCase()}_user_id`);
                await redis.delAsync(`${email.toLowerCase()}_invalid_email_cred`);
            }
            else if(type === 3 ) {
                // For Office Agents
                await redis.delAsync(`${email}_pack`);
            }
            else if(type === 4) {
                await redis.delAsync(`${email}_plan_details`);
            }
            
            return res.status(200).json({
                code: 200,
                error: null,
                message: 'Redis reset successfully.',
                data: null
            });
        } catch (err) {
            console.log({ err })
            return res.status(422).json({ code: 422, error: err && err.sqlMessage ? err.sqlMessage : err, data: false, message: 'Some Error Occurred.' });
        }
    }

    addLog(req, res, next) {
        const { mac, email, timestamp, message } = req.body;

        if (!mac && !email) { return next(new ErrorResponse('mac or email is required', 422)) }
        if (!timestamp) { return next(new ErrorResponse('timestamp is required', 422)) }
        if (!message) { return next(new ErrorResponse('message is required', 422)) }

        const logData = new Error();
        logData.name = 'Error Client';
        logData.message = req.body.message;
        logData.timestamp = req.body.timestamp;

        const payload = `${logData.timestamp}: ${logData}\n`;
        const filePath = email ? `${clientDir}/${email}.log` : `${applicationDir}/${mac}.log`;

        fs.appendFile(filePath, payload, function (err) {
            if (err) return next(err);
            res.json({ success: 'true' })
        });
    }

    async getPlanExpiry(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) return next(new ErrorResponse('Email is required', 422));
    
            const lowerCaseEmail = email.toLowerCase();
            let organization_id = await redis.getAsync(`${lowerCaseEmail}_organization_details`);
    
            if (!organization_id) {
                const [userData] = await openModel.getOrganizationDetail({ email: lowerCaseEmail });
                organization_id = userData?.id || null;
                if (organization_id) {
                    await redis.setAsync(`${lowerCaseEmail}_organization_details`, organization_id, 'EX', process.env.PLAN_CACHE_INTERVAL);
                }
            }
            if (!organization_id) {
                return next(new ErrorResponse('Organization not found', 404));
            }
    
            let plan_details = await redis.getAsync(`${organization_id}_plan_details`);
    
            if (!plan_details) {
                const [org_plan] = await openModel.getOrganizationPlan({ organization_id });
                plan_details = org_plan || null;
                if (plan_details) {
                    await redis.setAsync(`${organization_id}_plan_details`, JSON.stringify(plan_details), 'EX', process.env.PLAN_CACHE_INTERVAL);
                }
            } else {
                plan_details = JSON.parse(plan_details);
            }
    
            if (!plan_details) {
                return next(new ErrorResponse('No details found.', 404));
            }
    
            return res.status(200).json({
                code: 200,
                error: null,
                message: 'Success',
                data: {
                    t1: moment(plan_details.expiry?.replace(/"/g, '')).utc().unix(),
                    t2: moment().utc().unix(),
                    timezone: plan_details.timezone,
                    status: moment(plan_details.expiry?.replace(/"/g, '')).utc().unix() - moment().utc().unix() > 0 ? "Active": "Expired"
                }
            });
        } catch (error) {
            next(new ErrorResponse('Some Error Occurred', 500));
        }
    };

    async getOrganizationPlanDetails(req, res, next) {
        try {
            let { organization_id } = req.body;
            if(typeof organization_id === "string") organization_id = await authService.checkShortenKey(organization_id);

            let plan_details = await redis.getAsync(`${organization_id}_plan_details`);
    
            if (!plan_details) {
                const [org_plan] = await openModel.getOrganizationPlan({ organization_id });
                plan_details = org_plan || null;
                if (plan_details) {
                    await redis.setAsync(`${organization_id}_plan_details`, JSON.stringify(plan_details), 'EX', process.env.PLAN_CACHE_INTERVAL);
                }
            } else {
                plan_details = JSON.parse(plan_details);
            }
    
            if (!plan_details) {
                return next(new ErrorResponse('No details found.', 404));
            }
    
            return res.status(200).json({
                code: 200,
                error: null,
                message: 'Success',
                data: {
                    t1: moment(plan_details.expiry?.replace(/"/g, '')).utc().unix(),
                    t2: moment().utc().unix(),
                    timezone: plan_details.timezone,
                    status: moment(plan_details.expiry?.replace(/"/g, '')).utc().unix() - moment().utc().unix() > 0 ? "Active": "Expired"
                }
            });
        } catch (error) {
            next(new ErrorResponse('Some Error Occurred', 500));
        }
    }
}

module.exports = new OpenService;