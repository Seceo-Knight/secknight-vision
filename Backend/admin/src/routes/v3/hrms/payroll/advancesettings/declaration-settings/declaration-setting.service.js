const _ = require("lodash");
const declarationSettingModel = require("./declaration-setting.model");
const defaultDeclarationSettingObj = {
    isDeclarationWindowOpen: false,
    isMandatorProofNeeded: false,
};

class DeclarationSettingService {

    /**
     * getDeclarationSettings - function to process the get declaration settings
     * 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getDeclarationSettings(organizationId) {
        try {
            const [declarationSettingData] = await declarationSettingModel.getDeclarationSettings(organizationId);
            if (!declarationSettingData || !declarationSettingData.declaration_settings) throw new Error('No Data.');

            return { ...defaultDeclarationSettingObj, ...JSON.parse(declarationSettingData.declaration_settings) };
        } catch (err) {
            throw err;
        }
    }

    /**
     * updateDeclarationSettings - function to process update declaration settings
     * 
     * @param {*} updateBody 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@gloubssoft.in>
     */
    async updateDeclarationSettings(updateBody, organizationId) {
        try {
            let declarationSettings = {};
            let [checkDeclarationSettings] = await declarationSettingModel.checkDeclarationSettingExists(organizationId);

            if (!checkDeclarationSettings.has_org_declaration_setting) {
                await this.createDeclarationSettings(declarationSettings, organizationId);
            }

            if (!_.isUndefined(updateBody.isDeclarationWindowOpen)) declarationSettings.isDeclarationWindowOpen = updateBody.isDeclarationWindowOpen;
            if (!_.isUndefined(updateBody.isMandatorProofNeeded)) declarationSettings.isMandatorProofNeeded = updateBody.isMandatorProofNeeded;
            if (!_.isUndefined(updateBody.enabled)) declarationSettings.enabled = updateBody.enabled;
            if (!_.isUndefined(updateBody.isAppliedForAll)) declarationSettings.isAppliedForAll = updateBody.isAppliedForAll;
            if (!_.isUndefined(updateBody.employeeIds)) declarationSettings.employeeIds = updateBody.employeeIds;
            if (!_.isUndefined(updateBody.monthly)) declarationSettings.monthly = updateBody.monthly;
            if (!_.isUndefined(updateBody.yearly)) declarationSettings.yearly = updateBody.yearly;

            const updateStatus = await declarationSettingModel.updateDeclarationSettings(declarationSettings, organizationId);
            if (!updateStatus) throw new Error('Something went wrong!');
            return await this.getDeclarationSettings(organizationId);
        } catch (err) {
            throw err;
        }
    }

    /**
     * createDeclarationSettings - function to create declaration settings
     * 
     * @param {*} declarationSettings 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async createDeclarationSettings(declarationSettings, organizationId) {
        try {
            let [checkDeclarationSettings] = await declarationSettingModel.checkDeclarationSettingExists(organizationId);
            if (checkDeclarationSettings.has_org_declaration_setting) throw new Error('Declaration Settings Already Present');

            let [checkOrgSettingExists] = await declarationSettingModel.checkOrganizationPayrollSettingExists(organizationId);

            if (!checkOrgSettingExists.has_org_payroll_setting) {
                const createStatus = await declarationSettingModel.createDeclarationSettings(declarationSettings, organizationId);
                if (!createStatus) throw new Error('Something went wrong!');
            } else {
                const updateStatus = await declarationSettingModel.updateDeclarationSettings(declarationSettings, organizationId);
                if (!updateStatus) throw new Error('Something went wrong!');
            }
            return await this.getDeclarationSettings(organizationId);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new DeclarationSettingService();