const ExternalModel = require('./External.Model')
const ExternalValidation = require('./External.Validation')
const ActivityRequestModel = require('../settings/activityrequest/model');

const _ = require('underscore');
const moment = require("moment");

const redisServices = require("../auth/services/redis.service");
const { resellerMessage, groupMessages } = require('../../../utils/helpers/LanguageTranslate');
const { translate } = require('../../../utils/messageTranslation');
const passwordService = require("../auth/services/password.service");

const EventEmitter = require('events');
const shortnerService = require('../auth/services/shortner.service');
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0);



class ExternalController {
    static async getTeleWorksData(req, res) {
        try {
            let { organization_id } = req.decoded;
            let { start_date = moment().format("YYYY-MM-DD"), end_date = moment().format("YYYY-MM-DD") } = req.query;
            start_date = moment(start_date).format("YYYY-MM-DD");
            end_date = moment(end_date).format("YYYY-MM-DD");
            let getOrgUnderReseller = await ExternalModel.getOrganizationUnderReseller(organization_id);
            if (getOrgUnderReseller.length === 0) return res.json({ code: 400, error: null, data: [], message: "No data for this org" });
            getOrgUnderReseller = _.pluck(getOrgUnderReseller, "organization_id");

            let data = await ExternalModel.getOrgTeleWorksData({ getOrgUnderReseller, start_date, end_date });
            return res.json({ code: 200, data: data, error: null, message: "Success" });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }


    static async addTokenTeleWorksData(req, res) {
        try {
            let { organization_id } = req.decoded;
            let validate = await ExternalValidation.addTokenTeleWorksDataValidate().validateAsync(req.body);
            let { spToken, labourOfficeId, sequenceNumber, timezone, time } = validate;
            let checkIfExist = await ExternalModel.getTeleWorksTokens(organization_id);
            if (checkIfExist.length === 0) {
                await ExternalModel.createTokenData({ spToken, labourOfficeId, sequenceNumber, timezone, time, organization_id });
                return res.json({ code: 200, data: null, message: "Updated Successfully", error: null });
            }
            await ExternalModel.updateTokenData({ spToken, labourOfficeId, sequenceNumber, timezone, time, organization_id })
            return res.json({ code: 200, data: null, message: "Updated Successfully", error: null })
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    static async getTokenTeleWorksData(req, res) {
        try {
            let { organization_id } = req.decoded;
            let checkIfExist = await ExternalModel.getTeleWorksTokens(organization_id);
            return res.json({ code: 200, data: checkIfExist[0] ?? null, message: "Success", error: null })
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }
    static async getAssignedEmployeeManager(req, res) {
        try {
            let { organization_id, user_id, language } = req.decoded;
            let { skip = 0, limit = 10, search = "" } = req.query;
            let [reseller] = await ExternalModel.getResellerId(user_id);
            const resellerId = reseller?.id;
            let orgs = await ExternalModel.getOrganizations(resellerId)
            if (orgs.length === 0) return res.json({ code: 400, error: null, data: null, message: "No data found" });
            let orgIds = _.pluck(orgs, "id")

            let [data, dataCount] = await Promise.all([
                ExternalModel.getEmployees(orgIds, skip, limit, search),
                ExternalModel.getEmployeesCount(orgIds, search)
            ])
            return res.json({ code: 200, data: { employeeDetails: data, employeeCount: dataCount[0].total_count }, error: null, message: "Success" });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    static async getNonAdminList(req, res) {
        try {
            let { organization_id, language } = req.decoded;

            let data = await ExternalModel.getNonAdminList(organization_id);
            return res.json({ code: 200, data: data, error: null, message: "Success" });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    static async assignToEmployee(req, res) {
        try {
            let { organization_id, language } = req.decoded;
            let { role_id, manager_id, employee_id } = req.body;

            // Check if employee exist
            let isOrgEmployee = await ExternalModel.checkIsOrgEmployee(organization_id, employee_id);
            let isOrgManager = await ExternalModel.checkIsOrgEmployee(organization_id, manager_id);
            if (isOrgManager.length !== 0 && isOrgEmployee.length !== 0) {
                let data = await ExternalModel.assignedEmployee(role_id, manager_id, employee_id);
                return res.json({ code: 200, data: data.insertId, error: null, message: "Success" });
            }
            return res.json({ code: 200, data: null, error: null, message: "Employee Id or Manager Id is Invalid" });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    static async deleteAssignedEmployees(req, res) {
        try {
            let { organization_id, language } = req.decoded;
            let { role_id, manager_id, employee_id } = req.body;

            // Check if employee exist
            let isOrgEmployee = await ExternalModel.checkIsOrgEmployee(organization_id, employee_id);
            let isOrgManager = await ExternalModel.checkIsOrgEmployee(organization_id, manager_id);
            if (isOrgManager.length !== 0 && isOrgEmployee.length !== 0) {
                let data = await ExternalModel.removedAssignedEmployee(role_id, manager_id, employee_id);
                return res.json({ code: 200, data: data.affectedRows, error: null, message: "Success" });
            }
            return res.json({ code: 200, data: null, error: null, message: "Employee Id or Manager Id is Invalid" });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    
    static async assignEmployeeReseller(req, res, next) {
        try {
            let { organization_id, language, user_id } = req.decoded;
            let validate = await ExternalValidation.assignEmployeeResellerValidation().validateAsync(req.body);
            let { employee_id, reseller_organization_id } = validate;

            let employeeData = [];
            if(employee_id.length) employeeData = await ExternalModel.getEmployeesData(employee_id);
            //if(employeeData.length == 0) return res.json({ code: 400, data: null, error: null, message: "Employees not found" });

            const [reseller] = await ExternalModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            let [resellerDetails] = await ExternalModel.getResellerDetails(reseller.reseller_id, reseller_organization_id);
            if (!resellerDetails) return res.json({ code: 400, data: null, message: translate(groupMessages, "5", language), err: null });

            for (const {id} of employeeData) {
                try {
                    await ExternalModel.assignEmployeeReseller(resellerDetails.client_organization_id, id);
                } catch (error) {
                }
            }
            if(employee_id.length == 0) employee_id = 0;
            await ExternalModel.removeResellerAssignedEmployeeMultiple(reseller_organization_id, employee_id);

            return res.json({ code: 200, data: null, error: null, message: "Success"});
        } catch (error) {
            return next(error);
        }
    }

    static async getAssignedEmployeeReseller(req, res, next) {
        try {
            let { organization_id, language, user_id } = req.decoded;
            let validate = await ExternalValidation.getAssignedEmployeeResellerValidation().validateAsync(req.query);
            let { reseller_organization_id } = validate;

            const [reseller] = await ExternalModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            let [resellerDetails] = await ExternalModel.getResellerDetails(reseller.reseller_id, reseller_organization_id);
            if (!resellerDetails) return res.json({ code: 400, data: null, message: translate(groupMessages, "5", language), err: null });

            let assignedEmployee = await ExternalModel.getResellerAssignedEmployee(reseller_organization_id);
            if(assignedEmployee.length == 0) return res.json({ code: 400, data: null, error: null, message: "No assigned employee found"});

            return res.json({ code: 200, data: assignedEmployee, error: null, message: "Success"});
        } catch (error) {
            return next(error);
        }
    }

    static async removedAssignedEmployeeReseller(req, res, next) {
        try {
            let { organization_id, language, user_id } = req.decoded;
            let validate = await ExternalValidation.assignEmployeeResellerValidation().validateAsync(req.body);
            let { employee_id, reseller_organization_id } = validate;

            const [reseller] = await ExternalModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            let [resellerDetails] = await ExternalModel.getResellerDetails(reseller.reseller_id, reseller_organization_id);
            if (!resellerDetails) return res.json({ code: 400, data: null, message: translate(groupMessages, "5", language), err: null });

            let assignedEmployee = await ExternalModel.removeResellerAssignedEmployee(reseller_organization_id, employee_id);
            if(!assignedEmployee.affectedRows) return res.json({ code: 400, data: null, error: null, message: "No assigned employee found"});

            return res.json({ code: 200, data: assignedEmployee, error: null, message: "Success"});
        } catch (error) {
            return next(error);
        }
    }

    static async getEmployeeCompany(req, res, next) {
        try {
            let { employee_id, organization_id } = req.decoded;
            let employeeData = await ExternalModel.getEmployeeReseller(employee_id);
            if(employeeData.length === 0) return res.json({ code: 400, data: null, error: null, message: "No organization found" });
            return res.json({ code: 200, data: employeeData, error: null, message: "Success"});
        } catch (error) {
            return next(error);
        }
    }

    static async updateStatusCustom(req, res, next) {
        try {
            let { organization_id } = req.decoded;
            let { is_notification_enable = '0', is_sms_enable = '0', email = '' } = req.body;

            if (!['0', '1'].includes(is_notification_enable) || !['0', '1'].includes(is_sms_enable)) return res.json({ code: 400, message: 'Validation Error', data: null, error: null });

            let invalidEmail = email.split(',').filter(i => !validateEmail(i));
            if (invalidEmail.length != 0) return res.json({ code: 400, message: 'Validation Error', data: null, error: "Email is required" })

            await redisServices.setAsync(`${organization_id}_is_notification_enable`, is_notification_enable);
            await redisServices.setAsync(`${organization_id}_is_sms_enable`, is_sms_enable);
            await redisServices.setAsync(`${organization_id}_emails`, JSON.stringify(email.split(',')));

            return res.json({ code: 200, message: 'Data updated successfully', data: null, error: null });
        } catch (error) {
            next(error)
        }
    }


    static async getStatusCustom(req, res, next) {
        try {
            let { organization_id } = req.decoded;

            let [is_notification_enable, is_sms_enable, emails] = await Promise.all([
                redisServices.getAsync(`${organization_id}_is_notification_enable`),
                redisServices.getAsync(`${organization_id}_is_sms_enable`),
                redisServices.getAsync(`${organization_id}_emails`),
            ])

            return res.json({ code: 200, message: 'Data updated successfully', data: { is_notification_enable, is_sms_enable, emails: emails ? JSON.parse(emails)?.join(',') : '' }, error: null });
        } catch (error) {
            next(error)
        }
    }

    static async addOnPremDomain(req, res, next) {
        try {

            let validate = await ExternalValidation.validateDomain().validateAsync(req.body);
            let { service1, service2, service3, service4, service5, frontend_domain, organization_id, main_domain, admin_email, a_admin_email, crypto_key } = validate;

            let all_services_domain = [service1, service2, service3, service4, service5];
            let working_services_domain = [];
            let unreached_services_domain = [];

            // Checking all Backend Services
            for (const domain_url of all_services_domain) {
                let temp_is_Working = false;
                try {
                    await ExternalModel.isDomainReachable(`${domain_url}/api/custom/on-premise-admin`) // For Admin Services
                    temp_is_Working = true;
                    working_services_domain.push({service_domain: domain_url});
                    continue;
                }catch (e) {}
                try {
                    await ExternalModel.isDomainReachable(`${domain_url}/api/custom/on-premise-desktop`) // For Desktop Services
                    temp_is_Working = true;
                    working_services_domain.push({desktop_domain: domain_url});
                    continue;
                }catch (e) {}
                try {
                    await ExternalModel.isDomainReachable(`${domain_url}/api/custom/on-premise-report`) // For Productivity Report Services
                    temp_is_Working = true;
                    working_services_domain.push({report_domain: domain_url});
                    continue;
                }catch (e) {}
                try {
                    await ExternalModel.isDomainReachable(`${domain_url}/api/custom/on-premise-socket`) // For Web Socket Services
                    temp_is_Working = true;
                    working_services_domain.push({socket_domain: domain_url});
                    continue;
                }catch (e) {}
                try {
                    await ExternalModel.isDomainReachable(`${domain_url}/api`) // For Storelogs Services
                    temp_is_Working = true;
                    working_services_domain.push({storelogs_domain: domain_url});
                    continue;
                }catch (e) {}

                if(!temp_is_Working) unreached_services_domain.push(domain_url);
            }

            if(unreached_services_domain.length) return res.status(400).json({code: 400, message: "Some Service are unreachable right now", data: unreached_services_domain, error: "Some services are unreachable right now" })

            try {
                await ExternalModel.isDomainReachable(`${frontend_domain}/amember/member`);
            }
            catch (e) {
                return res.status(400).json({code: 400, message: "Frontend is unreachable right now", data: [frontend_domain], error: "Frontend is unreachable right now" })
            }

            let services_domain = {};
            
            working_services_domain.forEach(item => {
                const key = Object.keys(item)[0];
                services_domain[key] = item[key];
            });

            let { service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain } = services_domain


            /* Saving data to DB */
            let [isExist] = await ExternalModel.isDomainExist(organization_id, admin_email, a_admin_email);
            if (!isExist) {
                // Insert
                await ExternalModel.insertDomainDetails({ service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain, frontend_domain, organization_id, main_domain, admin_email, a_admin_email });
            }
            else {
                await ExternalModel.updateDomainDetails({ service_domain, desktop_domain, report_domain, storelogs_domain, socket_domain, frontend_domain, organization_id, main_domain, admin_email, a_admin_email })
            }

            // Create a Build code and fetch latest version
            let agentInfo = await ExternalModel.getAgentInfo();
            let winVersion, macVersion, linuxVersion;

            for (let i = 0; i < agentInfo.length; i += 2) {
                if (agentInfo[i].operating_system === 'Windows') {
                    winVersion = agentInfo[i].c_version;
                } else if (agentInfo[i].operating_system === 'Mac') {
                    macVersion = agentInfo[i].c_version;
                } else {
                    linuxVersion = agentInfo[i].c_version;
                }
            }

            /* Call 2 event for Windows Build Personal and Office */
            eventEmitter.emit('create_agent_build_on_prem', { organization_id, type: 'personal', version: winVersion, platform: 'windows', desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key });
            eventEmitter.emit('create_agent_build_on_prem', { organization_id, type: 'office', version: winVersion, platform: 'windows', desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key });

            /* Call 2 event for Mac Build Personal and Office */
            eventEmitter.emit('create_agent_build_on_prem', { organization_id, type: 'personal', version: macVersion, platform: 'mac', desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key });
            eventEmitter.emit('create_agent_build_on_prem', { organization_id, type: 'office', version: macVersion, platform: 'mac', desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key });

            /* Call 2 event for Linux Build Personal and Office */
            eventEmitter.emit('create_agent_build_on_prem', { organization_id, type: 'personal', version: linuxVersion, platform: 'linux', desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key });
            eventEmitter.emit('create_agent_build_on_prem', { organization_id, type: 'office', version: linuxVersion, platform: 'linux', desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key });

            return res.status(200).json({ code: 200, message: 'Domain Saved Successfully' });
        } catch (error) {
            return next(error);
        }
    }

    static async addOnPremEnvs(req, res, next) {
        try {

            let validate = await ExternalValidation.validateEnvs().validateAsync(req.body);
            let { dec_key, dec_iv, dec_OPENSSL_CIPHER_NAME, dec_CIPHER_KEY_LEN, organization_id, admin_email, a_admin_email } = validate;


            let [isExist] = await ExternalModel.isDomainExist(organization_id, admin_email, a_admin_email);

            if (isExist) {
                await ExternalModel.updateEnvDetails({ dec_key, dec_iv, dec_OPENSSL_CIPHER_NAME, dec_CIPHER_KEY_LEN, organization_id, admin_email, a_admin_email });
            }
            else {
                return res.status(400).json({ code: 400, message: 'Domain data doesnot exist!!' });
            }

            return res.status(200).json({ code: 200, message: 'Envs Saved Successfully' });
        } catch (error) {
            return next(error);
        }
    }

    static async fetchEnvs(req, res, next) {
        try {

            let admin_email = req?.query?.admin_email;
            let a_admin_email = req?.query?.a_admin_email;
            if (!admin_email || !a_admin_email) return res.status(400).json({ code: 400, message: 'Email is required' });


            let [isExist] = await ExternalModel.isDomainExist(null, admin_email, a_admin_email);
            let envData;
            if (isExist) {
                envData = await ExternalModel.getEnvDetails(admin_email, a_admin_email);
            }
            else {
                return res.status(400).json({ code: 400, message: 'Env data doesnot exist!!' });
            }

            return res.status(200).json({ code: 200, message: 'Envs Fetched Successfully', env_data: envData });
        } catch (error) {
            return next(error);
        }
    }

    static async getWebUsage(req, res) {
        try {
            const { organization_id: orgId } = req.decoded;
            let validate = await ExternalValidation.webAppValidation().validateAsync(req.query);
            let { employee_id: employeeId, skip, end_date: endDate, start_date: startDate, search, limit } = validate;

            startDate = moment(startDate).format('YYYY-MM-DD');
            endDate = moment(endDate).format('YYYY-MM-DD');

            const data = await ExternalModel.getWebUsage({ employeeId, orgId, startDate, endDate, search, skip, limit });
            if (!data.length) return res.json({ code: 404, message: 'Data not found', data: null, error: 'Data not found' });
            const [{count}] = await ExternalModel.getWebUsageCount({ employeeId, orgId, startDate, endDate, search, });

            res.json({ code: 200, message: 'Data fetched successfully', data: { data, count }, error: null });
        } catch (error) {
            if (error.isJoi) return res.json({ code: 400, error: error.message, data: null, message: "Validation Error" });
            res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    static async addWebUsage(req, res) {
        try {
            const { organization_id } = req.decoded;
            const emails = Object.keys(req.body);
            const empData = await ExternalModel.getUsersOfOrganization(emails, organization_id);
            let { presentEmail, notPresentEmail } = await ExternalValidation.validateWebUsageData({ body: req.body, empData });
            const data = [];
            presentEmail.map(item => {
                item.webData.map(i => {
                    data.push({ organization_id, employee_id: item.employeeId, link: i.link, start_time: i.start_time, end_time: i.end_time, date: moment(i.start_time).format('YYYY-MM-DD') });
                });
            });

            await ExternalModel.addWebUsage({ data });
            res.json({
                code: 200,
                message: 'Data inserted successfully',
                data: {
                    inserted_emails: _.pluck(presentEmail, 'email'),
                    not_inserted_emails: _.pluck(notPresentEmail, 'email')
                },
                error: null
            });
        } catch (error) {
            return res.json({ code: 400, error: error.message, data: null, message: "Server Error" });
        }
    }

    static async getTimesheetData (req, res, next) {
        try {
            let { organization_id, language, employee_id : manager_id } = req.decoded;
            let { start_date, end_date, location_id, department_id, employee_id, search } = req.query;
            if(!start_date || !end_date) return res.json({ code: 404, message: "Validation Failed", error: null, data: null});
            let employeeIds = null;
            let employeeDetails = null;

            if(location_id == 0) location_id = null;
            if(employee_id == 0) employee_id = null;
            if(department_id == 0) department_id = null;

            if(location_id || employee_id || department_id || search || manager_id) {
                employeeDetails = await ExternalModel.getEmployeeIdsByFilter({ location_id, department_id, employee_id, search, organization_id });
                if(employeeDetails?.length == 0) return res.json({ code : 404, message: "No data found", error: null, data: null });
                employeeIds = _.pluck(employeeDetails, 'id');
            }

            let [timesheetData, attendanceData] = await Promise.all([
                ExternalModel.getTimesheetData({ employeeIds, organization_id, start_date, end_date }),
                ExternalModel.getAttendanceData({ employeeIds, organization_id, start_date, end_date })
            ]);

            // Extract employeeIds from timesheetData if not already available, for fetching mobile task data
            let employeeIdsForTasks = employeeIds;
            if (!employeeIdsForTasks || employeeIdsForTasks.length === 0) {
                if (timesheetData && timesheetData.length > 0) {
                    employeeIdsForTasks = _.unique(_.pluck(timesheetData, 'employee_id'));
                }
            }

            // Fetch mobile task data for employees who have office_duration = 0
            let taskDetails = [];
            if (employeeIdsForTasks && employeeIdsForTasks.length > 0) {
                taskDetails = await ActivityRequestModel.getMobileTask(
                    moment(start_date).add(-2, 'days').toISOString(), 
                    moment(end_date).add(2, 'days').toISOString(), 
                    employeeIdsForTasks, 
                    organization_id
                );
            }

            // Build map for fast lookup of tasks by employee
            const tasksByEmp = new Map();
            for (const t of taskDetails) {
                const arr = tasksByEmp.get(t.assigned_user) || [];
                arr.push(t);
                tasksByEmp.set(t.assigned_user, arr);
            }

            // Function to calculate mobile usage for an employee and attendance
            const calcMobileUsage = (empId, attendance) => {
                const empTasks = tasksByEmp.get(empId) || [];
                if (!attendance) return 0;
                const attStart = moment(attendance.start_time);
                // Handle active attendance: if start_time equals end_time, use current time
                const isActiveAttendance = moment(attendance.start_time).isSame(moment(attendance.end_time));
                const attEnd = isActiveAttendance ? moment() : moment(attendance.end_time);
                let total = 0;
                for (const task of empTasks) {
                    for (const st of task.task_working_status) {
                        if (!st?.start_time || st.is_desktop_task) continue;
                        const startMoment = moment(st.start_time);
                        if (!startMoment.isValid()) continue;
                        let endMoment = st?.end_time ? moment(st.end_time) : moment().utc();
                        if (!endMoment.isValid()) endMoment = moment().utc();
                        if (!endMoment.isAfter(startMoment)) continue;
                        // overlap seconds between [startMoment,endMoment] and [attStart, attEnd]
                        const start = moment.max(attStart, startMoment);
                        const end = moment.min(attEnd, endMoment);
                        if (end.isAfter(start)) total += end.diff(start, 'seconds');
                    }
                }
                return total;
            };

            let result = [];
            for (const td of timesheetData) {
                let attendance = attendanceData.find(i => moment(i.date).format('YYYY-MM-DD') == td.date && td.employee_id == i.employee_id);
                if(!attendance) continue;
                
                let resultItem = {
                    ...attendance,
                    ...td
                };

                // Add mobile hours if office_duration is 0 or null/undefined
                if (!td.office_duration || td.office_duration === 0) {
                    const mobileUsageDuration = calcMobileUsage(td.employee_id, attendance);
                    resultItem.mobile_hours = mobileUsageDuration;
                    resultItem.mobile_hours_formatted = moment.utc(moment.duration(mobileUsageDuration, 'seconds').asMilliseconds()).format('HH:mm:ss');
                }

                result.push(resultItem);
            }

            return res.json({ code: 200, message: 'Success', data: result, error: null });
        } catch (error) {
            return next(error);
        }
    }

    static async getAllEmployee (req, res, next) {
        try {
            let { organization_id } = req.decoded;
            let { skip = 0, limit = 10, search = ""} = req.query;
            let getOrgUnderReseller = await ExternalModel.getOrganizationUnderReseller(organization_id);
            if (getOrgUnderReseller.length === 0) return res.json({ code: 400, error: null, data: null, message: "No data for this org" });
            getOrgUnderReseller = _.pluck(getOrgUnderReseller, "organization_id"); 
            getOrgUnderReseller.push(organization_id);
            let [data, dataCount] = await Promise.all([
                ExternalModel.getAllEmployee(getOrgUnderReseller, skip, limit, search),
                ExternalModel.getAllEmployeeCount(getOrgUnderReseller, search)
            ]);
            return res.json({ code: 200, data: { employeeDetails: data, employeeCount: dataCount[0].total_count}, error: null, message: "Success"});
        } catch (error) {
            return next(error);
        }
    }

     static async getEmployeeStatistics(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            
            let resellersOrganizationIds = [..._.pluck(await ExternalModel.getOrganizationUnderReseller(organization_id), 'organization_id'), organization_id];
            if (resellersOrganizationIds.length === 0) return res.json({ code: 400, error: null, data: null, message: "No data for this org" });

            let [employeeDetails, employeeDetailsCount] = await Promise.all([
                ExternalModel.getEmployeeStatistics(resellersOrganizationIds),
                ExternalModel.getEmployeeStatisticsCount(resellersOrganizationIds)
            ]);


            for (const emp of employeeDetails) {
                const { decoded } = await passwordService.decrypt(emp.password, process.env.CRYPTO_PASSWORD);
                emp.password = decoded;
            }
            return res.json({ code: 200, data: { data: employeeDetails, count: employeeDetailsCount[0]?.total ?? 0 }, error: null, message: "Success"});
        }
        catch (error) {
            return next(error);
        }
    }

     static async getManagerStatistics(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let resellersOrganizationIds = [..._.pluck(await ExternalModel.getOrganizationUnderReseller(organization_id), 'organization_id'), organization_id];
            if (resellersOrganizationIds.length === 0) return res.json({ code: 400, error: null, data: null, message: "No data for this org" });

            let [managerDetails, managerDetailsCount] = await Promise.all([
                ExternalModel.getManagerStatistics(resellersOrganizationIds),
                ExternalModel.getManagerStatisticsCount(resellersOrganizationIds)
            ]);

            let employeeIds = _.pluck(managerDetails, 'id');
            let assignedEmployeeCount = employeeIds.length ? await ExternalModel.getAssignedEmployeeCount(employeeIds) : [];
            for (const man of managerDetails) {
                let stats = assignedEmployeeCount.find(i => i.to_assigned_id == man.id);
                if(stats && stats.count) man.assigned_count = stats.count;
                else man.assigned_count = 0;
                let { decoded: decoded1 } = await passwordService.decrypt(man.employee_password, process.env.CRYPTO_PASSWORD);
                man.employee_password = decoded1;
                let { decoded: decoded2 } = await passwordService.decrypt(man.organization_password, process.env.CRYPTO_PASSWORD);
                man.organization_password = decoded2;
            }

            return res.json({ code: 200, data: { data: managerDetails, count: managerDetailsCount[0]?.total ?? 0 }, error: null, message: "Success"});
        }
        catch (error) {
            return next(error);
        }
    }
}

module.exports = ExternalController;


const validateEmail = (email) => {
    console.log(email);
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};


eventEmitter.on('create_agent_build_on_prem', async ({ organization_id, type, version, platform, desktop_domain, storelogs_domain, admin_email, a_admin_email, crypto_key }) => {
    const axios = require('axios');
    const encryptedOrgId = shortnerService.shorten(+process.env.SHORTNER_DEFAULT_ADDED_VALUE + organization_id);
    
    let buildUrl = `${process.env.BUILD_API_URL}${encryptedOrgId}`;
    buildUrl = buildUrl.replace('<<mode>>', type).replace('<<version>>', version);
    if (admin_email !== process.env.ON_PREMISE_PORTAL_EMAIL) {
        if (platform === 'mac') {
            // replace default windows live pipeline name with mac on prem general pipeline name 
            buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Mac-Auto-Live-On-Premises-General');
            buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
        }
        else if (platform === 'linux') {
            // replace default windows pipeline name with linux on prem general pipeline name
            buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Linux-Auto-Live-On-Premises-General');
            buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
        }
        else if (platform === 'windows') {
            // replace default windows pipeline name with windows on prem general pipeline name
            buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt_Windows-Live-On-Premises-General');
        }
    }
    else {
        if (platform === 'mac') {
            // replace default windows live pipeline name with mac on prem auto1 pipeline name
            buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Mac-Auto-Live-On-Premises');
            buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
        }
        else if (platform === 'linux') {
            // replace default windows pipeline name with linux on prem auto1 pipeline name
            buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Linux-Auto-Live-On-Premises');
            buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
        }
        else if (platform === 'windows') {
            // replace default windows pipeline name with windows on prem auto1 pipeline name
            buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt_Windows-Live-On-Premises');
        }
    }
    // Replace track domain multiple time as replaceAll not support in node -v 14 & regex not working due to domain format
    buildUrl = buildUrl.replace('https://track.empmonitor.com', desktop_domain)
    buildUrl = buildUrl.replace('https://track.empmonitor.com', desktop_domain)
    buildUrl = buildUrl.replace('https://track.empmonitor.com', desktop_domain)
    buildUrl = buildUrl.replace('https://storelogs.dev.empmonitor.com', storelogs_domain)

    // Adding email to jenkins parameter for admin email & crypto key
    buildUrl = buildUrl + `&email=${admin_email}` + `&crypto_key=${crypto_key}`;


    // Make api call
    const jenkinsAxios = axios.create({
        baseURL: process.env.JENKINS_URL,
        auth: {
            username: process.env.JENKINS_AUTH_USERNAME,
            password: process.env.JENKINS_AUTH_PASSWORD
        }
    });

    const crumbIssuer = await jenkinsAxios.get('/crumbIssuer/api/json');
    await jenkinsAxios.post(`${buildUrl.split(`${process.env.JENKINS_URL}`)[1]}`, {}, {
        headers: {
            'Content-Type': 'application/xml',
            [crumbIssuer.data.crumbRequestField]: crumbIssuer.data.crumb,
            Cookie: crumbIssuer.headers['set-cookie'][0]
        }
    }
    )
        .then(data => {
            if (data && data.status === 201) {
                console.log(`--success-in build--organization_id = "${organization_id}" and encrypted_key = "${encryptedOrgId}" and OS = "${platform}"`);
                console.log(data.status, '-', data.config.url);
            } else {
                console.log(`--error-(then)-in build--organization_id = "${organization_id}" and encrypted_key = "${encryptedOrgId}" and OS = "${platform}"`);
                console.log(data.status, '-', data.config.url);
            }
        })
        .catch(error => {
            console.log(`--error-(catch)-in build--organization_id = "${organization_id}" and encrypted_key = "${encryptedOrgId}" and OS = "${platform}"`);
            console.log(error.response.status, '-', error.response.config.url, '-', error.response.data);
        });
});