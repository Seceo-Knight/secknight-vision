const assignStructureValidation = require('./assign-structure.validation.js');
const assignStructureService = require('./assign-structure.service.js');
const CUSTOM_STR = "CUSTOM"
class PayrollAssignStructureController {

    /**
     * getPayrollPolicy - function to handle the list of payroll policy request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getPayrollPolicy(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const payrollPolcicyData = await assignStructureService.getPayrollPolicy(organization_id);
            return res.json({ code: 200, data: payrollPolcicyData, message: 'Assign Structure', error: null });
        } catch (err) {
            return res.json({ code: 400, data: null, message: 'Something went wrong', error: err.message });
        }
    }

    /**
     * getPayrollAssignStructure - function to handle get payroll Assign for employee request
     *  
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getPayrollAssignStructure(req, res) {
        try {
            const { organization_id, employee_id, role_id, is_manager, is_teamlead, language } = req.decoded;
            const { error, value } = assignStructureValidation.getPayrollAssignStructureValidation(req.query);
            if (error) {
                return res.json({ code: 404, data: null, message: 'Assign Structure', error: error.message })
            }

            const { employeeId, locationId, roleId, payrollPolicyId, search, sortOrder, sortColumn, skip, limit, employee_type } = value || {};

            let to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            const assignStructureData = await assignStructureService.getPayrollAssignStructure({ employeeId, locationId, roleId, payrollPolicyId, search, sortOrder, sortColumn, skip, limit, employee_type, to_assigned_id, role_id }, organization_id);
            const total = await assignStructureService.countPayrollAssignStructure({ employeeId, locationId, roleId, search, payrollPolicyId, employee_type, to_assigned_id, role_id }, organization_id);

            // new var to store mutated data
            let assignData = assignStructureData;

            // org salary structure added
            const fetchOrgSettings = await assignStructureService.getOrgSettings(organization_id);
            let salaryStructure = fetchOrgSettings && fetchOrgSettings.salaryStructure ? fetchOrgSettings.salaryStructure : CTC_STR;
            let isCustomSalary = fetchOrgSettings && fetchOrgSettings.isCustomSalary ? fetchOrgSettings.isCustomSalary : false;

            // if custom salary override the policy_name
            if (isCustomSalary) {
                assignData = assignStructureData.map(data => {
                    return {
                        ...data,
                        policy_name: CUSTOM_STR
                    }
                });
            }

            return res.json({ code: 200, salaryStructure, isCustomSalary, data: assignData, skip, limit, total, hasMoreData: (skip || limit) && skip + limit < total ? true : false, message: 'Assign Structure', error: null });
        } catch (err) {
            return res.json({ code: 400, data: null, message: 'Something went wrong', error: err.message });
        }
    }

    /**
     * putPayrollAssignStructure - function to handle put assign request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async putPayrollAssignStructure(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const { error, value } = assignStructureValidation.putPayrollAssignStructureValidation(req.body);
            if (error) {
                return res.json({ code: 404, data: null, message: 'Assign Structure', error: error.details[0].message })
            }

            const { employeeId, payrollPolicyId, ctc } = value;
            const updatedData = await assignStructureService.updatePayrollAssignStructure({ employeeId, payrollPolicyId, ctc }, organization_id);

            return res.json({ code: 200, data: updatedData, message: 'Successfully updated', error: null });
        } catch (err) {
            return res.json({ code: 400, data: null, message: 'Something went wrong', error: err.message });
        }
    }

    /**
     * putBulkPayrollAssignStructure - function to handle put assign request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async putBulkPayrollAssignStructure(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const { error, value } = assignStructureValidation.putBulkPayrollAssignStructureValidation(req.body);
            if (error) {
                return res.json({ code: 404, data: null, message: 'Assign Structure', error: error.details[0].message })
            }

            const { employeeIds, payrollPolicyId } = value;
            const updatedData = await assignStructureService.updateBulkPayrollAssignStructure({ employeeIds, payrollPolicyId }, organization_id);

            return res.json({ code: 200, data: updatedData, message: 'Successfully updated', error: null });
        } catch (err) {
            return res.json({ code: 400, data: null, message: 'Something went wrong', error: err.message });
        }
    }
}

module.exports = new PayrollAssignStructureController();