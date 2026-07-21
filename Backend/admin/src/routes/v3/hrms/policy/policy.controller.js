const PolicyModel = require('./policy.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const PolicyValidation = require('./policy.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { policyMessages } = require("../../../../utils/helpers/LanguageTranslate");

class PolicyController {

    /**
* Create policy
*
* @function createPolicy
* @memberof  PolicyController
* @param {*} req
* @param {*} res
* @returns {object} created list or error
*/
    async createPolicy(req, res) {
        const { organization_id, language, user_id } = req.decoded;
        try {
            let { value, error } = PolicyValidation.addPolicy(req.body);
            if (error) return sendResponse(res, 400, null, translate(policyMessages, "2", language), error.details[0].message);

            let { title, description } = value;
            const policy_exist = await PolicyModel.checkPolicyName(title, organization_id);
            if (policy_exist.length > 0) return sendResponse(res, 400, null, translate(policyMessages, "4", language), null);

            const policy = await PolicyModel.addPolicy(title, description, user_id, organization_id);
            if (!policy) return sendResponse(res, 400, null, translate(policyMessages, "7", language), null);
            return sendResponse(res, 200, {
                policy: {
                    policy_id: policy.insertId || null,
                    title: title || null,
                    description: description,
                },
            }, translate(policyMessages, "3", language), null)
        } catch (err) {
            return sendResponse(res, 400, null, translate(policyMessages, "8", language), err);
        }
    }

    /**
* Get policy
*
* @function getPolicy
* @memberof  PolicyController
* @param {*} req
* @param {*} res
* @returns {object} requested list or error
*/
    async getPolicy(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { policy_id = null } = req.query;
            if (policy_id) {
                const policyId = await PolicyModel.checkPolicyId(policy_id, organization_id);
                if (policyId.length == 0) return sendResponse(res, 400, null, translate(policyMessages, "9", language), null);
            }
            let policies = await PolicyModel.getPolicies(policy_id, organization_id);
            if (policies.length > 0) return sendResponse(res, 200, policies, translate(policyMessages, "5", language), null);
            return sendResponse(res, 400, null, translate(policyMessages, "9", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(policyMessages, "10", language), err);
        }
    }

    /**
* Updated policy
*
* @function updatePolicy
* @memberof  PolicyController
* @param {*} req
* @param {*} res
* @returns {object} updated list or error
*/
    async updatePolicy(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = PolicyValidation.updatePolicy(req.body);
            if (error) return sendResponse(res, 404, null, translate(policyMessages, "2", language), error.details[0].message);

            let { policy_id, title, description } = value;
            const policy = await PolicyModel.checkPolicyId(policy_id, organization_id);
            if (policy.length == 0) return sendResponse(res, 400, null, translate(policyMessages, "11", language), null);

            const policyName = await PolicyModel.checkPolicyName(title, organization_id);
            if ((policyName.length > 0) && (policyName[0].id != policy_id)) return sendResponse(res, 400, null, translate(policyMessages, "4", language), null);

            const policyUpdate = await PolicyModel.updatePolicy(title, description, policy_id, organization_id);
            if (policyUpdate.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    policy: {
                        policy_id: policy_id || null,
                        title: title || null,
                        description: description,
                    },
                }, translate(policyMessages, "12", language), null);
            }
            return sendResponse(res, 400, null, translate(policyMessages, "13", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(policyMessages, "14", language), err);
        }
    }

    /**
* Deleted policy
*
* @function deletePolicy
* @memberof  PolicyController
* @param {*} req
* @param {*} res
* @returns {object} deleted list or error
*/
    async deletePolicy(req, res) {
        let { organization_id, language } = req.decoded;
        let policies = [];
        try {
            let { policy_id } = req.body;
            const policy = await PolicyModel.checkPolicyId(policy_id, organization_id);
            if (policy.length == 0) return sendResponse(res, 400, null, translate(policyMessages, "11", language), null);

            policies = await PolicyModel.deletePolicy(policy_id, organization_id);
            if (policies) return sendResponse(res, 200, [], translate(policyMessages, "15", language), null);
            return sendResponse(res, 400, null, translate(policyMessages, "16", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(policyMessages, "17", language), null);
        }
    }
}

module.exports = new PolicyController;