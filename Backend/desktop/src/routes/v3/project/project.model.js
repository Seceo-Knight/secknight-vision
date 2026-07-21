
'use strict';

const mySql = require('../../../database/MySqlConnection').getInstance();

const mongoose = require('mongoose');
const { ProjectSchemaModel, FolderSchemaModel, TaskSchemaModel } = require('../../../models/silah_db.schema');

const EmployeeProductivityModel = require('../../../models/employee_productivity.schema');

class ProjectModel {
    projects(employee_id, organization_id) {
        // SELECT p.id ,p.name ,COUNT(pt.id) As task_count ,sec_to_time(SUM(TIME_TO_SEC(ett.duration))) AS project_duration,
        // p.start_date, p.end_date, p.description, p.status, pt.employee_id
        // FROM projects p 
        // INNER JOIN project_tasks  pt ON pt.project_id=p.id 
        // LEFT  JOIN employee_tasks_timesheet ett ON ett.task_id=pt.id 
        // WHERE pt.employee_id=? AND p.organization_id=?
        // GROUP BY p.id
        const query = `SELECT p.id ,p.name ,
        p.start_date, p.end_date, p.description, p.status, pe.employee_id
        FROM project_employees pe 
        INNER JOIN projects p ON p.id=pe.project_id
        WHERE pe.employee_id=? AND p.organization_id=?
        GROUP BY p.id`;
        const paramsArray = [employee_id, organization_id];

        return mySql.query(query, paramsArray);
    };

    projectsWithModules(employee_id, organization_id) {
        const query = `SELECT p.id ,p.name ,p.start_date, p.end_date, p.description, p.status, pe.employee_id, 
                        pm.name AS project_module_name, pm.start_date AS module_start_date, 
                        pm.end_date AS module_end_date, pm.id AS project_module_id,pm.status AS module_status
                       FROM project_employees pe
                       INNER JOIN projects p ON p.id=pe.project_id
                       LEFT JOIN project_modules pm ON p.id=pm.project_id
                       WHERE pe.employee_id=? AND p.organization_id=? AND p.status != ?`;
        const paramsArray = [employee_id, organization_id, 3];

        return mySql.query(query, paramsArray);
    };


    tasks(project_id, employee_id) {
        const query = `SELECT  pt.id, pt.name, pt.start_date, pt.end_date, pt.priority, pt.status,pt.status_updateAt ,pt.created_at,
         pt.created_by,CONCAT(u.first_name ,' ',u.last_name) assigned_by
         FROM project_tasks pt 
         LEFT JOIN users u ON u.id=pt.created_by
         WHERE pt.project_id = ?  AND pt.employee_id = ?`;
        const paramsArray = [project_id, employee_id];

        return mySql.query(query, paramsArray);
    }


    insertTaskStat(attendance_id, start_time, end_time, duration, task_id, reason, type) {
        end_time = end_time ? end_time : null;
        reason = reason ? reason : null;

        const query = ` INSERT INTO employee_tasks_timesheet (attendance_id, start_time, end_time, duration, task_id, reason,type)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const paramsArray = [attendance_id, start_time, end_time, duration, task_id, reason, type];

        return mySql.query(query, paramsArray);
    }

    getTaskStat(attendance_id, task_id, start_time) {
        const query = `SELECT id,end_time,duration,reason FROM employee_tasks_timesheet
        WHERE attendance_id = ? AND start_time = ? AND task_id = ?`;
        const paramsArray = [attendance_id, start_time, task_id];

        return mySql.query(query, paramsArray);
    }

    updateTaskStat(task_id, reason, end_time, duration, type) {
        end_time = end_time ? end_time : null;
        reason = reason ? reason : null;

        const query = `UPDATE employee_tasks_timesheet 
        SET reason = ?, end_time = ?, duration = ?, type = ? WHERE id = ?`;
        const paramsArray = [reason, end_time, duration, type, task_id];

        return mySql.query(query, paramsArray);
    }

    updateProjectTask(status, task_id, status_updateAt, user_id) {
        const query = `UPDATE project_tasks SET status = ?,status_updateAt=?,updated_by=? WHERE  id = ?`;
        const paramsArray = [status, status_updateAt, user_id, task_id];

        return mySql.query(query, paramsArray);
    }

    getProjectTaskBy(task_id, user_id) {
        const query = `SELECT status, Progress FROM project_tasks  WHERE  id = ? AND employee_id=?`;
        const paramsArray = [task_id, user_id];

        return mySql.query(query, paramsArray);
    }

    getTaskStats(today_date, employee_id) {
        const start_time = `${today_date} 00:00:00`;
        const end_time = `${today_date} 23:59:59`;

        const query = `
        SELECT t.id, t.attendance_id, t.task_id, pt.name, t.start_time, t.end_time, t.duration, t.created_at 
        FROM  employee_tasks_timesheet t 
        INNER JOIN project_tasks pt ON pt.id = t.task_id 
        WHERE t.start_time >= ? AND t.end_time <= ? 
        AND pt.employee_id = ?`;
        const paramsArray = [start_time, end_time, employee_id];

        return mySql.query(query, paramsArray);
    }

    getAttendanceId(employee_id, today_date) {
        const query = `SELECT id FROM employee_attendance WHERE date = ? AND employee_id = ?`;
        const paramsArray = [today_date, employee_id];

        return mySql.query(query, paramsArray);
    }

    addEmployeeTimeTrack(attndance_id, start_time, end_time, duration) {
        const query = `
        INSERT INTO employee_timesheet (attendance_id, start_time, end_time, duration,type)
        VALUES (?, ?, ?, ?, 1)`;
        const paramsArray = [attndance_id, start_time, end_time, duration];

        return mySql.query(query, paramsArray);
    }

    getEmployeeTimesheet(employee_id, from_date, to_date) {
        const query = `
        SELECT  et.id, et.attendance_id, et.start_time, et.end_time, et.duration, et.created_at
        FROM employee_timesheet et 
        INNER JOIN employee_attendance ea ON ea.id = et.attendance_id
        WHERE ea.employee_id = ? AND ea.date BETWEEN ? AND ?`;
        const paramsArray = [employee_id, from_date, to_date];

        return mySql.query(query, paramsArray);
    }


    getProject(project_id, organization_id, employee_id) {
        const query = `
        SELECT p.id, p.organization_id, p.start_date, p.end_date 
        FROM  projects p 
        INNER JOIN project_employees pe 
        WHERE p.id = ? AND p.organization_id = ? AND pe.employee_id = ?`;
        const paramsArray = [project_id, organization_id, employee_id];

        return mySql.query(query, paramsArray);
    };


    createTask(name, employee_id, project_id, description, start_date, end_date, created_by, priority) {
        const query = `
        INSERT INTO project_tasks (name, description, start_date, end_date, employee_id, project_id, created_by, status, priority, progress) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0)`;
        const paramsArray = [name, description, start_date, end_date, employee_id, project_id, created_by, priority];

        return mySql.query(query, paramsArray);
    };

    getTaskByName(name, project_id, id) {
        const query = `
        SELECT id, name FROM project_tasks 
        WHERE name = ? AND project_id = ? AND employee_id = ?`;
        const paramsArray = [name, project_id, id];

        return mySql.query(query, paramsArray);
    };

    taskTimsheet(project_id, id) {
        const query = `SELECT pt.id, ett.id AS timesheet_id, ett.start_time, ett.end_time, SEC_TO_TIME(ett.duration ) AS duration,ett.created_at 
        FROM project_tasks pt
        LEFT JOIN employee_tasks_timesheet ett ON ett.task_id=pt.id 
        WHERE pt.project_id = ? AND  pt.employee_id = ? 
        ORDER BY ett.end_time  desc`;
        const paramsArray = [project_id, id];

        return mySql.query(query, paramsArray);
    };


    getTasksByUserId(employee_id) {
        const query = `
        SELECT pt.id AS task_id, pt.name AS task_name, pt.description, pt.status,pt.status_updateAt,
        pt.priority, pt.project_id ,pt.employee_id,pt.start_date,pt.end_date,pt.created_at,pt.created_by
        ,CONCAT(u.first_name ,' ',u.last_name) assigned_by, pt.project_module_id, pm.name AS project_module_name,
        pm.start_date AS module_start_date,pm.end_date AS module_end_date
        FROM project_tasks pt 
        LEFT JOIN users u ON u.id=pt.created_by
        LEFT JOIN project_modules pm ON pm.id=pt.project_module_id
        WHERE pt.employee_id = ? AND pt.status != ? `;
        const paramsArray = [employee_id, 2];

        return mySql.query(query, paramsArray);
    };

    createAttendanceEntry(date, employee_id, organization_id, startDate, endDate) {
        const query = `
            INSERT INTO employee_attendance (employee_id,organization_id,date,start_time,end_time) 
            VALUES (?,?,?,?,?);
        `;
        return mySql.query(query, [employee_id, organization_id, date, startDate, endDate]);
    }

    getProjectDuration(employee_id) {
        const query = `SELECT pt.project_id ,
        SEC_TO_TIME(SUM(ett.duration)) duration
        #ett.duration
        FROM project_tasks pt 
        LEFT JOIN employee_tasks_timesheet ett on ett.task_id=pt.id
        WHERE pt.employee_id=?
        GROUP BY pt.project_id`;
        const paramsArray = [employee_id];

        return mySql.query(query, paramsArray);
    }

    getTasksCount(employee_id) {
        const query = `SELECT COUNT(id) as tasks,project_id
        FROM project_tasks 
        WHERE employee_id=?
        GROUP BY project_id`;
        const paramsArray = [employee_id];

        return mySql.query(query, paramsArray);
    }

    getLastInsertedAttendanceLastInserted({ employee_id }) {
        const query = `SELECT * FROM employee_attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 1`;

        return mySql.query(query, [employee_id])
    }

    updateTaskStatus({ user_id, currentTaskIds }) {
        const query = `UPDATE project_tasks set status=0  
        WHERE employee_id = ?  AND id not in (?) AND status=1`;

        return mySql.query(query, [user_id, currentTaskIds])
    }

    getTaskByIds({ user_id, currentTaskIds }) {
        const query = `SELECT id,name,start_date, end_date,status
         FROM project_tasks 
         WHERE employee_id=? AND id IN (?) `

        return mySql.query(query, [user_id, currentTaskIds])
    }

    updateCurrentTaskStatus({ user_id, currentTaskIds }) {
        const query = `UPDATE project_tasks set status=1  
        WHERE employee_id = ?  AND id IN (?) AND status=4`;

        return mySql.query(query, [user_id, currentTaskIds])
    }

    /* Below all method for Silah Project Task API */

    fetchProjectMobile({ skip, limit, search, organization_id, employee_id, non_admin_id, count }) {
        let pipeline = [];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: new RegExp(search, 'i') },
                        { description: new RegExp(search, 'i') }
                    ]
                }
            });
        }

        if (employee_id && search !== "Default") {
            pipeline.push({
                $match: {
                    assigned_users: {
                        $elemMatch: { $eq: employee_id }
                    }
                }
            });
        }

        if (non_admin_id) {
            pipeline.push({
                $match: {
                    assigned_non_admin_users: {
                        $elemMatch: { $eq: non_admin_id }
                    }
                }
            });
        }

        if (organization_id) {
            pipeline.push({
                $match: {
                    organization_id: organization_id,
                    is_deleted: false
                }
            });
        }

        if (count) {
            pipeline.push({
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            });
            return ProjectSchemaModel.aggregate(pipeline);
        }

        pipeline.push({
            $project: {
                _id: 1,
                organization_id: 1,
                title: 1,
                description: 1
            }
        });

        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }
        return ProjectSchemaModel.aggregate(pipeline);
    }

    fetchProject({ skip, limit, search, organization_id, employee_id, non_admin_id, sort, count }) {
        let pipeline = [];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: new RegExp(search, 'i') },
                        { description: new RegExp(search, 'i') }
                    ]
                }
            });
        }

        if (employee_id) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            assigned_users: {
                                $elemMatch: { $eq: employee_id },
                            },
                        },
                        {
                            title: "Default"
                        }
                    ],
                },
            });
        }

        if (non_admin_id) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            assigned_non_admin_users: {
                                $elemMatch: { $eq: non_admin_id },
                            },
                        },
                        {
                            title: "Default"
                        }
                    ],
                },
            });
        }

        if (organization_id) {
            pipeline.push({
                $match: {
                    organization_id: organization_id,
                    is_deleted: false
                }
            });
        }

        if (count) {
            pipeline.push({
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            });
            return ProjectSchemaModel.aggregate(pipeline);
        }

        if (sort) {
            pipeline.push({
                $sort: {
                    title: sort == "ASC" ? 1 : -1
                }
            });
        }

        pipeline.push({
            $project: {
                _id: 1,
                organization_id: 1,
                title: 1,
                description: 1
            }
        });

        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }
        return ProjectSchemaModel.aggregate(pipeline);
    }

    createProject({ organization_id, title, description, created_by, assigned_non_admin_users = null, assigned_users = null, start_date, end_date }) {
        if (start_date) start_date = moment(start_date).format('YYYY-MM-DD');
        if (end_date) end_date = moment(end_date).format('YYYY-MM-DD');
        return new ProjectSchemaModel({
            organization_id,
            title,
            description,
            created_by,
            assigned_non_admin_users,
            assigned_users,
            start_date,
            end_date
        }).save();
    }


    createProjectFolder({ organization_id, title, project_id, created_by }) {
        return new FolderSchemaModel({
            organization_id,
            name: title,
            project_id: new mongoose.Types.ObjectId(project_id),
            created_by,
        }).save();
    }

    fetchProjectFolder({ skip, limit, search, organization_id, project_id }) {
        let pipeline = [];

        if (search) {
            pipeline.push({
                $match: {
                    name: new RegExp(search, 'i')
                }
            });
        }

        if (organization_id) {
            pipeline.push({
                $match: {
                    organization_id: organization_id,
                    is_deleted: false,
                    project_id: new mongoose.Types.ObjectId(project_id)
                }
            });
        }

        pipeline.push({
            $project: {
                _id: 1,
                organization_id: 1,
                name: 1,
                project_id: 1
            }
        })

        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }
        return FolderSchemaModel.aggregate(pipeline);

    }

    fetchProjectTaskListMobile({ skip, limit, search, organization_id, getCount, employee_id, task_id, manager_id, project_id, folder_name, start_date, end_date, sort_by }) {
        let pipeline = [];

        if (search) {
            pipeline.push({
                $match: {
                    name: new RegExp(search, 'i')
                }
            });
        }

        if (+employee_id) {
            pipeline.push({
                $match: {
                    assigned_user: +employee_id
                }
            });
        }

        if (task_id) {
            pipeline.push({
                $match: {
                    _id: new mongoose.Types.ObjectId(task_id)
                }
            });
        }

        if (project_id) {
            pipeline.push({
                $match: {
                    project_id: new mongoose.Types.ObjectId(project_id)
                }
            });
        }

        if (+organization_id) {
            pipeline.push({
                $match: {
                    organization_id: +organization_id,
                    is_deleted: false,
                }
            });
        }

        if (start_date && end_date) {
            pipeline.push({
                $match: {
                    "task_working_status.start_time": {
                        $gte: new Date(start_date),
                        $lte: new Date(end_date)
                    },
                    "task_working_status.end_time": {
                        $gte: new Date(start_date),
                        $lte: new Date(end_date)
                    }
                }
            });
        }

        pipeline.push({
            $lookup: {
                from: "folders",
                localField: "folder_id",
                foreignField: "_id",
                as: "folder_data"
            }
        },
            {
                $unwind: "$folder_data"
            });

        if (folder_name) {
            pipeline.push({
                $match: {
                    "folder_data.name": folder_name
                }
            });
        }

        pipeline.push({
            $lookup: {
                from: "projects",
                localField: "project_id",
                foreignField: "_id",
                as: "project_data"
            }
        },
            {
                $unwind: "$project_data"
            },
        );

        if (manager_id) {
            pipeline.push({
                $match: {
                    "project_data.assigned_non_admin_users": +manager_id
                }
            });
        }

        pipeline.push({
            $sort: {
                createdAt: -1
            }
        })

        pipeline.push(
            {
                $project: {
                    name: 1,
                    status: 1,
                    assigned_user: 1,
                    task_remaining_time: 1,
                    task_finished_time: 1,
                    "folder_data._id": 1,
                    "folder_data.name": 1,
                    "project_data._id": 1,
                    "project_data.title": 1,
                    "task_working_status": 1,
                    "createdAt": 1,
                    "is_desktop_running": 1,
                    "is_mobile_running": 1
                }
            }
        )

        if (sort_by) {
            pipeline.push({
                $sort: {
                    createdAt: sort_by === "ASC" ? 1 : -1
                }
            })
        }

        if (getCount) {
            pipeline.push(
                { $group: { _id: null, count: { $sum: 1 } } },
            )
        } else {
            if (skip) {
                pipeline.push({ $skip: +skip });
            }

            if (+limit) {
                pipeline.push({ $limit: +limit });
            }
        }
        return TaskSchemaModel.aggregate(pipeline);
    }

    findProjectTaskSameName({ title, organization_id, project_id, folder_id, task_id }) {
        let query = { name: title, organization_id, project_id, is_deleted: false }
        if (folder_id) query.folder_id = new mongoose.Types.ObjectId(folder_id);
        if (task_id) query._id = { $ne: [task_id] };
        return TaskSchemaModel.findOne(query);
    }

    findProject({ _id }) {
        return ProjectSchemaModel.findOne({
            _id: _id,
            is_deleted: false,
        });
    }

    findProjectFolderName({ name, project_id }) {
        let query = {
            name: name,
            is_deleted: false,
        };
        if (project_id) query.project_id = new mongoose.Types.ObjectId(project_id);
        return FolderSchemaModel.findOne(query);
    }

    createProjectTask({ organization_id, title, project_id, folder_id, created_by: user_id, employee_id = null }) {
        let data = {
            organization_id,
            name: title,
            project_id: new mongoose.Types.ObjectId(project_id),
            folder_id: new mongoose.Types.ObjectId(folder_id),
            created_by: user_id,
        }
        if (employee_id) data.assigned_user = employee_id;
        return new TaskSchemaModel(data).save()
    }

    findTaskById({ _id }) {
        return TaskSchemaModel.findOne({
            _id: new mongoose.Types.ObjectId(_id),
            is_deleted: false
        });
    }

    findProjectFolderSameName({ title, organization_id, project_id }) {
        return FolderSchemaModel.findOne({ name: title, organization_id, project_id, is_deleted: false });
    }

    findRunningTask(employee_id) {
        return TaskSchemaModel.findOne({
            is_deleted: false,
            assigned_user: employee_id,
            status: { $in: [1] },
        });
    }

    getEmployeeAttendance(date, employee_id) {
        let query = `SELECT e.id, ea.id as attendance_id, ea.date
                    FROM employees e
                    JOIN employee_attendance ea ON ea.employee_id = e.id
                    WHERE ea.date = "${date}" AND e.id = ${employee_id}`
        return mySql.query(query);
    }

    getEmployeeAttendanceReport(date, employee_id, organization_id, flag) {
        if (flag) return EmployeeProductivityModel.find({ yyyymmdd: +date.split('-').join(''), employee_id, organization_id })
        return EmployeeProductivityModel.findOne({ yyyymmdd: +date.split('-').join(''), employee_id, organization_id });
    }

    createAttendanceRecord(employee_id, organization_id, date, startTime) {
        let query = `
            INSERT INTO employee_attendance (employee_id, organization_id, date, start_time, end_time) VALUES (?,?,?,?,?)
        `;
        return mySql.query(query, [employee_id, organization_id, date, startTime, startTime])
    }

    createEmployeeProductivityReport(department_id, location_id, employee_id, organization_id, date) {
        return new EmployeeProductivityModel({
            logged_duration: 0,
            offline_time: 0,
            employee_id: employee_id,
            department_id: department_id,
            location_id: location_id,
            organization_id: organization_id,
            productive_duration: 0,
            non_productive_duration: 0,
            neutral_duration: 0,
            idle_duration: 0,
            break_duration: 0,
            year: +date.split('-')[0],
            month: +date.split('-')[1],
            day: +date.split('-')[2],
            yyyymmdd: +date.split('-').join(''),
            date: date,
        }).save();
    }

    updateEmployeeAttendance(employee_id, organization_id, attendance_id, endTime) {
        let query = `
            UPDATE employee_attendance
            SET end_time = ?
            WHERE id = ?
        `;
        return mySql.query(query, [endTime, attendance_id]);
    }
}


module.exports = new ProjectModel;