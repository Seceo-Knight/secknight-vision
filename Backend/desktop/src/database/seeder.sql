--
-- Insert application_info
--
INSERT INTO
    application_info (id, app_type, version, file_url)
VALUES
    (1, 'Stealth', '1.2.4.32', 'http://api.empmonitor.com/Release/EmpMonitorStealthRelease.zip'),
    (2, 'NonStealth', '1.1.0.20', 'http://api.empmonitor.com/Release/EmpMonitorRelease.zip'),
    (3, 'AutoUpdater', '1.2.0.0', 'http://api.empmonitor.com/Release/AutoUpdater.exe'),
    (4, 'Test', '1.2.4.32', 'https://desktop.empmonitor.com/Release/Test.zip'),
    (5, 'StealthNew', '1.2.4.32', 'https://desktop.empmonitor.com/Release/EmpMonitorStealthNewRelease.zip');


--
-- Insert days
--
INSERT INTO
    days (id, name)
VALUES
    ('1', 'Monday'),
    ('2', 'Tuesday'),
    ('3', 'Wednesday'),
    ('4', 'Thursday'),
    ('5', 'Friday'),
    ('6', 'Saturday'),
    ('7', 'Sunday');


--
-- Insert Role
--
INSERT INTO
    role (id, name, params)
VALUES
    ('1', 'Employee','E'),
    ('2', 'Manager','M'),
    ('3', 'Team Lead','TL');


--
-- Insert Storage Type
--
INSERT INTO
    storage_type (id, name,short_code, username, password, status, desktop_access_token, web_access_token, token, api_key, application_id, refresh_token, admin_email, client_id, client_secret,bucket_name,region)
VALUES
    ('1', 'GoogleDrive','GD',0,0,1,0,0,1,0,0,1,1,1,1,0,0),
    ('2', 'DropBox','DB',0,0,1,0,0,1,0,0,0,1,0,0,0,0),
    ('3', 'Amazon S3','S3',0,0,0,0,0,0,0,0,0,1,1,1,1,1);