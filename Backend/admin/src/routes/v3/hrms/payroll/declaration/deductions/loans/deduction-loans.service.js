const { sendResponse } = require(`${utilsFolder}/myService`);
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { commonMessages, declarationMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`);

const { DeductionLoansValidator } = require('./deduction-loans.validation');
const { DeductionLoansModel } = require('./deduction-loans.model');
const DeclarationHelper = require('../../declaration.helper');
const { DeductionsService } = require('../deductions.service');

const DEDUCTION_NAME_LOANS = 'LOANS';
class DeductionLoansService {
    /**
     * @function getLoans
     * @description function to get loans
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     * @author Amit Verma <amitverma@glorobussoft.in>
     */
    static async getLoans(req, res, next) {
        try {

            const { organization_id, employee_id: employeeId, language } = req.decoded;
            const { value, error } = DeductionLoansValidator.getValidation(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            const { financial_year, skip, limit, search } = value;
            const employee_id = employeeId ? employeeId : value.employee_id;

            const [declarationComponentObj] = await DeductionsService.getDeclarationComponents({ deduction_name: DEDUCTION_NAME_LOANS });
            if (!declarationComponentObj) return sendResponse(res, 400, null, "Something went wrong", "Loans Declaration is not present");

            const declaration_component_id = declarationComponentObj.id;
            let [EmployeeLta, totalCount] = await Promise.all([
                DeductionLoansModel.getLoans({ organization_id, financial_year, skip, limit, employee_id, search, declaration_component_id }),
                DeductionLoansModel.getLoans({ organization_id, isCount: true, financial_year, skip, limit, employee_id, search, declaration_component_id }),
            ]);

            if (!EmployeeLta.length) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            totalCount = totalCount.length !== 0 ? totalCount[0]['totalCount'] : 0;
            return sendResponse(res, 200, { totalCount, skipCount: skip + limit, EmployeeLta }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }

    /**
     * @function postLoans
     * @description function to get loans
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    static async postLoans(req, res, next) {
        try {
            const { organization_id, employee_id: loginEmployeeId, language } = req.decoded;

            const { value, error } = DeductionLoansValidator.postValidation(req.body, loginEmployeeId);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            // declaration window and active check
            const isDeclarationWindowOpenAndActive = await DeclarationHelper.isDeclarationWindowOpenAndActive(organization_id);
            if (!isDeclarationWindowOpenAndActive) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            const {
                id, loan_name, start_date, component, frequency, no_of_schedule, loan_process_date,
                status, loan_required_date, rate_of_interest, approved_amount, total_amount,
                amount_paid, amount_pending, financial_year, comment, end_date, emi_amount, no_of_emi_pending
            } = value;
            const employee_id = loginEmployeeId ? loginEmployeeId : value.employee_id;

            // validate employee
            if (!loginEmployeeId) {
                const [employeeObj] = await DeductionLoansModel.getEmployee({ organization_id, employee_id });
                if (!employeeObj) return sendResponse(res, 400, null, translate(declarationMessages, '1', language), translate(declarationMessages, '1', language));
            }

            // get the declaration component obj for the loans
            const [declarationComponentObj] = await DeductionsService.getDeclarationComponents({ deduction_name: DEDUCTION_NAME_LOANS });
            if (!declarationComponentObj) return sendResponse(res, 400, null, "Something went wrong", "Loans Declaration is not present");
            const declaration_component_id = declarationComponentObj.id;

            // create loan (only employee can)
            if (!id && loginEmployeeId) {
                let information = { loan_name, component: 'Loans', loan_required_date, total_amount };
                let loanCreateOrUpdateStatus = await DeductionLoansModel.createLoans({
                    information, financial_year, comment, organization_id, employee_id, declaration_component_id, total_amount, status: 0
                });
                value.id = loanCreateOrUpdateStatus.insertId;

                return sendResponse(res, 200, value, translate(declarationMessages, '2', language), null);

                // update loan
            } else {

                // check employee loan exists or not
                const [employeeLoanInSystem] = await DeductionLoansModel.getLoan({ employee_id, organization_id, id });
                if (!employeeLoanInSystem) return sendResponse(res, 400, null, "Loan details not found!", "Not Found.");

                // if employee
                if (loginEmployeeId) {
                    let information = { loan_name, loan_required_date, total_amount };
                    information = { ...JSON.parse(employeeLoanInSystem.information), ...information };

                    await DeductionLoansModel.updateLoans({
                        information, financial_year, comment, organization_id, employee_id, declaration_component_id, total_amount, id
                    });

                    return sendResponse(res, 200, value, translate(declarationMessages, '3', language), null);

                    // if admin
                } else {

                    // information
                    let information = {
                        loan_name, start_date, end_date, component, frequency, no_of_schedule, loan_process_date,
                        total_amount, amount_paid, amount_pending, emi_amount, no_of_emi_pending, rate_of_interest
                    };
                    information = { ...JSON.parse(employeeLoanInSystem.information), ...information };

                    // update loan
                    await DeductionLoansModel.updateLoans({
                        information, financial_year, comment, organization_id, employee_id,
                        declaration_component_id, total_amount, id, status, approved_amount
                    });

                    return sendResponse(res, 200, value, translate(declarationMessages, '3', language), null);
                }
            }
        } catch (err) {
            next(err)
        }
    }


    /**
     * Delete Loans API
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    static async deleteLoans(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            const { value, error } = DeductionLoansValidator.deleteValidation(req.query);
            if (error) return sendResponse(res, 400, null, translate(commonMessages, "3", language), error.details[0].message);

            // validate employee
            if (!employee_id) {
                const [employeeObj] = await DeductionLoansModel.getEmployee({ organization_id, employee_id });
                if (!employeeObj) return sendResponse(res, 400, null, translate(declarationMessages, '1', language), translate(declarationMessages, '1', language));
            }

            // validate loan
            let [loanData] = await DeductionLoansModel.getLoans({ organization_id, employee_id, financial_year: value.financial_year, id: value.id });
            if (!loanData) return sendResponse(res, 400, null, translate(declarationMessages, '5', language), translate(declarationMessages, '5', language));

            // delete loan
            let data = await DeductionLoansModel.deleteLoan({ organization_id, employee_id, id: value.id });
            if (data.affectedRows < 1) return sendResponse(res, 400, null, "Loan not Deleted!", "Something went wrong");

            // response
            return sendResponse(res, 200, null, translate(declarationMessages, '4', language), null);
        } catch (error) {
            next(error);
        }
    }

    // static async postLoans(req, res, next) {
    //     try {
    //         const { organization_id, employee_id: loginEmployeeId, language } = req.decoded;

    //         const { value, error } = DeductionLoansValidator.postValidation(req.body, loginEmployeeId);
    //         if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

    //         // declaration window and active check
    //         const isDeclarationWindowOpenAndActive = await DeclarationHelper.isDeclarationWindowOpenAndActive(organization_id);
    //         if (!isDeclarationWindowOpenAndActive) {
    //             return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
    //         }

    //         const {
    //             id, loan_name, start_date, component, frequency, no_of_schedule, loan_process_date,
    //             total_amount, amount_paid, amount_pending, financial_year, comment, end_date, emi_amount
    //         } = value;
    //         const employee_id = loginEmployeeId ? loginEmployeeId : value.employee_id;

    //         // validate employee
    //         if (!loginEmployeeId) {
    //             const [employeeObj] = await DeductionsService.getEmployee({ organization_id, employee_id });
    //             if (!employeeObj) return sendResponse(res, 400, null, "Employee not found", "Employee not found");
    //         }

    //         // get the declaration component obj for the loans
    //         const [declarationComponentObj] = await DeductionsService.getDeclarationComponents({ deduction_name: DEDUCTION_NAME_LOANS });
    //         if (!declarationComponentObj) return sendResponse(res, 400, null, "Something went wrong", "Loans Declaration is not present");
    //         const declaration_component_id = declarationComponentObj.id;

    //         // check employee loans exists or not
    //         const [employeeLoanInSystem] = await DeductionLoansModel.getLoans({ loan_name, financial_year, employee_id, organization_id, id });

    //         //if loan details is not present then create otherwise update the records
    //         let loanCreateOrUpdateStatus = null;
    //         let information = { loan_name, start_date, end_date, component, frequency, no_of_schedule, loan_process_date, total_amount, amount_paid, amount_pending, emi_amount };

    //         if (!employeeLoanInSystem) {
    //             loanCreateOrUpdateStatus = await DeductionLoansModel.createLoans({
    //                 information, financial_year, comment, organization_id, employee_id, declaration_component_id, total_amount
    //             });
    //             value.id = loanCreateOrUpdateStatus.insertId;
    //         } else {
    //             information = { ...JSON.parse(employeeLoanInSystem.information), ...information };
    //             loanCreateOrUpdateStatus = await DeductionLoansModel.updateLoans({
    //                 information, financial_year, comment, organization_id, employee_id, declaration_component_id, total_amount
    //             });
    //         }
    //         return sendResponse(res, 200, value, translate(commonMessages, "1", language), null);
    //     } catch (err) {
    //         next(err)
    //     }
    // }

    static async getEmployeeApprovedLoans({ organization_id, employee_id, financial_year, date }) {
        try {
            if (!(organization_id && date)) throw new Error('missing params');

            const orgApprovedLoans = await DeductionLoansModel.getEmployeeApprovedLoans({ organization_id, employee_id, financial_year, date });
            if (!orgApprovedLoans || !orgApprovedLoans.length) throw new Error('No Data');
            const formatEmployeeLoans = this.formatEmployeeLoans(orgApprovedLoans);
            return formatEmployeeLoans;
        } catch (err) {
            console.log(err)
            throw err;
        }
    }

    /**
     * formatEmployeeLoans - format Employee Loans
     * 
     * @param {*} orgLoans 
     * @returns 
     */
    static formatEmployeeLoans(orgLoans) {
        const resultObj = {};
        for (const empLoan of orgLoans) {
            if (!resultObj[empLoan.employee_id]) {
                resultObj[empLoan.employee_id] = [];
            }
            resultObj[empLoan.employee_id].push(empLoan)
        }
        return resultObj;
    }

    static async updateLoans({ information, id }) {
        try {
            return await DeductionLoansModel.updateLoans({ information, id });
        } catch (err) {
            throw err;
        }
    }
}

module.exports = { DeductionLoansService };


