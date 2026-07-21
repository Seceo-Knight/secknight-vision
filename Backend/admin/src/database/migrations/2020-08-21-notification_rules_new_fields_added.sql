ALTER TABLE `notification_rules` 
CHANGE `is_accumulate_risk` `is_multiple_alerts_in_day` TINYINT(1) NULL DEFAULT '0';


ALTER TABLE `notification_rules` 
ADD `name` VARCHAR(255) NOT NULL AFTER `is_multiple_alerts_in_day`, 
ADD `note` TEXT NOT NULL AFTER `name`, ADD `is_action_notify` TINYINT(1) NOT NULL AFTER `note`, 
ADD `include_employees` TEXT NOT NULL AFTER `is_action_notify`, 
ADD `exclude_employees` TEXT NOT NULL AFTER `include_employees`;

ALTER TABLE `notification_rules`
   ADD `created_by` bigint UNSIGNED DEFAULT NULL AFTER `exclude_employees`,
   ADD `updated_by` bigint UNSIGNED DEFAULT NULL AFTER `created_by`;

ALTER TABLE `notification_rules`
  ADD CONSTRAINT fk_notification_rule_created_user_id FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_notification_rule_updated_user_id FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;