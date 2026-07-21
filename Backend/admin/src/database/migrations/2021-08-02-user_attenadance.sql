ALTER TABLE `users`
DROP COLUMN `amember_id`;

ALTER TABLE `employee_attendance`
ADD `details` varchar(255) DEFAULT NULL AFTER `end_time`;