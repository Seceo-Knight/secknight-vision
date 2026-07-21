ALTER TABLE `organization_payroll_salary_components` ADD COLUMN `is_sys_calc` SMALLINT DEFAULT 0 AFTER `component_type`;

UPDATE  `organization_payroll_salary_components` SET `is_sys_calc` = 1 WHERE `component_name` LIKE "%PF";
UPDATE  `organization_payroll_salary_components` SET `is_sys_calc` = 1 WHERE `component_name` LIKE "%PT";
UPDATE  `organization_payroll_salary_components` SET `is_sys_calc` = 1 WHERE `component_name` LIKE "%ESIC";