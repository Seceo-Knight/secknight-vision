const mysql = require("../../../../../../database/MySqlConnection").getInstance();

class QualificationModel {
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
     * checkEmployeeExistsWithQualification - function to check the employee exist qualification
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    checkEmployeeExistsWithQualification(employeeId) {
        const query = `
            SELECT EXISTS (
                SELECT qualification
                FROM ${this.EMPLOYEE_DETAILS_TABLE}
                WHERE employee_id = ?
            ) as has_qualification;
        `;

        return mysql.query(query, [ employeeId ]);
    }

    /**
     * createEmployeeDetailsWithQualification - function to create the employee in details table
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    createEmployeeDetailsWithQualification(employeeId, initQualificationValue) {
        const query = `
            INSERT INTO ${ this.EMPLOYEE_DETAILS_TABLE } (employee_id, qualification) 
            VALUES (?, ?)
        `;
        return mysql.query(query, [ employeeId, JSON.stringify(initQualificationValue) ])
    }

    /**
     * getQualification - function to get the employee qualification details
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getQualification(employeeId) {
        const query = `
            SELECT qualification
            FROM ${ this.EMPLOYEE_DETAILS_TABLE }
            WHERE employee_id = ${employeeId}
        `;
        return mysql.query(query, [ employeeId ]);
    }

    /**
     * updateQualification - function to update the employee qualification details
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    updateQualification(qualificationData, employeeId) {
        const query = `
            UPDATE ${ this.EMPLOYEE_DETAILS_TABLE } 
            SET qualification = ?
            WHERE employee_id = ?
        `;
        return mysql.query(query, [ JSON.stringify(qualificationData), employeeId ]);
    }
}

module.exports = new QualificationModel;