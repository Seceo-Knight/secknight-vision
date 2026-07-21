const JioValidation = require('./Department.validation');
const sendResponse = require('../../../utils/myService').sendResponse;
const DepartmentModel = require('./Department.model');
const FirewalController = require('../firewall/Firewall.controller');
const actionsTracker = require('../services/actionsTracker');
const { departmentMessages } = require("../../../utils/helpers/LanguageTranslate");
const _ = require('underscore');
const configFile = require('../../../../../config/config');

class DepartmentController {

    async createDepartment(req, res) {
        const organization_id = req.decoded.organization_id;
        const name = req.body.name;
        const language = req.decoded.language;


        try {
            let validate = JioValidation.validationCreateDepartments(name);
            if (validate.error) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "2")[language] || departmentMessages.find(x => x.id === "2")["en"], validate.error.details[0].message);
            }
            const get_department = await DepartmentModel.getDepartmentByname(organization_id, name);
            if (get_department.length > 0) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "1")[language] || departmentMessages.find(x => x.id === "1")["en"], null);
            }

            const add_department = await DepartmentModel.addDepartment(name, organization_id);
            if (add_department) {
                if (add_department.insertId > 0) {
                    actionsTracker(req, 'Department %i created.', [add_department.insertId]);
                    return sendResponse(res, 200, { department_id: add_department.insertId, ...req.body }, departmentMessages.find(x => x.id === "3")[language] || departmentMessages.find(x => x.id === "3")["en"], null);
                } else {
                    return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "4")[language] || departmentMessages.find(x => x.id === "4")["en"], null);
                }
            } else {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "4")[language] || departmentMessages.find(x => x.id === "4")["en"], null);
            }

        } catch (err) {
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "5")[language] || departmentMessages.find(x => x.id === "5")["en"], err);
        }

    }

    async getDepartments(req, res) {
        actionsTracker(req, 'Departments requested.');
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;

        try {
            let validate = JioValidation.skipAndLimit(req.body.skip, req.body.limit)
            if (validate.error) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "2")[language] || departmentMessages.find(x => x.id === "2")["en"], validate.error.details[0].message);
            }

            const skip = parseInt(req.body.skip) || 0;
            const limit = parseInt(req.body.limit) || 200;
            const name = req.body.name
            // let manager_id = req.decoded.employee_id || null;
            let manager_id = null;

            if((req.decoded.is_manager || req.decoded.is_teamlead) && configFile?.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN?.split(',')?.includes(`${organization_id}`)) {
                const get_departments = await DepartmentModel.fetchDepartments(organization_id, skip, limit, req.decoded.employee_id, name);
                if (get_departments.length > 0) {
                    return sendResponse(res, 200, get_departments, departmentMessages.find(x => x.id === "6")[language] || departmentMessages.find(x => x.id === "6")["en"], null);
                } else {
                    return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "7")[language] || departmentMessages.find(x => x.id === "7")["en"], null);
                }
            }

            const get_departments = await DepartmentModel.fetchDepartments(organization_id, skip, limit, manager_id, name);
            if (get_departments.length > 0) {
                return sendResponse(res, 200, get_departments, departmentMessages.find(x => x.id === "6")[language] || departmentMessages.find(x => x.id === "6")["en"], null);
            } else {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "7")[language] || departmentMessages.find(x => x.id === "7")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "8")[language] || departmentMessages.find(x => x.id === "8")["en"], null);
        }
    }

    async getDepartmentsProductivityRules(req, res) {
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        try {
            let validate = JioValidation.skipAndLimit(req.body.skip, req.body.limit)
            if (validate.error) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "2")[language] || departmentMessages.find(x => x.id === "2")["en"], validate.error.details[0].message);
            }

            const skip = parseInt(req.body.skip) || 0;
            const limit = parseInt(req.body.limit) || 200;
            const name = req.body.name
            // let manager_id = req.decoded.employee_id || null;
            let manager_id = null;

            let managerAssignedDepartment = [];
            if(req.decoded.employee_id && req.decoded.role_id && configFile.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN.split(',').includes(String(organization_id))) managerAssignedDepartment = await DepartmentModel.getDepartmentByManager(req.decoded.employee_id, req.decoded.role_id);
            managerAssignedDepartment = _.pluck(managerAssignedDepartment, "department_id");


            let get_departments = await DepartmentModel.fetchDepartments(organization_id, skip, limit, manager_id, name);

            if(req.decoded.employee_id && req.decoded.role_id && configFile.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN.split(',').includes(String(organization_id))) {
                get_departments = get_departments.filter(i => managerAssignedDepartment.includes(+i.id))
            }


            if (get_departments.length > 0) {
                return sendResponse(res, 200, get_departments, departmentMessages.find(x => x.id === "6")[language] || departmentMessages.find(x => x.id === "6")["en"], null);
            } else {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "7")[language] || departmentMessages.find(x => x.id === "7")["en"], null);
            }
        } catch (err) {
            console.log(err)
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "8")[language] || departmentMessages.find(x => x.id === "8")["en"], null);
        }
    }

    async updateDepartment(req, res) {
        const organization_id = req.decoded.organization_id;
        const name = req.body.name;
        const department_id = req.body.department_id;
        const language = req.decoded.language;

        try {
            let validation = JioValidation.validateionUpdateDepartment(name, department_id)
            if (validation.error) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "2")[language] || departmentMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);
            }

            const get_department = await DepartmentModel.getDepartmentByname(organization_id, name);
            if (get_department.length > 0) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "1")[language] || departmentMessages.find(x => x.id === "1")["en"], null);
            }
            const update_department = await DepartmentModel.updateDepartment(name, department_id, organization_id);
            if (update_department) {
                if (update_department.affectedRows > 0) {
                    update_department.name = name;
                    update_department.department_id = department_id;
                    actionsTracker(req, 'Department %i updated.', [department_id]);
                    return sendResponse(res, 200, update_department, departmentMessages.find(x => x.id === "9")[language] || departmentMessages.find(x => x.id === "9")["en"], null);
                } else {
                    return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "10")[language] || departmentMessages.find(x => x.id === "10")["en"], null);
                }
            } else {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "10")[language] || departmentMessages.find(x => x.id === "10")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "11")[language] || departmentMessages.find(x => x.id === "11")["en"], null);
        }

    }

    async deleteDepartment(req, res) {
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;

        try {
            let validation = JioValidation.validateDeleteDept(req.body.department_id)
            if (validation.error) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "2")[language] || departmentMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);
            }
            let department_id = parseInt(req.body.department_id);

            const check_user = await DepartmentModel.checkDepartmentUsers(department_id, organization_id);
            if (check_user.length > 0) {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "12")[language] || departmentMessages.find(x => x.id === "12")["en"], null);
            }
            const delete_departmenrt = await DepartmentModel.deleteDepartment(department_id, organization_id);
            if (delete_departmenrt) {
                if (delete_departmenrt.affectedRows > 0) {
                    FirewalController.checkUserAndDepartmentRule(organization_id, department_id, 4)
                    actionsTracker(req, 'Department %i deleted.', [department_id]);
                    return sendResponse(res, 200, null, departmentMessages.find(x => x.id === "13")[language] || departmentMessages.find(x => x.id === "13")["en"], null);
                } else {
                    return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "14")[language] || departmentMessages.find(x => x.id === "14")["en"], null);
                }
            } else {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "14")[language] || departmentMessages.find(x => x.id === "14")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "15")[language] || departmentMessages.find(x => x.id === "15")["en"], err);
        }


    }

    async deleteDepartmentNew(req, res) {
        const { organization_id, language } = req.decoded;

        try {
            let { department_id } = req.body;
            let validation = JioValidation.validateDeleteDept(department_id);
            if (validation.error) {
                return sendResponse(res, 404, null, departmentMessages.find(x => x.id === "2")[language] || departmentMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);
            }
            department_id = +department_id;
            const [ifDeptExist] = await DepartmentModel.getDepartmentById({ department_id });
            if (!ifDeptExist) return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "7")[language] || departmentMessages.find(x => x.id === "7")["en"], null);

            let [data] = await DepartmentModel.checkAssignedDepartment({ organization_id, department_id });
            if (data) {
                let deletedDept = await DepartmentModel.deleteDepartmentNew({ department_id });
                return sendResponse(res, 200, deletedDept, departmentMessages.find(x => x.id === "13")[language] || departmentMessages.find(x => x.id === "13")["en"], null);
            }
            let [locDept] = await DepartmentModel.checkDepartmentLocationRelation({ department_id });
            if (locDept) {
                return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "18")[language] || departmentMessages.find(x => x.id === "18")["en"], null);
            }
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "12")[language] || departmentMessages.find(x => x.id === "12")["en"], null);

        } catch (err) {
            return sendResponse(res, 400, null, departmentMessages.find(x => x.id === "15")[language] || departmentMessages.find(x => x.id === "15")["en"], err);
        }
    }

}
module.exports = new DepartmentController;