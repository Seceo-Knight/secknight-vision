const { PfService } = require('./pf.service')

class PfController {
    static async getPfSettings(req, res, next) {
        return await PfService.getPfSettings(req, res, next)
    }

    static async updatePfSettings(req, res, next) {
        return await PfService.updatePfSettings(req, res, next)
    }

}
module.exports = PfController;