-- organization declaration_component
CREATE TABLE `declaration_component` (
  `id`             int(11) NOT NULL AUTO_INCREMENT,
  `section`        varchar(255) DEFAULT NULL,
  `deduction_name` varchar(255) NOT NULL,
  `amount_limit`   integer DEFAULT NULL,
  `section_limit`  smallint DEFAULT 1 COMMENT '1-whole section 2-individual section component',
  `status`         smallint DEFAULT 1 COMMENT '1-active 0-in active',
  `is_other_income` SMALLINT DEFAULT 0 NOT NULL,
  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- organization employee_declaration
CREATE TABLE `employee_declaration` (
  `id`              int unsigned NOT NULL AUTO_INCREMENT,
  `financial_year`  varchar(255) NOT NULL,
  `declared_amount` integer DEFAULT 0,
  `employee_id`     bigint(20) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `date_range`      varchar(255) DEFAULT NULL,
  `declaration_component_id` int(11) NOT NULL,
  `documents`       varchar(255) DEFAULT NULL,
  `approved_amount` integer DEFAULT 0,
  `annual_amount`   integer DEFAULT 0 COMMENT 'for HRA',
  `landlord_pan`    varchar(255) DEFAULT NULL COMMENT 'for HRA',
  `comments`        varchar(255) DEFAULT NULL,
  `status`          smallint DEFAULT 0 COMMENT '0-pending 1-approved 2-decline',
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

ALTER TABLE `employee_declaration`
ADD KEY employee_id (employee_id) USING BTREE,
ADD KEY organisation_id (organization_id) USING BTREE,
ADD KEY declaration_component_id (declaration_component_id) USING BTREE,
ADD FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY(declaration_component_id) REFERENCES declaration_component(id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE;


INSERT INTO `declaration_component` (`section`, `deduction_name`, `amount_limit`, `section_limit`,`is_other_income`)
VALUES ('80C', 'Life Insurance Premium', 150000, 1,0),
('80C', 'Investment in Fixed Deposits', 150000, 1, 0),
('80C', 'Equity Linked Savings Scheme (ELSS)', 150000, 1, 0),
('80C', 'Unit Linked Insurance Plan (ULIP)', 150000, 1, 0),
('80C', 'Employee Provident Fund (EPF)', 150000, 1, 0),
('80C', 'Public Provident Fund (PPF)', 150000, 1, 0),
('80C', 'National Savings Certificate (NSC)', 150000, 1, 0),
('80C', 'Home Loan - Principal Repayment', 150000, 1, 0),
('80C', 'Contribution to Pension Fund', 150000, 1, 0),
('80C', 'Children`s Tuition Fee', 150000, 1, 0),
('80C', 'Sukanya Samriddhi Scheme', 150000, 1, 0),
('80C', 'NABARD Bonds', 150000, 1, 0),
('80C', 'Other Deductions', 150000, 1, 0),
('80EEA', 'Additional deduction of interest payment on home loan', 150000, 1, 0),
('80CCD (1B)', 'National Pension Scheme (NPS)', 50000, 1, 0),
('80CCD (2)', 'Employer`s Contribution to NPS Account', 0, 1, 0),
('80CCG', 'Rajiv Gandhi Equity Scheme', 25000, 1, 0),
('80D', 'Medical Insurance Premium - Self/Spouse/Children', 25000, 2, 0),
('80D', 'Medical Insurance Premium - Parents', 25000, 2, 0),
('80D', 'Medical Insurance Premium - Parents - Sr. Citizen', 50000, 2, 0),
('80DD', 'Rehabilitation of Handicapped Dependent', 125000, 1, 0),
('80DDB', 'Medical Expenditure on Specified Disease', 100000, 1, 0),
('80E', 'Interest on Education Loan', 0, 1, 0),
('80G', 'Donation towards Exempted Social Causes', 0, 1, 0),
('80GG', 'Deduction in place of HRA', 60000, 1, 0),
('80GGC', 'Donation to Political Party', 0, 1, 0),
('80TTA', 'Interest Income from Savings Account', 10000, 1, 0),
('80U', 'Disability', 125000, 1, 0),
('10-13A', 'HRA', 0, 1, 0),
('10(5)', 'LTA', 30000 , 1, 0),
(null, 'House Property', null , 1, 1),
(null, 'Income From Previous Employer', null , 1, 1),
(null, 'Income From Savings Bank Interest', null , 1, 1),
(null, 'Income From Other Than Savings Bank Interest', null , 1, 1),
(null, 'Income From Pension', null , 1, 1);

-- organization tax_scheme
CREATE TABLE `tax_schemes` (
  `id`             int(11) NOT NULL AUTO_INCREMENT,
  `scheme`         varchar(255) DEFAULT NULL,
  `details`        mediumtext NOT NULL,
  `status`         smallint DEFAULT 1 COMMENT '1-active 0-in active',
  `deduction_allowed` smallint DEFAULT 1 COMMENT '1-true 0-false',
  `standard_deduction` int DEFAULT 0,
  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;


INSERT INTO `tax_schemes` (`scheme`, `details`, `status`, `employee_type`,`deduction_allowed`)
VALUES ('New Tax Scheme', '[{
        "start": 0,
        "end": 250000,
        "percentage": 0
    },
    {
        "start": 250001,
        "end": 500000,
        "percentage": 5
    },
    {
        "start": 500001,
        "end": 750000,
        "percentage": 10
    },
    {
        "start": 750001,
        "end": 1000000,
        "percentage": 15
    },
    {
        "start": 1000001,
        "end": 1250000,
        "percentage": 20
    },
    {
        "start": 1250001,
        "end": 1500000,
        "percentage": 25
    },
    {
        "start": 1500000,
        "end": 1500000,
        "percentage": 30
    }
]', 1,2,0),
('Old Tax Scheme', '[{
        "start": 0,
        "end": 250000,
        "percentage": 0
    },
    {
        "start": 250001,
        "end": 500000,
        "percentage": 5
    },
    {
        "start": 500001,
        "end": 1000000,
        "percentage": 20
    },
    {
        "start": 1500000,
        "end": 1500000,
        "percentage": 30
    }
]', 1,2,1),
('Professional Services(194J)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 10
    }
]', 1,1,0),
('Technical Services(194J)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 2
    }
]', 1,1,0),
('Interest(194A)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 10
    }
]', 1,1,0),
('Contractor - Resident Individual or HUF(194C)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 1
    }
]', 1,1,0),
('Contractor - others(194C)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 2
    }
]', 1,1,0),
('Rent of land/ building/furniture/fitting(194I)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 10
    }
]', 1,1,0),
('Rent of plant and machinery(194I)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 2
    }
]', 1,1,0),
('Commission or Brokerage(194H)', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 5
    }
]', 1,1,0),
('Reimbursement / No TDS', '[
    {
        "start": 0,
        "end": 0,
        "percentage": 0
    }
]', 1,1,0);

ALTER TABLE `employee_payroll_settings`
ADD COLUMN `admin_approved_scheme_id` int(11) DEFAULT NULL after `settings`,
ADD COLUMN `employee_approved_scheme_id` int(11) DEFAULT NULL after `admin_approved_scheme_id`,
ADD FOREIGN KEY(`admin_approved_scheme_id`) REFERENCES `tax_schemes`(id) ON DELETE SET NULL,
ADD FOREIGN KEY(`employee_approved_scheme_id`) REFERENCES `tax_schemes`(id) ON DELETE SET NULL;
