CREATE TABLE organization_payroll_overview (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id`     bigint(20) UNSIGNED NOT NULL,
  `month`               enum("1","2","3","4","5","6","7","8","9","10","11","12") NOT NULL,
  `year`                smallint(4) UNSIGNED NOT NULL,
  `total_employees`     int(10)    UNSIGNED  NOT NULL,
  `processed_employees` int(10)    UNSIGNED  NOT NULL,
  `gross`               bigint(20) UNSIGNED  NOT NULL,
  `ctc`                 bigint(20) UNSIGNED  NOT NULL,
  `netpay`              bigint(20) UNSIGNED NOT NULL,
  `employee_pf`         bigint(20) UNSIGNED NOT NULL,
  `employer_pf`         bigint(20) UNSIGNED NOT NULL,
  `employee_esi`        bigint(20) UNSIGNED NOT NULL,
  `employer_esi`        bigint(20) UNSIGNED NOT NULL,
  `pt`                  bigint(20) UNSIGNED NOT NULL,
  `tax`                 bigint(20) UNSIGNED NOT NULL,
  `created_at`          timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at`          timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB;

ALTER TABLE organization_payroll_overview 
ADD KEY organisation_id (organization_id) USING BTREE,
ADD UNIQUE KEY organization_payroll_month_year (organization_id,month,year) USING BTREE,
ADD FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE;