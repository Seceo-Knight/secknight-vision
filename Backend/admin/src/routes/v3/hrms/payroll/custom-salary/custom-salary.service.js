const { remove } = require('lodash');
const {
    findUniqueAndDuplicates, arrayColumn, difference,
    MyError,
    intersection,
    wordsToSnakeCase,
    snakeCaseToWord
} = require('./custom-salary.helper');
const customSalaryModel = require('./custom-salary.model');
const _ = require('underscore');
const MANDATORY_ORG_COMPONENTS = ["annual_ctc", "monthly_ctc", "employer_pf", "employer_esic", "gross_salary", "basic_allowance"];


class CustomSalaryService {

    /**
     * bulkUpload - function to bulk upload
     * 
     * @param {*} customSalaryData 
     * @param {*} organization_id 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async bulkUpload(customSalaryData, organization_id) {
        try {

            // Finding duplicate id in sheet,it will throw error if it has duplicate ids
            const { duplicates, unique: uniqueMailIds } = await findUniqueAndDuplicates(customSalaryData, 'mail_id');
            if (duplicates.length) throw new MyError(400, `Duplicate Employee mail id Sheet: ${duplicates}`);

            // employee data fetch based on mail id given
            const employeeData = await customSalaryModel.getEmployees({ organization_id, mail_id: uniqueMailIds });
            if (!employeeData.length) throw new MyError(400, "No Employee Found With Given Employee mail Id");


            // invalid employee mail ids checks
            const employeeMailIds = arrayColumn(employeeData, 'mail_id');
            const invalidEmployeeMailIds = difference(uniqueMailIds, employeeMailIds);
            if (invalidEmployeeMailIds.length) throw new MyError(400, `Invalid Employee mail id Sheet: ${invalidEmployeeMailIds}`);


            const employeeIds = arrayColumn(employeeData, 'employee_id');
            const employeePayrollSettings = await customSalaryModel.getEmployeePayrollSettings(employeeIds);

            for (const entity of customSalaryData) {
                const { mail_id: mailId, ...salaryComponents } = entity;
                const employeeObj = employeeData.find(e => e.mail_id == mailId);

                const employeeId = employeeObj.employee_id;
                const employeeExistsObj = employeePayrollSettings.find(ep => ep.employee_id == employeeId);

                if (employeeExistsObj) {
                    // update
                    const employeeCustomSalary = { ...JSON.parse(employeeExistsObj.salary_components), ...salaryComponents };
                    await customSalaryModel.updateEmployeeSalaryComponents({ salary_components: employeeCustomSalary, employee_id: employeeId, organization_id });
                } else {
                    // create
                    await customSalaryModel.createEmployeeSalaryComponents({ salary_components: salaryComponents, employee_id: employeeId, organization_id });
                }
            }

            return true;
        } catch (err) {
            if (err instanceof MyError) throw err;
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }

    /**
     * getOrganizationPayrollSettings - function to get org payroll settings
     * 
     * @param {*} organization_id 
     * @returns
     * @author Amit Verma<amitverma@globussoft.in> 
     */
    async getOrganizationPayrollSettings(organization_id) {
        try {
            return await customSalaryModel.getOrganizationPayrollSettings(organization_id);
        } catch (err) {
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }
    /**
         * getEmployeeCustomSalaryDetails Salary setting - function to get employee custom settings
         * 
         * @param {*} organization_id 
         * @returns
         * @author Mahesh D<maheshd@globussoft.in> 
         */

    async getEmployeeCustomSalaryDetails({ skip, limit, name, employee_type, employee_id }, organization_id, role_id, manager_id) {
        try {

            let employee_ids = [];
            // user based access
            if (manager_id && manager_id != employee_id) {
                employee_ids = _.pluck(await customSalaryModel.getEmployeeAssignedToManager(manager_id, role_id), 'employee_id');
                if (employee_ids.length === 0) throw new Error('No Employee Assigned to this account.');
                if (employee_id && !employee_ids.includes(employee_id)) throw new Error('Employee not assigned to this account.');
            }

            let [data, employeeCount] = await Promise.all([
                customSalaryModel.getEmployeeCustomSalary({ organization_id, skip, limit, name, employee_type, employee_id, employee_ids, countQuery: false }),
                customSalaryModel.getEmployeeCustomSalary({ organization_id, skip, limit, name, employee_type, employee_id, employee_ids, countQuery: true })
            ])


            return { data, employeeCount };
        } catch (err) {
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }

    async getOrgCustomSalaryDetails(organization_id) {
        try {
            return await customSalaryModel.getOrganizationPayrollSettings(organization_id);
        } catch (err) {
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }

    /**
     * post salaryComponents - function to process salary components
     * 
     * @param {*} updateBody 
     * @param {*} organization_id 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async postSalaryComponents(updateBody, organization_id) {
        try {
            const { employee_id, salary_components: salaryComponents, additional_components, deduction_components } = updateBody;

            // employee data fetch based on mail id given
            const [employeeData] = await customSalaryModel.getEmployees({ organization_id, employee_id });
            if (!employeeData) throw new MyError(400, "No Employee Found");

            const [employeePayrollSettings] = await customSalaryModel.getEmployeePayrollSettings(employee_id);
            let processedAdditionalComponents = null;
            let processedDeductionComponents = null;

            //additional components
            if (additional_components && additional_components.length) {
                processedAdditionalComponents = additional_components;
            }

            // if (
            //     additional_components && additional_components.length &&
            //     employeePayrollSettings && employeePayrollSettings.additional_components
            // ) {
            //     const existingEmployeeAdditionalComponents = JSON.parse(employeePayrollSettings.additional_components);
            //     const exitingComponentName = existingEmployeeAdditionalComponents && existingEmployeeAdditionalComponents.length ? existingEmployeeAdditionalComponents.map(data => data.component_name.toLowerCase()) : [];
            //     const additionComponentName = additional_components.length ? additional_components.map(data => data.component_name.toLowerCase()) : [];
            //     const commonComponentName = intersection(exitingComponentName, additionComponentName);

            //     processedAdditionalComponents = existingEmployeeAdditionalComponents ? existingEmployeeAdditionalComponents.filter(data => !commonComponentName.some(d => d == data.component_name.toLowerCase())) : [];
            //     processedAdditionalComponents = [...processedAdditionalComponents, ...additional_components];
            // }

            // deduction components
            if (deduction_components && deduction_components.length) {
                processedDeductionComponents = deduction_components;
            }

            // if (
            //     deduction_components && deduction_components.length &&
            //     employeePayrollSettings && employeePayrollSettings.deduction_components
            // ) {
            //     const existingEmployeeDeductionComponents = JSON.parse(employeePayrollSettings.deduction_components);
            //     const exitingComponentName = existingEmployeeDeductionComponents && existingEmployeeDeductionComponents.length ? existingEmployeeDeductionComponents.map(data => data.component_name.toLowerCase()) : [];
            //     const additionComponentName = deduction_components.length ? deduction_components.map(data => data.component_name.toLowerCase()) : [];
            //     const commonComponentName = intersection(exitingComponentName, additionComponentName);

            //     processedDeductionComponents = existingEmployeeDeductionComponents ? existingEmployeeDeductionComponents.filter(data => !commonComponentName.some(d => d == data.component_name.toLowerCase())) : [];
            //     processedDeductionComponents = [...processedDeductionComponents, ...deduction_components];
            // }

            if (employeePayrollSettings && employeePayrollSettings.employee_id == employee_id) {
                // update
                await customSalaryModel.updateEmployeeSalaryComponents({ salary_components: salaryComponents, employee_id, organization_id, additional_components: processedAdditionalComponents, deduction_components: processedDeductionComponents });
            } else {
                // create
                await customSalaryModel.createEmployeeSalaryComponents({ salary_components: salaryComponents, employee_id, organization_id, additional_components, deduction_components });
            }
            return true;
        } catch (err) {
            if (err instanceof MyError) throw err;
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }

    /**
     * addOrgDefaultComponents - add default components for the organaizations
     * 
     * @param {*} organization_id 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async addOrgDefaultComponents(organization_id) {
        try {
            const defaultComponents = [
                ...MANDATORY_ORG_COMPONENTS, "hra", "telephone_and_internet",
                "medical_allowance", "lunch_allowance", "special_allowance", "admin_charges"
            ];
            await customSalaryModel.updateOrgPayrollSettings(defaultComponents, organization_id);
            return defaultComponents;
        } catch (err) {
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }

    /**
     * upsertOrgComponents - function to add / remove organization components
     * 
     * @param {*} organization_id 
     * @param {*} components 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async upsertOrgComponents(organization_id, components) {
        try {
            let { remove_components, new_components } = components;
            remove_components = wordsToSnakeCase(remove_components);
            new_components = wordsToSnakeCase(new_components);
            let employeeRemoveComponents = [];

            // throw error if remove_components contains mandatory fields
            if (
                remove_components && remove_components.length &&
                intersection(MANDATORY_ORG_COMPONENTS, remove_components).length
            ) {
                throw new MyError(400, "Cannot remove mandatory components");
            }

            const [orgPayrollSettings] = await customSalaryModel.getOrganizationPayrollSettings(organization_id);
            if (!orgPayrollSettings) throw new MyError(400, 'Organization setting not found!');

            let orgComponents = orgPayrollSettings.components ? orgPayrollSettings.components.split(',').map(c => c.trim()) : [];
            if (!orgComponents.length) throw new MyError(400, 'Organization salary components not found!');

            // remove common key from remove_components as of new_components
            if (
                remove_components && remove_components.length &&
                new_components && new_components.length
            ) {
                remove_components = difference(remove_components, new_components);
            }


            // remove the components
            if (remove_components && remove_components.length) {
                employeeRemoveComponents = intersection(orgComponents, remove_components);
                // check components used by employee or not
                // if used don't remove the components

                let [removeComponentsObj] = await customSalaryModel.getRemoveComponentsExistsStatus({ organization_id, remove_components });
                if (removeComponentsObj) {
                    const nonRemovalComponents = Object.keys(removeComponentsObj).filter(key => removeComponentsObj[key]);
                    if (nonRemovalComponents.length && intersection(nonRemovalComponents, remove_components).length) {
                        throw new MyError(400, `Cannnot remove ${intersection(nonRemovalComponents, remove_components).map(w => snakeCaseToWord(w))} used in employees salary`);
                    }
                }
                orgComponents = difference(orgComponents, remove_components);
            }

            // adding the new components
            if (new_components && new_components.length) {
                orgComponents = [...new Set([...orgComponents, ...new_components])];
            }
            await customSalaryModel.updateOrgPayrollSettings(orgComponents, organization_id);

            // if every thing fine 
            // todo: remove the components for employee salary_components
            // remove the components
            // don't uncomment it
            // if (employeeRemoveComponents.length) {
            //     await customSalaryModel.removeEmployeeSalaryComponents(organization_id, employeeRemoveComponents)
            // }

            return orgComponents;
        } catch (err) {
            if (err instanceof MyError) throw err;
            throw new MyError(400, 'Something Went Wrong', err.message);
        }
    }
}

module.exports = new CustomSalaryService();