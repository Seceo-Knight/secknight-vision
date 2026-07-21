const InformationModel = require('./basicInfo.model'),
    InformationValidation = require('./basicInfo.validation'),
    sendResponse = require('../../../../utils/myService').sendResponse,
    { translate } = require(`${utilsFolder}/messageTranslation`),
    { basicInfoMessages, userMessages } = require("../../../../utils/helpers/LanguageTranslate");
const defaultBasicDetailsObj = {
    marital_status: null, type: null, ctc: null, pt_location: null,
    pt_location_name: null, pan_number: null, pf_number: null, esi_number: null,
    uan_number: null, c_address: null, p_address: null, personal_email: null,
    pf_scheme: null, pf_joining: null, excess_pf: null,
    excess_eps: null, exist_pf: null, eligible_pt: null,
}
let { settings } = require('../bankdetail/default.payrollsettings');
const _ = require('underscore');
const moment = require('moment');
const Moment = require('moment-timezone');

const redisServices = require('../../auth/services/redis.service');

class InformationController {

    /**
    * Get Employee Basic Information
    *
    * @function getEmployeeBasicInfo
    * @memberof  InformationController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */

    async getEmployeeBasicInfo(req, res) {
        const { employee_id: manager_id, organization_id, language, role_id } = req.decoded;
        try {
            const { location_id, department_id, role_id: roleIdQuery, name, sortOrder, sortColumn, skip, limit, status, employee_type } = req.query,
                to_assigned_id = null;
            let { value, error } = InformationValidation.getEmployeeBasicInfo({ location_id, department_id, role_id: roleIdQuery, name, status, employee_type });
            if (error) return sendResponse(res, 404, null, translate(basicInfoMessages, "2", language), error.details[0].message);
            let employee_ids = [];
            if (manager_id && manager_id != value.employee_id) {
                employee_ids = _.pluck(await InformationModel.getEmployeeAssignedToManager(manager_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, error: null, data: null, message: 'No Employee Assigned to this account.' });
                if (value.employee_id && !employee_ids.includes(value.employee_id)) return res.json({ code: 400, error: null, data: null, message: 'Employee not assigned to this account.' });
            }
            let basicInfo = await InformationModel.employeeBasicInfo(organization_id, location_id, department_id, roleIdQuery, name, skip, limit, to_assigned_id, sortColumn, sortOrder, status, value.employee_type, employee_ids);
            if (basicInfo.length == 0) return sendResponse(res, 400, null, translate(basicInfoMessages, "6", language), null);

            basicInfo = basicInfo.map(x => {
                if (x.details) Object.assign(x, JSON.parse(x.details));
                delete x.details;
                return x;
            });
            return sendResponse(res, 200, basicInfo, translate(basicInfoMessages, "1", language), null);
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, translate(basicInfoMessages, "7", language), err);
        }
    }
    /**
    * Update Employee Basic Information
    * Employee Type - 1-> Contract, 2-> Permanent, 3-> Intern, 4-> Sister Concern, 5-> Others
    * @function updateEmployeeBasicInfo
    * @memberof  InformationController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async updateEmployeeBasicInfo(req, res) {
        const { employee_id: employeeId, organization_id, language } = req.decoded;
        try {
            let { value, error } = InformationValidation.updateEmployeeBasicInfo(req.body);
            if (error) return sendResponse(res, 404, null, translate(basicInfoMessages, "2", language), error.details[0].message);

            const {
                id: employee_id, u_id, location_id, department_id, type,
                phone, email, personal_email, address, marital_status, pt_location,
                pt_location_name, pan_number, pf_number, esi_number, uan_number, ctc, c_address, p_address,
                pf_scheme, excess_pf, excess_eps, exist_pf, eligible_pt, date_of_birth } = value;

            let promiseArray = [], details;
            if (location_id && department_id) promiseArray.push(await InformationModel.updateLocationDepartment(employee_id, location_id, department_id));
            if (phone || email || address) promiseArray.push(await InformationModel.updateUserInfo(u_id, phone, email, address));

            const employeeBasicInfo = await InformationModel.getBasicInfo(organization_id, employee_id);
            let employee_type = null;
            if (employeeBasicInfo.length !== 0) {
                details = employeeBasicInfo[0]['details'] ? JSON.parse(employeeBasicInfo[0]['details']) : defaultBasicDetailsObj;
                settings = employeeBasicInfo[0]['settings'] ? JSON.parse(employeeBasicInfo[0]['settings']) : settings;
                employee_type = details.type;
                details = {
                    ...details,
                    marital_status: marital_status || details.marital_status,
                    type: type || details.type,
                    ctc: ctc || details.ctc,
                    pt_location: pt_location || details.pt_location,
                    pt_location_name: pt_location_name || details.pt_location_name,
                    pan_number: pan_number || details.pan_number,
                    pf_number: pf_number || details.pf_number,
                    esi_number: esi_number || details.esi_number,
                    uan_number: uan_number || details.uan_number,
                    c_address: c_address || details.c_address,
                    p_address: p_address || details.p_address,
                    personal_email: personal_email || details.personal_email,
                    date_of_birth: date_of_birth ? moment(date_of_birth).format("YYYY-MM-DD") : details?.date_of_birth,
                    pf_scheme: pf_scheme || details.pf_scheme,
                    excess_pf: excess_pf || details.excess_pf,
                    excess_eps: excess_eps || details.excess_eps,
                    exist_pf: exist_pf || details.exist_pf,
                    eligible_pt: eligible_pt || details.eligible_pt,
                }
                promiseArray.push(InformationModel.updateBasicInfo(organization_id, employee_id, JSON.stringify(details), JSON.stringify(settings), employeeBasicInfo[0].pf_applicable, employeeBasicInfo[0].esi_applicable));
            } else {
                details = {
                    marital_status, type, ctc, pt_location, pt_location_name,
                    pan_number, pf_number, esi_number, uan_number, c_address, p_address, personal_email,
                    pf_scheme, excess_pf, excess_eps, exist_pf, eligible_pt, date_of_birth
                }
                promiseArray.push(InformationModel.addBasicInfo(organization_id, employee_id, JSON.stringify(details), JSON.stringify(settings), 0, 0));
            }
            await Promise.all(promiseArray);

            /** Employee Type - 1-> Contract, 2-> Permanent, 3-> Intern, 4-> Sister Concern, 5-> Others */
            if (type) {
                if (employee_type) await InformationModel.deleteEmpTaxScheme({ organization_id, employee_id });

                if (type == 1) {
                    const [contractScheme] = await InformationModel.orgDetails({ organization_id });
                    if (contractScheme)
                        await InformationModel.updateEmpTaxScheme({ organizationId: organization_id, adminApprovedSchemeId: contractScheme.contract_scheme_id, employeeId: employee_id });
                }
            }

            return sendResponse(res, 200, value, translate(basicInfoMessages, "5", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(basicInfoMessages, "4", language), err);
        }
    }

    async getEmployeeDetails(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = InformationValidation.getEmployeeDetails(req.query);
            if (error) return sendResponse(res, 404, null, translate(basicInfoMessages, "2", language), error.details[0].message);

            const { employee_id } = value;
            let employeeInfo = await InformationModel.employeeDetails(employee_id, organization_id);
            if (employeeInfo.length == 0) return sendResponse(res, 400, null, translate(userMessages, "10", language), null);

            employeeInfo = employeeInfo.map(x => {
                if (x.details != null && x.details != '[]') Object.assign(x, JSON.parse(x.details));
                if (x.family != null && x.family != '[]') x.family = JSON.parse(x.family);
                if (x.qualification != null && x.qualification != '[]') x.qualification = JSON.parse(x.qualification);
                if (x.experience != null && x.experience != '[]') x.experience = JSON.parse(x.experience);
                if (x.salary_components != null && x.salary_components != '[]') x.salary_components = JSON.parse(x.salary_components);
                delete x.details;
                return x;
            });

            return sendResponse(res, 200, employeeInfo, translate(basicInfoMessages, "1", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(basicInfoMessages, "7", language), err);
        }
    }

    async updateBirthdayMailDetail (req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let { value, error } = InformationValidation.updateBirthdayMailDetailValidate(req.body);
            if (error) return sendResponse(res, 404, null, translate(basicInfoMessages, "2", language), error.details[0].message);

            let { to_email, cc_email, bcc_email } = value;
            await redisServices.setAsync(`${organization_id}_birthday_to`, to_email.join(','));
            await redisServices.setAsync(`${organization_id}_birthday_cc`, cc_email.join(','));
            await redisServices.setAsync(`${organization_id}_birthday_bcc`, bcc_email.join(','));

            return sendResponse(res, 200, [], translate(basicInfoMessages, "1", language), null);
        }
        catch (err) {
            return next(err);
        }
    }

    async getBirthdayMailDetail (req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
                let [to, cc, bcc] = await Promise.all([
                    redisServices.getAsync(`${organization_id}_birthday_to`),
                    redisServices.getAsync(`${organization_id}_birthday_cc`),
                    redisServices.getAsync(`${organization_id}_birthday_bcc`)
                ])
            return sendResponse(res, 200, {to, cc, bcc}, translate(basicInfoMessages, "1", language), null);
        }
        catch (err) {
            return next(err);
        }
    }
    
    async getEmployeeBioMetricsStatus(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let { value, error } = InformationValidation.getEmployeeBioMetricsStatus(req.query);
            if (error) return sendResponse(res, 404, null, translate(basicInfoMessages, "2", language), error?.details[0]?.message);
            let { employee_id } = value;

            let [employeeData] = await InformationModel.getEmployeeData(employee_id, organization_id);
            if (!employeeData) return res.status(400).json({ code: 400, error: null, data: null, message: 'No Employee Found.' });

            if (!employeeData.permission_id) return res.status(200).json({ code: 200, error: null, data: null, message: 'Biometrics not enable. Please enable from roles & permissions' });

            if (employeeData.manual_status && employeeData.bio_user_id) {
                employeeData.manual_status = JSON.parse(employeeData?.manual_status);
                if (employeeData.manual_status.start_date && employeeData.manual_status.end_date) {
                    let employeeTime = Moment().tz(employeeData.timezone).format('YYYY-MM-DD');
                    let startTime = moment(employeeData.manual_status.start_date).utc().format('YYYY-MM-DD');
                    let endTime = moment(employeeData.manual_status.end_date).utc().add(24, 'hours').format('YYYY-MM-DD');
                    if (employeeData.manual_status.start_date == employeeData.manual_status.end_date && employeeTime == startTime) return res.status(200).json({ code: 200, error: null, data: employeeData, message: `Manual overwrite from ${moment(employeeData.manual_status.start_date).format('YYYY-MM-DD')} to ${moment(employeeData.manual_status.end_date).format('YYYY-MM-DD')}.` });
                    else {
                        let currentTime = moment(employeeTime);
                        startTime = moment(startTime);
                        endTime = moment(endTime);
                        if(currentTime.isBefore(endTime)) return res.status(200).json({ code: 200, error: null, data: employeeData, message: `Manual overwrite from ${moment(employeeData.manual_status.start_date).format('YYYY-MM-DD')} to ${moment(employeeData.manual_status.end_date).format('YYYY-MM-DD')}.` });
                        else {
                            await InformationModel.updateBioMetricsData(employeeData.user_id, organization_id, { custom: "disable" });
                            employeeData.manual_status = { custom: "disable" };
                            return res.status(200).json({ code: 200, error: null, data: employeeData, message: 'Biometrics enable.' });
                        }
                    }
                }
                else if (employeeData.manual_status.custom == "enable") return res.status(200).json({ code: 200, error: null, data: employeeData, message: 'Biometrics is disable.' });
            }

            return res.status(200).json({ code: 200, error: null, data: employeeData, message: 'Biometrics enable.' });
        } catch (error) {
            return next(error);
        }
    }

    async updateEmployeeBioMetricsStatus(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let { value, error } = InformationValidation.updateEmployeeBioMetricsStatus(req.body);
            if (error) return sendResponse(res, 404, null, translate(basicInfoMessages, "2", language), error?.details[0]?.message);
            let { employee_id, start_date, end_date, custom } = value;

            let [employeeData] = await InformationModel.getEmployeeData(employee_id, organization_id);
            if (!employeeData) return res.status(400).json({ code: 400, error: null, data: null, message: 'No Employee Found.' });

            if (!employeeData.permission_id) return res.status(200).json({ code: 200, error: null, data: null, message: 'Biometrics not enable. Please enable from roles & permissions' });
            let manualData = {};

            if (start_date && end_date) manualData = { start_date, end_date };
            else if (custom) manualData = { custom };

            if (employeeData.bio_user_id) {
                await InformationModel.updateBioMetricsData(employeeData.user_id, organization_id, manualData);
            }
            else {
                await InformationModel.insertBioMetricsData(employeeData.user_id, organization_id, manualData);
            }
            employeeData.manual_status = manualData;
            return res.status(200).json({ code: 200, error: null, data: employeeData, message: 'Data updated successfully.' });
        } catch (error) {
            return next(error);
        }
    }

    async fetchEmployeePasswordStatusEnable (req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let [isEnable] = await InformationModel.getEmployeePasswordStatus(organization_id);
            if(!isEnable) return sendResponse(res, 400, null, 'Organization not found', null);
            return sendResponse(res, 200, { status : isEnable?.is_biometrics_employee || 0 }, 'Success', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'Something went wrong', error);
        }
    }

    async updateEmployeePasswordStatus (req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let { status } = req.body;
            if(![0,1,'0','1'].includes(status)) return sendResponse(res, 400, null, 'Status must be 0 or 1', null);
            let isEnable = await InformationModel.updateEmployeePasswordStatus(organization_id, status);
            return sendResponse(res, 200, isEnable, 'Success', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'Something went wrong', error);
        }
    }

    async fetchOrganizationBioMetricsConfirmationStatus (req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let [isEnable] = await InformationModel.fetchOrganizationBioMetricsConfirmationStatus(organization_id);
            if(!isEnable) return sendResponse(res, 400, null, 'Organization not found', null);
            return sendResponse(res, 200, { status : isEnable?.biometrics_confirmation_status || 0 }, 'Success', null);
        }
        catch (error) {
            return sendResponse(res, 400, null, 'Something went wrong', error);
        }
    }

    async updateOrganizationBioMetricsConfirmationStatus (req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let { status } = req.body;
            if(![0,1,'0','1'].includes(status)) return sendResponse(res, 400, null, 'Status must be 0 or 1', null);
            let isEnable = await InformationModel.updateOrganizationBioMetricsConfirmationStatus(organization_id, status);
            return sendResponse(res, 200, isEnable, 'Success', null);
        }
        catch (error) {
            return sendResponse(res, 400, null, 'Something went wrong', error);
        }
    }

    
    async fetchOrganizationCameraOverLayStatus (req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let [isEnable] = await InformationModel.fetchOrganizationCameraOverLayStatus(organization_id);
            if(!isEnable) return sendResponse(res, 400, null, 'Organization not found', null);
            return sendResponse(res, 200, { status : isEnable?.camera_overlay_status || 0 }, 'Success', null);
        }
        catch (error) {
            return sendResponse(res, 400, null, 'Something went wrong', error);
        }
    }
    async updateOrganizationCameraOverLayStatus (req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let { status } = req.body;
            if(![0,1,'0','1'].includes(status)) return sendResponse(res, 400, null, 'Status must be 0 or 1', null);
            let isEnable = await InformationModel.updateOrganizationCameraOverLayStatus(organization_id, status);
            return sendResponse(res, 200, isEnable, 'Success', null);
        }
        catch (error) {
            return sendResponse(res, 400, null, 'Something went wrong', error);
        }
    }

    async addBiometricsDepartment(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let { name, is_main = 0 } = req.body;
            if(!name) return sendResponse(res, 400, null, 'Name is required', null);
            let [isSameNameDept] = await InformationModel.checkSameNameDepartment(organization_id, name);
            if(isSameNameDept) return sendResponse(res, 400, null, 'Department with same name already exist', null);
            let addNewDept = await InformationModel.addBiometricsDepartment(organization_id, name, is_main);
            return sendResponse(res, 200, addNewDept, 'Success', null);
        }
        catch (e) {
            return sendResponse(res, 400, null, 'Something went wrong', e);
        }
    }

    async getBiometricsDepartment(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let department_id = req.query.department_id || 0;
            if(department_id) {
                let getDept = await InformationModel.getBiometricsDepartment(organization_id, department_id);
                return sendResponse(res, 200, getDept, 'Success', null);
            }
            else {
                let getDept = await InformationModel.getBiometricsDepartment(organization_id, null);
                return sendResponse(res, 200, getDept, 'Success', null);
            }
        }
        catch (e) {
            return sendResponse(res, 400, null, 'Something went wrong', e);
        }
    }

    async editDepartmentBioMetrics(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            let { department_id, name, is_main = 0 } = req.body
            if(!department_id || !name) return sendResponse(res, 400, null, 'Department Id or name is required');
            let [is_exist] = await InformationModel.getBiometricsDepartment(organization_id, department_id);
            if(!is_exist) return sendResponse(res, 400, null, 'Invalid department id', null);

            let [isSameNameDept] = await InformationModel.checkSameNameDepartment(organization_id, name);
            if(isSameNameDept) {
                if(isSameNameDept.id != is_exist.id) return sendResponse(res, 400, null, 'Department with same name already exist', null);
            }
            let update = await InformationModel.updateBiometricsDepartment(department_id, name, is_main);
            return sendResponse(res, 200, update, 'Success', null);
        }
        catch (e) {
            return sendResponse(res, 400, null, 'Something went wrong', e);
        }
    }

    async getAccessLogs(req, res) {
        try {
            const { organization_id } = req.decoded;
            let { date, employee_id } = req.query;
            if(!date) return sendResponse(res, 400, null, 'Date is required', null);
            let employeeAccessLogs = await InformationModel.getBiometricsAccessLogSchema(employee_id, date, organization_id);

            if(employeeAccessLogs.length === 0) return sendResponse(res, 404, null, 'No data found', null);
            let [checkInOutRecords] = await InformationModel.getCheckInOutRecords(date, employee_id);

            let department_id = Array.from(new Set(_.pluck(employeeAccessLogs, "department_id")))
            let department_data = await InformationModel.getBiometricsDepartmentData(department_id, organization_id);
            let [employeeTimezone] = await InformationModel.getEmployeeTimezone([employee_id], organization_id);
            let finaldata = [];
            for (let employeeAccessLog of employeeAccessLogs) {
                finaldata.push({
                    ...employeeAccessLog, 
                    department_data: department_data.find(d => d.id === employeeAccessLog.department_id),
                });
            }
            return sendResponse(res, 200, {data: finaldata, timezone: employeeTimezone.timezone, checkInOutRecords}, 'Success', null);
        }
        catch (e) {
            return sendResponse(res, 400, null, 'Something went wrong', e);
        }
    }

    async getTotalAccessLogsCount(req, res) {
        try {
            let { organization_id } = req.decoded;
            let { date, department_id } = req.query;
            if(!department_id || !date) return sendResponse(res, 404, null, 'Date or Department Id is required');
            let [totalAccessLogs] = await InformationModel.getTotalAccessLogsCount(date, date, organization_id, department_id);
            return sendResponse(res, 200, totalAccessLogs?.totalDocuments || 0, 'Success', null);
        }
        catch (e) {
            return sendResponse(res, 400, null, e);
        }
    }

    async getDepartmentAccess (req, res) {
        try {
            let { organization_id } = req.decoded;
            let { date, department_id, skip = 0, limit = 10 } = req.query;
            if(skip || skip == 0) skip = +skip;
            if(limit) limit = +limit;

            if(!department_id || !date) return sendResponse(res, 404, null, 'Date or Department Id is required');

            let [data, [dataCount]] =  await Promise.all([
                await InformationModel.getTotalDepartmentAccess(date, date, organization_id, department_id, skip, limit),
                await InformationModel.getTotalDepartmentAccessCount(date, date, organization_id, department_id)
            ])
            if(data.length === 0) return sendResponse(res, 404, null, 'No data found', null);
            let employeeData = await InformationModel.getEmployeeDetails(Array.from(new Set(_.pluck(data, '_id'))), organization_id);
            let temp = [];
            for (let item of data) {
                item = { ...item, ...employeeData.find(e => e.employee_id === item._id)}
                temp.push(item);
            }
            return sendResponse(res, 200, { data: temp, count: dataCount?.totalDocuments ?? 0 }, 'Success', null);
        } catch (e) {
            console.log(e);
            return sendResponse(res, 400, null, e);
        }
    }

    async importEMPDepartment(req, res) {
        try {
            let { organization_id } = req.decoded;
            let organizationDepartment = await InformationModel.getOrganizationDepartment(organization_id);
            for (const orgDept of organizationDepartment) {
                let [isSameNameDept] = await InformationModel.checkSameNameDepartment(organization_id, orgDept.name);
                if(isSameNameDept) continue;
                let addNewDept = await InformationModel.addBiometricsDepartment(organization_id, orgDept.name, 0);
            }
            return sendResponse(res, 200, organization_id, 'Success', null);
        }
        catch (err) {
            return sendResponse(res, 400, null, err);
        }
    }
}

module.exports = new InformationController;