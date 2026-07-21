
const moment = require('moment-timezone');
const async = require("async");
const { forEach } = require('async-foreach');
const _ = require('underscore')
const ProjectModel = require('./project.model');
const ValidateProjects = require('./project.validator');
const ErrorResponse = require('../../../utils/helpers/ErrorResponse');
const ProjectService = require('./service/attendance.service');
const redisService = require('../auth/services/redis.service');

const projectStatus = { 0: 'Hold', 1: 'In Progress', 2: 'Completed', 4: 'Todo' };

const translate = require('./utils/translation');

let isExist;

class ProjectController {

    async projects(req, res) {
        const { user_id, organization_id } = req.decoded;
        try {
            if (req.decoded.setting.system.visibility == false) return sendResponse(res, 422, null, "Projects Not Found.", null);
            let [projects, tasks, totalTime] = await Promise.all([
                ProjectModel.projects(user_id, organization_id),
                ProjectModel.getTasksCount(user_id),
                ProjectModel.getProjectDuration(user_id),
            ]);
            if (projects.length === 0) {
                return sendResponse(res, 422, null, "Projects Not Found.", null);
            } else {
                totalTime = totalTime.filter(itr => itr.duration != null)
                projects = projects.map(item => ({
                    ...item, task_count:
                        (tasks.find(i => i.project_id == item.id) ?
                            tasks.find(i => i.project_id == item.id).tasks : 0)
                    , project_duration: (totalTime.find(i => i.project_id == item.id) ? totalTime.find(i => i.project_id == item.id).duration : "00:00:00")
                }))
                return sendResponse(res, 200, projects, "Project Data", null);
            }
        } catch (err) {
            return sendResponse(res, 422, null, "Unable To Get Projects.", err);
        }
    }

    async tasks(req, res) {
        const { user_id, organization_id, timezone } = req.decoded;
        const { project_id } = req.params;

        try {
            if (req.decoded.setting.system.visibility == false) return sendResponse(res, 422, null, 'Tasks Not Found.', null);
            await ValidateProjects.validateProjectTodo().validateAsync({ project_id });
        } catch (err) {
            return sendResponse(res, 404, null, 'Validation Failed', err.details[0].message);
        }
        try {
            const [tasks, taskTimsheets] = await Promise.all([
                ProjectModel.tasks(project_id, user_id),
                ProjectModel.taskTimsheet(project_id, user_id),
            ]);

            if (!tasks.length) {
                return sendResponse(res, 422, null, 'Tasks Not Found.', null);
            }
            const task_list = [];
            forEach(tasks, function (task_element) {
                const timesheet = taskTimsheets.filter((taskId) => {
                    return taskId.id == task_element.id && taskId.timesheet_id != null;
                });
                const single_task = {
                    id: task_element.id,
                    name: task_element.name,
                    start_date: task_element.start_date,
                    end_date: task_element.end_date,
                    priority: task_element.priority,
                    status: task_element.status,
                    status_updateAt: task_element.status_updateAt,
                    created_at: task_element.created_at,
                    created_by: task_element.created_by,
                    assigned_by: task_element.assigned_by,
                    timesheets: timesheet
                }
                task_list.push(single_task);
            });

            const task_data_list = task_list.sort(function (date1, date2) {
                if (typeof date2.timesheets[0] !== 'undefined' && typeof date1.timesheets[0] !== 'undefined') {
                    return moment(date2.timesheets[0].end_time).isBefore(moment(date1.timesheets[0].end_time));
                }
            });

            // return sendResponse(res, 200, task_data_list, 'Success.', null);
            return res.json({ code: 200, data: task_data_list, timezone, message: "Success", error: null })
        } catch (err) {
            return sendResponse(res, 422, null, 'Unable To Get Tasks.', err);
        }
    }

    async insertProjectTaskStat(req, res, next) {
        try {
            let data = req.body.data;
            const { employee_id, organization_id, timezone, user_id } = req.decoded;
            let validation = await ValidateProjects.validateProjectTodoStat(req.body.data);
            if (validation.error) return sendResponse(res, 422, null, 'Validation Failed', validation.error.details[0].message.replace(validation.error.details[0].message.substring(1, 5), ''));
            let attendanceId = [];

            /**Update all other tasks which is inprogress except currently working */
            let currentTaskIds = _.pluck(data, "task_id");
            currentTaskIds = _.unique(currentTaskIds);
            const [taskList, updateTask, currentTaskUpdate] =
                await Promise.all([
                    ProjectModel.getTaskByIds({ user_id, currentTaskIds }),
                    ProjectModel.updateTaskStatus({ user_id, currentTaskIds }),
                    ProjectModel.updateCurrentTaskStatus({ user_id, currentTaskIds }),
                ]);

            for (const date_data of data) {
                let start;
                try {
                    start = moment(date_data.start_time).utc();
                } catch (error) {
                    return sendResponse(res, 422, null, 'Invalid Date', `Check start_time format <br> ${JSON.stringify(error)}`);
                }
                const startedDate = start.clone().tz(timezone).format('YYYY-MM-DD');

                // let taskEntity = taskList.find(i => i.id == date_data.task_id);
                // if (taskEntity.length !== 0) {
                //     /** check task status */
                //     if ([0, 2].includes(taskEntity.status)) return sendResponse(res, 400, null, `Unable start the task, ${taskEntity.name} task in ${projectStatus[taskEntity.status]} state,Please update the task and start work `, null);
                // }

                let [attendanceData] = await ProjectModel.getAttendanceId(employee_id, startedDate);
                // const [attendanceData] = await ProjectModel.getAttendanceId(135, '2020-05-25');
                // if (!attendanceData) return sendResponse(res, 422, null, 'Attendance Error', `User attendance issue with date - ${startedDate}`);
                // added by vikash code starts=========
                if (!attendanceData) {
                    // attendanceData = await ProjectModel.createAttendanceEntry(
                    //     startedDate,
                    //     employee_id,
                    //     organization_id,
                    //     start.clone().format('YYYY-MM-DD HH:mm:ss'),
                    //     start.clone().add(1, 'minute').format('YYYY-MM-DD HH:mm:ss')
                    // );
                    attendanceData = await ProjectService.getAttendance(employee_id, start, req.decoded, organization_id);
                    attendanceData = { id: attendanceData }
                }
                // vikash code ends===================
                attendanceId.push(attendanceData.id);
            }

            for (let i = 0; i < data.length; i++) {
                let attendance_id = attendanceId[i];
                let { start_time, end_time, task_id, reason, type } = data[i];
                try {
                    start_time = moment(start_time).utc();
                } catch (error) {
                    return sendResponse(res, 422, null, 'Invalid Date', `Check start_time format <br> ${JSON.stringify(error)}`);
                }

                const date = start_time.clone().format('YYYY-MM-DD');
                let duration = 0;
                start_time = start_time.format('YYYY-MM-DD HH:mm:ss');
                if (end_time && end_time !== '') {
                    end_time = moment(end_time).utc().format('YYYY-MM-DD HH:mm:ss');
                    end_time = moment(end_time);
                    duration = moment.duration(end_time.diff(start_time)).asSeconds();
                    end_time = end_time.format('YYYY-MM-DD HH:mm:ss');
                }

                // Get Timesheet of the task for that very day
                const [taskTimeSheetData] = await ProjectModel.getTaskStat(attendance_id, task_id, start_time);
                if (taskTimeSheetData) {
                    // Update previous data if any thing is there
                    if ((end_time && end_time !== '') || (reason && reason !== ''))
                        await ProjectModel.updateTaskStat(taskTimeSheetData.id, reason, end_time, duration, type)
                    // return sendResponse(res, 200, null, 'Task stats updated', null);
                } else {
                    // Make a new entry
                    await ProjectModel.insertTaskStat(attendance_id, start_time, end_time, duration, task_id, reason, type);
                    // return sendResponse(res, 200, null, 'Task stats recorded', null);
                }
            }
            return sendResponse(res, 200, null, 'Task stats updated', null);
        } catch (err) {
            console.log(err)
            return sendResponse(res, 422, null, 'Error', err.sqlMessage ? err.sqlMessage : err);
        }

    }
    // async insertProjectTaskStat(req, res, next) {
    //     try {

    //         try {
    //             await ValidateProjects.validateProjectTodoStat().validateAsync({ task_id: req.body.task_id, start_time: req.body.start_time, end_time: req.body.end_time, reason: req.body.reason });
    //         } catch (err) {
    //             return sendResponse(res, 422, null, 'Validation Failed', err.details[0].message);
    //         }

    //         let { start_time, end_time, task_id, reason, type } = req.body;
    //         const { employee_id } = req.decoded;

    //         try {
    //             start_time = moment(start_time).utc();
    //         } catch (error) {
    //             return sendResponse(res, 422, null, 'Invalid Date', `Check start_time format <br> ${JSON.stringify(error)}`);
    //         }

    //         const date = start_time.clone().format('YYYY-MM-DD');
    //         let duration = 0;

    //         if (end_time && end_time !== '') {
    //             end_time = moment(end_time).utc();
    //             duration = moment.duration(end_time.diff(start_time)).asSeconds();
    //             end_time = end_time.format('YYYY-MM-DD HH:mm:ss');
    //         }
    //         start_time = start_time.format('YYYY-MM-DD HH:mm:ss');

    //         // Get attendance 
    //         const [attendanceData] = await ProjectModel.getAttendanceId(employee_id, date);
    //         // const [attendanceData] = await ProjectModel.getAttendanceId(202, '2020-06-06');
    //         if (!attendanceData) return sendResponse(res, 422, null, 'Attendance Error', `User attendance issue with date - ${date}`);
    //         const attendanceId = attendanceData.id;

    //         // Get Timesheet of the task for that very day
    //         const [taskTimeSheetData] = await ProjectModel.getTaskStat(attendanceId, task_id, start_time);
    //         if (taskTimeSheetData) {
    //             // Update previous data if any thing is there
    //             if ((end_time && end_time !== '') || (reason && reason !== ''))
    //                 await ProjectModel.updateTaskStat(taskTimeSheetData.id, reason, end_time, duration, type)
    //             return sendResponse(res, 200, null, 'Task stats updated', null);
    //         } else {
    //             // Make a new entry
    //             await ProjectModel.insertTaskStat(attendanceId, start_time, end_time, duration, task_id, reason, type);
    //             return sendResponse(res, 200, null, 'Task stats recorded', null);
    //         }
    //     } catch (err) {
    //         return sendResponse(res, 422, null, 'Error', err.sqlMessage ? err.sqlMessage : err);
    //     }

    // }

    async updateTask(req, res, next) {
        const { user_id } = req.decoded;
        let { status, task_id, updated_at } = req.body;
        try {
            if (req.decoded.setting.system.visibility == false) return sendResponse(res, 422, null, 'Tasks Not Found.', null);
            await ValidateProjects.validateProjectTodoUpdate().validateAsync({ task_id: task_id, status: status, updated_at });
        } catch (err) {
            return sendResponse(res, 422, null, 'Validation Failed', err.details[0].message);
        }
        try {
            updated_at = moment.utc(updated_at).format("YYYY-MM-DD HH:mm:ss");
            const get_tasks = await ProjectModel.getProjectTaskBy(task_id, user_id);
            if (get_tasks.length == 0) {
                return sendResponse(res, 422, null, 'Task Not Found.', null);
            }
            const tasks = await ProjectModel.updateProjectTask(status, task_id, updated_at, user_id);
            if (tasks.affectedRows === 0) {
                return sendResponse(res, 422, null, 'Unable To Update Task.', null);
            }
            return sendResponse(res, 200, req.body, 'Success', null);
        } catch (err) {
            return sendResponse(res, 422, null, 'Unable To Update Task.', null);
        }
    }

    async getTaskStat(req, res) {
        const today_date = moment().utc().format('YYYY-MM-DD');
        const { user_id } = req.decoded;
        try {
            if (req.decoded.setting.system.visibility == false) return sendResponse(res, 422, null, 'Tasks Not Found.', null);
            const get_task_stats = await ProjectModel.getTaskStats(today_date, user_id);
            if (get_task_stats.length == 0) {
                return sendResponse(res, 422, null, 'Tasks Not Found.', null);
            } else {
                return sendResponse(res, 200, get_task_stats, 'Success.', null);
            }
        } catch (err) {
            return sendResponse(res, 422, null, 'Unable To Get Tasks.', null);
        }

    }

    // async addEmployeeTimeTrack(req, res) {
    //     const { user_id } = req.decoded;
    //     const start_time = moment(req.body.start_time).utc().format('YYYY-MM-DD HH:mm:SS');
    //     const end_time = moment(req.body.end_time).utc().format('YYYY-MM-DD HH:mm:SS');
    //     const duration = req.body.duration;
    //     const today_date = moment().utc().format('YYYY-MM-DD');

    //     try {
    //         await ValidateProjects.addEmployeeTimeTrack().validateAsync({ duration, start_time: req.body.start_time, end_time: req.body.end_time });
    //     } catch (err) {
    //         return sendResponse(res, 404, null, "Validation Failed.", err);
    //     }
    //     try {
    //         const get_attendance_id = await ProjectModel.getAttendanceId(user_id, today_date);
    //         if (get_attendance_id.length == 0) {
    //             return sendResponse(res, 422, null, "Unable To Add Employee Time Track", null);
    //         }
    //         const add_time_track = await ProjectModel.addEmployeeTimeTrack(get_attendance_id[0].id, start_time, end_time, duration);
    //         if (!add_time_track) {
    //             return sendResponse(res, 422, null, "Unable To Add Employee Time Track", null);
    //         }
    //         else if (add_time_track.affectedRows > 0) {
    //             req.body.id = add_time_track.insertId;
    //             return sendResponse(res, 200, req.body, "Success", null);
    //         }
    //         return sendResponse(res, 422, null, "Unable To Add Employee Time Track", null);
    //     } catch (err) {
    //         return sendResponse(res, 422, null, "Unable To Add Employee Time Track", null);
    //     }

    // }

    // async getTimeTrack(req, res) {
    //     const { user_id } = req.decoded;
    //     const from_date = moment(req.params.from_date).utc().format('YYYY-MM-DD');
    //     const to_date = moment(req.params.to_date).utc().format('YYYY-MM-DD');

    //     try {
    //         await ValidateProjects.getEmployeeTimeTrack().validateAsync({ from_date: req.params.from_date, to_date: req.params.to_date });
    //     } catch (err) {
    //         return sendResponse(res, 404, null, "Validation Failed.", err);
    //     }
    //     try {
    //         const get_timesheet = await ProjectModel.getEmployeeTimesheet(user_id, from_date, to_date);
    //         if (get_timesheet.length == 0) {
    //             return sendResponse(res, 422, null, "No Timesheets Not Found", null);
    //         }
    //         return sendResponse(res, 200, get_timesheet, "Success.", null);

    //     } catch (err) {
    //         return sendResponse(res, 422, null, "Unable To Get Time Track.", null);
    //     }
    // }

    async createTask(req, res) {

        let date = moment().format("YY-MM-DD");
        const { user_id, organization_id } = req.decoded;
        let { project_id, name, description, priority } = req.body;
        description = description || "";
        try {
            await ValidateProjects.validateAddTask().validateAsync({ start_date: req.body.start_date, end_date: req.body.end_date, description, priority, project_id, name });
        } catch (err) {
            return sendResponse(res, 404, null, 'Validation Failed', err.details[0].message);
        }
        try {
            const start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') : null;
            const end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') : null;

            let check_name = await ProjectModel.getTaskByName(name, project_id, user_id);
            if (check_name.length > 0) {
                return sendResponse(res, 422, null, 'Task Name Is Already Exists.', null);
            }

            let project_data = await ProjectModel.getProject(project_id, organization_id, user_id);
            if (project_data.length > 0) {
                if (req.body.start_date && req.body.end_date) {
                    let project_start_date = moment(project_data[0].start_date).format('YYYY-MM-DD');
                    let project_end_date = moment(project_data[0].end_date).format('YYYY-MM-DD');
                    let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                    let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                    let is_before = moment(start_date).isSameOrBefore(end_date);
                    if (!is_start_date || !is_end_date) {
                        return sendResponse(res, 422, null, 'Todo Start Date and End Date With In The Project Duration.', null);
                    }
                    else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                        return sendResponse(res, 422, null, 'Please Select Valid  Start Date And End Date', null);
                    }
                }
            } else {
                return sendResponse(res, 422, null, 'Project Not Found.', null);
            }

            const create_task = await ProjectModel.createTask(name, user_id, project_id, description, start_date, end_date, user_id, priority);
            if (!create_task) {
                return sendResponse(res, 422, null, 'Unable To Create Task.', null);
            } else if (create_task.affectedRows > 0) {
                req.body.task_id = create_task.insertId;
                req.body.create_date = date;
                return sendResponse(res, 200, req.body, 'Task Created Successfully.', null);
            }
        } catch (err) {
            console.log(err)
            return sendResponse(res, 422, null, 'Failed To Create Task.', null);
        }
    }

    async getProjectsWithTask(req, res) {
        const { user_id, organization_id } = req.decoded;
        const project_list = [];

        try {
            if (req.decoded.setting.system.visibility == false) return sendResponse(res, 422, null, "No Projects Found.", null);
            
            // Create cache key based on user_id and organization_id
            const cacheKey = `project_task_${user_id}_${organization_id}`;
            
            // Check if data exists in Redis cache
            const { promisify } = require('util');
            const redis = require('redis');
            const getAsync = promisify(redis.createClient().get).bind(redis.createClient());
            const cachedData = await redisService.getAsync(cacheKey);
            
            if (cachedData) {
                // Return cached data if available
                return sendResponse(res, 200, JSON.parse(cachedData), "Projects.", null);
            }
            
            const [projectsData, tasks, totalTime] = await Promise.all([
                ProjectModel.projectsWithModules(user_id, organization_id),
                ProjectModel.getTasksByUserId(user_id),
                ProjectModel.getProjectDuration(user_id),
            ]);
            const projects = [...new Map(projectsData.map(item => [item['id'], item])).values()];
            if (projects.length) {
                forEach(projects, function (project) {
                    const task_list = tasks.filter(({ project_id }) => project_id === project.id);
                    let module = _.groupBy(task_list, 'project_module_id');
                    let moduleData = _.groupBy(projectsData, 'id');
                    module = Object.keys(module).map((key, index) => {
                        return {
                            project_module_id: module[key][0]['project_module_id'],
                            project_module_name: module[key][0]['project_module_name'],
                            module_start_date: module[key][0]['module_start_date'],
                            module_end_date: module[key][0]['module_end_date'],
                            tasks: module[key],
                            task_count: module[key].length
                        };
                    });

                    const tempModules = moduleData[project.id];
                    let result = tempModules.filter(md => module.every(m => m.project_module_id !== md.project_module_id));
                    result = result.filter(i => i.project_module_id != null && i.module_status != 4).map(i => {
                        return {
                            project_module_id: i.project_module_id,
                            project_module_name: i.project_module_name,
                            module_start_date: i.module_start_date,
                            module_end_date: i.module_end_date,
                            tasks: [],
                            task_count: 0
                        }
                    });
                    module = [...module, ...result];
                    project_list.push({
                        project_id: project.id,
                        project_name: project.name,
                        status: project.status,
                        description: project.description,
                        start_date: project.start_date,
                        end_date: project.end_date,
                        task_count: task_list.length,
                        project_duration: totalTime.find(i => i.project_id == project.id) ? totalTime.find(i => i.project_id == project.id).duration : "00:00:00",
                        tasks: task_list,
                        module_count: module.length,
                        module
                    })
                })
                
                // Cache the data in Redis for 8 hours (28800 seconds)
                await redisService.setAsync(cacheKey, JSON.stringify(project_list), 'EX', 28800);
                
                return sendResponse(res, 200, project_list, "Projects.", null);
            } else {
                return sendResponse(res, 422, null, "No Projects Found.", null);
            }
        } catch (err) {
            console.log('============', err);
            return sendResponse(res, 422, null, "Unable Get Projects.", err);
        }



    }


    /* Below all method for Silah Project Task API */

    async getProjectSilah(req, res, next) {
        try {
            let { organization_id, user_id, employee_id, language } = req.decoded;
            let { skip, limit, search } = await ValidateProjects.validateFetchProject().validateAsync(req.query);
            if (skip) skip = +skip;
            if (limit) limit = +limit;

            let [project, [projectCount]] = await Promise.all([
                ProjectModel.fetchProjectMobile({ skip, limit, search, organization_id, employee_id }),
                ProjectModel.fetchProjectMobile({ skip, limit, search, organization_id, employee_id, count: true })
            ])

            let defaultProjectStatus = await ProjectModel.fetchProject({ skip: 0, limit: 10, search: "Default", organization_id });
            defaultProjectStatus = defaultProjectStatus.filter(p => p.title == "Default");
            if (defaultProjectStatus.length === 0) {
                let projectCreated = await ProjectModel.createProject({ organization_id, title: "Default", description: "Default", created_by: user_id, start_date: moment().format('YYYY-MM-DD'), end_date: moment().add(1, 'months').format('YYYY-MM-DD') });
                if (projectCreated._id) {
                    await ProjectModel.createProjectFolder({ organization_id, title: "Current Task", project_id: projectCreated._id, created_by: user_id });
                    await ProjectModel.createProjectFolder({ organization_id, title: "Next Task", project_id: projectCreated._id, created_by: user_id });
                    await ProjectModel.createProjectFolder({ organization_id, title: "Future Task", project_id: projectCreated._id, created_by: user_id });
                    await ProjectModel.createProjectFolder({ organization_id, title: "Finished Task", project_id: projectCreated._id, created_by: user_id });
                }
                if (project.length < 10) project.push(projectCreated._doc);
            } else if (defaultProjectStatus.length !== 0 && project.filter(i => i.title === "Default").length == 0 && project.length < 10 && !search) {
                project.push(defaultProjectStatus[0]);
                if (projectCount) {
                    projectCount.count++;
                }
                else {
                    projectCount = { count: 1 };
                }
            }

            return res.status(200).json({ code: 200, data: project, error: null, message: translate.find(i => i.id == 1)[language || 'en'], count: projectCount?.count });
        } catch (error) {
            next(error);
        }
    }

    async getProjectFolderSilah(req, res, next) {
        try {
            let { organization_id, user_id, language } = req.decoded;
            let { skip, limit, search, project_id } = await ValidateProjects.validateFetchProjectFolder().validateAsync(req.query);
            if (skip) skip = +skip;
            if (limit) limit = +limit;
            let projectFolders = await ProjectModel.fetchProjectFolder({ skip, limit, search, organization_id, project_id });

            return res.status(200).json({ code: 200, data: projectFolders, error: null, message: translate.find(i => i.id == 1)[language || 'en'] });
        } catch (error) {
            next(error);
        }
    }

    async getProjectTaskSilah(req, res, next) {
        try {
            let { organization_id, user_id, language, employee_id } = req.decoded;
            let { skip, limit, search, project_id, folder_name, start_date, end_date, task_id, sort_by } = await ValidateProjects.validateFetchProjectTaskListMobile().validateAsync(req.query);

            if (start_date && end_date) {
                start_date = moment(start_date).toISOString();
                end_date = moment(end_date).add(1, 'days').toISOString();
            }

            let [projectTasks, [count]] = await Promise.all([
                ProjectModel.fetchProjectTaskListMobile({ skip, limit, search, organization_id, getCount: false, employee_id, task_id, manager_id: null, project_id, folder_name, start_date, end_date, sort_by }),
                ProjectModel.fetchProjectTaskListMobile({ skip, limit, search, organization_id, getCount: true, employee_id, task_id, manager_id: null, project_id, folder_name, start_date, end_date, sort_by })
            ]);

            let finialTaskList = [];
            for (const { task_working_status, ...remainingData } of projectTasks) {
                let activeTime = 0;

                switch (remainingData?.folder_data?.name) {
                    case 'Current Task':
                        remainingData.folder_data.name = translate.find(i => i.id == 48)[language || 'en'];
                        break;
                    case 'Next Task':
                        remainingData.folder_data.name = translate.find(i => i.id == 49)[language || 'en'];
                        break;
                    case 'Future Task':
                        remainingData.folder_data.name = translate.find(i => i.id == 50)[language || 'en'];
                        break;
                    case 'Finished Task':
                        remainingData.folder_data.name = translate.find(i => i.id == 51)[language || 'en'];
                        break;
                    default:
                        break;
                }

                if (task_working_status.length) {
                    for (const taskTiming of task_working_status) {
                        if (taskTiming.start_time && taskTiming.end_time) {
                            activeTime += moment(moment(taskTiming.end_time).utc().toISOString()).diff(moment(taskTiming.start_time).utc(), 'seconds');
                        }
                        else {
                            activeTime += moment(moment().utc().toISOString()).diff(moment(taskTiming.start_time).utc(), 'seconds');
                        }
                    }
                }
                finialTaskList.push({
                    ...remainingData,
                    active_time: activeTime
                })
            }

            return res.status(200).json({ code: 200, data: finialTaskList, count: count?.count ?? 0, error: null, message: translate.find(i => i.id == 1)[language || 'en'] });
        } catch (error) {
            next(error);
        }
    }

    async createProjectTask(req, res, next) {
        try {
            let taskStartTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let { timezone, employee_id, organization_id, department_id, location_id, user_id, language } = req.decoded;
            let { title, project_id, folder_name, is_start } = await ValidateProjects.validateCreateProjectTask().validateAsync(req.body);
            // let isExist = await ProjectModel.findProjectTaskSameName({ title, organization_id, project_id, task_id: null });
            // if (isExist !== null) return res.status(400).json({ code: 400, data: null, error: null, message: translate.find(i => i.id == 13)[language || 'en'] });


            isExist = await ProjectModel.findProject({ _id: project_id });
            if (isExist === null) return res.status(400).json({ code: 400, data: null, error: null, message: translate.find(i => i.id == 4)[language || 'en'] });

            isExist = await ProjectModel.findProjectFolderName({ name: folder_name, project_id });
            if (isExist === null) return res.status(400).json({ code: 400, data: null, error: null, message: translate.find(i => i.id == 38)[language || 'en'] });

            let projectTask = await ProjectModel.createProjectTask({ organization_id, title, project_id, folder_id: isExist._id, created_by: user_id, employee_id });

            // if (is_start) {
            //     // assigned_user,status=1
            //     let task_id = projectTask._id;
            //     let isRunningTask = await ProjectModel.findRunningTask(employee_id);
            //     if (isRunningTask !== null) return res.status(200).json({ code: 200, message: translate.find(i => i.id == 47)[language || 'en'], data: null, error: null });

            //     projectTask = await ProjectModel.findTaskById({ _id: task_id });
            //     if (!projectTask) return res.status(404).json({ code: 404, error: null, data: null, message: translate.find(i => i.id == 19)[language || 'en'] });

            //     if (projectTask.assigned_user !== employee_id) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 26)[language || 'en'], data: null, error: null });
            //     if (projectTask.status === 1 || projectTask.status === 3) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 27)[language || 'en'], data: null, error: null });

            //     let [employeeShift] = await ProjectModel.getEmployeeShift(employee_id)
            //     let date = moment.tz(timezone).format('YYYY-MM-DD');
            //     if (employeeShift) {
            //         let shiftData = JSON.parse(employeeShift.data)[moment.tz(timezone).format('dddd').toLowerCase().slice(0, 3)];
            //         if (shiftData.status === true) {
            //             if (ShiftUtils.isEndInNextDay(shiftData.time.start, shiftData.time.end) && moment(taskStartTime).isAfter(moment(shiftData.time.end, 'HH:mm').utc()) == false) {
            //                 date = moment(date).subtract(1, 'days').format('YYYY-MM-DD');
            //             }
            //         }
            //     }
            //     let [employeeAttendance] = await ProjectModel.getEmployeeAttendance(date, employee_id)
            //     if (employeeAttendance) {
            //         let prReport = await ProjectModel.getEmployeeAttendanceReport(moment(employeeAttendance.date).format('YYYY-MM-DD'), employee_id, organization_id);
            //         projectTask.status = 1;
            //         projectTask.task_working_status.push({
            //             start_time: taskStartTime,
            //             productivity_report_id: prReport._id
            //         })
            //         await projectTask.save();
            //     }
            //     else {
            //         // Create Attendance Record and start application tracking.
            //         let response = await ProjectModel.createAttendanceRecord(employee_id, organization_id, date, taskStartTime);
            //         //response.insertId
            //         let prReport = await ProjectModel.createEmployeeProductivityReport(department_id, location_id, employee_id, organization_id, date, taskStartTime);

            //         projectTask.status = 1;
            //         projectTask.task_working_status.push({
            //             start_time: taskStartTime,
            //             productivity_report_id: prReport._id
            //         })
            //         await projectTask.save();
            //     }
            // }

            return res.status(200).json({ code: 200, data: projectTask, error: null, message: translate.find(i => i.id == 15)[language || 'en'] });
        }
        catch (error) {
            next(error);
        }
    }

    async updateProjectTask(req, res, next) {
        try {
            let taskStartTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let { timezone, employee_id, organization_id, department_id, location_id, user_id, language } = req.decoded;
            let { title, project_id, folder_name, task_id, is_start } = await ValidateProjects.validateUpdateProjectTaskMobile().validateAsync(req.body);

            let projectTask = await ProjectModel.findTaskById({ _id: task_id });
            if (!projectTask) return res.status(404).json({ code: 404, error: null, data: null, message: translate.find(i => i.id == 19)[language || 'en'] });

            let isExist = await ProjectModel.findProjectTaskSameName({ title, organization_id, project_id, task_id });
            if (isExist !== null) {
                if (isExist._id !== projectTask._id) return res.status(400).json({ code: 400, data: null, error: null, message: translate.find(i => i.id == 13)[language || 'en'] });
            }

            isExist = await ProjectModel.findProject({ _id: project_id });
            if (isExist === null) return res.status(400).json({ code: 400, data: null, error: null, message: translate.find(i => i.id == 4)[language || 'en'] });

            isExist = await ProjectModel.findProjectFolderName({ name: folder_name, project_id });
            if (isExist === null) return res.status(400).json({ code: 400, data: null, error: null, message: translate.find(i => i.id == 38)[language || 'en'] });


            projectTask.name = title;
            projectTask.project_id = project_id;
            projectTask.folder_id = isExist._id;
            await projectTask.save();

            // if (is_start) {
            //     // assigned_user,status=1
            //     let task_id = projectTask._id;
            //     let isRunningTask = await Model.findRunningTask(employee_id);
            //     if (isRunningTask !== null) return res.status(200).json({ code: 200, message: translate.find(i => i.id == 54)[language || 'en'], data: null, error: null });

            //     projectTask = await Model.findTaskById({ _id: task_id });
            //     if (!projectTask) return res.status(404).json({ code: 404, error: null, data: null, message: translate.find(i => i.id == 19)[language || 'en'] });

            //     if (projectTask.assigned_user !== employee_id) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 26)[language || 'en'], data: null, error: null });
            //     if (projectTask.status === 1 || projectTask.status === 3) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 27)[language || 'en'], data: null, error: null });

            //     let [employeeShift] = await Model.getEmployeeShift(employee_id)
            //     let date = moment.tz(timezone).format('YYYY-MM-DD');
            //     if (employeeShift) {
            //         let shiftData = JSON.parse(employeeShift.data)[moment.tz(timezone).format('dddd').toLowerCase().slice(0, 3)];
            //         if (shiftData.status === true) {
            //             if (ShiftUtils.isEndInNextDay(shiftData.time.start, shiftData.time.end) && moment(taskStartTime).isAfter(moment(shiftData.time.end, 'HH:mm').utc()) == false) {
            //                 date = moment(date).subtract(1, 'days').format('YYYY-MM-DD');
            //             }
            //         }
            //     }
            //     let [employeeAttendance] = await Model.getEmployeeAttendance(date, employee_id)
            //     if (employeeAttendance) {
            //         let prReport = await Model.getEmployeeAttendanceReport(moment(employeeAttendance.date).format('YYYY-MM-DD'), employee_id, organization_id);
            //         projectTask.status = 1;
            //         projectTask.task_working_status.push({
            //             start_time: taskStartTime,
            //             productivity_report_id: prReport._id
            //         })
            //         await projectTask.save();
            //     }
            //     else {
            //         // Create Attendance Record and start application tracking.
            //         let response = await Model.createAttendanceRecord(employee_id, organization_id, date, taskStartTime);
            //         //response.insertId
            //         let prReport = await Model.createEmployeeProductivityReport(department_id, location_id, employee_id, organization_id, date, taskStartTime);

            //         projectTask.status = 1;
            //         projectTask.task_working_status.push({
            //             start_time: taskStartTime,
            //             productivity_report_id: prReport._id
            //         })
            //         await projectTask.save();
            //     }
            // }

            return res.status(200).json({ code: 200, data: projectTask, error: null, message: translate.find(i => i.id == 16)[language || 'en'] });
        } catch (error) {
            next(error);
        }
    }


    async deleteProjectTask(req, res, next) {
        try {
            let taskEndTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let taskEndIsoString = moment().utc().toISOString();
            let { organization_id, user_id, language, timezone } = req.decoded;
            let { _id: task_id } = await ValidateProjects.validateDeleteProject().validateAsync(req.query);

            let projectTask = await ProjectModel.findTaskById({ _id: task_id });
            if (!projectTask) return res.status(404).json({ code: 404, error: null, data: null, message: translate.find(i => i.id == 19)[language || 'en'] });

            let finishedFolder = await ProjectModel.findProjectFolderSameName({ title: "Finished Task", project_id: projectTask.project_id, organization_id, })
            if (!finishedFolder) {
                finishedFolder = await ProjectModel.createProjectFolder({ organization_id, project_id: projectTask.project_id, title: "Finished Task" });
                if (!finishedFolder) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 44)[language || 'en'], data: null, error: null });
            }


            if (projectTask.status === 2) {
                projectTask.folder_id = finishedFolder._id;
                projectTask.task_remaining_time = null;
                projectTask.is_deleted = true;
                projectTask.status = 3;
                await projectTask.save();
                return res.status(200).json({ code: 200, message: translate.find(i => i.id == 29)[language || 'en'], data: projectTask, error: null });
            }
            if (projectTask.status == 1) {
                let totalTaskTime = 0;

                projectTask.status = 3;
                for (const task_working_status of projectTask.task_working_status) {
                    if (task_working_status.end_time && task_working_status.start_time) continue;
                    if (!task_working_status.end_time && task_working_status.start_time) {
                        task_working_status.end_time = moment.utc(taskEndIsoString).toISOString();
                        totalTaskTime = moment(moment.utc(taskEndIsoString).toISOString()).diff(moment(task_working_status.start_time), 'second');
                        break;
                    }
                }
                projectTask.task_finished_time = taskEndIsoString;
                projectTask.total_working_time += totalTaskTime;
                projectTask.folder_id = finishedFolder._id;
                projectTask.task_remaining_time = null;
                projectTask.is_deleted = true;
                projectTask.is_desktop_running = false;
                await projectTask.save();
                return res.status(200).json({ code: 200, data: projectTask, error: null, message: translate.find(i => i.id == 17)[language || 'en'] });
            }
            else {
                projectTask.is_deleted = true;
                await projectTask.save();
            }

            return res.status(200).json({ code: 200, data: projectTask, error: null, message: translate.find(i => i.id == 17)[language || 'en'] });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    async startProjectTask(req, res, next) {
        try {
            let taskStartTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let taskActiveTimeIso = moment().utc().toISOString();

            let { timezone, employee_id, organization_id, department_id, location_id, user_id, language } = req.decoded;

            let task_id = req.query.task_id;
            if (!task_id) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 39)[language || 'en'], data: null, error: null });

            let isRunningTask = await ProjectModel.findRunningTask(employee_id);
            if (isRunningTask !== null) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 40)[language || 'en'], data: null, error: null });

            let projectTask = await ProjectModel.findTaskById({ _id: task_id });
            if (!projectTask) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 19)[language || 'en'], data: null, error: null });
            if (projectTask.is_mobile_running) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 55)[language || 'en'], data: null, error: null });
            if ([3].includes(projectTask.status)) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 27)[language || 'en'], data: null, error: null });

            let date = moment.tz(timezone).format('YYYY-MM-DD');
            let [employeeAttendance] = await ProjectModel.getEmployeeAttendance(date, employee_id)
            if (employeeAttendance) {
                let prReport = await ProjectModel.getEmployeeAttendanceReport(moment(employeeAttendance.date).format('YYYY-MM-DD'), employee_id, organization_id);
                projectTask.status = 1;
                projectTask.task_working_status.push({
                    start_time: taskActiveTimeIso,
                    productivity_report_id: prReport._id,
                    is_desktop_task: true
                })
                projectTask.is_desktop_running = true;
                await projectTask.save();
            }
            else {
                // Create Attendance Record and start application tracking.
                let response = await ProjectModel.createAttendanceRecord(employee_id, organization_id, date, taskStartTime);
                //response.insertId
                let prReport = await ProjectModel.createEmployeeProductivityReport(department_id, location_id, employee_id, organization_id, date, taskStartTime);

                projectTask.status = 1;
                projectTask.task_working_status.push({
                    start_time: taskActiveTimeIso,
                    productivity_report_id: prReport._id,
                    is_desktop_task: true
                })
                projectTask.is_desktop_running = true;
                await projectTask.save();
            }
            return res.status(200).json({ code: 200, message: translate.find(i => i.id == 28)[language || 'en'], data: projectTask, error: null });
        }
        catch (error) {
            next(error);
        }
    }

    async stopProjectTask(req, res, next) {
        try {
            let taskEndTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let taskActiveTimeIso = moment().utc().toISOString();

            let { timezone, employee_id, organization_id, department_id, location_id, user_id, language } = req.decoded;

            let task_id = req.query.task_id;
            if (!task_id) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 39)[language || 'en'], data: null, error: null });

            let projectTask = await ProjectModel.findTaskById({ _id: task_id });
            if (!projectTask) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 19)[language || 'en'], data: null, error: null });
            if (projectTask.is_mobile_running) return res.status(400).json({ code: 400, message: translate.find(i => i.id == 55)[language || 'en'], data: null, error: null });
            if ([0, 2, 3].includes(projectTask.status)) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 27)[language || 'en'], data: null, error: null });

            let date = moment.tz(timezone).format('YYYY-MM-DD');

            let [employeeAttendance] = await ProjectModel.getEmployeeAttendance(date, employee_id)
            if (employeeAttendance) {
                let prReport = await ProjectModel.getEmployeeAttendanceReport(moment(employeeAttendance.date).format('YYYY-MM-DD'), employee_id, organization_id, false);

                let totalTaskTime = 0;
                projectTask.status = 2;
                for (const task_working_status of projectTask.task_working_status) {
                    if (task_working_status.end_time && task_working_status.start_time) continue;
                    if (!task_working_status.end_time && task_working_status.start_time) {
                        task_working_status.end_time = moment.utc(taskActiveTimeIso).toISOString();
                        totalTaskTime = moment(moment.utc(taskActiveTimeIso).toISOString()).diff(moment(task_working_status.start_time), 'second');
                    }
                }
                projectTask.total_working_time += totalTaskTime;
                projectTask.task_remaining_time = null;
                projectTask.is_desktop_running = false;
                await projectTask.save();
                // prReport.productive_duration += totalTaskTime;
                // prReport.logged_duration += totalTaskTime;
                // await prReport.save();
                // await ProjectModel.updateEmployeeAttendance(employee_id, organization_id, employeeAttendance.attendance_id, taskEndTime);
                return res.status(200).json({ code: 200, message: translate.find(i => i.id == 30)[language || 'en'], data: projectTask, error: null });
            }
            else return res.status(404).json({ code: 404, message: translate.find(i => i.id == 42)[language || 'en'], error: null, data: null });
        }
        catch (error) {
            console.log(error)
            next(error);
        }
    }

    async finishedProjectTask(req, res, next) {
        try {
            let taskEndTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let taskActiveTimeIso = moment().utc().toISOString();
            let taskEndIsoString = moment().utc().toISOString();

            let { timezone, employee_id, organization_id, department_id, location_id, user_id, language } = req.decoded;

            let task_id = req.query.task_id;
            if (!task_id) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 39)[language || 'en'], data: null, error: null });

            let projectTask = await ProjectModel.findTaskById({ _id: task_id });
            if (!projectTask) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 19)[language || 'en'], data: null, error: null });
            if(projectTask.status == 1 && projectTask.is_mobile_running) return res.status(401).json({ code: 401, data: null, error: null, message: translate.find(i=> i.id == 55)[language || 'en']})
            if ([0].includes(projectTask.status)) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 56)[language || 'en'], data: null, error: null });
            if ([3].includes(projectTask.status)) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 27)[language || 'en'], data: null, error: null });

            let finishedFolder = await ProjectModel.findProjectFolderSameName({ title: "Finished Task", project_id: projectTask.project_id, organization_id, });
            if (!finishedFolder) {
                finishedFolder = await ProjectModel.createProjectFolder({ organization_id, project_id: projectTask.project_id, title: "Finished Task" });
                if (!finishedFolder) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 44)[language || 'en'], data: null, error: null });
            }

            if (projectTask.status === 2) {
                projectTask.folder_id = finishedFolder._id;
                projectTask.task_remaining_time = null;
                projectTask.status = 3;
                projectTask.task_finished_time = taskEndIsoString;
                await projectTask.save();
                return res.status(200).json({ code: 200, message: translate.find(i => i.id == 29)[language || 'en'], data: projectTask, error: null });
            }
            let date = moment.tz(timezone).format('YYYY-MM-DD');
            let [employeeAttendance] = await ProjectModel.getEmployeeAttendance(date, employee_id);
            if (employeeAttendance) {
                let prReport = await ProjectModel.getEmployeeAttendanceReport(moment(employeeAttendance.date).format('YYYY-MM-DD'), employee_id, organization_id);

                let totalTaskTime = 0;
                projectTask.status = 3;
                for (const task_working_status of projectTask.task_working_status) {
                    if (task_working_status.end_time && task_working_status.start_time) continue;
                    if (!task_working_status.end_time && task_working_status.start_time) {
                        task_working_status.end_time = moment.utc(taskEndIsoString).toISOString();
                        totalTaskTime = moment(moment.utc(taskEndIsoString).toISOString()).diff(moment(task_working_status.start_time), 'second');
                    }
                }
                projectTask.task_finished_time = taskEndIsoString;
                projectTask.total_working_time += totalTaskTime;
                projectTask.folder_id = finishedFolder._id;
                projectTask.task_remaining_time = null;
                await projectTask.save();
                // prReport.productive_duration += totalTaskTime;
                // prReport.logged_duration += totalTaskTime;
                // await prReport.save();
                // await ProjectModel.updateEmployeeAttendance(employee_id, organization_id, employeeAttendance.attendance_id, taskEndTime);

                return res.status(200).json({ code: 200, message: translate.find(i => i.id == 29)[language || 'en'], data: projectTask, error: null });
            }
            else return res.status(404).json({ code: 404, message: translate.find(i => i.id == 42)[language || 'en'], error: null, data: null });
        }
        catch (error) {
            next(error);
        }
    }

    async addRemainingTime(req, res, next) {
        try {
            let taskTime = moment().utc();
            let { organization_id, user_id, employee_id, language } = req.decoded;
            let { remaining_time, task_id } = await ValidateProjects.validateTaskRemainingTime().validateAsync(req.body);
            taskTime = taskTime.add(remaining_time, 'seconds');

            let projectTask = await ProjectModel.findTaskById({ _id: task_id });
            if (!projectTask) return res.status(404).json({ code: 404, error: null, data: null, message: translate.find(i => i.id == 19)[language || 'en'] });
            if (projectTask.assigned_user !== employee_id) return res.status(404).json({ code: 404, error: null, data: null, message: translate.find(i => i.id == 26)[language || 'en'] });

            projectTask.task_remaining_time = taskTime
            await projectTask.save();

            return res.status(200).json({ code: 200, data: null, message: translate.find(i => i.id == 1)[language || 'en'], error: null });
        }
        catch (error) {
            next(error);
        }
    }

}
module.exports = new ProjectController;

function sendResponse(res, code, data, message, error) {
    return res
        .json({
            code: code,
            message: message,
            error: error,
            data: data
        });
};

function sendNewResponse(res, code, data, message, error) {
    return res.status(code || 400)
        .json({
            code: code,
            message: message,
            error: error,
            data: data
        });
};
