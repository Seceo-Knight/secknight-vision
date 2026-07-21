CREATE TABLE `dashboard_features` (
  `id` smallint(6) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` char(32) NOT NULL,
  `status` tinyint(2) NOT NULL DEFAULT 0 COMMENT '0:InActive,1:Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


INSERT INTO `dashboard_features` (`name`, `status`) 
VALUES('employee_notification', '1'),
    ( 'employee_details', '1'),
    ( 'employee_attendance', '1'),
    ( 'projects', '1'),
    ( 'report_download', '1'),
    ( 'productivity_report', '1'),
    ( 'setting_dept_location', '1'),
    ( 'setting_storage', '1'),
    ( 'setting_monitor_control', '1'),
    ( 'setting_productivity_rules', '1'),
    ( 'timesheet', '1'),
    ( 'auto_email', '1'),
    ( 'dashboard', '1'),
    ( 'setting_role', '0'),
    ( 'behaviour', '1'),
    ( 'setting_shift ', '1');


ALTER TABLE `organizations`
ADD `amember_id` bigint UNSIGNED DEFAULT NULL AFTER `total_allowed_user_count`;

ALTER TABLE `organizations`
ADD `language` char(32) NOT NULL DEFAULT 'en' AFTER `amember_id`,
ADD `weekday_start` enum("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday") DEFAULT 'monday' AFTER `language`;

CREATE TABLE `employee_mail_notification` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id`  bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `date` timestamp NOT NULL,
  `read_status` tinyint(2) NOT NULL DEFAULT '0',
  `notification_period` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT FK_notification_organization FOREIGN KEY (`organization_id`) REFERENCES organizations(`id`) ON DELETE CASCADE,
  CONSTRAINT FK__notification_Employee FOREIGN KEY (`employee_id`) REFERENCES employees(`id`) ON DELETE CASCADE
)

-- ALTER TABLE `employee_mail_notification`
-- ADD `notification` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL AFTER `notification_period`;

CREATE TABLE `removed_users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id`  bigint unsigned NOT NULL,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `computer_name` varchar(50) DEFAULT NULL,
  `email` varchar(128) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT FK_removed_users_org_id FOREIGN KEY (`organization_id`) REFERENCES organizations(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE application_info
ADD `agent_name` char(32)  DEFAULT NULL AFTER `status`;

ALTER TABLE users
ADD `mac_id` varchar(40)  DEFAULT NULL AFTER `username`;


ALTER TABLE assigned_employees
ADD CONSTRAINT employee_to_assigned_unic_with_role UNIQUE (employee_id, to_assigned_id, role_id);


ALTER TABLE removed_users
ADD `logged_in_email` varchar(128)  DEFAULT NULL AFTER `email`,
ADD `ip` varchar(128)  DEFAULT NULL AFTER `logged_in_email`;

ALTER TABLE `organizations`
ADD `region` SMALLINT(2) DEFAULT 1 AFTER `notes`;

ALTER TABLE `employees`
ADD `room_id` VARCHAR(512) AFTER `geolocation`;

ALTER TABLE `permissions`
ADD `type` tinyint(4) DEFAULT 1 COMMENT '1:empMonitor,2:hrms' AFTER `status`;

