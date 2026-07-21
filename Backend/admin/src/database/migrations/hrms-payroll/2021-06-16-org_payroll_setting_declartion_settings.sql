-- organization setting table changes
ALTER TABLE organization_payroll_settings CHANGE settings settings LONGTEXT DEFAULT NULL;

ALTER TABLE organization_payroll_settings ADD COLUMN declaration_settings MEDIUMTEXT DEFAULT NULL AFTER settings