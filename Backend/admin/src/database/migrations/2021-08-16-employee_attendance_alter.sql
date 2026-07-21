ALTER TABLE `employee_attendance` ADD COLUMN `is_manual_attendance` SMALLINT(2) DEFAULT 0 AFTER `details`;

-- To add new column as updated_by as foreign key with users table id
ALTER TABLE `employee_attendance` ADD COLUMN `updated_by` bigint(20) UNSIGNED DEFAULT null AFTER `details`, 
ADD FOREIGN KEY (`updated_by`)  REFERENCES `users`(`id`) ON DELETE SET NULL;

-- To add new column as updated_by as foreign key with users table id
ALTER TABLE `hrms_employee_attendance` ADD COLUMN `updated_by` bigint(20) UNSIGNED DEFAULT null AFTER `details`, 
ADD FOREIGN KEY (`updated_by`)  REFERENCES `users`(`id`) ON DELETE SET NULL;


------To alter organization_hrms_settings Table
ALTER TABLE `organization_hrms_settings`
	ADD COLUMN `attendance_colors` TEXT NULL AFTER `value`;