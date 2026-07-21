-- create table query
CREATE TABLE `hrms_employee_attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `emp_attendance_id` bigint unsigned DEFAULT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `organization_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `details` varchar(255) DEFAULT NULL,
  `is_manual_attendance` smallint DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date_employee_id` (`employee_id`,`date`),
  KEY `fk_employee_attendance_organization` (`organization_id`),
  KEY `fk_employee_attendance_employee` (`employee_id`),
  KEY `fk_employee_attendance_id` (`emp_attendance_id`),
  CONSTRAINT `fk_employee_attendance_id` FOREIGN KEY (`emp_attendance_id`) REFERENCES `employee_attendance` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65538 DEFAULT CHARSET=utf8mb4 ;

-- to populate the data
INSERT INTO `hrms_employee_attendance`(`emp_attendance_id`, `employee_id`,`organization_id`,`date`,`start_time`,`end_time`, `details`,`is_manual_attendance` ,`created_at`,`updated_at` ) 
SELECT  `id`, `employee_id`,`organization_id`,`date`,`start_time`,`end_time`, `details`,`is_manual_attendance` ,`created_at`,`updated_at` from `employee_attendance`;