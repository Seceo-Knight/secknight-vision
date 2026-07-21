const EmailService = require('./services/emailactivity.service');

class ReportController {
    async addEmailcontent(req, res, next) {
        return await EmailService.addEmailContent(req, res, next);
    }

    /**
     * addEmailContentNew 
     * @memberof ReportController
     *
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async addEmailcontentNew(req, res, next) {
        return await EmailService.addEmailContentNew(req, res, next);
    }
}

module.exports = new ReportController;