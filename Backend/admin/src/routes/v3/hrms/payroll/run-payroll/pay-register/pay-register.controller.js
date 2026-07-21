const runPayrollPayRegisterService = require('./pay-register.service');
const runPayrollPayRegisterValidation = require('./pay-register.validation');

class RunPayrollPayRegisterController {
    async getPayRegister(req, res) {
        try {
            const { organization_id, employee_id, role_id, is_manager, is_teamlead, language } = req.decoded;
            const { error, value } = runPayrollPayRegisterValidation.getPayRegisterValidation(req.query);

            if (error) {
                return res.json({ code: 404, data: null, message: 'Validation Failed.', error: error.details[0].message });
            }

            let to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            const previewData = await runPayrollPayRegisterService.getPayRegister({ to_assigned_id, role_id, organization_id, ...value });
            let totalCount = await runPayrollPayRegisterService.getPayRegister({ to_assigned_id, role_id, isCount: true, organization_id, ...value });
            const { skip, limit } = value;
            totalCount = totalCount || 0;

            const orgSettings = await runPayrollPayRegisterService.getOrgSettings({ organization_id });

            return res.json({ code: 200, orgSettings, count: totalCount, message: 'Pay Register', hasMoreData: (skip || limit) && (skip + limit < totalCount) ? true : false, data: previewData });
        } catch (err) {
            console.log(err);
            return res.json({ code: 404, message: 'Pay Register', error: err.message, data: null });
        }
    }
}

module.exports = new RunPayrollPayRegisterController();