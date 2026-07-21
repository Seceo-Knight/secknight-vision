// announcements Service 

// Imports
const moment = require("moment");
const AnnouncementModel = require("./announcement.model");


/**
 * @class AnnouncementService
 * Service for announcements Api's
 */
class AnnouncementService {

    constructor() {
        this.model = new AnnouncementModel();
    }


    /**
     * Get Announcements for get Api
     * @function getAnnouncementService
     * @param {*} param0 
     * @returns 
     */
    async getAnnouncementService({ title, start_date, end_date, location_id,
        department_id, is_active, organization_id, type }) {

        if (start_date) start_date = moment(start_date).format("YYYY-MM-DD");
        if (end_date) end_date = moment(end_date).format("YYYY-MM-DD");

        let announcements = await this.model.getAnnouncementData({
            title, start_date, end_date, location_id, type,
            department_id, is_active, organization_id
        });

        return announcements.sort((x, y) => x.end_date - y.end_date);
    }


    /**
     * Get Events for get Api
     * @function getEventsService
     * @param {*} param0
     * @returns 
     */
    async getEventsService({ organization_id }) {

        let months = [moment().format("MM"), moment().add(1, "months").format("MM")];

        let start_date = moment().format("MM-DD"),
            end_date = moment().add(15, "days").format("MM-DD");

        let workAnniversary = await this.model.getWorkAnniversaryData({ organization_id, months });
        workAnniversary = workAnniversary.filter(x => {
            let date = moment(x.date).format("MM-DD");
            return date >= start_date && date <= end_date ? true : false;
        }).sort((x, y) => moment(x.date).format("MMDD") - moment(y.date).format("MMDD"));

        let birthdays = await this.model.getBirthdaysData({ organization_id, months });
        birthdays = birthdays.filter(x => {
            let date = moment(x.date).format("MM-DD");
            return date >= start_date && date <= end_date ? true : false;
        }).sort((x, y) => moment(x.date).format("MMDD") - moment(y.date).format("MMDD"));;

        return { workAnniversary, birthdays };
    }


    /**
     * Create Announcements for post Api 
     * @function createAnnouncementsService
     * @param {*} param0 
     * @returns
     */
    async createAnnouncementsService({ title, start_date, end_date, location_id, department_id,
        type, description, organization_id, user_id }) {

        start_date = moment(start_date).format("YYYY-MM-DD");
        end_date = moment(end_date).format("YYYY-MM-DD");

        if (location_id || department_id) {
            let [checkLocationAndDepartment] = await this.model.checkLocationAndDepartment({ location_id, department_id, organization_id });
            if (!checkLocationAndDepartment) throw Error("Organization Location or Department not found!");
        }

        return this.model.createAnnouncements({
            title, start_date, end_date, location_id, department_id,
            type, description, organization_id, user_id
        });
    }


    /**
     * To update Announcements
     * @function updateAnnouncementsService
     * @param {*} param0 
     * @returns 
     */
    async updateAnnouncementsService({ id, title, start_date, end_date, location_id, department_id,
        type, description, is_active, organization_id }) {

        if (start_date) start_date = moment(start_date).format("YYYY-MM-DD");
        if (end_date) end_date = moment(end_date).format("YYYY-MM-DD");

        if (location_id || department_id) {
            let [checkLocationAndDepartment] = await this.model.checkLocationAndDepartment({ location_id, department_id, organization_id });
            if (!checkLocationAndDepartment) throw Error("Organization Location or Department not found!");
        }

        let data = await this.model.updateAnnouncements({
            id, title, start_date, end_date, location_id, department_id,
            type, description, is_active, organization_id
        });

        if (data.affectedRows) return;
        else throw Error("No Announcement Found!");
    }


    /**
     * To delete announcements
     * @function deleteAnnouncementService
     * @param {*} param0 
     * @returns 
     */
    async deleteAnnouncementService({ id, organization_id }) {
        let data = await this.model.deleteAnnouncements({ id, organization_id });

        if (data.affectedRows) return;
        else throw Error("No Announcement Found!");
    }
}


// Exports
module.exports = AnnouncementService;