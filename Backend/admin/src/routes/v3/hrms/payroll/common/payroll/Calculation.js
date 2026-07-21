
const { Evaluator } = require('../evaluator/Evaluator');

class payRegisterService {

    /**
     * Calculate PF
     * @param Object orgSetting
     * @param Object empSetting
     * @param number basic
     * @param number specialAllowance
     * @returns {Object} -  return.
     * @author Basavaraj S <basavarajshiralashetti@gloubussoft.in>
     */
    async calculatePF({ orgSetting, empSetting, basic, specialAllowance }) {
        //Set default values
        const result = { employee: 0, employer: 0 };
        const pfOrgSetting = orgSetting.settings ? JSON.parse(orgSetting.settings) : null;
        const pfEmpSetting = empSetting.settings ? JSON.parse(empSetting.settings) : null;

        if (
            !pfOrgSetting || !pfOrgSetting.pfAllowed ||
            (empSetting && !empSetting.pf_applicable) ||
            (empSetting && empSetting.type == 1) // for contract based employee
        ) return result;

        if (basic <= pfOrgSetting.pfCeiling && pfOrgSetting.pfContribution.employee.is_fixed && pfOrgSetting.pfContribution.employer.is_fixed) {
            if (pfOrgSetting.pfContribution.employee.ceilingAmount.is_fixed) result.employee = pfOrgSetting.pfContribution.employee.ceilingAmount.fixed_amount;
            if (pfOrgSetting.pfContribution.employer.ceilingAmount.is_fixed) result.employer = pfOrgSetting.pfContribution.employer.ceilingAmount.fixed_amount;

            if (!pfOrgSetting.pfContribution.employee.ceilingAmount.is_fixed && pfOrgSetting.pfContribution.employee.ceilingAmount.basic) {
                result.employee = this.numberCeil(Evaluator.evaluate(`Basic *${pfOrgSetting.pfContribution.employee.ceilingAmount.percentage}%`, { basic: basic }));
            } else if (!pfOrgSetting.pfContribution.employee.ceilingAmount.is_fixed && !pfOrgSetting.pfContribution.employee.ceilingAmount.basic) {
                result.employee = this.numberCeil(Evaluator.evaluate(`(Basic + Allowance) *${pfOrgSetting.pfContribution.employee.ceilingAmount.percentage}%`, { basic: basic, allowance: specialAllowance }));
            }
            if (!pfOrgSetting.pfContribution.employer.ceilingAmount.is_fixed && pfOrgSetting.pfContribution.employer.ceilingAmount.basic) {
                result.employer = this.numberCeil(Evaluator.evaluate(`Basic *${pfOrgSetting.pfContribution.employer.ceilingAmount.percentage}%`, { basic: basic }));
            } else if (!pfOrgSetting.pfContribution.employer.ceilingAmount.is_fixed && !pfOrgSetting.pfContribution.employer.ceilingAmount.basic) {
                result.employer = this.numberCeil(Evaluator.evaluate(`(Basic + Allowance) *${pfOrgSetting.pfContribution.employer.ceilingAmount.percentage}%`, { basic: basic, allowance: specialAllowance }));
            }
        } else if (pfOrgSetting.pfIndividualOverride && empSetting && empSetting.pf_override) {
            //Employee override calculation
            if (pfEmpSetting.pfContribution.employee.is_fixed) result.employee = pfEmpSetting.pfContribution.employee.fixed_amount;
            if (pfEmpSetting.pfContribution.employer.is_fixed) result.employer = pfEmpSetting.pfContribution.employer.fixed_amount;

            if (!pfEmpSetting.pfContribution.employee.is_fixed && pfEmpSetting.pfContribution.employee.basic) {
                result.employee = this.numberCeil(Evaluator.evaluate(`Basic *${pfEmpSetting.pfContribution.employee.percentage}%`, { basic: basic }));
            } else if (!pfEmpSetting.pfContribution.employee.is_fixed && !pfEmpSetting.pfContribution.employee.basic) {
                result.employee = this.numberCeil(Evaluator.evaluate(`(Basic + Allowance) *${pfEmpSetting.pfContribution.employee.percentage}%`, { basic: basic, allowance: specialAllowance }));
            }
            if (!pfEmpSetting.pfContribution.employer.is_fixed && pfEmpSetting.pfContribution.employer.basic) {
                result.employer = this.numberCeil(Evaluator.evaluate(`Basic *${pfEmpSetting.pfContribution.employer.percentage}%`, { basic: basic }));
            } else if (!pfEmpSetting.pfContribution.employer.is_fixed && !pfEmpSetting.pfContribution.employer.basic) {
                result.employer = this.numberCeil(Evaluator.evaluate(`(Basic + Allowance) *${pfEmpSetting.pfContribution.employer.percentage}%`, { basic: basic, allowance: specialAllowance }));
            }
            //Organization PF calculation
        } else {
            if (pfOrgSetting.pfContribution.employee.is_fixed) result.employee = pfOrgSetting.pfContribution.employee.fixed_amount;
            if (pfOrgSetting.pfContribution.employer.is_fixed) result.employer = pfOrgSetting.pfContribution.employer.fixed_amount;

            if (!pfOrgSetting.pfContribution.employee.is_fixed && pfOrgSetting.pfContribution.employee.basic) {
                result.employee = this.numberCeil(Evaluator.evaluate(`Basic *${pfOrgSetting.pfContribution.employee.percentage}%`, { basic: basic }));
            } else if (!pfOrgSetting.pfContribution.employee.is_fixed && !pfOrgSetting.pfContribution.employee.basic) {
                result.employee = this.numberCeil(Evaluator.evaluate(`(Basic + Allowance) *${pfOrgSetting.pfContribution.employee.percentage}%`, { basic: basic, allowance: specialAllowance }));
            }
            if (!pfOrgSetting.pfContribution.employer.is_fixed && pfOrgSetting.pfContribution.employer.basic) {
                result.employer = this.numberCeil(Evaluator.evaluate(`Basic *${pfOrgSetting.pfContribution.employer.percentage}%`, { basic: basic }));
            } else if (!pfOrgSetting.pfContribution.employer.is_fixed && !pfOrgSetting.pfContribution.employer.basic) {
                result.employer = this.numberCeil(Evaluator.evaluate(`(Basic + Allowance) *${pfOrgSetting.pfContribution.employer.percentage}%`, { basic: basic, allowance: specialAllowance }));
            }
        }
        return result;
    }

    /**
     * calculate ESI
     * @param Object orgSetting
     * @param Object empSetting
     * @param number gross
     * @returns {Object} -  return.
     * @author Basavaraj S <basavarajshiralashetti@gloubussoft.in>
     */
    async calculateESI({ orgSetting, empSetting, gross }) {
        //Set default values
        const result = { employee: 0, employer: 0 };
        const esiOrgSetting = orgSetting.settings ? JSON.parse(orgSetting.settings) : null;
        const esiEmpSetting = empSetting.settings ? JSON.parse(empSetting.settings) : null;

        if (
            !esiOrgSetting || !esiOrgSetting.esiAllowed ||
            gross > esiOrgSetting.statutoryMaxMonthlyGrossForEsi ||
            (empSetting && !empSetting.esi_applicable) ||
            (empSetting && empSetting.type == 1) // for contract based employee
        ) return result;


        // if (esiOrgSetting.pfIndividualOverride && empSetting && empSetting.esi_override) {
        if (esiOrgSetting.pfIndividualOverride && empSetting && empSetting.esi_applicable) {

            if (esiEmpSetting.esiContribution) {
                if (esiEmpSetting.esiContribution.employee.is_fixed) result.employee = esiEmpSetting.esiContribution.employee.fixed_amount;
                if (esiEmpSetting.esiContribution.employer.is_fixed) result.employer = esiEmpSetting.esiContribution.employer.fixed_amount;
                if (!esiEmpSetting.esiContribution.employee.is_fixed) {

                    // result.employee = Math.round(((gross) * esiOrgSetting.esiContribution.employeeEsi) / 100)
                    result.employee = this.numberCeil(Evaluator.evaluate(`gross *${esiEmpSetting.esiContribution.employee.percentage}%`, { gross: gross }));
                }
                if (!esiEmpSetting.esiContribution.employee.is_fixed) {
                    // result.employer = Math.round(((gross) * esiOrgSetting.esiContribution.employerEsi) / 100);
                    result.employer = this.numberCeil(Evaluator.evaluate(`gross *${esiEmpSetting.esiContribution.employer.percentage}%`, { gross: gross }));
                }
            }
        } else {

            if (esiOrgSetting.esiContribution) {
                result.employee = this.numberCeil(Evaluator.evaluate(`gross *${esiOrgSetting.esiContribution.employeeEsi}%`, { gross: gross }));
                result.employer = this.numberCeil(Evaluator.evaluate(`gross *${esiOrgSetting.esiContribution.employerEsi}%`, { gross: gross }));
            }
        }
        return result;
    }

    /**
     * Calculate PT
     * @param Array ptSetting
     * @param number gross
     * @returns {Number} -  return.
     * @author Basavaraj S <basavarajshiralashetti@gloubussoft.in>
     */
    async calculatePT({ empSetting, orgSetting, ptSetting = [], gross = 0 }) {
        const empSett = JSON.parse(empSetting.settings);
        const orgSett = JSON.parse(orgSetting.settings);
        const eligible_pt = empSetting.eligible_pt && empSetting.eligible_pt == 1 ? true : false;

        let i = 0;
        let amount = 0;

        // if (empSett?.ptSettings?.ptAllowed == true && orgSett?.ptSettings?.ptAllowed == true) {
        // if (empSett && empSett.ptSettings && empSett.ptSettings.ptAllowed == true && orgSett && orgSett.ptSettings && orgSett.ptSettings.ptAllowed == true) {
        if (eligible_pt && orgSett && orgSett.ptSettings && orgSett.ptSettings.ptAllowed == true) {

            while (i < ptSetting.length) {
                const item = ptSetting[i];
                if (item.start < gross && item.end > gross) {
                    amount = item.amount;
                    break;
                } else if (i == (ptSetting.length - 1) && (item.start == item.end) && item.end < gross) {
                    amount = item.amount;
                    break;
                }
                i++;
            }
            if (!amount) {
                const defaultPt = ptSetting.find(i => i.start == 0 && i.end == 0)
                amount = defaultPt ? defaultPt.amount : 0
            }
            amount = !gross ? 0 : amount;
        }
        return this.numberCeil(amount);
    }

    // Calculate Admin Charges
    calculateAdminCharges({ orgSetting, empSetting, basic }) {
        //Set default values
        let result = 0;
        orgSetting = orgSetting.settings ? JSON.parse(orgSetting.settings) : null;
        empSetting = empSetting.settings ? JSON.parse(empSetting.settings) : null;
        const adminCharges_applicable = orgSetting && orgSetting.admin_charges && orgSetting.admin_charges.adminChargesAllowed ? true : false;
        const adminChargesIndividualOverride = adminCharges_applicable && empSetting && orgSetting.admin_charges.adminChargesIndividualOverride && empSetting.admin_charges && empSetting.admin_charges.adminCharges_override ? true : false;

        //===START -> Calculate Admin charges=====//
        // ***if employee have custom admin charges*** //
        if (!adminCharges_applicable) result = 0;
        else if (adminCharges_applicable && adminChargesIndividualOverride) {
            // fixed amount
            if (empSetting.admin_charges.is_fixed) result = empSetting.admin_charges.fixed_amount;

            // as per basic percentage 
            else if (empSetting && empSetting.admin_charges.basic && empSetting.admin_charges.percentage) {
                result = Math.round((empSetting.admin_charges.percentage / 100) * basic);
            }
        }
        // ***for all other employees*** //
        else if (adminCharges_applicable) {
            // above ceiling with basic
            if (!orgSetting.admin_charges.enableStatutoryCeiling && orgSetting.admin_charges.contribution && orgSetting.admin_charges.contribution.basic) {
                result = orgSetting.admin_charges.contribution.percentage ? Math.round((orgSetting.admin_charges.contribution.percentage / 100) * basic) : Math.round((1 / 100) * basic);
            }
            // for fixed
            else if (orgSetting.admin_charges.enableStatutoryCeiling && orgSetting.admin_charges.contribution && orgSetting.admin_charges.contribution.belowCeilingAmount) {
                // above ceiling fixed    
                if (orgSetting.admin_charges.contribution.is_fixed && basic > orgSetting.admin_charges.adminChargesCeiling) result = orgSetting.admin_charges.contribution.fixed_amount;
                // below ceiling fixed   
                else if (orgSetting.admin_charges.contribution.belowCeilingAmount.is_fixed && basic <= orgSetting.admin_charges.adminChargesCeiling) result = orgSetting.admin_charges.contribution.belowCeilingAmount.fixed_amount;
                // below ceiling basic    
                else if (orgSetting.admin_charges.contribution.belowCeilingAmount.basic && basic <= orgSetting.admin_charges.adminChargesCeiling) result = Math.round((orgSetting.admin_charges.contribution.belowCeilingAmount.percentage / 100) * basic);
            }
        }
        //===END -> Calculate Admin charges=====//

        return result;
    }

    taxScheme({ schemeData, netpay }) {
        return schemeData.reduce((schemes, range) => {
            if ((range.end <= netpay) && !(range.start == range.end)) {
                schemes.push({ ...range, tax: this.numToNthPrecision((range.percentage / 100) * (range.end - range.start), 2) });
                return schemes;
            } else if (range.start <= netpay) {
                schemes.push({ ...range, tax: this.numToNthPrecision((range.percentage / 100) * (netpay - range.start)) });
                return schemes;
            }
            schemes.push({ ...range, tax: 0 });
            return schemes;
        }, []);
    }

    calculateHRA({ basic, hra, rent }) {
        return Math.min(rent - this.numToNthPrecision((10 / 100) * basic), hra, this.numToNthPrecision((50 / 100) * basic));
    }

    numToNthPrecision(num, precision = 2) {
        return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
    }

    numberCeil(num) {
        return Math.ceil(num);
    }
}

module.exports = new payRegisterService();