CREATE TABLE `feedback` (
    `id`               bigint(20) NOT NULL AUTO_INCREMENT,
    `question_id`      tinyint(4) UNSIGNED NOT NULL,
    `organization_id`  bigint(20) UNSIGNED NOT NULL,
    `answer`           tinyint(4)                  NOT NULL,
    `comment`          TEXT DEFAULT NULL,
    `rated_at`         timestamp NOT NULL ,
     `status`          tinyint(2) NOT NULL DEFAULT 0 COMMENT '1-skip 0-added',
    `created_at`       timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at`       timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY ( id )
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



ALTER TABLE `feedback` 
ADD FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE