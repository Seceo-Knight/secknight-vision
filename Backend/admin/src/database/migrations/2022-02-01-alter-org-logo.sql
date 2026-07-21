-- alter logo for organizations
ALTER TABLE `organizations` ADD COLUMN `logo` VARCHAR(255) DEFAULT NULL AFTER `region`;


---alter organization-hrms-settings
ALTER TABLE `organization_hrms_settings`
	ADD COLUMN `logo` VARCHAR(255) NULL DEFAULT NULL AFTER `compliance_details`;