const Router = require('express').Router();
const { DeductionsController } = require('./deductions.controller');
const { DeductionLoansRoutes } = require('./loans/deduction-loans.routes');

class DeductionsRoutes {

    constructor() {
        this.router = Router;
        this.core()
    }

    core() {
        this.router.get('/', DeductionsController.getDeductions)
        this.router.delete('/', DeductionsController.deleteDeductions)
        this.router.put('/', DeductionsController.updateDeductions)
        this.router.get('/hra', DeductionsController.getHra)
        this.router.post('/hra', DeductionsController.postHra)
        this.router.get('/lta', DeductionsController.getLta)
        this.router.get('/house-property', DeductionsController.getProperty)
        this.router.get('/deduction-components', DeductionsController.getComponents)
        this.router.post('/bank-interest', DeductionsController.addBankInterest)
        this.router.post('/income-from-pension', DeductionsController.addPension)
        this.router.get('/employee', DeductionsController.getEmployeeDeduction)
        this.router.get('/reimbursement', DeductionsController.getReimbursement)
        this.router.post('/reimbursement', DeductionsController.upsertReimbursement)
        this.router.put('/reimbursement', DeductionsController.putReimbursement)
        this.router.delete('/reimbursement', DeductionsController.deleteReimbursement)

        // loans
        this.router.use('/loans', new DeductionLoansRoutes().getRouters());
    }
    getRouters() {
        return this.router;
    }

}
module.exports = { DeductionsRoutes };