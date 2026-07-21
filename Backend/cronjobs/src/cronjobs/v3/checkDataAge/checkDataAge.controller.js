const moment = require('moment');

const { CheckDataAgeModel } = require('./checkDataAge.model');

const { logger: Logger } = require("../../../utils/Logger");

class CheckDataAgeController {
    //Delete user activity after 6 months
    static async checkUserActivityAge() {
        try {
            Logger.info(`-----------Starting for useractivitydatas delete${new Date()}----------------`)
            const date = moment().subtract(3, 'days').toISOString();
            const resData = await CheckDataAgeModel.deleteUserActivity({ date });
            console.log(resData, '------', date);
            Logger.info(`-----------End for useractivitydatas delete${new Date()}----------------`)
            Logger.info(`-----------Start for suspended user${new Date()}----------------`)
            const organization_id = process.env.SUSPEND_EMPLOYEES_ORG_ID ? +process.env.SUSPEND_EMPLOYEES_ORG_ID : null;
            if (organization_id) {
                const dateInFormat = moment().subtract(1, 'months').format("YYYY-MM-DD");
                let [{ allEmployee_ids }] = await CheckDataAgeModel.getAllEmployeesList(organization_id);
                allEmployee_ids = allEmployee_ids.split(",").map(x => +x);

                let [employee_ids] = await CheckDataAgeModel.checkEmployeeForSuspend({ organization_id, date: dateInFormat });
                employee_ids = employee_ids ? employee_ids.employee_ids : null;
                allEmployee_ids = employee_ids ? allEmployee_ids.filter(x => !employee_ids.includes(x)) : [];

                if (allEmployee_ids.length)
                    await CheckDataAgeModel.suspendEmployees({ employee_ids: allEmployee_ids, organization_id });
            }
            Logger.info(`-----------END for suspended user${new Date()}----------------`)

            return true;
        } catch (err) {
            console.log('-------', err);
            return false;
        }
    }
}

module.exports.CheckDataAgeController = CheckDataAgeController;