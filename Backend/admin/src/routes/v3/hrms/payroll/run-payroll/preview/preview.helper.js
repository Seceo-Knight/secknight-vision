const { Evaluator } = require('../../common/evaluator/Evaluator');
const payrollCommon = require('../../common/payroll/Calculation');
const SalaryStructureHelper = require('../../common/payroll/SalaryStructureHelper');
const SYSTEM_CALC_EXPRESSION_STR = 'SYS_CALC';
const CESSPER = 0.04;
class PreviewHelper {
    /**
     * hasEveryElement - function to check arr1 all element present in arr2
     * 
     * @param {*} arr1 
     * @param {*} arr2 
     * @returns {Boolean}
     *  
     */
    static hasEveryElement(arr1, arr2) {
        let subSet = new Set(arr1);
        let superSet = new Set(arr2);

        let _intersection = new Set();
        for (let elem of subSet) {
            if (superSet.has(elem)) {
                _intersection.add(elem)
            }
        }
        return _intersection.size === subSet.size;
    }

    /**
     * getSalaryComponentWithFormula - function to get the salary component 
     * 
     * @param {*} salaryComponentArr 
     * @param {*} withExpression 
     * @returns 
     */
    static getSalaryComponentWithFormula(salaryComponentArr, withExpression = true) {
        const scArr = salaryComponentArr.map(salaryComponent => {
            return {
                sc: salaryComponent.componentName,
                formula: salaryComponent.rule.replace(/[^A-z ]/g, '').trim().toLowerCase()
            };
        });

        // SC without expression
        if (!withExpression) {
            return scArr.filter(sc => !sc.formula && sc.formula != SYSTEM_CALC_EXPRESSION_STR.toLowerCase()).map(i => i.sc)
        }

        return scArr.filter(sc => sc.formula && sc.formula != SYSTEM_CALC_EXPRESSION_STR.toLowerCase()).map(i => i.sc);
    }

    /**
     * formatCreateStructureData - helper function to format the get request
     * 
     * @param {*} createData 
     * @returns 
     */
    static formatCreateStructureData(createData, isGrossDependent = false) {
        const resultArr = {};
        for (let createObj of createData) {
            let data = resultArr[createObj.policy_id] || {};

            if (!Object.keys(data).length) {
                data.policyId = createObj.policy_id;
                data.policyName = createObj.policy_name;
                data.description = createObj.description;
                data.salaryComponents = [];
            }

            data.salaryComponents.push({
                salaryComponentId: createObj.salary_component_id,
                rule: SalaryStructureHelper.transformRule(createObj.rule, isGrossDependent),
                componentName: createObj.component_name,
                componentType: createObj.component_type
            });

            resultArr[createObj.policy_id] = data;
        }
        return Object.values(resultArr);
    }

    /**
     * calculatePayroll - function to calculate payroll
     * 
     * @param {*} policyObj 
     * @param {*} valueObj 
     * @returns 
     */
    static calculatePayroll(policyObj, valueObj) {
        const { salaryComponents } = policyObj;

        const salaryComponentWithExpression = this.getSalaryComponentWithFormula(salaryComponents);
        const salaryComponentWithValues = this.getSalaryComponentWithFormula(salaryComponents, false)
        const salaryValueObj = { ...valueObj };

        // to put the absoulte value salary component into an object
        if (salaryComponentWithValues && salaryComponentWithValues.length) {
            for (let i = 0; i < salaryComponentWithValues.length; i++) {
                const component = salaryComponentWithValues[i];
                const salaryComponentObj = salaryComponents.find(sc => sc.componentName == component)
                salaryValueObj[component] = salaryComponentObj.rule;
            }
        }

        // //five level of equation calculation
        // working --- less tested
        // if (salaryComponentWithExpression && salaryComponentWithExpression.length) {
        //     for ( let i = 0; i < 5; i++ ) {
        //         for ( let j = 0; j < salaryComponentWithExpression.length; j++ ) {
        //             const componentWithExpr = salaryComponentWithExpression[j];
        //             const salaryComponentObj = salaryComponents.find(sc => sc.componentName == componentWithExpr);

        //             if (!salaryComponentObj) continue;
        //             const compoentUsedInExprArr = salaryComponentObj.rule.split(/[+\-*\/]/).map(c => c.trim().toLowerCase()).filter(c => isNaN(Number(c)));
        //             const hasEveryVariableValues = compoentUsedInExprArr.filter(c => Object.keys(salaryValueObj).map(sv => sv.toLowerCase()).includes(c)).length;
        //             if (hasEveryVariableValues) {
        //                 try {
        //                     salaryValueObj[componentWithExpr] =  Evaluator.evaluate(salaryComponentObj.rule, salaryValueObj);
        //                 } catch (err) {
        //                     console.log("-------err----------", err);
        //                     continue;
        //                 }
        //             }
        //         }
        //     }
        // }

        /**
         * salary component exec for the expression with a formula
         */
        if (salaryComponentWithExpression && salaryComponentWithExpression.length) {
            const MAX_LIMIT_TRY_EXEC = 10;
            const unSolvedComponents = [];
            let salaryComponentLength = salaryComponentWithExpression.length;
            let i = 0;
            do {
                const componentWithExpr = salaryComponentWithExpression.pop();
                // console.log({ salaryComponentWithExpression });
                const salaryComponentObj = salaryComponents.find(sc => sc.componentName == componentWithExpr);
                // console.log({ salaryComponentObj });

                if (!salaryComponentObj) continue;
                const compoentUsedInExprArr = salaryComponentObj.rule
                    .replace(/\(|\)/g, '')
                    .split(/[+\-*\/%]/)
                    .map(c => c.trim().toLowerCase())
                    .filter(c => isNaN(Number(c)));

                const hasEveryVariableValues = this.hasEveryElement(compoentUsedInExprArr, Object.keys(salaryValueObj).map(sv => sv.toLowerCase().trim()));
                if (hasEveryVariableValues) {
                    try {
                        const evaluatedExpr = Evaluator.evaluate(salaryComponentObj.rule, salaryValueObj);
                        salaryValueObj[componentWithExpr] = isNaN(evaluatedExpr) ? evaluatedExpr : numToNthPrecision(evaluatedExpr);
                    } catch (err) {
                        unSolvedComponents.push(componentWithExpr);
                    }
                } else {
                    if (salaryComponentWithExpression.indexOf(componentWithExpr) >= 0) {
                        unSolvedComponents.push(componentWithExpr);
                    } else {
                        salaryComponentWithExpression.unshift(componentWithExpr);
                    }
                }
            } while (
                salaryComponentWithExpression.length &&
                unSolvedComponents.length < salaryComponentWithExpression.length &&
                i++ < salaryComponentLength + MAX_LIMIT_TRY_EXEC
            );
        }
        return salaryValueObj
    }


    /**
     * calculateSystemDependentPayroll - function to calc sys calculated components
     * 
     * @param {*} param0 
     * @returns 
     */
    static async calculateSystemDependentPayroll({ policyObj, valueObj, empSetting, orgSetting, ptSetting, gross = 0 }) {
        const { salaryComponents } = policyObj;

        const salaryComponentWithSystemCalcExpression = salaryComponents.filter(item => item.rule == SYSTEM_CALC_EXPRESSION_STR).map(item => item.componentName);

        const salaryValueObj = { ...valueObj };

        // lowercase of valueObj
        let valueObjInLowerCase = {};
        for (const [key, value] of Object.entries(valueObj)) {
            valueObjInLowerCase[key.toLowerCase()] = value;
        }

        // const gross = Object.values(salaryValueObj).reduce( (acc, value) => acc + value, 0 );
        const basic = valueObjInLowerCase['basic'];
        const specialAllowance = valueObjInLowerCase['special allowance'];

        for (let i = 0; i < salaryComponentWithSystemCalcExpression.length; i++) {
            const component = salaryComponentWithSystemCalcExpression[i];
            let calculatedValue = 0;

            if (component.match(/PF/gi)) {
                calculatedValue = await payrollCommon.calculatePF({ orgSetting, empSetting, gross, basic, specialAllowance });
            }
            if (component.match(/ESI/gi)) {
                calculatedValue = await payrollCommon.calculateESI({ orgSetting, empSetting, gross });
            }
            if (component.match(/PT/gi)) {
                ptSetting = ptSetting.find(pt => pt.location_id == empSetting.location_id);
                ptSetting = ptSetting ? JSON.parse(ptSetting.details) : null;

                calculatedValue = await payrollCommon.calculatePT({ empSetting, orgSetting, ptSetting: ptSetting ? ptSetting.details : [], gross });
            }
            if (component.match(/Admin Charge/gi)) {
                calculatedValue = await payrollCommon.calculateAdminCharges({ orgSetting, empSetting, basic });
            }
            salaryValueObj[component] = calculatedValue;
        }
        return salaryValueObj
    }

    /**
     * validate salary componet with formaula
     * salary compoents should be super set of the formulas
     */
    getUnwantedSalaryComponentsInFormula(salaryComponentArr, formulaArr) {
        salaryComponentArr.push('ctc', 'gross');
        salaryComponentArr = salaryComponentArr.map(e => e.toLowerCase());

        let unwantedSalaryComponentsInFormulaArr = [];

        if (
            !(salaryComponentArr && salaryComponentArr.length) ||
            !(formulaArr && formulaArr.length)
        ) return unwantedSalaryComponentsInFormulaArr;

        const salaryComponetUsedInFormulaArr = formulaArr.map(formula => formula.replace(/[^A-z ]/g, '').trim().toLowerCase()).filter(f => f);
        unwantedSalaryComponentsInFormulaArr = salaryComponetUsedInFormulaArr.filter(component => !salaryComponentArr.includes(component));

        return unwantedSalaryComponentsInFormulaArr;
    }

    /**
    * Calculate TDS if deduction allowed than check with exemption, standard deduction and
    * other deduction
    */
    static async getTDSold({ schemeId, type, defaultScheme, earnings, exemptions = 0, otherDeduction = 0, otherSource = 0 }) {
        if (type == 1) {
            const schemes = schemeId != null ? schemeId.toString().split(',').map(a => {
                return defaultScheme.find(x => x.scheme_id == a && x.employee_type == type);
            }).filter(x => x) : [];
            const taxableIncome = +earnings + +otherSource;

            if (schemes.length == 0) return {
                scheme: null, schemeId: 0, earnings, otherSource,
                standardDeduction: 0, otherDeduction, exemptions,
                taxableIncome: taxableIncome, taxPayable: 0,
                taxMonthlyPayable: 0,
                totalCessMonthy: 0,
                totalCess: 0
            };
            let scheme = '';
            let totalTax = schemes.reduce((totalTax, s, i) => {
                scheme = `${scheme},${s.scheme}`;
                let schemeData = JSON.parse(s.details);
                schemeData = payrollCommon.taxScheme({ schemeData, netpay: taxableIncome });
                return (totalTax + schemeData.map(item => +item.tax).reduce((prev, next) => prev + next));
            }, 0);
            return {
                scheme, schemeId, earnings, otherSource,
                standardDeduction: 0, otherDeduction, exemptions,
                taxableIncome, taxPayable: totalTax,
                taxMonthlyPayable: numToNthPrecision(totalTax / 12),
                totalCessMonthy: 0,
                totalCess: 0
            };
        } else {
            let schemes = schemeId != null ? schemeId.toString().split(',').map(a => {
                return defaultScheme.find(x => x.scheme_id == a);
            }).filter(x => x) : defaultScheme.find(x => x.scheme == "Old Tax Scheme");
            const { deduction_allowed: deductionAllowed, details, scheme, standard_deduction: standardDeduction } = schemes.length ? schemes[0] : defaultScheme.find(x => x.scheme == "Old Tax Scheme");
            const taxableIncome = deductionAllowed == 1 ? ~~((+earnings + +otherSource) > (+standardDeduction + +exemptions + +otherDeduction)) ? ((+earnings + +otherSource) - (+standardDeduction + +exemptions + +otherDeduction)) : (+earnings + +otherSource) : (+earnings + +otherSource);

            let schemeData = JSON.parse(details);
            schemeData = payrollCommon.taxScheme({ schemeData, netpay: taxableIncome });
            //Rebate under Section 87A Taxable Income upto 5 Lacs 
            let totalTax = taxableIncome <= 5_00_000 ? 0 : schemeData.reduce((acc, range) => ~~acc + ~~range.tax);
            const totalCess = totalTax * CESSPER;
            totalTax += totalCess;
            return {
                scheme, schemeId, earnings, otherSource,
                standardDeduction, otherDeduction, exemptions,
                taxableIncome, taxPayable: totalTax,
                taxMonthlyPayable: numToNthPrecision(totalTax / 12),
                totalCessMonthy: numToNthPrecision(totalCess / 12),
                totalCess: numToNthPrecision(totalCess)
            };
        }
    }
    static async getTDS({ monthlyEarning, defaultScheme, employeeObj, scheme_employee_type, type, earnings, exemptions = 0, otherDeduction = 0, otherSource = 0, tdsPaid = 0, remainingMonths = 12 }) {
        try {
            let scheme, details, schemeId, deductionAllowed, standardDeduction;
            const defaltOldScheme = defaultScheme.find(x => x.scheme == "Old Tax Scheme");
            const contract = employeeObj.contract_scheme_id ? defaultScheme.find(x => x.scheme_id == employeeObj.contract_scheme_id) : null;

            details = employeeObj.details || defaltOldScheme.details;
            if (type != 1) {
                scheme = employeeObj.scheme || defaltOldScheme.scheme;
                schemeId = employeeObj.scheme_id || defaltOldScheme.scheme_id;
                deductionAllowed = employeeObj.deduction_allowed == null ? defaltOldScheme.deduction_allowed : employeeObj.deduction_allowed;
                standardDeduction = employeeObj.standard_deduction == null ? defaltOldScheme.standard_deduction : employeeObj.standard_deduction;
            } else if (contract && type == 1) {
                scheme = employeeObj.scheme || contract.scheme;
                details = employeeObj.details || contract.details;
                schemeId = employeeObj.scheme_id || contract.scheme_id;
                deductionAllowed = employeeObj.deduction_allowed == null ? contract.deduction_allowed : employeeObj.deduction_allowed;
                standardDeduction = employeeObj.standard_deduction == null ? contract.standard_deduction : employeeObj.standard_deduction;
                scheme_employee_type = scheme_employee_type ? scheme_employee_type : contract.employee_type
            }
            if (!details) return 0;
            let taxableIncome = deductionAllowed == 1 ? ((+earnings + +otherSource) - (+standardDeduction + +exemptions + +otherDeduction)) : (+earnings + +otherSource);
            taxableIncome = contract && type == 1 ? monthlyEarning : taxableIncome;
            let schemeData = JSON.parse(details);
            schemeData = payrollCommon.taxScheme({ schemeData, netpay: taxableIncome });
            //Rebate under Section 87A Taxable Income upto 5 Lacs 
            let totalTax = schemeData.map(item => +item.tax).reduce((prev, next) => prev + next);
            // let totalTax = schemeData.reduce((acc, range) => ~~acc + ~~range.tax);

            let totalCess = 0;
            if (type != 1) {
                totalTax = taxableIncome <= 5_00_000 ? 0 : totalTax;
                totalCess = totalTax * CESSPER;
            } else {
                if (scheme_employee_type == null && !scheme) {
                    totalTax = 0
                }
            }
            totalTax += totalCess;
            return {
                scheme, schemeId, earnings, otherSource,
                standardDeduction, otherDeduction, exemptions,
                taxableIncome,
                taxMonthlyPayable: contract && type == 1 ?
                    numToNthPrecision(totalTax, 0) :
                    +totalTax - +tdsPaid > 0 ? numToNthPrecision((totalTax - tdsPaid) / remainingMonths, 0) : 0,
                totalCessMonthy: numToNthPrecision(totalCess / 12, 0),
                totalCess: numToNthPrecision(totalCess, 0),
                taxPayable: numToNthPrecision(totalTax, 0),
                tdsPaid, remainingMonths, totalTax
            };
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}

function numToNthPrecision(num, precision = 2) {
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}

module.exports = PreviewHelper;