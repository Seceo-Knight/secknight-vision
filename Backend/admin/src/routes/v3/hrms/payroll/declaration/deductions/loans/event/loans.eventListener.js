const { DeductionLoansService } = require('../deduction-loans.service');
const _ = require('lodash');
const moment = require('moment');
const isString = (str) => typeof str == 'string';

exports.updateProcessedEmployeeLoans = async (employeeLoans) => {
    try {
        for (loan of employeeLoans) {
            const { id } = loan;
            const information = isString(loan.information) ? JSON.parse(loan.information) : loan.information;
            const { emi_amount } = information;

            information.processed = information.processed || [];
            const processedObj = {
                date: moment.utc().format("YYYY-MM-DD HH:mm:ss")
            };
            if (information.processed.length) {
                const checkDateExists = information.processed.find(data => moment(data.date).format('YYYYMM') == moment(processedObj.date).format('YYYYMM'));
                if (checkDateExists) {
                    const index = information.processed.indexOf(checkDateExists);
                    if (index == 0 || index) {
                        information.processed.splice(index, 1, Object.assign(checkDateExists, processedObj));
                        await DeductionLoansService.updateLoans({ information, id });
                        return true;
                    }
                }
            }
            // operations
            information.amount_paid = _.isUndefined(information.amount_paid) ? emi_amount : information.amount_paid + emi_amount;
            information.amount_pending = _.isUndefined(information.amount_pending) ? information.total_amount - emi_amount : information.amount_pending - emi_amount;
            information.no_of_emi_pending = _.isUndefined(information.no_of_emi_pending) ? 0 : information.no_of_emi_pending - 1;
            if (_.isUndefined(information.processed_emi)) information.processed_emi = 0;

            information.processed_emi += 1;
            information.processed.push(processedObj);

            await DeductionLoansService.updateLoans({ information, id });
        }
        return true;
    } catch (err) {
        console.log('processed loans: errr', err);
        return false;
    }
}

exports.updateSkippedEmployeeLoans = async (employeeLoans) => {
    try {
        for (loan of employeeLoans) {
            const { id } = loan;
            const information = isString(loan.information) ? JSON.parse(loan.information) : loan.information;
            information.skipped = information.skipped || [];

            const skippedObj = {
                date: moment.utc().format("YYYY-MM-DD HH:mm:ss")
            };

            if (information.skipped.length) {
                const checkDateExists = information.skipped.find(data => moment(data.date).format('YYYY-MM-DD') == moment(skippedObj.date).format('YYYY-MM-DD'));
                if (checkDateExists) {
                    const index = information.skipped.indexOf(checkDateExists);
                    if (index == 0 || index) {
                        information.skipped.splice(index, 1, Object.assign(checkDateExists, skippedObj));
                        await DeductionLoansService.updateLoans({ information, id });
                        return true;
                    }
                }
            }

            if (_.isUndefined(information.skipped_emi)) information.skipped_emi = 0;

            information.skipped_emi += 1;
            information.skipped.push(skippedObj);

            await DeductionLoansService.updateLoans({ information, id });
        }
        return true;
    } catch (err) {
        console.log('skipped loans: errr', err)
        return false;
    }
}