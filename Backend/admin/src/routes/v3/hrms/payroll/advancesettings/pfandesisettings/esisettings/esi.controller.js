const { EsiService } = require('./esi.service')

class EsiController {
    static async getEsiSettings(req, res, next) {
        return await EsiService.getEsiSettings(req, res, next)
    }

    static async updateEsiSettings(req, res, next) {
        return await EsiService.updateEsiSettings(req, res, next)
    }

}
module.exports = EsiController;