const runPayrollSalaryRevisionModel = require('./salary-revision.model');

class RunPayrollSalaryRevisionService {
    async getSalaryRevision({ skip, limit, isCount, organization_id, date, is_assigned_to, role_id }) {
        try {
            const data = await runPayrollSalaryRevisionModel.getSalaryRevision({ skip, limit, isCount, organization_id, date, is_assigned_to, role_id });
            if (!data.length && !isCount) throw new Error('No Data.');
            if (isCount) {
                return data[0];
            }
            
            let resultData = data.map(d => {
                let oldCtc = isNaN(Number(d.old_ctc)) ? 0 : Number(d.old_ctc);
                let newCtc = isNaN(Number(d.new_ctc)) ? 0 : Number(d.new_ctc);
                return {
                    ...d,
                    change: newCtc - oldCtc
                }
            });
            return resultData;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new RunPayrollSalaryRevisionService();