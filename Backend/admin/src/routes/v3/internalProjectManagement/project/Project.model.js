"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../../../database/MySqlConnection').getInstance();
const Logger = require('../../../../logger/Logger').logger;
// const { Mongoose } = require('mongoose');
const EmpProductivityModel = require('../../../../models/employee_productivity.schema');
const WebAppsModel = require('../../../../models/organization_apps_web.schema');

const mongoose = require('mongoose');
const { array } = require('@hapi/joi');


class ProjectModel {

    async addProject(name, organization_id, start_date, end_date, description, manager_id, created_by) {
        try {
            let query = `INSERT INTO projects (name,description,organization_id,start_date,end_date,actual_start_date,
                          actual_end_date,manager_id,created_by,status ,progress,updated_by)VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
            return await mySql.query(query, [name, description, organization_id, start_date, end_date, start_date, end_date, manager_id, created_by, 0, 0, created_by])
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async addUserToProject(project_users_list) {
        try {
            return await mySql.query(`
            INSERT INTO project_employees (employee_id,project_id,created_by)
            VALUES ?`, [project_users_list]);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getProjects(project_id, is_project, organization_id, status) {
        try {
            return await mySql.query(`
            SELECT id , name,organization_id, start_date , end_date,description ,created_by ,status ,progress
            FROM projects 
            WHERE (if(${is_project},(id=${project_id}),(id IN (SELECT id FROM projects WHERE organization_id=${organization_id}))))
            AND  status in (${status})
            AND organization_id=${organization_id}        
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getSingleProject(project_id, organization_id) {
        try {
            return await mySql.query(`
            SELECT id , name,organization_id, start_date , end_date,description ,created_by ,status,progress
            FROM projects 
            WHERE id= ${project_id} AND organization_id=${organization_id}
            `)
        } catch (err) {
            console.log(err)
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async getProjectEmployess(project_id, organization_id) {
        try {
            return await mySql.query(`
            SELECT pe.id ,pe.project_id,p.name AS project_name ,pe.employee_id ,concat(u.first_name ," ",u.last_name) AS employee_name ,
            r.id AS role_id , r.name AS role_name
            FROM project_employees pe
            INNER JOIN projects p ON p.id = pe.project_id
            INNER JOIN users u ON u.id =pe.employee_id
            INNER JOIN user_role ur ON ur.user_id=u.id
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE p.id= ${project_id} AND p.organization_id=${organization_id}
            GROUP BY pe.employee_id
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteProject(project_ids, organization_id) {
        try {
            return await mySql.query(`
            DELETE FROM projects 
            WHERE id IN (${project_ids})  AND organization_id=${organization_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addProjectModule(name, project_id, created_by, start_date, end_date, description) {
        try {
            return await mySql.query(`
            INSERT INTO project_modules (name,description,project_id,start_date,end_date,created_by,status)
            VALUES ('${name}','${description}',${project_id},'${start_date}','${end_date}',${created_by},1) `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getProjectModule(project_id, module_id, status, organization_id, searchValue, order, column, skip, limit) {
        try {
            let query = `SELECT pm.id, pm.name,pm.project_id ,p.name AS project_name ,
                         pm.description,pm.start_date,pm.end_date,pm.status,
                         pm.updated_at,pm.created_at,COUNT(pt.id) AS taskCount,(COUNT( pm.id ) OVER()) AS total_count
                         FROM project_modules pm
                         LEFT JOIN projects p ON p.id = pm.project_id
                         LEFT JOIN project_tasks pt ON pt.project_module_id = pm.id
                         WHERE p.organization_id=${organization_id} AND p.id=${project_id}`;

            if (module_id) query += ` AND pm.id=${module_id}`;
            if (status == 0 || status) query += ` AND pm.status=${status}`;
            if (searchValue) query += ` AND (pm.name LIKE '%${searchValue}%'OR pm.created_at LIKE '%${searchValue}%' OR pm.status LIKE '%${searchValue}%' OR pm.start_date LIKE '%${searchValue}%' OR pm.end_date LIKE '%${searchValue}%')`;

            if (column) {
                query += ` GROUP BY pm.id`
                query += ` ORDER BY ${column} ${order}`
            }
            else {
                query += ` GROUP BY pm.id`
                query += ` ORDER BY pm.id ASC`
            }
            if (skip || limit) {
                query += ` LIMIT ${limit} OFFSET ${skip} `;
            }
            return await mySql.query(query);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getModuleById(module_id) {
        try {
            return await mySql.query(`
             SELECT pm.id , pm.name ,pm.status ,pm.project_id ,pm.start_date,pm.end_date ,p.start_date AS project_start_date,p.end_date AS project_end_date
             from project_modules pm
             INNER JOIN projects p ON p.id=pm.project_id
             Where pm.id =${module_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async updateProjectModule(module_id, name, status, start_date, end_date) {
        try {
            return await mySql.query(`
          
            UPDATE project_modules SET name ='${name}', status=${status} ,start_date='${start_date}',end_date='${end_date}' where id =${module_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }
    async deleteProjectModule(module_ids) {
        try {
            return await mySql.query(`
          
            DELETE FROM project_modules  where id  in (${module_ids})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }
    async updateProject(project_id, name, status, start_date, end_date, description, progress, created_by) {
        try {
            let query = ` UPDATE projects SET name=? ,status=?,start_date=? , end_date=?,
                          description=?,progress =?,updated_by =?
                          WHERE id = ?`;
            return await mySql.query(query, [name, status, start_date, end_date, description, progress, created_by, project_id])
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getProjectByname(name, organization_id) {
        try {
            return await mySql.query(`
           SELECT id,name FROM projects
           WHERE organization_id = ${organization_id} AND name= '${name}'
          `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getModuleByname(name, project_id) {
        try {
            return await mySql.query(`
           SELECT id,name FROM project_modules
           WHERE project_id = ${project_id} AND name= '${name}'
          `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getProjectEmployeeById(project_id, employee_id) {
        try {
            return await mySql.query(`
           SELECT id FROM project_employees
           WHERE project_id = ${project_id} AND employee_id in ( ${employee_id})
          `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }
    async deleteEmplyeesFromProject(project_id, employee_id) {
        try {
            return await mySql.query(`
           DELETE FROM project_employees
           WHERE project_id = ${project_id} AND employee_id in (${employee_id})
          `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getProjectEmp(projects_id) {
        try {
            return await mySql.query(`
            SELECT COUNT(id) as employees FROM 
            project_employees WHERE project_id=${projects_id}
          `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }
    async getProjectTasks(projects_id) {
        try {
            return await mySql.query(`
            SELECT COUNT(id) as tasks FROM 
            project_tasks WHERE project_id=${projects_id}
      `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }
    async getProjectTimeSpent(projects_id) {
        try {
            return await mySql.query(`
            SELECT sec_to_time(sum(t.duration)) AS time 
            from employee_tasks_timesheet t INNER JOIN project_tasks pt ON pt.id=t.task_id WHERE pt.project_id=${projects_id}
      `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getProjectTimeByTask(project_tasks_ids) {
        try {
            return await mySql.query(`
            SELECT SUM(duration) AS project_total_time
            FROM employee_tasks_timesheet
            WHERE task_id IN (${project_tasks_ids})
      `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getProductionTime(task_ids,organization_id) {
        return EmpProductivityModel.aggregate([
            {
                $match: {
                    "tasks.task_id": { $in: task_ids },
                    "organization_id": organization_id
                }
            },
            {
                $project: {
                    tasks: 1
                }
            },
            {
                "$unwind": "$tasks"
            }
            ,
            {
                $match: {
                    "tasks.task_id": { $in: task_ids },
                }
            },
            {
                $group: {
                    "_id": "tempId",
                    "pro": { $sum: "$tasks.pro" },
                    "non": { $sum: "$tasks.non" },
                    "neu": { $sum: "$tasks.neu" },
                    "idle": { $sum: "$tasks.idle" },
                    "total": { $sum: "$tasks.total" },
                }
            },
        ])
    }


    async getProjectTask(project_id, organization_id) {
        try {
            return await mySql.query(`
            SELECT pt.id AS task_id , pt.name, pt.project_module_id, pm.name AS project_module_name,pt.project_id, p.name AS 
            project_name,pt.employee_id,CONCAT(u.first_name ,' ',u.last_name) AS employee_name,pt.description,pt.progress,pt.status,pt.priority,
            pt.start_date,pt.end_date,pt.created_by,pt.updated_by,pt.created_at,sec_to_time(sum(eet.duration)) AS time
            FROM project_tasks pt
            INNER JOIN projects p ON p.id= pt.project_id
            LEFT JOIN users u ON u.id=pt.employee_id
            LEFT JOIN project_modules pm ON pm.id= pt.project_module_id
            LEFT JOIN employee_tasks_timesheet eet ON eet.task_id=pt.id
            WHERE p.id=${project_id}  AND organization_id=${organization_id}
            GROUP BY pt.id
      `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkUsers(employee_ids) {
        return await mySql.query(`SELECT user_id,organization_id FROM employees WHERE user_id IN (?)`, [employee_ids])
    }

    async deleteProjectEmplyees(project_id) {
        try {
            return await mySql.query(`
           DELETE FROM project_employees
           WHERE project_id = ${project_id}`);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async getProjectModuleCount(project_id) {
        try {
            return await mySql.query(`
            SELECT COUNT(id) as modules FROM 
            project_modules WHERE project_id=${project_id}`);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    projects(project_id, organization_id, status, sortColumn, sortOrder, searchValue, skip, limit, created_by) {
        let query;
        if (created_by) {
            query = `SELECT p.id , p.name,p.organization_id, p.start_date,p.end_date,description ,p.created_by ,p.status ,p.progress,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p
                     INNER JOIN project_employees  pe ON pe.project_id=p.id
                     WHERE  organization_id=${organization_id}  AND  pe.employee_id=${created_by} `
        } else {
            query = `SELECT p.id , p.name,p.organization_id, p.start_date,p. end_date,description ,p.created_by ,p.status ,p.progress,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p
                     where organization_id=${organization_id}`;
        }

        if (project_id) query += ` AND p.id=${project_id}`;
        if (status) query += ` AND p.status=${status}`;
        if (searchValue) query += ` AND (p.name LIKE '%${searchValue}%' OR p.status LIKE '%${searchValue}%' OR p.progress LIKE '%${searchValue}%' OR p.start_date LIKE '%${searchValue}%' OR p.end_date LIKE '%${searchValue}%')`;
        query += ` ORDER BY p.${sortColumn} ${sortOrder}`;
        query += ` LIMIT ${skip},${limit};`;
        return mySql.query(query);
    }

    projectsWithemp(project_id, organization_id, status, sortColumn, sortOrder, searchValue, skip, limit, created_by) {
        let query;
        if (created_by) {
            query = `SELECT COUNT(pe.id) AS employees, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                         FROM projects p
                         LEFT JOIN project_employees pe ON p.id=pe.project_id
                         WHERE p.organization_id=${organization_id} AND pe.employee_id=${created_by} `;
        } else {
            query = `SELECT COUNT(pe.id) AS employees, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                    FROM projects p
                    LEFT JOIN project_employees pe ON p.id=pe.project_id
                    WHERE p.organization_id=${organization_id}`;
        }

        if (project_id) query += ` AND p.id=${project_id}`;
        if (status) query += ` AND p.status=${status}`;
        if (searchValue) query += ` AND (name LIKE '%${searchValue}%' OR status LIKE '%${searchValue}%' OR progress LIKE '%${searchValue}%' OR start_date LIKE '%${searchValue}%' OR end_date LIKE '%${searchValue}%')`;

        query += ` GROUP BY p.id
                ORDER BY ${sortColumn} ${sortOrder}`;
        query += ` LIMIT ${skip},${limit};`;

        return mySql.query(query);
    }

    projectsWithTasks(project_id, organization_id, status, sortColumn, sortOrder, searchValue, skip, limit, created_by) {
        let query;
        if (created_by) {
            query = `SELECT COUNT(pt.project_id) AS tasks, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p
                     LEFT JOIN project_tasks pt ON p.id=pt.project_id
                     INNER JOIN project_employees  pe ON pe.project_id=p.id
                     WHERE p.organization_id=${organization_id}  AND pe.employee_id=${created_by} `;
        } else {
            query = `SELECT COUNT(pt.project_id) AS tasks, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p
                     LEFT JOIN project_tasks pt ON p.id=pt.project_id
                     WHERE p.organization_id=${organization_id}`;
        }

        if (project_id) query += ` AND p.id=${project_id}`;
        if (status) query += ` AND p.status=${status}`;
        if (searchValue) query += ` AND (p.name LIKE '%${searchValue}%' OR p.status LIKE '%${searchValue}%' OR p.progress LIKE '%${searchValue}%' OR p.start_date LIKE '%${searchValue}%' OR p.end_date LIKE '%${searchValue}%')`;

        query += ` GROUP BY p.id
                ORDER BY ${sortColumn} ${sortOrder}`;
        query += ` LIMIT ${skip},${limit};`;

        return mySql.query(query);
    }

    projectsWithModules(project_id, organization_id, status, sortColumn, sortOrder, searchValue, skip, limit, created_by) {
        let query;
        if (created_by) {
            query = `SELECT  COUNT(pm.project_id) AS modules, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p
                     LEFT JOIN project_modules pm ON p.id=pm.project_id
                     INNER JOIN project_employees  pe ON pe.project_id=p.id
                     WHERE p.organization_id=${organization_id}  AND pe.employee_id=${created_by} `;
        } else {
            query = `SELECT  COUNT(pm.project_id) AS modules, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p
                     LEFT JOIN project_modules pm ON p.id=pm.project_id
                     WHERE p.organization_id=${organization_id}`;
        }

        if (project_id) query += ` AND p.id=${project_id}`;
        if (status) query += ` AND p.status=${status}`;
        if (searchValue) query += ` AND (p.name LIKE '%${searchValue}%' OR p.status LIKE '%${searchValue}%' OR p.progress LIKE '%${searchValue}%' OR p.start_date LIKE '%${searchValue}%' OR p.end_date LIKE '%${searchValue}%')`;

        query += ` GROUP BY p.id
                ORDER BY ${sortColumn} ${sortOrder}`;
        query += ` LIMIT ${skip},${limit};`;

        return mySql.query(query);
    }
    projectsWithTimesheet(project_id, organization_id, status, sortColumn, sortOrder, searchValue, skip, limit, created_by) {
        let query
        if (created_by) {
            query = `SELECT  sec_to_time(sum(t.duration)) AS time, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                     FROM projects p 
                     LEFT JOIN project_tasks pt ON pt.project_id=p.id
                     LEFT JOIN employee_tasks_timesheet t ON pt.id=t.task_id
                     INNER JOIN project_employees  pe ON pe.project_id=p.id
                     WHERE p.organization_id=${organization_id}  AND pe.employee_id=${created_by} `
        } else {
            query = `SELECT  sec_to_time(sum(t.duration)) AS time, p.id,p.name,p.status,p.start_date,p.end_date,p.description,p.progress,p.created_by,p.organization_id,(COUNT( p.id ) OVER()) AS total_count
                    FROM projects p
                    LEFT JOIN project_tasks pt ON pt.project_id=p.id
                    LEFT JOIN employee_tasks_timesheet t ON pt.id=t.task_id
                    WHERE p.organization_id=${organization_id}`;
        }

        if (project_id) query += ` AND p.id=${project_id}`;
        if (status) query += ` AND p.status=${status}`;
        if (searchValue) query += ` AND (p.name LIKE '%${searchValue}%' OR p.status LIKE '%${searchValue}%' OR p.progress LIKE '%${searchValue}%' OR p.start_date LIKE '%${searchValue}%' OR p.end_date LIKE '%${searchValue}%')`;

        query += ` GROUP BY p.id
                ORDER BY ${sortColumn} ${sortOrder}`;
        query += ` LIMIT ${skip},${limit};`;

        return mySql.query(query);

    }

    projectAttributes(project_id) {
        const query = `SELECT sec_to_time(sum(t.duration)) AS time,
                        (SELECT COUNT(id) as employees FROM project_employees WHERE project_id=${project_id}) AS employees,
                        (SELECT COUNT(id) as tasks FROM project_tasks WHERE project_id=${project_id}) AS tasks,
                        (SELECT COUNT(id) as modules FROM project_modules WHERE project_id=${project_id}) AS modules
                    FROM employee_tasks_timesheet t
                    LEFT JOIN project_tasks pt ON pt.id=t.task_id WHERE pt.project_id=${project_id}`;

        return mySql.query(query);

    }

    getProjectTaskIds(project_id, organization_id, search) {
        let query = `
        SELECT pt.id,pt.name 
        FROM project_tasks pt
        INNER JOIN  projects p ON p.id = pt.project_id
        WHERE p.id=? AND p.organization_id=?`
        let params = [project_id, organization_id];
        if (search) {
            query += ` AND pt.name LIKE '%${search}%'`;
        }
        return mySql.query(query, params);
    }

    getProejctAppWebsReports(task_ids, skip, limit, organization_id, type, status, sortBy, order, search, searchedTasks) {
        /**status 1-productive, 2-unproductive ,3-neutral ,4-idle,5-All */
        let filter = { "results.total": { $gt: 0 } }
        let sort = { "total": -1 };
        order = order == "A" ? 1 : -1;

        switch (status) {
            case 1: filter = { "results.pro": { $gt: 0 } }, sort = { "results.pro": order };
                break;
            case 2: filter = { "results.non": { $gt: 0 } }, sort = { "non": order };
                break;
            case 3: filter = { "results.neu": { $gt: 0 } }, sort = { "neu": order };
                break;
            case 4: filter = { "results.idle": { $gt: 0 } }, sort = { "idle": order };;
                break;
            default: filter = { "results.total": { $gt: 0 } }, sort = { "total": -1 };;
                break;
        };

        let searchValue = { "_id.name": { $ne: "" } };
        if (search) {
            searchValue = {
                $or: [
                    { "_id.app": { $regex: search, $options: "i" } },
                    { "_id.id": { $in: searchedTasks } }
                ]
            }
        }

        switch (type) {
            case "APP": filter = { ...filter, "results.application_type": 1 };
                break;
            case "WEB": filter = { ...filter, "results.application_type": 2 };
                break;
            default: filter = { ...filter, "results.application_type": { $in: [1, 2] } };
                break;
        };
        if (sortBy == "app") {
            sort = { "_id.app": order };
        }
        return EmpProductivityModel.aggregate([
            {
                $match: {
                    "tasks.task_id": { $in: task_ids },
                    organization_id,
                    "tasks.total": { $gt: 0 },
                }
            },
            {
                $project: {
                    tasks: 1
                }
            },
            { "$unwind": "$tasks" },
            {
                $match: {
                    "tasks.task_id": { $in: task_ids },
                }
            },
            {
                $group: {
                    "_id": "$tasks.task_id",
                    apps: { $push: "$tasks.applications" }
                }
            },
            {
                $project: {
                    "results": {
                        $reduce: {
                            input: "$apps",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this"] }
                        }
                    }
                }
            },
            { "$unwind": "$results" },
            {
                $match: filter
            },
            {
                $lookup: {
                    from: "organization_apps_webs",
                    localField: "results.application_id",
                    foreignField: "_id",
                    as: "apps"
                }

            },
            { $unwind: "$apps" },
            {
                $group: {
                    "_id": { id: "$_id", app_id: "$results.application_id", app: "$apps.name", type: "$apps.type" },
                    pro: { $sum: "$results.pro" }, non: { $sum: "$results.non" }, neu: { $sum: "$results.neu" }, idle: { $sum: "$results.idle" }, total: { $sum: "$results.total" }
                }
            },
            { $match: searchValue },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    task_id: "$_id.id",
                    app_id: "$_id.app_id",
                    app: "$_id.app",
                    type: "$_id.type",
                    pro: 1,
                    non: 1,
                    neu: 1,
                    idle: 1,
                    total: 1
                }
            }
        ])
    }

    getApps(app_ids, organization_id) {
        app_ids = app_ids.map(i => new mongoose.Types.ObjectId(i))
        return WebAppsModel.find({ _id: { $in: app_ids }, organization_id }, { app_id: "$_id", name: 1, type: 1 })
    }

    getProejctAppWebsReportsCount(task_ids, organization_id, type, status, search, searchedTasks) {
        /**status 1-productive, 2-unproductive ,3-neutral ,4-idle,5-All */
        let filter = { "results.total": { $gt: 0 } }
        let searchValue = { "_id.name": { $ne: "" } }
        if (search) {
            searchValue = {
                $or: [
                    { "_id.app": { $regex: search, $options: "i" } },
                    { "_id.id": { $in: searchedTasks } }
                ]
            }
        }
        switch (status) {
            case 1: filter = { "results.pro": { $gt: 0 } };
                break;
            case 2: filter = { "results.non": { $gt: 0 } };
                break;
            case 3: filter = { "results.neu": { $gt: 0 } };
                break;
            case 4: filter = { "results.idle": { $gt: 0 } };
                break;
            default: filter = { "results.total": { $gt: 0 } };
                break;
        };
        switch (type) {
            case "APP": filter = { ...filter, "results.application_type": 1 };
                break;
            case "WEB": filter = { ...filter, "results.application_type": 2 };
                break;
            default: filter = { ...filter, "results.application_type": { $in: [1, 2] } };
                break;
        };
        return EmpProductivityModel.aggregate([
            {
                $match: {
                    "tasks.task_id": { $in: task_ids },
                    organization_id,
                    "tasks.total": { $gt: 0 },
                }
            },
            {
                $project: {
                    tasks: 1
                }
            },
            { "$unwind": "$tasks" },
            {
                $match: {
                    "tasks.task_id": { $in: task_ids },
                }
            },
            {
                $group: {
                    "_id": "$tasks.task_id",
                    apps: { $push: "$tasks.applications" }
                }
            },
            {
                $project: {
                    "results": {
                        $reduce: {
                            input: "$apps",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this"] }
                        }
                    }
                }
            },
            { "$unwind": "$results" },
            {
                $match: filter
            },
            {
                $lookup: {
                    from: "organization_apps_webs",
                    localField: "results.application_id",
                    foreignField: "_id",
                    as: "apps"
                }

            },
            { $unwind: "$apps" },
            {
                $group: {
                    "_id": { id: "$_id", app_id: "$results.application_id", app: "$apps.name", type: "$apps.type" },
                    pro: { $sum: "$results.pro" }, non: { $sum: "$results.non" }, neu: { $sum: "$results.neu" }, idle: { $sum: "$results.idle" }, total: { $sum: "$results.total" }
                }
            },
            { $match: searchValue },
            {
                $count: "total"
            }
        ])
    }

    /**
    if you give group_ids it will return projects data related to group_ids
    if you give emp_ids it will return projects data related to emp_ids
    if you give empty it will return projects data related to organization_id
    **/
    getGroupsEmployeesProjects(group_ids, emp_ids, organization_id) {
        if (group_ids) {
            let query = `SELECT e.id  AS employee_id, pe.project_id  AS project_id, e.group_id, p.name  AS project_name
            FROM employees e
            INNER JOIN users u ON u.id=e.user_id
            INNER JOIN project_employees pe ON u.id=pe.employee_id
            INNER JOIN projects p ON pe.project_id=p.id
            WHERE e.organization_id=${organization_id} AND e.group_id IN (${group_ids})`
            return mySql.query(query);
        }
        else if (emp_ids) {
            let query = `SELECT p.id AS project_id, p.name AS project_name, e.id AS employee_id
            FROM employees e
            INNER JOIN users u ON u.id=e.user_id            
            INNER JOIN project_employees pe  ON u.id=pe.employee_id 
            INNER JOIN projects p ON p.id=pe.project_id 
            WHERE e.id IN (${emp_ids}) AND e.organization_id=${organization_id}`
            return mySql.query(query);
        }
        else {
            let query = `SELECT p.id as project_id,p.name AS project_name FROM projects p WHERE p.organization_id=${organization_id}`
            return mySql.query(query);
        }
    }


    /**
     * Gives Project IDs and Names from projects table
     * @param {*} organization_id 
     * @param {*} project_names 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getProjectIDs(organization_id, project_names) {
        const query = `SELECT id, name FROM projects ` +
            `WHERE organization_id = ${organization_id} AND name IN(?)`;

        return mySql.query(query, [project_names]);
    }

    /**
     * Gives User IDs and emails from users table
     * @param {*} emails 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getUserIDs(emails) {
        const query = `SELECT id, email FROM users ` +
            `WHERE email IN(?)`;

        return mySql.query(query, [emails]);
    }

    /**
     * Gives Module IDs and names from project_modules table
     * @param {*} name 
     * @param {*} project_id 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    checkModuleIDByName(name, project_id) {
        const query = `SELECT id, name FROM project_modules ` +
            `WHERE project_id = ? AND name = ?`;

        return mySql.query(query, [project_id, name]);
    }

    /**
     * Adds new Module in project_modules table
     * @param {*} name 
     * @param {*} project_id 
     * @param {*} start_date 
     * @param {*} end_date 
     * @param {*} created_by 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    addModule(name, project_id, start_date, end_date, created_by) {
        const query = `INSERT INTO project_modules (name,project_id,start_date,end_date,created_by,status)` +
            `VALUES (?,?,?,?,?,0) `;

        return mySql.query(query, [name, project_id, start_date, end_date, created_by]);
    }

    /**
     * Adds new task in project_tasks table
     * @param {*} name 
     * @param {*} project_id 
     * @param {*} start_date 
     * @param {*} end_date 
     * @param {*} created_by 
     * @param {*} employee_id 
     * @param {*} module_id 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    addTask(name, project_id, start_date, end_date, created_by, employee_id, module_id = null) {
        const query = `INSERT INTO project_tasks (name,project_id,project_module_id,start_date,end_date,created_by,employee_id,status)` +
            `VALUES (?,?,?,?,?,?,?,0) `;

        return mySql.query(query, [name, project_id, module_id, start_date, end_date, created_by, employee_id]);
    }

    getProjectData(project_ids, project_status, organization_id) {
        let query = `SELECT p.id  AS project_id, p.name  AS project_name,p.start_date,p.end_date,p.status
        FROM projects p       
        WHERE p.organization_id=${organization_id} AND p.id IN (${project_ids})`;

        if (project_status) { query += ` AND p.status IN (${project_status})` }

        return mySql.query(query);
    }

    getProjectModuleName(organization_id, project_ids, project_status) {
        let query = `SELECT p.id,GROUP_CONCAT(pm.id, ':' ,pm.name) AS names
        FROM projects p 
        LEFT JOIN project_modules pm ON p.id=pm.project_id
        WHERE p.organization_id=${organization_id} AND p.id IN (${project_ids})`;

        if (project_status) { query += ` AND p.status IN (${project_status})` }
        query += ` GROUP BY p.id`

        return mySql.query(query);
    }

    getModules(project_ids) {
        let query = `SELECT pm.project_id,pm.id ,pm.name
        FROM project_modules pm 
        WHERE pm.project_id IN (?)`;

        return mySql.query(query, [project_ids]);
    }

    getTasksData(module_ids, taskStartDate, taskEndDate, taskStatus) {
        let query = `SELECT pt.project_module_id,pt.id, pt.name ,pt.start_date,pt.end_date,pt.employee_id AS assigned_to,pt.status,pt.progress
        FROM project_tasks pt 
        WHERE pt.project_module_id IN (?)`;

        if (taskStartDate) { query += ` AND pt.start_date LIKE '%${taskStartDate}%'` }
        if (taskEndDate) { query += ` AND pt.end_date LIKE '%${taskEndDate}%'` }
        if (taskStatus) { query += ` AND pt.status IN (${taskStatus})` }

        return mySql.query(query, [module_ids]);
    }
}

module.exports = new ProjectModel;


// db.getCollection('employee_productivity_reports').aggregate([
//     {
//         $match: {
//             "tasks.task_id": { $in: [ 136, 138, 242, 244, 248, 249 ] },
//             organization_id:1,
//             "tasks.total":{$ne:0}
//         }
//     },
//     {
//         $project: {
//             tasks: 1
//         }
//     },
//     { "$unwind": "$tasks" },
//     {
//         $match: {
//             "tasks.task_id": { $in: [ 136, 138, 242, 244, 248, 249 ] },
//              "tasks.applications.total":{$ne:0}
//         }
//     }
// // 
//     ,
//     {
//         $group: {
//             "_id": "$tasks.task_id",
//             apps: { $push: "$tasks.applications" }
//         }
//     }
// //             ,
//             {
//                 $project: {
//                     "results": {
//                         $reduce: {
//                             input: "$apps",
//                             initialValue: [{}],
//                             in: { $concatArrays: ["$$value", "$$this"] }
//                         }
//                     }
//                 }
//             },
// // 
//             { "$unwind": "$results" },
//             { $match: { results: { $ne: {} } } },
// //             //                  
//             {
//                 $group: {
//                     "_id": { id: "$_id", app_id: "$results.application_id" },
//                     pro: { $sum: "$results.pro" }, non: { $sum: "$results.non" }, neu: { $sum: "$results.neu" }, total: { $sum: "$results.total" }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     task_id: "$_id.id",
//                     app_id: "$_id.app_id",
//                     pro: 1,
//                     non: 1,
//                     neu: 1,
//                     total: 1
//                 }
//             }

// ])