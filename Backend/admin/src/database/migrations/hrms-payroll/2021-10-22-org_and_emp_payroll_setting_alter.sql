ALTER TABLE organization_payroll_settings ADD components MEDIUMTEXT NULL DEFAULT NULL AFTER settings;

ALTER TABLE employee_payroll_settings ADD salary_components MEDIUMTEXT NULL DEFAULT NULL AFTER settings;

ALTER TABLE employee_payroll_settings ADD additional_components MEDIUMTEXT NULL DEFAULT NULL AFTER salary_components;

ALTER TABLE employee_payroll_settings ADD deduction_components MEDIUMTEXT NULL DEFAULT NULL AFTER additional_components;