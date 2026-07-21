const assignStructureModel = require('./assign-structure.model.js');
const _ = require('lodash');
const { details: defaultPayrollDetailsJson } = require('../../../bankdetail/default.payrollsettings')
const UPDATEABLE_EMPLOYEE_PAYROLL_DETAILS_KEYS = ['ctc']; //add the keys here to mark as json key

class PayrollAssignStructureService {

    /**
     * getPayrollPolicy - function to get the payroll policy
     * 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getPayrollPolicy(organizationId) {
        try {
            const policyData = await assignStructureModel.getPayrollPolicy(organizationId);
            if (!policyData.length) throw new Error('No Data.');
            return policyData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * getPayrollAssignStructure - function to process get payroll assign structure
     * 
     * @param {*} queryObj 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getPayrollAssignStructure(queryObj, organizationId) {
        try {
            const assignStructureData = await assignStructureModel.getAssignStructureData(queryObj, organizationId);
            if (!assignStructureData.length) throw new Error('No Data.');

            return assignStructureData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * countPayrollAssignStructure - function to get the count of the employee payroll status
     * 
     * @param {*} queryObj 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async countPayrollAssignStructure(queryObj, organizationId) {
        try {
            let count = 0;
            [count] = await assignStructureModel.countPayrollAssignStructure(queryObj, organizationId);
            if (!count) return count;

            return count.cnt;
        } catch (err) {
            throw err;
        }
    }

    /**
     * updatePayrollAssignStructure - function to handle update request
     * 
     * @param {*} updateBody 
     * @param {*} organizationId 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async updatePayrollAssignStructure(updateBody, organizationId) {
        try {
            const { employeeId, payrollPolicyId } = updateBody;

            const [empPayrollSetting] = await assignStructureModel.checkEmployeeExists(employeeId, organizationId);
            if (!empPayrollSetting.has_employee) throw new Error('Invalid Employee Id');

            //create basic emp payroll setting if not exists
            const [checkEmpPayrollSetting] = await assignStructureModel.checkEmployeePayrollSettingExists(employeeId, organizationId);
            if (!checkEmpPayrollSetting.has_employee_payroll_setting) await assignStructureModel.createEmployeePayrollSettingDefaultDetails({ employeeId, organizationId, defaultPayrollDetailsJson });

            // check payroll policy is valid or not
            if (payrollPolicyId) {
                const [checkPayrollPolicyId] = await assignStructureModel.checkPayrollPolicyExists(payrollPolicyId, organizationId);
                if (!checkPayrollPolicyId.has_payroll_policy) throw new Error('Invalid Payroll Policy Id');
            }

            let empPayrollDetailsJson = null;
            const hasEmployeePayrollDetailsKeys = Object.keys(updateBody).filter(item => updateBody[item] && UPDATEABLE_EMPLOYEE_PAYROLL_DETAILS_KEYS.includes(item)).length;
            if (hasEmployeePayrollDetailsKeys) {
                empPayrollDetailsJson = await this.getEmployeePayrollDetails(employeeId);
                // if details is empty
                if (!empPayrollDetailsJson) {
                    empPayrollDetailsJson = defaultPayrollDetailsJson;
                }
            }
            if (!_.isUndefined(updateBody.ctc)) {
                empPayrollDetailsJson = empPayrollDetailsJson ? empPayrollDetailsJson : {};
                empPayrollDetailsJson.ctc = updateBody.ctc;
            }

            const updateStatus = await assignStructureModel.updateEmpPayrollSettings({ employeeId, organizationId, payrollPolicyId, empPayrollDetailsJson });
            if (!updateStatus) return false;
            const [updatedEmployeeData] = await this.getPayrollAssignStructure({ employeeId }, organizationId);
            return updatedEmployeeData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * getEmployeePayrollDetails - function get employee payroll details 
     * 
     * @param {*} employeeId 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async getEmployeePayrollDetails(employeeId) {
        try {

            let result = null;

            const [empPayrollSetting] = await assignStructureModel.getEmpPayrollDetails(employeeId);

            if (!empPayrollSetting) return result;

            return JSON.parse(empPayrollSetting.details);
        } catch (err) {
            throw err;
        }
    }

    /**
     * createEmployeePayrollSetting - function to process the employee payroll setting changes
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async createEmployeePayrollSetting({ employeeId, organizationId }) {
        try {
            //create basic emp payroll setting if not exists
            const [checkEmpPayrollSetting] = await assignStructureModel.checkEmployeePayrollSettingExists(employeeId, organizationId);
            if (checkEmpPayrollSetting.has_employee_payroll_setting) throw new Error('Alreay Employee Payroll Settings exist');

            const createEmpPayrollSettingStatus = await assignStructureModel.createEmployeePayrollSetting({ employeeId, organizationId });
            if (!createEmpPayrollSettingStatus) return false;

            const [createdEmployeeData] = await this.getPayrollAssignStructure({ employeeId }, organizationId);
            return createdEmployeeData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * updatePayrollAssignStructure - function to handle update request
     * 
     * @param {*} updateBody 
     * @param {*} organizationId 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async updateBulkPayrollAssignStructure(updateBody, organizationId) {
        try {
            const { payrollPolicyId } = updateBody;
            let { employeeIds } = updateBody;

            //make employeeIds unique
            employeeIds = [...new Set(employeeIds)];

            const [checkPayrollPolicyId] = await assignStructureModel.checkPayrollPolicyExists(payrollPolicyId, organizationId);
            if (!checkPayrollPolicyId.has_payroll_policy) throw new Error('Invalid Payroll Policy Id');

            // get all the employeeIds to discard employeeIds which not present in system
            const employeeIdsInSystem = await assignStructureModel.getEmployeeIdInSystem(organizationId);
            const employeeIdArr = employeeIdsInSystem.map(e => +e.id);

            employeeIds = employeeIds.length ? employeeIds.filter(id => employeeIdArr.includes(id)) : employeeIdArr;
            if (employeeIds && !employeeIds.length) throw new Error('No Data found.');

            for (const employeeId of employeeIds) {
                //create basic emp payroll setting if not exists
                // or update settings if exists
                const [checkEmpPayrollSetting] = await assignStructureModel.checkEmployeePayrollSettingExists(employeeId, organizationId);
                if (!checkEmpPayrollSetting.has_employee_payroll_setting) await assignStructureModel.createEmployeePayrollSettingDefaultDetails({ employeeId, organizationId, defaultPayrollDetailsJson, payrollPolicyId });
                else await assignStructureModel.updateEmpPayrollSettings({ employeeId, organizationId, payrollPolicyId });
            }
            return true;
        } catch (err) {
            throw err;
        }
    }

    /**
     * getOrgSettings - function to org settings
     *
     * @param {*} organizationId
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getOrgSettings(organizationId) {
        try {
            const [orgSettings] = await assignStructureModel.getOrgSettings(organizationId);
            if (!orgSettings || !orgSettings.settings) return null;
            return JSON.parse(orgSettings.settings);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new PayrollAssignStructureService();