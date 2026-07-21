const {
    arrayColumn, findUniqueAndDuplicates,
    DEFAULT_SETTINGS_OBJ, DEFAULT_BASIC_DETAILS_OBJ
} = require('./commonBulk.helper');
const commonBulkModel = require('./commonBulk.model');
const _ = require('underscore');
const moment = require('moment');

class CommonBulkService {

    /**
     * bulkUpload - function to bulk upload
     * 
     * @param {*} uploadData 
     * @param {*} organization_id 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async bulkUpload(uploadData, organization_id) {
        try {
            const { basicDetails, bankDetails, complianceDetails, customSalary } = uploadData;
            await this.bulkUploadBasicDetails(basicDetails, organization_id);
            await this.bulkUploadBankDetails(bankDetails, organization_id);
            await this.bulkUploadComplianceDetails(complianceDetails, organization_id);
            await this.bulkUploadCustomSalary(customSalary, organization_id);
            return true;
        } catch (err) {
            throw err;
        }
    }

    async bulkUploadBasicDetails(basicData, organization_id) {
        try {
            const { unique: employee_unique_ids } = await findUniqueAndDuplicates(basicData, "employee_unique_id");
            let employeeData = await commonBulkModel.getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids })

            let employeeIds = _.pluck(employeeData, "employeeId");
            const employeeInfo = await commonBulkModel.getBasicDetailsByEmpIds({ ids: employeeIds, organization_id });

            basicData = basicData.map(i => {
                let userInfo = employeeInfo.find(itr => itr.employee_unique_id == i.employee_unique_id)
                if (userInfo) {
                    i = { ...i, id: userInfo.id }
                }
                return i;
            })
            await this.ProcessBulkBasicDetails({ organization_id, basicDetails: basicData, employeeInfo });
        } catch (err) {
            throw err;
        }
    }

    async bulkUploadBankDetails(bankData, organization_id) {
        try {
            const { unique: employee_unique_ids } = await findUniqueAndDuplicates(bankData, "employee_unique_id");
            let employeeData = await commonBulkModel.getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids })
            const employeeInfo = await commonBulkModel.getBankDetailsByEmpUniqueIds({ employee_unique_ids, organization_id });

            const invalidIds = employee_unique_ids.filter(x => _.pluck(employeeData, "employee_unique_id").indexOf(x) === -1);
            if (invalidIds.length !== 0) return sendResponse(res, 400, { invalidIds }, "Invalid Employee Unique Ids", null);

            bankData = bankData.map(i => {
                let userInfo = employeeData.find(itr => itr.employee_unique_id == i.employee_unique_id);
                if (userInfo) {
                    i = { ...i, id: userInfo.employeeId }
                }
                return i;
            })
            await this.ProcessBulkBankDetails({ organization_id, bankDetails: bankData, employeeInfo });
            return true;
        } catch (err) {
            throw err;
        }
    }

    async bulkUploadComplianceDetails(complianceData, organization_id) {
        try {
            //Finding duplicate id in sheet,it will throw error if it has duplicate ids
            const { unique: employee_unique_ids } = await findUniqueAndDuplicates(complianceData, "employee_unique_id");
            let employeeData = await commonBulkModel.getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids })

            // let ids = _.pluck(employeeData, "employeeId");
            const employeeInfo = await commonBulkModel.getBasicInfoByEmpCode({ organization_id, emp_mails: employee_unique_ids });

            for (let entity of complianceData) {

                const { id: empCode, employee_unique_id } = entity;
                const { employeeId } = employeeData.find(i => i.employee_unique_id == employee_unique_id);
                const userData = employeeInfo.find(i => entity.employee_unique_id == i.employee_unique_id);
                let details;
                if (userData) {
                    const detailsData = userData.details ? JSON.parse(userData.details) : DEFAULT_BASIC_DETAILS_OBJ;
                    let settingsData = userData.settings ? JSON.parse(userData.settings) : DEFAULT_SETTINGS_OBJ;
                    const oldCtc = detailsData.ctc || 0;

                    let eligible_pf = entity.eligible_pf || detailsData.eligible_pf || 0;
                    let eligible_esi = entity.eligible_esi || detailsData.eligible_esi || 0;

                    details = {
                        ...detailsData,
                        uan_number: entity.uan_number || detailsData.uan_number || null,
                        pf_number: entity.pf_number || detailsData.pf_number || null,
                        pf_scheme: entity.pf_scheme || detailsData.pf_scheme || null,
                        // pf_joining: entity.pf_joining || detailsData.pf_joining || null,
                        excess_pf: entity.excess_pf || entity.excess_pf == 0 ? entity.excess_pf : (detailsData.excess_pf || 0),
                        excess_eps: entity.excess_eps || entity.excess_eps == 0 ? entity.excess_eps : (detailsData.excess_eps || 0),
                        exist_pf: entity.exist_pf || entity.exist_pf == 0 ? entity.exist_pf : (detailsData.exist_pf || 0),
                        esi_number: entity.esi_number || detailsData.esi_number || null,
                        eligible_pt: entity.eligible_pt || entity.eligible_pt == 0 ? entity.eligible_pt : (detailsData.eligible_pt || 0),
                        pan_number: entity.pan_number || detailsData.pan_number || null,
                        ctc: entity.ctc || detailsData.ctc || 0,
                        gross: entity.gross || detailsData.gross || 0,
                        personal_email: entity.personal_email || detailsData.personal_email || null,
                        marital_status: entity.marital_status || entity.marital_status == 0 ? entity.marital_status : (detailsData.marital_status || null),
                        c_address: entity.c_address || detailsData.c_address || null,
                        p_address: entity.p_address || detailsData.p_address || null,
                    }

                    settingsData.pf_date_joined = entity.pf_joining || detailsData.pf_joining || null;
                    // add salary revision for the employee/user
                    if (entity.ctc && +entity.ctc != +oldCtc) {
                        details.salaryRevision = {
                            oldCtc,
                            effectiveDate: entity.effective_date ? moment(entity.effective_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
                            comment: null
                        };
                    }
                    await commonBulkModel.updateBasicInfo(organization_id, employeeId, JSON.stringify(details), JSON.stringify(settingsData), eligible_esi, eligible_pf);
                } else {
                    delete entity.id;
                    delete entity.employeeName;
                    details = entity;
                    if (entity.effective_date) {
                        details.salaryRevision = {
                            oldCtc: 0,
                            effectiveDate: entity.effective_date,
                            comment: null
                        };
                    }
                    await commonBulkModel.addBasicInfo(organization_id, employeeId, JSON.stringify(details));
                }
            }

            return true;
        } catch (err) {
            throw err;
        }
    }

    async bulkUploadCustomSalary(customSalaryData, organization_id) {
        try {
            // Finding unique
            const { unique: uniqueMailIds } = await findUniqueAndDuplicates(customSalaryData, 'mail_id');

            // employee data fetch based on mail id given
            const employeeData = await commonBulkModel.getEmployees({ organization_id, mail_id: uniqueMailIds });

            const employeeIds = arrayColumn(employeeData, 'employee_id');
            const employeePayrollSettings = await commonBulkModel.getEmployeePayrollSettings(employeeIds);

            for (const entity of customSalaryData) {
                const { mail_id: mailId, ...salaryComponents } = entity;
                const employeeObj = employeeData.find(e => e.mail_id == mailId);

                const employeeId = employeeObj.employee_id;
                const employeeExistsObj = employeePayrollSettings.find(ep => ep.employee_id == employeeId);

                if (employeeExistsObj) {
                    // update
                    const employeeCustomSalary = { ...JSON.parse(employeeExistsObj.salary_components), ...salaryComponents };
                    await commonBulkModel.updateEmployeeSalaryComponents({ salary_components: employeeCustomSalary, employee_id: employeeId, organization_id });
                } else {
                    // create
                    await commonBulkModel.createEmployeeSalaryComponents({ salary_components: salaryComponents, employee_id: employeeId, organization_id });
                }
            }
            return true;
        } catch (err) {
            throw err;
        }
    }

    async getEmployees({ organization_id, mail_id }) {
        return await commonBulkModel.getEmployees({ organization_id, mail_id });
    }

    async ProcessBulkBasicDetails({ organization_id, basicDetails, employeeInfo }) {
        try {
            basicDetails = _.chunk(basicDetails, 10)

            for (const chunk of basicDetails) {
                let PromiseArray = [], PromiseUserArr = [], params = [];
                for (const entity of chunk) {

                    const { phone: contact_number, email: a_email } = entity
                    let userDetails = employeeInfo.find(i => i.employee_unique_id == entity.employee_unique_id.toString());

                    if (userDetails.user_id && (contact_number || a_email)) {
                        PromiseUserArr.push(commonBulkModel.updateUsers(userDetails.user_id, a_email, contact_number))
                    }

                    let data = userDetails.details ? JSON.parse(userDetails.details) : defaultBasicDetailsObj
                    let details = {
                        ...data,
                        marital_status: entity.marital_status || entity.marital_status == 0 ? entity.marital_status : (data.marital_status || null),
                        personal_email: entity.personal_email || data.personal_email || null,
                        c_address: entity.current_address || data.current_address || null,
                        p_address: entity.permanent_address || data.permanent_address || null,
                        type: entity.type || data.type || null,
                    }
                    if (userDetails && (userDetails.details || userDetails.employee_id)) {
                        PromiseArray.push(commonBulkModel.bulkUpdateBasicInfo(organization_id, entity.id, JSON.stringify(details)))
                    } else {
                        params.push([entity.id, organization_id, JSON.stringify(details)])
                    }
                }
                if (params.length !== 0) PromiseArray.push(commonBulkModel.bulkInsertBasicDetails(params))
                await Promise.all(PromiseUserArr);
                await Promise.all(PromiseArray);
            }
            return true;
        } catch (error) {
            throw error;
        }
    }

    async ProcessBulkBankDetails({ organization_id, bankDetails, employeeInfo }) {
        try {
            let PromiseArr = [], PromiseUserArr = [], params = [];
            for (const entity of bankDetails) {
                const userData = employeeInfo.find(i => entity.id == i.employee_id);

                if (userData) {
                    let employee_id = entity.id;
                    let bank_name = entity.bank_name || userData.bank_name || null
                    let ifsc_code = entity.ifsc_code || userData.ifsc_code || null
                    let bank_address = entity.bank_address || userData.bank_address || null
                    let account_number = entity.account_number || userData.account_number || null

                    await commonBulkModel.bulkUpdateBankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id);
                } else {
                    delete entity.employeeName;
                    let { bank_name, ifsc_code, bank_address, account_number, id } = entity
                    params.push([id, bank_name, account_number, ifsc_code, bank_address, organization_id]);
                }
            }
            if (params.length !== 0) await commonBulkModel.bulkInsertBankDetails(params);
            return
        } catch (error) {
            throw error
        }
    }
}

module.exports = new CommonBulkService();