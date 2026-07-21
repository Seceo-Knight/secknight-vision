const PayrollSetupSettingModel = require('./setting.model.js');
const _ = require('lodash');
const { organizationPayrollSettings: defaultOrgPayrollSetting } = require('../../advancesettings/organizationpayrollsettings.default')
class PayrollSetupSettingService {

    async getOrgPayrollSetupSetting({ organization_id }) {
        let result = null;

        const [orgPayrollSetting] = await PayrollSetupSettingModel.getOrgPayrollDetails({ organization_id })

        if (!orgPayrollSetting) return result;

        return {
            ...JSON.parse(orgPayrollSetting.settings),
            contract_scheme_id: orgPayrollSetting.contract_scheme_id ? orgPayrollSetting.contract_scheme_id : null,
            contract_scheme: orgPayrollSetting.contract_scheme ? orgPayrollSetting.contract_scheme : null
        };
    }

    async updateOrgPayrollSettings(organizationId, updateBody) {

        let orgPayrollSetting = await this.getOrgPayrollSetupSetting({ organization_id: organizationId });

        // if orgPayrollSetting is empty then, make it as default value
        if (!orgPayrollSetting) {
            orgPayrollSetting = defaultOrgPayrollSetting;
        }

        //update filed 
        if (!_.isUndefined(updateBody.pfAllowed)) {
            orgPayrollSetting.pfAllowed = updateBody.pfAllowed;
        }
        if (!_.isUndefined(updateBody.esiAllowed)) {
            orgPayrollSetting.esiAllowed = updateBody.esiAllowed;
        }
        if (!_.isUndefined(updateBody.ptAllowed)) {
            orgPayrollSetting.ptAllowed = updateBody.ptAllowed;
        }
        if (!_.isUndefined(updateBody.paycycleFrom)) {
            orgPayrollSetting.paycycle.from = updateBody.paycycleFrom;
        }
        if (!_.isUndefined(updateBody.pfPercent)) {
            if (!orgPayrollSetting.pfContribution) orgPayrollSetting.pfContribution = {};
            if (!orgPayrollSetting.pfContribution.employee) orgPayrollSetting.pfContribution.employee = {};
            orgPayrollSetting.pfContribution.employee.percentage = updateBody.pfPercent;
        }
        if (!_.isUndefined(updateBody.pfCeiling)) {
            orgPayrollSetting.pfCeiling = updateBody.pfCeiling;
        }
        if (!_.isUndefined(updateBody.isCustomSalary)) {
            orgPayrollSetting.isCustomSalary = updateBody.isCustomSalary;
        }

        const updateStatus = await PayrollSetupSettingModel.updateOrgPayrollSettings(organizationId, orgPayrollSetting, updateBody);
        if (!updateStatus) return false;
        if (updateBody.contract_scheme_id) {
            await this.updateEmpTaxSchemes({ organizationId, contract_scheme_id: updateBody.contract_scheme_id })
        }
        return await this.getOrgPayrollSetupSetting({ organization_id: organizationId });
    }

    async updateEmpTaxSchemes({ organizationId, contract_scheme_id }) {
        await PayrollSetupSettingModel.updateEmpTaxScheme({ organizationId, adminApprovedSchemeId: contract_scheme_id });
    }
}

module.exports = new PayrollSetupSettingService();