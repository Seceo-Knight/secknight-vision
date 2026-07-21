// Announcements Controller


// Imports
const validation = require('./announcement.validation');
const AnnouncementService = require("./announcement.service");
const sendResponse = require('../../../../utils/myService').sendResponse;


/**
 * @class AnnouncementsController
 * Methods for all announcements api's 
 */
class AnnouncementsController {

    /**
    * Get announcement
    * @function getAnnouncements
    * @memberof  AnnouncementsController
    * @param {*} req
    * @param {*} res
    * @returns {object}
    */
    async getAnnouncements(req, res) {
        let { organization_id, employee_id, location_id, department_id } = req.decoded;
        try {
            let { value, error } = validation.getAnnouncements(req.query);
            if (error) return sendResponse(res, 400, null, "Validation Error!", error.details[0].message);

            if (employee_id) {
                value.location_id = location_id;
                value.department_id = department_id;
            }

            let data = await new AnnouncementService().getAnnouncementService({ ...value, organization_id });

            return sendResponse(res, 200, data, "success.", null);
        } catch (error) {

            let message = error instanceof Error ? error.message : "Something went wrong!";
            return sendResponse(res, 400, null, message, null);
        }
    }

    /**
    * Get events 
    * @function getEvents
    * @memberof  AnnouncementController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getEvents(req, res) {
        let { organization_id } = req.decoded;
        try {

            let data = await new AnnouncementService().getEventsService({ organization_id });

            return sendResponse(res, 200, data, "success.", null);
        } catch (error) {

            let message = error instanceof Error ? error.message : "Something went wrong!";
            return sendResponse(res, 400, null, message, null);
        }
    }


    /**
    * Created announcement
    * @function createAnnouncements
    * @memberof  AnnouncementController;
    * @param {*} req
    * @param {*} res
    * @returns {object} 
    */
    async createAnnouncements(req, res) {
        let { organization_id, user_id } = req.decoded;
        try {

            let { value, error } = validation.createAnnouncements(req.body);
            if (error) return sendResponse(res, 404, null, "Validation Error!", error.details[0].message);

            await new AnnouncementService().createAnnouncementsService({ ...value, organization_id, user_id });

            return sendResponse(res, 200, null, "Announcement Created.", null);
        } catch (error) {

            let message = error instanceof Error ? error.message : "Something went wrong!";
            return sendResponse(res, 400, null, message, null);
        }
    }


    /**
    * Update announcement
    * @function updateAnnouncement
    * @memberof  AnnouncementController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateAnnouncements(req, res) {
        let { organization_id } = req.decoded;
        try {

            let { value, error } = validation.updateAnnouncements(req.body);
            if (error) return sendResponse(res, 404, null, "Validation Error!", error.details[0].message);

            await new AnnouncementService().updateAnnouncementsService({ ...value, organization_id });

            return sendResponse(res, 200, null, "Announcement Updated.", null);
        } catch (error) {

            let message = error instanceof Error ? error.message : "Something went wrong!";
            return sendResponse(res, 400, null, message, null);
        }
    }


    /**
    * Delete announcement
    * @function deleteAnnouncement
    * @memberof  AnnouncementController
    * @param {*} req
    * @param {*} res
    * @returns {object} delete list or error
    */
    async deleteAnnouncements(req, res) {
        let { organization_id } = req.decoded;
        try {
            let { value, error } = validation.deleteAnnouncements(req.body);
            if (error) return sendResponse(res, 400, null, "Validation Error!", error.details[0].message);

            await new AnnouncementService().deleteAnnouncementService({ ...value, organization_id });

            return sendResponse(res, 200, null, "Announcement Deleted.", null);
        } catch (error) {

            let message = error instanceof Error ? error.message : "Something went wrong!";
            return sendResponse(res, 400, null, message, null);
        }
    }
}


// Exports
module.exports = AnnouncementsController;