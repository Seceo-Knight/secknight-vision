const runPayrollPreviewService = require('./preview.service');
const { getPayrollPreviewValdation, completeActionValidation, getEmployeeTds } = require('./preview.validation');
const moment = require('moment');
const CTC_STR = 'CTC';
class RunPayrollPreviewController {

    async getPreview(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const { error, value } = getPayrollPreviewValdation(req.query);

            if (error) {
                return res.json({ code: 404, data: null, message: 'Validation Failed.', error: error.details[0].message });
            }
            const [previewData, fetchOrgSettings, isCompleted] = await Promise.all([
                runPayrollPreviewService.getPreview({ organization_id, ...value }),
                runPayrollPreviewService.getOrgPayrollSettings(organization_id),
                runPayrollPreviewService.isExistingPreviewData({ organization_id, ...value })
            ]);
            let totalCount = await runPayrollPreviewService.getPreview({ isCount: true, organization_id, ...value });

            let salaryStructure = fetchOrgSettings && fetchOrgSettings.salaryStructure ? fetchOrgSettings.salaryStructure : CTC_STR;
            let isCustomSalary = false;
            const { skip, limit, employeeId } = value;
            totalCount = totalCount || 0;
            if (previewData && !previewData.length) {
                return res.json({ code: 400, count: totalCount, message: 'No Data', hasMoreData: false, data: [], salaryStructure });
            }

            salaryStructure = previewData[0] && previewData[0].salaryStructure ? previewData[0].salaryStructure : salaryStructure;
            isCustomSalary = previewData[0] && previewData[0].isCustomSalary ? previewData[0].isCustomSalary : isCustomSalary;

            return res.json({ code: 200, isCompleted, isCustomSalary, count: totalCount, message: 'Run Payroll Preview', hasMoreData: !employeeId && (skip || limit) && (skip + limit < totalCount) ? true : false, data: previewData.filter(pd => !pd.isSalaryHold), salaryStructure });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    async completeAction(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const { error, value } = completeActionValidation(req.query);

            if (error) {
                return res.json({ code: 404, data: null, message: 'Validation Failed.', error: error.details[0].message });
            }
            if (!value.completed) {
                return res.json({ code: 404, data: null, message: 'Complete not called.', error: "Complete not called." });
            }

            let yyMMNow = moment().format("YYYY-MM");
            let yyMMDate = moment(value.date).format("YYYY-MM");

            if (yyMMDate > yyMMNow) {
                return res.json({ code: 404, data: null, message: 'Cannot Process for future date.', error: "Cannot Process for future date." });
            }

            // added override of calc for a month, in previous date, very danger
            if (!value.isOverrideCalc) {
                if (yyMMDate < yyMMNow && await runPayrollPreviewService.isExistingPreviewData({ organization_id, date: value.date })) {
                    return res.json({ code: 404, data: null, message: 'The selected month data is already processed.', error: "The selected month data is already processed." });
                }
            }

            const previewData = await runPayrollPreviewService.completeAction({ organization_id, ...value });
            return res.json({ code: 200, message: 'Preview Data saved', data: null });
        } catch (err) {
            return res.json({ code: 404, message: 'Preview', error: err.message, data: null });
        }
    }

    /**
     * getEmployeeTds - function to get emeployee tds
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getEmployeeTds(req, res) {
        try {
            const { organization_id, employee_id: loginEmployeeId } = req.decoded;
            const { error, value } = getEmployeeTds(req.query, loginEmployeeId);

            if (error) {
                return res.json({ code: 404, data: null, message: 'Validataion Failed.', error: error.details[0].message });
            }

            let { employee_id } = value;
            employee_id = loginEmployeeId ? loginEmployeeId : employee_id;
            const isEmployeeExists = await runPayrollPreviewService.isEmployeeExists({ organization_id, employee_id });

            if (!isEmployeeExists) {
                return res.json({ code: 400, data: null, message: 'Employee not found.', error: "Employee not found" });
            }

            const data = await runPayrollPreviewService.getEmployeeTds(organization_id, employee_id);
            return res.json({ code: 200, message: 'success', error: null, data })
        } catch (err) {
            return res.json({ code: 400, message: 'Something went wrong!', error: err.message, data: null });
        }

    }
}

module.exports = new RunPayrollPreviewController();