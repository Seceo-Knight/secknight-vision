-------Alter organization_hrms_settings Table
ALTER TABLE `organization_hrms_settings`
	ADD COLUMN `hrms_password` TEXT NULL AFTER `logo`,
	ADD COLUMN `bank_password` TEXT NULL AFTER `hrms_password`;