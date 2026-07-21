'use strict';
const userValidation = require('../user.validation');
const passwordService = require('../../auth/services/password.service');
const redis = require('../../../../utils/redis/redis.utils');
const SocketServer = require('../../websocket/websocketNotification');
const userModel = require("../user.model");
const EmployeeSystemLogsModel = require('../../../../models/employee_system_logs.schema');

const EmployeeEmailMonitoringLogsModel = require('../../../../models/employee_email_monitoring.schema');
const CloudStorageServices = require('../../report/services/cloudservice');
const reportModel = require('../../report/report.model');
const mongoose = require('mongoose');

class UserService {
    async me(req, res, next) {
        res.status(200).json({ code: 200, error: null, message: 'Logged in user', data: req.decoded });
    }

    /**
     * Check uninstall code check.
     *
     * @param {*} uninstallCodeCheck
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @returns true or false
     * @author Basavaraj <basavarajshiralashetti@globussoft.in>
     */
    async uninstallCodeCheck(req, res, next) {
        try {
            const { uninstallCode } = await userValidation.validUserCode().validateAsync(req.body);
            if (!req.decoded.setting.agentUninstallCode) return res.json({ code: 200, data: true, error: null, message: 'Success.' });

            const { decoded: passwordDB } = passwordService.decrypt(req.decoded.setting.agentUninstallCode, process.env.CRYPTO_PASSWORD);
            const { decoded: passwordParam } = passwordService.decrypt(uninstallCode, process.env.CRYPTO_PASSWORD);

            if (passwordDB != passwordParam) return res.json({ code: 400, data: false, error: null, message: 'Invalid Password' });
            return res.json({ code: 200, data: true, error: null, message: 'Success.' });

        } catch (err) {
            next(err);
        }
    }

    async userLogOut(req, res, next) {
        try {
            let { email, a_email, user_id } = req.decoded;

            if(user_id) await redis.delAsync(user_id);

            await redis.delAsync(`${email.toLowerCase()}_pack`);
            await redis.delAsync(`${email.toLowerCase()}_agent_auth`);
            await redis.delAsync(`${email.toLowerCase()}_system`);
            await redis.delAsync(`${email.toLowerCase()}_user_id`);
            await redis.delAsync(`${email.toLowerCase()}_invalid_email_cred`);
            await redis.delAsync(`${email.toLowerCase()}_screenshot`);

            if(a_email) {
                await redis.delAsync(`${a_email.toLowerCase()}_pack`);
                await redis.delAsync(`${a_email.toLowerCase()}_agent_auth`);
                await redis.delAsync(`${a_email.toLowerCase()}_system`);
                await redis.delAsync(`${a_email.toLowerCase()}_user_id`);
                await redis.delAsync(`${a_email.toLowerCase()}_invalid_email_cred`);
                await redis.delAsync(`${a_email.toLowerCase()}_screenshot`);
            }
            return res.json({ code: 200, data: true, error: null, message: 'Success.' });
        }
        catch (err) {
            next(err);
        }
    }

    async raisedAlert(req, res, next) {
        try {
            const { organization_id, first_name, last_name } = req.decoded;
            let message = req.body.message;
            if (!message) return res.json({ code: 400, data: false, error: null, message: 'Message is required.' });
            if (message.length > 100) return res.json({ code: 400, data: false, error: null, message: 'Message length should be less than 100 characters.' });
            if (message.length < 5) return res.json({ code: 400, data: false, error: null, message: 'Message length should be greater than 5 characters.' });
            let [result] = await userModel.getAdminId(organization_id);
            await SocketServer.notificationAdminForEmployeeGeolocationChange(`${first_name} ${last_name} : ${message}`, result.id);
            return res.json({ code: 200, data: true, error: null, message: 'Success.' });
        }
        catch (err) {
            next(err);
        }
    }

    async getStorageDetails(req, res, next) {
        try {
            let { organization_id } = req.decoded;
            //adding storage config
            let storageDetails = await redis.getAsync(`${organization_id}_storage_creds`);
            let storage_setting_data;
            if(storageDetails) {
                storageDetails = JSON.parse(storageDetails);
                storageDetails = JSON.parse(storageDetails.organizationproviders.orgProCreds.creds);
                Object.keys(storageDetails).forEach((key) => {
                    if (typeof storageDetails[key] === 'string') {
                        storageDetails[key] = passwordService.encrypt(storageDetails[key], process.env.CRYPTO_PASSWORD).encoded;
                    }
                });
                storage_setting_data = storageDetails;
            }
            else {
                let [storage_setting] = await userModel.storageDetails(organization_id);
                if(storage_setting) {
                    storage_setting = JSON.parse(storage_setting?.creds);
                    Object.keys(storage_setting).forEach((key) => {
                        if (typeof storage_setting[key] === 'string') {
                            storage_setting[key] = passwordService.encrypt(storage_setting[key], process.env.CRYPTO_PASSWORD).encoded;
                        }
                    });
                    storage_setting_data = storage_setting;
                }
            }

            return res.json({
                code: 200, data: storage_setting_data, error: null, message: 'Success.' 
            })
        }
        catch (error) {
            next(error);
        }
    }

    async saveSystemLog(req, res, next) {
        try {
            const { employee_id, organization_id } = req.decoded;
            const logData = req.body;

            if (!logData || Object.keys(logData).length === 0) {
                return res.json({ 
                    code: 400, 
                    data: null, 
                    error: 'No data provided', 
                    message: 'Request body cannot be empty.' 
                });
            }

            const systemLog = new EmployeeSystemLogsModel({
                employee_id,
                organization_id,
                log_data: logData
            });

            await systemLog.save();

            return res.json({
                code: 200,
                data: { id: systemLog._id },
                error: null,
                message: 'System log saved successfully.'
            });
        } catch (error) {
            next(error);
        }
    }

    /*
    * Save email monitoring log with optional attachments. If attachments are included, they will be uploaded to the configured cloud storage (e.g., S3) and only the public links will be stored in the log_data.
    */
    async saveEmailMonitoringLog(req, res, next) {
        try {
            const { employee_id, organization_id } = req.decoded;
            const logData = req.body;

            if (!logData || Object.keys(logData).length === 0) {
                return res.json({
                    code: 400,
                    data: null,
                    error: 'No data provided',
                    message: 'Request body cannot be empty.'
                });
            }

            // Handle optional attachments uploaded with the request.
            // If files are present, upload them to configured cloud storage (S3, etc.)
            // and persist only the public links inside log_data.
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                const [credsData] = await reportModel.getStorageDetail(organization_id);

                if (!credsData) {
                    for (const file of req.files) {
                        if (file.path) {
                            await CloudStorageServices.deleteFileFromLocal(file.path);
                        }
                    }
                    return res.status(422).json({
                        code: 422,
                        error: 'Storage Not Found',
                        message: 'Storage Not Found',
                        data: null
                    });
                }

                const storageType = credsData.short_code;
                const creds = JSON.parse(credsData.creds);
                const CloudDriveService = CloudStorageServices.getStorage(storageType);

                if (!CloudDriveService || typeof CloudDriveService.uploadAttachments !== 'function') {
                    for (const file of req.files) {
                        if (file.path) {
                            await CloudStorageServices.deleteFileFromLocal(file.path);
                        }
                    }
                    return res.status(422).json({
                        code: 422,
                        error: 'Storage Not Found',
                        message: 'Storage Not Found',
                        data: null
                    });
                }

                const uploadedAttachments = [];

                for (const file of req.files) {
                    // Generate a MongoDB ObjectId to uniquely identify this attachment.
                    // The same id is used for the S3 object key and stored in the log document.
                    const attachmentId = new mongoose.Types.ObjectId();

                    let attLink = '';
                    try {
                        attLink = await CloudDriveService.uploadAttachments(
                            'EmpMonitorEmailMonitoringAttachments',
                            attachmentId.toString(),
                            creds,
                            file.path,
                            file.originalname,
                            file.mimetype
                        ) || '';
                    } catch (e) {
                        // If upload fails, proceed with empty URL as per requirement.
                        attLink = '';
                    }

                    uploadedAttachments.push({
                        _id: attachmentId,
                        link: attLink,
                        name: file.originalname
                    });
                }

                // Merge uploaded attachment links into the log_data payload.
                if (Array.isArray(logData.attachments) && logData.attachments.length === uploadedAttachments.length) {
                    logData.attachments = logData.attachments.map((attachment, index) => ({
                        ...attachment,
                        ...uploadedAttachments[index]
                    }));
                } else {
                    logData.attachments = uploadedAttachments;
                }

                // Clean up local temp files.
                for (const file of req.files) {
                    if (file.path) {
                        await CloudStorageServices.deleteFileFromLocal(file.path);
                    }
                }
            }

            let lastData = await EmployeeEmailMonitoringLogsModel.findOne({ employee_id, organization_id, type: req.body.eventType || 0 }).sort({ createdAt: -1 });
            if(lastData) {
                lastData.end_time = new Date();
                await lastData.save();
            }

            if(logData.label === "Received email") req.body.eventType = 4;
            if(logData.label === "Sent email") req.body.eventType = 0;

            const systemLog = new EmployeeEmailMonitoringLogsModel({
                employee_id,
                organization_id,
                log_data: logData,
                type: req.body.eventType || 0,
                start_time: new Date(),
            });

            await systemLog.save();

            return res.json({
                code: 200,
                data: { id: systemLog._id },
                error: null,
                message: 'Email monitoring log saved successfully.'
            });
        } catch (error) {
            // Best-effort cleanup of any uploaded files on error.
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    if (file.path) {
                        try {
                            await CloudStorageServices.deleteFileFromLocal(file.path);
                        } catch (e) {
                            // ignore cleanup errors
                        }
                    }
                }
            }
            next(error);
        }
    }
}

module.exports = new UserService;