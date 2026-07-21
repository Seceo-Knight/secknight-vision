ALTER TABLE `notification_rule_alerts` 
ADD `delivered_at` DATETIME NULL DEFAULT NULL AFTER `employee_id`;

ALTER TABLE `notification_rule_alerts` 
ADD `subject` TEXT NULL DEFAULT NULL AFTER `employee_id`, 
ADD `message` TEXT NULL DEFAULT NULL AFTER `subject`;