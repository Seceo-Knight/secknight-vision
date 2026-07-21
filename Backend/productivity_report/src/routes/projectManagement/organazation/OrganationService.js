const Organazation = require('../../shared/Organazation');
const JoiValidation = require('../../../rules/validation/Project');
const sendResponse = require('../../../utils/myService').sendResponse;
const Logger = require('../../../Logger').logger;

class OrganazationService {

    async createOrganazation(req, res) {
        const name = req.body.name;
        const admin_id = req['decoded'].jsonData.admin_id;
        // const manager_id=req.body.manager_id|| null;
        try {
            const validate = JoiValidation.createOrganazation(name);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const check_ogranazation = await Organazation.getOrganazationByName(name, admin_id);
            if (check_ogranazation.length > 0) return sendResponse(res, 400, null, 'Organazation Is Already Exits.', null);

            const organazation_data = await Organazation.createOrganazation(name, admin_id);
            if (!organazation_data) return sendResponse(res, 400, null, 'Faled To Create Organazation.', null);

            const get_organization = await Organazation.getOrganazationById(admin_id, organazation_data.insertId);
            return sendResponse(res, 200, get_organization, 'Organazation Created Successfully', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Faled To Create Organazation.', null);
        }

    }

    async getAllOrgnazation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let organazation_data = await Organazation.getAllOrganazation(admin_id)
        if (organazation_data.length <= 0) return sendResponse(res, 400, null, 'No Organazation Found.', null);
        return sendResponse(res, 200, organazation_data, 'Organazation Data.', null);
    }

    async getSingleOrgnazation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let organazation_id = req.body.organization_id;
        let is_organazation_id = req.body.organization_id ? true : false;

        try {
            if (organazation_id) {
                let validate = JoiValidation.idValidation(organazation_id);
                if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            }

            organazation_id = organazation_id || null;
            let organazation_data = await Organazation.getSingleOrganazation(admin_id, organazation_id, is_organazation_id)
            if (organazation_data.length <= 0) return sendResponse(res, 400, null, 'No Organazation Found.', null);
            return sendResponse(res, 200, organazation_data, 'Organazation Data.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable Get Organazation.', null);
        }

    }

    async deleteOrganization(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let organazation_id = req.body.organization_id;

        try {
            let validate = JoiValidation.idValidation(organazation_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let organazation_data = await Organazation.getOrganazationById(admin_id, organazation_id)
            if (organazation_data.length <= 0) return sendResponse(res, 400, null, 'No Organazation Found.', null);

            let delete_data = await Organazation.deleteOrganization(admin_id, organazation_id)
            if (!delete_data.affectedRows) return sendResponse(res, 400, null, 'Unable To Delete Organazation.', null);
            return sendResponse(res, 200, req.body, 'Organazation Deleted Successfully.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Organazation.', null);
        }

    }

    async updateOrganization(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let organization_id = req.body.organization_id;
        let name = req.body.name;
        let status = req.body.status;
        try {
            let validate = JoiValidation.UpdateOrganazation(organization_id, name, status);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let organazation_data = await Organazation.getOrganazationById(admin_id, organization_id)
            if (organazation_data.length <= 0) return sendResponse(res, 400, null, 'No Organazation Found.', null);
            name = name || organazation_data[0].name;
            status = status || organazation_data[0].status;

            if (req.body.name) {
                let check_ogranazation = await Organazation.checkOrganizationName(organization_id, name, admin_id);
                if (check_ogranazation.length > 0) return sendResponse(res, 400, null, 'Organization Name Already Exists.', null);
            }

            let update_data = await Organazation.updateOrganiation(admin_id, organization_id, name, status)
            if (!update_data.affectedRows) return sendResponse(res, 400, null, ' Unable To Update Organization.', null);
            const get_organization = await Organazation.getOrganazationById(admin_id, organization_id);
            if (get_organization.length == 0) return sendResponse(res, 400, null, ' Unable Get Organization.', null);
            return sendResponse(res, 200, get_organization, ' Successfully Updated.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, ' Unable To Update Organization.', null);
        }

    }

}

module.exports = new OrganazationService;



