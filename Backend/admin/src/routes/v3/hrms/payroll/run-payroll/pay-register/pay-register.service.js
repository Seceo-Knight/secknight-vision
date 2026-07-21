const runPayrollPayRegisterModel = require('./pay-register.model');
const moment = require('moment');

class RunPayrollPayRegisterService {
    async getPayRegister({ skip, limit, isCount, organization_id, date, employee_type, components, to_assigned_id, role_id }) {
        try {
            let data = await runPayrollPayRegisterModel.getPayRegister({ skip, limit, isCount, organization_id, date, employee_type, components, to_assigned_id, role_id });

            const previewMonth = moment(date).format('MM');
            data = data.filter(x => {
                const salary_on_hold = x.salary_on_hold ? JSON.parse(x.salary_on_hold) : {};
                let { from = null, to = null, status = null } = salary_on_hold;

                from = from ? from.split('-')[1] : from;
                to = to ? to.split('-')[1] : to;
                if (status == "hold" && previewMonth >= from && previewMonth <= to) return false;
                else
                    return true;
            });

            if (!data.length && !isCount) throw new Error('No Data.');
            if (isCount) {
                return data.length;
            }

            return data;
        } catch (err) {
            throw err;
        }
    }


    /**
     * getOrgSettings - function to get org settings
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async getOrgSettings({ organization_id }) {
        try {
            const [data] = await runPayrollPayRegisterModel.getOrgSettings({ organization_id });

            if (!data) return {};
            const orgSettings = JSON.parse(data.settings);
            return {
                components: data.components.split(','),
                isCustomSalary: orgSettings.isCustomSalary
            }
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new RunPayrollPayRegisterService();