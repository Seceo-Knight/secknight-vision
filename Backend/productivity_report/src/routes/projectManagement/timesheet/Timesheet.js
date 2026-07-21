"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);

const moment = require('moment');

const JoiValidation = require('../../../rules/validation/Timesheet')
const sendResponse = require('../../../utils/myService').sendResponse;
const TimesheetCURD = require('../../shared/TimesheetCURD')
const Logger = require('../../../Logger').logger;

class Timesheet {

    async createTimesheet(req, res) {
        let module_id = req.body.module_id || null;
        let project_id = req.body.project_id;
        let todo_id = req.body.todo_id;
        let user_id = req.body.user_id;
        let start_time = moment.utc(req.body.start_time).format('YYYY-MM-DD  HH:mm:ss');
        let end_time = moment.utc(req.body.end_time).format('YYYY-MM-DD  HH:mm:ss');
        let note = req.body.note;
        let reason = req.body.reason;

        try {
            let validate = JoiValidation.createTimesheet(project_id, user_id, todo_id, note, reason, req.body.start_time, req.body.end_time, module_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let create_timesheet = await TimesheetCURD.createTimesheet(project_id, user_id, todo_id, note, reason, start_time, end_time, module_id);
            if (!create_timesheet) {
                return sendResponse(res, 400, null, 'Unable To Create Timesheet.', null);
            } else if (create_timesheet.affectedRows > 0) {
                let data = req.body;
                data.id = create_timesheet.insertId;
                return sendResponse(res, 200, data, 'Successfully Create Timesheet.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Create Timesheet.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Create Timesheet.', null);
        }

    }

    async getTimesheet(req, res) {

        const from_date = req.body.from_date ? moment.utc(req.body.from_date).format('YYYY-MM-DD') : null;
        const to_date = req.body.to_date ? moment.utc(req.body.to_date).format('YYYY-MM-DD') : null;
        const is_date = to_date && from_date ? true : false;
        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;
        let is_manager = req['decoded'].jsonData.is_manager;
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id || null;
        let is_user = req.body.user_id ? true : false;
        let timesheet_id = req.body.timesheet_id || null;
        let is_timesheet = req.body.timesheet_id ? true : false;
        const project_id = req.body.project_id || null;
        const is_project = req.body.project_id ? true : false;

        try {
            let validate = JoiValidation.getTimesheet(user_id, timesheet_id, from_date, to_date, project_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let get_timesheet = await TimesheetCURD.getTimesheet(user_id, is_user, admin_id, manager_id, is_manager, is_timesheet, timesheet_id, from_date, to_date, is_date, project_id, is_project);
            if (get_timesheet.length == 0) return sendResponse(res, 400, null, 'Timesheets Not Found.', null);
            return sendResponse(res, 200, get_timesheet, 'Timesheets Data.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Fetch Timesheets.', null);
        }



        // const from_date =req.body.from_date? moment.utc(req.body.from_date).format('YYYY-MM-DD'):null;
        // const to_date =req.body.to_date? moment.utc(req.body.to_date).format('YYYY-MM-DD'):null;
        // const is_date=to_date&&from_date?true:false;
        // let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;
        // let is_manager = req['decoded'].jsonData.is_manager;
        // let admin_id = req['decoded'].jsonData.admin_id;
        // let user_id = req.body.user_id || null;
        // let is_user = req.body.user_id ? true : false;
        // let organization_id = req.body.organization_id;
        // let timesheet_id = req.body.timesheet_id || null;
        // let is_timesheet = req.body.timesheet_id ? true : false;

        // try{
        // let validate = JoiValidation.getTimesheet(user_id, organization_id, timesheet_id,from_date,to_date);
        // if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        // let get_timesheet = await TimesheetCURD.getTimesheet(user_id, is_user, admin_id, manager_id, is_manager, organization_id, is_timesheet, timesheet_id,from_date,to_date,is_date);
        // if (get_timesheet.length == 0) return sendResponse(res, 400, null, 'Timesheets Not Found.', null);
        // return sendResponse(res, 200, get_timesheet, 'Timesheets Data.', null);
        // }catch(err){
        //     Logger.error(`----error-----${err}------${__filename}----`);
        //     return sendResponse(res, 400, null, 'Unable To Fetch Timesheets.', null);
        // }




    }


    async updateTimesheet(req, res) {
        let timesheet_id = req.body.timesheet_id;

        try {
            let validate = JoiValidation.updateTimesheet(req.body.project_id, req.body.user_id, req.body.todo_id, req.body.note, req.body.reason, req.body.start_time, req.body.end_time, timesheet_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let get_timesheet = await TimesheetCURD.getSingleTimesheet(timesheet_id)
            if (get_timesheet.length == 0) return sendResponse(res, 400, null, 'Timesheets Not Found.', null);
            let project_id = req.body.project_id ? req.body.project_id : get_timesheet[0].project_id;
            let todo_id = req.body.todo_id || get_timesheet[0].todo_id;
            let user_id = req.body.user_id || get_timesheet[0].user_id;
            let start_time = req.body.start_time ? moment.utc(req.body.start_time).format('YYYY-MM-DD  HH:mm:ss') :
                moment.utc(get_timesheet[0].start_time).format('YYYY-MM-DD  HH:mm:ss');
            let end_time = req.body.end_time ? moment.utc(req.body.end_time).format('YYYY-MM-DD  HH:mm:ss') :
                moment.utc(get_timesheet[0].end_time).format('YYYY-MM-DD  HH:mm:ss');
            let note = req.body.note || get_timesheet[0].note;
            let reason = req.body.reason || get_timesheet[0].reason;

            let update_timesheet = await TimesheetCURD.updateTimesheet(timesheet_id, project_id, todo_id, user_id, start_time, end_time, note, reason);
            if (!update_timesheet) {
                return sendResponse(res, 400, null, 'Unable To Update Timesheet.', null);
            } else if (update_timesheet.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Timesheet Updated Successfully.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Update Timesheet.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Update Timesheet.', null);
        }

    }

    async deleteTimesheet(req, res) {
        let timesheet_ids = req.body.timesheet_ids;
        try {
            let validate = JoiValidation.deleteTimesheet(timesheet_ids);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            // let timesheet_data = await TimesheetCURD.getSingleTimesheet(timesheet_ids);
            // if (timesheet_data.length == 0) return sendResponse(res, 400, null, 'No Timesheets Found.', null);

            let delete_timesheet = await TimesheetCURD.deleteTimesheet(timesheet_ids);
            if (!delete_timesheet) {
                return sendResponse(res, 400, null, 'Unable To Delete Timesheets.', null);
            } else if (delete_timesheet.affectedRows > 0) {

                return sendResponse(res, 200, req.body, 'Timesheet Deleted Successfully.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Delete Timesheets.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Timesheets.', null);
        }

    }



}
module.exports = new Timesheet;
