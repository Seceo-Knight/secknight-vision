ALTER TABLE tax_schemes
ADD `employee_type`  smallint DEFAULT 2 COMMENT '1-contract 2-permanent' AFTER `standard_deduction`;


INSERT INTO `tax_schemes` (`scheme`, `details`, `status`, `employee_type`,`deduction_allowed`)
VALUES ('Professional Services(194J)', '[
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

ALTER TABLE `organization_payroll_settings`
    ADD `contract_scheme_id`  int(11) DEFAULT NULL AFTER `declaration_settings`,
    ADD CONSTRAINT `fk_tax_schemes_id` FOREIGN KEY (`contract_scheme_id`) REFERENCES `tax_schemes` (`id`) ON DELETE SET NULL;