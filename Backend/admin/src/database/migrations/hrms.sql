-- Alter table organization_locations

ALTER TABLE `organization_locations`
    ADD `location_head_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `organization_id`,
    ADD `location_hr_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `location_head_id`,
    ADD `details` mediumtext DEFAULT NULL AFTER `location_hr_id`;

-- Indexes for table organization_locations

ALTER TABLE `organization_locations`
  ADD KEY `FK_organization_locations_employees` (`location_hr_id`),
  ADD KEY `FK_organization_locations_users` (`location_head_id`);

-- Constraints for table organization_locations

ALTER TABLE `organization_locations`
  ADD CONSTRAINT `FK_organization_locations_users` FOREIGN KEY (`location_head_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_organization_locations_employees` FOREIGN KEY (`location_hr_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

-- Alter table organization_locations

ALTER TABLE `organization_department_location_relation`
    ADD `department_head_id` bigint(20) UNSIGNED DEFAULT NULL;

-- Indexes for table organization_department_location_relation

ALTER TABLE `organization_department_location_relation`
  ADD KEY `FK_organization_department_location_relation_employees` (`department_head_id`);

-- Constraints for table organization_department_location_relation

ALTER TABLE `organization_department_location_relation`
  ADD CONSTRAINT `FK_organization_department_location_relation_employees` FOREIGN KEY (`department_head_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- policies table
CREATE TABLE `policies` (
  `id` bigint(20) NOT NULL,
  `title` varchar(55) NOT NULL,
  `description` mediumtext NOT NULL,
  `added_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_policies_organizations` (`organization_id`),
  ADD KEY `FK_policies_users` (`added_by_id`);

ALTER TABLE `policies`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `policies`
  ADD CONSTRAINT `FK_policies_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_policies_users` FOREIGN KEY (`added_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Table structure for table `expenses`
--
CREATE TABLE `expenses` (
  `id` int(11)  UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_id` bigint(20) UNSIGNED,
  `organization_id` bigint(20) UNSIGNED,
  `expense_type` varchar(55) NOT NULL,
  `bill_image` text NOT NULL,
  `amount` varchar(55) NOT NULL,
  `purchase_date` date  NOT NULL,
  `remarks` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD KEY `fk_employee_expenses` (`employee_id`),
  ADD KEY `fk_expenses_organization` (`organization_id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_employee_expenses` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expenses_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `announcements`
--
CREATE TABLE `announcements` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` varchar(55) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `organization_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `summary` text NOT NULL,
  `description` mediumtext NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `announcements`
  ADD KEY `fk_announcement_locations` (`location_id`),
  ADD KEY `fk_announcement_departments` (`department_id`),
  ADD KEY `fk_announcement_organizations` (`organization_id`);

ALTER TABLE `announcements`
  ADD CONSTRAINT `fk_announcement_departments` FOREIGN KEY (`department_id`) REFERENCES `organization_departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_announcement_locations` FOREIGN KEY (`location_id`) REFERENCES `organization_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_announcement_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `jobs`
--
CREATE TABLE `jobs` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `job_title` varchar(255) NOT NULL,
  `organization_id` bigint(20) UNSIGNED DEFAULT NULL,
  `job_type` varchar(255) NOT NULL,
  `job_vacancy` int(55) NOT NULL,
  `gender` varchar(55) NOT NULL,
  `minimum_experience` varchar(55) NOT NULL,
  `date_of_closing` date NOT NULL,
  `short_description` text NOT NULL,
  `long_description` text NOT NULL,
  `status` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD KEY `fk_jobs_organization` (`organization_id`);

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `fk_jobs_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `job_candidates`
--
CREATE TABLE `job_candidates` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `organization_id` bigint(20) UNSIGNED DEFAULT NULL,
  `job_title` varchar(55) NOT NULL,
  `job_type` varchar(55) NOT NULL,
  `candidate_name` varchar(55) NOT NULL,
  `email` varchar(55) NOT NULL,
  `status` varchar(55) NOT NULL,
  `applied_date` date NOT NULL,
  `resume` varchar(255) NOT NULL,
  `phone_number` char(20) NOT NULL,
  `application_remarks` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for table `job_candidates`
--
ALTER TABLE `job_candidates`
  ADD KEY `fk_jobcandidate_organization` (`organization_id`);

--
-- Constraints for table `job_candidates`
--
ALTER TABLE `job_candidates`
  ADD CONSTRAINT `fk_jobcandidate_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `transfer`
--
CREATE TABLE `transfer` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `transfer_date` date NOT NULL,
  `transfer_department` bigint(20) UNSIGNED NOT NULL,
  `transfer_location` bigint(20) UNSIGNED NOT NULL,
  `description` text NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for table `transfer`
--
ALTER TABLE `transfer`
  ADD KEY `fk_transfer_employees` (`employee_id`),
  ADD KEY `fk_transfer_organization` (`organization_id`),
  ADD KEY `fk_transfer_department` (`transfer_department`),
  ADD KEY `fk_transfer_location` (`transfer_location`);

--
-- Constraints for table `transfer`
--
ALTER TABLE `transfer`
  ADD CONSTRAINT `fk_transfer_department` FOREIGN KEY (`transfer_department`) REFERENCES `organization_departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transfer_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transfer_location` FOREIGN KEY (`transfer_location`) REFERENCES `organization_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transfer_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- organization_awards table

CREATE TABLE `organization_awards` (
  `id` int(11) NOT NULL,
  `award_type` varchar(55) NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `gift` varchar(55) NOT NULL,
  `cash` varchar(55) NOT NULL,
  `date` date NOT NULL,
  `information` mediumtext NOT NULL,
  `award_photo` varchar(55) DEFAULT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_awards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_awards_employees` (`employee_id`) USING BTREE,
  ADD KEY `fk_organization_awards_organizations` (`organization_id`) USING BTREE;

ALTER TABLE `organization_awards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `organization_awards`
  ADD CONSTRAINT `fk_organization_awards_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_organization_awards_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- organization_promotions table

CREATE TABLE `organization_promotions` (
  `id` int(11) NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(55) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `date` date NOT NULL,
  `added_by` bigint(20) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_promotions_employees` (`employee_id`) USING BTREE,
  ADD KEY `fk_organization_promotions_users` (`added_by`) USING BTREE,
  ADD KEY `fk_organization_promotions_organizations` (`organization_id`) USING BTREE;

ALTER TABLE `organization_promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `organization_promotions`
  ADD CONSTRAINT `fk_organization_promotions_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_organization_promotions_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_organization_promotions_users` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- organization_terminations table

CREATE TABLE `organization_terminations` (
  `id` int(11) NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `type` tinyint(4) NOT NULL COMMENT '1-terminate, 2-resign',
  `notice` date NOT NULL,
  `termination` date NOT NULL,
  `reason` varchar(155) NOT NULL,
  `status` tinyint(4) NOT NULL COMMENT '0-pending, 1-approved, 2-rejected',
  `description` mediumtext NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_terminations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_terminations_employees` (`employee_id`) USING BTREE,
  ADD KEY `fk_organization_terminations_organizations` (`organization_id`) USING BTREE;

ALTER TABLE `organization_terminations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `organization_terminations`
  ADD CONSTRAINT `fk_organization_terminations_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_organization_terminations_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- organization_travels table

CREATE TABLE `organization_travels` (
  `id` int(11) NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `place` varchar(155) NOT NULL,
  `travel_mode` varchar(55) NOT NULL,
  `arrangement_type` varchar(55) NOT NULL,
  `expected_travel_budget` varchar(55) NOT NULL,
  `actual_travel_budget` varchar(55) NOT NULL,
  `description` mediumtext NOT NULL,
  `status` tinyint(4) NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_travels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_travels_users` (`employee_id`) USING BTREE,
  ADD KEY `FK_organization_travels_organizations` (`organization_id`) USING BTREE;

ALTER TABLE `organization_travels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `organization_travels`
  ADD CONSTRAINT `FK_organization_travels_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_organization_travels_users` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
 
-- organization_leave_types table

CREATE TABLE `organization_leave_types` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(55) NOT NULL,
  `duration` int(11) NOT NULL COMMENT '1-Yearly, 2-Halfy Yearly, 3-Quarterly, 4-Monthly',
  `number_of_days` int(11) NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_leave_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_leave_types_organizations` (`organization_id`);

ALTER TABLE `organization_leave_types`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `organization_leave_types`
  ADD CONSTRAINT `fk_organization_leave_types_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_leave_types`
    ADD `carry_forward` bigint(20) UNSIGNED DEFAULT '0' COMMENT '0-No, 1-Yes' AFTER `number_of_days`;
-- employee_leaves table

CREATE TABLE `employee_leaves` (
  `id` int(11) NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `leave_type` int(11) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `number_of_days` int(11) NOT NULL,
  `reason` mediumtext NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0-pending, 1-approved, 2-rejected',
  `organization_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `employee_leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_employee_leaves_employees` (`employee_id`) USING BTREE,
  ADD KEY `fk_employee_leaves_organizations` (`organization_id`) USING BTREE,
  ADD KEY `fk_employee_leaves_organization_leave_types` (`leave_type`) USING BTREE;

ALTER TABLE `employee_leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `employee_leaves`
  ADD CONSTRAINT `fk_employee_leaves_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_leaves_organization_leave_types` FOREIGN KEY (`leave_type`) REFERENCES `organization_leave_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_leaves_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- organization_hrms_settings table

CREATE TABLE `organization_hrms_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(155) NOT NULL,
  `value` mediumtext NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `organization_hrms_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organization_hrms_settings_organizations` (`organization_id`);

ALTER TABLE `organization_hrms_settings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `organization_hrms_settings`
  ADD CONSTRAINT `fk_organization_hrms_settings_organizations` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `bank_account_details`
--
CREATE TABLE `bank_account_details` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `account_number` varchar(100) NOT NULL,
  `ifsc_code` varchar(100) NOT NULL,
  `address` varchar(100) NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for table `bank_account_details`
--
ALTER TABLE `bank_account_details`
  ADD KEY `fk_bankaccount_employees` (`employee_id`),
  ADD KEY `fk_bankaccount_organization` (`organization_id`);

--
-- Constraints for table `bank_account_details`
--
ALTER TABLE `bank_account_details`
  ADD CONSTRAINT `fk_bankaccount_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bankaccount_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;  

--
-- Table structure for table `holidays`
--
CREATE TABLE `holidays` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `holiday_name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for table `holidays`
--
ALTER TABLE `holidays`
  ADD KEY `fk_holiday_organization` (`organization_id`);

--
-- Constraints for table `holidays`
--
ALTER TABLE `holidays`
  ADD CONSTRAINT `fk_holiday_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;  

--
-- Table structure for table `organization_complaint_warnings`
--
CREATE TABLE `organization_complaint_warnings` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `complaint_from` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `complaint_date` date NOT NULL,
  `complaint_against` bigint(20) UNSIGNED NOT NULL,
  `description` text NOT NULL,
  `status` tinyint(2) NOT NULL,
  `organization_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warning_type` bigint(20) DEFAULT NULL COMMENT '	1 Verbal 2 First Warning 3 Second Warning 4 Final Warning 5 Incident Explanation Request	',
  `type` int(11) DEFAULT NULL COMMENT '1 complaints 2 warnings',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;  

--
-- Indexes for table `organization_complaint_warnings`
--
ALTER TABLE `organization_complaint_warnings`
  ADD KEY `fk_complaint_from_employee` (`complaint_from`),
  ADD KEY `fk_complaint_against_employee` (`complaint_against`),
  ADD KEY `fk_complaint_organization` (`organization_id`);

--
-- Constraints for table `organization_complaint_warnings`
--
ALTER TABLE `organization_complaint_warnings`
  ADD CONSTRAINT `fk_complaint_against_employee` FOREIGN KEY (`complaint_against`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_complaint_from_employee` FOREIGN KEY (`complaint_from`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_complaint_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;

-- alter employee_leaves table
ALTER TABLE `employee_leaves` 
  ADD `day_type` tinyint(4) NOT NULL DEFAULT 2 COMMENT '1-Half day,2-Full day' AFTER `employee_id`,
  ADD `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  ADD `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- employee_payroll_settings table
CREATE TABLE employee_payroll_settings (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id`     bigint(20) UNSIGNED NOT NULL,
  `employee_id`         bigint(20) UNSIGNED NOT NULL,
  `pf_override`         tinyint(1) Default 0 COMMENT "1-override,0-organization pf settings",
  `esi_override`        tinyint(1) Default 0 COMMENT "1-override  ,0-organization pf settings",
  `pf_applicable`       tinyint(1) Default 0 COMMENT "1- applicable ,0- not applicable",
  `esi_applicable`      tinyint(1) Default 0 COMMENT "1- applicable ,0- not applicable",
  `details`             mediumtext  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin Default NULL,
  `settings`            mediumtext  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin Default NULL,
  `created_at`          timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at`          timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (id)
) ENGINE=InnoDB;

ALTER TABLE `employee_payroll_settings`
ADD FOREIGN KEY(`employee_id`) REFERENCES employees(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY(`organization_id`) REFERENCES organizations(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- PT table 
CREATE TABLE `professional_tax` (
  `id`                  BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id`     BIGINT(20) UNSIGNED NOT NULL,
  `location_id`         BIGINT(20) UNSIGNED NOT NULL,
  `details`             MEDIUMTEXT NOT NULL,
  `effective_date`      DATE NOT NULL,
  `created_at`          TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at`          TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP(),
   PRIMARY KEY (id)
) ENGINE=INNODB;

ALTER TABLE `professional_tax`
  ADD CONSTRAINT `fk_pt_organization_id` FOREIGN KEY (`organization_id`) REFERENCES organizations(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pt_employee_id` FOREIGN KEY (`location_id`) REFERENCES organization_locations(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- employee details
CREATE TABLE `employee_details` ( 
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id` BIGINT UNSIGNED DEFAULT NULL,
  `experience` MEDIUMTEXT DEFAULT NULL, 
  `family` MEDIUMTEXT DEFAULT NULL, 
  `qualification` MEDIUMTEXT DEFAULT NULL, 
  `created_at` timestamp not NULL DEFAULT current_timestamp,
  `updated_at` timestamp not NULL DEFAULT current_timestamp on update current_timestamp
);
ALTER TABLE employee_details ADD FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Alter employee_leaves
ALTER TABLE `employee_leaves`
 ADD `day_status` MEDIUMTEXT NULL DEFAULT NULL AFTER `reason`;


---- New Table for HRMS Organization Bank Details
CREATE TABLE `organization_hrms_banks` (
	`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`organization_id` BIGINT(20) UNSIGNED NOT NULL,
	`bank_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`account_number` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`ifsc` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`account_type` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`branch_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`details` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`created_at` TIMESTAMP NULL DEFAULT current_timestamp(),
	`updated_at` TIMESTAMP NULL DEFAULT current_timestamp() on update current_timestamp(),
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `organization_id` (`organization_id`) USING BTREE
)
COLLATE='utf8mb3_general_ci'
ENGINE=InnoDB
;


------Table organization_hrms_settings
ALTER TABLE `organization_hrms_settings`
	ADD COLUMN `basic_details` LONGTEXT NULL DEFAULT NULL AFTER `organization_id`,
	ADD COLUMN `compliance_details` LONGTEXT NULL DEFAULT NULL AFTER `basic_details`;



------Table employee_details
ALTER TABLE `employee_details`
	ADD COLUMN `organization_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL AFTER `employee_id`,
	ADD COLUMN `leaves` MEDIUMTEXT NULL DEFAULT NULL AFTER `organization_id`,
	ADD CONSTRAINT `employee_details_organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE RESTRICT ON DELETE CASCADE;


-------Table hrms_employee_attendance
ALTER TABLE `hrms_employee_attendance`
	CHANGE COLUMN `details` `details` MEDIUMTEXT NULL COLLATE 'utf8mb4_general_ci' AFTER `end_time`;



-------Table organization_leave_types
ALTER TABLE `organization_leave_types`
	ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() AFTER `organization_id`,
	ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`;
  

--------Table employee_leaves
ALTER TABLE `employee_leaves`
	CHANGE COLUMN `number_of_days` `number_of_days` DECIMAL(65,1) NOT NULL DEFAULT 0 AFTER `end_date`;