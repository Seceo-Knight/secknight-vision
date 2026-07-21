const payRegisterService = require('./pay-register.service');
class payRegisterController {
    async runPayroll(req, res, next) {
        try {
            await payRegisterService.runPayroll(req, res, next);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new payRegisterController();