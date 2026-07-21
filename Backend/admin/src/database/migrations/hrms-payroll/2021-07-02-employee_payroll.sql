-- employee_payroll table
CREATE TABLE employee_payroll (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `organization_id`     bigint(20) UNSIGNED NOT NULL,
  `employee_id`         bigint(20) UNSIGNED NOT NULL,
  `month`               enum("1","2","3","4","5","6","7","8","9","10","11","12") NOT NULL,
  `year`                smallint(4) UNSIGNED NOT NULL,
  `total_days`          smallint(4) UNSIGNED default 0,
  `present_days`        smallint(4) UNSIGNED default 0,
  `lop`                 smallint(4) UNSIGNED default 0,
  `payout_status`       smallint(4) UNSIGNED default 1 COMMENT '1-pay, 2-paid, 3-on hold',
  `gross`               bigint(15) UNSIGNED default 0,
  `netpay`               bigint(15) UNSIGNED default 0,
  `details`             mediumtext  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin Default NULL,
  `created_at`          timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at`          timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB;

ALTER TABLE employee_payroll
ADD KEY employee_id (employee_id) USING BTREE,
ADD KEY organisation_id (organization_id) USING BTREE,
ADD UNIQUE KEY employee_payroll_employee_month_year (organization_id,employee_id,month,year) USING BTREE,
ADD FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE employee_payroll ADD working_days SMALLINT(4) NULL DEFAULT '0' AFTER total_days;