const utils = require('util');
const fs = require('fs');
const multer = require('multer');

const XLSX = require('xlsx');
const customSalaryValidation = require('./custom-salary.validation');
const {
    mapCustomSalaryComponents, tranformToSnakeCaseKeyValue, MyError
    , arrayToObject
} = require('./custom-salary.helper');
const customSalaryModel = require('./custom-salary.model');
const customSalaryService = require('./custom-salary.service');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const sendResponse = require('../../../../../utils/myService').sendResponse;
const { commonMessages } = require('../../../../../utils/helpers/LanguageTranslate');

const MANDATORY_ORG_COMPONENTS = ["annual_ctc", "monthly_ctc", "employer_pf", "employer_esic", "gross_salary", "basic_allowance", "hra", "telephone_and_internet", "medical_allowance", "lunch_allowance", "special_allowance"];


// multer setup
const storage = multer.diskStorage({
    destination: (req, res, callback) => {
        callback(null, __dirname.split('src')[0] + 'public/');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname.toLowerCase().split(' ').join('-'));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, callback) => {
        if (
            file.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
            callback(null, true);
        } else {
            callback(null, false);
            return callback(new Error('File types allowed .xlsx!'));
        }
    }
}).single('file');

// promisify the upload
const fileUpload = utils.promisify(upload);


class CustomSalaryController {
    /**
     * bulkUpload - controller function for bulk upload
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async bulkUpload(req, res, next) {
        try {
            const { organization_id } = req.decoded;

            // file upload
            await fileUpload(req, res);
            if (req.file == undefined) {
                return res.json({ code: 400, message: 'please upload file.', error: "please upload file.", data: null });
            }

            // file related variables
            const file = req.file;
            const filepath = file.path;

            // organization setting fetch
            let [orgnaizationPayrollSettings] = await customSalaryService.getOrganizationPayrollSettings(organization_id);
            const organizationSalaryComponents = orgnaizationPayrollSettings.components ? orgnaizationPayrollSettings.components.split(',').map(c => c.trim()) : [];

            if (!organizationSalaryComponents.length) {
                // remove the file after reading
                fs.unlinkSync(filepath);
                return res.json({ code: 400, message: "Custom salary components not present.", error: "Custom salary components not present.", data: null });
            }
            organizationSalaryComponents.push('mail_id');
            // workbook init
            const workbook = XLSX.readFile(filepath, { cellDates: true, cellFormula: false });

            // sheet reading
            const [sheetName] = workbook.SheetNames;

            // reading of file and tranforming of headers
            const customSalaryData = mapCustomSalaryComponents(
                tranformToSnakeCaseKeyValue(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])),
                organizationSalaryComponents
            );

            // remove the file after reading
            fs.unlinkSync(filepath);

            // if file is empty
            if (!customSalaryData || customSalaryData.length == 0) {
                return res.json({ code: 401, message: "No Data Exists in File", error: "No Data Exists in File", data: null });
            }

            // joi validation
            const { error, value } = customSalaryValidation.bulkUploadCustomSalary(customSalaryData, organizationSalaryComponents);
            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }

            const customUpload = await customSalaryService.bulkUpload(value, organization_id);

            return res.json({ code: 200, message: 'Success.', error: null, data: null });
        } catch (err) {
            if (err instanceof MyError) {
                return res.json({ code: err.code, message: err.message, error: err, data: null });
            }
            next(err);
        }
    }

    /**
         * getEmployeeCustomSalaryDetails Salary setting - function to get employee custom salary settings
         * 
         * @param {*} organization_id,value
         * @returns
         * @author Mahesh D<maheshd@globussoft.in> 
         */
    async getEmployeeCustomDetails(req, res) {
        const { organization_id, language, employee_id: manager_id, role_id } = req.decoded;
        try {
            // organization setting fetch
            let [orgnaizationPayrollSettings] = await customSalaryService.getOrganizationPayrollSettings(organization_id);
            if (!orgnaizationPayrollSettings) {
                return res.json({ code: 400, message: "Organization payroll settings not found.", error: "Organization payroll settings not found.", data: null })
            }

            let organizationSalaryComponents = orgnaizationPayrollSettings.components ? orgnaizationPayrollSettings.components.split(',').map(c => c.trim()) : [];
            if (!organizationSalaryComponents.length) {
                organizationSalaryComponents = await customSalaryService.addOrgDefaultComponents(organization_id);
                // remove the file after reading
                // return res.json({ code: 400, message: "Custom salary components not present.", error: "Custom salary components not present.", data: null });
            }

            const { value, error } = customSalaryValidation.ValidateGetCustomDetails(req.query);

            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            let { data, employeeCount } = await customSalaryService.getEmployeeCustomSalaryDetails(value, organization_id, role_id, manager_id);

            const defaultSalaryComponents = arrayToObject(organizationSalaryComponents);


            data = data.map(item => {
                item.salary_components = item.salary_components ? { ...defaultSalaryComponents, ...JSON.parse(item.salary_components) } : defaultSalaryComponents;
                item.additional_components = item.additional_components ? JSON.parse(item.additional_components) : null;
                item.deduction_components = item.deduction_components ? JSON.parse(item.deduction_components) : null;
                // details = { ...customSettings, ...salary_components }
                return { item }
            });

            return res.json({ code: 200, error: null, data: { data, employeeCount }, message: 'customSettings Settings' });
        } catch (err) {
            return res.json({ code: 401, error: err.message, data: null, message: err.message });
        }
    }

    async getOrganizationCustomDetails(req, res) {
        const { organization_id, language } = req.decoded;
        try {

            const customSettings = await customSalaryService.getOrgCustomSalaryDetails(organization_id);


            return res.json({ code: 200, error: null, data: customSettings, message: 'customSettings Settings' });
        } catch (err) {
            return res.json({ code: 401, error: err.message, data: null, message: err.message });
        }
    }

    /**
     * postCustomSalary - function to post custom salary
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async postCustomDetails(req, res) {
        try {
            const { organization_id } = req.decoded;
            // organization setting fetch
            let [orgnaizationPayrollSettings] = await customSalaryService.getOrganizationPayrollSettings(organization_id);
            if (!orgnaizationPayrollSettings) {
                return res.json({ code: 400, message: "Organization payroll settings not found.", error: "Organization payroll settings not found.", data: null })
            }

            let organizationSalaryComponents = orgnaizationPayrollSettings.components ? orgnaizationPayrollSettings.components.split(',').map(c => c.trim()) : [];
            if (!organizationSalaryComponents.length) {
                organizationSalaryComponents = await customSalaryService.addOrgDefaultComponents(organization_id);
                // remove the file after reading
                // return res.json({ code: 400, message: "Custom salary components not present.", error: "Custom salary components not present.", data: null });
            }
            const { value, error } = customSalaryValidation.postCustomDetails(req.body, organizationSalaryComponents);
            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }
            const postData = await customSalaryService.postSalaryComponents(value, organization_id);
            return res.json({ code: 200, message: 'Success.', error: null, data: value });

        } catch (err) {
            if (err instanceof MyError) {
                return res.json({ code: err.code, message: err.message, error: err, data: null });
            }
            return res.json({ code: 400, message: 'Something went wrong!', error: null, data: null });
        }
    }


    /**
     * getOrgComponents - function to get org components
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getOrgComponents(req, res) {
        try {
            const { organization_id } = req.decoded;
            // organization setting fetch
            let [orgnaizationPayrollSettings] = await customSalaryService.getOrganizationPayrollSettings(organization_id);
            if (!orgnaizationPayrollSettings) {
                return res.json({ code: 400, message: "Organization payroll settings not found.", error: "Organization payroll settings not found.", data: null })
            }

            let organizationSalaryComponents = orgnaizationPayrollSettings.components ? orgnaizationPayrollSettings.components.split(',').map(c => c.trim()) : [];
            if (!organizationSalaryComponents.length) {
                organizationSalaryComponents = await customSalaryService.addOrgDefaultComponents(organization_id);
            }

            let mandatoryComponets = new Set(MANDATORY_ORG_COMPONENTS)

            organizationSalaryComponents = organizationSalaryComponents.filter((components) => {
                // return those elements not in the namesToDeleteSet
                return !mandatoryComponets.has(components);
            });

            if (organizationSalaryComponents.length)
                return res.json({ code: 200, message: 'Success.', error: null, data: organizationSalaryComponents });
            else
                return res.json({ code: 400, message: 'No Components to Remove', error: null, data: organizationSalaryComponents });

        } catch (err) {
            if (err instanceof MyError) {
                return res.json({ code: err.code, message: err.message, error: err, data: null });
            }
            return res.json({ code: 400, message: 'Something went wrong!', error: null, data: null });
        }
    }

    /**
     * postOrgComponents - function for org components
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async postOrgComponents(req, res) {
        try {
            const { organization_id } = req.decoded;
            const { error, value } = customSalaryValidation.postOrgComponents(req.body);
            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }
            const orgComponents = await customSalaryService.upsertOrgComponents(organization_id, value);
            return res.json({ code: 200, message: 'Success.', error: null, data: orgComponents });
        } catch (err) {
            if (err instanceof MyError) {
                return res.json({ code: err.code, message: err.message, error: err, data: null });
            }
            return res.json({ code: 400, message: 'Something went wrong!', error: null, data: null });
        }
    }
}

module.exports = new CustomSalaryController