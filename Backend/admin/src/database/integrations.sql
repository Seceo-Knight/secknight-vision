
CREATE TABLE `integration` (
  `id`          bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status`      tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `created_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `integration_creds` (
  `id`                   bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `integration_id`       bigint(20) UNSIGNED DEFAULT NULL,
  `admin_id`             bigint(20) UNSIGNED NOT NULL,
  `manager_id`           bigint(20) UNSIGNED DEFAULT NULL,
  `name`                 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token`         varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token`        varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token_secret`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_id`            varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status`               tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `created_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `integration_organization` (
  `id`                   bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`                 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `integration_id`       bigint(20) UNSIGNED NOT NULL,
  `integration_creds_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ext_org_id`           varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_id`             bigint(20) UNSIGNED NOT NULL,
  `manager_id`           bigint(20) UNSIGNED DEFAULT NULL,
  `status`               smallint(6) NOT NULL DEFAULT 1 COMMENT '1-Active 0-InActive',
  `type`                 tinyint(2)  DEFAULT NULL COMMENT '1-Own 2-Trello 3-Assan 4-jira 5-Zoho',
  `created_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Trello => Board
CREATE TABLE `project` (
  `id`                      bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`                    varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`             text CHARACTER SET 'utf8' DEFAULT NULL,
  `admin_id`                bigint(20) UNSIGNED NOT NULL,
  `manager_id`              bigint(20) UNSIGNED DEFAULT NULL,
  `ext_project_id`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integration_org_id`      bigint(20) UNSIGNED DEFAULT NULL,
  `start_date`              timestamp DEFAULT '0000:00:00 00:00:00',
  `end_date`                timestamp DEFAULT '0000:00:00 00:00:00',
  `actual_start_date`       timestamp DEFAULT '0000:00:00 00:00:00',
  `actual_end_date`         timestamp DEFAULT '0000:00:00 00:00:00',
  `status`                  smallint(6) NOT NULL COMMENT '1-In Progress 2-Hold 3-Completed',
  `progress`                smallint(6) DEFAULT NULL,
  `created_at`              timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `project_list` (
  `id`              bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ext_list_id`     varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name`            varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id`      bigint(20) UNSIGNED NOT NULL,
  `board_id`        varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closed`          boolean,
  `type`            tinyint(2) COMMENT '1-Trello 2-Zoho',
  `status`          smallint(6) NOT NULL DEFAULT 1 COMMENT '1-In Progress 2-Hold 3-Completed',
  `start_date`      timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `end_date`        timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `user_id`         bigint(20) UNSIGNED DEFAULT NULL COMMENT 'From Users List',
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Trello => Card
CREATE TABLE `project_todo` (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ext_id`              varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name`                varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`         longtext DEFAULT NULL,
  `project_id`          bigint(20) UNSIGNED DEFAULT NULL,
  `project_list_id`     bigint(20) UNSIGNED DEFAULT NULL,
  `list_id`             varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Trello',
  `check_list_ids`      longtext DEFAULT NULL COMMENT 'Trello',
  `check_items`         int DEFAULT 0 COMMENT 'Trello',
  `check_items_checked` int DEFAULT 0 COMMENT 'Trello',
  `due_date`            timestamp DEFAULT '0000:00:00 00:00:00' COMMENT 'Trello',
  `due_complete`        boolean COMMENT 'Trello',
  `start_date`          timestamp DEFAULT '0000:00:00 00:00:00',
  `end_date`            timestamp DEFAULT '0000:00:00 00:00:00',
  `status`              smallint(6) NOT NULL COMMENT '1-In Progress 2-Hold 3-Completed 4-Open 5-In Review 6-To be Tested 7-Delayed 8-Cancelled',
  `progress`            smallint(6) DEFAULT NULL,
  `user_id`             bigint(20) UNSIGNED DEFAULT NULL COMMENT 'From Users List',
  `type`                tinyint(2)  DEFAULT NULL COMMENT '1-Own 2-Trello 3-Assan 4-jira 5-Zoho',
  `created_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Trello => Checklist
CREATE TABLE `check_list` (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ext_id`              varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Trello checkList id',
  `name`                varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `todo_id`             bigint(20) UNSIGNED DEFAULT NULL,
  `board_id`            varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Trello board id',
  `card_id`             varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Trello card id',
  `check_items`         smallint(6) NOT NULL DEFAULT 0 COMMENT 'Trello number of items in checklist',
  `status`              tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Active/InActive',
  `created_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Trello => Checklist Items
CREATE TABLE `check_items` (
  `id`                  bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ext_id`              varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For Trello id',
  `name`                varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state`               ENUM ('complete', 'incomplete') NOT NULL,
  `check_list_id`       bigint(20) UNSIGNED DEFAULT NULL,
  `ext_checklist_id`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Trello checklist id',
  `status`              tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Active/InActive',
  `created_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Zoho
CREATE TABLE `issue` (
  `id`              bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`     text CHARACTER SET 'utf8' DEFAULT NULL,
  `project_id`      bigint(20) UNSIGNED DEFAULT NULL,
  `ext_project_id`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ext_issue_id`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_by_id`  bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_to_id`  bigint(20) UNSIGNED DEFAULT NULL,
  `status`          tinyint(1) NOT NULL COMMENT '1-In Progress 2-To Be Tested 3-Closed 4-Open 5-Reopen',
  `type`            tinyint(2) DEFAULT 1 COMMENT '1-Own 2-Trollo 3-Asana 4-Jira 5-Zoho',
  `severity`        tinyint(1) DEFAULT 1 COMMENT '1-None 2-Critical 3-Major 4-Minior',
  `due_date`        timestamp DEFAULT '0000:00:00 00:00:00',
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `portal_users` (
  `id`                   bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`             bigint(20) UNSIGNED NOT NULL,
  `user_id`              bigint(20) UNSIGNED NOT NULL,
  `ext_org_id`           varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ext_user_id`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `timesheet` (
  `id`                   bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`           bigint(20) UNSIGNED  NOT NULL ,
  `project_list_id`      bigint(20) UNSIGNED  DEFAULT NULL,
  `todo_id`              bigint(20) UNSIGNED NOT NULL ,
  `user_id`              bigint(20) UNSIGNED NOT NULL ,
  `start_time`           timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `end_time`             timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `note`                 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason`               varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  
CREATE TABLE `teams` (
	`id`    			bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` 				varchar(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`description` 	    varchar(255) DEFAULT NULL COMMENT 'Ex: For Managing Front/Back END' COLLATE 'utf8mb4_unicode_ci',
	`admin_id` 			bigint(20) UNSIGNED NOT NULL,
	`manager_id` 		bigint(20) UNSIGNED  DEFAULT NULL,
	`status` 			tinyint(1) NOT NULL COMMENT '1-Active 2-Free',
    `organization_id`   bigint(20) UNSIGNED DEFAULT NULL,
    `created_at`        timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `users_to_teams` (
	`id` 				      BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`team_id` 			  BIGINT(20) UNSIGNED NOT NULL COMMENT 'From Teams List',
	`user_id` 			  BIGINT(20) UNSIGNED NOT NULL COMMENT 'From Users List',
	`role` 				    TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1- user 2- team lead',
	`admin_id` 			  BIGINT(20) UNSIGNED NOT NULL,
	`manager_id`	    BIGINT(20) UNSIGNED NULL DEFAULT NULL,
	`status`          TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1-Invited 2-Accepted or 3-Declined',
	`reason` 			    VARCHAR(255) DEFAULT NULL COMMENT 'Decline Reason.' COLLATE 'utf8mb4_unicode_ci',
	`created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE `team_to_project` (
	`id` 			        BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`team_id` 		    BIGINT(20) UNSIGNED NOT NULL COMMENT 'From Teams List',
	`project_id` 	    BIGINT(20) UNSIGNED NOT NULL COMMENT 'From Projects List',
	`admin_id` 		    BIGINT(20) UNSIGNED NOT NULL,
	`manager_id` 	    BIGINT(20) UNSIGNED DEFAULT NULL,
	`created_at` 	    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` 	    TIMESTAMP  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
)COLLATE='latin1_swedish_ci' ENGINE=InnoDB AUTO_INCREMENT=6;

CREATE TABLE `project_to_users` (
  `id`                   bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`             bigint(20) UNSIGNED NOT NULL,
  `user_id`              bigint(20) UNSIGNED NOT NULL,
  `project_id`           bigint(20) UNSIGNED NOT NULL,
  `ext_project_id`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ext_user_id`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id`              int(11) NOT NULL,
  `created_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `project_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` date NOT NULL, 
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `total_time` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `project_todo_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` date NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `project_todo_id` bigint(20) UNSIGNED NOT NULL,
  `total_time` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `project_todo_to_users` (
  `id`                   bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`              bigint(20) UNSIGNED NOT NULL,
  `project_todo_id`      bigint(20) UNSIGNED NOT NULL,
  `ext_project_todo_id`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ext_user_id`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  
  ALTER TABLE `timesheet`
  ADD FOREIGN KEY (project_id) REFERENCES       project(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (project_list_id) REFERENCES       project_list(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (todo_id) REFERENCES        project_todo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (user_id) REFERENCES        users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `integration_creds`
    ADD FOREIGN KEY (admin_id) REFERENCES         `admin`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (manager_id) REFERENCES       `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (integration_id) REFERENCES   `integration`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `integration_organization`
    ADD CONSTRAINT `UC_integration_organization` UNIQUE     (admin_id, integration_id, ext_org_id),
    ADD FOREIGN KEY (admin_id) REFERENCES                   `admin`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (manager_id) REFERENCES                 `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (integration_id) REFERENCES             `integration`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (integration_creds_id) REFERENCES       `integration_creds`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project`
    ADD CONSTRAINT `UC_project` UNIQUE                (admin_id, ext_project_id, integration_org_id),
    ADD FOREIGN KEY (admin_id) REFERENCES             `admin`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (manager_id) REFERENCES           `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (integration_org_id) REFERENCES   `integration_organization`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_list`
    ADD CONSTRAINT `UC_project_list` UNIQUE   (ext_list_id, project_id, board_id),
    ADD FOREIGN KEY (user_id) REFERENCES  users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (project_id) REFERENCES   `project`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_todo`
    ADD CONSTRAINT `UC_project_todo` UNIQUE       (ext_id, project_id, project_list_id, list_id),
    ADD CONSTRAINT `UC_project_task` UNIQUE       (ext_id, project_id, project_list_id),
    ADD FOREIGN KEY (project_id) REFERENCES       `project`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (project_list_id) REFERENCES  `project_list`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `check_list`
    ADD CONSTRAINT `UC_check_list` UNIQUE     (ext_id, todo_id),
    ADD FOREIGN KEY (todo_id) REFERENCES      `project_todo`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `check_items`
    ADD CONSTRAINT `UC_check_items` UNIQUE        (ext_id, check_list_id, ext_checklist_id),
    ADD FOREIGN KEY (check_list_id) REFERENCES    `check_list`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `issue`
    ADD CONSTRAINT `UC_issue` UNIQUE              (project_id, ext_project_id, ext_issue_id),
    ADD FOREIGN KEY (assigned_by_id) REFERENCES   `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (assigned_to_id) REFERENCES   `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (project_id) REFERENCES       `project`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `users`
    ADD `ext_user_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    ADD `user_type` tinyint(2) DEFAULT 1 COMMENT '1-Own 2-Trello 3-Assan 4-jira 5-Zoho';

ALTER TABLE `portal_users`
    ADD FOREIGN KEY (admin_id) REFERENCES          `admin`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (user_id) REFERENCES           `users`(id) ON DELETE CASCADE ON UPDATE CASCADE;

 ALTER TABLE `timesheet`
    ADD FOREIGN KEY (project_id) REFERENCES         project(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (project_list_id) REFERENCES    project_list(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (todo_id) REFERENCES            project_todo(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD FOREIGN KEY (user_id) REFERENCES            users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `teams`
  ADD FOREIGN KEY (admin_id) 	  REFERENCES       `admin`(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (organization_id) REFERENCES `integration_organization` (id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (manager_id)  REFERENCES       `users`(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `users_to_teams`
  ADD FOREIGN KEY (`admin_id`)   REFERENCES       `admin` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`manager_id`) REFERENCES       `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`user_id`)    REFERENCES       `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD FOREIGN KEY (`team_id`)    REFERENCES       `teams` (`id`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `team_to_project`
  ADD FOREIGN KEY (`admin_id`)   		REFERENCES       `admin`   (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`manager_id`) 		REFERENCES       `users`   (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`project_id`) 	  REFERENCES     	 `project` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD FOREIGN KEY (`team_id`)  		  REFERENCES       `teams`   (`id`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `project_to_users`
  ADD FOREIGN KEY (`project_id`)    REFERENCES         `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`admin_id`)      REFERENCES         `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
   ADD FOREIGN KEY (`role_id`)      REFERENCES         `role`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD FOREIGN KEY (`user_id`)       REFERENCES         `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_stats`
  ADD CONSTRAINT `UC_project_stats` UNIQUE        (project_id, user_id, day),
  ADD FOREIGN KEY (`project_id`) REFERENCES        `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`user_id`)    REFERENCES        `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_todo_stats`
  ADD CONSTRAINT `UC_project_todo_stats` UNIQUE        (project_todo_id, user_id, day),
  ADD FOREIGN KEY (`project_todo_id`)    REFERENCES    `project_todo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`user_id`)            REFERENCES    `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_todo_to_users`
  ADD CONSTRAINT `UC_project_todo_to_users` UNIQUE        (project_todo_id, user_id),
  ADD FOREIGN KEY (`project_todo_id`)       REFERENCES    `project_todo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD FOREIGN KEY (`user_id`)               REFERENCES    `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
