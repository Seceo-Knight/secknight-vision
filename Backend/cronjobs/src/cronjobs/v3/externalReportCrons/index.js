const Model = require("./Model");

const moment = require('moment-timezone');
const _ = require("underscore");

const configENV = require("../../../../../config/config");
const { logger } = require("../../../utils/Logger");
const axios = require("axios");
const { Client } = require("@microsoft/microsoft-graph-client");

const hourToSeconds = (hours) => {
    const data = hours.split(":");
    return ((+data[0] * 3600) + (+data[1] * 60));
}

class ExternalReportController {
    async generateData(cb, dateProp) {
        console.log("==============Start for Tele-works crons===============");
        // ORG DATA FOR TOKEN 
        // EMPLOYEE SETTINGS FOR SINGLE ORG
        // CALCULATE DATA EXT
        // API CALL URL
        /*
            Steps to generate data and send it to api endpoint
            !! 1. Get List of all organization of tele-works which has stored token in db
            !! 2. Get List of all Employee of that organization
            !! 3. Check if shift is end based on timezone of employee at that day 
            !! 4. If shift is end in between 30 minutes then add employee to shift success array 
            !! 5. Check shift success array and remove employee whose data is successfully upload to client api
            !! 6. Generate the data of employee according to tele-works for completed task and other
            !! 7. Send data to external api and save user data and api response in each user data weather success or error
            !! 8. If user data failed to upload then upload in next slot of time
        */
        try {
            // * TODO:  
            //* Get Main Teleworks organization
            //* Based on Teleworks organization (reseller) find all organization under Teleworks
            //* Based on Organization 
            //* Rest step is same as above commented lines
            let teleWorksOrganizations = await Model.getTeleworksOrganization(configENV.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').filter(x => x));
            for (const teleOrg of teleWorksOrganizations) {
                let teleOrganizationData = await Model.findOrganizationUnderTeleWorks({ reseller_id: teleOrg.reseller_id });
                for (const orgData of teleOrganizationData) {
                    let timeZone = moment().tz(orgData.timezone);
                    let date = timeZone.format("YYYY-MM-DD");
                    if (dateProp) date = dateProp;
                    let employeesDetails = [];
                    let orgProductiveHours = 0;
                    let orgSettings = await Model.getOrganizationSettings(orgData.organization_id);
                    if (orgSettings.length !== 0) {
                        let setting = JSON.parse(orgSettings[0].rules);
                        orgProductiveHours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : hourToSeconds(setting.productiveHours.hour)) : 0;
                    }
                    let teleWorkEmployee = await Model.getEmployee({ organization_id: orgData.organization_id });
                    logger.error(`teleWorkEmployee count ${teleWorkEmployee.length}        Organization Id ${orgData?.organization_id}`)
                    if (teleWorkEmployee.length === 0) continue;
                    for (const empData of teleWorkEmployee) {
                        empData.shift_detail = JSON.parse(empData.shift_detail);
                        let employeeTime = moment().tz(empData.timezone);
                        let shiftDetail = empData.shift_detail[employeeTime.format('dddd').substring(0, 3).toLowerCase()];
                        if (shiftDetail.status) employeesDetails.push(empData);
                    }

                    let [teleWorksData] = await Model.checkifTeleWorksData({ organization_id: orgData.organization_id, date });
                    if (teleWorksData) {
                        // employeesDetails = employeesDetails.filter(i => !teleWorksData.successEmployeeIds.includes(i.emp_id));
                    }
                    logger.error(`employeesDetails count ${employeesDetails.length}`)
                    if (employeesDetails.length === 0) continue;
                    let employeeIds = _.pluck(employeesDetails, 'emp_id');
                    let userIds = _.pluck(employeesDetails, 'user_id');
                    let attendanceData = await Model.findAttendanceByDate({ date, employeeIds });
                    let employeeProductivityData = await Model.GetProductivity({ empids: employeeIds, organization_id: orgData.organization_id, dates: date, productive_hours: orgProductiveHours })
                    let employeeAttendanceTimeClaimData = [];
                    // let employeeAttendanceTimeClaimData = await Model.getEmployeeAttendanceTimeClaim({ empids: employeeIds, organization_id: orgData.organization_id, dates: date });

                    let taskDetails = await Model.getEmployeeTask({ date, employeeIds: userIds });
                    let temp = [];
                    for (const i of employeesDetails) {
                        let data = {};
                        data.IdNumber = i?.emp_code;
                        data.EstLaborOfficeId = orgData.reseller_id_client;
                        data.EstSequenceNumber = orgData.reseller_number_client;
                        data.manager_email = orgData.email;
                        data.email = i?.email;
                        data.ActivityLevel = `0 %`;
                        data.TotalWorkTime = `0 mins`;
                        data.AssignedTasks = 0;
                        data.CompletedTasks = 0;
                        data.LoginCount = 0;
                        data.LogoutCount = 0;
                        attendanceData.findIndex(x => x.employee_id === i.emp_id) > -1 ? data.LoginCount = 1 : data.LogoutCount = 1;
                        let productivity = employeeProductivityData.filter(y => y.employee_id === i.emp_id);

                        let activityLogs = employeeAttendanceTimeClaimData.filter(x => x.employee_id == i.emp_id);
                        let totalDurationInMinutes = 0;

                        activityLogs.forEach(entry => {
                            const startTime = moment(entry.start_time);
                            const endTime = moment(entry.end_time);
                            const duration = moment.duration(endTime.diff(startTime));
                            totalDurationInMinutes += duration.asMinutes();
                        });

                        if (productivity.length !== 0) {
                            data.TotalWorkTime = `${(productivity[0].office_time / 60) + totalDurationInMinutes} mins`;
                            data.ActivityLevel = `${Math.round(productivity[0].productivity * 100) / 100} %`;
                        }
                        else if (totalDurationInMinutes) {
                            data.LoginCount = 1;
                            data.LogoutCount = 0;
                            data.TotalWorkTime = `${totalDurationInMinutes} mins`;
                            totalDurationInMinutes = 0;
                        }
                        let tasks = taskDetails.filter(z => z.employee_id === i.user_id);
                        if (tasks.length != 0) {
                            data.AssignedTasks = tasks.length;
                            data.CompletedTasks = tasks.filter(z => moment(moment(z.end_date).format('YYYY-MM-DD')).isSame(moment(date).format('YYYY-MM-DD'))).length;
                        }
                        temp.push(data);
                    }
                    employeesDetails = temp;
                    let ifExist = await Model.checkifTeleWorksData({ organization_id: orgData.organization_id, date });
                    let idsNumber = _.pluck(employeesDetails, "IdNumber");
                    if (ifExist.length) {
                        let data = ifExist[0].employeesDetails.filter(i => {
                            if (!idsNumber.includes(i.IdNumber)) return true;
                        })
                        ifExist[0].employeesDetails = data;
                        ifExist[0].save();
                    }

                    const axios = require('axios');
                    const data = JSON.stringify(employeesDetails);

                    const config = {
                        method: 'post',
                        // maxBodyLength: Infinity,
                        url: 'https://teleworks.sa/sp-reports.php',
                        headers: {
                            'Sp-Token': teleOrg.spToken,
                            'Est-Labor-Office-Id': teleOrg.labourOfficeId,
                            'Est-Sequence-Number': teleOrg.sequenceNumber,
                            'Content-Type': 'application/json'
                        },
                        data: data
                    };
                    console.log(`++++++++++++++++++++++++++++${employeesDetails?.length}+++++++++++++++++++++++++++++++++++++++`);
                    axios(config)
                        .then(async function (response) {
                            if (response.data.success) await Model.insertData({ type: "success", date, organization_id: orgData.organization_id, employeesDetails: employeesDetails, api_response: response.message, employee_id: employeeIds })
                            else await Model.insertData({ type: "failed", date, organization_id: orgData.organization_id, employeesDetails: employeesDetails, api_response: response.message, employee_id: employeeIds })
                        })
                        .catch(async function (error) {
                            await Model.insertData({ type: "failed", date, organization_id: orgData.organization_id, employeesDetails: employeesDetails, api_response: error?.response?.data?.message ?? "Internal Error", employee_id: employeeIds })
                        });
                }
            }
        } catch (error) {
            console.log(error)
            console.log(error.message)
        }
        if (cb !== "") return cb();
    }

    async taskDisabled(cb) {
        try {
            let timeIso = moment().utc().toISOString();
            let tasks = await Model.getActiveTasks();
            if(tasks.length == 0) return cb();
            let assigned_users_id = Array.from(new Set(_.pluck(tasks, 'assigned_user')));
            let employee_details = await Model.getEmployeeDetails(assigned_users_id);
            
            for(let emp_detail of employee_details) {
                const currentTime = moment().tz(emp_detail.timezone);
                if(currentTime.hour() == 0 && currentTime.minutes() < 30) {
                    let employee_tasks = tasks.filter(t => t.assigned_user == emp_detail.id);
                    for(let task of employee_tasks) {
                        let end_time = null;
                        let total_task_time = 0;
                        let productivity_report_id = "";
                        for(let tws of task.task_working_status) {
                            if(tws.start_time && tws.end_time) continue;
                            end_time = moment(tws.start_time || timeIso).tz(emp_detail.timezone).clone().endOf('day').utc().toISOString();
                            tws.end_time = end_time;
                            total_task_time += moment(end_time).diff(moment(tws.start_time), 'seconds');
                            productivity_report_id = tws.productivity_report_id;
                            break;
                        }
                        // update task in task details
                        // update clock in records
                        let { assigned_user, organization_id, } = task;
                        let prReport = await Model.getEmployeeAttendanceReport(productivity_report_id);

                        if(task && !prReport) {
                            task.is_desktop_running = false;
                            task.is_mobile_running = false;
                            await task.save();
                        }
                        if (!prReport) continue;
                        let [employeeAttendance] = await Model.getEmployeeAttendanceSilah(prReport.date, emp_detail.id);
                        if(!employeeAttendance) {
                            task.status = 2;
                            task.total_working_time += total_task_time;
                            task.is_desktop_running = false;
                            task.is_mobile_running = false;
                            await task.save();
                            if (prReport) {
                                prReport.productive_duration += total_task_time;
                                prReport.logged_duration += total_task_time;
                                await prReport.save();
                            }
                            continue;
                        }
                        if (employeeAttendance && prReport) {
                            task.status = 2;
                            task.total_working_time += total_task_time;
                            task.is_desktop_running = false;
                            task.is_mobile_running = false;
                            await task.save();
                            prReport.productive_duration += total_task_time;
                            prReport.logged_duration += total_task_time;
                            await prReport.save();
                            let response = await Model.updateEmployeeAttendance(employeeAttendance.id, organization_id, '', moment(end_time).format('YYYY-MM-DD HH:mm:ss'));
                            console.log({response} );
                        }
                    }
                } else continue;
            }
        }
        catch (e) {
            console.log(e);
            console.log(e.message);
        }
        return cb();
    }

    /*
        @function: oneDriveCalendarSync
        @description: Syncs calendar events from OneDrive to the local database as an application activity.
        @param {function} cb - Callback function to be executed after the sync process is complete.
        @returns {Promise<void>} - Returns a promise that resolves when the sync process is complete.
        @throws {Error} - Throws an error if there is an issue with the OneDrive API or database operations.
    */
    async oneDriveCalendarSync(cb) {
        let organization_id = configENV.ONE_DRIVE_CALENDAR_SYNC;
        try {

            let [result] = await Model.getStorageDetails(organization_id);
            if (result?.short_code !== 'MO') {
                console.log({
                    message: "Microsoft One Drive is not available",
                })
                return cb();
            }
            let credentials = JSON.parse(result.creds);
            let tenantId = credentials.tenantId;
            if(!tenantId) {
                console.log({
                    message: "Tenant ID is not available",
                    error: "Calendar Sync Failed",
                })
                return cb();
            }
            let accessToken = await getAccessToken(tenantId, credentials.onedrive_client_id, credentials.onedrive_client_secret, credentials.onedrive_refresh_token);
            let client = getGraphClient(accessToken);

            let [users, employees] = await Promise.all([
                client.api("/users").top(999).get(),
                Model.getAllEmployees(organization_id)
            ]);

            let finalEvents = [];
            for (const user of mergeUsersAndEmployees(users.value, employees)) {
                try {
                    const userEvents = await fetchUserEvents(user.ms_id, accessToken);
                    console.log(`Fetched ${userEvents.length} events for user ${user.id}`);
                    finalEvents.push({
                        userEvents: userEvents,
                        userDetails: user
                    });
                } catch (error) {
                    console.error(`Error fetching events for user ${user.id}:`, error);
                }
            }

            let app = await Model.checkApplicationByName("Teams - Offline", organization_id);
            if (!app) {
                let applicationData = {
                    name: "Teams - Offline",
                    type: 1,
                    organization_id: organization_id,
                    is_new: true,
                }
                app = await Model.createTeamsOfflineMeetApplication(applicationData);
            }


            for (const event of finalEvents) {
                let { first_name, last_name, user_id, id, ms_id, timezone, userEmail, department_id, location_id } = event.userDetails;
                for (const e of event.userEvents) {
                    let { subject, start, end, isOnlineMeeting } = e;
                    let current_time = moment().tz(timezone);
                    let data = await getTimeLineGraphsData({ language: "en", organization_id }, id, current_time.format('YYYY-MM-DD'));


                    let startOfDay = current_time.clone().startOf("day").utc();
                    let endOfDay = current_time.clone().endOf("day").utc();
                    
                    let startTime = moment(start.dateTime).utc();
                    let endTime = moment(end.dateTime).utc();
                    
                    // Skip if start or end is outside today's range
                    if (startTime.isBefore(startOfDay) || endTime.isAfter(endOfDay)) continue;
                    
                    // Skip if start or end is in the future
                    if (startTime.isAfter(current_time) || endTime.isAfter(current_time)) continue;
                    
                    
                    if (!data) {
                        let start_time = start.dateTime;
                        let end_time = end.dateTime;
                        if (moment(start_time).isBetween(current_time.clone().startOf("day").utc().toISOString(), current_time.clone().endOf("day").utc().toISOString()) && moment(end_time).isBetween(current_time.clone().startOf("day").utc().toISOString(), current_time.clone().endOf("day").utc().toISOString())) {
                            // attendance_id
                            // application_id
                            let attendance_id = await Model.addEmployeeAttendance(id, organization_id, start_time, end_time, current_time.format('YYYY-MM-DD'), 1);
                            start_time = moment(start_time).format('YYYY-MM-DDTHH:mm:ss') + ".000+00:00";
                            end_time = moment(end_time).format('YYYY-MM-DDTHH:mm:ss') + ".000+00:00";
                            let appData = {
                                start_time,
                                end_time,
                                employee_id: id,
                                organization_id,
                                title: subject,
                                attendance_id: attendance_id.insertId,
                                activeData: [{
                                    start_time,
                                    end_time
                                }],
                                active_seconds: moment(end_time).diff(moment(start_time), 'seconds'),
                                total_duration: moment(end_time).diff(moment(start_time), 'seconds'),
                                application_id: app._id
                            }
                            await Model.addEmployeeActivity(appData);
                            let applicationStatus = await Model.findApplicationProductivityStatus(app._id, department_id);
                            // console.log(applicationStatus.status) // 0-Neutral, 1-productive, 2-non productive
                            let durationSecond = moment(end_time).diff(moment(start_time), 'seconds');
                            await Model.createEmployeeProductivityReport({
                                application_id: app._id,
                                organization_id,
                                employee_id: id,
                                productive_duration: applicationStatus.status == 1 ? durationSecond : 0,
                                non_productive_duration: applicationStatus.status == 2 ? durationSecond : 0,
                                neutral_duration: applicationStatus.status == 0 ? durationSecond : 0,
                                department_id,
                                location_id,
                                date: current_time.format('YYYY-MM-DD'),
                                durationSecond
                            })
                        }
                    }
                    else {
                        let isBetweenActiveEntities = false;
                        let start_time = start.dateTime;
                        let end_time = end.dateTime;
                        start_time = moment(start_time).format('YYYY-MM-DDTHH:mm:ss') + ".000+00:00";
                        end_time = moment(end_time).format('YYYY-MM-DDTHH:mm:ss') + ".000+00:00";

                        data.data.activeEntities.forEach(entity => {
                            if (
                                (moment(start_time).isBetween(entity.from.toISOString(), entity.to.toISOString()) ||
                                    moment(end_time).isBetween(entity.from.toISOString(), entity.to.toISOString()) ||
                                    (moment(start_time).isBefore(entity.to.toISOString()) && moment(end_time).isAfter(entity.from.toISOString())))
                            ) {
                                isBetweenActiveEntities = true;
                            }
                        });
                        if (isBetweenActiveEntities) continue;
                        else {
                            let [attendance_date] = await Model.getEmployeeAttendance(id, organization_id, current_time.format('YYYY-MM-DD'));
                            let attendance_id;


                            if (moment(start_time).isBefore(attendance_date.start_time)) {
                                await Model.updateEmployeeAttendance(id, organization_id, start_time, null, attendance_date.id);
                                attendance_id = attendance_date;
                                attendance_id.insertId = attendance_date.id;
                            }

                            if (moment(end_time).isAfter(attendance_date.end_time)) {
                                await Model.updateEmployeeAttendance(id, organization_id, null, end_time, attendance_date.id);
                                attendance_id = attendance_date;
                                attendance_id.insertId = attendance_date.id;
                            }

                            if(!attendance_id) {
                                attendance_id = attendance_date;
                                attendance_id.insertId = attendance_date.id;
                            }

                            let appData = {
                                start_time,
                                end_time,
                                employee_id: id,
                                organization_id,
                                title: subject,
                                attendance_id: attendance_id.insertId,
                                activeData: [{
                                    start_time,
                                    end_time
                                }],
                                active_seconds: moment(end_time).diff(moment(start_time), 'seconds'),
                                total_duration: moment(end_time).diff(moment(start_time), 'seconds'),
                                application_id: app._id
                            }
                            await Model.addEmployeeActivity(appData);
                            let applicationStatus = await Model.findApplicationProductivityStatus(app._id, department_id);
                            // console.log(applicationStatus.status) // 0-Neutral, 1-productive, 2-non productive
                            let durationSecond = moment(end_time).diff(moment(start_time), 'seconds');
                            let prReports = await Model.getEmployeeProductivityReport(id, organization_id, current_time.format('YYYY-MM-DD'));
                            if (prReports) {
                                switch (applicationStatus.status) {
                                    case 1:
                                        prReports.productive_duration += durationSecond;
                                        break;
                                    case 2:
                                        prReports.non_productive_duration += durationSecond;
                                        break;
                                    case 0:
                                        prReports.neutral_duration += durationSecond;
                                        break;
                                }
                                prReports.logged_duration += durationSecond;
                                await prReports.save();
                            }
                            else await Model.createEmployeeProductivityReport({
                                application_id: app._id,
                                organization_id,
                                employee_id: id,
                                productive_duration: applicationStatus.status == 1 ? durationSecond : 0,
                                non_productive_duration: applicationStatus.status == 2 ? durationSecond : 0,
                                neutral_duration: applicationStatus.status == 0 ? durationSecond : 0,
                                department_id,
                                location_id,
                                date: current_time.format('YYYY-MM-DD'),
                                durationSecond
                            })
                        }
                    }
                }
            }

            console.log({
                message: "User details retrieved successfully, calendar sync complete",
                finalEvents,
            })
            return cb();
        } catch (error) {
            console.error("Error fetching user details:", error);
            if (error.response && error.response.data) {
                console.log({
                    message: "Internal Server Error",
                    error: error.response.data.error.message,
                });
            } else {
                console.log({
                    message: "Internal Server Error",
                    error: error.message,
                });
            }
            return cb();
        }
    }
}

module.exports = new ExternalReportController;


// For Silah to update there old data in teleworks module as requested one time code need to remove later.
// (function () {
//     let ExternalReport = new ExternalReportController;
//     const startDate = moment('2023-12-01');
//     const endDate = moment('2024-01-16');

//     // Create an array to store the dates
//     let datesArray = [];

//     // Loop through the dates and add them to the array
//     while (startDate <= endDate) {
//         datesArray.push(startDate.format('YYYY-MM-DD'));
//         startDate.add(1, 'days');
//     }

//     setTimeout(() => {
//         for (const item of datesArray) {
//             ExternalReport.generateData("" , item);
//         }
//     }, 1000 * 10);
// }())



const filterEntities = ({ offlineEntities, idleEntities, previousReqOfflineTime, previousReqIdleTime, previousBreakTime }) => {
    offlineEntities = offlineEntities.filter(entity => {
        const offlineIndex = previousReqOfflineTime.findIndex(i => moment(i.start_time).isSame(entity.from) && moment(i.end_time).isSame(entity.to));
        const breakIndex = previousBreakTime.findIndex(i => moment(i.start_time).isSame(entity.from) && moment(i.end_time).isSame(entity.to));
        if (offlineIndex === -1 && breakIndex === -1) return entity;
    });
    idleEntities = idleEntities.filter(entity => {
        const idleIndex = previousReqIdleTime.findIndex(i => moment(i.start_time).isSame(entity.start_time) && moment(i.end_time).isSame(entity.end_time));
        if (idleIndex === -1) return entity;
    });

    return { offlineEntitiesD: offlineEntities, idleEntitiesD: idleEntities };
}

const myFunc = (arr) => {
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        if (!newArr.length) { newArr.push({ start_time: item.start_time, end_time: item.end_time }); continue };
        if (moment(newArr[newArr.length - 1].end_time).isSame(arr[i]?.start_time)) {
            newArr[newArr.length - 1].end_time = arr[i]?.end_time;
        } else {
            newArr.push({ start_time: item.start_time, end_time: item.end_time });
        }
    }
    return newArr;
}

const getActivityBreakDown = async ({ finalActivities, employeeId, department_id }) => {
        const applicationIds = _.pluck(finalActivities, "application_id");
        const domainIds = _.pluck(finalActivities, "domain_id").filter(x => x);

        const statuses = await Model.getApplicationsStatus([...applicationIds, ...domainIds], department_id);
        let productiveEntities = [];
        let unProductiveEntities = [];
        let neturalEntities = [];
        let idleEntities = [];

        for (const activity of finalActivities) {
            let activityId = activity?.url ? activity.domain_id : activity.application_id;
            const status = statuses[activityId];
            const final_status = activityId in statuses ? ('0' in status ? status['0'] : status[department_id]) : null;
            if (final_status == 0) {
                // Netural
                if (activity?.activeData) {
                    for (let entity of activity?.activeData) {
                        // if (neturalEntities.findIndex(i => moment(i.start_time).isSame(entity.start_time) && moment(i.end_time).isSame(entity.end_time)) === -1)
                        neturalEntities.push(entity);
                    }
                }
            }
            else if (final_status == 1) {
                // productive
                if (activity?.activeData) {
                    for (let entity of activity?.activeData) {
                        productiveEntities.push(entity);
                    }
                }
            }
            else if (final_status == 2) {
                // unproductive
                if (activity?.activeData) {
                    for (let entity of activity?.activeData) {
                        unProductiveEntities.push(entity);
                    }
                }
            }
            if (activity?.idleData) {
                // idle
                for (let entity of activity?.idleData) {
                    idleEntities.push(entity);
                }
            }
        }

        productiveEntities.sort(function (a, b) {
            return moment(a.start_time).diff(moment(b.start_time));
        });
        unProductiveEntities.sort(function (a, b) {
            return moment(a.start_time).diff(moment(b.start_time));
        });
        neturalEntities.sort(function (a, b) {
            return moment(a.start_time).diff(moment(b.start_time));
        });
        idleEntities.sort(function (a, b) {
            return moment(a.start_time).diff(moment(b.start_time));
        });

        productiveEntities = myFunc(productiveEntities);
        unProductiveEntities = myFunc(unProductiveEntities);
        neturalEntities = myFunc(neturalEntities);
        idleEntities = myFunc(idleEntities);

        return {
            productiveEntities, unProductiveEntities, neturalEntities, idleEntities
        };
}

const getActiveActivities = async ({ finalActivities }) => {
    let activeEntities = [], totalActiveTime = 0;
    let startEntity = [];
    for (let i = 0; i < finalActivities.length - 1; i++) {
        let entity = moment.utc(finalActivities[i].end_time)
        let newEntity = moment.utc(finalActivities[i + 1].start_time)
        const diffTime = newEntity.diff(entity, 'seconds')
        // if the difference is coming then we have to keep track of first entity start_time
        if (diffTime == 0) {
            startEntity.push(moment.utc(finalActivities[i].start_time));
        }
        // if start time and end time is subtracted here
        // if startEntity array has values the first value of that array is taken as start time
        else {
            let startTime = (startEntity.length == 0) ? moment.utc(finalActivities[i].start_time) : startEntity[0];
            let endTime = moment.utc(finalActivities[i].end_time)
            const activeTime = endTime.diff(startTime, 'seconds')
            activeEntities.push({ activeTime, from: startTime, to: endTime });
            totalActiveTime += activeTime
            startEntity = [];
        }
    }
    //once loop is completed then one last entity will be left. The calculation is done here
    //if startEntity array has values then the first value of that array will be taken as start time
    let startTime = (startEntity.length != 0) ? startEntity[0] : moment.utc(finalActivities[finalActivities.length - 1]?.start_time);
    let endTime = moment.utc(finalActivities[finalActivities.length - 1]?.end_time)
    const activeTime = endTime.diff(startTime, 'seconds')
    activeEntities.push({ activeTime, from: startTime, to: endTime });
    totalActiveTime += activeTime
    return { activeEntities, totalActiveTime }
}

const getOfflineActivities = async ({ finalActivities }) => {
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


const getTimeLineGraphsData = async (req, employeeId, date) => {
    let { organization_id: organizationId, language } = req;
    try {
        let [attendance] = await Model.getAttendanceId({ date, employeeId, organizationId });
        if (!attendance) return false;

        const { id: attendanceId, timezone, department_id } = attendance;

        let activities = await Model.getEmployeeActivities({ attendanceId });

        let startTime = moment(date).add(-1, "day").utc().toISOString();
        let endTime = moment(date).add(2, "day").utc().toISOString();

        let finalActivities = await spliceNegativeEntities(activities);
        let { offlineEntities, totalOfflineTime } = await getOfflineActivities({ finalActivities })
        let { activeEntities, totalActiveTime } = await getActiveActivities({ finalActivities });
        let attendanceTimeClaim = await Model.getAttendanceTimeClaimRequest(startTime, endTime, employeeId, organizationId);
        let manualTimeClaim = []
        attendanceTimeClaim.map(i => {
            manualTimeClaim.push({
                from: moment(i.start_time),
                to: moment(i.end_time),
            })
        })
        let {
            totalProductiveTime, totalUnProductiveTime, totalNeturalTime, totalIdleTime, productiveEntities, unProductiveEntities, neturalEntities, idleEntities
        } = await getActivityBreakDown({ finalActivities, employeeId, department_id });


        let previousReqOfflineTime = await Model.getTimeClaimRequestTimesheet({ organization_id: organizationId, attendanceId, employee_id: +employeeId, date: moment(date).format("YYYY-MM-DD"), type: 2 });
        let tempPreviousReqIdleTime = await Model.getIdleTimeClaimRequestTimesheet({ organization_id: organizationId, attendanceId, employee_id: +employeeId, date: moment(date).format("YYYY-MM-DD"), type: 1 });
        let previousBreakTime = [];
        let temp = [], previousReqIdleTime = { result: [] };

        tempPreviousReqIdleTime.map(({ result }) => {
            previousReqIdleTime.result.push(...result)
        })
        previousReqIdleTime?.result?.map(({ idleData }) => {
            temp.push(...idleData)
        });
        temp.sort(function (a, b) {
            return moment(a.start_time).diff(moment(b.start_time));
        });
        temp = myFunc(temp);
        let { offlineEntitiesD, idleEntitiesD } = filterEntities({ offlineEntities, idleEntities, previousReqOfflineTime, previousReqIdleTime: temp, previousBreakTime });
        let mobileUsageEntities = [], offlineEntitiesDN = [];

        let offTime = [];
        offlineEntitiesDN = offTime;
        return {
            code: 200,
            data: {
                timezone,
                totalOfflineTime,
                totalActiveTime,
                activeEntities,
                offlineEntities: offlineEntitiesDN,
                totalProductiveTime,
                isNewGraphData: true,
                totalUnProductiveTime,
                totalNeturalTime,
                totalIdleTime,
                productiveEntities,
                unProductiveEntities,
                neturalEntities,
                idleEntities: idleEntitiesD,
                breakEntities: previousBreakTime,
                offlineTimeClaimEntities: previousReqOfflineTime,
                idleTimeClaimEntities: temp,
                mobileUsageEntities: mobileUsageEntities,
                manualTimeClaim,
                breakTime: []
            },
            message: "Success"
        }
    }
    catch (err) {
        console.log("Error", err);
        return false;
    }
}




async function getAccessToken(tenantId, clientId, clientSecret) {
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
    });

    try {
        const response = await axios.post(tokenEndpoint, params);
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

/**
 *  removing negative entities
 * @function spliceNegativeEntities
 * @memberof  Controller
 * @param {*} activities
 * @returns {*} removes all negative entities
 */
const spliceNegativeEntities = (activities) => {
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

function getGraphClient(accessToken) {
    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });
}



async function fetchUserEvents(userId, accessToken) {
    const graphClient = Client.init({
        authProvider: (done) => done(null, accessToken),
    });

    try {
        const yesterday = moment().subtract(2, 'day').format('YYYY-MM-DD');
        const todayDay = moment().add(1, 'day').format('YYYY-MM-DD');

        // Fetch events within the specified date range
        const events = await graphClient
            .api(`/users/${userId}/events`)
            .filter(`start/dateTime ge '${yesterday}T00:00:00Z' and end/dateTime le '${todayDay}T23:59:59Z'`)
            .skip(0)
            .top(1000)
            .get();

        // Filter out online meetings programmatically
        const filteredEvents = events.value;

        return filteredEvents;
    } catch (error) {
        if (error.code === 'ErrorItemNotFound') {
            console.error(`No calendar found for user ${userId}`);
        } else {
            console.error('Error fetching events:', error);
        }
        return [];
    }
}


function mergeUsersAndEmployees(users, employees) {
    let mergedData = [];

    // Convert employees array into a Map for quick lookup by email
    let employeeMap = new Map(employees.map(emp => [emp?.a_email?.toLowerCase() ?? emp?.email?.toLowerCase(), emp]));

    users.forEach(user => {
        let userEmail = user?.mail?.toLowerCase();
        if (employeeMap.has(userEmail)) {
            let employee = employeeMap.get(userEmail);

            // Merge user and employee data while maintaining separate IDs
            mergedData.push({
                ms_id: user.id,
                userEmail: user.mail,
                timezone: employee.timezone,
                id: employee.id,
                user_id: employee.user_id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                // emp_code: employee.emp_code,
                department_id: employee.department_id,
                location_id: employee.location_id,
                // department_name: employee.department_name,
            });
        }
    });

    return mergedData;
}