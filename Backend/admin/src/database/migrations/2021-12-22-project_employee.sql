--
-- Up `project_tasks_employee`
--
CREATE TABLE project_tasks_employee (
	project_tasks_id BIGINT NULL,
	employee_id BIGINT NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=latin1
COLLATE=latin1_swedish_ci;
INSERT into project_tasks_employee (project_tasks_id, employee_id)
select pt.id as project_tasks_id, pt.employee_id from project_tasks pt;