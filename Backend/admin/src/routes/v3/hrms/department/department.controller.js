const _ = require('underscore');
const LocationModel = require('../location/location.model');
const DepartmentModel = require('./department.model');
const OrganizationDepartmentModel = require('../../department/Department.model');
const OrganizationLocationModel = require('../../location/location.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const DepartmentValidation = require('./department.validation');
const OrganizationDepartmentValidation = require('../../department/Department.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { departmentMessages, locationMessages, policyMessages } = require("../../../../utils/helpers/LanguageTranslate");

class DepartmentController {

    /**
     * Create department
     *
     * @function createDepartment
     * @memberof  DepartmentController
     * @param {*} req
     * @param {*} res
     * @returns {object} created list or error
     */
    async createDepartment(req, res) {

        const { organization_id, language } = req.decoded;

        try {

            let { value, error } = DepartmentValidation.addDepartment(req.body);
            if (error) return sendResponse(res, 404, null, translate(departmentMessages, "2", language), error.details[0].message);

            let { department_name, location_id, department_head_id } = value;
            const departmentId = await OrganizationDepartmentModel.getDepartmentByname(organization_id, department_name);
            if (departmentId.length > 0) return sendResponse(res, 400, null, translate(departmentMessages, "16", language), null);

            const locationId = await OrganizationLocationModel.getLocationById(location_id, organization_id);
            if (locationId.length == 0) return sendResponse(res, 400, null, translate(locationMessages, "18", language), null);

            const department = await OrganizationDepartmentModel.addDepartment(department_name, organization_id);
            if (!department) return sendResponse(res, 400, null, translate(departmentMessages, "4", language), null);

            const department_details = await DepartmentModel.addDepartmentDetails(department.insertId, location_id, department_head_id);
            if (department_details.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    departments: {
                        department_id: department.insertId || null,
                        department_name: department_name || null,
                        location_id: location_id,
                        department_head_id: department_head_id,
                    },
                }, translate(departmentMessages, "3", language), null);
            }
            return sendResponse(res, 400, null, translate(departmentMessages, "4", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(departmentMessages, "5", language), err);
        }
    }

    /**
   * Get department
   *
   * @function getDepartments
   * @memberof  DepartmentController
   * @param {*} req
   * @param {*} res
   * @returns {object} request list or error
   */
    async getDepartments(req, res) {
        let { organization_id, language } = req.decoded;
        let { department_id = null } = req.query;
        try {
            let departments = await DepartmentModel.fetchLocationDepartments(department_id, organization_id);
            if (departments.length == 0) return sendResponse(res, 400, null, translate(departmentMessages, "7", language), null);

            let headIds = _.pluck(departments, "department_head_id");
            headIds = headIds.filter(el => el != null);
            let locationIds = _.pluck(departments, "location_id");
            headIds = _.unique(headIds);
            locationIds = _.unique(locationIds);

            let userData = [], locationData = [];
            if (headIds.length > 0) userData = await LocationModel.getUsers(headIds);

            if (locationIds.length > 0) locationData = await DepartmentModel.fetchLocations(locationIds);
            departments = departments.map(item => ({
                ...item,
                location: locationData.find(itr => itr.id === item.location_id) ? locationData.find(itr => itr.id === item.location_id).name : null,
                department_head: userData.find(itr => itr.id === item.department_head_id) ? userData.find(itr => itr.id === item.department_head_id).name : null,
            }))
            return sendResponse(res, 200, departments, translate(departmentMessages, "17", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(departmentMessages, "8", language), null);
        }
    }

    /**
  * Update department
  *
  * @function updateDepartment
  * @memberof  DepartmentController
  * @param {*} req
  * @param {*} res
  * @returns {object} updated list or error
  */
    async updateDepartment(req, res) {
        const { organization_id, language } = req.decoded;
        try {

            let { value, error } = DepartmentValidation.updateDepartment(req.body);
            if (error) return sendResponse(res, 404, null, translate(departmentMessages, "2", language), error.details[0].message);

            let { department_id, department_name, location_id, department_head_id } = value;
            const departmentId = await OrganizationDepartmentModel.getDepartmentByname(organization_id, department_name);
            if ((departmentId.length > 0) && (departmentId[0].id != department_id)) return sendResponse(res, 400, null, translate(departmentMessages, "16", language), null);

            const department = await OrganizationDepartmentModel.updateDepartment(department_name, department_id, organization_id);
            if (!department) return sendResponse(res, 400, null, translate(departmentMessages, "10", language), null);

            let departmentDetails = await DepartmentModel.udpateDepartmentDetails(location_id, department_head_id, department_id);
            if (departmentDetails.affectedRows == 0) {
                departmentDetails = await DepartmentModel.addDepartmentDetails(department_id, location_id, department_head_id);
            }
            if (departmentDetails.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    departments: {
                        department_id: department_id || null,
                        department_name: department_name || null,
                        location_id: location_id,
                        department_head_id: department_head_id,
                    },
                }, translate(departmentMessages, "9", language), null);
            }
            return sendResponse(res, 400, null, translate(departmentMessages, "10", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(departmentMessages, "11", language), err);
        }
    }

    /**
  * Delete department
  *
  * @function deleteDepartment
  * @memberof  DepartmentController
  * @param {*} req
  * @param {*} res
  * @returns {object} deleted list or error
  */
    async deleteDepartment(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = OrganizationDepartmentValidation.validateDeleteDept(req.body.department_id)
            if (error) return sendResponse(res, 404, null, translate(departmentMessages, "2", language), error.details[0].message);

            let { department_id } = value;
            const check_user = await OrganizationDepartmentModel.checkDepartmentUsers(department_id, organization_id);
            if (check_user.length > 0) return sendResponse(res, 400, null, translate(departmentMessages, "12", language), null);

            let department = await OrganizationDepartmentModel.deleteDepartment(department_id, organization_id);
            if (department.affectedRows !== 0) return sendResponse(res, 200, null, translate(departmentMessages, "13", language), null);

            return sendResponse(res, 400, null, translate(departmentMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(departmentMessages, "15", language), null);
        }
    }
}

module.exports = new DepartmentController;