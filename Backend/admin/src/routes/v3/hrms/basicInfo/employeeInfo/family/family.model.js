const mysql = require("../../../../../../database/MySqlConnection").getInstance();

class FamilyModel {

    // getter for tables
    get EMPLOYEES_TABLE() {
        return 'employees';
    }
    get EMPLOYEE_DETAILS_TABLE() {
        return 'employee_details';
    }

    /**
     * checkEmployeeExistsInSystem - function to check the employee exist in system with orgainzaiton
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    checkEmployeeExistsInSystem(employeeId, organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT id
                FROM ${this.EMPLOYEES_TABLE}
                WHERE id = ? AND organization_id = ?
            ) as has_employee_in_system;
        `;
        return mysql.query(query, [ employeeId, organizationId ]);
    }

    /**
     * checkEmployeeExists - function to check the employee exist details table
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    checkEmployeeExists(employeeId) {
        const query = `
            SELECT EXISTS (
                SELECT id
                FROM ${this.EMPLOYEE_DETAILS_TABLE}
                WHERE employee_id = ?
            ) as has_employee;
        `;
        return mysql.query(query, [ employeeId ]);
    }


    /**
     * checkEmployeeExistsWithFamily - function to check the employee exist family
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    checkEmployeeExistsWithFamily(employeeId) {
        const query = `
            SELECT EXISTS (
                SELECT family
                FROM ${this.EMPLOYEE_DETAILS_TABLE}
                WHERE employee_id = ?
            ) as has_family;
        `;

        return mysql.query(query, [ employeeId ]);
    }

    /**
     * createEmployeeDetailsWithFamily - function to create the employee in details table
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    createEmployeeDetailsWithExp(employeeId, initExpValue) {
        const query = `
            INSERT INTO ${ this.EMPLOYEE_DETAILS_TABLE } (employee_id, family) 
            VALUES (?, ?)
        `;
        return mysql.query(query, [ employeeId, JSON.stringify(initExpValue) ])
    }

    /**
     * getFamily - function to get the employee family details
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getFamily(employeeId) {
        const query = `
            SELECT family
            FROM ${ this.EMPLOYEE_DETAILS_TABLE }
            WHERE employee_id = ${employeeId}
        `;
        return mysql.query(query, [ employeeId ]);
    }

    /**
     * updateFamily - function to update the employee family details
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    updateFamily(familyData, employeeId) {
        const query = `
            UPDATE ${ this.EMPLOYEE_DETAILS_TABLE } 
            SET family = ?
            WHERE employee_id = ?
        `;
        return mysql.query(query, [ JSON.stringify(familyData), employeeId ]);
    }
}

module.exports = new FamilyModel;