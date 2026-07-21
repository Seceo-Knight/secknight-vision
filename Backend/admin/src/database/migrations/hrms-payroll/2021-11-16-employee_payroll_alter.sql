-- employee_payroll alter statements
ALTER TABLE `employee_payroll` CHANGE `present_days` `present_days` DECIMAL(4,1) NULL DEFAULT '0';
ALTER TABLE `employee_payroll` CHANGE `lop` `lop` DECIMAL(4,1) NULL DEFAULT '0';
