// Salary on Hold Controller

const salaryOnHoldModel = require('./salaryOnHold.models');
const salaryOnHoldValidation = require('./salaryOnHold.validator')
const { pfModel } = require('./../pfandesisettings/pfsettings/pf.model')
const _ = require('underscore');
const moment = require('moment');
const OverviewModel = require('../../run-payroll/overview/overview.model');

class SalaryOnHoldController {

    async getSalaryOnHold(req, res) {

        try {


            const { organization_id } = req.decoded;
            const { value, error } = salaryOnHoldValidation.getslaryHoldValidation(req.query);

            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }

            const salaryHoldDate = value.date;


            let orgSetting = await pfModel.getPfSettings(organization_id);
            let isPreviousMonthComplete = false;
            let isCurrentMonthComplete = false;
            let addEmployee = true;

            let { payoutDate = null } = JSON.parse(orgSetting[0]['settings']);

            // const date = moment();
            const date = salaryHoldDate;
            let year = moment(date).clone().format('YYYY');
            const previousMonth = moment(date).clone().subtract(1, 'month').format('MM');
            const currentMonth = moment(date).clone().format('MM');
            let processedMonths = await OverviewModel.getOverviewMonths({ year, organization_id });

            isCurrentMonthComplete = !!processedMonths.find(pm => +pm.month == +currentMonth && +pm.status) || isCurrentMonthComplete;

            if (!processedMonths.length) {
                year = year - 1;
            }

            processedMonths = await OverviewModel.getOverviewMonths({ year, organization_id });

            isPreviousMonthComplete = !!processedMonths.find(pm => +pm.month == +previousMonth && +pm.status) || isPreviousMonthComplete;

            let data = await salaryOnHoldModel.getSalaryOnHoldData(organization_id, isCurrentMonthComplete);
            if (!data.length) return res.json({ code: 400, isPreviousMonthComplete, isCurrentMonthComplete, payoutDate, data: null, error: 'No employee with Salary on Hold.', message: 'No employee with Salary on Hold.' });


            // data = data.map(item => {
            //     item.salary_hold = JSON.parse(item.salary_hold);
            //     const previewMonth = parseInt(moment(salaryHoldDate).format('M'));
            //     let from = item.salary_hold.from.split('-')
            //     let to = item.salary_hold.to.split('-')

            //     if ((previewMonth >= from[1] && previewMonth <= from[1]))
            //         return item;

            // })


            const previewMonth = parseInt(moment(salaryHoldDate).format('M'));
            const previewYear = parseInt(moment(salaryHoldDate).format('YYYY'));

            data = data.filter(item => {
                item.salary_hold = JSON.parse(item.salary_hold);

                let from = item.salary_hold.from.split('-')
                let to = item.salary_hold.to.split('-')
                let releasedMonth = item.salary_hold.monthReleased ? item.salary_hold.monthReleased : 0
                if (releasedMonth < 10)
                    releasedMonth = 0 + "" + releasedMonth
                let releasedyear = item.salary_hold.YearReleased ? item.salary_hold.YearReleased : 0

                if ((previewMonth >= from[1] && previewMonth <= to[1] && previewYear == from[0]) || (item.salary_hold.status == "hold" && previewMonth >= from[1] && previewYear == from[0]) || (previewMonth == releasedMonth && previewYear == releasedyear))
                    return item;

            })


            if (!data.length) return res.json({ code: 400, isPreviousMonthComplete, isCurrentMonthComplete, payoutDate, data: null, error: 'No employee with Salary on Hold.', message: 'No employee with Salary on Hold.' });

            return res.json({ code: 200, error: null, isPreviousMonthComplete, isCurrentMonthComplete, data: data, payoutDate: payoutDate, message: 'success.' });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: 'Something went wrong.' });
        }
    }

    /**
    * updateSalaryOnHold - function for update salary on hold status
    * 
    * @param {*} req 
    * @param {*} res 
    * @returns sucees or error json object
    * @author Mahesh D <maheshd@globussoft.in>
    */

    async updateSalaryOnHold(req, res) {
        try {

            const { organization_id } = req.decoded;

            const { value, error } = salaryOnHoldValidation.validateSalaryHoldEdit(req.body);

            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }
            const { employee_id, hold_type } = value

            let getEmployeeDetails = await salaryOnHoldModel.getSalaryHoldDetails(employee_id);

            if (getEmployeeDetails.length) {
                let salary_hold = getEmployeeDetails[0].salary_on_hold ? JSON.parse(getEmployeeDetails[0].salary_on_hold) : null

                if (salary_hold == null)
                    return res.json({ code: 400, error: null, data: null, message: 'Unable to update' });

                salary_hold.status = hold_type

                let currentDate = moment().format("YYYY-MM-DD");

                if (hold_type == "pay") {
                    salary_hold.monthReleased = parseInt(moment(currentDate).format('M'));
                    salary_hold.YearReleased = parseInt(moment(currentDate).format('YYYY'));
                }
                let months = [],
                    dateStart = moment(salary_hold.from),
                    dateEnd = moment(salary_hold.to),
                    year = +moment(salary_hold.from).format("YYYY");
                while (dateEnd > dateStart || dateStart.format('M') === dateEnd.format('M')) {
                    months.push(+dateStart.format('MM'));
                    dateStart.add(1, 'month');
                }
                salary_hold = JSON.stringify(salary_hold)
                await salaryOnHoldModel.updateSalaryHoldDetails(employee_id, salary_hold);
                await salaryOnHoldModel.updateEmployeePayrollDetails({ employee_id, months, year });
            } else
                return res.json({ code: 400, error: null, data: null, message: 'Please Provide valid Employee id' });

            return res.json({ code: 200, error: null, data: null, message: 'Salary hold Status Updated' });


        } catch (error) {
            return res.json({ code: 401, error: error.message, data: null, message: 'Something went wrong.' });

        }
    }

    /**
     * upsertSalaryOnHold - function for insert salary on hold details
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns sucees or error json object
     * @author Mahesh D <maheshd@globussoft.in>
     */
    async upsertSalaryOnHold(req, res) {
        try {
            const { organization_id } = req.decoded;

            const { value, error } = salaryOnHoldValidation.validateSalaryHoldConponents(req.body);

            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }

            let { salary_hold_components } = value;


            const employeeIds = _.pluck(salary_hold_components, "employee_id");

            let employeeDetails = await salaryOnHoldModel.getMultipleSalaryHoldDetails(employeeIds);

            if (employeeDetails.length < salary_hold_components.length)
                return res.json({ code: 400, error: "PayRoll was not assigned for a employee", data: null, message: 'PayRoll was not assigned for a employee' });

            salary_hold_components = await Promise.all(salary_hold_components.map(async (components) => {

                let salaryComponets = {
                    from: components.from,
                    to: components.to,
                    status: "hold"
                }

                salaryComponets = JSON.stringify(salaryComponets);
                let employee_id = components.employee_id;
                let updateEmployeeDetails = salaryOnHoldModel.updateSalaryHoldDetails(employee_id, salaryComponets);

            }
            ))

            let data = await salaryOnHoldModel.getSalaryOnHoldData(organization_id);

            data = data.map(item => {
                item.salary_hold = JSON.parse(item.salary_hold);
                return item;
            })

            return res.json({ code: 200, error: null, data: data, message: 'Salary hold Status Updated' });

        } catch (error) {
            return res.json({ code: 401, error: error.message, data: null, message: 'Something went wrong.' });
        }

    }



}

module.exports = new SalaryOnHoldController();