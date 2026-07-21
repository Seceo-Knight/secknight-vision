const OverviewService = require('./overview.service')

class OverviewController {
    /**
     * Get run payroll overview
     * @function getOverview
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    // static getOverview = async (req, res, next) => await OverviewService.getOverview(req, res, next);
    static getOverviewNew = async (req, res, next) => await OverviewService.getOverviewNew(req, res, next);

    /**
    * Get payout
    * @function getPayout
    * @param {*} req
    * @param {*} res
    * @param {*} next
    */
    static getPayout = async (req, res, next) => await OverviewService.getPayout(req, res, next);

    /**
    * Update run payroll  overview
    * @function updateOverview
    * @param {*} req
    * @param {*} res
    * @param {*} next
    */
    static updateOverview = async (req, res, next) => await OverviewService.updateOverview(req, res, next);
    /**
    * Update run payroll overview Months
    * @function getOverviewMonths
    * @param {*} req
    * @param {*} res
    * @param {*} next
    */
    static getOverviewMonths = async (req, res, next) => await OverviewService.getOverviewMonths(req, res, next);
}
module.exports = OverviewController;



