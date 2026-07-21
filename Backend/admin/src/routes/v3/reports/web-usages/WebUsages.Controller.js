
const { reportMessage, productivityMessages } = require('../../../../utils/helpers/LanguageTranslate');
const { translate } = require('../../../../utils/messageTranslation');
const { WebUsagesModel } = require('./WebUsages.Model');
const { WebUsagesValidation } = require('./WebUsages.Validation');
const _ = require('underscore')

const maskingIP = require('../../../../utils/helpers/IPMasking');
class WebUsagesController {
    /**
     * getWebUsages - function to get the web usages
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    static async getWebUsages(req, res, next) {
        try {
            const { organization_id, role_id, employee_id: managerId, language } = req.decoded;
            let { startDate, endDate, url_id, status,
                skip, limit, employee_id,
                location_id, department_id, appIds, type } = await WebUsagesValidation.webUsages().validateAsync(req.body);

            //check the url_id is valid for organization or not
            if (!url_id && appIds.length == 0) return res.json({ code: 400, data: null, error: null, message: 'send either url_id or appIds' });
            if (url_id) {
                const checkUrl = await WebUsagesModel.checkWebUrl(url_id);
                if (!checkUrl) return res.json({ code: 400, data: null, error: null, message: 'please check URL' });
            }
            // get data for only active employees of the organization or assigned employees
            let activeEmployeeIds = null;
            if (employee_id) {
                activeEmployeeIds = await WebUsagesModel.getActiveEmployeeIds(organization_id, employee_id);
            } else if (managerId) {
                activeEmployeeIds = await WebUsagesModel.getEmployeeAssignedToManager(managerId, role_id);
            } else {
                activeEmployeeIds = await WebUsagesModel.getActiveEmployeeIds(organization_id);
            }
            // not active employee send no data
            if (!activeEmployeeIds) {
                return res.json({ code: 400, data: null, error: null, message: translate(reportMessage, "13", language) });
            }

            // get the active employees url stats
            const employee_ids = activeEmployeeIds.map(emp => emp.id);
            let [webUsagesCount, webUsagesData] = await Promise.all([
                WebUsagesModel.getWebUsages({ startDate, endDate, url_id, status, type: [1, 2], organization_id, isCountQuery: true, employee_ids, location_id, department_id, appIds }),
                WebUsagesModel.getWebUsages({ startDate, endDate, url_id, status, type: [1, 2], organization_id, skip, limit, employee_ids, location_id, department_id, appIds })
            ]);
            webUsagesCount = webUsagesCount[0] ? webUsagesCount[0].count : 0;
            // return if no data found
            if (!webUsagesData.length) {
                return res.json({ code: 400, data: null, error: null, message: translate(reportMessage, "13", language) });
            }
            let applicationIds = _.uniq(_.pluck(webUsagesData, "application_id").map(i => i.toString()))
            // fetching application name and type
            const applicationData = await WebUsagesModel.getAppNames(applicationIds)
            // add employee's details with the response
            if (webUsagesData.length) {
                const employeeIds = webUsagesData.map(usage => usage.employee_id);
                const employeeDetails = await WebUsagesModel.getEmployeesDetails(employeeIds);
                webUsagesData = webUsagesData.map(function (webUsages) {
                    let employee = employeeDetails.find(employee => employee.id == webUsages.employee_id);
                    let app = applicationData.find(i => i._id.toString() == webUsages.application_id.toString())
                    if (!employee) employee = {};
                    return { ...webUsages, appName: app.name, appType: app.type, employee };
                });
            }
            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))){
                webUsagesData = webUsagesData.map(e => {
                    e.appName = maskingIP(e.appName);
                    return e;
                });
            }
            return res.json({ code: 200, data: { webUsagesData, hasMoreData: !(skip || limit) || ((skip + limit) >= webUsagesCount) ? false : true, skipValue: skip + limit, limit: limit, totalCount: webUsagesCount }, error: null, message: 'User web usages' });
        } catch (err) {
            next(err)
        }
    }

    /**
     * Get application used user list
     * @function getAppUsedUserList
     * @memberof WebUsagesController
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    static async getAppUsedUserList(req, res, next) {
        try {
            const { organization_id, role_id, employee_id: managerId, language } = req.decoded;
            const { appIds, startDate, endDate, } = await WebUsagesValidation.validateAppIds().validateAsync(req.body);
            //get employee id's
            let employeesIds = managerId ? await WebUsagesModel.getEmployeeAssignedToManager(managerId, role_id) : await WebUsagesModel.getActiveEmployeeIds(organization_id, null);
            if (!employeesIds && employeesIds.length == 0) return res.json({ code: 400, data: null, error: null, message: translate(reportMessage, "13", language) });
            employeesIds = _.pluck(employeesIds, "id")

            //get application used employee
            let employeeData = await WebUsagesModel.getAppUsageEmployees({ employeesIds, appIds, startDate, endDate });
            if (employeeData.length == 0) return res.json({ code: 400, data: null, error: null, message: translate(reportMessage, "13", language) });

            //get employee full details
            employeeData = await WebUsagesModel.getEmployeesDetails(_.pluck(employeeData, "employee_id"))
            if (employeeData.length == 0) return res.json({ code: 400, data: null, error: null, message: translate(reportMessage, "13", language) });
            return res.json({ code: 200, data: employeeData, error: null, message: translate(productivityMessages, "5", language) });
        } catch (err) {
            next(err);
        }
    }

        /**
     * Get application used user list
     * @function getUserWeeklyApplicationUsage
     * @memberof WebUsagesController
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */

    static async getUserWeeklyApplicationUsage(req, res, next) {
        try {
            let { organization_id, language, } = req.decoded;

            let { employee_id, start_date, end_date, type, } = req.body;

            if (!employee_id || !type) return res.json({ code: 200, data: { data: [], count: 0 }, error: null, message: translate(productivityMessages, "5", language) });

            if (type) type = +type;
            if (employee_id) employee_id = +employee_id;

            if (moment(end_date).diff(moment(start_date), 'days') > 7) return res.json({ code: 404, data: [], error: null, message: "The difference between start date and end date cannot be more than 7 days" });
            let [employeeDetails] = await WebUsagesModel.getEmployeesDetailsOrg(organization_id, employee_id, start_date, end_date);
            if (!employeeDetails) return res.json({ code: 404, data: [], error: null, message: translate(groupMessages, "7", language) });

            let employeeAttendanceDetails = await WebUsagesModel.getEmployeesAttendance(organization_id, employee_id, start_date, end_date);
            if (employeeAttendanceDetails.length === 0) return res.json({ code: 404, data: [], error: null, message: translate(activityRequeat, "15", language) });

            let attendanceId = _.pluck(employeeAttendanceDetails, 'attendance_id');
            let response = [];
            let responseCount = [];

            for (const attId of attendanceId) {
                let tempResponse = [];
                let tempResponseA = [];
                if (type == 1) [tempResponse] = await Promise.all([
                    await WebUsagesModel.findApplicationUsageDayWise(employee_id, organization_id, [attId]),
                ])
                if (type == 2) [tempResponse] = await Promise.all([
                    await WebUsagesModel.findWebsiteUsageDayWise(employee_id, organization_id, [attId]),
                ])
                if (type == 3) [tempResponse, tempResponseA] = await Promise.all([
                    await WebUsagesModel.findApplicationUsageDayWise(employee_id, organization_id, [attId]),
                    await WebUsagesModel.findWebsiteUsageDayWise(employee_id, organization_id, [attId]),
                ])
                response = [...tempResponse, ...response, ...tempResponseA];
            }

            response = response.map(i => {
                let utcCutoff = moment(employeeAttendanceDetails.filter(x => x.attendance_id == i.attendance_id)[0]?.attendance_date);
                i.date = moment.tz(utcCutoff.format('YYYYMMDD HH:mm:ss'), 'YYYYMMDD HH:mm:ss', employeeDetails?.timezone || "Asia/Kolkata").format('YYYY-MM-DD');
                i.full_name = employeeDetails?.full_name;
                return i;
            })

            return res.json({ code: 200, data: { data: response, count: response.length }, error: null, message: translate(productivityMessages, "5", language) });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
}

module.exports.WebUsagesController = WebUsagesController;