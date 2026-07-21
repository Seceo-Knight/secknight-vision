const mysql = require(`${dbFolder}/MySqlConnection`).getInstance();

class DeductionModel {

    static get DECLARATION_COMPONENT_TABLE() {
        return 'declaration_component';
    }
    static getEmployeeDeductions({ includeOther = true, withOtherDeductions = true, type = null, financialYear, organization_id, skip, limit, employee_id, search }) {

        let params = [organization_id, financialYear];
        let query = ` SELECT ed.id , ed.employee_id , ol.name AS location,
                      CONCAT(u.first_name," ",u.last_name ) AS fullName,
                      ed.financial_year,dc.deduction_name,e.emp_code
                      FROM  employee_declaration ed
                      INNER JOIN employees e ON ed.employee_id=e.id
                      INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
                      INNER JOIN users u ON u.id=e.user_id
                      INNER JOIN organization_locations ol ON ol.id=e.location_id 
                      WHERE ed.organization_id=? AND financial_year=?  `


        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id=?`
        }
        if (type) {
            params.push(type);
            query += ` AND dc.deduction_name=?`
        }

        if (!withOtherDeductions) {
            params.push(0);
            query += ` AND dc.is_other_income=?`
        }

        if (!includeOther) {
            params.push(0);
            query += ` AND dc.is_other_deduction=?`
        }

        if (search) query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%'`;

        query += ` GROUP BY ed.employee_id  `;

        if (skip && limit) {
            query += ` LIMIT ?, ? `;
            params.push(skip, limit);
        }

        return mysql.query(query, params);
    }

    static distinctEmployeeCount({ includeOther = true, withOtherDeductions = true, type = null, financialYear, organization_id, employee_id, search }) {

        let params = [organization_id, financialYear];
        let query = ` SELECT COUNT(DISTINCT(ed.employee_id)) as totalCount
                      FROM  employee_declaration ed
                      INNER JOIN employees e ON e.id=ed.employee_id
                      INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
                      INNER JOIN users u ON u.id=e.user_id
                      WHERE ed.organization_id=? AND financial_year=?  `

        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id=?`
        }

        if (type) {
            params.push(type);
            query += ` AND dc.deduction_name=? `
        }

        if (!withOtherDeductions) {
            params.push(0);
            query += ` AND dc.is_other_income=?`
        }
        if (!includeOther) {
            params.push(0);
            query += ` AND dc.is_other_deduction=?`
        }


        if (search) query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%'`;

        query += ` GROUP BY ed.organization_id `;

        return mysql.query(query, params);

    }

    static getDeductionsDetails({ type = null, employeeIds, financialYear, organization_id, onlyDeduction = false, withOtherDeductions }) {
        let params = [organization_id, financialYear, employeeIds];
        let query = ` SELECT ed.id , ed.employee_id, CONCAT(u.first_name," ",u.last_name) AS full_name,ed.declared_amount,
                      dc.amount_limit AS allowed_amount, dc.section_limit,
                      ed.date_range, ed.documents,
                      ed.approved_amount,ed.status,ed.comments,ed.landlord_pan,
                      ed.declaration_component_id ,dc.section,dc.deduction_name,ed.information
                      FROM  employee_declaration ed
                      INNER JOIN employees e ON ed.employee_id=e.id
                      INNER JOIN users u ON u.id=e.user_id
                      INNER JOIN organization_locations ol ON ol.id=e.location_id
                      INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
                      WHERE ed.organization_id=? AND financial_year=? AND ed.employee_id IN(?)
                      `

        if (type) {
            params.push(type);
            query += ` AND dc.deduction_name=? `
        }

        if (onlyDeduction) {

            params.push(0);
            query += ` AND dc.is_other_income=? `
        }

        if (withOtherDeductions != undefined) {
            if (withOtherDeductions) {
                params.push(1);
            } else {
                params.push(0);
            }
            query += ` AND dc.is_other_deduction=? `

        }
        return mysql.query(query, params);
    }

    static updateDeductions({ organization_id, comment, approved_amount, status, id }) {
        let params = [organization_id];
        let query = `UPDATE employee_declaration SET organization_id=? `
        if (comment) {
            query += ` ,comments= ? `
            params.push(comment)
        }
        if (approved_amount) {
            query += ` ,approved_amount= ? `
            params.push(approved_amount)
        }
        if (status == 0 || status) {
            query += ` ,status= ? `
            params.push(status)
        }

        query += ` WHERE  organization_id=? AND id=?`
        params.push(organization_id, id)

        return mysql.query(query, params)
    }

    static getHra({ organization_id, financialYear, skip, limit, employee_id, search, isCount = false }) {

        let params = [organization_id, financialYear, 'HRA']

        let selectCol = `
            ed.id ,ed.employee_id, CONCAT(u.first_name," ",u.last_name) AS fullName,
            ed.financial_year,ed.declared_amount,ed.date_range,ed.approved_amount,ed.documents,
            ed.landlord_pan,ed.status,ed.comments,dc.deduction_name,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.hra.landlord_name")) AS landlord_name,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.hra.monthly_rent")) AS montly_rent,
            JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.hra.address")) AS address
        `;

        if (isCount) {
            selectCol = `COUNT(ed.id) AS totalCount `;
        }

        let query = `SELECT 
                        ${selectCol}
                     FROM  employee_declaration ed
                     INNER JOIN employees e ON e.id=ed.employee_id
                     INNER JOIN users u ON u.id=e.user_id
                     INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
                     WHERE ed.organization_id=? AND ed.financial_year=? AND dc.deduction_name=? 
                     `
        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id=? `
        }

        if (search) query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%' `;

        if (isCount) {
            query += ` GROUP BY ed.organization_id`;
        } else {
            // query += ` GROUP BY ed.employee_id LIMIT ?, ? `;
            query += ` LIMIT ?, ? `;
            params.push(skip, limit);
        }
        return mysql.query(query, params);
    }

    static getLta({ organization_id, financialYear, skip, limit, employee_id, search, isCount = false, deduction_name = 'LTA' }) {

        let params = [organization_id, financialYear, deduction_name];

        let selectCol = '';
        if (isCount) {
            selectCol = ` COUNT(ed.id) AS totalCount `;
        } else {
            selectCol = `
                ed.id ,ed.employee_id, CONCAT(u.first_name," ",u.last_name) AS fullName,
                ed.financial_year,ed.declared_amount,ed.approved_amount,ed.documents,
                ed.status,ed.comments, dc.deduction_name, JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.lta.component_name")) as component_name,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.lta.travel_date")) as travel_date
            `;
            if (deduction_name != 'LTA') {
                selectCol += ` ,ed.information`
            }
        }
        let query = `
            SELECT
               ${selectCol}
            FROM  employee_declaration ed
            INNER JOIN employees e ON e.id=ed.employee_id
            INNER JOIN users u ON u.id=e.user_id
            INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
            WHERE
                ed.organization_id = ? AND
                ed.financial_year = ? AND
                dc.deduction_name = ? 
        `;
        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id = ? `
        }

        if (search) query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%' `;

        if (isCount) {
            query += ` GROUP BY ed.organization_id`;
        } else {
            // query += ` GROUP BY ed.employee_id LIMIT ?, ? `;
            query += ` LIMIT ?, ? `;
            params.push(skip, limit);
        }
        return mysql.query(query, params);
    }

    static getDeductionComponents({ otherIncome = false, withOtherDeductions }) {
        let query = `SELECT id , deduction_name AS name, section, status, amount_limit as allowed_amount, section_limit
                            FROM declaration_component 
                            WHERE status=? `
        let params = [1];

        if (otherIncome) {
            params.push(0)
            query += ` AND is_other_income = ?`
        }
        if (withOtherDeductions != undefined) {
            if (withOtherDeductions) {
                params.push(1);
            } else {
                params.push(0);
            }
            query += ` AND is_other_deduction=? `
        }

        return mysql.query(query, params)
    }

    static upsertBankInterest({ financial_year, information, declaration_component_id, amount: declared_amount, comment: comments, employee_id, id, organization_id }) {

        try {
            let query, params;
            if (id) {
                query = `UPDATE employee_declaration
                         SET  information=?,  declaration_component_id=?, declared_amount=?, comments=?
                         WHERE employee_id =? AND id=? AND organization_id=? AND financial_year=?
                         `
                params = [information, declaration_component_id, declared_amount, comments, employee_id, id, organization_id, financial_year]
            } else {
                query = `INSERT INTO employee_declaration (
                    information,
                    declaration_component_id,
                    financial_year,
                    declared_amount,
                    comments,
                    employee_id,
                    organization_id ) VALUES (?,?,?,?,?,?,?)`
                params = [
                    information,
                    declaration_component_id,
                    financial_year,
                    declared_amount,
                    comments,
                    employee_id,
                    organization_id
                ];
            }
            return mysql.query(query, params)

        } catch (err) {
            throw err
        }
    }

    static getDeclarationComponents({ deduction_name }) {
        let whereStr = '';
        let whereArr = [];

        if (deduction_name) {
            const seperator = whereStr ? ' AND ' : ' WHERE ';
            whereStr += ` ${seperator} deduction_name = ? `;
            whereArr.push(deduction_name);
        }

        const query = `
            SELECT 
                id, section, deduction_name, amount_limit, section_limit, status, is_other_income
            FROM ${this.DECLARATION_COMPONENT_TABLE}
            ${whereStr}
        `;
        return mysql.query(query, whereArr);
    }

    static updateHra({
        comments, financial_year, organization_id, employee_id, information, id,
        declaration_component_id, declared_amount, /* approved_amount, */  date_range, landload_pan
    }) {
        try {

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
            if (date_range) {
                const seperator = setStr ? ' , ' : ' ';
                setStr += ` ${seperator} date_range = ? `;
                setArr.push(date_range);
            }
            if (landload_pan) {
                const seperator = setStr ? ' , ' : ' ';
                setStr += ` ${seperator} landload_pan = ? `;
                setArr.push(landload_pan);
            }
            if (information) {
                const seperator = setStr ? ' , ' : ' ';
                setStr += ` ${seperator} information = ? `;
                setArr.push(information);
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
        } catch (err) {

            throw err
        }
    }

    static insertHra({
        comments, financial_year, organization_id, employee_id, information,
        declaration_component_id, declared_amount, /* approved_amount, */ date_range, landlord_pan
    }) {
        try {

            let query, params;
            query = `
                INSERT INTO employee_declaration (
                    information,
                    declaration_component_id,
                    financial_year,
                    declared_amount,
                    comments,
                    employee_id,
                    organization_id,
                    date_range,
                    landlord_pan
                )
                VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )
            `;
            params = [
                information,
                declaration_component_id,
                financial_year,
                declared_amount,
                comments,
                employee_id,
                organization_id,
                date_range,
                landlord_pan
            ];

            return mysql.query(query, params)

        } catch (err) {

            throw err
        }
    }

    static deleteDeductions({ ids, organization_id }) {
        return mysql.query(`DELETE FROM employee_declaration WHERE organization_id=? AND id IN(?)`, [organization_id, ids]);
    }

    /**
     * @function getEmployee
     * @description function to get employee id
     * 
     * @param {*} param0 
     * @returns
     * @author Amit Verma<amitverma@globussoft.in> 
     */
    static getEmployee({ employee_id, organization_id }) {
        let whereStr = '';
        let whereArr = [];

        if (!employee_id && !organization_id) return null;

        if (employee_id) {
            const seperator = whereStr ? ' AND ' : '';
            whereStr += ` ${seperator} id = ? `;
            whereArr.push(employee_id);
        }
        if (organization_id) {
            const seperator = whereStr ? ' AND ' : '';
            whereStr += ` ${seperator} organization_id = ? `;
            whereArr.push(organization_id);
        }
        let query = `
            SELECT 
                id
            FROM employees
            WHERE
                ${whereStr}
        `;

        return mysql.query(query, whereArr);
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
        const deduction_name = 'Loans';
        let params = [organization_id, financial_year, deduction_name];

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
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.frequency")) as frequency,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.no_of_schedule")) as no_of_schedule,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.loan_process_date")) as loan_process_date,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.total_amount")) as total_amount,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.amount_paid")) as amount_paid,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.amount_pending")) as amount_pending
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
        information, total_amount: declared_amount,
        financial_year, comment: comments, organization_id, employee_id, declaration_component_id
    }) {
        const query = `INSERT INTO employee_declaration SET ?`;
        const insertObj = {
            information: typeof information == typeof '' ? information : JSON.stringify(information),
            financial_year, comments, organization_id, employee_id, declaration_component_id, declared_amount
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
        information, id, total_amount: declared_amount,
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

    static getTaxDeclarationCount({ organization_id, financialYear, employee_id }) {

        let params = [organization_id, financialYear, employee_id];

        let query = `
            SELECT
              COUNT(ed.id) AS totalCount,dc.deduction_name
            FROM  employee_declaration ed
            LEFT JOIN declaration_component dc ON ed.declaration_component_id = dc.id
            WHERE
                ed.organization_id = ? AND
                ed.financial_year = ? AND  ed.employee_id = ? GROUP BY dc.deduction_name
        `;


        return mysql.query(query, params);
    }

    static getReimbursement({ is_assigned_to, role_id, organization_id, financialYear, skip = 0, limit = 0, employee_id, search, id = false, isCount = false, deduction_name = 'reimbursement', status = false, endDataFormat = null, startDataFormat = null }) {

        let params = [organization_id, deduction_name];

        let selectCol = '';
        if (isCount) {
            selectCol = ` COUNT(ed.id) AS totalCount `;
        } else {
            selectCol = `
                ed.id ,ed.employee_id, CONCAT(u.first_name," ",u.last_name) AS fullName,
                ed.financial_year,ed.declared_amount,ed.approved_amount,ed.documents,e.emp_code,
                ed.status, dc.deduction_name, JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.reimbursement.component_name")) as component_name,
                JSON_UNQUOTE(JSON_EXTRACT(ed.information, "$.reimbursement.declared_date")) as declared_date,
                JSON_UNQUOTE(JSON_EXTRACT(ed.comments, "$.employee_comment.comment")) as comments
            `;
        }
        let query = is_assigned_to ?
            `SELECT
               ${selectCol}
            FROM assigned_employees ae
            INNER JOIN employee_declaration ed ON ae.employee_id = ed.employee_id
            INNER JOIN employees e ON e.id=ed.employee_id
            INNER JOIN users u ON u.id=e.user_id
            INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
            WHERE 
                ae.to_assigned_id = ${is_assigned_to} AND 
                ae.role_id = ${role_id} AND 
                ed.organization_id = ? AND 
                dc.deduction_name = ? `:
            `SELECT
               ${selectCol}
            FROM  employee_declaration ed
            INNER JOIN employees e ON e.id=ed.employee_id
            INNER JOIN users u ON u.id=e.user_id
            INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
            WHERE
                ed.organization_id = ? AND
                dc.deduction_name = ? `;

        if (financialYear) {
            params.push(financialYear);
            query += `AND ed.financial_year = ? `
        }

        if (employee_id) {
            params.push(employee_id);
            query += ` AND ed.employee_id = ? `
        }

        if (id) {
            params.push(id);
            query += ` AND ed.id = ? `
        }

        if (status) {
            params.push(0);
            query += ` AND ed.status = ? `
        }

        if (endDataFormat) {
            params.push(startDataFormat, endDataFormat);
            query += ` AND date(ed.created_at) BETWEEN ? AND ? `
        }

        if (search) query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%' `;

        if (isCount) {
            query += ` GROUP BY ed.organization_id`;
        }

        if (limit) {
            query += ` LIMIT ?, ? `;
            params.push(skip, limit);
        }


        return mysql.query(query, params);
    }

    static getReimbursementAmount({ employee_id, deduction_name = 'reimbursement', startDataFormat, endDataFormat }) {

        let params = [employee_id, deduction_name, 1];

        let query = `
        SELECT  
        SUM(approved_amount) as totalAmount
            FROM  employee_declaration ed
            INNER JOIN declaration_component dc ON dc.id=ed.declaration_component_id
            WHERE
            ed.employee_id = ? AND
               dc.deduction_name = ? AND ed.status = ?
        `;

        params.push(startDataFormat, endDataFormat);
        query += ` AND date(ed.created_at) BETWEEN ? AND ? `


        return mysql.query(query, params);
    }

}
module.exports = { DeductionModel };