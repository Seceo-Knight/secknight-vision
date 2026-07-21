// Salary in Hand Service

// Imports
const MyError = require("./salaryInHand.utils");
const salaryInHandModel = require("./salaryInHand.model");


/**
 * @class SalaryInHandService
 * Services for Salary in Hand Controllers
 */
class SalaryInHandService {


    /**
     * Service for Get Route Controller
     * @function getSalaryInHandService
     * @param {*} param0 
     * @returns 
     */
    async getSalaryInHandService({ name, skip, limit, organization_id, to_assigned_id, role_id }) {

        // Get Salary in Hand Data
        let employeesData = await salaryInHandModel.getSalaryInHandEmployeesData({
            name, skip, limit, organization_id, to_assigned_id, role_id
        });
        if (!employeesData.length) throw new MyError(400, "No Employee with Salary In Hand!");

        // Returns Salary in Hand Data 
        return employeesData;
    }


    /**
     * Service for Post Route Controller
     * @function postSalaryInHandService
     * @param {*} param0 
     * @returns 
     */
    async postSalaryInHandService({ organization_id, employee_ids }) {

        // Get existing SalaryInHand Data
        const salaryInHandData = await salaryInHandModel.checkSalaryInHand({ organization_id, employee_ids });
        if (salaryInHandData.length != employee_ids.length) throw new MyError(400, "Employees ID Incorrect!");

        // Sorting data for update
        let updateData = [], insertData = [];
        salaryInHandData.forEach(x => { x.employee_id ? updateData.push(x.id) : insertData.push(x.id); })

        // Some Employees Components Not Added 
        if (insertData.length) throw new MyError(400, "Selected some employees whose salary components are not Added!");

        // Update SalaryInHand data
        if (updateData.length) await salaryInHandModel.updateSalaryInHand({ updateData, organization_id });
    }


    /**
     * Service for Delete Route Controller
     * @function disableSalaryInHandService
     * @param {*} param0 
     * @returns 
     */
    async disableSalaryInHandService({ employee_id, organization_id }) {

        // Check SalaryInHand Data
        const [salaryInHandData] = await salaryInHandModel.checkSalaryInHand({ organization_id, employee_ids: [employee_id] });
        if (!salaryInHandData?.employee_id) throw new MyError(400, "Salary in Hand not active!");

        // Disable SalaryInHand 
        await salaryInHandModel.disableSalaryInHand({ organization_id, employee_id });
    }
}


// Exports
module.exports = SalaryInHandService;