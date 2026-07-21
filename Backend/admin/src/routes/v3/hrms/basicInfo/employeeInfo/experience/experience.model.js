const mysql = require("../../../../../../database/MySqlConnection").getInstance();

class ExperienceModel {
    //getter for tables
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
     * checkEmployeeExistsWithExperience - function to check the employee exist experience
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    checkEmployeeExistsWithExperience(employeeId) {
        const query = `
            SELECT EXISTS (
                SELECT experience
                FROM ${this.EMPLOYEE_DETAILS_TABLE}
                WHERE employee_id = ?
            ) as has_experience;
        `;

        return mysql.query(query, [ employeeId ]);
    }

    /**
     * createEmployeeDetailsWithExperience - function to create the employee in details table
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    createEmployeeDetailsWithExp(employeeId, initExpValue) {
        const query = `
            INSERT INTO ${ this.EMPLOYEE_DETAILS_TABLE } (employee_id, experience) 
            VALUES (?, ?)
        `;
        return mysql.query(query, [ employeeId, JSON.stringify(initExpValue) ])
    }

    /**
     * getExperience - function to get the employee experience details
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getExperience(employeeId) {
        const query = `
            SELECT experience
            FROM ${ this.EMPLOYEE_DETAILS_TABLE }
            WHERE employee_id = ${employeeId}
        `;
        return mysql.query(query, [ employeeId ]);
    }

    /**
     * updateExperience - function to update the employee experience details
     * 
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    updateExperience(experienceData, employeeId) {
        const query = `
            UPDATE ${ this.EMPLOYEE_DETAILS_TABLE } 
            SET experience = ?
            WHERE employee_id = ?
        `;
        return mysql.query(query, [ JSON.stringify(experienceData), employeeId ]);
    }
}

module.exports = new ExperienceModel;