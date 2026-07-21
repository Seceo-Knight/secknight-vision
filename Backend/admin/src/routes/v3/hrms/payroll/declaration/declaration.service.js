const declarationModel = require('./declaration.model');
const DeclarationHelper = require('./declaration.helper');
const moment = require("moment");
const fs = require('fs');

function deleteFileFromLocal(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (err) {
        throw err;
    }
}
class DeclarationService {
    /**
     * createOrUpdateDeclaration - function to create or update declaration
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async getDeclaration({ organization_id, employee_id, financial_year, declaration_id, component_name }) {
        try {

            const [declarationInSystem] = await declarationModel.getDeclaration({ organization_id, employee_id, financial_year, declaration_id, component_name });
            if (!declarationInSystem) throw new Error('No Data');
            return declarationInSystem;
        } catch (err) {
            throw err;
        }
    }

    /**
     * getDeclarationById - function to get declaration by id
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async getDeclarationById(employee_declaration_id) {
        try {
            let [declarationInSystem] = await declarationModel.getDeclarationById(employee_declaration_id);
            if (!declarationInSystem) {
                throw new Error('Declaration not present.');
            }
            return declarationInSystem;
        } catch (err) {
            throw err
        }
    }
    /**
     * createOrUpdateDeclaration - function to create or update declaration
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async createOrUpdateDeclaration({ organization_id, employee_id, financial_year, documents, declaration_id, declared_amount, comments, component_name, information }) {
        try {
            const [declarationInSystem] = await declarationModel.getDeclaration({ organization_id, employee_id, financial_year, declaration_id, component_name });
            const [employeeData] = await declarationModel.checkEmployeeData({ organization_id, employee_id });
            if (!employeeData) throw new Error('Invalid employee_id');

            if (!declarationInSystem) {
                return await this.createDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information, component_name });
            } else {
                return await this.updateDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information, component_name }, declarationInSystem)
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * createDeclaration - function to create declaration
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async createDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, component_name, information }) {
        try {
            const [declarationInSystem] = await declarationModel.getDeclaration({ organization_id, employee_id, financial_year, declaration_id, component_name });
            if (declarationInSystem) {
                throw new Error('Declaration already present.');
            }

            return await declarationModel.createDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information });
        } catch (err) {
            throw err;
        }

    }

    /**
     * updateDeclaration - function to update declaration
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async updateDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information, component_name }, declarationInSystem = null) {
        try {

            if (!declarationInSystem) [declarationInSystem] = await declarationModel.getDeclaration({ organization_id, employee_id, financial_year, declaration_id, component_name });
            if (!declarationInSystem) {
                throw new Error('Declaration not present.');
            }
            let documentPresentInSystemArr = JSON.parse(declarationInSystem.documents);
            documents = [...documentPresentInSystemArr || [], ...documents || []];

            let informationPresentInSystemArr = JSON.parse(declarationInSystem.information);

            information = { ...informationPresentInSystemArr || {}, ...information || {} };
            return await declarationModel.updateDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information, component_name });
        } catch (err) {
            throw err;
        }
    }


    /**
     * updateDeclaration - function to update declaration
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async updateDeclarationDocuments({ documents, employee_declaration_id }) {
        try {
            let [declarationInSystem] = await declarationModel.getDeclarationById(employee_declaration_id);
            if (!declarationInSystem) {
                throw new Error('Declaration not present.');
            }
            let documentPresentInSystemArr = JSON.parse(declarationInSystem.documents);
            documents = [...documentPresentInSystemArr || [], ...documents || []];
            return await declarationModel.updateDeclaration({ employee_declaration_id, documents });
        } catch (err) {
            throw err;
        }
    }
    /**
    * get employees taxscheme details
    * 
    * @function getEmployeesTaxschemeDetails
    * @param {*} skip
    * @param {*} limit
    * @param {*} sortColumn
    * @param {*} sortOrder
    * @param {*} organizationId 
    * @returns array
    * @author Basavaraj <basavarajshiralashetti@globussoft.in>
    */
    async getEmployeesTaxschemeDetails({ employee_ids, skip, limit, sortColumn, sortOrder, organizationId, employeeId, name, employee_type }) {
        try {
            let sort, order;
            switch (sortColumn) {
                case 'name':
                    sort = `u.first_name`;
                    order = sortOrder;
                    break;
                case 'location':
                    sort = `l.name`;
                    order = sortOrder;
                    break;
                case 'email':
                    sort = `u.a_email`;
                    order = sortOrder;
                    break;
                case 'emp_code':
                    sort = `e.emp_code`;
                    order = sortOrder;
                    break;
                default:
                    sort = `employee_id`;
                    order = `DESC`;
            }
            const [employeeData, schemeData] = await Promise.all([
                await declarationModel.getEmployeesTaxDetails({ employee_ids, skip, limit, sort, order, organizationId, employeeId, name, employee_type }),
                await declarationModel.getDefaultScheme()
            ]);
            return employeeData.map(user => {
                user.admin_approved_scheme = user.admin_approved_scheme ? user.admin_approved_scheme : schemeData[0].scheme;
                user.admin_approved_scheme_id = user.admin_approved_scheme_id ? user.admin_approved_scheme_id : schemeData[0].scheme_id;
                user.scheme = user.admin_approved_scheme;
                user.scheme_id = user.admin_approved_scheme_id;
                return user;
            });
        } catch (err) {
            throw err;
        }
    }

    /**
   * get schemes list.
   *
   * @function schemesList
   * @returns array
   * @author Basavaraj <basavarajshiralashetti@globussoft.in>
   */
    async schemesList({ employee_type }) {
        try {
            return await declarationModel.listScheme(employee_type);
        } catch (err) {
            throw err;
        }
    }

    /**
   * Update scheme details
   *
   * @function updateSchemes
   * @param {Number} organizationId
   * @param {Array} schemeData
   * @param {Boolean} employee
   * @returns array
   * @author Basavaraj <basavarajshiralashetti@globussoft.in>
   */
    async updateSchemes({ organizationId, schemeData }) {
        try {
            for (let { employeeId, adminApprovedBchemeId } of schemeData) {
                const [employeeData] = await declarationModel.checkExists({ employeeId, organizationId });
                if (employeeData) {
                    // if (employeeApprovedSchemeId == employeeData.admin_approved_scheme_id) {
                    //     continue;
                    // }
                    // else if (employee && adminApprovedBchemeId == null) {
                    //     schemeStatus = 2;
                    // }
                    // let setting = employeeData.settings ? JSON.parse(employeeData.settings) : {};
                    // setting = { ...setting, schemeStatus: schemeStatus };
                    await declarationModel.updateTaxScheme({ organizationId, employeeId, adminApprovedBchemeId })
                } else {
                    // schemeStatus = employee ? 2 : schemeStatus;
                    // setting = { schemeStatus: schemeStatus };
                    await declarationModel.addTaxSchemeData({ organizationId, employeeId, adminApprovedBchemeId });
                }
            }
        } catch (err) {
            throw err;
        }
    }

    async createHouseProperty({ declared_amount, documents, organization_id, employee_id, value }) {
        try {
            let employeeComponent = [];
            const { id, comments, financial_year, declaration_id, houseProperty = null, incomeFromPreviousEmployer = null } = value;
            let information = houseProperty ? JSON.stringify({ houseProperty }) : (incomeFromPreviousEmployer ? JSON.stringify({ incomeFromPreviousEmployer }) : {}) || {};
            if (id) {
                employeeComponent = await declarationModel.getDeclaration({ id, declaration_id, financial_year, employee_id, organization_id });
                if (employeeComponent.length == 0) {
                    throw new Error('No House Property Found')
                }
            }

            if (employeeComponent.length == 0) {
                return await declarationModel.createDeclaration(
                    {
                        information,
                        organization_id,
                        employee_id,
                        financial_year,
                        declaration_id,
                        documents,
                        comments,
                        declared_amount
                    });

            } else {
                let oldDoc = employeeComponent[0]['documents'];
                oldDoc = oldDoc ? JSON.parse(oldDoc) : [];
                employeeComponent = { houseProperty };
                // let information = JSON.stringify(employeeComponent);
                let data = await declarationModel.updateDeclaration(
                    {
                        id,
                        organization_id,
                        employee_id,
                        financial_year,
                        declaration_id,
                        documents,
                        information,
                        comments,
                        declared_amount
                    });
                if (data.affectedRows > 0) {
                    for (const file of oldDoc) {
                        deleteFileFromLocal(file.path);
                    }
                }
                return;
            }
        } catch (err) {
            throw err
        }
    }

    async getEmployeeAssignedToManager(managerId, roleId) {
        return await declarationModel.getEmployeeAssignedToManager(managerId, roleId);
    }


    /**
     * Get Employees Tax Details for financial year
     * @function getEmployeeTaxData
     * @param {*} param0 
     * @returns 
     */
    async getEmployeeTaxData({ skip, limit, date, name, employee_id,
        employee_type, organization_id, to_assigned_id, role_id }) {

        // creating fiscal year
        const year = +moment(date).format('YYYY');
        const month = +moment(date).format('MM');
        let [first_year, second_year] = month > 3 ? [+`${year}04`, +`${year + 1}03`] : [+`${year - 1}04`, +`${year}03`];

        // get employee details
        let employeeData = await declarationModel.getEmployeesDetails({ skip, limit, name, employee_id, employee_type, organization_id, to_assigned_id, role_id });
        if (!employeeData.length) throw new Error("No Employee Found!");

        /**
         * If employee_id given then 
         * his whole years data will be shown
         */
        if (employee_id) {
            let data = await declarationModel.getEmployeeTDSData({ organization_id, employee_id, first_year, second_year });
            employeeData[0].tds_data = data.length < 12 ? new DeclarationHelper().getRemainingMonthData({ data, date }) : data.sort((x, y) => (x.year - y.year) || (x.month - y.month));
        }
        else {
            const empIds = employeeData.map(x => x.employee_id);
            let data = await declarationModel.getAllEmployeeTDSData({ organization_id, first_year, second_year, empIds });
            employeeData = employeeData.map(x => ({ ...x, ...(data.find(z => x.employee_id === z.employee_id) || { total_gross: 0, gross_paid: 0, total_tds_paid: 0 }) }));
        }

        // return data for individual employee or all employees
        return employeeData;
    }


    /**
     * Updated Tax for employee
     * @function updateEmployeeTaxData
     * @param {*} param0 
     */
    async updateEmployeeTaxData({ employee_id, organization_id, date, gross, tds }) {

        // if date is after current date
        if (moment(date).isSameOrAfter(moment(), "month")) throw new Error("You cannot update data for future months!");

        // getting month, year from date
        const year = +moment(date).format('YYYY');
        const month = +moment(date).format('MM');
        let [first_year, second_year] = month > 3 ? [+`${year}04`, +`${year + 1}03`] : [+`${year - 1}04`, +`${year}03`];

        // Check if correct employee_id 
        let employeeData = await declarationModel.getEmployeesDetails({ employee_id, organization_id });
        if (!employeeData.length) throw new Error("Wrong Employee ID!");

        // Get data if data available in payroll table
        let data = await declarationModel.getEmployeeTDSData({ organization_id, employee_id, first_year, second_year });

        // payroll id of that month
        let payroll_id = data.find(x => x.month == month && x.year == year)?.employee_payroll_id || null;

        // create/update record
        payroll_id ?
            await declarationModel.updatePayrollData({ payroll_id, gross, tds })
            :
            await declarationModel.createPayrollData({ employee_id, organization_id, month, year, gross, tds });
    }
}

module.exports = new DeclarationService();

// let data = require('./house-property.default')
// console.log(JSON.stringify(data));