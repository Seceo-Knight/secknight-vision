-- organization payroll settings
CREATE TABLE `organization_payroll_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint UNSIGNED DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
ALTER TABLE organization_payroll_settings ADD FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- organization_payroll_policies
 CREATE TABLE `organization_payroll_policies` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id` bigint UNSIGNED DEFAULT NULL,
  `policy_name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
ALTER TABLE organization_payroll_policies ADD FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- organization_payroll_salary_components
CREATE TABLE `organization_payroll_salary_components` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id` bigint UNSIGNED DEFAULT NULL,
  `component_name` varchar(200) NOT NULL,
  `component_type` smallint DEFAULT '1' COMMENT '1-BENIFIT 2-DEDUCTION',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
ALTER TABLE organization_payroll_salary_components ADD FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- organization_payroll_policy_rules
CREATE TABLE `organization_payroll_policy_rules` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `policy_id` bigint UNSIGNED DEFAULT NULL,
  `salary_component_id` bigint UNSIGNED DEFAULT NULL,
  `rule` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
ALTER TABLE organization_payroll_policy_rules ADD FOREIGN KEY(salary_component_id) REFERENCES organization_payroll_salary_components(id) ON DELETE CASCADE;
ALTER TABLE organization_payroll_policy_rules ADD FOREIGN KEY(policy_id) REFERENCES organization_payroll_policies(id) ON DELETE CASCADE;

-- adding payroll policy in emp_payroll_settings
ALTER TABLE employee_payroll_settings ADD COLUMN payroll_policy_id bigint(20) UNSIGNED after employee_id;
ALTER TABLE employee_payroll_settings
ADD FOREIGN KEY(payroll_policy_id) REFERENCES organization_payroll_policies(id);