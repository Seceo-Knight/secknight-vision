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
-- Table structure for table `actions`
--

CREATE TABLE `actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `rules_id` int(11) DEFAULT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

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
	`created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `email` (`email`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;
-- emp_new---------------------------------------------------------------------
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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

--
-- Table structure for table `blocked_websites`
--

CREATE TABLE `blocked_websites` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`user_id` bigint(20) UNSIGNED NOT NULL,
	`domain_ids` VARCHAR(1000) DEFAULT NULL,
    `category_ids` VARCHAR(1000) DEFAULT NULL,
	`days` SET('1','2','3','4','5','6','7') NOT NULL,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `blocked_department_domains`
--

CREATE TABLE `blocked_department_domains` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`department_id` int(11) NOT NULL,
	`domain_id` int(11) DEFAULT NULL,
    `category_id` int(11) DEFAULT NULL,
	`days_id` int(11) NOT NULL,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `blocked_user_domains`
--

CREATE TABLE `blocked_user_domains` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`user_id` bigint(20) UNSIGNED NOT NULL,
	`domain_id` int(11) DEFAULT NULL,
    `category_id` int(11) DEFAULT NULL,
	`days_id` int(11) NOT NULL,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB DEFAULT CHARSET=latin1;
-- --------------------------------------------------------

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
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;
-- --------------------------------------------------------

--
-- Table structure for table `break_details`
--

CREATE TABLE `break_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` date NOT NULL,
  `break_start` datetime NOT NULL,
  `break_stop` datetime DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

--
-- Table structure for table `categories_to_rule`
--

CREATE TABLE `categories_to_rule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categories_id` int(11) NOT NULL,
  `rule_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `days`
--

CREATE TABLE `days` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `days_to_rule`
--

CREATE TABLE `days_to_rule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `days_id` int(11) NOT NULL,
  `rule_id` int(11) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `keystroke`
--

CREATE TABLE `keystroke` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `keystroke_data` longtext DEFAULT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `location`
--

CREATE TABLE `location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `production_stats`
--
CREATE TABLE `production_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_sheet_id` varchar(255) NOT NULL,
  `day` date NOT NULL,
  `login_time` datetime DEFAULT NULL,
  `logout_time` datetime DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `working_hours` varchar(255) NOT NULL,
  `non_working_hours` varchar(255) NOT NULL,
  `total_hours` varchar(255) NOT NULL,
  `is_report_generated` boolean,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organization`
--

CREATE TABLE `organization` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`transaction_id` VARCHAR(100) DEFAULT NULL,
	`name` VARCHAR(100) NOT NULL,
	`registered_email` VARCHAR(100) DEFAULT NULL,
	`is_activated` INT(11) DEFAULT NULL,
	`is_email_verified` INT(11) DEFAULT NULL,
	`license_count` INT(11) DEFAULT NULL,
	`storage_data_id` INT(11) DEFAULT NULL,
	`screenshot_capture_interval` INT(11) NOT NULL DEFAULT 15,
	`verification_token` LONGTEXT DEFAULT NULL,
	`expiredate` DATE DEFAULT NULL,
	PRIMARY KEY (`id`)
)
ENGINE=INNODB
DEFAULT CHARSET=UTF8MB4
COLLATE=UTF8MB4_UNICODE_CI;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `params` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `rules`
--

CREATE TABLE `rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` boolean,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

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
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

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
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emp_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `department_id` int(11) NOT NULL,
  `date_join` date DEFAULT NULL,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `status` smallint(6) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users_to_rule`
--

CREATE TABLE `users_to_rule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `rule_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

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
--
-- Indexes for dumped tables
--

--
-- Indexes for table `actions`
--
ALTER TABLE `actions`
  ADD FOREIGN KEY (rules_id) REFERENCES rules(id);

--
-- Indexes for table `application_used`
--
ALTER TABLE `application_used`
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
-- Indexes for table `blocked_websites`
--
ALTER TABLE `blocked_websites`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Indexes for table `blocked_department_domains`
--
ALTER TABLE `blocked_department_domains`
  ADD FOREIGN KEY (department_id) REFERENCES department(id),
  ADD FOREIGN KEY (domain_id) REFERENCES domains(id),
  ADD FOREIGN KEY (category_id) REFERENCES categories(id),
  ADD FOREIGN KEY (days_id) REFERENCES days(id);

--
-- Indexes for table `blocked_user_domains`
--
ALTER TABLE `blocked_user_domains`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (domain_id) REFERENCES domains(id),
  ADD FOREIGN KEY (category_id) REFERENCES categories(id),
  ADD FOREIGN KEY (days_id) REFERENCES days(id);
  

  ALTER TABLE `blocked_user_dept_domains`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Indexes for table `browser_history`
--
ALTER TABLE `browser_history`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE `categories`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Indexes for table `categories_to_rule`
--
ALTER TABLE `categories_to_rule`
  ADD FOREIGN KEY (categories_id) REFERENCES categories(id),
  ADD FOREIGN KEY (rule_id) REFERENCES rules(id);

--
-- Indexes for table `days_to_rule`
--
ALTER TABLE `days_to_rule`
  ADD FOREIGN KEY (days_id) REFERENCES days(id),
  ADD FOREIGN KEY (rule_id) REFERENCES rules(id);


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
  ADD FOREIGN KEY (categories_id) REFERENCES categories(id),
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;
  

--
-- Indexes for table `keystroke`
--
ALTER TABLE `keystroke`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Indexes for table `organization`
--
ALTER TABLE `organization`
  ADD FOREIGN KEY (storage_data_id) REFERENCES storage_data(id);

ALTER TABLE `location`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Indexes for table `production_stats`
--
ALTER TABLE `production_stats`
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;

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
--
-- Indexes for table `users_to_rule`
--
ALTER TABLE `users_to_rule`
  ADD FOREIGN KEY (user_id) REFERENCES users(id),
  ADD FOREIGN KEY (rule_id) REFERENCES rules(id);

ALTER TABLE `whitelist_ips`
  ADD FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE ON UPDATE CASCADE;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;