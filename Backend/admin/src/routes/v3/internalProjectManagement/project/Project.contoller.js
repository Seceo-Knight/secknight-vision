const Validation = require('./ProjectValidation');
const ProjectModel = require('./Project.model');
const ProjectTask = require('../task/Task.model');
const moment = require('moment');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const sendResponse = require('../../../../utils/myService').sendResponse;
const actionsTracker = require('../../services/actionsTracker');
const _ = require('underscore')
const { projectMessages } = require("../../../../utils/helpers/LanguageTranslate")
const getMessage = require('../../../../utils/messageTranslation').translate;

const maskingIP = require('../../../../utils/helpers/IPMasking');

// const getMessage = async (id, language) => {
//     return (await projectMessages.find(x => x.id === id)[language] || await projectMessages.find(x => x.id === id)["en"])
// }

class ProjectController {

    async addProject(req, res) {

        const created_by = req.decoded.user_id;
        const name = req.body.name;
        let user_ids = req.body.user_ids || [];
        const organization_id = req.decoded.organization_id;
        const description = req.body.description || "";
        const manager_id = req.body.manager_id || req.decoded.is_manager ? req.decoded.user_id : null;
        let date = moment().format("YYYY-MM-DD");
        const language = req.decoded.language;
        try {
            let validate = Validation.addProject(name, user_ids, organization_id, req.body.start_date, req.body.end_date, description, manager_id);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            user_ids = _.unique(user_ids);
            user_ids = user_ids.map(x => +x);
            const start_date = moment(req.body.start_date).format('YYYY-MM-DD');
            const end_date = moment(req.body.end_date).format('YYYY-MM-DD');

            let check_name = await getProjectByname(name, organization_id);
            if (check_name.length > 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "2")[language] || projectMessages.find(x => x.id === "2")["en"], null);
            }

            if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !moment(start_date).isSameOrBefore(end_date)) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
            }

            if (user_ids.length > 0) {
                const employeeIds = await ProjectModel.checkUsers(user_ids);
                if (employeeIds.length == 0) return sendResponse(res, 400, user_ids, projectMessages.find(x => x.id === "4")[language] || projectMessages.find(x => x.id === "4")["en"], null);

                const nonOgrEmps = employeeIds.filter(i => i.organization_id != organization_id);
                if (nonOgrEmps.length > 0) return sendResponse(res, 400, _.pluck(nonOgrEmps, "user_id"), projectMessages.find(x => x.id === "5")[language] || projectMessages.find(x => x.id === "5")["en"], null);

                const nonExistEmp = user_ids.filter(item1 =>
                    !employeeIds.some(item2 => (item2.user_id === item1)))
                if (nonExistEmp.length > 0) return sendResponse(res, 400, nonExistEmp, projectMessages.find(x => x.id === "6")[language] || projectMessages.find(x => x.id === "6")["en"], null);
            }


            const add_project = await ProjectModel.addProject(name, organization_id, start_date, end_date, description, manager_id, created_by)
            if (!add_project) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "7")[language] || projectMessages.find(x => x.id === "7")["en"], null);
            } else if (add_project.affectedRows != 0) {

                const project_users = user_ids.map(id => [id, add_project.insertId, created_by])
                const add_user_to_project = await ProjectModel.addUserToProject(project_users);
                if (!add_user_to_project) {
                    return sendResponse(res, 400, null, projectMessages.find(x => x.id === "8")[language] || projectMessages.find(x => x.id === "8")["en"], null);
                } else {
                    req.body.id = add_project.insertId;
                    actionsTracker(req, 'Project %i added.', [req.body.id]);
                    return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "9")[language] || projectMessages.find(x => x.id === "9")["en"], null);
                }

            } else {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "7")[language] || projectMessages.find(x => x.id === "7")["en"], null);
            }
        } catch (err) {
            let msg = getMessage(projectMessages, "7", language) || "Something went wrong."
            return sendResponse(res, 400, null, msg, msg);
        }
    }

    async getProjects(req, res) {
        const project_id = req.body.project_id || null;
        const is_project = req.body.project_id ? true : false;
        const organization_id = req.decoded.organization_id;
        let project_list = [];
        const language = req.decoded.language;
        actionsTracker(req, 'Get project %i details.', [project_id]);

        let status = req.body.status || '0,1,2,3';
        status = req.body.status == 0 ? 0 : status;
        try {
            let validate = Validation.getProject(project_id, organization_id, req.body.status);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const get_projects = await ProjectModel.getProjects(project_id, is_project, organization_id, status);
            if (get_projects.length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "10")[language] || projectMessages.find(x => x.id === "10")["en"], null);
            } else {
                for (const projects_itr of get_projects) {
                    let result = await Promise.all([
                        ProjectModel.getProjectEmp(projects_itr.id),
                        ProjectModel.getProjectTasks(projects_itr.id),
                        ProjectModel.getProjectTimeSpent(projects_itr.id),
                        ProjectModel.getProjectModuleCount(projects_itr.id),
                    ])
                    projects_itr.tasks = result[1][0].tasks
                    projects_itr.modules = result[3][0].modules
                    projects_itr.employees = result[0][0].employees
                    projects_itr.time = result[2][0].time || "00:00:00"
                    project_list.push(projects_itr)
                }

                return sendResponse(res, 200, project_list, projectMessages.find(x => x.id === "11")[language] || projectMessages.find(x => x.id === "11")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "12")[language] || projectMessages.find(x => x.id === "12")["en"], null);
        }
    }

    async updateProject(req, res) {
        const organization_id = req.decoded.organization_id;
        const project_id = req.body.project_id;
        let date = moment().format("YYYY-MM-DD");
        let employee_ids = req.body.user_ids || [];
        const created_by = req.decoded.user_id;
        const language = req.decoded.language;
        try {
            let validate = Validation.UpdateProject(project_id, req.body.name, req.body.status, req.body.start_date, req.body.end_date, req.body.description, req.body.progress, employee_ids);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);
            const get_projects = await ProjectModel.getSingleProject(project_id, organization_id);
            if (get_projects.length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "13")[language] || projectMessages.find(x => x.id === "13")["en"], null);
            } else {


                let name = req.body.name || get_projects[0].name;
                let status = req.body.status || get_projects[0].status;
                let start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') : moment(get_projects[0].start_date).format('YYYY-MM-DD');
                let end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') : moment(get_projects[0].end_date).format('YYYY-MM-DD');
                let description = req.body.description || get_projects[0].description;
                let progress = req.body.progress || get_projects[0].progress;
                if (req.body.name) {
                    let check_name = await getProjectByname(name, organization_id);
                    if (check_name.length > 0) {
                        return sendResponse(res, 400, null, projectMessages.find(x => x.id === "2")[language] || projectMessages.find(x => x.id === "2")["en"], null);
                    }
                }

                if (req.body.start_date || req.body.end_date) {
                    if (req.body.start_date && !req.body.end_date) {
                        if (!moment(date).isSameOrBefore(start_date)) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "14")[language] || projectMessages.find(x => x.id === "14")["en"], null);
                        }
                    } else if (!req.body.start_date && req.body.end_date) {
                        if (!moment(date).isSameOrBefore(end_date)) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "15")[language] || projectMessages.find(x => x.id === "15")["en"], null);
                        }
                    } else {
                        if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !moment(start_date).isSameOrBefore(end_date)) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
                        }
                    }

                }

                if (employee_ids.length > 0) {
                    employee_ids = _.unique(employee_ids);
                    employee_ids = employee_ids.map(x => +x);
                    const employeeIds = await ProjectModel.checkUsers(employee_ids);
                    if (employeeIds.length == 0) return sendResponse(res, 400, employeeIds, projectMessages.find(x => x.id === "4")[language] || projectMessages.find(x => x.id === "4")["en"], null);

                    const nonOgrEmps = employeeIds.filter(i => i.organization_id != organization_id);
                    if (nonOgrEmps.length > 0) return sendResponse(res, 400, _.pluck(nonOgrEmps, "user_id"), projectMessages.find(x => x.id === "5")[language] || projectMessages.find(x => x.id === "5")["en"], null);

                    const nonExistEmp = employee_ids.filter(item1 =>
                        !employeeIds.some(item2 => (item2.user_id === item1)))
                    if (nonExistEmp.length > 0) return sendResponse(res, 400, nonExistEmp, projectMessages.find(x => x.id === "6")[language] || projectMessages.find(x => x.id === "6")["en"], null);
                }

                const update_project = await ProjectModel.updateProject(project_id, name, status, start_date, end_date, description, progress, created_by);
                if (!update_project) {
                    return sendResponse(res, 400, null, projectMessages.find(x => x.id === "13")[language] || projectMessages.find(x => x.id === "13")["en"], null);
                } else if (update_project.affectedRows > 0) {
                    if (employee_ids.length > 0) {
                        const removeProjectEmp = await ProjectModel.deleteProjectEmplyees(project_id);
                        if (removeProjectEmp) {
                            let projectEmpList = employee_ids.map(i => ([i, project_id, created_by]))
                            await ProjectModel.addUserToProject(projectEmpList);
                        }
                    }
                    actionsTracker(req, 'Project %i updated.', [project_id]);
                    return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "16")[language] || projectMessages.find(x => x.id === "16")["en"], null);
                }
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "13")[language] || projectMessages.find(x => x.id === "13")["en"], null);
            }
        } catch (err) {
            let msg = getMessage(projectMessages, "13", language);
            return sendResponse(res, 400, null, msg, msg);
        }
    }

    async getProjectEmployess(req, res) {
        const project_id = req.body.project_id;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        actionsTracker(req, 'Get project %i members.', [project_id]);
        try {
            let validate = Validation.idValidation(project_id);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const get_projects_employees = await ProjectModel.getProjectEmployess(project_id, organization_id);
            if (get_projects_employees.length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "17")[language] || projectMessages.find(x => x.id === "17")["en"], null);
            } else {
                return sendResponse(res, 200, get_projects_employees, projectMessages.find(x => x.id === "18")[language] || projectMessages.find(x => x.id === "18")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "19")[language] || projectMessages.find(x => x.id === "19")["en"], null);
        }
    }

    async deleteProject(req, res) {
        const project_ids = req.body.project_ids;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        try {
            let validate = Validation.idsValidation(project_ids);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const delete_project = await ProjectModel.deleteProject(project_ids, organization_id);
            console.log(delete_project)
            if (!delete_project) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "20")[language] || projectMessages.find(x => x.id === "20")["en"], null);
            } else if (delete_project.affectedRows) {
                actionsTracker(req, 'Projects ? deleted.', [project_ids]);
                return sendResponse(res, 200, null, projectMessages.find(x => x.id === "21")[language] || projectMessages.find(x => x.id === "21")["en"], null);
            }
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "20")[language] || projectMessages.find(x => x.id === "20")["en"], null);

        } catch (err) {
            return sendResponse(res, 401, null, projectMessages.find(x => x.id === "20")[language] || projectMessages.find(x => x.id === "20")["en"], null);
        }
    }

    async createProjectModule(req, res) {
        const created_by = req.decoded.user_id;
        const name = req.body.name;
        const project_id = req.body.project_id;
        const organization_id = req.decoded.organization_id;
        const description = req.body.description || null;
        let date = moment().format("YYYY-MM-DD");
        const language = req.decoded.language;
        try {
            let validate = Validation.addProjectModule(name, project_id, created_by, req.body.start_date, req.body.end_date, description);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const start_date = moment(req.body.start_date).format('YYYY-MM-DD');
            const end_date = moment(req.body.end_date).format('YYYY-MM-DD');

            let check_name = await getModuleByName(name, project_id);
            if (check_name.length > 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "22")[language] || projectMessages.find(x => x.id === "22")["en"], null);
            }

            let project_data = await ProjectModel.getSingleProject(project_id, organization_id);
            if (project_data.length <= 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "23")[language] || projectMessages.find(x => x.id === "23")["en"], null);
            }
            if (start_date && end_date) {
                let project_start_date = moment(project_data[0].start_date).format('YYYY-MM-DD');
                let project_end_date = moment(project_data[0].end_date).format('YYYY-MM-DD');

                let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_before = moment(start_date).isSameOrBefore(end_date);

                if (!is_start_date || !is_end_date) {
                    return sendResponse(res, 400, null, projectMessages.find(x => x.id === "24")[language] || projectMessages.find(x => x.id === "24")["en"], null);
                }
                else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                    return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
                }
            }

            const add_project_module = await ProjectModel.addProjectModule(name, project_id, created_by, start_date, end_date, description);
            if (!add_project_module) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "23")[language] || projectMessages.find(x => x.id === "23")["en"], null);
            } else if (add_project_module.affectedRows) {
                req.body.id = add_project_module.insertId;
                actionsTracker(req, 'Project %i module %i added.', [project_id, req.body.id]);
                return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "25")[language] || projectMessages.find(x => x.id === "25")["en"], null);
            }
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "23")[language] || projectMessages.find(x => x.id === "23")["en"], null);
        } catch (err) {
            let msg = getMessage(projectMessages, "23", language) || "somthing went wrong.";
            return sendResponse(res, 400, null, msg, msg);
        }

    }

    async getProjectModule(req, res) {

        const { organization_id, language } = req.decoded;
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 10;
        const { project_id, module_id, status, searchValue, sortOrder, sortColumn } = req.body

        let column;
        let order;

        if (sortOrder === 'D') {
            order = `DESC`;
        } else {
            order = `ASC`;
        }

        switch (sortColumn) {
            case 'Module Name':
                column = `pm.name`
                break;
            case 'Tasks':
                column = `taskCount`
                break;
            case 'Status':
                column = `pm.status`
                break;
            case 'Created Date':
                column = `pm.created_at`
                break;
            case 'Start Date':
                column = `pm.start_date`
                break;
            case 'End Date':
                column = `pm.end_date`
                break;
            default:
                column = `pm.id`;
                order = `DESC`
                break;
        }

        actionsTracker(req, 'Project %i module %i requested.', [project_id, module_id]);
        try {
            let validate = Validation.getProjectModule(project_id, module_id, req.body.status, sortColumn, sortOrder, searchValue, skip, limit);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            let project_modules = await ProjectModel.getProjectModule(project_id, module_id, status, organization_id, searchValue, order, column, skip, limit);

            const total_count = project_modules.length > 0 ? project_modules[0].total_count : 0;
            if (project_modules.length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "26")[language] || projectMessages.find(x => x.id === "26")["en"], null);
            } else {
                return res.json({ code: 200, data: project_modules, totalCount: total_count, message: projectMessages.find(x => x.id === "27")[language] || projectMessages.find(x => x.id === "27")["en"], error: null });
            }

        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "28")[language] || projectMessages.find(x => x.id === "28")["en"], null);
        }
    }

    async updaeProjectModule(req, res) {
        const module_id = req.body.module_id;
        let name = req.body.name;
        let status = req.body.status;
        let date = moment().format("YYYY-MM-DD");
        const language = req.decoded.language;
        try {
            let validate = Validation.updateProjectModule(module_id, name, status, req.body.start_date, req.body.end_date);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            let start_date = moment(req.body.start_date).format('YYYY-MM-DD');
            let end_date = moment(req.body.end_date).format('YYYY-MM-DD');

            const project_module = await ProjectModel.getModuleById(module_id);
            if (project_module.length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "26")[language] || projectMessages.find(x => x.id === "26")["en"], null);
            } else {
                if (req.body.start_date || req.body.end_date) {

                    let project_start_date = moment(project_module[0].project_start_date).format('YYYY-MM-DD');
                    let project_end_date = moment(project_module[0].project_end_date).format('YYYY-MM-DD');

                    if (req.body.start_date && !req.body.end_date) {
                        let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                        if (!is_start_date) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "29")[language] || projectMessages.find(x => x.id === "29")["en"], null);
                        }
                        else if (!moment(date).isSameOrBefore(start_date)) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "14")[language] || projectMessages.find(x => x.id === "14")["en"], null);
                        }
                    } else if (!req.body.start_date && req.body.end_date) {
                        let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                        if (!is_end_date) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "30")[language] || projectMessages.find(x => x.id === "30")["en"], null);
                        }
                        else if (!moment(date).isSameOrBefore(end_date)) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "15")[language] || projectMessages.find(x => x.id === "15")["en"], null);
                        }
                    } else {

                        let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                        let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                        let is_before = moment(start_date).isSameOrBefore(end_date);

                        if (!is_start_date || !is_end_date) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "24")[language] || projectMessages.find(x => x.id === "24")["en"], null);
                        }
                        else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
                        }
                    }

                }

                start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') : moment(project_module[0].start_date).format("YYYY-MM-DD");
                end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') : moment(project_module[0].end_date).format("YYYY-MM-DD");
                name = name || project_module[0].name;
                status = status || project_module[0].status;

                if (req.body.name) {
                    let check_name = await getModuleByName(name, project_module[0].project_id);
                    if (check_name.length > 0) {
                        return sendResponse(res, 400, null, projectMessages.find(x => x.id === "22")[language] || projectMessages.find(x => x.id === "22")["en"], null);
                    }
                }

                const update_project_module = await ProjectModel.updateProjectModule(module_id, name, status, start_date, end_date);
                if (!update_project_module) {
                    return sendResponse(res, 400, null, projectMessages.find(x => x.id === "31")[language] || projectMessages.find(x => x.id === "31")["en"], null);
                } else if (update_project_module.affectedRows > 0) {
                    actionsTracker(req, 'Project module %i updated.', [module_id]);
                    return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "32")[language] || projectMessages.find(x => x.id === "32")["en"], null);
                }
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "31")[language] || projectMessages.find(x => x.id === "31")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "31")[language] || projectMessages.find(x => x.id === "31")["en"], null);
        }

    }

    async deleteProjectModule(req, res) {
        const module_ids = req.body.module_ids;
        const language = req.decoded.language;
        try {
            let validate = Validation.idsValidation(module_ids);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const delete_module = await ProjectModel.deleteProjectModule(module_ids);
            if (!delete_module) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "33")[language] || projectMessages.find(x => x.id === "33")["en"], null);
            } else if (delete_module.affectedRows > 0) {
                actionsTracker(req, 'Project modules ? deleted.', [module_ids]);
                return sendResponse(res, 200, null, projectMessages.find(x => x.id === "34")[language] || projectMessages.find(x => x.id === "34")["en"], null);
            }
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "33")[language] || projectMessages.find(x => x.id === "33")["en"], null);
        } catch (err) {
            console.log(err)
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "33")[language] || projectMessages.find(x => x.id === "33")["en"], null);
        }
    }

    async addEmployeesToProject(req, res) {
        const project_id = req.body.project_id;
        const Employee_ids = req.body.user_ids;
        const created_by = req.decoded.user_id;
        const language = req.decoded.language;
        try {
            let validate = Validation.addEmployeesToProject(project_id, Employee_ids);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const chek_Employee = await ProjectModel.getProjectEmployeeById(project_id, Employee_ids);
            if (chek_Employee.length > 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "35")[language] || projectMessages.find(x => x.id === "35")["en"], null);
            }

            const project_users = Employee_ids.map(id => [id, project_id, created_by])
            const add_user_to_project = await ProjectModel.addUserToProject(project_users);
            if (!add_user_to_project) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "36")[language] || projectMessages.find(x => x.id === "36")["en"], null);
            } else if (add_user_to_project.affectedRows > 0) {
                actionsTracker(req, 'Employees ? added to project %i.', [Employee_ids, project_id]);
                return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "18")[language] || projectMessages.find(x => x.id === "18")["en"], null);
            }
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "36")[language] || projectMessages.find(x => x.id === "36")["en"], null);
        } catch (err) {
            let msg = getMessage(projectMessages, "36", language) || "somthing went wrong.";
            return sendResponse(res, 400, null, msg, msg);
        }
    }

    async deleteEmplyeesFromProject(req, res) {
        const project_id = req.body.project_id;
        const Employee_ids = req.body.user_ids;
        const language = req.decoded.language;
        try {
            let validate = Validation.addEmployeesToProject(project_id, Employee_ids);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const delete_project_emp = await ProjectModel.deleteEmplyeesFromProject(project_id, Employee_ids);
            if (!delete_project_emp) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "37")[language] || projectMessages.find(x => x.id === "37")["en"], null);
            } else if (delete_project_emp.affectedRows > 0) {
                actionsTracker(req, 'Employees ? deleted form project %i.', [Employee_ids, project_id]);
                return sendResponse(res, 200, null, projectMessages.find(x => x.id === "38")[language] || projectMessages.find(x => x.id === "38")["en"], null);
            }
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "37")[language] || projectMessages.find(x => x.id === "37")["en"], null);
        } catch (err) {
            console.log(err)
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "37")[language] || projectMessages.find(x => x.id === "37")["en"], null);
        }
    }

    async getProductionTime(req, res) {
        const project_id = req.body.project_id;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        actionsTracker(req, 'Get project %i production time.', [project_id]);
        try {
            let validate = Validation.idValidation(project_id);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            const project_tasks_ids = await ProjectModel.getProjectTaskIds(project_id, organization_id, null);
            if (project_tasks_ids.length == 0) return sendResponse(res, 200, { project_time: '00:00:00', productive: '00:00:00', unproductive: '00:00:00', neutral: '00:00:00', idle: "00:00:00", productivity: 0, total_time: '00:00:00' }, projectMessages.find(x => x.id === "11")[language] || projectMessages.find(x => x.id === "11")["en"], null);
            let task_ids = project_tasks_ids.map(task => task.id)
            let result = await Promise.all([
                ProjectModel.getProjectTimeByTask(task_ids),
                ProjectModel.getProductionTime(task_ids,organization_id),
            ])
            let neu = '00:00:00';
            let total_time = '00:00:00'
            let idle = '00:00:00'
            if (result[0].length > 0) {
                let project_time = result[0][0].project_total_time != null ? await secToTime(result[0][0].project_total_time) : '00:00:00'
                let productive = '00:00:00';
                let unproductivity = '00:00:00';
                let productivity = 0;
                if (result[1].length) {
                    if (result[1][0]) {
                        productive = await secToTime(result[1][0].pro) || '00:00:00';
                        unproductivity = await secToTime(result[1][0].non) || '00:00:00';
                        neu = await secToTime(result[1][0].neu) || '00:00:00';
                        idle = await secToTime(result[1][0].idle) || '00:00:00';
                        total_time = await secToTime(result[1][0].total) || '00:00:00';
                        let total = result[1][0].total;
                        if (total) {
                            productivity = (result[1][0].pro / total) * 100
                            productivity = Math.floor(productivity);
                        }
                    }
                }
                return sendResponse(res, 200, { project_time, productive, unproductive: unproductivity, neutral: neu, idle, productivity, total_time },
                    projectMessages.find(x => x.id === "39")[language] || projectMessages.find(x => x.id === "39")["en"], null);
            }
            return sendResponse(res, 200, { project_time: '00:00:00', productive: '00:00:00', unproductive: '00:00:00', neutral: '00:00:00', idle, productivity: 0, total_time },
                projectMessages.find(x => x.id === "39")[language] || projectMessages.find(x => x.id === "39")["en"], null);
        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "40")[language] || projectMessages.find(x => x.id === "40")["en"], null);
        }





    }

    async getProjectTaksAndEmp(req, res) {
        const project_id = req.body.project_id;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        actionsTracker(req, 'Project %i tasks and employees requested.', [project_id]);

        try {
            let validate = Validation.idValidation(project_id);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            let result = await Promise.all([
                ProjectModel.getProjectEmployess(project_id, organization_id),
                ProjectModel.getProjectTask(project_id, organization_id),// taks 1,2,3,4
            ])
            if (result[0].length == 0 && result[1].length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "41")[language] || projectMessages.find(x => x.id === "41")["en"], null);
            }
            return sendResponse(res, 200, { employees: result[0], tasks: result[1] }, projectMessages.find(x => x.id === "42")[language] || projectMessages.find(x => x.id === "42")["en"], null);
        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "43")[language] || projectMessages.find(x => x.id === "43")["en"], null);
        }
    }
    async getCompleateProjectDatils(req, res) {
        const project_id = req.query.project_id;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        actionsTracker(req, 'Project %i compleate details requested.', [project_id]);

        try {
            let validate = Validation.idValidation(project_id);
            if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

            let result = await Promise.all([
                ProjectModel.getProjectEmployess(project_id, organization_id),
                ProjectModel.getProjectTask(project_id, organization_id),
                ProjectModel.getSingleProject(project_id, organization_id),
                ProjectModel.getProjectModule(project_id, null, null, organization_id)
            ])
            if (result[0].length == 0 && result[1].length == 0 && result[2].length == 0 && result[3].length == 0) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "41")[language] || projectMessages.find(x => x.id === "41")["en"], null);
            }
            return sendResponse(res, 200, { ...result[2][0], employees: result[0], tasks: result[1], modules: result[3] }, projectMessages.find(x => x.id === "42")[language] || projectMessages.find(x => x.id === "42")["en"], null);
        } catch (err) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "43")[language] || projectMessages.find(x => x.id === "43")["en"], null);
        }
    }

    async projects(req, res, next) {
        try {
            let { project_id, status, sortColumn, sortOrder, searchValue, skip, limit } = await Validation.projects().validateAsync(req.body);
            if (status || status == 0) status = status.toString()
            const { employee_id, user_id, organization_id, language } = req.decoded;
            let created_by = employee_id ? user_id : null
            actionsTracker(req, 'Get project %i details.', [project_id]);
            let column;
            let order;

            if (sortOrder === 'D') {
                order = `DESC`;
            } else {
                order = `ASC`;
            }

            switch (sortColumn) {
                case 'Project Name':
                    column = `name`
                    break;
                case 'Start Date':
                    column = `start_date`
                    break;
                case 'End Date':
                    column = `end_date`
                    break;
                case 'Productive Time':
                    column = `time`
                    break;
                case 'Progress':
                    column = `progress`
                    break;
                case 'Status':
                    column = `status`
                    break;
                case 'Assignees':
                    column = `employees`
                    break;
                case 'Modules':
                    column = `modules`
                    break;
                case 'Tasks':
                    column = `tasks`
                    break;
                default:
                    column = `created_at`;
                    order = `DESC`
                    break;
            }
            let projects = [];
            switch (sortColumn) {
                case 'Productive Time':
                    projects = await ProjectModel.projectsWithTimesheet(project_id, organization_id, status, column, order, searchValue, skip, limit, created_by);
                    break;
                case 'Assignees':
                    projects = await ProjectModel.projectsWithemp(project_id, organization_id, status, column, order, searchValue, skip, limit, created_by);
                    break;
                case 'Modules':
                    projects = await ProjectModel.projectsWithModules(project_id, organization_id, status, column, order, searchValue, skip, limit, created_by);
                    break;
                case 'Tasks':
                    projects = await ProjectModel.projectsWithTasks(project_id, organization_id, status, column, order, searchValue, skip, limit, created_by);
                    break;
                default:
                    projects = await ProjectModel.projects(project_id, organization_id, status, column, order, searchValue, skip, limit, created_by);
                    break;
            }
            if (projects.length === 0) return sendResponse(res, 400, null, projectMessages.find(x => x.id === "10")[language] || projectMessages.find(x => x.id === "10")["en"], null);

            for (const project of projects) {
                const [projectAttibutes] = await ProjectModel.projectAttributes(project.id);
                project.tasks = project.tasks || projectAttibutes.tasks;
                project.modules = project.modules || projectAttibutes.modules;
                project.employees = project.employees || projectAttibutes.employees;
                project.time = project.time ? project.time : projectAttibutes.time || "00:00:00";
            }
            res.json({ code: 200, data: projects, totalCount: projects[0].total_count, message: projectMessages.find(x => x.id === "11")[language] || projectMessages.find(x => x.id === "11")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }

    async projectWebApps(req, res, next) {
        /**status 1-productive, 2-unproductive ,3-neutral ,4-idle,5-All */
        try {
            const { organization_id, language } = req.decoded;
            let { project_id, skip, limit, type, status, sortBy, order, search } = await Validation.projectWebApps().validateAsync(req.query);
            let tasksData, searchedTasks;
            if (search) {
                [tasksData, searchedTasks] = await Promise.all([
                    await ProjectModel.getProjectTaskIds(project_id, organization_id, null),
                    await ProjectModel.getProjectTaskIds(project_id, organization_id, search),
                ])
                searchedTasks = _.pluck(searchedTasks, "id")
            } else {
                tasksData = await ProjectModel.getProjectTaskIds(project_id, organization_id, null);
            }

            if (tasksData.length == 0) return sendResponse(res, 400, null, await getMessage(projectMessages, "49", language), null);
            const task_ids = _.pluck(tasksData, "id");

            let [reports, count] = await Promise.all([
                ProjectModel.getProejctAppWebsReports(task_ids, skip, limit, organization_id, type, status, sortBy, order, search, searchedTasks),
                ProjectModel.getProejctAppWebsReportsCount(task_ids, organization_id, type, status, search, searchedTasks)
            ])
            if (reports.length == 0) return sendResponse(res, 400, null, await getMessage(projectMessages, "57", language), null);
            reports = reports.filter(i => i.total != 0 && task_ids.includes(i.task_id));
            const apps = await ProjectModel.getApps(_.pluck(reports, "app_id"), organization_id);
            reports = reports.map(itr => ({ ...itr, task_name: tasksData.find(i => i.id == itr.task_id).name }))

            if (reports.length == 0) return sendResponse(res, 400, null, await getMessage(projectMessages, "57", language), null);
            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))){
                reports = reports.map(x => {
                    x.app = maskingIP(x.app);
                    return x;
                });
            }
            return sendResponse(res, 200, { apps: reports, skipValue: (skip || 0) + limit, count: count[0].total }, await getMessage(projectMessages, "58", language), null);
        } catch (err) {
            next(err);
        }
    }

    /**
    * Craete new project ,project module and task  .
    * @function createProject
    * @memberof ProjectController
    * @param {*} req
    * @param {*} res
    * @returns {Object} - project details .
    * @see also {@link https://service.empmonitor.com/api/v3/explorer/#/Project/post_project_create_project}
    */
    async createProject(req, res, next) {
        const { organization_id, language, user_id: created_by, employee_id } = req.decoded;
        try {
            let validate = Validation.createProject({ ...req.body });
            if (validate.error) return sendResponse(res, 404, null, await getMessage(projectMessages, "1", language), validate.error.details[0].message);

            let { name, user_ids, start_date, end_date, description, module_name,
                module_start_date, module_end_date, task_name, task_user_id, module,
                task_description, task_start_date, task_end_date, priority, status } = validate.value;

            /** Removing duplicate user ids form the list */
            user_ids = _.unique(user_ids);
            user_ids = user_ids.map(x => +x);

            //project date
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');
            // project nodule date
            module_start_date = module_end_date ? moment(module_start_date).format('YYYY-MM-DD') : module_end_date;
            module_end_date = module_end_date ? moment(module_end_date).format('YYYY-MM-DD') : module_end_date;
            // task date
            task_start_date = task_start_date ? moment(task_start_date).format('YYYY-MM-DD') : task_start_date;
            task_end_date = task_end_date ? moment(task_end_date).format('YYYY-MM-DD') : task_end_date;

            /** Cheking task duration  */
            if (task_name) {
                if (module_name) {
                    let is_start_date = moment(task_start_date).isBetween(module_start_date, module_end_date, null, '[]');
                    let is_end_date = moment(task_end_date).isBetween(module_start_date, module_end_date, null, '[]');
                    if (!is_start_date || !is_end_date) return sendResponse(res, 400, null, await getMessage(projectMessages, "45", language), null);
                } else {
                    let is_start_date = moment(task_start_date).isBetween(start_date, end_date, null, '[]');
                    let is_end_date = moment(task_end_date).isBetween(start_date, end_date, null, '[]');
                    if (!is_start_date || !is_end_date) return sendResponse(res, 400, null, await getMessage(projectMessages, "46", language), null);
                }
            }

            /** Cheking project name alredy exists or not */
            let check_name = await getProjectByname(name, organization_id);
            if (check_name.length > 0) return sendResponse(res, 400, null, await getMessage(projectMessages, "2", language), null);

            /**Validating user ids  */
            if (user_ids.length > 0) {
                const employeeIds = await ProjectModel.checkUsers(user_ids);
                if (employeeIds.length == 0) return sendResponse(res, 400, user_ids, await getMessage(projectMessages, "4", language), null);

                const nonOgrEmps = employeeIds.filter(i => i.organization_id != organization_id);
                if (nonOgrEmps.length > 0) return sendResponse(res, 400, _.pluck(nonOgrEmps, "user_id"), await getMessage(projectMessages, "5", language), null);

                const nonExistEmp = user_ids.filter(item1 =>
                    !employeeIds.some(item2 => (item2.user_id === item1)))
                if (nonExistEmp.length > 0) return sendResponse(res, 400, nonExistEmp, await getMessage(projectMessages, "6", language), null);
            }

            /** Inseting Project details */
            const add_project = await ProjectModel.addProject(name, organization_id, start_date, end_date, description, null, created_by)
            if (!add_project || add_project.affectedRows == 0) return sendResponse(res, 400, null, await getMessage(projectMessages, "7", language), null);
            req.body = { id: add_project.insertId, ...req.body };

            /**Adding employee to project */
            const project_users = user_ids.map(id => [id, add_project.insertId, created_by]);
            const add_user_to_project = await ProjectModel.addUserToProject(project_users);

            if (!add_user_to_project || add_user_to_project.affectedRows === 0) {
                await ProjectModel.deleteProject([req.body.id], organization_id);
                return sendResponse(res, 400, null, await getMessage(projectMessages, "8", language), null);
            }

            /**Adding Project Module */
            if (module_name) {
                const projectModule = await ProjectModel.addProjectModule(module_name, add_project.insertId, created_by, module_start_date, module_end_date, description);
                if (!projectModule || projectModule.affectedRows === 0) {
                    await ProjectModel.deleteProject([req.body.id], organization_id)
                    return sendResponse(res, 400, null, await getMessage(projectMessages, "23", language), null);
                } else {
                    req.body = { project_module_id: projectModule.insertId || null, ...req.body };
                }
            }

            /** Adding tasks */
            if (task_name) {
                const taskData = await ProjectTask.createTask(task_name, task_user_id, add_project.insertId, req.body.project_module_id || null, task_description, task_start_date, task_end_date, created_by, priority, status);
                if (!taskData || taskData.affectedRows === 0) {
                    await ProjectModel.deleteProject([req.body.id], organization_id)
                    return sendResponse(res, 400, null, await getMessage(projectMessages, "47", language), null);
                } else {
                    req.body = { task_id: taskData.insertId || null, ...req.body };
                }
            }

            actionsTracker(req, 'Project %i added.', [req.body.id]);
            return sendResponse(res, 200, req.body, await getMessage(projectMessages, "9", language), null);

        } catch (err) {
            return sendResponse(res, 400, null, await getMessage(projectMessages, "7", language), null);
        }
    }

    /**
    * Get employees all projects or groups all projects or organizations all projects.
    * @function getGroupsEmployeesAllProjects
    * @memberof ProjectController
    * @param {*} req
    * @param {*} res
    * @returns {Object} - project details .
    * @see also {@link https://service.empmonitor.com/api/v3/explorer/#/Project/post_project_get_groups_employees_all_projects}
    */
    async getGroupsEmployeesAllProjects(req, res, next) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = Validation.getGroupsEmployeesAllProjects(req.query);
            if (error) return sendResponse(res, 404, null, await getMessage(projectMessages, "1", language), error.details[0].message);
            let { group_ids, employee_ids } = value;

            if (group_ids) {
                group_ids = _.unique(group_ids); //remove duplicate group_ids
            }
            if (employee_ids) {
                employee_ids = _.unique(employee_ids); //remove duplicate employee_ids
            }
            const result = await ProjectModel.getGroupsEmployeesProjects(group_ids, employee_ids, organization_id)
            return sendResponse(res, 200, result, await getMessage(projectMessages, "11", language), null)

        } catch (error) {
            return sendResponse(res, 400, null, await getMessage(projectMessages, "12", language), null);
        }
    }

    /**
    * Add bulk tasks for projects in excel sheets
    * @function addBulkTasks
    * @memberof ProjectController
    * @param {*} req
    * @param {*} res
    * @returns {} - success.
    * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
    */
    async addBulkTasks(req, res, next) {
        upload(req, res, async (err) => {
            const { organization_id, user_id, language } = req.decoded;
            try {
                if (!req.file || err) return sendResponse(res, 404, null, 'File Not Found.');

                const workbook = XLSX.readFile(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`, { cellDates: true });
                const sheet_name_list = workbook.SheetNames;
                const task_data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
                fs.unlinkSync(`${__dirname.split('src')[0] + '/public/'}${req.file.filename}`);

                await task_data.map(task => {
                    if (task['Project Name']) task.ProjectName = task['Project Name'].trim();
                    delete task['Project Name'];
                    if (task['Module Name']) task.ModuleName = task['Module Name'].trim();
                    delete task['Module Name'];
                    if (task['Start Date']) task.StartDate = moment.isDate(task['Start Date']) ? moment(task['Start Date']).format('YY-MM-DD hh:mm:ss') : null;
                    delete task['Start Date'];
                    if (task['End Date']) task.EndDate = moment.isDate(task['End Date']) ? moment(task['End Date']).format('YY-MM-DD hh:mm:ss') : null;
                    delete task['End Date'];
                    if (task['Task Name']) task.TaskName = task['Task Name'].trim();
                    delete task['Task Name'];
                    if (task['Start Date_1']) task.taskStartDate = moment.isDate(task['Start Date_1']) ? moment(task['Start Date_1']).format('YY-MM-DD hh:mm:ss') : null;
                    delete task['Start Date_1'];
                    if (task['End Date_1']) task.taskEndDate = moment.isDate(task['End Date_1']) ? moment(task['End Date_1']).format('YY-MM-DD hh:mm:ss') : null;
                    delete task['End Date_1'];
                    if (task.email) task.email = task.email.trim();
                });

                const validate = await Validation.addBulkTasks(task_data);
                if (validate.error) return sendResponse(res, 404, null, await getMessage(projectMessages, "1", language), error.details[0].message);

                let project_names = task_data.map(x => x.ProjectName);
                let emails_names = task_data.map(x => x.email);

                project_names = _.uniq(project_names);
                emails_names = _.uniq(emails_names);

                const project_data = await ProjectModel.getProjectIDs(organization_id, project_names);
                const user_data = await ProjectModel.getUserIDs(emails_names);

                if (project_names.length !== project_data.length) return sendResponse(res, 404, null, await getMessage(projectMessages, "10", language));

                for (let i = 0; i < task_data.length; i++) {
                    let projectID = project_data.find(x => x.name == task_data[i].ProjectName);
                    let userID = user_data.find(x => x.email == task_data[i].email);
                    let module_data = await ProjectModel.checkModuleIDByName(task_data[i].ModuleName, projectID.id);

                    // if module exists
                    if (module_data.length > 0) {
                        await ProjectModel.addTask(task_data[i].TaskName, projectID.id, task_data[i].taskStartDate, task_data[i].taskEndDate, user_id, userID.id, module_data[0].id);
                    }
                    // if module does not exists and module name given      
                    else if (task_data[i].ModuleName && task_data[i].ModuleName != 'null') {
                        await ProjectModel.addModule(task_data[i].ModuleName, projectID.id, task_data[i].StartDate, task_data[i].EndDate, user_id);
                        module_data = await ProjectModel.checkModuleIDByName(task_data[i].ModuleName, projectID.id);
                        await ProjectModel.addTask(task_data[i].TaskName, projectID.id, task_data[i].taskStartDate, task_data[i].taskEndDate, user_id, userID.id, module_data[0].id);
                    }
                    // if no module name given
                    else {
                        await ProjectModel.addTask(task_data[i].TaskName, projectID.id, task_data[i].taskStartDate, task_data[i].taskEndDate, user_id, userID.id);
                    }
                };

                return sendResponse(res, 200, null, await getMessage(projectMessages, "18", language));
            } catch (err) {
                return sendResponse(res, 400, null, await getMessage(projectMessages, "55", language), null);
            }
        });
    }

    /**
   * Get cumulative data of projects and tasks and modules
   * @function getProjectTasksData
   * @memberof ProjectController
   * @param {*} req
   * @param {*} res
   * @returns {Object} - cumulative data of projects and tasks and modules .
   * @see also {@link https://service.empmonitor.com/api/v3/explorer/#/Project/post_project_get_groups_employees_all_projects}
   */
    async getProjectTasksData(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = Validation.getProjectTasksData(req.query);
            if (error) return sendResponse(res, 404, null, await getMessage(projectMessages, "1", language), error.details[0].message);

            let { projectId, projectStatus, taskStartDate, taskEndDate, taskStatus } = value;

            const projectData = await ProjectModel.getProjectData(projectId, projectStatus, organization_id);
            if (projectData.length == 0) return sendResponse(res, 200, projectData, await getMessage(projectMessages, "41", language), null)


            let projectIDs = projectData.map(x => x.project_id);
            let moduleData = await ProjectModel.getModules(projectIDs);
            let moduleIDs = moduleData.map(x => x.id);
            let taskData = await ProjectModel.getTasksData(moduleIDs, taskStartDate, taskEndDate, taskStatus);

            // connecting the tasks to modules
            for (let i = 0; i < moduleData.length; i++) {

                moduleData[i].tasks = [];
                for (let j = 0; j < taskData.length; j++) {
                    if (taskData[j].project_module_id == moduleData[i].id) {
                        delete taskData[j].project_module_id;
                        moduleData[i].tasks.push(taskData[j]);

                        // getting task productivity
                        let durationData = await ProjectModel.getProductionTime([taskData[j].id]);
                        taskData[j].duration = durationData;
                    }
                }
            }

            // connecting modules to projects
            for (let i = 0; i < projectData.length; i++) {

                // getting time taken by project
                const projectTime = await ProjectModel.getProjectTimeSpent(projectData[i].project_id);
                projectData[i].projectDuration = projectTime[0].time ? projectTime[0].time : 0;

                projectData[i].modules = [];
                for (let j = 0; j < moduleData.length; j++) {
                    if (projectData[i].project_id == moduleData[j].project_id) {
                        delete moduleData[j].project_id;
                        projectData[i].modules.push(moduleData[j]);
                    }
                }
            }

            return sendResponse(res, 200, projectData, await getMessage(projectMessages, "11", language), null)
        } catch (error) {
            console.log('error', error)
            return sendResponse(res, 400, null, await getMessage(projectMessages, "12", language), null);
        }
    }
}

module.exports = new ProjectController;

/**
 * Multer upload function
 * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
 */
const upload = multer({
    dest: __dirname.split('src')[0] + 'public',
    filename: function (req, file, callback) {
        callback(null, file.filename + '.xlsx')
    }
}).single('file');

async function getProjectByname(name, organization_id) {
    try {
        const get_project = await ProjectModel.getProjectByname(name, organization_id);
        return get_project;
    } catch (err) {
        return null;
    }
}

async function getModuleByName(name, project_id) {
    try {
        const get_project = await ProjectModel.getModuleByname(name, project_id);
        return get_project;
    } catch (err) {
        return null;
    }
}

async function secToTime(totalSeconds) {
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    var seconds = totalSeconds - (hours * 3600) - (minutes * 60);

    // round seconds
    seconds = Math.round(seconds * 100) / 100

    var result = (hours < 10 ? "0" + hours : hours);
    result += ":" + (minutes < 10 ? "0" + minutes : minutes);
    result += ":" + (seconds < 10 ? "0" + seconds : seconds);
    return await result;
}

