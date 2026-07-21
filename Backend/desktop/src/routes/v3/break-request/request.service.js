'use strict';
const { Model } = require('./model');
const moment = require('moment');
const Validator = require('./request.validation.js');
const { logger: Logger } = require('../../../logs/Logger');
const _ = require("underscore");

class requestService {

    static async create(req, res, next) {
        try {
            let { employee_id: employeeId, organization_id: organizationId, language = "en", user_id } = req.decoded;
            let { offline_data: offlineData } = req.body;
            if (!offlineData?.length) return res.json({ code: 404, message: "Data is required", error: "Not Found" });

            // validation
            const { value, error } = Validator.offlineRequest(offlineData);
            if (error) return res.json({ code: 400, message: error.details[0].message, error: "Validation Error" });

            // get full offline data chunk here
            let [attendance] = await Model.getAttendanceId({ date: moment(value[0].date).format("YYYY-MM-DD"), employeeId, organizationId });

            if (!attendance) return res.json({ code: 400, data: null, message: "Attendance not found." })
            const { id: attendanceId, timezone, department_id } = attendance;

            let activities = await Model.getEmployeeActivities({ attendanceId });
            let finalActivities = await this.spliceNegativeEntities(activities);
            let { offlineEntities, totalOfflineTime } = await this.getOfflineActivities({ finalActivities });

            let previousReqTime = await Model.getPreviousReqBreakTime({ organizationId, employee_id: employeeId, date: moment(value[0].date).format("YYYY-MM-DD"), type: 2 });
            let previousOfflineTime = await Model.getTimeClaimRequest({ organization_id: organizationId, employee_id: employeeId, date: moment(value[0].date).format("YYYY-MM-DD"), type: 2, attendanceId })
            let status = 0; // 0 - Pending 1 - Approved 2 - Decline
            /* This Below condition check for admin and non admin auto approval for time claim request and 
                if anyone failed to approve goes to pending request 
                Case 1 :- Admin Enable & Manager1 Enable to status accept
                Case 2 :- Admin Enable & Manager1 Enable & Manager2 Enable to status accept
                Case 3 :- Admin Enable & Manager1 Disable to status pending
                Case 4 :- Admin Enable & Manager1 Enable & Manager2 Disable to status pending
            */
            let isApprovedOrg = await Model.isApprovedOrg(organizationId);
            isApprovedOrg = isApprovedOrg[0].auto_accept_time_claim;
            let assignedAdminId = await Model.getAssignedAdminId(user_id);
            assignedAdminId = _.pluck(assignedAdminId, "non_admin_id");
            let condition;
            let getNonAdminApproval;
            if (assignedAdminId.length != 0) {
                getNonAdminApproval = await Model.getNonAdminApproval(assignedAdminId);
                getNonAdminApproval = _.pluck(getNonAdminApproval, "auto_accept_time_claim");
            }
            else getNonAdminApproval = [];
            getNonAdminApproval.push(isApprovedOrg);
            condition = getNonAdminApproval.filter(x => x == "false");
            if (condition.length == 0) status = 1;
            
            offlineData = offlineData.reduce((arr, item) => {
                if (!arr.some(i => moment(i.start_time).isSame(item.start_time))) {
                    item.offline_time = moment(item.end_time).diff(item.start_time, 'seconds');
                    arr.push(item);
                }
                return arr;
            }, []);
            
            const insertedData = [];
            for (let item of offlineData) {
                /**
                 * check for offline chunk present in db 
                 * if chunk not present then skip inserting
                 */
                const index = offlineEntities.findIndex(i => moment(i.from).isSame(item.start_time) && moment(i.to).isSame(item.end_time));
                if (index === -1) continue;
                /**
                 * check for offline chunk already created in db 
                 * if created already created for break time then skip inserting
                 */
                const indexDb = previousReqTime.findIndex(i => moment(i.start_time).isSame(item.start_time) && moment(i.end_time).isSame(item.end_time));
                if (indexDb > -1) continue;
                /**
                 * check for offline chunk already created in db 
                 * if created already created for offline time claim then skip inserting
                 */
                const indexDbOffline = previousOfflineTime.findIndex(i => moment(i.start_time).isSame(item.start_time) && moment(i.end_time).isSame(item.end_time));
                if (indexDbOffline > -1) continue;

                let { reason, date, start_time, end_time, offline_time: offlineTime } = item;
                date = moment(date).format('YYYY-MM-DD');

                const getEployee = await Model.getEmployeeDetails({ organizationId, employee_ids: [employeeId], date });
                if (!getEployee || getEployee.length == 0) return sendResponse(res, 400, null, "Employee not found", null);

                if (previousReqTime.length > 0) totalOfflineTime = totalOfflineTime - previousReqTime[0].totalTime;

                if (totalOfflineTime < offlineTime) return sendResponse(res, 400, null, "Total offline time is less than your claim time", null);

                let insertRequest = await Model.create({
                    status,
                    employee_id: employeeId,
                    organization_id: organizationId,
                    reason, date,
                    attendance_id: getEployee[0].attendance_id,
                    offline_time: offlineTime,
                    start_time,
                    end_time
                });
                if (!insertRequest) return res.json({ code: 400, data: insertRequest, message: "Error occurred", error: null });
                insertedData.push(insertRequest);
                if (status == 1) {
                    await alterOfflineActivityTimeClaim({ req, res, request: insertRequest, offlineTime });
                }
            }
            return res.json({ code: 200, data: insertedData, message: "Request created successfully.", error: null });
        } catch (error) {
            return res.json({ code: 400, error: error.message });
        }
    }

    /**
     *  removing negative entities
     * @function spliceNegativeEntities
     * @memberof  Controller
     * @param {*} activities
     * @returns {*} removes all negative entities
     */
    static spliceNegativeEntities = (activities) => {
        for (let i = 0; i < activities.length - 1; i++) {
            let entity = moment(activities[i].end_time)
            let newEntity = moment(activities[i + 1].start_time)
            const offlineTime = newEntity.diff(entity, 'seconds')
            if (offlineTime < 0) {
                activities.splice(i + 1, 1)
                i--
            }
        }
        return activities;
    }

    /**
     *  gets offline activities
     * @function getOfflineActivity
     * @memberof  Controller
     * @param {number} attendanceId
     * @returns {*} gets offline breakdown 
     */
    static getOfflineActivities = async ({ finalActivities }) => {
        let offlineEntities = [], totalOfflineTime = 0;
        for (let i = 0; i < finalActivities.length - 1; i++) {
            let entity = moment.utc(finalActivities[i].end_time).add(1, 'seconds')
            let newEntity = moment.utc(finalActivities[i + 1].start_time)
            const offlineTime = newEntity.diff(entity, 'seconds')
            if (offlineTime >= 1) {
                totalOfflineTime += offlineTime
                offlineEntities.push({ offlineTime, from: entity, to: newEntity })
            }
        }
        return { offlineEntities, totalOfflineTime }
    }

    static async getOfflineTime(req, res, next) {
        try {
            let date = req.query.date;
            let { employee_id: employeeId, organization_id: organizationId, language = "en", user_id } = req.decoded;

            // get full offline data chunk here
            let [attendance] = await Model.getAttendanceId({ date: moment(date).format("YYYY-MM-DD"), employeeId, organizationId });

            if (!attendance) return res.json({ code: 400, data: null, message: "Attendance not found" });
            const { id: attendanceId, timezone, department_id } = attendance;

            let activities = await Model.getEmployeeActivities({ attendanceId });
            let finalActivities = await this.spliceNegativeEntities(activities);
            let { offlineEntities, totalOfflineTime } = await this.getOfflineActivities({ finalActivities });

            let previousReqBreakTime = await Model.getPreviousReqBreakTime({ organizationId, employee_id: employeeId, date: moment(date).format("YYYY-MM-DD") });
            let previousTimeClaimRequest = await Model.getTimeClaimRequest({ organization_id: organizationId, employee_id: employeeId, date: moment(date).format("YYYY-MM-DD"), type: 2, attendanceId })
            offlineEntities = offlineEntities.filter(item => {
                if (previousReqBreakTime.findIndex(i => moment(i.start_time).isSame(item.from) && moment(i.end_time).isSame(item.to)) === -1 && previousTimeClaimRequest.findIndex(i => moment(i.start_time).isSame(item.from) && moment(i.end_time).isSame(item.to)) === -1) return true;
            });

            return res.json({ code: 200, data: { offlineEntities, totalOfflineTime }, message: 'Success.' })
        } catch (err) {
            Logger.error(`----BreakRequest---OfflinetimeError-----${err}------${__filename}----`);
            return res.json({ code: 400, data: null, message: 'Something went wrong', error: err })
            next(err);
        }
    }

    static async createIdleRequest(req, res, next) {
        const { language, organization_id, timezone, user_id, employee_id } = req.decoded;
        try {
                const { value, error } = Validator.createIdleRequest(req.body);
                if (error) return res.status(400).json({
                    code: 400,
                    data: null,
                    error: error.details[0].message,
                    message: "Validation Error"
                })
                let { reason, date, start_time, end_time, activity_ids } = value;
                date = moment(date).format('YYYY-MM-DD');
                const getEployee = await Model.getEmployees({ organization_id, employee_ids: [employee_id] })
                if (!getEployee || getEployee.length == 0) return res.status(404).json({
                    code: 404,
                    data: null,
                    message: "Employee not found",
                    error: null
                });

                let attendance_id;
                let [attendance_data] = await Model.getAttendanceId({ date, employeeId: employee_id, organizationId: organization_id });
                if(!attendance_data) return res.status(404).json({
                    code: 404,
                    data: null,
                    message: "Attendance not found",
                    error: null
                })
                attendance_id = attendance_data.id;


                // Get Employee Activites
                let employeeActivities = await Model.getEmployeeActivityByIds(activity_ids);
                if (!employeeActivities.length) return res.status(400).json({
                    code: 400,
                    data: null,
                    message: "Employee activities not found",
                    error: null
                });
                let status = 0; // 0 - Pending 1 - Approved 2 - Decline

                /* This Below condition check for admin and non admin auto approval for time claim request and 
                    if anyone failed to approve goes to pending request 
                    Case 1 :- Admin Enable & Manager1 Enable to status accept
                    Case 2 :- Admin Enable & Manager1 Enable & Manager2 Enable to status accept
                    Case 3 :- Admin Enable & Manager1 Disable to status pending
                    Case 4 :- Admin Enable & Manager1 Enable & Manager2 Disable to status pending
                */
                let isApprovedOrg = await Model.isApprovedOrg(organization_id);
                isApprovedOrg = isApprovedOrg[0].auto_accept_time_claim;
                let assignedAdminId = await Model.getAssignedAdminId(user_id);
                assignedAdminId = _.pluck(assignedAdminId, "non_admin_id");
                let condition;
                let getNonAdminApproval;
                if (assignedAdminId.length != 0) {
                    getNonAdminApproval = await Model.getNonAdminApproval(assignedAdminId);
                    getNonAdminApproval = _.pluck(getNonAdminApproval, "auto_accept_time_claim");
                }
                else getNonAdminApproval = [];

                getNonAdminApproval.push(isApprovedOrg);
                condition = getNonAdminApproval.filter(x => x == "false");
                if (condition.length == 0) status = 1;

                // Check for duplicate idle request based on activity IDs
                let previousIdleRequest = await Model.getIdleRequest({ organization_id, employee_id, date, attendanceId: attendance_id });
                
                // Normalize current activity IDs to strings for comparison
                const currentActivityIds = activity_ids.map(id => {
                    if (!id) return null;
                    // Handle both ObjectId and string formats
                    return id.toString ? id.toString() : String(id);
                }).filter(id => id !== null);
                
                const isDuplicate = previousIdleRequest.some(prevRequest => {
                    if (!prevRequest || !prevRequest.activities || !Array.isArray(prevRequest.activities) || prevRequest.activities.length === 0) {
                        return false;
                    }
                    
                    const prevActivityIds = prevRequest.activities.map(act => {
                        if (!act || !act.activity_id) return null;
                        // Handle both ObjectId and string formats - normalize to string
                        const activityId = act.activity_id;
                        if (activityId && typeof activityId === 'object' && activityId.toString) {
                            return activityId.toString();
                        }
                        return String(activityId);
                    }).filter(id => id !== null && id !== 'null' && id !== 'undefined');
                    
                    // Check if any current activity ID exists in previous request's activity IDs
                    return currentActivityIds.some(currentId => {
                        return prevActivityIds.some(prevId => {
                            // Compare normalized strings
                            return String(currentId) === String(prevId);
                        });
                    });
                });
                if (isDuplicate) return res.status(400).json({
                    code: 400,
                    data: null,
                    message: "A request with overlapping activities already exists",
                    error: "Duplicate request"
                });

                let insertRequest = await Model.createIdleRequest({ employee_id, organization_id, reason, date, start_time, end_time, activities: employeeActivities, attendance_id, type: 1 });
                if (!insertRequest) return res.status(400).json({
                    code: 400,
                    data: null,
                    message: "Failed to create record",
                    error: null
                });

                insertRequest._doc.name = getEployee[0].name;

                const [adminDate] = await Model.getAdminData(organization_id);
                let managersList = await Model.getApprovers({ organization_id, employee_ids: [employee_id] });
                managersList = managersList.length > 0 ? managersList : [];
                if (managersList.length == 0) managersList.push({ ...adminDate, role: "admin" })
                insertRequest._doc = {
                    name: getEployee[0].name,
                    ...insertRequest._doc,
                    approvers: managersList
                    // start_time: moment(insertRequest._doc.start_time).tz(timezone).format("YYYY-MM-DD HH:MM:ss"),
                    // end_time: moment(insertRequest._doc.end_time).tz(timezone).format("YYYY-MM-DD HH:MM:ss"),
                }
                return res.json({
                    code: 200,
                    data: insertRequest,
                    message: "Success.",
                    error: null
                })
        }
        catch (err) {
            next(err);
        }
    }

    static async getReasons(req, res, next) {
        const { language = "en", is_admin, organization_id } = req.decoded;
        try {
            const { value: { type }, error } = Validator.getReason(req.query);
            if (error) return res.status(401).json({
                code: 401,
                data: null,
                message: "Validation Error",
                error: error.details[0].message
            });

            const [data] = await Model.findReasons({ organization_id, type });
            if (!data) return res.status(404).json({
                code: 404,
                data: [],
                message: "Not found",
                error: null
            });
            return res.status(200).json({
                code: 200,
                data: data,
                message: "Not found",
                error: null
            });
        } catch (error) {
            return res.status(404).json({
                code: 200,
                data: null,
                message: "Failed to fetch reasons.",
                error: error.message
            });
        }
    }
}

module.exports = requestService;

const alterOfflineActivityTimeClaim = async ({ req, res, request, offlineTime }) => {
    const { organization_id, permissionData = [], is_admin, user_id, language, first_name, last_name } = req.decoded;
    try {
        const { employee_id, date, attendance_id } = request;
        const prReport = await Model.getEmployeeProductivity({ date, employeeId: employee_id });
        if (!prReport) return res.json({
            code: 400,
            data: null,
            message: "Selected time range employee activity not found.",
            error: "Activity not found."
        });
        prReport.offline_time = prReport.offline_time + offlineTime;
        await prReport.save();
        request.status = 1;
        if (req.body.reason) request.reason = req.body.reason;
        return request.save();
    } catch (err) {
        Logger.error(`----error-----${err}------${__filename}----`);
        return res.json({
            code: 400,
            data: null,
            message: "Something went wrong.",
            error: err
        });
    }
}