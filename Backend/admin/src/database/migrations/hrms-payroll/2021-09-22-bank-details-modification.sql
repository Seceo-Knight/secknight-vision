--Adding unique index for employee_id in bank_account_details table
ALTER TABLE bank_account_details DROP INDEX fk_bankaccount_employees, ADD UNIQUE fk_bankaccount_employees (employee_id) USING BTREE;


--Adding unique index for employee_id in employee_payroll_settings table
ALTER TABLE employee_payroll_settings DROP INDEX employee_id, ADD UNIQUE employee_id (employee_id) USING BTREE;