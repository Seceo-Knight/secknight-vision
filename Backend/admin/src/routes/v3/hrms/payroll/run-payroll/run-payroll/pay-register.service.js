const payRegisterModel = require('./pay-register.model');
const { Evaluator } = require('../../common/evaluator/Evaluator');

class payRegisterService {
    async getOrgSettings({ organizationId }) {
        const orgSetting = await payRegisterModel.getOrgSettings({ organizationId });
        if (orgSetting.length === 0) return;
        return orgSetting[0];
    }


    async getEmpSettings({ employeeId, organizationId }) {
        const [empSetting] = await payRegisterModel.getEmpSettings({ organizationId, employeeId });
        return empSetting;
    }
    async getPTSetting() {

    }
    async calculatePF({ orgSetting, empSetting, basic, specialAllowance }) {
        //Set default values
        const result = { employee: 0, employer: 0 };
        const pfOrgSetting = orgSetting.settings ? JSON.parse(orgSetting.settings) : null;
        const pfEmpSetting = empSetting.settings ? JSON.parse(empSetting.settings) : null;

        if (!pfOrgSetting || !pfOrgSetting.pfAllowed || basic < pfOrgSetting.pfCeiling || (empSetting && !empSetting.pf_applicable)) return result;

        //Employee override calculation
        if (pfOrgSetting.pfIndividualOverride && empSetting && empSetting.pf_override) {
            if (pfEmpSetting.pfContribution.employee.is_fixed) result.employee = pfEmpSetting.pfContribution.employee.fixed_amount;
            if (pfEmpSetting.pfContribution.employer.is_fixed) result.employer = pfEmpSetting.pfContribution.employer.fixed_amount;

            if (!pfEmpSetting.pfContribution.employee.is_fixed && pfEmpSetting.pfContribution.employee.basic) {
                result.employee = Evaluator.evaluate(`Basic *${pfEmpSetting.pfContribution.employee.percentage}%`, { basic: basic });
            } else if (!pfEmpSetting.pfContribution.employee.is_fixed && !pfEmpSetting.pfContribution.employee.basic) {
                result.employee = Evaluator.evaluate(`(Basic + Allowance) *${pfEmpSetting.pfContribution.employee.percentage}%`, { basic: basic, allowance: specialAllowance });
            }
            if (!pfEmpSetting.pfContribution.employer.is_fixed && pfEmpSetting.pfContribution.employer.basic) {
                result.employer = Evaluator.evaluate(`Basic *${pfEmpSetting.pfContribution.employer.percentage}%`, { basic: basic });
            } else if (!pfEmpSetting.pfContribution.employer.is_fixed && !pfEmpSetting.pfContribution.employer.basic) {
                result.employer = Evaluator.evaluate(`(Basic + Allowance) *${pfEmpSetting.pfContribution.employer.percentage}%`, { basic: basic, allowance: specialAllowance });
            }
            //Organization PF calculation
        } else {
            if (pfOrgSetting.pfContribution.employee.is_fixed) result.employee = pfOrgSetting.pfContribution.employee.fixed_amount;
            if (pfOrgSetting.pfContribution.employer.is_fixed) result.employer = pfOrgSetting.pfContribution.employer.fixed_amount;

            if (!pfOrgSetting.pfContribution.employee.is_fixed && pfOrgSetting.pfContribution.employee.basic) {
                result.employee = Evaluator.evaluate(`Basic *${pfOrgSetting.pfContribution.employee.percentage}%`, { basic: basic });
            } else if (!pfOrgSetting.pfContribution.employee.is_fixed && !pfOrgSetting.pfContribution.employee.basic) {
                result.employee = Evaluator.evaluate(`(Basic + Allowance) *${pfOrgSetting.pfContribution.employee.percentage}%`, { basic: basic, allowance: specialAllowance });
            }
            if (!pfOrgSetting.pfContribution.employer.is_fixed && pfOrgSetting.pfContribution.employer.basic) {
                result.employer = Evaluator.evaluate(`Basic *${pfOrgSetting.pfContribution.employer.percentage}%`, { basic: basic });
            } else if (!pfOrgSetting.pfContribution.employer.is_fixed && !pfOrgSetting.pfContribution.employer.basic) {
                result.employer = Evaluator.evaluate(`(Basic + Allowance) *${pfOrgSetting.pfContribution.employer.percentage}%`, { basic: basic, allowance: specialAllowance });
            }
        }
        return result;
    }

    async calculateESI({ orgSetting, empSetting, gross }) {
        //Set default values
        const result = { employee: 0, employer: 0 };
        const esiOrgSetting = orgSetting.settings ? JSON.parse(orgSetting.settings) : null;
        const esiEmpSetting = empSetting.settings ? JSON.parse(empSetting.settings) : null;

        if (!esiOrgSetting || !esiOrgSetting.esiAllowed || gross > esiOrgSetting.statutoryMaxMonthlyGrossForEsi || (empSetting && !empSetting.esi_applicable)) return result;

        if (esiOrgSetting.pfIndividualOverride && empSetting && empSetting.esi_override) {
            if (esiEmpSetting.esiContribution) {
                if (esiEmpSetting.esiContribution.employee.is_fixed) result.employee = esiEmpSetting.esiContribution.employee.fixed_amount;
                if (esiEmpSetting.esiContribution.employer.is_fixed) result.employer = esiEmpSetting.esiContribution.employer.fixed_amount;
                if (!esiEmpSetting.esiContribution.employee.is_fixed) {
                    result.employee = Evaluator.evaluate(`gross *${esiEmpSetting.esiContribution.employee.percentage}%`, { gross: gross });
                }
                if (!esiEmpSetting.esiContribution.employee.is_fixed) {
                    result.employer = Evaluator.evaluate(`gross *${esiEmpSetting.esiContribution.employer.percentage}%`, { gross: gross });
                }
            }
        } else {
            if (esiOrgSetting.esiContribution) {
                result.employee = Evaluator.evaluate(`gross *${esiOrgSetting.esiContribution.employeeEsi}%`, { gross: gross });
                result.employer = Evaluator.evaluate(`gross *${esiOrgSetting.esiContribution.employerEsi}%`, { gross: gross });
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
    async calculatePT({ ptSetting = [], gross = 0 }) {
        let i = 0;
        let amount = 0;
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
        amount = !gross ? 0 : (amount || 200)
        return amount;
    }
}

module.exports = new payRegisterService();

// console.log('-----++------', Evaluator.evaluate('Basic *12%', { basic: 2000 }))