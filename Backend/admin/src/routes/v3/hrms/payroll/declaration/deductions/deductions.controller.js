const { DeductionsService } = require('./deductions.service');

class DeductionsController {
  /**
   * A function for get deductions
   * @function getDeductions
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static getDeductions = async (req, res, next) => await DeductionsService.getDeductions(req, res, next);
  /**
   * A function for update deductions
   * @function updateDeductions
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static updateDeductions = async (req, res, next) => await DeductionsService.updateDeductions(req, res, next);
  /**
   * A function for get HRA
   * @function getHra
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static getHra = async (req, res, next) => await DeductionsService.getHra(req, res, next);

  /**
   * A function for get HRA
   * @function getHra
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static postHra = async (req, res, next) => await DeductionsService.postHra(req, res, next);

  /**
  * A function for get HRA
  * @function getLta
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static getLta = async (req, res, next) => await DeductionsService.getLta(req, res, next);

  /**
  * A function for get house property
  * @function getProperty
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static getProperty = async (req, res, next) => await DeductionsService.getProperty(req, res, next);

  /**
  * A function for get deduction component
  * @function getComponents
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static getComponents = async (req, res, next) => await DeductionsService.getComponents(req, res, next);

  /**
  * A function for add bank interest
  * @function addBankInterest
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static addBankInterest = async (req, res, next) => await DeductionsService.addBankInterest(req, res, next);

  /**
  * A function for add pension
  * @function addPension
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static addPension = async (req, res, next) => await DeductionsService.addPension(req, res, next);

  /**
  * A function for  get employee deductions
  * @function getEmployeeDeduction
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static getEmployeeDeduction = async (req, res, next) => await DeductionsService.getEmployeeDeduction(req, res, next);

  /**
  * A function for  get delete deductions
  * @function deleteDeductions
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static deleteDeductions = async (req, res, next) => await DeductionsService.deleteDeductions(req, res, next);


  /**
  * A function for  get reimbursement data
  * @function getReimbursement
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static getReimbursement = async (req, res, next) => await DeductionsService.getReimbursement(req, res, next);



  /**
 * A function for  upsert reimbursement data
 * @function upsertReimbursement
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
  static upsertReimbursement = async (req, res, next) => await DeductionsService.upsertReimbursement(req, res, next);

  /**
  * A function for  update status reimbursement data
  * @function putReimbursement
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static putReimbursement = async (req, res, next) => await DeductionsService.putReimbursement(req, res, next);


  /**
  * A function for  delete status reimbursement data
  * @function putReimbursement
  * @param {*} req 
  * @param {*} res 
  * @param {*} next 
  */
  static deleteReimbursement = async (req, res, next) => await DeductionsService.deleteReimbursement(req, res, next);


}
module.exports = { DeductionsController };