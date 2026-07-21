CREATE TABLE `project` (
	`id`           int(11) NOT NULL AUTO_INCREMENT,
	`admin_id`     bigint(20) UNSIGNED NOT NULL,
	`name`         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `status`       tinyint(3) unsigned NOT NULL DEFAULT 1,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;

CREATE TABLE `team` (
	`id`           int(11) NOT NULL AUTO_INCREMENT,
	`admin_id`     bigint(20) UNSIGNED NOT NULL,
	`name`         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `status`       tinyint(3) unsigned NOT NULL DEFAULT 1,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;

CREATE TABLE `team_to_user` (
	`id`           int(11) NOT NULL AUTO_INCREMENT,
	`admin_id`     bigint(20) UNSIGNED NOT NULL,
	`team_id`      bigint(20) UNSIGNED NOT NULL,
	`user_id`      bigint(20) UNSIGNED NOT NULL,
	`role_id`      bigint(20) UNSIGNED NOT NULL,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;

CREATE TABLE `project_to_team` (
	`id`           int(11) NOT NULL AUTO_INCREMENT,
	`admin_id`     bigint(20) UNSIGNED NOT NULL,
	`project_id`   bigint(20) UNSIGNED NOT NULL,
	`team_id`      bigint(20) UNSIGNED NOT NULL,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;

CREATE TABLE `project_to_user` (
	`id`           int(11) NOT NULL AUTO_INCREMENT,
	`admin_id`     bigint(20) UNSIGNED NOT NULL,
	`project_id`   bigint(20) UNSIGNED NOT NULL,
	`user_id`      bigint(20) UNSIGNED NOT NULL,
	`role_id`      bigint(20) UNSIGNED NOT NULL,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;

CREATE TABLE `task` (
	`id`           int(11) NOT NULL AUTO_INCREMENT,
	`admin_id`     bigint(20) UNSIGNED NOT NULL,
    `name`         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
	`project_id`   bigint(20) UNSIGNED NOT NULL,
	`assignee_id`  bigint(20) UNSIGNED NOT NULL,
	`assignor_id`  bigint(20) UNSIGNED NOT NULL,
    `status`       tinyint(3) unsigned NOT NULL DEFAULT 1,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci' ENGINE=InnoDB;