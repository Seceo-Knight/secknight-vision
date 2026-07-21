-- --------------------------------------------------------

--
-- Table structure for table `notification_rules`
--

CREATE TABLE `notification_rules` (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id`     bigint(20) UNSIGNED NOT NULL,
  `type`                enum('DWT', 'SSE', 'SEE', 'ABT', 'WDO', 'IDL', 'ASA', 'STA') NOT NULL,
  `risk_level`          enum('NR', 'LR', 'MR', 'HR', 'CR') DEFAULT 'NR',
  `is_accumulate_risk`  BOOLEAN DEFAULT false,
  `created_at`          timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at`          timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Indexes for table `notification_rules`
--
ALTER TABLE `notification_rules`
  ADD CONSTRAINT fk_notification_rules_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `notification_rule_conditions`
--

CREATE TABLE `notification_rule_conditions` (
  `id`                      bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `notification_rule_id`    bigint(20) UNSIGNED NOT NULL,
  `type`                    enum('MNT', 'HUR', 'ABT', 'DMN', 'APP') DEFAULT NULL,
  `cmp_operator`            enum('>', '>=', '<', '<=', '=') DEFAULT NULL,
  `cmp_argument`            varchar(24) DEFAULT NULL,
  `created_at`              timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at`              timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Indexes for table `notification_rule_conditions`
--
ALTER TABLE `notification_rule_conditions`
  ADD CONSTRAINT fk_notification_rule_conditions_notification_rule_id FOREIGN KEY (notification_rule_id) REFERENCES notification_rules(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------

--
-- Table structure for table `notification_rule_conditions`
--

CREATE TABLE `notification_rule_recipients` (
  `id`                      bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `notification_rule_id`    bigint(20) UNSIGNED NOT NULL,
  `user_id`                 bigint(20) UNSIGNED DEFAULT NULL,
  `created_at`              timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at`              timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB;
--
-- Indexes for table `notification_rule_recipients`
--
ALTER TABLE `notification_rule_recipients`
  ADD CONSTRAINT fk_notification_rule_recipient_notification_rule_id FOREIGN KEY (notification_rule_id) REFERENCES notification_rules(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_notification_rule_recipient_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------

--
-- Table structure for table `notification_rule_alerts`
--

CREATE TABLE `notification_rule_alerts` (
  `id`                      bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `notification_rule_id`    bigint(20) UNSIGNED NOT NULL,
  `employee_attendance_id`  bigint(20) UNSIGNED NOT NULL,
  `employee_id`             bigint(20) UNSIGNED DEFAULT NULL,
  `created_at`              timestamp NOT NULL DEFAULT current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB;
--
-- Indexes for table `notification_rule_alerts`
--
ALTER TABLE `notification_rule_alerts`
  ADD CONSTRAINT fk_notification_rule_alerts_notification_rule_id FOREIGN KEY (notification_rule_id) REFERENCES notification_rules(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_notification_rule_alerts_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_notification_rule_alerts_employee_attendance_id FOREIGN KEY (employee_attendance_id) REFERENCES employee_attendance(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------
