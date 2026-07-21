ALTER TABLE email_reports ADD COLUMN report_types VARCHAR(50) DEFAULT 'csv' after content;
