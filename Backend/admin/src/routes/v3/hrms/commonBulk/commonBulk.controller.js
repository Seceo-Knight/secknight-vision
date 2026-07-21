const fs = require('fs');
const utils = require('util');

const multer = require('multer');
const XLSX = require('xlsx');
const commonBulkService = require('./commonBulk.service');
const commonBulkValidation = require('./commonBulk.validation');
const {
    mapToModuleKey, arrayColumn, difference, findUniqueAndDuplicates, tranformToSnakeCaseKeyValue,
    BASIC_DETAILS_KEY_OBJ, BANK_DETAILS_KEY_OBJ, COMPLIANCE_DETAILS_KEY_OBJ, CUSTOM_SALARY_KEY_OBJ
} = require('./commonBulk.helper');

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



class CommonBulkController {
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

            // workbook init
            const workbook = XLSX.readFile(filepath, { cellDates: true, cellFormula: false });

            // sheet reading
            const [sheetName] = workbook.SheetNames;

            const dataInJsonFormat = tranformToSnakeCaseKeyValue(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));

            // remove the file after reading
            fs.unlinkSync(filepath);

            if (!dataInJsonFormat || dataInJsonFormat.length == 0) {
                return res.json({ code: 401, message: "No Data Exists in File", error: "No Data Exists in File", data: null });
            }

            // Finding duplicate id in sheet,it will throw error if it has duplicate ids
            const { duplicates, unique: uniqueMailIds } = await findUniqueAndDuplicates(dataInJsonFormat, 'employee_unique_id');
            if (duplicates.length) throw new Error(`Duplicate Employee mail id Sheet: ${duplicates}`);

            // employee data fetch based on mail id given
            const employeeData = await commonBulkService.getEmployees({ organization_id, mail_id: uniqueMailIds });
            if (!employeeData.length) throw new Error("No Employee Found With Given Employee mail Id");


            // invalid employee mail ids checks
            const employeeMailIds = arrayColumn(employeeData, 'mail_id');
            const invalidEmployeeMailIds = difference(uniqueMailIds, employeeMailIds);
            if (invalidEmployeeMailIds.length) throw new Error(`Invalid Employee mail id Sheet: ${invalidEmployeeMailIds}`);

            // reading of file and tranforming of headers
            const moduleWiseData = mapToModuleKey(dataInJsonFormat);

            // // joi validation
            const { error, value } = commonBulkValidation.bulkUploadValidation(moduleWiseData);
            if (error) {
                return res.json({ code: 401, message: 'Validation Failed', error: error.details[0].message, data: null });
            }

            const commonBulkUpload = await commonBulkService.bulkUpload(value, organization_id);
            return res.json({ code: 200, message: 'Success.', error: null, data: null });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new CommonBulkController;