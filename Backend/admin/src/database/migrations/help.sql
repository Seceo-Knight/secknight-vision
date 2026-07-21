CREATE TABLE `html_content` (
  `id` int(5) NOT NULL,
  `page_name` varchar(255) NOT NULL,
  `page_content` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `html_content`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `html_content`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;
COMMIT;