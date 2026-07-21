ALTER TABLE `notification_rules` 
CHANGE `type` `type` ENUM('DWT','SSE','SSL','SEE','ABT','WDO','IDL','ASA','STA') NOT NULL;