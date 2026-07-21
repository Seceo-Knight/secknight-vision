CREATE TABLE `organization_groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `name` char(32) NOT NULL,
  `note` text CHARACTER SET 'utf8' DEFAULT NULL,
  `rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=COMPACT;

ALTER TABLE `organization_groups`
  ADD CONSTRAINT `fk_orgranization_groups_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_groups_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_groups_update` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `organization_groups_properties` (
  `group_id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_groups_properties`
  ADD CONSTRAINT `fk_groups` FOREIGN KEY (`group_id`) REFERENCES `organization_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_groups_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_groups_departemnt` FOREIGN KEY (`department_id`) REFERENCES `organization_departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_groups_location` FOREIGN KEY (`location_id`) REFERENCES `organization_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE `organization_groups_properties`
   ADD `role_id` bigint(20) UNSIGNED DEFAULT NULL;

ALTER TABLE `organization_groups_properties`
  ADD CONSTRAINT `fk_groups_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE `employees`
   ADD `group_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `custom_tracking_rule`;

ALTER TABLE `employees`
  ADD CONSTRAINT `fk_groups_employee_id` FOREIGN KEY (`group_id`) REFERENCES `organization_groups` (`id`) ON DELETE SET NULL;