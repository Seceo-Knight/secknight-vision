ALTER TABLE `reseller`
ADD `details` mediumtext AFTER status;

ALTER TABLE `reseller`
  ADD `user_id` bigint UNSIGNED DEFAULT NULL AFTER id,
  ADD CONSTRAINT `user_reseller_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;