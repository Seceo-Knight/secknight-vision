const { OverviewService } = require('./overview.service');

class OverviewController {
    static getEmployees = async (req, res, next) => await OverviewService.getEmployees(req, res, next);

    static updateSettings = async (req, res, next) => await OverviewService.updateSettings(req, res, next);
}
module.exports = OverviewController;