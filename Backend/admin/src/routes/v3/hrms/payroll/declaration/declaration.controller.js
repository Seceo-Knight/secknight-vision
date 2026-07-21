const fs = require('fs');
const path = require('path');
const multer = require('multer');
const _ = require('underscore');
const declarationValidation = require('./declaration.validation');
const declarationSettingService = require('../advancesettings/declaration-settings/declaration-setting.service');
const declarationService = require('./declaration.service');
const { translate } = require('../../../../../utils/messageTranslation');
const { declarationMessages } = require('../../../../../utils/helpers/LanguageTranslate');
const payrollComman = require('../common/payroll/Calculation');
const moment = require('moment');
const { DeductionModel } = require('../declaration/deductions/deductions.model');

class DeclarationController {
    /**
     * postDeclaration - function to handle post declaration request
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async postDeclaration(req, res) {
        try {


            const { organization_id, language, user_id, employee_id } = req.decoded;
            let insertedData
            if (!employee_id) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'NOT_AUTHORIZED', language), error: translate(declarationMessages, 'NOT_AUTHORIZED', language) });
            }

            const { isDeclarationWindowOpen, isMandatorProofNeeded, yearly: yearlyDeclarationWindow } = await declarationSettingService.getDeclarationSettings(organization_id);
            const nowDate = moment().format('YYYY-MM-DD');
            if (
                !isDeclarationWindowOpen ||
                !yearlyDeclarationWindow ||
                (
                    yearlyDeclarationWindow &&
                    !moment(nowDate).isBetween(
                        moment(yearlyDeclarationWindow.from).format('YYYY-MM-DD'),
                        moment(yearlyDeclarationWindow.to).format('YYYY-MM-DD'),
                        'days',
                        '[]' // including start and end days
                    )
                )
            ) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            let host = 'https://';
            host += process.env.API_URL_LOCAL;
            if (process.env.NODE_ENV === 'development') {
                host += process.env.API_URL_DEV;
            } else if (process.env.NODE_ENV === 'production') {
                host += process.env.API_URL_PRODUCTION;
            }

            const rootPath = path.join(__dirname.split('src')[0], 'public', 'declaration');
            // declaration folder check
            if (createFolderIfNotExists(rootPath)) {

                // organization folder check
                const orgRootPath = path.join(rootPath, `org_${organization_id}`);
                if (createFolderIfNotExists(orgRootPath)) {

                    // user folder check
                    const userPath = path.join(orgRootPath, `user_${user_id}`);
                    if (createFolderIfNotExists(userPath)) {

                        //multer initilize
                        const upload = multer({
                            dest: userPath
                        }).array('documents', 10);

                        //multer in work
                        upload(req, res, async function (err) {
                            try {
                                if (err) throw err;

                                // const filesObjArr = req.files.map(f => ({ filename: f.filename, path: f.path, originalname: f.originalname })) || null;
                                const filesObjArr = req.files ? req.files.map(f => ({ filename: f.filename + path.extname(f.originalname), path: f.path, originalname: f.originalname, downloadLink: [host, userPath.split('public/')[1], f.filename + path.extname(f.originalname)].join('/') })) : [];
                                if (req.body.type == 'houseProperty') {
                                    try {
                                        const { error, value } = declarationValidation.createHouseProperty(JSON.parse(req.body.data));
                                        if (error) return res.json({ code: 401, data: null, message: translate(declarationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message });
                                        // if (req.files.length == 0) {
                                        //     return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DOCUMENT_REQUIRED', language), error: translate(declarationMessages, 'DOCUMENT_REQUIRED', language) });
                                        // }
                                        let declared_amount = value && value.houseProperty && value.houseProperty.details && value.houseProperty.details.propertyValue ? value.houseProperty.details.propertyValue : 0;
                                        // let declared_amount = value && value.houseProperty && value.houseProperty.details && value.houseProperty.details && value.houseProperty.details.propertyValue ? value.houseProperty.details.propertyValue : 0;

                                        insertedData = await declarationService.createHouseProperty({ declared_amount, documents: filesObjArr, organization_id, employee_id, value });
                                        value.id = value.id || (insertedData && insertedData.insertId ? insertedData.insertId : value.id)

                                        return res.json({
                                            code: 200,
                                            message: translate(declarationMessages, 'SUCCESS', language),
                                            error: null,
                                            data: value
                                        });

                                    } catch (errr) {
                                        return res.json({ code: 404, message: errr.message, error: errr.message, data: null });
                                    }
                                } else if (req.body.type == 'Income From Previous Employer') {
                                    try {
                                        const { error, value } = declarationValidation.createIncomeFromPreviousEmployer(JSON.parse(req.body.data));
                                        if (error) return res.json({ code: 401, data: null, message: translate(declarationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message });
                                        // if (req.files.length == 0) return res.json(
                                        //     {
                                        //         code: 404,
                                        //         data: null,
                                        //         message: translate(declarationMessages, 'DOCUMENT_REQUIRED', language),
                                        //         error: translate(declarationMessages, 'DOCUMENT_REQUIRED', language)
                                        //     }
                                        // );
                                        let declared_amount = value && value.incomeFromPreviousEmployer && value.incomeFromPreviousEmployer.income ? value.incomeFromPreviousEmployer.income : 0;
                                        insertedData = await declarationService.createHouseProperty({ declared_amount, documents: filesObjArr, organization_id, employee_id, value });
                                        value.id = value.id || (insertedData && insertedData.insertId ? insertedData.insertId : value.id)

                                        return res.json({
                                            code: 200,
                                            message: translate(declarationMessages, 'SUCCESS', language),
                                            error: null,
                                            data: value
                                        });


                                    } catch (err) {
                                        return res.json({ code: 404, message: err.message, error: err.message, data: null });
                                    }
                                } else {
                                    const { error, value } = declarationValidation.postDeclarationValidation(JSON.parse(req.body.data));

                                    if (error) {
                                        return res.json({ code: 404, data: null, message: translate(declarationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message });
                                    }
                                    // const filesObjArr = req.files.map(f => ({ filename: f.filename, path: f.path, originalname: f.originalname }));

                                    if (isMandatorProofNeeded && req.files.length < 0) {
                                        return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DOCUMENT_REQUIRED', language), error: translate(declarationMessages, 'DOCUMENT_REQUIRED', language) });
                                    }
                                    const declarationAddStatus = await declarationService.createOrUpdateDeclaration({ ...value, documents: filesObjArr, organization_id, employee_id });
                                    return res.json({ code: 200, message: translate(declarationMessages, 'SUCCESS', language), error: null, data: null });

                                }
                            } catch (err) {
                                for (const file of req.files) {
                                    deleteFileFromLocal(file.path);
                                }
                                return res.json({ code: 404, message: err.message, error: err.message, data: null });
                            }
                        });
                    }
                }
            }
        } catch (err) {
            return res.json({ code: 404, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * postDeclarationData - function to handle post declaration request
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async postDeclarationData(req, res) {
        try {
            const { organization_id, language, employee_id: loginEmployeeId } = req.decoded;
            let isDeclarationWindowOpen = null;
            let yearlyDeclarationWindow = null;
            try {
                const data = await declarationSettingService.getDeclarationSettings(organization_id);
                isDeclarationWindowOpen = data.isDeclarationWindowOpen;
                yearlyDeclarationWindow = data.yearly;
            } catch (err) {
                const errorMsgKey = loginEmployeeId ? "DECLARATION_SETTING_NOT_SET_EMP" : "DECLARATION_SETTING_NOT_SET_ADMIN";
                return res.json({ code: 406, data: null, message: translate(declarationMessages, errorMsgKey, language), error: translate(declarationMessages, errorMsgKey, language) });
            }
            const nowDate = moment().format('YYYY-MM-DD');
            if (
                !isDeclarationWindowOpen ||
                !yearlyDeclarationWindow ||
                (
                    yearlyDeclarationWindow &&
                    !moment(nowDate).isBetween(
                        moment(yearlyDeclarationWindow.from).format('YYYY-MM-DD'),
                        moment(yearlyDeclarationWindow.to).format('YYYY-MM-DD'),
                        'days',
                        '[]' // including start and end days
                    )
                )
            ) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            const { error, value } = declarationValidation.postDeclarationDataValidation(req.body, loginEmployeeId);

            if (error) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message });
            }

            let { employee_id } = value;
            employee_id = loginEmployeeId ? loginEmployeeId : employee_id;

            if (loginEmployeeId && !employee_id) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'NOT_AUTHORIZED', language), error: translate(declarationMessages, 'NOT_AUTHORIZED', language) });
            }
            let informationObj = {};
            if (value.type) {
                if (value.type.toLowerCase() == 'lta') {
                    informationObj[value.type.toLowerCase()] = { component_name: value.component_name, travel_date: value.travel_date };
                }
            }
            const declarationAddStatus = await declarationService.createOrUpdateDeclaration({ ...value, organization_id, employee_id, information: informationObj, component_name: value.component_name });
            const declarationData = await declarationService.getDeclaration({ ...value, organization_id, employee_id, component_name: value.component_name });
            return res.json({ code: 200, message: translate(declarationMessages, 'SUCCESS', language), error: null, data: declarationData });
        } catch (err) {
            return res.json({ code: 404, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * postDeclaration - function to handle post declaration request
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async postDeclarationUpload(req, res) {
        try {
            const { organization_id, language, user_id } = req.decoded;

            const { isDeclarationWindowOpen, isMandatorProofNeeded, yearly: yearlyDeclarationWindow } = await declarationSettingService.getDeclarationSettings(organization_id);
            const nowDate = moment().format('YYYY-MM-DD');
            if (
                !isDeclarationWindowOpen ||
                !yearlyDeclarationWindow ||
                (
                    yearlyDeclarationWindow &&
                    !moment(nowDate).isBetween(
                        moment(yearlyDeclarationWindow.from).format('YYYY-MM-DD'),
                        moment(yearlyDeclarationWindow.to).format('YYYY-MM-DD'),
                        'days',
                        '[]' // including start and end days
                    )
                )
            ) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            const rootPath = path.join(__dirname.split('src')[0], 'public', 'declaration');

            let host = 'https://';
            host += process.env.API_URL_LOCAL;
            if (process.env.NODE_ENV === 'development') {
                host += process.env.API_URL_DEV;
            } else if (process.env.NODE_ENV === 'production') {
                host += process.env.API_URL_PRODUCTION;
            }

            const { error, value } = declarationValidation.postDeclarationUploadValidation(req.query);

            if (error) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message });
            }

            const employeeDeclartionObj = await declarationService.getDeclarationById(value.employee_declaration_id);
            if (!employeeDeclartionObj) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'VALIDATION_FAILED', language), error: error.details[0].message });
            }

            // declaration folder check
            if (createFolderIfNotExists(rootPath)) {

                // organization folder check
                const orgRootPath = path.join(rootPath, `org_${organization_id}`);
                if (createFolderIfNotExists(orgRootPath)) {

                    // user folder check
                    const userPath = path.join(orgRootPath, `user_${employeeDeclartionObj.user_id}`);
                    if (createFolderIfNotExists(userPath)) {

                        //multer initilize
                        const upload = multer({
                            dest: userPath
                        }).array('documents', 10);

                        //multer in work
                        upload(req, res, async function (err) {
                            try {
                                if (err) throw err;

                                const filesObjArr = req.files.map(f => ({ filename: f.filename + path.extname(f.originalname), path: f.path, originalname: f.originalname, downloadLink: [host, userPath.split('public/')[1], f.filename + path.extname(f.originalname)].join('/') }));
                                if (isMandatorProofNeeded && req.files.length < 0) {
                                    return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DOCUMENT_REQUIRED', language), error: translate(declarationMessages, 'DOCUMENT_REQUIRED', language) });
                                }
                                const declarationDocUpdateStatus = await declarationService.updateDeclarationDocuments({ ...value, documents: filesObjArr });
                                return res.json({ code: 200, message: translate(declarationMessages, 'SUCCESS', language), error: null, data: null });
                            } catch (err) {
                                for (const file of req.files) {
                                    deleteFileFromLocal(file.path);
                                }
                                return res.json({ code: 404, message: err.message, error: err.message, data: null });
                            }
                        });
                    }
                }
            }
        } catch (err) {
            return res.json({ code: 404, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * get employees tax scheme details
     *
     * @param {*} getEmployeesTaxschemeDetails
     * @param {*} req
     * @param {*} res
     * @returns array
     * @author Basavaraj <basavarajshiralashetti@globussoft.in>
     */
    async getEmployeesTaxschemeDetails(req, res) {
        const { organization_id: organizationId, language, employee_id: managerId, role, role_id } = req.decoded;
        try {
            const { value, error } = declarationValidation.employeesTaxSchemes(req.query);
            if (error) return res.json({ code: 404, error: error.details[0].message, data: null, message: 'Validation error.' });

            let { financial_year } = value;
            let employee_ids = [];
            if (managerId && managerId != value.employeeId) {
                employee_ids = _.pluck(await declarationService.getEmployeeAssignedToManager(managerId, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, error: null, data: null, message: 'No Employee Assigned to this account.' });
                if (value.employeeId && !employee_ids.includes(value.employeeId)) return res.json({ code: 400, error: null, data: null, message: 'Employee not assigned to this account.' });
            }

            let data = await declarationService.getEmployeesTaxschemeDetails({ ...value, organizationId, employee_ids });

            data = await Promise.all(data.map(async (item) => {

                // let declarationSection = ["Income From Savings Bank Interest","Income From Other Than Savings Bank Interest","House Property","Income From Pension","Income From Previous Employer","HRA","LTA"]

                const deductions = await DeductionModel.getDeductionsDetails({ withOtherDeductions: false, onlyDeduction: true, employeeIds: [item['employee_id']], financialYear: financial_year, organization_id: organizationId })

                let declarationCount = await DeductionModel.getTaxDeclarationCount({ organization_id: organizationId, employee_id: item['employee_id'], financialYear: financial_year })

                let declarationSBICount = 0, declarationLoanCount = 0, declarationHraCount = 0, declarationLtaCount = 0, declarationOtherSBICount = 0, declarationOHPCount = 0, declarationPensionCount = 0, declarationPreEmpCount = 0
                if (declarationCount.length > 0) {

                    declarationCount.map(item => {

                        switch (item.deduction_name) {
                            case "Income From Savings Bank Interest":
                                declarationSBICount = item.totalCount
                                break;
                            case "Income From Other Than Savings Bank Interest":
                                declarationOtherSBICount = item.totalCount
                                break;
                            case "House Property":
                                declarationOHPCount = item.totalCount
                                break;
                            case "Income From Pension":
                                declarationPensionCount = item.totalCount
                                break;
                            case "Income From Previous Employer":
                                declarationPreEmpCount = item.totalCount
                                break;
                            case "HRA":
                                declarationHraCount = item.totalCount
                                break;
                            case "LTA":
                                declarationLtaCount = item.totalCount
                                break;
                            case "Loans":
                                declarationLoanCount = item.totalCount
                                break;
                            default: break;
                        }
                    }
                    )
                }


                item = {
                    ...item,
                    declaration80CCCount: deductions.length,
                    declarationHraCount,
                    declarationLtaCount,
                    declarationSBICount,
                    declarationOtherSBICount,
                    declarationOHPCount,
                    declarationPensionCount,
                    declarationPreEmpCount,
                    declarationLoanCount
                }

                return item;
            })
            )

            return res.json({ code: 200, error: null, data: data, message: 'Employee data.' });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, error: err.message, data: null, message: 'Something went wrong.' });
        }
    }

    /**
     * get scheme list
     *
     * @param {*} schemesList
     * @param {*} req
     * @param {*} res
     * @returns array
     * @author Basavaraj <basavarajshiralashetti@globussoft.in>
     */
    async schemesList(req, res) {
        try {
            const { value, error } = declarationValidation.taxSchemes(req.query);
            if (error) return res.json({ code: 404, error: error.details[0].message, data: null, message: error.details[0].message });
            let data = await declarationService.schemesList({ ...value });
            data = data.map(scheme => {
                scheme.details = JSON.parse(scheme.details);
                scheme.details = payrollComman.taxScheme({ schemeData: scheme.details, netpay: scheme.details[scheme.details.length - 1].start })
                return scheme;
            });
            data = data.map(scheme => {
                let temp = 0;
                scheme.details = scheme.details.map(e => {
                    temp = e.tax + temp;
                    e.tax = temp;
                    return e;
                })
                return scheme;
            })

            return res.json({ code: 200, error: null, data: data, message: 'Schemes data.' });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, error: err.message, data: null, message: 'Something went wrong.' });
        }
    }

    /**
     * Update employee schemes.
     *
     * @param {*} updateSchemes
     * @param {*} req
     * @param {*} res
     * @returns array
     * @author Basavaraj <basavarajshiralashetti@globussoft.in>
     */
    async updateSchemes(req, res) {
        try {
            const { organization_id: organizationId, language, employee_id } = req.decoded;

            const { value, error } = declarationValidation.updateEmployeesTaxSchemes(req.body);
            if (error) return res.json({ code: 404, error: error.details[0].message, data: null, message: error.details[0].message });

            // const employee = (value.schemeData.length === 1 && value.schemeData[0].employeeId == employee_id) ? true : false;
            await declarationService.updateSchemes({ organizationId, ...value });

            return res.json({ code: 200, error: null, data: null, message: 'Updated.' });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, error: err.message, data: null, message: 'Something went wrong.' });
        }
    }


    /**
     * Controller Method for Get Route 
     * For Tax Correction API
     * @function getTaxCorrectionData
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async getTaxCorrectionData(req, res) {

        // Data from token
        const { organization_id, employee_id, is_manager, is_teamlead, role_id } = req.decoded;
        try {

            // validation
            const { value, error } = declarationValidation.getTaxCorrectionData(req.query);
            if (error) return res.json({ code: 400, data: null, error: error.details[0].message, message: "Validation error!" });

            // if Manager or teamlead
            const to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            // calling service
            const data = await declarationService.getEmployeeTaxData({ ...value, organization_id, to_assigned_id, role_id });

            // returns response
            return res.json({ code: 200, data, error: null, message: 'Employees Tax Data.' });
        } catch (error) {

            // For message from service
            let message = error.message || 'Something went wrong.';

            // if any error then response
            return res.json({ code: 400, data: null, error: 'Something went wrong.', message });
        }
    }


    /**
     * Controller Method for Post Route
     * For Tax Correction API
     * @function postTaxCorrectionData
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async postTaxCorrectionData(req, res) {

        // Data from token
        const { organization_id } = req.decoded;
        try {

            // validation
            const { value, error } = declarationValidation.postTaxCorrectionData(req.body);
            if (error) return res.json({ code: 400, data: null, error: error.details[0].message, message: "Validation error!" });

            // calling service
            await declarationService.updateEmployeeTaxData({ ...value, organization_id });

            // returns response
            return res.json({ code: 200, data: null, error: null, message: "Updated Employee's Data." });
        } catch (error) {

            // For message from service
            let message = error.message || 'Something went wrong.';

            // if any error then response
            return res.json({ code: 400, data: null, error: 'Something went wrong.', message });
        }
    }
}

/**
 * createFolderIfNotExists - function to create a folder if not exists
 * 
 * @param {*} fileDist 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
function createFolderIfNotExists(fileDist) {
    try {
        if (!fs.existsSync(fileDist)) {
            fs.mkdirSync(fileDist);
        }
        return true;
    } catch (err) {
        throw err;
    }
}

/**
 * deleteFileFromLocal - function to delete a files if not exists
 * 
 * @param {*} fileDist 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
function deleteFileFromLocal(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (err) {
        throw err;
    }
}

module.exports = new DeclarationController();