-------create employee_shifts table
CREATE TABLE `hrms_employee_shifts` (
	`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`employee_id` BIGINT(20) UNSIGNED NOT NULL,
	`organization_id` BIGINT(20) UNSIGNED NOT NULL,
	`shift_id` INT(20) UNSIGNED NOT NULL,
	`start_date` DATE NULL DEFAULT NULL,
	`end_date` DATE NULL DEFAULT NULL,
	`status` TINYINT(3) UNSIGNED NOT NULL DEFAULT '1',
	`created_by` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
	`updated_by` BIGINT(20) UNSIGNED NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `employee_id` (`employee_id`) USING BTREE,
	INDEX `organization_id` (`organization_id`) USING BTREE,
	INDEX `shift_id` (`shift_id`) USING BTREE,
	INDEX `created_by` (`created_by`) USING BTREE,
	INDEX `updated_by` (`updated_by`) USING BTREE,
	CONSTRAINT `fk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE SET NULL,
	CONSTRAINT `fk_emp_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT `fk_org_id` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT `fk_shifts_id` FOREIGN KEY (`shift_id`) REFERENCES `organization_shifts` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT `fk_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE SET NULL
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
;
