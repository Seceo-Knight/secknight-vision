const { SettingsService } = require('./settings.service');

class PayRollSetting {
  /**
   * A function for add PT location details
   * @function professionalTax
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static professionalTax = async (req, res, next) => await SettingsService.professionalTax(req, res, next);

  /**
   * A function for get PT settings
   * @function getPTSettings
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static getPTSettings = async (req, res, next) => await SettingsService.getPTSettings(req, res, next);

  /**
   * A function for Update PT settings
   * @function updatePTSettings
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static updatePTSettings = async (req, res, next) => await SettingsService.updatePTSettings(req, res, next);

  /**
    * A function for Update PT settings
    * @function deletePTLocation
    * @param {*} req
    * @param {*} res
    * @param {*} next
    */

  static deletePTLocation = async (req, res, next) => await SettingsService.deletePTLocation(req, res, next);

  /**
  * A function for get overview
  * @function getOverview
  * @param {*} req
  * @param {*} res
  * @param {*} next
  */
  static getOverview = async (req, res, next) => await SettingsService.getOverview(req, res, next);

  /**
  * A function for update overview
  * @function updateOverview
  * @param {*} req
  * @param {*} res
  * @param {*} next
  */
  static updateOverview = async (req, res, next) => await SettingsService.updateOverview(req, res, next);

  /**
   * A function for add PT location values
   * @function professionalTaxByLocation
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static professionalTaxByLocation = async (req, res, next) => await SettingsService.professionalTaxByLocation(req, res, next);

}

module.exports.PayRollSetting = PayRollSetting;