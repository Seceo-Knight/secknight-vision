----Adding new Column in employee_payroll
ALTER table employee_payroll
ADD COLUMN non_lop_gross BIGINT(15) DEFAULT 0
AFTER gross;


---- Updating that column with previous gross
UPDATE employee_payroll SET non_lop_gross = gross