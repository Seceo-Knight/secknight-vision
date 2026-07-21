const runPayrollSalaryRevisionService = require('./salary-revision.service');
const runPayrollSalaryRevisionValidation = require('./salary-revision.validation');

class RunPayrollSalaryRevisionController {
    async getSalaryRevision(req, res) {
        try {
            const { organization_id, employee_id, is_manager, is_teamlead, role_id, language } = req.decoded;
            const { error, value } = runPayrollSalaryRevisionValidation.getSalaryRevisionValidation(req.query);

            if (error) {
                return res.json({ code: 404, data: null, message: 'Validation Failed.', error: error.details[0].message });
            }

            const is_assigned_to = is_manager || is_teamlead ? employee_id : null;

            const salaryRevisionData = await runPayrollSalaryRevisionService.getSalaryRevision({ is_assigned_to, role_id, organization_id, ...value });
            let { totalCount } = await runPayrollSalaryRevisionService.getSalaryRevision({ isCount: true, is_assigned_to, role_id, organization_id, ...value });
            const { skip, limit } = value;
            totalCount = totalCount || 0;
            return res.json({
                code: 200,
                count: totalCount,
                message: 'Run Payroll salary revision',
                hasMoreData: (skip || limit) && (skip + limit < totalCount) ? true : false,
                data: salaryRevisionData
            });
        } catch (err) {
            return res.json({ code: 404, message: 'Preview', error: err.message, data: null });
        }
    }
}

module.exports = new RunPayrollSalaryRevisionController();