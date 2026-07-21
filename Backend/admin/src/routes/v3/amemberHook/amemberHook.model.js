const mySql = require('../../../database/MySqlConnection').getInstance();

class AmemberHookModel {
    getOrganizationId(user_id, email) { 
        let query = `SELECT o.id, os.rules FROM organizations o 
        JOIN users u ON u.id = o.user_id 
        JOIN organization_settings os ON os.organization_id  = o.id 
        WHERE u.email= "${email}"`;
        return mySql.query(query); 
    }

    updateExpairyData(id, rules) { 
        let query = `UPDATE organization_settings SET rules='${rules}' WHERE organization_id = ${id}`;
         return mySql.query(query);
    }

    getOrganizationEmployee(organization_id) {
        let query = `
            SELECT e.id, u.email, u.a_email
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    insertPaymentLogs(data) { 
        const query = `INSERT INTO payment_logs (invoice_id, user_id, display_invoice_id, transaction_id, dattm, amount, rebill_date, due_date, invoice_key, status, dec_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            data.invoice_id,
            data.user_id,
            data.display_invoice_id,
            data.transaction_id,
            data.dattm,
            data.amount,
            data.rebill_date,
            data.due_date,
            data.invoice_key,
            data.status,
            data.dec_status
        ];
        return mySql.query(query, values);
    }


    async fetchPaymentLogs(count) { 
        let query = ``;
        if(count) query = `SELECT COUNT(*) AS total FROM payment_logs`;
        else query = `SELECT * FROM payment_logs ORDER BY created_at DESC`;
    
        let result = await mySql.query(query);
        if(count) return result[0].total;
        return result;
    }
    
}

module.exports = new AmemberHookModel;