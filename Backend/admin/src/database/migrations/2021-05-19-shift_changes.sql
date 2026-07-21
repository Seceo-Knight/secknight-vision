ALTER TABLE `organization_shifts`
ADD `late_period` char(32) NOT NULL DEFAULT '00:10' AFTER  `updated_by`,
ADD `early_login_logout_time` char(32) NOT NULL DEFAULT '00:00' AFTER `late_period`,
ADD `half_day_hours` char(32) NOT NULL DEFAULT '00:00' AFTER `early_login_logout_time`;