ALTER TABLE `declaration_component` ADD COLUMN `is_other_deduction`	SMALLINT DEFAULT 0 AFTER `status`;


UPDATE `declaration_component` SET `is_other_deduction` = 1 WHERE `deduction_name` IN ('HRA', 'LTA');