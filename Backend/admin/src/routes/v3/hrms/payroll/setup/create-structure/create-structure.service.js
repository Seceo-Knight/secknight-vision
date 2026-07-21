const createStructureModel = require('./create-structure.model.js');
const _ = require('lodash');
const SalaryStructureHelper = require('../../common/payroll/SalaryStructureHelper.js');
const SYS_CALC_STR = 'SYS_CALC';
const GROSS_STR = 'GROSS';
const CTC_STR = 'CTC';

class PayrollCreateStructureService {

    /**
     * getPayrollCreateStructure - function to get payroll create structure
     * @param {*} queryObj 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getPayrollCreateStructure(queryObj, organizationId) {
        try {
            const createStructureData = await createStructureModel.getPayrollPolicyData(queryObj, organizationId);
            if (!createStructureData.length) throw new Error('No Data.');

            const fetchOrgSettings = await this.getOrgPayrollSettings(organizationId);
            const salaryStructure = fetchOrgSettings && fetchOrgSettings.salaryStructure ? fetchOrgSettings.salaryStructure : null;

            const formatedGetData = formatCreateStructureData(createStructureData, salaryStructure && salaryStructure.toUpperCase() == GROSS_STR.toUpperCase() ? true : false);
            return formatedGetData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * getInvalidSalaryComponentInFormula - function to get the invalid components in formula
     * 
     * @param {*} salaryComponents 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    getInvalidSalaryComponentInFormula(salaryComponents) {
        let isValid = false;
        const componentNameArr = salaryComponents.map(sc => sc.name.trim().toLowerCase());
        componentNameArr.push('ctc', 'gross', 'sys_calc'); //default components added
        const salaryComponentsWithFormula = salaryComponents.filter(sc => sc.value.replace(/[^A-z ]/g, '').length);
        if (!salaryComponentsWithFormula.length) return true;

        const unwantedSalaryComponentsInFormula = salaryComponentsWithFormula.map(sc => {
            const componentsInFormula = sc.value
                .replace(/\(|\)/g, '')
                .split(/[+\-*\/%]/)
                .map(c => c.trim().toLowerCase())
                .filter(f => f.replace(/[^A-z ]/g, '').length);

            const unwantedComponents = componentsInFormula.filter(cf => !componentNameArr.includes(cf));
            if (!unwantedComponents.length) return null;
            return unwantedComponents
        }).filter(e => e);
        return [...new Set(unwantedSalaryComponentsInFormula.join(",").split(","))].join(", ");
    }

    /**
     * createPayrollStructure - function to create payroll structure
     * @param {*} structureObj 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async createPayrollStructure(structureObj, organizationId) {
        try {
            const { policyName, description, salaryComponents } = structureObj;

            //throw error if payroll structure already exists for a organization
            const [checkPolicyExists] = await createStructureModel.checkPayrollPolicyExists(policyName, organizationId);
            if (checkPolicyExists.has_payroll_policy) throw new Error('Organization Payroll Policy already exists');

            //check salary components
            const invalidComponentsInFormula = this.getInvalidSalaryComponentInFormula(salaryComponents);
            if (invalidComponentsInFormula.length) throw new Error(`Invalid ${invalidComponentsInFormula} used in formula`);

            //threw error if create of payroll policy has some issues
            const createPayrollPolicyStatus = await createStructureModel.createOrganizationPayrollPolicy({ policyName, description, organizationId });
            if (!createPayrollPolicyStatus) throw new Error('Organization Payroll Policy create unsuccessfull');

            const policyId = createPayrollPolicyStatus.insertId;

            for (let componentObj of salaryComponents) {
                const createOrUpdateComponent = await this.createOrGetSalaryComponent(componentObj.name, organizationId, componentObj.type, componentObj.value);
                const createPayrollRules = await this.createOrUpdatePayrollRules({ policyId, salaryComponentId: createOrUpdateComponent.id, rule: componentObj.value })
            }
            return await this.getPayrollCreateStructure({ id: policyId }, organizationId);
        } catch (err) {
            throw err;
        }
    }

    /**
     * createOrGetSalaryComponent - function to create a salary compent if not exist and return salary component
     * @param {*} componentObj 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async createOrGetSalaryComponent(componentName, organizationId, componentType, componentRule) {
        try {
            let queryObj = {
                component_name: componentName,
                organization_id: organizationId
            };
            const componentIsSysRule = componentRule && componentRule.toLowerCase() == SYS_CALC_STR.toLowerCase() ? 1 : 0;

            const [checkComponentExist] = await createStructureModel.checkSalaryComponentExists(componentName, organizationId);

            //create the component if not present in the system
            if (!checkComponentExist.has_component) {
                const createComponentStatus = await createStructureModel.createSalaryComponent(componentName, organizationId, componentType, componentIsSysRule);
                queryObj = { id: createComponentStatus.insertId };
            }

            const [salaryComponentObj] = await createStructureModel.getSalaryComponent(queryObj);
            return salaryComponentObj;
        } catch (err) {
            throw err;
        }
    }

    /**
     * createOrUpdatePayrollRules - function to create or update payroll rules
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async createOrUpdatePayrollRules({ policyId, salaryComponentId, rule }) {
        try {
            let queryObj = {
                policy_id: policyId,
                salary_component_id: salaryComponentId
            };

            const [checkPayrollRule] = await createStructureModel.checkPayrollPolicyRuleExists(policyId, salaryComponentId);

            if (!checkPayrollRule.has_payroll_policy_rule) {
                const createPayrollPolicyRuleStatus = await createStructureModel.createPayrollPolicyRule(policyId, salaryComponentId, rule);
                queryObj = { id: createPayrollPolicyRuleStatus.insertId };
            } else {
                const updatePayrollPolicyRuleStatus = await createStructureModel.updatePayrollPolicyRule(queryObj, rule);
            }

            const [payrollPolicyRule] = await createStructureModel.getPayrollPolicyRule(queryObj);
            return payrollPolicyRule;
        } catch (err) {
            throw err;
        }
    }

    /**
     * updatePayrollStructure - function to update the payroll policy
     * 
     * @param {*} updateBody 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async updatePayrollStructure(updateBody, organizationId) {
        try {
            const { policyId, policyName, description, salaryComponents } = updateBody;

            //throw error if policy id not exists
            const [checkPolicyExistsById] = await createStructureModel.checkPayrollPolicyExistById(policyId);
            if (!checkPolicyExistsById.has_payroll_policy) throw new Error('Organization Payroll Policy not exists');

            //throw error if payroll structure name already exists for a organization
            if (policyName) {
                const [checkPolicyExists] = await createStructureModel.checkPayrollPolicyExists(policyName, organizationId);
                if (checkPolicyExists.has_payroll_policy) throw new Error('Organization Payroll Policy with same policyName already exists');
            }

            //check salary components
            const invalidComponentsInFormula = this.getInvalidSalaryComponentInFormula(salaryComponents);
            if (invalidComponentsInFormula.length) throw new Error(`Invalid ${invalidComponentsInFormula} used in formula`);

            const updatePayrollPolicyStatus = await createStructureModel.updatePayrollPolicy({ policy_name: policyName, description }, policyId);

            // component to be delete from exiting rules
            const existingComponentForPolicy = await createStructureModel.getSalaryComponentForPolicy(policyId);
            if (
                existingComponentForPolicy &&
                existingComponentForPolicy.length &&
                salaryComponents &&
                salaryComponents.length
            ) {
                const componentNameInUpdateArr = salaryComponents.map(sc => sc.name);
                const componentNameInSystemArr = existingComponentForPolicy.map(esc => esc.component_name);

                const diffFromSystemToUpdateArr = componentNameInSystemArr.filter(x => !componentNameInUpdateArr.includes(x));
                if (diffFromSystemToUpdateArr && diffFromSystemToUpdateArr.length) {
                    const ruleToBeDeletedIds = existingComponentForPolicy.map(ec => {
                        if (diffFromSystemToUpdateArr.includes(ec.component_name)) return ec.policy_rule_id
                    }).filter(i => i);

                    if (ruleToBeDeletedIds && ruleToBeDeletedIds.length) {
                        //drop the rules for the policy
                        await createStructureModel.deleteSalaryComponentRuleForPolicy(policyId, ruleToBeDeletedIds);
                    }
                }
            }
            // ends: component to be delete from exiting rules 

            if (salaryComponents && salaryComponents.length) {
                for (let componentObj of salaryComponents) {
                    const createOrUpdateComponent = await this.createOrGetSalaryComponent(componentObj.name, organizationId, componentObj.type, componentObj.value);
                    const createPayrollRules = await this.createOrUpdatePayrollRules({ policyId, salaryComponentId: createOrUpdateComponent.id, rule: componentObj.value })
                }
            }
            return await this.getPayrollCreateStructure({ id: policyId }, organizationId);
        } catch (err) {
            throw err;
        }
    }

    /**
     * getSalaryComponentData - function to process salary component 
     * 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getSalaryComponentData(organizationId) {
        try {
            const salaryComponentData = await createStructureModel.getSalaryComponents(organizationId);

            if (!salaryComponentData || !salaryComponentData.length) throw new Error('No Data');

            return salaryComponentData;
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
            const [orgSettings] = await createStructureModel.getOrgPayrollSettings(organizationId);
            if (!orgSettings || !orgSettings.settings) return null;
            return JSON.parse(orgSettings.settings);
        } catch (err) {
            throw err;
        }
    }
}


/**
 * formatCreateStructureData - helper function to format the get request
 * @param {*} createData 
 * @returns 
 */
function formatCreateStructureData(createData, isGrossDependent = false) {
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

module.exports = new PayrollCreateStructureService();