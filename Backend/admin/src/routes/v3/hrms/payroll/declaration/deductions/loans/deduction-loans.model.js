const mysql = require(`${dbFolder}/MySqlConnection`).getInstance();
const DEDUCTION_NAME = 'Loans';
const STATUS_APPROVED = 1;
class DeductionLoansModel {

    static get DECLARATION_COMPONENT_TABLE() {
        return 'declaration_component';
    }

    /**
     * @function getLoans
     * @description function to get loan details
     *
     * @param {*} param0
     * @returns
     * @author Amit verma <amitverma@globussoft.in>
     */
    static getLoans({ organization_id, financial_year, skip, limit, employee_id, search, isCount = false, id, declaration_component_id }) {
        let params = [organization_id, financial_year, DEDUCTION_NAME];

        let selectCol = '';
        if (isCount) {
            selectCol = ` COUNT(ed.id) AS totalCount `;
        } else {
            selectCol = `
                CONCAT(u.first_name," ",u.last_name) AS fullName,
                ed.id, ed.employee_id, ed.financial_year, ed.declared_amount, ed.approved_amount, ed.documents,
                ed.status, ed.information, ed.comments, dc.deduction_name, dc.id AS declaration_component_id,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.loan_name")) as loan_name,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.start_date")) as start_date,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.end_date")) as end_date,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.frequency")) as frequency,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.no_of_schedule")) as no_of_schedule,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.loan_process_date")) as loan_process_date,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.total_amount")) as total_amount,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.amount_paid")) as amount_paid,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.amount_pending")) as amount_pending,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.no_of_emi_pending")) as no_of_emi_pending,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.emi_amount")) as emi_amount
            `;
        }
        let query = `
            SELECT
               ${selectCol}
            FROM  employee_declaration ed
            INNER JOIN employees e ON e.id = ed.employee_id
            INNER JOIN users u ON u.id = e.user_id
            INNER JOIN declaration_component dc ON dc.id = ed.declaration_component_id
            WHERE
                ed.organization_id = ? AND
                ed.financial_year = ? AND
                dc.deduction_name = ? 
        `;
        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id = ? `;
        }

        if (search) query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%' `;

        if (id) {
            query += ` AND ed.id = ? `;
            params.push(id);
        }

        if (isCount) {
            query += ` GROUP BY ed.organization_id`;
        } else if (skip || limit) {
            query += ` LIMIT ?, ? `;
            params.push(skip, limit);
        }

        return mysql.query(query, params);
    }

    /**
     * @function createLoans
     * @description function to create loan details
     *
     * @param {*} param0
     * @returns
     * @author Amit verma <amitverma@globussoft.in>
     */
    static createLoans({
        information, total_amount: declared_amount, status,
        financial_year, comment: comments, organization_id, employee_id, declaration_component_id
    }) {
        const query = `INSERT INTO employee_declaration SET ?`;
        const insertObj = {
            information: typeof information == typeof '' ? information : JSON.stringify(information),
            financial_year, comments, organization_id, employee_id, declaration_component_id, declared_amount, status
        };
        return mysql.query(query, insertObj);
    }

    /**
     * @function updateLoans
     * @description function to update loans details
     * 
     * @param {*} param0 
     * @returns
     * @author Amit verma <amitverma@globussoft.in>
     */
    static updateLoans({
        information, id, total_amount: declared_amount, status, approved_amount,
        financial_year, comment: comments, organization_id, employee_id, declaration_component_id
    }) {
        let setStr = '';
        let setArr = [];
        let whereStr = '';
        let whereArr = [];

        if (comments) {
            const seperator = setStr ? ' , ' : ' ';
            setStr += ` ${seperator} comments = ? `;
            setArr.push(comments);
        }
        if (declared_amount) {
            const seperator = setStr ? ' , ' : ' ';
            setStr += ` ${seperator} declared_amount = ? `;
            setArr.push(declared_amount);
        }
        if (information) {
            const seperator = setStr ? ' , ' : ' ';
            setStr += ` ${seperator} information = ? `;
            setArr.push(typeof information == typeof '' ? information : JSON.stringify(information));
        }
        if (typeof status == 'number') {
            const seperator = setStr ? ' , ' : ' ';
            setStr += ` ${seperator} status = ? `;
            setArr.push(status);
        }
        if (approved_amount) {
            const seperator = setStr ? ' , ' : ' ';
            setStr += ` ${seperator} approved_amount = ? `;
            setArr.push(approved_amount);
        }
        if (id) {
            const seperator = whereStr ? ' AND ' : ' WHERE ';
            whereStr += ` ${seperator} id = ? `;
            whereArr.push(id);
        }
        if (employee_id) {
            const seperator = whereStr ? ' AND ' : ' WHERE ';
            whereStr += ` ${seperator} employee_id = ? `;
            whereArr.push(employee_id);
        }
        if (organization_id) {
            const seperator = whereStr ? ' AND ' : ' WHERE ';
            whereStr += ` ${seperator} organization_id = ? `;
            whereArr.push(organization_id);
        }
        if (financial_year) {
            const seperator = whereStr ? ' AND ' : ' WHERE ';
            whereStr += ` ${seperator} financial_year = ? `;
            whereArr.push(financial_year);
        }
        if (declaration_component_id) {
            const seperator = whereStr ? ' AND ' : ' WHERE ';
            whereStr += ` ${seperator} declaration_component_id = ? `;
            whereArr.push(declaration_component_id);
        }

        if (!setStr) return null;

        let query = `
            UPDATE employee_declaration
            SET ${setStr}
            ${whereStr}
        `;

        return mysql.query(query, [...setArr, ...whereArr]);

    }


    static getEmployeeApprovedLoans({ organization_id, employee_id, financial_year, date }) {
        let params = [organization_id, DEDUCTION_NAME, STATUS_APPROVED, date];

        const selectCol = `
            CONCAT(u.first_name," ",u.last_name) AS fullName,
            ed.id, ed.employee_id, ed.financial_year, ed.declared_amount, ed.approved_amount, ed.documents,
            ed.status, ed.information, ed.comments, dc.deduction_name, dc.id AS declaration_component_id,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.loan_name")) as loan_name,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.start_date")) as start_date,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.end_date")) as end_date,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.total_no_of_emi")) as total_no_of_emi,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.no_of_emi_pending")) as no_of_emi_pending,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.loan_process_date")) as loan_process_date,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.total_amount")) as total_amount,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.amount_paid")) as amount_paid,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.amount_pending")) as amount_pending,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.emi_amount")) as emi_amount
        `;
        let query = `
            SELECT
               ${selectCol}
            FROM  employee_declaration ed
            INNER JOIN employees e ON e.id = ed.employee_id
            INNER JOIN users u ON u.id = e.user_id
            INNER JOIN declaration_component dc ON dc.id = ed.declaration_component_id
            WHERE
                ed.organization_id = ? AND
                dc.deduction_name = ? AND
                ed.status = ? AND
                ( 
                    ? 
                    BETWEEN 
                    JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.start_date")) AND
                    JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.end_date"))
                )
        `;
        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id = ? `;
        }

        return mysql.query(query, params);
    }

    static deleteLoan({ organization_id, employee_id, id }) {
        const query = `DELETE FROM employee_declaration 
                    WHERE organization_id = ? AND employee_id = ? 
                    AND id = ? AND declaration_component_id = 36`;

        return mysql.query(query, [organization_id, employee_id, id]);
    }

    static getEmployee({ organization_id, employee_id }) {
        const query = `SELECT * from employees 
                    WHERE organization_id = ? AND id = ?`;

        return mysql.query(query, [organization_id, employee_id]);
    }

    static getLoan({ organization_id, employee_id, id }) {
        const query = `SELECT * FROM employee_declaration 
                    WHERE organization_id = ? AND employee_id = ? 
                    AND id = ?`;

        return mysql.query(query, [organization_id, employee_id, id]);
    }
}
module.exports = { DeductionLoansModel };