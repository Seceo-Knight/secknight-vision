-- phpMyAdmin SQL Dump
-- version 4.6.6deb5
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 18, 2020 at 08:03 PM
-- Server version: 10.3.22-MariaDB-1:10.3.22+maria~bionic-log
-- PHP Version: 7.2.24-0ubuntu0.18.04.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `empmonitor`
--

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `orgranization_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `location_id` bigint(20) UNSIGNED NOT NULL,
  `emp_code` varchar(50) NOT NULL DEFAULT '',
  `shift_id` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `timezone` varchar(40) DEFAULT NULL,
  `tracking_mode` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1:Stealth,2:Non-Stealth',
  `tracking_rule_type` tinyint(4) DEFAULT 1 COMMENT '1:Organization,2:Department,3:Custom',
  `custom_tracking_rule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `employee_activities`
--

CREATE TABLE `employee_activities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_id` bigint(20) UNSIGNED DEFAULT NULL,
  `application_id` bigint(20) UNSIGNED DEFAULT NULL,
  `domain_id` bigint(20) UNSIGNED DEFAULT NULL,
  `url` mediumtext DEFAULT NULL,
  `task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `total_duration` mediumint(9) NOT NULL DEFAULT 0,
  `active_seconds` mediumint(9) NOT NULL DEFAULT 0,
  `keystrokes_count` smallint(6) NOT NULL DEFAULT 0,
  `mouseclicks_count` smallint(6) DEFAULT 0,
  `mousemovement_count` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `employee_attendance`
--

CREATE TABLE `employee_attendance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `employee_browsing_history`
--

CREATE TABLE `employee_browsing_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_id` bigint(20) UNSIGNED NOT NULL,
  `proj_task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `org_apps_web_id` bigint(20) UNSIGNED DEFAULT NULL,
  `website_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `employee_keystrokes`
--

CREATE TABLE `employee_keystrokes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_id` bigint(20) UNSIGNED NOT NULL,
  `proj_task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `org_apps_web_id` bigint(20) UNSIGNED DEFAULT NULL,
  `employee_activity_id` bigint(20) DEFAULT NULL,
  `keystrokes` mediumtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `employee_tasks_timesheet`
--

CREATE TABLE `employee_tasks_timesheet` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_id` bigint(20) UNSIGNED DEFAULT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `employee_timesheet`
--

CREATE TABLE `employee_timesheet` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_id` bigint(20) UNSIGNED DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `type` tinyint(4) DEFAULT 1 COMMENT '1:Clock,2:Break',
  `duration` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `integrations`
--

CREATE TABLE `integrations` (
  `id` smallint(6) UNSIGNED NOT NULL,
  `name` varchar(48) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organizations_categories`
--

CREATE TABLE `organizations_categories` (
  `id` int(11) NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` int(11) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- --------------------------------------------------------

--
-- Table structure for table `organization_apps_web`
--

CREATE TABLE `organization_apps_web` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` tinyint(4) DEFAULT NULL COMMENT '0-Undefined,1-App,2-Website',
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0:Neutral,1:Productive,2:Non-Productive',
  `org_apps_web_group_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organization_apps_web_groups`
--

CREATE TABLE `organization_apps_web_groups` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `orgranization_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `updated_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organization_departments`
--

CREATE TABLE `organization_departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `orgranization_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `organization_department_location_relation`
--

CREATE TABLE `organization_department_location_relation` (
  `department_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `organization_locations`
--

CREATE TABLE `organization_locations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `orgranization_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `timezone` varchar(50) NOT NULL DEFAULT 'Asia/Kolkata',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `organization_providers`
--

CREATE TABLE `organization_providers` (
  `id` int(10) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `provider_id` int(11) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0:Inactive,1:Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organization_provider_credentials`
--

CREATE TABLE `organization_provider_credentials` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_provider_id` int(10) UNSIGNED NOT NULL,
  `field` varchar(30) NOT NULL,
  `value` varchar(255) NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organization_shifts`
--

CREATE TABLE `organization_shifts` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `updated_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `organization_tracking_rules`
--

CREATE TABLE `organization_tracking_rules` (
  `id` int(11) NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=COMPACT;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `permission_role`
--

CREATE TABLE `permission_role` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` int(11) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `external_proj_id` int(11) DEFAULT NULL,
  `organization_provider_id` int(10) UNSIGNED DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `actual_start_date` timestamp NULL DEFAULT NULL,
  `actual_end_date` timestamp NULL DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `project_employees`
--

CREATE TABLE `project_employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `project_modules`
--

CREATE TABLE `project_modules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `external_id` bigint(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `status` tinyint(4) DEFAULT 0 COMMENT '0:Pending,1:In Progress,2:Completed	',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `project_tasks`
--

CREATE TABLE `project_tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `project_module_id` bigint(20) UNSIGNED DEFAULT NULL,
  `employee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `external_id` bigint(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `due_date` timestamp NULL DEFAULT NULL,
  `progress` smallint(6) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0:Pending,1:In Progress,2:Completed',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `providers`
--

CREATE TABLE `providers` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(48) NOT NULL,
  `integration_id` smallint(6) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(20) NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `type` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0:Default,1:Custom',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=COMPACT;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--
CREATE TABLE `users_new` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `computer_name` varchar(50) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(128) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `domain` varchar(50) DEFAULT NULL,
  `email_verified_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `contact_number` varchar(15) NOT NULL,
  `date_join` date NOT NULL,
  `address` varchar(512) NOT NULL,
  `photo_path` varchar(255) NOT NULL DEFAULT '',
  `is_active_directory` int(1) NOT NULL DEFAULT 0,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1- Active,2- In Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- --------------------------------------------------------

--
-- Table structure for table `user_role`
--

CREATE TABLE `user_role` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `fk_employees_organizations` (`orgranization_id`) USING BTREE,
  ADD KEY `fk_employees_users` (`user_id`) USING BTREE,
  ADD KEY `fk_employees_department` (`department_id`) USING BTREE,
  ADD KEY `fk_employees_location` (`location_id`) USING BTREE;

--
-- Indexes for table `employee_activities`
--
ALTER TABLE `employee_activities`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `fk_employee_activities_attendance` (`attendance_id`) USING BTREE,
  ADD KEY `fk_employee_activities_applications` (`application_id`) USING BTREE,
  ADD KEY `fk_employee_activities_project` (`project_id`) USING BTREE,
  ADD KEY `fk_employee_activities_task` (`task_id`) USING BTREE,
  ADD KEY `fk_employee_activities_domain_id` (`domain_id`) USING BTREE;

--
-- Indexes for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UC_production_stats_organisation_employee_date` (`organization_id`,`employee_id`,`date`) USING BTREE,
  ADD KEY `employee_id` (`employee_id`) USING BTREE,
  ADD KEY `organisation_id` (`organization_id`) USING BTREE;

--
-- Indexes for table `employee_browsing_history`
--
ALTER TABLE `employee_browsing_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_employee_browsing_history_attendance` (`attendance_id`),
  ADD KEY `fk_employee_browsing_history_application` (`org_apps_web_id`),
  ADD KEY `fk_employee_browsing_history_task` (`proj_task_id`);

--
-- Indexes for table `employee_keystrokes`
--
ALTER TABLE `employee_keystrokes`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `fk_employee_keystroke_attendance` (`attendance_id`) USING BTREE,
  ADD KEY `fk_employee_keystroke_application` (`org_apps_web_id`) USING BTREE,
  ADD KEY `fk_employee_keystroke_task` (`proj_task_id`) USING BTREE;

--
-- Indexes for table `employee_tasks_timesheet`
--
ALTER TABLE `employee_tasks_timesheet`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_employee_tasks_timesheet_attendance` (`attendance_id`),
  ADD KEY `fk_employee_tasks_timesheet_attendance_task` (`task_id`);

--
-- Indexes for table `employee_timesheet`
--
ALTER TABLE `employee_timesheet`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_employee_timesheet_attendance` (`attendance_id`);

--
-- Indexes for table `integrations`
--
ALTER TABLE `integrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `fk_organizations_users` (`user_id`) USING BTREE;

--
-- Indexes for table `organizations_categories`
--
ALTER TABLE `organizations_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `organization_apps_web`
--
ALTER TABLE `organization_apps_web`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD UNIQUE KEY `organization_id` (`organization_id`,`name`,`type`,`department_id`) USING BTREE,
  ADD KEY `fk_organization_apps_web_department` (`department_id`) USING BTREE,
  ADD KEY `fk_organization_apps_web_group` (`org_apps_web_group_id`) USING BTREE;

--
-- Indexes for table `organization_apps_web_groups`
--
ALTER TABLE `organization_apps_web_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_apps_web_groups_organization` (`orgranization_id`),
  ADD KEY `fk_organization_apps_web_groups_creator` (`created_by`),
  ADD KEY `fk_organization_apps_web_groups_updator` (`updated_by`);

--
-- Indexes for table `organization_departments`
--
ALTER TABLE `organization_departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`orgranization_id`);

--
-- Indexes for table `organization_department_location_relation`
--
ALTER TABLE `organization_department_location_relation`
  ADD KEY `department_id` (`department_id`),
  ADD KEY `location_id` (`location_id`);

--
-- Indexes for table `organization_locations`
--
ALTER TABLE `organization_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`orgranization_id`);

--
-- Indexes for table `organization_providers`
--
ALTER TABLE `organization_providers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_org_providers_organization` (`organization_id`),
  ADD KEY `fk_org_providers_creator` (`created_by`),
  ADD KEY `fk_org_providers_provider` (`provider_id`);

--
-- Indexes for table `organization_provider_credentials`
--
ALTER TABLE `organization_provider_credentials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_org_provider_credentials_provider` (`org_provider_id`),
  ADD KEY `fk_org_provider_credentials_creator` (`created_by`);

--
-- Indexes for table `organization_shifts`
--
ALTER TABLE `organization_shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_org_shifts_updator` (`updated_by`),
  ADD KEY `fk_org_shifts_organization` (`organization_id`),
  ADD KEY `fk_org_shifts_creator` (`created_by`);

--
-- Indexes for table `organization_tracking_rules`
--
ALTER TABLE `organization_tracking_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_tracking_rules_organization` (`organization_id`) USING BTREE,
  ADD KEY `fk_organization_tracking_rules_creator` (`created_by`),
  ADD KEY `fk_organization_tracking_rules_updator` (`updated_by`),
  ADD KEY `fk_organization_tracking_rules_department` (`department_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permission_role`
--
ALTER TABLE `permission_role`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_permission_role_role` (`role_id`),
  ADD KEY `fk_permission_role_permission` (`permission_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `projects_external_id` (`external_proj_id`),
  ADD KEY `fk_projects_organization` (`organization_id`),
  ADD KEY `fk_projects_org_provider` (`organization_provider_id`),
  ADD KEY `fk_projects_creator` (`created_by`),
  ADD KEY `fk_projects_manager` (`manager_id`),
  ADD KEY `fk_projects_updater` (`updated_by`);

--
-- Indexes for table `project_employees`
--
ALTER TABLE `project_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_id` (`project_id`,`employee_id`),
  ADD KEY `fk_project_employees_creator` (`created_by`),
  ADD KEY `fk_project_employees_employee` (`employee_id`);

--
-- Indexes for table `project_modules`
--
ALTER TABLE `project_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_module_external_id` (`external_id`),
  ADD KEY `fk_project_modules_project` (`project_id`),
  ADD KEY `fk_project_modules_creator` (`created_by`),
  ADD KEY `fk_project_modules_updator` (`updated_by`);

--
-- Indexes for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projects_tasks_project` (`project_id`),
  ADD KEY `fk_projects_tasks_updator` (`updated_by`),
  ADD KEY `fk_projects_tasks_creator` (`created_by`),
  ADD KEY `fk_projects_tasks_module` (`project_module_id`),
  ADD KEY `fk_projects_tasks_employee` (`employee_id`);

--
-- Indexes for table `providers`
--
ALTER TABLE `providers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_providers_integration` (`integration_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_role_parent` (`organization_id`) USING BTREE;

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_role`
--
ALTER TABLE `user_role`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_role_user` (`user_id`) USING BTREE,
  ADD KEY `fk_user_role_role` (`role_id`) USING BTREE,
  ADD KEY `fk_user_role_creator` (`created_by`) USING BTREE;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=957;
--
-- AUTO_INCREMENT for table `employee_activities`
--
ALTER TABLE `employee_activities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15077932;
--
-- AUTO_INCREMENT for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14790;
--
-- AUTO_INCREMENT for table `employee_browsing_history`
--
ALTER TABLE `employee_browsing_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `employee_keystrokes`
--
ALTER TABLE `employee_keystrokes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8626;
--
-- AUTO_INCREMENT for table `employee_tasks_timesheet`
--
ALTER TABLE `employee_tasks_timesheet`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `employee_timesheet`
--
ALTER TABLE `employee_timesheet`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `integrations`
--
ALTER TABLE `integrations`
  MODIFY `id` smallint(6) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `organizations`
--
ALTER TABLE `organizations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;
--
-- AUTO_INCREMENT for table `organizations_categories`
--
ALTER TABLE `organizations_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `organization_apps_web`
--
ALTER TABLE `organization_apps_web`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34888;
--
-- AUTO_INCREMENT for table `organization_apps_web_groups`
--
ALTER TABLE `organization_apps_web_groups`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `organization_departments`
--
ALTER TABLE `organization_departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;
--
-- AUTO_INCREMENT for table `organization_locations`
--
ALTER TABLE `organization_locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=208;
--
-- AUTO_INCREMENT for table `organization_providers`
--
ALTER TABLE `organization_providers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `organization_provider_credentials`
--
ALTER TABLE `organization_provider_credentials`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `organization_tracking_rules`
--
ALTER TABLE `organization_tracking_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;
--
-- AUTO_INCREMENT for table `providers`
--
ALTER TABLE `providers`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=336;
--
-- AUTO_INCREMENT for table `user_role`
--
ALTER TABLE `user_role`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=290;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `employee_activities`
--
ALTER TABLE `employee_activities`
  ADD CONSTRAINT `fk_employee_activities_applications` FOREIGN KEY (`application_id`) REFERENCES `organization_apps_web` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_employee_activities_domain_id` FOREIGN KEY (`domain_id`) REFERENCES `organization_apps_web` (`id`);

--
-- Constraints for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  ADD CONSTRAINT `fk_employee_attendance_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`);

--
-- Constraints for table `employee_keystrokes`
--
ALTER TABLE `employee_keystrokes`
  ADD CONSTRAINT `fk_employee_keystroke_application` FOREIGN KEY (`org_apps_web_id`) REFERENCES `organization_apps_web` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_employee_keystroke_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `employee_attendance` (`id`);

--
-- Constraints for table `organizations`
--
ALTER TABLE `organizations`
  ADD CONSTRAINT `fk_organizations_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `organization_departments`
--
ALTER TABLE `organization_departments`
  ADD CONSTRAINT `fk_orgranization_departments_organizations` FOREIGN KEY (`orgranization_id`) REFERENCES `organizations` (`id`);

--
-- Constraints for table `organization_locations`
--
ALTER TABLE `organization_locations`
  ADD CONSTRAINT `fk_orgranization_locations_organizations` FOREIGN KEY (`orgranization_id`) REFERENCES `organizations` (`id`);

--
-- Constraints for table `organization_tracking_rules`
--
ALTER TABLE `organization_tracking_rules`
  ADD CONSTRAINT `fk_organization_tracking_rules_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_organization_tracking_rules_department` FOREIGN KEY (`department_id`) REFERENCES `organization_departments` (`id`),
  ADD CONSTRAINT `fk_organization_tracking_rules_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  ADD CONSTRAINT `fk_organization_tracking_rules_updator` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `providers`
--
ALTER TABLE `providers`
  ADD CONSTRAINT `fk_providers_integration` FOREIGN KEY (`integration_id`) REFERENCES `integrations` (`id`);

--
-- Constraints for table `user_role`
--
ALTER TABLE `user_role`
  ADD CONSTRAINT `fk_user_role_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
