const DepartmentCRUD = require('../shared/DepartmentCURD');
const JioValidation = require('../../rules/validation/Location');
const FirewallService = require('../firewall/FirewallService');


class DepartmentService {

    /**
    * create department.
    *
    * @function createDepartment
    * @memberof DepartmentService
    * @param {*} req
    * @param {*} res
    * @returns {Object} - Success Message  or error .
    * @see also {@link http://localhost:3003/api/v1/explorer/#/Department/post_create_departments }
    */
    createDepartment(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let name = req.body.name;
        let short_name = req.body.short_name
        if (!short_name) short_name = name;
        let validate = JioValidation.validationCreateDepartments(name, short_name)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        } else {
            DepartmentCRUD.getDepartmentByName(admin_id, name, (err, dept_data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Error While Adding Department.', error: err });
                } else if (dept_data.length > 0) {
                    return res.json({ code: 400, data: null, message: 'Department Already Exist.', error: null });
                } else {
                    DepartmentCRUD.createDepartment(admin_id, name, short_name, (err, data) => {
                        if (err) {
                            return res.json({ code: 400, data: null, message: 'Error While Adding Department.', error: err });
                        } else if (data.affectedRows > 0) {
                            return res.json({ code: 200, data: { department_id: data.insertId, ...req.body }, message: 'Succefully Department Added.', error: err });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Department Already Exists.', error: err });
                        }
                    })
                }
            })

        }
    }

    /**
   * Get department .
   *
   * @function retrieveDepartment
   * @memberof DepartmentService
   * @param {*} req
   * @param {*} res
   * @returns {Object} - Success Message  or error .
   * @see also { @link http://localhost:3003/api/v1/explorer/#/Department/post_get_departments }
   */
    retrieveDepartment(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let validate = JioValidation.skipAndLimit(req.body.skip, req.body.limit)
        if (validate.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validate.error.details[0].message });
        }
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 200;
        DepartmentCRUD.retrieveDepartment(skip, limit, admin_id, (err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Error While Getting Department.', error: err });
            } else {
                if (data.length > 0) {
                    return res.json({ code: 200, data: data, message: 'Department Data.', error: err });
                } else {
                    return res.json({ code: 400, data: null, message: 'Departments Not Found.', error: err });
                }
            }
        })
    }

    /**
 * Update department.
 *
 * @function updateDepartment
 * @memberof DepartmentService
 * @param {*} req
 * @param {*} res
 * @returns {Object} - Success Message  or error .
 * @see also { @link http://localhost:3003/api/v1/explorer/#/Department/put_update_department }
 */
    updateDepartment(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let name = req.body.name;
        let short_name = req.body.short_name;
        let department_id = req.body.department_id;
        let validation = JioValidation.validateionUpdateDepartment(name, short_name, department_id)
        if (validation.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validation.error.details[0].message });
        } else {
            DepartmentCRUD.get_department_by_name(name, department_id, admin_id, (err, data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Error While Updating Department.', error: err });
                } else if (data.length > 0) {
                    return res.json({ code: 400, data: null, message: 'Department Already Exists.', error: err });
                }
                else {
                    DepartmentCRUD.updateDepartment(name, short_name, department_id, (err, data) => {
                        if (err) {
                            return res.json({ code: 400, data: null, message: 'Error While Updating Department.', error: err });
                        } else {
                            return res.json({ code: 200, data: data, message: 'Department Updated Succefully.', error: null });
                        }
                    })
                }
            })

        }
    }

    /**
 *Delete department.
 *
 * @function deleteDepartment
 * @memberof DepartmentService
 * @param {*} req
 * @param {*} res
 * @returns {Object} - Success Message  or error .
 * @see also { @link http://localhost:3003/api/v1/explorer/#/Department/delete_delete_department }
 */
    deleteDepartment(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let department_id = req.body.department_id;
        let validation = JioValidation.validateDeleteDept(department_id)
        if (validation.error) {
            return res.json({ code: 404, data: null, message: 'Validation Failed.', error: validation.error.details[0].message });
        } else {
            DepartmentCRUD.checkDeptaptmetUser(department_id, admin_id, (err, user_data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Error While Deleteing Department.', error: err });
                } else if (user_data.length > 0) {
                    return res.json({ code: 400, data: null, message: 'Unable To Delete ,Some User Exists In This Department.', error: err });
                } else {
                    DepartmentCRUD.deleteDepartment(department_id, admin_id, (err, data) => {
                        if (err) {
                            return res.json({ code: 400, data: null, message: 'Error While Deleteing Department.', error: err });
                        } else if (data.affectedRows > 0) {
                            FirewallService.checkUserAndDepartmentRule(admin_id, [department_id], 4);
                            return res.json({ code: 200, data: null, message: 'Department Deleted Succefully.', error: null });
                        } else {
                            return res.json({ code: 400, data: null, message: 'Invalid Input!', error: null });
                        }
                    })
                }
            })

        }
    }
}

module.exports = new DepartmentService;