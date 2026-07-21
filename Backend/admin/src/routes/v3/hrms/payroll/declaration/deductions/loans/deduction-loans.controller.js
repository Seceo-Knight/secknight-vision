const { DeductionLoansService } = require('./deduction-loans.service');

class DeductionLoansController {
    /**
     * A function for  get loans
     * 
     * @function getLoans
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static getLoans = async (req, res, next) => await DeductionLoansService.getLoans(req, res, next);

    /**
     * A function for post loans
     * 
     * @function postLoans
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static postLoans = async (req, res, next) => await DeductionLoansService.postLoans(req, res, next);

    /**
     * A function for delete loans
     * 
     * @function deleteLoans
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
     static deleteLoans = async (req, res, next) => await DeductionLoansService.deleteLoans(req, res, next);
}
module.exports = { DeductionLoansController };