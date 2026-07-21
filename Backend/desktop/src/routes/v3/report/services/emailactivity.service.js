const multer = require('multer');
const moment = require('moment-timezone');
const fs = require('fs');

const ReportValidation = require('../report.validation');
const reportModel = require('../report.model');
const CloudStorageServices = require('./cloudservice/index');

if (!fs.existsSync(__dirname.split('src')[0] + 'public/attachments')) {
    fs.mkdirSync(__dirname.split('src')[0] + 'public/attachments');
}

const upload = multer({
    dest: __dirname.split('src')[0] + 'public/attachments'
}).array("attachments", 100);

class EmailActivityService {
    async addEmailContent(req, res, next) {
        upload(req, res, async function (err) {

            try {
                const parsedData = JSON.parse(req.body.data);
                const data = await ReportValidation.validateEmailContent().validateAsync(parsedData);

                const employee_id = req.decoded.employee_id;
                const department_id = req.decoded.department_id;
                const location_id = req.decoded.location_id;
                const organization_id = req.decoded.organization_id;

                let newData = data.email_info.map(e => {
                    e.organization_id = organization_id;
                    e.employee_id = employee_id;
                    e.location_id = location_id;
                    e.department_id = department_id;
                    e.from = e.from;
                    e.to = e.to;
                    e.subject = e.subject;
                    e.body = e.body;
                    e.mail_time = moment(e.mail_time).tz('Africa/Bamako').format('YYYY-MM-DD HH:mm:ss');
                    e.date = moment(e.mail_time).tz(req.decoded.timezone).format('YYYY-MM-DD');
                    e.client_type = e.client_type;
                    e.type = e.type;
                    e.attachments = e.attachments;
                    return e;
                });
                let attachments = [];
                if (req.files.length > 0) {
                    const [credsData] = await reportModel.getStorageDetail(organization_id);
                    if (!credsData) {
                        for (const file of req.files) {
                            await CloudStorageServices.deleteFileFromLocal(file.path);
                        }
                        return res.status(422).json({ code: 422, error: 'Storage Not Found', message: 'Storage Not Found', data: null });
                    }
                    const storageType = credsData.short_code;
                    const creds = JSON.parse(credsData.creds);

                    const CloudDriveService = CloudStorageServices.getStorage(storageType);

                    if (!CloudDriveService) {
                        for (const file of req.files) {
                            await CloudStorageServices.deleteFileFromLocal(file.path);
                        }
                        return res.status(422).json({ code: 422, error: 'Storage Not Found', message: 'Storage Not Found', data: null });
                    }

                    for (const file of req.files) {
                        const attLink = await CloudDriveService.uploadAttachments('EmpMonitorAttachments', file.filename, creds, file.path, file.originalname, file.mimetype);
                        attachments.push({ link: attLink, name: file.originalname });
                    }
                    //to save the attachment with links
                    newData[0].attachments = newData[0].attachments.map((newDataAttachment, index) => { return {...newDataAttachment, ...attachments[index]}});
                }
                const insertedData = await reportModel.insertEmailActivity(newData);
                for (const file of req.files) {
                    await CloudStorageServices.deleteFileFromLocal(file.path);
                }
                return res.status(200).json({ code: 200, message: 'Success', data: { status: 'added' }, error: null });
            } catch (err) {
                for (const file of req.files) {
                    await CloudStorageServices.deleteFileFromLocal(file.path);
                }
                next(err);
            }
        })
    }

    /**
     * addEmailContentNew
     * @memberof EmailActivityService
     * @description function to accept email activities
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async addEmailContentNew(req, res, next) {
        try {
            const data = await ReportValidation.validateEmailContentNew().validateAsync(req.body);

            const employee_id = req.decoded.employee_id;
            const department_id = req.decoded.department_id;
            const location_id = req.decoded.location_id;
            const organization_id = req.decoded.organization_id;

            let newData = data.email_info.map(e => {
                e.organization_id = organization_id;
                e.employee_id = employee_id;
                e.location_id = location_id;
                e.department_id = department_id;
                e.from = e.from;
                e.to = e.to;
                e.subject = e.subject;
                e.body = e.body;
                e.mail_time = moment(e.mail_time).tz('Africa/Bamako').format('YYYY-MM-DD HH:mm:ss');
                e.date = moment(e.mail_time).tz(req.decoded.timezone).format('YYYY-MM-DD');
                e.client_type = e.client_type;
                e.type = e.type;
                e.attachments = e.attachments;
                return e;
            });
            const insertedData = await reportModel.insertEmailActivity(newData);
            return res.status(200).json({ code: 200, message: 'Success', data: { status: 'added' }, error: null });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new EmailActivityService;