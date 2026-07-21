----Employee Payroll Settings
ALTER TABLE `employee_payroll_settings`
	CHANGE COLUMN `salary_on_hold` `salary_on_hold` MEDIUMTEXT NULL DEFAULT NULL COLLATE 'latin1_swedish_ci' AFTER `deduction_components`,
	ADD COLUMN `salary_in_hand` TINYINT(2) NULL DEFAULT NULL COMMENT '0 - disable, 1 - active' AFTER `salary_on_hold`;