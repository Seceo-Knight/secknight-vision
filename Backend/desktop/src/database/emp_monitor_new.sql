-- phpMyAdmin SQL Dump
-- version 4.6.6deb4
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 07, 2019 at 05:09 AM
-- Server version: 10.2.22-MariaDB-10.2.22+maria~stretch-log
-- PHP Version: 5.6.40-1+0~20190111135530.9+stretch~1.gbp5f42c9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `emp_monitor`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--
CREATE TABLE `admin` (
	`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`first_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`last_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`username` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`email` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`phone` VARCHAR(15) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`address` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`status` SMALLINT(6) NOT NULL DEFAULT 1,
  `screenshot_capture_interval` SMALLINT(6) NOT NULL DEFAULT 45,
	`product_id` bigint(20) UNSIGNED NOT NULL,
  `begin_date` date NOT NULL,
  `expire_date` date NOT NULL,
  `ideal_time` SMALLINT(6) NOT NULL DEFAULT 5 COMMENT 'In Min',
  `offline_time` SMALLINT(6) NOT NULL DEFAULT 10 COMMENT 'In Min',
  `manager_ip_restriction` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1-Manager IP retriction. 0-Manager IP no retriction',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `email` (`email`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;

--
-- Table structure for table `application_info`
--
CREATE TABLE `admin_feature` (
  `id`                            bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`                      bigint(20) UNSIGNED NOT NULL,
  `screenshot_enabled`            tinyint(1) NOT NULL DEFAULT 1,
  `website_analytics_enabled`     tinyint(1) NOT NULL DEFAULT 1,
  `application_analytics_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `keystroke_enabled`             tinyint(1) NOT NULL DEFAULT 1,
  `browser_history_enabled`       tinyint(1) NOT NULL DEFAULT 1,
  `user_log_enabled`              tinyint(1) NOT NULL DEFAULT 1,
  `firewall_enabled`              tinyint(1) NOT NULL DEFAULT 1,
  `domain_enabled`                tinyint(1) NOT NULL DEFAULT 1,
  `status`                        smallint(6) NOT NULL DEFAULT 1 COMMENT '1=Active 0=Inactive',
  `created_at`                    timestamp NULL DEFAULT current_timestamp(),
  `updated_at`                    timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `application_info`
--
CREATE TABLE `application_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_type` varchar(200) DEFAULT NULL,
  `version` varchar(50) DEFAULT NULL,
  `file_url` varchar(100) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `application_used`
--
CREATE TABLE `application_used` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `app_name` text DEFAULT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `application_track`
--
CREATE TABLE `application_track` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    bigint(20) UNSIGNED NOT NULL,
  `admin_id`   bigint(20) UNSIGNED NOT NULL,
  `app_name`   text DEFAULT NULL,
  `time`       bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `day`        date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `activity_track`
--
CREATE TABLE `activity_track` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    bigint(20) UNSIGNED NOT NULL,
  `admin_id`   bigint(20) UNSIGNED NOT NULL,
  `type`       ENUM ('APP', 'WEB') NOT NULL,
  `name`       varchar(1000) NOT NULL,
  `time`       bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `day`        date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `app_domain`
--
CREATE TABLE `app_domain` (
  `id`         BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`       ENUM ('APP', 'WEB') NOT NULL,
  `name`       varchar(1000) NOT NULL,
  `status`     smallint(6) DEFAULT NULL COMMENT '0=Neutral 1=Productive 2=Unproductive',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `app_domain_productivity`
--
CREATE TABLE `app_domain_productivity` (
  `id`              BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `app_domain_id`   bigint(20) UNSIGNED NOT NULL,
  `admin_id`        bigint(20) UNSIGNED NOT NULL,
  `status`          smallint(6) NOT NULL DEFAULT 0 COMMENT '0=Neutral 1=Productive 2=Unproductive',
  `department_id`   int(11) DEFAULT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `assigned_user`
--
CREATE TABLE `assigned_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `manager_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `auto_email_report` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `recipient_email` varchar(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
  `website_analytics` tinyint(1) NOT NULL DEFAULT 0,
  `application_analytics` tinyint(1) NOT NULL DEFAULT 0,
  `keystroke` tinyint(1) NOT NULL DEFAULT 0,
  `browser_history` tinyint(1) NOT NULL DEFAULT 0,
  `user_log` tinyint(1) NOT NULL DEFAULT 0,
  `top_website_analytics` tinyint(1) NOT NULL DEFAULT 0,
  `top_application_analytics` tinyint(1) NOT NULL DEFAULT 0,
  `status` smallint(6) NOT NULL DEFAULT 0 COMMENT '1=Active 0=Inactive',
  `next_send_on` datetime DEFAULT NULL,
  `frequency_type` INT NOT NULL DEFAULT 3 COMMENT '1=daily,2=weekly,3=monthly',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
--
-- Table structure for table `blocked_user_dept_domains`
--
CREATE TABLE `blocked_user_dept_domains` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`entity_type` VARCHAR(1) NULL DEFAULT NULL,
	`entity_ids` VARCHAR(1000) NULL DEFAULT NULL,
	`days_ids` VARCHAR(1000) NULL DEFAULT NULL,
	`category_ids` VARCHAR(1000) NULL DEFAULT NULL,
	`domain_ids` VARCHAR(1000) NULL DEFAULT NULL,
	`admin_id` bigint(20) UNSIGNED NOT NULL,
    `status` smallint(6) NOT NULL DEFAULT 1,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;


--
-- Table structure for table `browser_history`
--
CREATE TABLE `browser_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `browser` varchar(255) DEFAULT NULL,
  `url` text DEFAULT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `categories`
--
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` int(11) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `days`
--
CREATE TABLE `days` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `department`
--
CREATE TABLE `department` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `depart_to_loc`
--
CREATE TABLE `depart_to_loc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `desktops`
--
CREATE TABLE `desktop_settings` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `shutdown` boolean NOT NULL default 0,
  `restart` boolean NOT NULL default 0, 
  `logoff` boolean NOT NULL default 0,
  `lock_computer` boolean NOT NULL default 0,
  `task_manager` boolean NOT NULL default 0,
  `block_usb` boolean NOT NULL default 0,
  `lock_print` boolean NOT NULL default 0,
  `signout` boolean NOT NULL default 0,
  `hibernate` boolean NOT NULL default 0,
  `sleep` boolean NOT NULL default 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `domains`
--
CREATE TABLE `domains` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categories_id` int(11) NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `feature`
--
CREATE TABLE `feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



--
-- Table structure for table `feature_to_plan`
--
CREATE TABLE `feature_to_plan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int UNIQUE NOT NULL,
  `name` varchar(255) NOT NULL,
  `feature_ids` VARCHAR(1000) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `keystroke`
--
CREATE TABLE `keystroke` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `keystroke_data` longtext DEFAULT NULL,
  `date` date NOT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `location`
--
CREATE TABLE `location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  `timezone_offset` INT(5) NOT NULL DEFAULT '330',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `production_stats`
-- ALTER TABLE production_stats
--  MODIFY day varchar(50) NOT NULL;
CREATE TABLE `production_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_sheet_id` varchar(255) NOT NULL,
  `day` varchar(50) NOT NULL,
  -- `day` date NOT NULL,
  `login_time` datetime DEFAULT NULL,
  `logout_time` datetime DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `working_hours` varchar(255) NOT NULL,
  `non_working_hours` varchar(255) NOT NULL,
  `total_hours` varchar(255) NOT NULL,
  `t_sec` INT(11) NULL DEFAULT 0,
  `w_sec` INT(11) NULL DEFAULT 0,
  `n_sec` INT(11) NULL DEFAULT 0,
  `is_report_generated` boolean,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `raw_data`
--
CREATE TABLE `raw_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `data`   text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=LATIN1;


--
-- Table structure for table `role`
--
CREATE TABLE `role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `params` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `refresh_token`
--
CREATE TABLE `refresh_token` (
  `id`              int(11) NOT NULL AUTO_INCREMENT,
  `user_id`         bigint(20) UNSIGNED NOT NULL,
  `admin_id`        bigint(20) UNSIGNED NOT NULL,
  `refresh_token`   text NOT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `storage_type`
--
CREATE TABLE `storage_type` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` boolean NOT NULL default 0,
  `password` boolean NOT NULL default 0,
  `status` int(11) NOT NULL default 0,
  `desktop_access_token` boolean NOT NULL default 0,
  `web_access_token` boolean NOT NULL default 0,
  `token` boolean NOT NULL default 0,
  `api_key` boolean NOT NULL default 0,
  `application_id` boolean NOT NULL default 0,
  `refresh_token` boolean NOT NULL default 0,
  `admin_email` boolean NOT NULL default 0,
  `client_id` boolean NOT NULL default 0,
  `client_secret` boolean NOT NULL default 0,
  `bucket_name` boolean NOT NULL default 0,
  `region` boolean NOT NULL default 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `storage_data`
--
CREATE TABLE `storage_data` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `storage_type_id` int(20) NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int(11) NOT NULL default 0,
  `desktop_access_token` varchar(255) DEFAULT NULL,
  `web_access_token` varchar(255) DEFAULT NULL,
  `token`  varchar(255) DEFAULT NULL,
  `api_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_email`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bucket_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `users`
--
CREATE TABLE `users` (
  `id`                            bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`                      bigint(20) UNSIGNED NOT NULL,
  `name`                          varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name`                     varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email`                         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at`             timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `password`                      varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token`                varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone`                         varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emp_code`                      varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_id`                   int(11) DEFAULT NULL,
  `department_id`                 int(11) NOT NULL,
  `date_join`                     date DEFAULT NULL,
  `photo_path`                    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address`                       text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id`                       int(11) NOT NULL,
  `status`                        smallint(6) NOT NULL,
  `screenshot_enabled`            tinyint(1) NOT NULL DEFAULT 1,
  `website_analytics_enabled`     tinyint(1) NOT NULL DEFAULT 1,
  `application_analytics_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `keystroke_enabled`             tinyint(1) NOT NULL DEFAULT 1,
  `browser_history_enabled`       tinyint(1) NOT NULL DEFAULT 1,
  `user_log_enabled`              tinyint(1) NOT NULL DEFAULT 1,
  `firewall_enabled`              tinyint(1) NOT NULL DEFAULT 1,
  `domain_enabled`                tinyint(1) NOT NULL DEFAULT 1,
  `timezone`                      varchar(50) NOT NULL DEFAULT 'Asia/Kolkata',
  `timezone_offset`               INT(5) NOT NULL DEFAULT 330,
  `created_at`                    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `website_track`
--
CREATE TABLE `website_track` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    bigint(20) UNSIGNED NOT NULL,
  `admin_id`   bigint(20) UNSIGNED NOT NULL,
  `web_url`    varchar(1000) DEFAULT NULL,
  `time`       bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `day`        date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `whitelist_ips`
--
CREATE TABLE `whitelist_ips` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `ip` VARCHAR(50) NOT NULL,
  `admin_email` VARCHAR(50) NOT NULL,
  PRIMARY KEY (Id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- --------------------------------------------------------
-- Indexes for dumped tables
-- --------------------------------------------------------

--
-- Indexes for table `admin_feature`
--
ALTER TABLE `admin_feature`
  ADD KEY feature_admin_relation (admin_id),
  ADD CONSTRAINT feature_admin_relation FOREIGN KEY (admin_id) REFERENCES admin (id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Indexes for table `application_used`
--
ALTER TABLE `application_used`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `application_track`
--
ALTER TABLE `application_track`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `app_domain_productivity`
--
ALTER TABLE `app_domain_productivity`
  ADD FOREIGN KEY (admin_id)      REFERENCES `admin`(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (app_domain_id) REFERENCES `app_domain`(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (department_id) REFERENCES `department`(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UC_adp_admin_ad_dept` UNIQUE (admin_id, app_domain_id, department_id);


--
-- Indexes for table `activity_track`
--
ALTER TABLE `activity_track`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table 'assigned_user'
--
ALTER TABLE `assigned_user`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table 'blocked_user_dept_domains'
--
ALTER TABLE `blocked_user_dept_domains`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `browser_history`
--
ALTER TABLE `browser_history`
	ADD `domain` varchar(255) DEFAULT NULL AFTER `browser`,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `depart_to_loc`
--
ALTER TABLE `depart_to_loc`
  ADD FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (location_id) REFERENCES location(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `desktop_settings`
--
ALTER TABLE `desktop_settings`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `domains`
--
ALTER TABLE `domains`
  ADD FOREIGN KEY (categories_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;
  

--
-- Indexes for table `keystroke`
--
ALTER TABLE `keystroke`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `location`
--
ALTER TABLE `location`
  ADD `timezone` varchar(50) NOT NULL DEFAULT "Asia/Kolkata",
  ADD `timezone_offset` int(5) NOT NULL DEFAULT 330,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `production_stats`
--
ALTER TABLE `production_stats`
  ADD CONSTRAINT `UC_production_stats_admin_user_day` UNIQUE (admin_id, user_id, day),
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `raw_data`
--
ALTER TABLE `raw_data`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `refresh_token`
--
ALTER TABLE `refresh_token`
  ADD FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id)    REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `storage_data`
--
ALTER TABLE `storage_data`
  ADD FOREIGN KEY (storage_type_id) REFERENCES storage_type(id),
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (location_id) REFERENCES location(id),
  ADD FOREIGN KEY (role_id) REFERENCES role(id),
  ADD FOREIGN KEY (department_id) REFERENCES department(id);

--
-- Indexes for table `website_track`
--
ALTER TABLE `website_track`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


--
-- Indexes for table `whitelist_ips`
--
ALTER TABLE `whitelist_ips`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE `auto_email_report`
ADD FOREIGN KEY (admin_id) REFERENCES admin (id) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;