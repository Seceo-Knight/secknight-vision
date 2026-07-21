const fs = require('fs');
var XLSX = require('xlsx');

const BankdetailModel = require('./bankdetail.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const BankdetailValidation = require('./bankdetail.validation');
const BankDetailsValidator = require('../attendance/attendance.validation');
const InformationModel = require('../basicInfo/basicInfo.model');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { bankdetailMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./bankdetail.validation');
const moment = require('moment');
let { settings } = require('./default.payrollsettings');
const { PfService } = require('../payroll/advancesettings/pfandesisettings/pfsettings/pf.service');

//Helpers
const {
    mapBasicDetails,
    processFile,
    mapComplianceData,
    Headers,
    upload,
    findDuplicateIds,
    _, defaultBasicDetailsObj,
    BankDetailsHeaders,
    mapBankDetails,
    addDefaultHeaders, findDuplicateEmpUniqueId
} = require('./bank-details.helper');

class BankdetailController {


    /**
    * Get bank details
    *
    * @function getBankDetails
    * @memberof  BankdetailController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getBankDetails(req, res) {
        let { organization_id, language, employee_id: manager_id, role_id: userRoleId } = req.decoded;
        try {
            const { location_id, role_id: queryRoleId, department_id, name, status, sortColumn, sortOrder, skip, limit, employee_type } = req.query;
            const { value, error } = BankDetailsValidator.userValidation({ department_id, location_id, role_id: queryRoleId, name, sortOrder, sortColumn, status, employee_type });
            if (error) return sendResponse(res, 404, null, translate(bankdetailMessages, "2", language), error.details[0].message);

            let employee_ids = [];
            if (manager_id && manager_id != value.employee_id) {
                employee_ids = _.pluck(await BankdetailModel.getEmployeeAssignedToManager(manager_id, userRoleId), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, error: null, data: null, message: 'No Employee Assigned to this account.' });
                if (value.employee_id && !employee_ids.includes(value.employee_id)) return res.json({ code: 400, error: null, data: null, message: 'Employee not assigned to this account.' });
            }
            let bankdetails = await BankdetailModel.fetchbankDetailsList(location_id, queryRoleId, department_id, name, status, sortColumn, sortOrder, skip, limit, organization_id, value.employee_type, employee_ids)
            bankdetails = bankdetails.map(x => {
                if (x.details) Object.assign(x, JSON.parse(x.details));
                delete x.details;
                return x;
            });
            if (bankdetails.length > 0) return sendResponse(res, 200, bankdetails, translate(bankdetailMessages, "5", language), null);

            return sendResponse(res, 400, null, "No bank details found", null);
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, translate(bankdetailMessages, "6", language), err);
        }
    }

    /**
   * Create bank details
   *
   * @function createBankDetails
   * @memberof  BankdetailController;
   * @param {*} req
   * @param {*} res
   * @returns {object} request list or error
   */
    async createBankDetails(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = joiValidation.BankDetail(req.body);
            if (error) return sendResponse(res, 404, null, translate(bankdetailMessages, "2", language), error.details[0].message);

            const { employee_id, bank_name, account_number, ifsc_code, bank_address } = value;

            const add_bankdetails = await BankdetailModel.addbankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id);
            if (add_bankdetails) {
                if (add_bankdetails.insertId) return sendResponse(res, 200, { id: add_bankdetails.insertId || null, ...req.body }, translate(bankdetailMessages, "3", language), null);
            }
            return sendResponse(res, 400, null, translate(bankdetailMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(bankdetailMessages, "8", language), err);
        }
    }

    async updateBankDetails(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = joiValidation.BankDetail(req.body);
            if (error) return sendResponse(res, 404, null, translate(bankdetailMessages, "2", language), error.details[0].message);

            const { id, employee_id, bank_name, account_number, ifsc_code, bank_address } = value;
            const bank_exist = await BankdetailModel.getBankDetails(employee_id, organization_id);
            let bankDetails;
            if (bank_exist.length > 0) bankDetails = await BankdetailModel.updateBankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id);
            else bankDetails = await BankdetailModel.addbankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id);

            if (bankDetails.affectedRows !== 0) return sendResponse(res, 200, { ...req.body }, translate(bankdetailMessages, "3", language), null);

            return sendResponse(res, 400, null, translate(bankdetailMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(bankdetailMessages, "8", language), err);
        }
    }

    /**
    * Delete bank details
    *
    * @function deleteBankDetails
    * @memberof  BankdetailController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async deleteBankDetails(req, res) {
        let { organization_id, language } = req.decoded;
        let id = req.decoded;
        let ids = req.body.id;
        try {
            const delete_bankdetails = await BankdetailModel.deleteBankDetails(ids, organization_id);
            if (delete_bankdetails) return sendResponse(res, 200, [], translate(bankdetailMessages, "14", language), null);

            return sendResponse(res, 400, null, translate(bankdetailMessages, "15", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(bankdetailMessages, "16", language), null);
        }
    }

    async updateCompliance(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = joiValidation.compliance(req.body);
            if (error) return sendResponse(res, 404, null, translate(bankdetailMessages, "2", language), error.details[0].message);

            const { id, employee_id, marital_status, type, pt_location, pt_location_name, pan_number,
                pf_number, esi_number, uan_number, ctc, gross, c_address, p_address, personal_email, eligible_pf,
                pf_scheme, pf_joining, excess_pf, excess_eps, exist_pf, eligible_esi, eligible_pt, effective_date } = value,
                employeeBasicInfo = await InformationModel.getBasicInfo(organization_id, employee_id),
                esiStatutory = await PfService.getOrgPFSettings(organization_id);
            let statutoryMaxMonthlyGrossForEsi = null
            if (esiStatutory.length !== 0) ({ statutoryMaxMonthlyGrossForEsi = null } = JSON.parse(esiStatutory[0]['settings']));

            if (statutoryMaxMonthlyGrossForEsi && ctc && eligible_esi) {
                if (ctc / 12 > statutoryMaxMonthlyGrossForEsi) return sendResponse(res, 400, null, "CTC can not be more than ESI maximum amount.", null);
            }
            let promiseArray = [], details;
            if (employeeBasicInfo.length !== 0) {
                details = employeeBasicInfo[0]['details'] ? JSON.parse(employeeBasicInfo[0]['details']) : defaultBasicDetailsObj;
                settings = employeeBasicInfo[0]['settings'] ? JSON.parse(employeeBasicInfo[0]['settings']) : settings;
                const oldCtc = details.ctc || 0;
                details = {
                    marital_status: marital_status || details.marital_status,
                    type: type || details.type,
                    ctc: ctc || details.ctc,
                    gross: gross || details.gross,
                    pt_location: pt_location || details.pt_location,
                    pt_location_name: pt_location_name || details.pt_location_name,
                    pan_number: pan_number || details.pan_number,
                    pf_number: pf_number || details.pf_number,
                    esi_number: esi_number || details.esi_number,
                    uan_number: uan_number || details.uan_number,
                    c_address: c_address || details.c_address,
                    p_address: p_address || details.p_address,
                    personal_email: personal_email || details.personal_email,
                    pf_scheme: pf_scheme || details.pf_scheme,
                    excess_pf: excess_pf != null ? excess_pf : details.excess_pf,
                    excess_eps: excess_eps != null ? excess_eps : details.excess_eps,
                    exist_pf: exist_pf != null ? exist_pf : details.exist_pf,
                    eligible_pt: eligible_pt != null ? eligible_pt : details.eligible_pt,
                }
                settings.pf_date_joined = pf_joining || settings.pf_date_joined;
                if (settings && settings.ptSettings && settings.ptSettings.ptAllowed) {
                    settings.ptSettings.ptAllowed = eligible_pt != null && eligible_pt == 1 ? true : false;
                }
                // add salary revision for the employee/user
                if (ctc && +ctc != +oldCtc) {
                    details.salaryRevision = {
                        oldCtc,
                        effectiveDate: effective_date ? moment(effective_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
                        comment: null
                    };
                }
                promiseArray.push(InformationModel.updateBasicInfo(organization_id, employee_id, JSON.stringify(details), JSON.stringify(settings), eligible_esi, eligible_pf))
            } else {
                details = {
                    marital_status, type, ctc, gross, pt_location, pt_location_name,
                    pan_number, pf_number, esi_number, uan_number, c_address, p_address, personal_email,
                    pf_scheme, excess_pf, excess_eps, exist_pf, eligible_pt
                }
                settings.pf_date_joined = pf_joining || settings.pf_date_joined;

                if (effective_date) {
                    details.salaryRevision = {
                        oldCtc: 0,
                        effectiveDate: effective_date,
                        comment: null
                    };
                }
                promiseArray.push(InformationModel.addBasicInfo(organization_id, employee_id, JSON.stringify(details), JSON.stringify(settings), eligible_esi, eligible_pf));
            }

            const compliance = await Promise.all(promiseArray);
            if (compliance.affectedRows !== 0) return sendResponse(res, 200, { ...req.body }, "Compliance details Updated.", null);

            return sendResponse(res, 400, null, "Unable to add Compliance Details.", null);
        } catch (err) {
            return sendResponse(res, 400, null, "Failed to add Compliance Details.", err);
        }
    }

    // bulkUpdateCompliance = async (req, res, next) => {
    //     try {
    //         upload(req, res, async function (err) {
    //             const { organization_id, language } = req.decoded;

    //             if (!req.file || err) {
    //                 return sendResponse(res, 401, null, "Failed Upload", err);
    //             }
    //             const fileName = `${__dirname.split('src')[0]}/public/${req.file.filename}`;
    //             const workbook = XLSX.readFile(fileName, { cellDates: true });
    //             const [sheetName] = workbook.SheetNames;
    //             let ComplianceData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    //             fs.unlinkSync(fileName);
    //             if (!ComplianceData || ComplianceData.length == 0) return sendResponse(res, 401, null, "No Data Exists in File", err);
    //             let keys = Object.keys(ComplianceData[0]);

    //             const notMatched = Object.values(Headers).filter(i => !keys.includes(i));
    //             if (notMatched.length > 0) keys = [...keys, ...notMatched]
    //             // if (notMatched) return sendResponse(res, 400, null, `${notMatched} Header Is Not Matched.`, 'Heads Not Matched');
    //             ComplianceData = mapComplianceData(ComplianceData);

    //             const { error, value } = joiValidation.bulkUpdateCompliance(ComplianceData);
    //             if (error) return sendResponse(res, 401, ComplianceData, "VAlidation Failed", error.details[0].message);

    //             //Finding duplicate id in sheet,it will throw error if it has duplicate ids
    //             const { duplicates, ids } = await findDuplicateIds(value);
    //             if (duplicates.length != 0) return sendResponse(res, 400, duplicates, `Duplicate Ids Sheet : ${duplicates}`, null);

    //             let employeeData = await BankdetailModel.getEmployeesByEmpCode({ organization_id, codes: ids })
    //             if (employeeData.length == 0) return sendResponse(res, 400, ids, `No Employee Found With Give Ids`, null);

    //             const employeeInfo = await InformationModel.getBasicInfoByEmpCode({ organization_id, emp_codes: ids });

    //             const invalidIds = ids.filter(x => _.pluck(employeeData, "employeeId").indexOf(x) === -1);
    //             if (invalidIds.length !== 0) return sendResponse(res, 400, invalidIds, "Invalid Ids", null);

    //             let PromiseArr = [];
    //             for (let entity of value) {
    //                 const { id: empCode } = entity;
    //                 const { employeeId } = employeeData.find(i => i.employeeId == empCode);

    //                 const userData = employeeInfo.find(i => entity.id == i.employee_id);
    //                 let details;
    //                 if (userData) {
    //                     const detailsData = userData.details ? JSON.parse(userData.details) : defaultBasicDetailsObj;
    //                     let settingsData = userData.settings ? JSON.parse(userData.settings) : settings;
    //                     const oldCtc = detailsData.ctc || 0;

    //                     let eligible_pf = entity.eligible_pf || detailsData.eligible_pf || 0;
    //                     let eligible_esi = entity.eligible_esi || detailsData.eligible_esi || 0;

    //                     details = {
    //                         ...detailsData,
    //                         uan_number: entity.uan_number || detailsData.uan_number || null,
    //                         pf_number: entity.pf_number || detailsData.pf_number || null,
    //                         pf_scheme: entity.pf_scheme || detailsData.pf_scheme || null,
    //                         // pf_joining: entity.pf_joining || detailsData.pf_joining || null,
    //                         excess_pf: entity.excess_pf || entity.excess_pf == 0 ? entity.excess_pf : (detailsData.excess_pf || 0),
    //                         excess_eps: entity.excess_eps || entity.excess_eps == 0 ? entity.excess_eps : (detailsData.excess_eps || 0),
    //                         exist_pf: entity.exist_pf || entity.exist_pf == 0 ? entity.exist_pf : (detailsData.exist_pf || 0),
    //                         esi_number: entity.esi_number || detailsData.esi_number || null,
    //                         eligible_pt: entity.eligible_pt || entity.eligible_pt == 0 ? entity.eligible_pt : (detailsData.eligible_pt || 0),
    //                         // eligible_esi: entity.eligible_esi || detailsData.eligible_esi || 0,
    //                         pan_number: entity.pan_number || detailsData.pan_number || null,
    //                         ctc: entity.ctc || detailsData.ctc || 0,
    //                         personal_email: entity.personal_email || detailsData.personal_email || null,
    //                         marital_status: entity.marital_status || entity.marital_status == 0 ? entity.marital_status : (detailsData.marital_status || null),
    //                         c_address: entity.c_address || detailsData.c_address || null,
    //                         p_address: entity.p_address || detailsData.p_address || null,
    //                     }

    //                     settingsData.pf_date_joined = entity.pf_joining || detailsData.pf_joining || null;
    //                     // add salary revision for the employee/user
    //                     if (entity.ctc && +entity.ctc != +oldCtc) {
    //                         details.salaryRevision = {
    //                             oldCtc,
    //                             effectiveDate: entity.effective_date ? moment(entity.effective_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
    //                             comment: null
    //                         };
    //                     }

    //                     PromiseArr.push(InformationModel.updateBasicInfo(organization_id, employeeId, JSON.stringify(details), JSON.stringify(settingsData), eligible_esi, eligible_pf))
    //                 } else {
    //                     delete entity.id;
    //                     delete entity.employeeName;
    //                     details = entity;
    //                     if (entity.effective_date) {
    //                         details.salaryRevision = {
    //                             oldCtc: 0,
    //                             effectiveDate: entity.effective_date,
    //                             comment: null
    //                         };
    //                     }
    //                     PromiseArr.push(InformationModel.addBasicInfo(organization_id, employeeId, JSON.stringify(details)));
    //                 }
    //             }
    //             let data = await Promise.all(PromiseArr);

    //             return sendResponse(res, 200, { value }, "Updated Successfully.", null);
    //         })
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    bulkUpdateCompliance = async (req, res, next) => {
        try {
            upload(req, res, async function (err) {
                const { organization_id, language } = req.decoded;

                if (!req.file || err) {
                    return sendResponse(res, 401, null, "Failed Upload", err);
                }
                const fileName = `${__dirname.split('src')[0]}/public/${req.file.filename}`;
                const workbook = XLSX.readFile(fileName, { cellDates: true });
                const [sheetName] = workbook.SheetNames;
                let ComplianceData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                fs.unlinkSync(fileName);
                if (!ComplianceData || ComplianceData.length == 0) return sendResponse(res, 401, null, "No Data Exists in File", err);
                let keys = Object.keys(ComplianceData[0]);

                const notMatched = Object.values(Headers).filter(i => !keys.includes(i));
                if (notMatched.length > 0) keys = [...keys, ...notMatched]
                // if (notMatched) return sendResponse(res, 400, null, `${notMatched} Header Is Not Matched.`, 'Heads Not Matched');
                ComplianceData = mapComplianceData(ComplianceData);

                const { error, value } = joiValidation.bulkUpdateCompliance(ComplianceData);
                if (error) return sendResponse(res, 401, error, "Validation Failed", error.details[0].message);

                //Finding duplicate id in sheet,it will throw error if it has duplicate ids
                const { duplicates, employee_unique_ids } = await findDuplicateEmpUniqueId(value);
                if (duplicates.length != 0) return sendResponse(res, 400, duplicates, `Duplicate Employee Unique ID Sheet : ${duplicates}`, null);

                let employeeData = await BankdetailModel.getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids })
                if (employeeData.length == 0) return sendResponse(res, 400, employee_unique_ids, `No Employee Found With Given Employee Unique Id`, null);

                // let ids = _.pluck(employeeData, "employeeId");
                const employeeInfo = await InformationModel.getBasicInfoByEmpCode({ organization_id, emp_codes: employee_unique_ids });

                const invalidIds = employee_unique_ids.filter(x => _.pluck(employeeData, "employee_unique_id").indexOf(x) === -1);
                if (invalidIds.length !== 0) return sendResponse(res, 400, invalidIds, "Invalid Employee Unique Ids", null);


                let PromiseArr = [];
                for (let entity of value) {

                    const { id: empCode, employee_unique_id } = entity;
                    const { employeeId } = employeeData.find(i => i.employee_unique_id == employee_unique_id);
                    const userData = employeeInfo.find(i => entity.employee_unique_id == i.employee_unique_id);
                    let details;
                    if (userData) {
                        const detailsData = userData.details ? JSON.parse(userData.details) : defaultBasicDetailsObj;
                        let settingsData = userData.settings ? JSON.parse(userData.settings) : settings;
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
                        // PromiseArr.push(InformationModel.updateBasicInfo(organization_id, employeeId, JSON.stringify(details), JSON.stringify(settingsData), eligible_esi, eligible_pf))
                        await InformationModel.updateBasicInfo(organization_id, employeeId, JSON.stringify(details), JSON.stringify(settingsData), eligible_esi, eligible_pf);
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
                        await InformationModel.addBasicInfo(organization_id, employeeId, JSON.stringify(details));
                    }
                }

                return sendResponse(res, 200, { value }, "Updated Successfully.", null);
            })
        } catch (error) {
            next(error);
        }
    }

    bulkUpdateBankDetails = async (req, res, next) => {
        try {
            upload(req, res, async function (err) {
                const { organization_id, language } = req.decoded;
                let { value: value1, error: valError1 } = joiValidation.bankDetailUpdate(req.query);
                if (valError1) return sendResponse(res, 404, null, "Validation Failed", valError1.details[0].message);

                if (!req.file || err) return sendResponse(res, 401, null, "Failed Upload", err);

                let { xlData: details, fileName } = await processFile(req.file.filename);
                if (!details || details.length == 0) return sendResponse(res, 401, null, "No Data Exists in File", err);
                let keys = Object.keys(details[0]);
                if (value1.detailsType == 'bank') {

                    keys = await addDefaultHeaders({ keys, Headers: BankDetailsHeaders });
                    details = await mapBankDetails(details);

                    let { error: inputError, value: bankDetails } = joiValidation.bankDetailsBulkUpdate(details);
                    if (inputError) return sendResponse(res, 401, inputError, "VAlidation Failed", inputError.details[0].message);

                    const { duplicates, employee_unique_ids } = await findDuplicateEmpUniqueId(bankDetails);
                    if (duplicates.length != 0) return sendResponse(res, 400, duplicates, `Duplicate Ids Sheet : ${duplicates}`, null);

                    let employeeData = await BankdetailModel.getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids })
                    if (employeeData.length == 0) return sendResponse(res, 400, ids, `No Employee Found With Give Ids`, null);

                    const employeeInfo = await BankdetailModel.getBankDetailsByEmpUniqueIds({ employee_unique_ids, organization_id });

                    const invalidIds = employee_unique_ids.filter(x => _.pluck(employeeData, "employee_unique_id").indexOf(x) === -1);
                    if (invalidIds.length !== 0) return sendResponse(res, 400, { invalidIds }, "Invalid Employee Unique Ids", null);

                    bankDetails = bankDetails.map(i => {
                        let userInfo = employeeData.find(itr => itr.employee_unique_id == i.employee_unique_id);
                        if (userInfo) {
                            i = { ...i, id: userInfo.employeeId }
                        }
                        return i;
                    })
                    await ProcessBulkBankDetails({ organization_id, bankDetails, employeeInfo });
                    return sendResponse(res, 200, { details }, "Updated Successfully.", null);

                } else {
                    keys = await addDefaultHeaders({ keys, Headers: BankDetailsHeaders });
                    details = await mapBasicDetails(details);

                    let { error: inputError, value: basicDetails } = joiValidation.basicDetailsBulkUpdate(details);
                    if (inputError) return sendResponse(res, 401, inputError, "VAlidation Failed", inputError.details[0].message);

                    const { duplicates, employee_unique_ids } = await findDuplicateEmpUniqueId(basicDetails);
                    if (duplicates.length != 0) return sendResponse(res, 400, duplicates, `Duplicate Employee unique Ids Sheet : ${duplicates}`, null);

                    let employeeData = await BankdetailModel.getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids })
                    if (employeeData.length == 0) return sendResponse(res, 400, employee_unique_ids, `No Employee Found With Give Ids`, null);

                    const invalidIds = employee_unique_ids.filter(x => _.pluck(employeeData, "employee_unique_id").indexOf(x) === -1);
                    if (invalidIds.length !== 0) return sendResponse(res, 400, { invalidIds, employee_unique_ids }, "Invalid Employee Unique Ids", null);

                    let employeeIds = _.pluck(employeeData, "employeeId");
                    const employeeInfo = await BankdetailModel.getBasicDetailsByEmpIds({ ids: employeeIds, organization_id });

                    basicDetails = basicDetails.map(i => {
                        let userInfo = employeeInfo.find(itr => itr.employee_unique_id == i.employee_unique_id)
                        if (userInfo) {
                            i = { ...i, id: userInfo.id }
                        }
                        return i;
                    })
                    await ProcessBulkBasicDetails({ organization_id, basicDetails, employeeInfo });
                    return sendResponse(res, 200, { basicDetails }, "Updated Successfully.", null);
                }

                return sendResponse(res, 200, details, "Updated Successfully.", null);
            });
        } catch (error) {
            console.log(error, '=============Error==================');
            next(error)
        }
    }
}

module.exports = new BankdetailController;

const ProcessBulkBankDetails = async ({ organization_id, bankDetails, employeeInfo }) => {
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

                // PromiseArr.push(BankdetailModel.bulkUpdateBankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id))
                await BankdetailModel.bulkUpdateBankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id);
            } else {
                delete entity.employeeName;
                let { bank_name, ifsc_code, bank_address, account_number, id } = entity
                params.push([id, bank_name, account_number, ifsc_code, bank_address, organization_id]);
            }
        }

        if (params.length !== 0) await BankdetailModel.bulkInsertBankDetails(params);
        return
    } catch (error) {
        throw error
    }
}


const ProcessBulkBasicDetails = async ({ organization_id, basicDetails, employeeInfo }) => {
    try {
        basicDetails = _.chunk(basicDetails, 10)

        for (const chunk of basicDetails) {
            let PromiseArray = [], PromiseUserArr = [], params = [];
            for (const entity of chunk) {

                const { phone: contact_number, email: a_email } = entity
                let userDetails = employeeInfo.find(i => i.employee_unique_id == entity.employee_unique_id.toString());

                if (userDetails.user_id && (contact_number || a_email)) {
                    PromiseUserArr.push(BankdetailModel.updateUsers(userDetails.user_id, a_email, contact_number))
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
                    PromiseArray.push(InformationModel.bulkUpdateBasicInfo(organization_id, entity.id, JSON.stringify(details)))
                } else {
                    params.push([entity.id, organization_id, JSON.stringify(details)])
                }
            }
            if (params.length !== 0) PromiseArray.push(BankdetailModel.bulkInsertBasicDetails(params))
            await Promise.all(PromiseUserArr);
            await Promise.all(PromiseArray);
        }

        return;
    } catch (error) {
        throw error;
    }
};
// const ProcessBulkBasicDetails = async ({ organization_id, basicDetails, employeeInfo }) => {
//     try {
//         let PromiseArray = [], params = [];
//         console.log(employeeInfo)
//         for (const entity of basicDetails) {

//             const { phone: contact_number, email: a_email } = entity
//             let userDetails = employeeInfo.find(i => i.employee_unique_id == entity.employee_unique_id.toString());

//             if (userDetails.user_id && (contact_number || a_email)) {
//                 PromiseArray.push(BankdetailModel.updateUsers(userDetails.user_id, a_email, contact_number))
//             }

//             let data = userDetails.details ? JSON.parse(userDetails.details) : defaultBasicDetailsObj
//             let details = {
//                 ...data,
//                 marital_status: entity.marital_status || entity.marital_status == 0 ? entity.marital_status : (data.marital_status || null),
//                 personal_email: entity.personal_email || data.personal_email || null,
//                 c_address: entity.current_address || data.current_address || null,
//                 p_address: entity.permanent_address || data.permanent_address || null,
//                 type: entity.type || data.type || null,
//             }
//             if (userDetails && (userDetails.details || userDetails.employee_id)) {
//                 PromiseArray.push(InformationModel.bulkUpdateBasicInfo(organization_id, entity.id, JSON.stringify(details)))
//             } else {
//                 params.push([entity.id, organization_id, JSON.stringify(details)])
//             }
//         }
//         if (params.length !== 0) PromiseArray.push(BankdetailModel.bulkInsertBasicDetails(params))

//         let result = await Promise.all(PromiseArray);
//         return { result };
//     } catch (error) {
//         throw error;
//     }
// };

// const ProcessBulkBankDetails = async ({ organization_id, bankDetails, employeeInfo }) => {
//     try {
//         let PromiseArr = [], params = [], result;
//         for (const entity of bankDetails) {

//             const userData = employeeInfo.find(i => entity.id == i.employee_id);

//             if (userData) {
//                 let employee_id = entity.id;
//                 let bank_name = entity.bank_name || userData.bank_name || null
//                 let ifsc_code = entity.ifsc_code || userData.ifsc_code || null
//                 let bank_address = entity.bank_address || userData.bank_address || null
//                 let account_number = entity.account_number || userData.account_number || null

//                 PromiseArr.push(BankdetailModel.bulkUpdateBankDetails(employee_id, bank_name, account_number, ifsc_code, bank_address, organization_id))
//             } else {
//                 delete entity.employeeName;
//                 let { bank_name, ifsc_code, bank_address, account_number, id } = entity
//                 params.push([id, bank_name, account_number, ifsc_code, bank_address, organization_id]);

//             }
//             if (params.length !== 0) PromiseArr.push(BankdetailModel.bulkInsertBankDetails(params));
//         }
//         return await Promise.all(PromiseArr)

//     } catch (error) {
//         throw error
//     }
// }


