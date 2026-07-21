const runPayrollPreviewModel = require('./preview.model');
const PreviewHelper = require('./preview.helper');
const moment = require('moment');
const { DeductionLoansService } = require('../../declaration/deductions/loans/deduction-loans.service');
const loanEvent = require('../../declaration/deductions/loans/event/loans.eventEmitter');
const { UPDATE_PROCESSED_EMPLOYEE_LOANS, UPDATE_SKIPPED_EMPLOYEE_LOANS } = require('../../declaration/deductions/loans/event/loans.constant');
const payrollCommon = require('../../common/payroll/Calculation');
const { DeductionModel } = require('../../declaration/deductions/deductions.model');

const SALARY_COMPONENT_TYPE_EARNING = 1;
const SALARY_COMPONENT_TYPE_DEDUCTION = 2;
const MARCH = 3;
const DECMIAL_PALACES_IN_RESULT = 2;
const CTC_STR = 'CTC';
const GROSS_STR = 'GROSS';
const SYSTEM_CALC_EXPRESSION_STR = 'SYS_CALC';
const SYS_CALC_RULE = 'SYS_CALC'
const DEDUCTION_LOP_NOT_DEPENDENT = ["Employee_ESIC", "Employee_PF", "PT", "Admin_Charges"];

class RunPayrollPreviewService {
    async getPreview({ organization_id, limit, skip, employeeId, isCount, date, calcType, isOverrideCalc, isCompleteAction = false }) {
        try {

            // check for existing data for previous date
            let yyMMNow = moment().format("YYYY-MM");
            let yyMMDate = moment(date).format("YYYY-MM");


            if (
                isOverrideCalc == "undefined" ||
                (isOverrideCalc != "undefined" && !isOverrideCalc)
            ) {
                if (yyMMDate < yyMMNow && await this.isExistingPreviewData({ date, organization_id })) {
                    return await this.getExistingPreviewData({ organization_id, limit, skip, employeeId, isCount, date, calcType });
                }
            }


            calcType = calcType ? calcType : "M";
            const preiewData = [];
            const [payrollPolicyDataForAnOrganization, [orgSetting], ptSetting] = await Promise.all([
                this.getPayrollPoliciesForAnOranization(organization_id),
                runPayrollPreviewModel.getOrgSettings(organization_id),
                runPayrollPreviewModel.getPTSetting(organization_id)
            ]);
            const orgTempSetting = orgSetting ? JSON.parse(orgSetting.settings) : null;


            // custom salary preview
            if (orgTempSetting && orgTempSetting.isCustomSalary) {
                return await this.getCustomSalaryPreview({ organization_id, limit, skip, employeeId, isCount, date, calcType, isCompleteAction });
            }


            const payrollPolicyIds = payrollPolicyDataForAnOrganization.map(payrollData => payrollData.policyId);

            const employeeWithPayrollPolicy = await runPayrollPreviewModel.getEmployeeWithPayrollPolicy({ organization_id, payrollPolicyIds, limit, skip, employeeId, isCount, date });

            //return from here for count
            if (isCount) {
                return employeeWithPayrollPolicy.length;
            }

            const employeeIdArr = employeeWithPayrollPolicy.map(ep => ep.employee_id);
            const employeeLopObjArr = await runPayrollPreviewModel.getEmployeeLop({ organization_id, employeeId, employeeIdArr, date, calcType })
            const defaultScheme = await runPayrollPreviewModel.getDefaultScheme();

            let ctcDivideCoEfficent = 1;
            if (calcType == 'M') {
                ctcDivideCoEfficent = 12
            }
            //financial year calc
            let financial_year = getFinancialYear(date)

            //get employee/organization excemption calculations
            const employeeExcemptions = await this.getEmployeeExcemption({ organization_id, employee_id: employeeId, financial_year })
            let employeeApprovedLoans = {};
            try {
                employeeApprovedLoans = await DeductionLoansService.getEmployeeApprovedLoans({ organization_id, employee_id: employeeId, date })
            } catch (e) {
                employeeApprovedLoans = {};
            }

            // employee paid and previous earnings from employer
            const employeePreviousEarningsAndPayments = await this.getEmployeePreviousEarningsAndPayments({ organization_id, employee_id: employeeId, financial_year, date });

            const isGrossDependentSalaryStructure = orgTempSetting && orgTempSetting.salaryStructure && orgTempSetting.salaryStructure.toLowerCase() == GROSS_STR.toLowerCase() ? true : false;
            const lopDependent = orgTempSetting ? orgTempSetting.lopDependent : false;
            const salaryStructure = orgTempSetting ? orgTempSetting.salaryStructure : CTC_STR;
            for (const employeeObj of employeeWithPayrollPolicy) {

                const employeeLopObj = employeeLopObjArr.find(el => el.employee_id == employeeObj.employee_id);
                let noOfLopDays = null;
                let noOfWorkingDays = moment(date).daysInMonth();
                let payoutStatus = null;
                let noOfPresentDays = null;
                if (employeeLopObj) {
                    noOfWorkingDays = employeeLopObj.working_days ? employeeLopObj.working_days : noOfWorkingDays;
                    noOfPresentDays = employeeLopObj.present_days || 0;
                    noOfLopDays = employeeLopObj.lop;
                    payoutStatus = employeeLopObj.payout_status;

                }

                // make salary components zero condition
                let makeCalcZero = false;
                if (noOfWorkingDays <= noOfLopDays) {
                    makeCalcZero = true;
                }

                let employeePayrollData = {};
                let ctc = numToNthPrecision(employeeObj.ctc / ctcDivideCoEfficent, DECMIAL_PALACES_IN_RESULT);
                let gross = numToNthPrecision(employeeObj.gross / ctcDivideCoEfficent, DECMIAL_PALACES_IN_RESULT);

                let isSalaryInHand = employeeObj.salary_in_hand == 1 ? true : false;
                
                employeePayrollData.gross = null;
                employeePayrollData.isSalaryHold = false;
                employeePayrollData.isSalaryInHand = isSalaryInHand;
                employeePayrollData.lop = null;
                employeePayrollData.noOfLopDays = noOfLopDays;
                employeePayrollData.noOfWorkingDays = noOfWorkingDays;
                employeePayrollData.noOfPresentDays = noOfPresentDays;
                employeePayrollData.employeeId = employeeObj.employee_id;
                employeePayrollData.payrollPolicyId = employeeObj.payroll_policy_id;
                employeePayrollData.ctc = ctc;
                employeePayrollData.bankName = employeeObj.bank_name;
                employeePayrollData.accountNumber = employeeObj.account_number;
                employeePayrollData.ifscCode = employeeObj.ifsc_code;
                employeePayrollData.address = employeeObj.address;
                employeePayrollData.pfNumber = employeeObj.pf_number;
                employeePayrollData.esiNumber = employeeObj.esi_number;
                employeePayrollData.epsNumber = employeeObj.eps_number;
                employeePayrollData.uanNumber = employeeObj.uan_number;
                employeePayrollData.panNumber = employeeObj.pan_number;
                employeePayrollData.firstName = employeeObj.first_name;
                employeePayrollData.lastName = employeeObj.last_name;
                employeePayrollData.locationId = employeeObj.location_id;
                employeePayrollData.fullName = employeeObj.full_name;
                employeePayrollData.location = employeeObj.location;
                employeePayrollData.departmentId = employeeObj.department_id;
                employeePayrollData.departmentName = employeeObj.department_name
                employeePayrollData.empCode = employeeObj.emp_code;
                employeePayrollData.roleId = employeeObj.role_id;
                employeePayrollData.role = employeeObj.role;
                employeePayrollData.payoutStatus = payoutStatus;
                employeePayrollData.paymentMode = "STATIC";
                employeePayrollData.salaryStructure = salaryStructure;

                let salaryComponents = [];
                const employeePolicyObj = payrollPolicyDataForAnOrganization.find(policy => policy.policyId == employeeObj.payroll_policy_id);


                let salaryReleaseObject = [];
                if (employeeObj.salary_on_hold) {
                    let salary_on_hold = JSON.parse(employeeObj.salary_on_hold);
                    const previewMonth = +moment(date).format('MM');
                    const previewYear = +moment(date).format('YYYY');
                    let from = salary_on_hold.from.split('-');
                    let to = salary_on_hold.to.split('-');

                    if (salary_on_hold.status == "hold" &&
                        (previewMonth >= from[1] &&
                            previewMonth <= to[1] &&
                            previewYear == from[0])
                    )
                        employeePayrollData.isSalaryHold = true;

                    else if (salary_on_hold.status == "pay" && (salary_on_hold.monthReleased == previewMonth && previewYear == salary_on_hold.YearReleased)) {
                        salaryReleaseObject = {
                            salaryComponentId: null,
                            rule: 'CUSTOM',
                            componentName: 'Released Salary',
                            componentType: SALARY_COMPONENT_TYPE_EARNING,
                        };

                        let [salaryHoldData] = await runPayrollPreviewModel.getEmployeeSalaryHoldData({ employee_id: employeeObj.employee_id, startMonth: parseInt(from[1], 10), endMonth: parseInt(to[1], 10), year: previewYear, salaryStructure });
                        salaryReleaseObject.calculatedValue = salaryHoldData?.totalAmount || 0;
                        gross += salaryReleaseObject.calculatedValue || 0;
                    }
                }


                //adding reimbursement approved ammount

                let dateObject = new Date(date);

                let lastDate = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 0).getDate();
                let firstDate = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 1).getDate();
                let currentMonth = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 0).getMonth() + 1;
                let currentYear = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 0).getFullYear();

                let startDataFormat = currentYear + '-' + currentMonth + '-' + firstDate;
                let endDataFormat = currentYear + '-' + currentMonth + '-' + lastDate;
                let reimbursementAmount = await DeductionModel.getReimbursementAmount({ employee_id: employeeObj.employee_id, startDataFormat, endDataFormat });


                let calculatedValue = reimbursementAmount[0].totalAmount ? reimbursementAmount[0].totalAmount : 0;

                if (calculatedValue > 0) {

                    let reimbursementObject = {
                        salaryComponentId: null,
                        rule: 'CUSTOM',
                        componentName: 'Reimbursement',
                        componentType: SALARY_COMPONENT_TYPE_EARNING,
                    };


                    reimbursementObject.calculatedValue = calculatedValue;

                    gross += reimbursementObject.calculatedValue;
                    customSalaryComponents.push(reimbursementObject);

                }

                if (employeePolicyObj) {
                    salaryComponents = employeePolicyObj.salaryComponents;
                    let calculatedPayroll = {}
                    let systemDependentCalculatedPayroll = {};

                    const salaryPerDay = numToNthPrecision((isGrossDependentSalaryStructure ? gross : ctc) / noOfWorkingDays, DECMIAL_PALACES_IN_RESULT);
                    const lop = noOfLopDays ? numToNthPrecision(noOfLopDays * salaryPerDay, DECMIAL_PALACES_IN_RESULT) : 0;

                    // lop dependent
                    if (lopDependent) {
                        ctc = numToNthPrecision(ctc - lop, DECMIAL_PALACES_IN_RESULT);
                        gross = numToNthPrecision(gross - lop, DECMIAL_PALACES_IN_RESULT);
                    }

                    if ((isGrossDependentSalaryStructure && employeeObj.gross) || employeeObj.ctc) {
                        calculatedPayroll = PreviewHelper.calculatePayroll(employeePolicyObj, { ctc: ctc, gross: gross });

                        if (!isGrossDependentSalaryStructure) {
                            gross = salaryComponents.filter(sc => sc.componentType == SALARY_COMPONENT_TYPE_EARNING)
                                .map(sc => sc.componentName)
                                .reduce((acc, sc) => acc + (+calculatedPayroll[sc]), 0);

                            gross = gross ? numToNthPrecision(gross, DECMIAL_PALACES_IN_RESULT) : 0;
                        }

                        systemDependentCalculatedPayroll = await PreviewHelper.calculateSystemDependentPayroll({
                            policyObj: employeePolicyObj,
                            valueObj: calculatedPayroll,
                            empSetting: employeeObj, orgSetting, gross, ptSetting
                        });

                        calculatedPayroll = { ...calculatedPayroll, ...systemDependentCalculatedPayroll };

                        let netDeduction = salaryComponents.filter(sc => sc.componentType == SALARY_COMPONENT_TYPE_DEDUCTION)
                            .map(sc => sc.componentName)
                            .reduce(function (acc, sc) {
                                let value = 0;
                                if (typeof calculatedPayroll[sc] == 'object') {
                                    if (calculatedPayroll[sc].employee) value += +calculatedPayroll[sc].employee;

                                    // PF employer
                                    if (
                                        !isGrossDependentSalaryStructure &&
                                        (sc.match(/PF/gi) && orgTempSetting.employerPfContributionIncludedInCtc)
                                    ) {
                                        if (calculatedPayroll[sc].employer) value += +calculatedPayroll[sc].employer;
                                    }

                                    // ESIC employer
                                    if (
                                        !isGrossDependentSalaryStructure &&
                                        (sc.match(/ESI/gi) && orgTempSetting.includeEmployerEsiContributionInCtc)
                                    ) {
                                        if (calculatedPayroll[sc].employer) value += +calculatedPayroll[sc].employer;
                                    }
                                } else {
                                    value = +calculatedPayroll[sc];
                                }
                                return acc + value;
                            }, 0);


                        netDeduction = netDeduction ? numToNthPrecision(netDeduction, DECMIAL_PALACES_IN_RESULT) : 0;
                        let netSalary = gross - netDeduction;

                        // lop dependent
                        if (!lopDependent) {
                            netSalary -= lop;
                        }
                        //adding gross in data
                        employeePayrollData.gross = makeCalcZero ? 0 : gross;
                        employeePayrollData.netDeduction = makeCalcZero ? 0 : netDeduction;
                        employeePayrollData.lop = lop;
                        employeePayrollData.noOfLopDays = noOfLopDays;


                        const employeePayment = employeePreviousEarningsAndPayments.find(ep => ep.employee_id == employeeObj.employee_id)
                        const earningOfEmployee = (employeePayment ? (employeePayment.gross_paid || 0) + (employeePayment.earnings || 0) : 0) + calcRemainingMonthsGross(date, +gross);
                        const tdsPaidByEmployee = (employeePayment ? (employeePayment.tds_paid || 0) + (employeePayment.tds || 0) : 0) || 0;
                        const remainingMonthsOfFY = calcRemainingMonthsGross(date, 1); // will give the remaining month of the FY, 1 is used for mutiliple identifier

                        // tds
                        const tds = await PreviewHelper.getTDS({
                            defaultScheme, employeeObj,
                            contract_scheme_id: employeeObj.contract_scheme_id,
                            scheme_employee_type: employeeObj.employee_type,
                            type: employeeObj.type,
                            earnings: earningOfEmployee, monthlyEarning: +gross,
                            tdsPaid: tdsPaidByEmployee, remainingMonths: remainingMonthsOfFY,
                            exemptions: employeeExcemptions[employeeObj.employee_id] ? employeeExcemptions[employeeObj.employee_id].approved_amount : 0,
                            // otherDeduction: netDeduction ? +netDeduction * ctcDivideCoEfficent : 0,
                            otherDeduction: 0,
                            otherSource: employeeExcemptions[employeeObj.employee_id] ? employeeExcemptions[employeeObj.employee_id].other_income : 0
                        });
                        employeePayrollData.tdsDetails = tds;
                        employeePayrollData.type = employeeObj.type;
                        employeePayrollData.tds = makeCalcZero ? 0 : tds.taxMonthlyPayable;
                        netSalary -= tds.taxMonthlyPayable;

                        // add loans in deduction parts which cut from net salary
                        if (employeeApprovedLoans[employeeObj.employee_id]) {
                            const { loanAsSalaryComponents, loansAsCalculatedPayroll, totalLoanAmount, processedLoans, skippedLoans } = calculateLoansForEmployee(employeeApprovedLoans[employeeObj.employee_id], netSalary);
                            if (loanAsSalaryComponents && loanAsSalaryComponents.length) employeePolicyObj.salaryComponents = [...employeePolicyObj.salaryComponents, ...loanAsSalaryComponents];
                            if (loansAsCalculatedPayroll && Object.keys(loansAsCalculatedPayroll).length) calculatedPayroll = { ...calculatedPayroll, ...loansAsCalculatedPayroll };
                            if (totalLoanAmount) netSalary -= totalLoanAmount;
                            if (isCompleteAction) {
                                if (processedLoans && processedLoans.length) loanEvent.emit(UPDATE_PROCESSED_EMPLOYEE_LOANS, processedLoans);
                                if (skippedLoans && skippedLoans.length) loanEvent.emit(UPDATE_SKIPPED_EMPLOYEE_LOANS, skippedLoans);
                            }
                        }
                        employeePayrollData.netSalary = makeCalcZero ? 0 : netSalary < 0 ? 0 : numToNthPrecision(netSalary, DECMIAL_PALACES_IN_RESULT);
                    }


                    salaryComponents = employeePolicyObj.salaryComponents.map(sc => {
                        return {
                            ...sc,
                            calculatedValue: calculatedPayroll[sc.componentName] ? calculatedPayroll[sc.componentName] : 'NA'
                        }
                    });



                    employeePayrollData.salaryComponents = makeCalcZero ? makeSalaryComponentsZero(salaryComponents) : salaryComponents;
                    if (salaryReleaseObject.calculatedValue > 0)
                        employeePayrollData.salaryComponents.push(salaryReleaseObject);
                }

                preiewData.push(employeePayrollData);

            }
            return preiewData;
        } catch (err) {
            throw err;
        }
    }

    async getPayrollPoliciesForAnOranization(organizationId) {
        try {
            const orgParyrollPolicyData = await runPayrollPreviewModel.getPayrollPolicyData(organizationId);

            if (!orgParyrollPolicyData.length) throw new Error('No Payroll Policy present for the organization');
            const fetchOrgSettings = await this.getOrgPayrollSettings(organizationId);
            const salaryStructure = fetchOrgSettings && fetchOrgSettings.salaryStructure ? fetchOrgSettings.salaryStructure : null;
            const formatedGetData = PreviewHelper.formatCreateStructureData(orgParyrollPolicyData, salaryStructure && salaryStructure.toUpperCase() == GROSS_STR.toUpperCase() ? true : false);
            return formatedGetData;
        } catch (err) {
            throw err;
        }
    }

    async completeAction({ organization_id, date, calcType, isOverrideCalc, employeeId }) {
        try {
            date = date ? new Date(date) : new Date();
            const dateMonth = date.getMonth() + 1;
            const dateYear = date.getFullYear();

            const employeeInPayrollData = await runPayrollPreviewModel.getEmployeeInPayrollData({ organization_id, month: dateMonth, year: dateYear });
            const employeeIdsInPayrollData = new Set(employeeInPayrollData.map(ed => ed.employee_id));

            calcType = calcType ? calcType : "M";
            const previewDataArr = await this.getPreview({ organization_id, date, calcType, isOverrideCalc, isCompleteAction: true, employeeId });

            for (let i = 0; i < previewDataArr.length; i++) {


                const payrollData = previewDataArr[i];

                let employeePayrollData = {
                    gross: payrollData.gross > 0 ? payrollData.gross : 0,
                    netpay: payrollData.netSalary > 0 ? payrollData.netSalary : 0,
                    non_lop_gross: payrollData.non_lop_gross > 0 ? payrollData.non_lop_gross : 0,
                    details: {
                        ...payrollData
                    },
                    salary_hold: {
                        isSalaryHold: payrollData.isSalaryHold
                    }
                };
                if (employeeIdsInPayrollData.has(payrollData.employeeId)) {
                    // update
                    await runPayrollPreviewModel.updateEmployeePayrollData(
                        { organization_id, month: dateMonth, year: dateYear, employee_id: payrollData.employeeId },
                        employeePayrollData
                    )
                } else {
                    // insert
                    await runPayrollPreviewModel.insertEmployeePayrollData({
                        organization_id, month: dateMonth,
                        year: dateYear, employee_id: payrollData.employeeId,
                        ...employeePayrollData
                    })
                }
            }
            return true;
        } catch (err) {
            throw err;
        }
    }

    async getEmployeeExcemption({ employee_id, financial_year, organization_id }) {
        try {
            const declarationByEmployee = await runPayrollPreviewModel.getemployeeDeclarations({ employee_id, financial_year, organization_id });
            if (!declarationByEmployee || !declarationByEmployee.length) {
                return [];
            }
            const sectionDeclarationLimit = formatDeclarationLimit(await runPayrollPreviewModel.getSectionDeclarationLimit());
            const formatedEmployeeDeclarationData = formatEmployeeDeclarationData(declarationByEmployee, sectionDeclarationLimit);
            // console.log({ sectionDeclarationLimit, formatedEmployeeDeclarationData: JSON.stringify(formatedEmployeeDeclarationData) });
            return formatedEmployeeDeclarationData;
        } catch (err) {
            throw err;
        }
    }

    async isExistingPreviewData({ date, organization_id }) {
        try {
            const previewYear = moment(date).format('YYYY');
            const previewMonth = moment(date).format('M');
            const [previewData] = await runPayrollPreviewModel.checkPreviewDataExists({ year: previewYear, month: previewMonth, organization_id });
            return previewData.has_preview_data;
        } catch (err) {
            throw err;
        }
    }

    async getExistingPreviewData({ organization_id, limit, skip, employeeId, isCount, date, calcType }) {
        try {
            const previewYear = moment(date).format('YYYY');
            const previewMonth = moment(date).format('M');
            const existingPreviewData = await runPayrollPreviewModel.getExistingPreviewData({
                organization_id, limit, skip, employeeId, isCount, date, year: previewYear, month: previewMonth
            });
            if (!existingPreviewData || !existingPreviewData.length) {
                throw new Error('No Data');
            }
            if (isCount) {
                return existingPreviewData[0].totalCount;
            }
            return existingPreviewData.map(data => {
                data = JSON.parse(data.details)
                data.salary_hold = data.salary_hold ? JSON.parse(data.salary_hold) : []
                data.isSalaryHold = data.isSalaryHold ? data.isSalaryHold : false
                return data
            });
        } catch (err) {
            throw err;
        }
    }

    /**
     * getOrgPayrollSettings - function to org payroll settings
     *
     * @param {*} organizationId
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getOrgPayrollSettings(organizationId) {
        try {
            const [orgSettings] = await runPayrollPreviewModel.getOrgSettings(organizationId);
            if (!orgSettings || !orgSettings.settings) return null;
            return JSON.parse(orgSettings.settings);
        } catch (err) {
            throw err;
        }
    }

    /**
     * getCustomSalaryPreview - function to get the custom salary preview
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getCustomSalaryPreview({ organization_id, limit, skip, employeeId, isCount, date, calcType, isCompleteAction }) {

        let [employeeWithCustomSalary, [orgSetting], OrgPtSetting] = await Promise.all([
            runPayrollPreviewModel.getEmployeeWithPayrollPolicy({ organizationId: organization_id, limit, skip, employeeId, isCount, date, isCustomSalary: true }),
            runPayrollPreviewModel.getOrgSettings(organization_id),
            runPayrollPreviewModel.getPTSetting(organization_id)
        ]);
        // const employeeWithCustomSalary = await runPayrollPreviewModel.getEmployeeWithCustomSalary({ organization_id, limit, skip, employeeId, isCount, date });
        const orgTempSetting = orgSetting ? JSON.parse(orgSetting.settings) : null;
        if (isCount) {
            return employeeWithCustomSalary.length;
        }

        const employeeIdArr = employeeWithCustomSalary.map(ep => ep.employee_id);
        const employeeLopObjArr = await runPayrollPreviewModel.getEmployeeLop({ organization_id, employeeId, employeeIdArr, date, calcType })
        const defaultScheme = await runPayrollPreviewModel.getDefaultScheme();

        let ctcDivideCoEfficent = 1;
        if (calcType == 'M') {
            ctcDivideCoEfficent = 12
        }
        //financial year calc
        let financial_year = getFinancialYear(date);

        //get employee/organization excemption calculations
        const employeeExcemptions = await this.getEmployeeExcemption({ organization_id, employee_id: employeeId, financial_year })
        let employeeApprovedLoans = {};
        try {
            employeeApprovedLoans = await DeductionLoansService.getEmployeeApprovedLoans({ organization_id, employee_id: employeeId, date })
        } catch (e) {
            employeeApprovedLoans = {};
        }
        // employee paid and previous earnings from employer
        const employeePreviousEarningsAndPayments = await this.getEmployeePreviousEarningsAndPayments({ organization_id, employee_id: employeeId, financial_year, date });

        const isGrossDependentSalaryStructure = orgTempSetting && orgTempSetting.salaryStructure && orgTempSetting.salaryStructure.toLowerCase() == GROSS_STR.toLowerCase() ? true : false;
        const lopDependent = orgTempSetting ? orgTempSetting.lopDependent : false;
        const salaryStructure = orgTempSetting ? orgTempSetting.salaryStructure : CTC_STR;
        const ctcKey = 'monthly_ctc';
        const grossKey = 'gross_salary';
        const basicKey = 'basic_allowance';
        const previewData = [];


        for (const employeeObj of employeeWithCustomSalary) {

            const salaryComponents = employeeObj.salary_components ? JSON.parse(employeeObj.salary_components) : {};
            const additionalComponents = employeeObj.additional_components ? JSON.parse(employeeObj.additional_components) : null;
            const additionalDeductionComponents = employeeObj.deduction_components ? JSON.parse(employeeObj.deduction_components) : null;
            if (!Object.keys(salaryComponents).length) continue;


            const { annual_ctc, monthly_ctc, gross_salary, employer_pf, employer_esic, admin_charges, ...earningComponents } = salaryComponents;
            const employee_pf = employer_pf ? employer_pf : 0;
            const Employee_PF = { employer: employer_pf, employee: employee_pf };
            const Employee_ESIC = { employer: employer_esic, employee: 0 };
            const Admin_Charges = admin_charges ? admin_charges : 0;
            const PT = null;

            let deductionComponents = { Employee_ESIC, Employee_PF, PT, Admin_Charges };
            // const deductionComponents = { Employee_ESIC, Employee_PF, PT };
            let earningComponentsWithAdditionalComponents = earningComponents;
            let deductionComponentsWithAdditionalComponents = deductionComponents;
            let additionalComponentKeys = [];
            let additionalDeductionComponentKeys = [];


            if (additionalComponents && additionalComponents.length) {
                const { formatComponents, components } = formatAdditionalComponentsAsSalaryComponents(additionalComponents, date, orgTempSetting.payoutDate || 0);
                if (
                    formatComponents &&
                    Object.keys(formatComponents).length
                ) {
                    additionalComponentKeys = Object.keys(formatComponents);
                    earningComponentsWithAdditionalComponents = {
                        ...earningComponentsWithAdditionalComponents,
                        ...formatComponents
                    };
                }
            }


            if (additionalDeductionComponents && additionalDeductionComponents.length) {
                const { formatComponents, components } = formatAdditionalComponentsAsSalaryComponents(additionalDeductionComponents, date, orgTempSetting.payoutDate || 0);
                if (
                    formatComponents &&
                    Object.keys(formatComponents).length
                ) {
                    additionalDeductionComponentKeys = Object.keys(formatComponents);
                    deductionComponentsWithAdditionalComponents = {
                        ...deductionComponentsWithAdditionalComponents,
                        ...formatComponents
                    };
                }
            }

            const basic = salaryComponents[basicKey];
            let netDeduction = 0;
            const employeeLopObj = employeeLopObjArr.find(el => el.employee_id == employeeObj.employee_id);

            let noOfLopDays = null;
            let noOfWorkingDays = moment(date).daysInMonth();
            let payoutStatus = null;
            let noOfPresentDays = null;

            if (employeeLopObj) {
                noOfWorkingDays = employeeLopObj.working_days ? employeeLopObj.working_days : noOfWorkingDays;
                noOfPresentDays = employeeLopObj.present_days || 0;
                noOfLopDays = employeeLopObj.lop;
                payoutStatus = employeeLopObj.payout_status;

            }

            // make salary components zero condition
            let makeCalcZero = false;
            if (noOfWorkingDays <= noOfLopDays) {
                makeCalcZero = true;
            }

            let employeePayrollData = {};
            let gross = 0;
            let grossWithoutAdditionalComponents = 0;
            let ctc = 0;

            let isSalaryInHand = employeeObj.salary_in_hand == 1 ? true : false;

            const customSalaryComponents = [];
            employeePayrollData.isCustomSalary = true;
            employeePayrollData.isSalaryHold = false;
            employeePayrollData.isSalaryInHand = isSalaryInHand;
            employeePayrollData.lop = null;
            employeePayrollData.noOfLopDays = noOfLopDays;
            employeePayrollData.noOfWorkingDays = noOfWorkingDays;
            employeePayrollData.noOfPresentDays = noOfPresentDays;
            employeePayrollData.employeeId = employeeObj.employee_id;
            employeePayrollData.payrollPolicyId = employeeObj.payroll_policy_id;
            employeePayrollData.ctc = ctc;
            employeePayrollData.bankName = employeeObj.bank_name;
            employeePayrollData.accountNumber = employeeObj.account_number;
            employeePayrollData.ifscCode = employeeObj.ifsc_code;
            employeePayrollData.address = employeeObj.address;
            employeePayrollData.pfNumber = employeeObj.pf_number;
            employeePayrollData.esiNumber = employeeObj.esi_number;
            employeePayrollData.epsNumber = employeeObj.eps_number;
            employeePayrollData.uanNumber = employeeObj.uan_number;
            employeePayrollData.panNumber = employeeObj.pan_number;
            employeePayrollData.firstName = employeeObj.first_name;
            employeePayrollData.lastName = employeeObj.last_name;
            employeePayrollData.locationId = employeeObj.location_id;
            employeePayrollData.fullName = employeeObj.full_name;
            employeePayrollData.location = employeeObj.location;
            employeePayrollData.departmentId = employeeObj.department_id;
            employeePayrollData.departmentName = employeeObj.department_name
            employeePayrollData.empCode = employeeObj.emp_code;
            employeePayrollData.roleId = employeeObj.role_id;
            employeePayrollData.role = employeeObj.role;
            employeePayrollData.payoutStatus = payoutStatus;
            employeePayrollData.paymentMode = "STATIC";
            employeePayrollData.salaryStructure = salaryStructure;


            let salaryReleaseObject = [];
            if (employeeObj.salary_on_hold) {
                let salary_on_hold = JSON.parse(employeeObj.salary_on_hold)
                const previewMonth = +moment(date).format('MM');
                const previewYear = +moment(date).format('YYYY');
                let from = salary_on_hold.from.split('-');
                let to = salary_on_hold.to.split('-');

                if (salary_on_hold.status == "hold" &&
                    (previewMonth >= from[1] &&
                        previewMonth <= to[1] &&
                        previewYear == from[0]))
                    employeePayrollData.isSalaryHold = true;

                else if (salary_on_hold.status == "pay" && (salary_on_hold.monthReleased == previewMonth && previewYear == salary_on_hold.YearReleased)) {
                    salaryReleaseObject = {
                        salaryComponentId: null,
                        rule: 'CUSTOM',
                        componentName: 'Released Salary',
                        componentType: SALARY_COMPONENT_TYPE_EARNING,
                    };

                    let [salaryHoldData] = await runPayrollPreviewModel.getEmployeeSalaryHoldData({ employee_id: employeeObj.employee_id, startMonth: parseInt(from[1], 10), endMonth: parseInt(to[1], 10), year: previewYear, salaryStructure });
                    salaryReleaseObject.calculatedValue = salaryHoldData.totalAmount;
                    gross += salaryReleaseObject.calculatedValue;
                    customSalaryComponents.push(salaryReleaseObject);
                }
            }

            //adding reimbursement approved ammount

            let dateObject = new Date(date);

            let lastDate = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 0).getDate();
            let firstDate = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 1).getDate();
            let currentMonth = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 0).getMonth() + 1;
            let currentYear = new Date(dateObject.getFullYear(), dateObject.getMonth() + 1, 0).getFullYear();

            let startDataFormat = currentYear + '-' + currentMonth + '-' + firstDate;
            let endDataFormat = currentYear + '-' + currentMonth + '-' + lastDate;
            let reimbursementAmount = await DeductionModel.getReimbursementAmount({ employee_id: employeeObj.employee_id, startDataFormat, endDataFormat });


            let calculatedValue = reimbursementAmount[0].totalAmount ? reimbursementAmount[0].totalAmount : 0;

            if (calculatedValue > 0) {

                let reimbursementObject = {
                    salaryComponentId: null,
                    rule: 'CUSTOM',
                    componentName: 'Reimbursement',
                    componentType: SALARY_COMPONENT_TYPE_EARNING,
                };


                reimbursementObject.calculatedValue = calculatedValue;

                gross += reimbursementObject.calculatedValue;
                customSalaryComponents.push(reimbursementObject);

            }



            //earning components parsing
            for (const componentKey in earningComponentsWithAdditionalComponents) {
                const componentObj = {
                    salaryComponentId: null,
                    rule: 'CUSTOM',
                    componentName: snakecaseToWords(componentKey),
                    componentType: SALARY_COMPONENT_TYPE_EARNING,
                };
                if (additionalComponentKeys.some(ac => componentKey.toLowerCase() == ac.toLowerCase())) {
                    componentObj.calculatedValue = earningComponentsWithAdditionalComponents[componentKey];
                } else {
                    componentObj.calculatedValue = calculateCustomValue(earningComponentsWithAdditionalComponents[componentKey], noOfWorkingDays, noOfLopDays);
                    grossWithoutAdditionalComponents += componentObj.calculatedValue;
                }
                gross += componentObj.calculatedValue;
                customSalaryComponents.push(componentObj);
            }

            if (gross == 0) {
                grossWithoutAdditionalComponents = gross = isGrossDependentSalaryStructure ?
                    calculateCustomValue(gross_salary || 0, noOfWorkingDays, noOfLopDays) :
                    calculateCustomValue(monthly_ctc || 0, noOfWorkingDays, noOfLopDays);
            }
            //esic calc
            let esic = { employee: 0, employer: 0 };
            if (Employee_ESIC && Number(Employee_ESIC.employer)) {
                esic = await payrollCommon.calculateESI({ orgSetting, empSetting: employeeObj, gross: grossWithoutAdditionalComponents });
            }

            //pf calc
            let pf = { employee: 0, employer: 0 };
            if (Employee_PF && Number(Employee_PF.employer)) {
                pf = await payrollCommon.calculatePF({ orgSetting, empSetting: employeeObj, basic: calculateCustomValue(basic, noOfWorkingDays, noOfLopDays), specialAllowance: 0 });
            }

            // calculate admin charges
            let adminCharges = 0;
            if (!isNaN(Admin_Charges) && (pf.employee + pf.employer) > 0) {
                adminCharges = await payrollCommon.calculateAdminCharges({ orgSetting, empSetting: employeeObj, basic: calculateCustomValue(basic, noOfWorkingDays, noOfLopDays) });
            }

            //pt calc
            let ptSetting = OrgPtSetting ? OrgPtSetting.find(pt => pt.location_id == employeeObj.location_id) : null;
            ptSetting = ptSetting ? JSON.parse(ptSetting.details) : null;
            const pt = await payrollCommon.calculatePT({ empSetting: employeeObj, orgSetting, ptSetting: ptSetting ? ptSetting.details : [], gross: grossWithoutAdditionalComponents });

            //adding esic and pt in deductions
            // const employee_esic = esic ? numToNthPrecision(esic.employee) : 0;

            //for overview
            // Employee_ESIC.employee = esic ? numToNthPrecision(esic.employee) : 0;
            // deductionComponentsWithAdditionalComponents.Employee_ESIC = Employee_ESIC;
            deductionComponentsWithAdditionalComponents.Employee_ESIC = esic;
            deductionComponentsWithAdditionalComponents.PT = pt;
            deductionComponentsWithAdditionalComponents.Employee_PF = pf;
            deductionComponentsWithAdditionalComponents.Admin_Charges = adminCharges;

            // deduction components parsing
            for (const componentKey in deductionComponentsWithAdditionalComponents) {
                const componentObj = {
                    salaryComponentId: null,
                    rule: SYS_CALC_RULE,
                    componentName: snakecaseToWords(componentKey),
                    componentType: SALARY_COMPONENT_TYPE_DEDUCTION,
                };

                // basic deduction components non lop dependent
                if (
                    DEDUCTION_LOP_NOT_DEPENDENT.some(dc => componentKey.toLowerCase() == dc.toLowerCase()) ||
                    additionalDeductionComponentKeys.some(dc => componentKey.toLowerCase() == dc.toLowerCase())
                ) {
                    componentObj.calculatedValue = deductionComponentsWithAdditionalComponents[componentKey]
                } else {
                    // calculated value with lop dependent for additional components
                    componentObj.calculatedValue = calculateCustomValue(deductionComponentsWithAdditionalComponents[componentKey], noOfWorkingDays, noOfLopDays);
                }

                if (componentObj.calculatedValue && typeof componentObj.calculatedValue == 'object') {
                    netDeduction += componentObj.calculatedValue.employee;
                } else {
                    netDeduction += componentObj.calculatedValue;
                }
                customSalaryComponents.push(componentObj);
            }

            employeePayrollData.salaryComponents = [...customSalaryComponents, ...employeePayrollData.salaryComponents || []];
            employeePayrollData.ctc = monthly_ctc;
            // let netSalary = gross - employee_pf - employee_esic - pt;
            let netSalary = gross - netDeduction;
            const grossSalary = isGrossDependentSalaryStructure ? gross_salary : monthly_ctc;
            const remainingMonthsOfFY = calcRemainingMonthsGross(date, 1); // will give the remaining month of the FY, 1 is used for mutiliple identifier
            const excludingCurrentMonthDate = moment(date).clone().add(1, 'month');
            const earningInFyExcludingCurrentMonth = remainingMonthsOfFY > 1 ? calcRemainingMonthsGross(excludingCurrentMonthDate, +grossSalary) : 0;
            const employeePayment = employeePreviousEarningsAndPayments.find(ep => ep.employee_id == employeeObj.employee_id)
            const earningOfEmployee = (employeePayment ? (employeePayment.gross_paid || 0) + (employeePayment.earnings || 0) : 0) + grossSalary + earningInFyExcludingCurrentMonth;
            const tdsPaidByEmployee = (employeePayment ? (employeePayment.tds_paid || 0) + (employeePayment.tds || 0) : 0) || 0;

            // tds
            const defaltOldScheme = defaultScheme.find(x => x.scheme == "Old Tax Scheme");
            const tds = await PreviewHelper.getTDS({
                defaultScheme, employeeObj,
                contract_scheme_id: employeeObj.contract_scheme_id,
                scheme_employee_type: employeeObj.employee_type,
                type: employeeObj.type,
                earnings: earningOfEmployee, monthlyEarning: +gross,
                tdsPaid: tdsPaidByEmployee, remainingMonths: remainingMonthsOfFY,
                exemptions: employeeExcemptions[employeeObj.employee_id] ? employeeExcemptions[employeeObj.employee_id].approved_amount : 0,
                // otherDeduction: netDeduction ? +netDeduction * ctcDivideCoEfficent : 0,
                otherDeduction: 0,
                otherSource: employeeExcemptions[employeeObj.employee_id] ? employeeExcemptions[employeeObj.employee_id].other_income : 0
            });

            employeePayrollData.tdsDetails = tds;
            employeePayrollData.non_lop_gross = grossSalary;
            employeePayrollData.tds = makeCalcZero ? 0 : tds.taxMonthlyPayable || 0;
            netSalary -= tds.taxMonthlyPayable || 0;

            // add loans in deduction parts which cut from net salary
            if (employeeApprovedLoans[employeeObj.employee_id]) {
                const { loanAsSalaryComponents, loansAsCalculatedPayroll, totalLoanAmount, processedLoans, skippedLoans } = calculateLoansForEmployee(employeeApprovedLoans[employeeObj.employee_id], netSalary, true);
                const loanWithCalculatedValue = loanAsSalaryComponents.map(sc => {
                    return {
                        ...sc,
                        calculatedValue: loansAsCalculatedPayroll[sc.componentName] ? loansAsCalculatedPayroll[sc.componentName] : 'NA'
                    }
                });
                if (loanAsSalaryComponents && loanAsSalaryComponents.length) employeePayrollData.salaryComponents = [...employeePayrollData.salaryComponents, ...loanWithCalculatedValue];
                if (loansAsCalculatedPayroll && Object.keys(loansAsCalculatedPayroll).length) deductionComponents = { ...deductionComponents, ...loansAsCalculatedPayroll };
                if (totalLoanAmount) netSalary -= totalLoanAmount;
                if (isCompleteAction) {
                    if (processedLoans && processedLoans.length) loanEvent.emit(UPDATE_PROCESSED_EMPLOYEE_LOANS, processedLoans);
                    if (skippedLoans && skippedLoans.length) loanEvent.emit(UPDATE_SKIPPED_EMPLOYEE_LOANS, skippedLoans);
                }
            }

            employeePayrollData.gross = makeCalcZero ? 0 : numToNthPrecision(gross, DECMIAL_PALACES_IN_RESULT);
            employeePayrollData.netDeduction = makeCalcZero ? 0 : numToNthPrecision(netDeduction, DECMIAL_PALACES_IN_RESULT);
            employeePayrollData.netSalary = makeCalcZero ? 0 : netSalary > 0 ? numToNthPrecision(netSalary, DECMIAL_PALACES_IN_RESULT) : 0;

            // make salary component 0 as lop is greater than working days
            if (makeCalcZero) {
                employeePayrollData.salaryComponents = makeSalaryComponentsZero(employeePayrollData.salaryComponents);
            }
            // preview add
            previewData.push(employeePayrollData);
        }
        return previewData;
    }

    /**
     * getEmployeeTds - employee tds process
     * 
     * @param {*} organizationId 
     * @param {*} employeeId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getEmployeeTds(organizationId, employeeId) {
        try {
            const [orgSetting] = await runPayrollPreviewModel.getOrgSettings(organizationId);
            const orgTempSetting = JSON.parse(orgSetting.settings);
            let isCustomSalary = false;
            const queryObj = {
                organizationId, employeeId
            }

            // custom salary preview
            if (orgTempSetting.isCustomSalary) {
                queryObj.isCustomSalary = true;
                isCustomSalary = true;
            }

            const ctcDivideCoEfficent = 12;
            const tdsData = [];
            let ctc = 0;
            let gross = 0;

            // gross / ctc calc
            const isGrossDependentSalaryStructure = orgTempSetting.salaryStructure.toLowerCase() == GROSS_STR.toLowerCase() ? true : false;

            // employee obj fetching
            let [employeeObj] = await runPayrollPreviewModel.getEmployeeWithPayrollPolicy(queryObj);
            if (isCustomSalary) {
                const salaryComponents = employeeObj.salary_components ? JSON.parse(employeeObj.salary_components) : {};
                ctc = salaryComponents.monthly_ctc ? numToNthPrecision(salaryComponents.monthly_ctc || 0, DECMIAL_PALACES_IN_RESULT) : 0;
                gross = salaryComponents.gross_salary ? numToNthPrecision(salaryComponents.gross_salary || 0, DECMIAL_PALACES_IN_RESULT) : 0;
            } else {
                ctc = employeeObj.ctc ? numToNthPrecision(employeeObj.ctc / ctcDivideCoEfficent, DECMIAL_PALACES_IN_RESULT) : 0;
                gross = employeeObj.gross ? numToNthPrecision(employeeObj.gross, DECMIAL_PALACES_IN_RESULT) : 0;
            }

            // employee type check
            const isContractEmployee = +employeeObj.type != 2 ? true : false;
            if (isContractEmployee) {
                return {
                    tdsData, isContractEmployee, gross, ctc,
                    isCustomSalary, salaryStructure: orgTempSetting.salaryStructure
                };
            }

            // get tds scheme
            const defaultScheme = await runPayrollPreviewModel.getDefaultScheme();
            const tdsScheme = await runPayrollPreviewModel.getTdsScheme();

            // loop to add schema data for the employee
            for (const scheme of tdsScheme) {
                employeeObj = { ...employeeObj, ...scheme };

                const tds = await PreviewHelper.getTDS({
                    defaultScheme, employeeObj,
                    contract_scheme_id: employeeObj.contract_scheme_id,
                    scheme_employee_type: employeeObj.employee_type,
                    type: employeeObj.type,
                    earnings: +(isGrossDependentSalaryStructure ? gross : ctc) * ctcDivideCoEfficent,
                });
                tdsData.push({
                    tdsDetails: tds,
                    tds: tds.taxMonthlyPayable || 0,
                    gross, ctc
                })
            }
            return {
                tdsData, isContractEmployee,
                isCustomSalary, salaryStructure: orgTempSetting.salaryStructure
            };
        } catch (err) {
            throw err;
        }
    }

    /**
     * isEmployeeExists - function to check employee exits
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async isEmployeeExists({ organization_id, employee_id }) {
        let exists = false;
        const [employeeExistsStatus] = await runPayrollPreviewModel.getEmployeeExistStatus({ organization_id, employee_id });
        if (employeeExistsStatus) exists = true;
        return exists;
    }

    /**
     * getEmployeePreviousEarningsAndPayments -  get employee payments
     *
     * @param {*} param0
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getEmployeePreviousEarningsAndPayments({ organization_id, employee_id, financial_year, date }) {
        const resultArr = [];
        const employeePreviousPayments = await runPayrollPreviewModel.getEmployeePreviousPayments({ organization_id, employee_id, date, financial_year });
        const employeePreviousEarnings = await runPayrollPreviewModel.getEmployeeIncomeFromPreviousEmployer({ organization_id, employee_id, financial_year });

        const greaterObj = employeePreviousPayments.length >= employeePreviousEarnings.length ? employeePreviousPayments : employeePreviousEarnings;
        const smallerObj = employeePreviousEarnings.length <= employeePreviousPayments.length ? employeePreviousEarnings : employeePreviousPayments;

        for (const ele of greaterObj) {
            const smallerEle = smallerObj.find(so => so.employee_id == ele.employee_id);
            if (smallerEle) {
                resultArr.push({ ...ele, ...smallerEle });
            } else {
                resultArr.push({ ...ele });
            }
        }
        return resultArr;
    }
}

module.exports = new RunPayrollPreviewService();

const snakecaseToWords = (str) => str.split('_').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');

function calculateCustomValue(value, noOfWorkingDays, noOfLopDays) {
    const salaryPerDay = numToNthPrecision(value / noOfWorkingDays, DECMIAL_PALACES_IN_RESULT);
    const lop = noOfLopDays ? numToNthPrecision(noOfLopDays * salaryPerDay, DECMIAL_PALACES_IN_RESULT) : 0;
    const calculatedValue = numToNthPrecision(value - lop, DECMIAL_PALACES_IN_RESULT);
    return calculatedValue > 0 ? Math.ceil(calculatedValue) : 0;
}


function formatAdditionalComponentsAsSalaryComponents(additionalComponents, date, orgPayoutDate = 0) {
    const resultObj = {};
    const components = [];
    const startOfMonth = moment(date).startOf('month').add(orgPayoutDate, 'day');
    const endOfMonth = moment(date).endOf('month').add(orgPayoutDate, 'day');
    for (component of additionalComponents) {
        const dateMoment = moment(component.date);
        if (dateMoment.isBetween(startOfMonth, endOfMonth, null, '[]')) {
            resultObj[component.component_name] = component.value;
            components.push(component);
        }
    }
    return { formatComponents: resultObj, components };
}

function formatDeclarationLimit(sectionLimitArr) {
    let resultObj = {};
    for (let sectionLimit of sectionLimitArr) {
        if (!resultObj[sectionLimit.section]) {
            resultObj[sectionLimit.section] = {
                section: sectionLimit.section,
                amount_limit: 0,
                section_limit: sectionLimit.section_limit
            };
        }

        if (sectionLimit.section_limit == 2) {
            resultObj[sectionLimit.section].amount_limit += sectionLimit.amount_limit;
        } else {
            resultObj[sectionLimit.section].amount_limit = sectionLimit.amount_limit;
        }
    }

    return Object.values(resultObj);
}

function formatEmployeeDeclarationData(declarationEmployeeData, sectionDeclarationLimit) {
    let resultObj = {};

    for (let declarationData of declarationEmployeeData) {
        const employeeId = declarationData.employee_id;
        const declarationComponentId = declarationData.declaration_component_id;
        const declarationId = declarationData.declaration_id;

        if (!resultObj[employeeId]) {
            resultObj[employeeId] = {
                employee_id: employeeId,
                approved_amount: 0,
                other_income: 0,
                declarations: {}
            };
        }
        if (!resultObj[employeeId].declarations[declarationComponentId]) {
            resultObj[employeeId].declarations[declarationComponentId] = { declaration_component_id: declarationComponentId };
            resultObj[employeeId].declarations[declarationComponentId].whole_declared_amount = 0;
            resultObj[employeeId].declarations[declarationComponentId].approved_amount = 0;

            // uncomment to get entries
            // resultObj[employeeId].declarations[declarationComponentId].entries = {};
        }
        // uncomment to pupulate entries
        // if (!resultObj[employeeId].declarations[declarationComponentId].entries[declarationId]) {
        //     resultObj[employeeId].declarations[declarationComponentId].entries[declarationId] = {
        //         declaration_id: declarationId,
        //         comments: declarationData.comments,
        //         information: declarationData.information ? JSON.parse(declarationData.information) : null
        //     }
        // }

        resultObj[employeeId].declarations[declarationComponentId].section = declarationData.section;
        resultObj[employeeId].declarations[declarationComponentId].deduction_name = declarationData.deduction_name;
        resultObj[employeeId].declarations[declarationComponentId].financial_year = declarationData.financial_year;
        resultObj[employeeId].declarations[declarationComponentId].whole_declared_amount += Number(declarationData.declared_amount);
        resultObj[employeeId].declarations[declarationComponentId].approved_amount += declarationData.approved_status ? Number(declarationData.approved_amount) : 0;
        resultObj[employeeId].declarations[declarationComponentId].amount_limit = declarationData.amount_limit;

        //override the approved amount if sum is greater than limit
        // if SECTION OR section limit is 0 then don't override
        if (resultObj[employeeId].declarations[declarationComponentId].approved_amount) {
            const sectionLimitObj = sectionDeclarationLimit.find(sl => sl.section == declarationData.section);
            if (sectionLimitObj && sectionLimitObj.amount_limit && resultObj[employeeId].declarations[declarationComponentId].approved_amount > sectionLimitObj.amount_limit) {
                resultObj[employeeId].declarations[declarationComponentId].approved_amount = sectionLimitObj.amount_limit;
            }
        }
        // employee's approved amount calculation
        if (declarationData.is_other_income) {
            resultObj[employeeId].other_income += Number(resultObj[employeeId].declarations[declarationComponentId].approved_amount);
        } else {
            resultObj[employeeId].approved_amount += declarationData.approved_status ? Number(resultObj[employeeId].declarations[declarationComponentId].approved_amount) : 0;
        }
    }
    return resultObj;
}

function numToNthPrecision(num, precision = 2) {
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}


function calculateLoansForEmployee(employeeLoans, originalNetSalary) {
    let netSalary = originalNetSalary;
    let loanAsSalaryComponents = [];
    let processedLoans = [];
    let skippedLoans = [];
    let loansAsCalculatedPayroll = {};
    let totalLoanAmount = 0;
    for (loan of employeeLoans) {
        const loanEmiAmount = +loan.emi_amount || 0;
        const amountPending = +loan.amount_pending || 0;

        //unpayable loans are skipped
        if (
            (amountPending > loanEmiAmount) &&
            (loanEmiAmount > netSalary)
        ) {
            skippedLoans.push(loan);
            continue
        };

        processedLoans.push(loan);
        netSalary -= loanEmiAmount;
        totalLoanAmount += loanEmiAmount;

        const componentName = `${loan.deduction_name} - ${loan.loan_name}`;
        const salaryComponentId = loan.id;
        loansAsCalculatedPayroll[componentName] = isNaN(loanEmiAmount) ? loanEmiAmount : Number(loanEmiAmount);
        if (amountPending && amountPending < loanEmiAmount) {
            loansAsCalculatedPayroll[componentName] = amountPending;
        }

        loanAsSalaryComponents.push({
            componentName,
            rule: SYSTEM_CALC_EXPRESSION_STR,
            componentType: SALARY_COMPONENT_TYPE_DEDUCTION,
            salaryComponentId
        });
    }

    return {
        loanAsSalaryComponents, loansAsCalculatedPayroll, totalLoanAmount, processedLoans, skippedLoans
    }
}

function calcRemainingMonthsGross(date, amount) {
    const months = moment(date).format('MM') > MARCH ?
        moment(moment(date).add(1, 'year').set('month', 3)).diff(moment(date), 'month', true) :
        moment(moment(date).set('month', 3)).diff(moment(date), 'month', true);
    return months * amount;
}

/**
 * makeSalaryComponentsZero - function to make salary components zero 
 * 
 * @param {*} salaryComponents 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
function makeSalaryComponentsZero(salaryComponents) {
    const resultArr = [];
    if (!salaryComponents || !salaryComponents.length) return resultArr;

    for (const component of salaryComponents) {
        const data = { ...component };
        if (data.calculatedValue && typeof data.calculatedValue == 'object') {
            for (const key in data.calculatedValue) {
                data.calculatedValue[key] = isNaN(data.calculatedValue[key]) ? data.calculatedValue[key] : 0;
            }
        } else {
            data.calculatedValue = isNaN(data.calculatedValue) ? data.calculatedValue : 0;
        }
        resultArr.push(data);
    }
    return resultArr;
}

function getFinancialYear(date) {
    return moment(date).format('MM') > MARCH ?
        moment(date).format('YYYY') + "-" + moment(date).add(1, 'year').format('YYYY') :
        moment(date).subtract(1, 'year').format('YYYY') + "-" + moment(date).format('YYYY');
}
// (async () => {
//     new RunPayrollPreviewService().getPreview({ organization_id: 1, limit: 10, skip: 0, employeeId: 24756, date: "2020-05-05" })
// })()