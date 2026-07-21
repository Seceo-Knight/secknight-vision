const { PayrollService } = require('./payroll.service')

class PayrollController {
    /**
     * A function for get payroll settings
     * @function getSettings
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static getSettings = async (req, res, next) => await PayrollService.getSettings(req, res, next)

    /**
     * A function for Update payroll settings
     * @function updateSettings
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    static updateSettings = async (req, res, next) => await PayrollService.updatePayrollSettings(req, res, next);

}
module.exports = PayrollController;