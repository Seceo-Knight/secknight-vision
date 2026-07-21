const GROSS_STR = 'GROSS';
const CTC_STR = 'CTC';

/**
 * @class SalaryStructureHelper
 * @classdesc helper class
 * @author Amit Verma <amitVerma@globussoft.in>
 */
class SalaryStructureHelper {
    /**
     * @method transformSalaryComponents
     * @description function to transform the salary components
     * 
     * @param {*} salaryComponents 
     * @param {*} isGrossDependent 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    transformSalaryComponents(salaryComponents, isGrossDependent) {
        if (salaryComponents && !salaryComponents.length) return [];
        const newSalaryComponents = salaryComponents.map(sc => ({
            ...sc,
            rule: this.transformRule(sc.rule, isGrossDependent)
        }));
        return newSalaryComponents;
    }

    /**
     * @method transformRule
     * @description function to transform rules
     * 
     * @param {*} rule 
     * @param {*} isGrossDependent 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    transformRule(rule, isGrossDependent) {
        const salaryRuleComponent = isGrossDependent ? GROSS_STR : CTC_STR;
        const salaryReplaceRuleComponent = isGrossDependent ? CTC_STR : GROSS_STR;

        const replaceRegex = new RegExp(salaryReplaceRuleComponent, 'gi'); // global and case insensitive
        return rule.replace(replaceRegex, salaryRuleComponent);
    }
}
module.exports = new SalaryStructureHelper();
