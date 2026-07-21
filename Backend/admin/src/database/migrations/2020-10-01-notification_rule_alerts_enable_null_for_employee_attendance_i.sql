ALTER TABLE `notification_rule_alerts` 
CHANGE `employee_attendance_id` `employee_attendance_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL;

ALTER TABLE notification_rules MODIFY COLUMN type ENUM('DWT','SSE','SSL','SEE','ABT','WDO','IDL','ASA','STA','OFFL');