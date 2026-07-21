const multer = require('multer');
const _ = require('underscore');
const fs = require('fs');
var XLSX = require('xlsx');

const upload = multer({
    dest: __dirname.split('src')[0] + 'public',
    filename: function (req, file, callback) {
        callback(null, file.filename + '.xlsx')
    }
}).single('file');

const Headers = {
    // id: "ID",
    employee_unique_id: "EMPLOYEE UNIQUE ID",
    employeeName: "Employee Name",
    eligible_pf: "ELIGIBLE FOR PF?",
    uan_number: "UAN NUMBER",
    pf_number: "PF NUMBER",
    pf_scheme: "PF SCHEME",
    pf_joining: "PF JOINING DATE",
    excess_pf: "FOR EXCESS EPF CONTRIBUTION?",
    excess_eps: "FOR EXCESS EPS CONTRIBUTION?",
    exist_pf: "IS EXISTING MEMBER OF PF?",
    eligible_esi: "IS EMPLOYEE ELIGIBLE FOR ESI?",
    eligible_pt: "IS EMPLOYEE ELIGIBLE FOR PT?",
    esi_number: "ESI NUMBER",
    pan: "PAN NUMBER",
    ctc: "CTC",
    gross: "GROSS",
    effective_date: "EFFECTIVE DATE",
}
const mapComplianceData = data => {
    try {
        data = data.map(item => ({
            // id: item[`${Headers.id}`] || "",
            employee_unique_id: item[`${Headers.employee_unique_id}`] || "",
            employeeName: item[`${Headers.employeeName}`] || "",
            eligible_pf: item[`${Headers.eligible_pf}`] || "",
            uan_number: item[`${Headers.uan_number}`],
            pf_number: item[`${Headers.pf_number}`] || "",
            pf_scheme: item[`${Headers.pf_scheme}`] || "",
            pf_joining: item[`${Headers.pf_joining}`] || "",
            excess_pf: item[`${Headers.excess_pf}`] || "",
            excess_eps: item[`${Headers.excess_eps}`] || "",
            exist_pf: item[`${Headers.exist_pf}`] || "",
            esi_number: item[`${Headers.esi_number}`] || "",
            eligible_pt: item[`${Headers.eligible_pt}`] || "",
            eligible_esi: item[`${Headers.eligible_esi}`] || "",
            pan_number: item[`${Headers.pan}`] || "",
            ctc: item[`${Headers.ctc}`] || "",
            gross: item[`${Headers.gross}`] || "",
            effective_date: item[`${Headers.effective_date}`] || "",
        }))
        return data;
    } catch (error) {
        throw error;
    }
}

// Finding Duplicate ids in sheet
const findDuplicateIds = async data => {
    let ids = _.pluck(data, "id")
    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
    return { duplicates, ids };
}

// Finding Duplicate ids in sheet
const findDuplicateEmpUniqueId = async data => {
    let employee_unique_ids = _.pluck(data, "employee_unique_id")
    const duplicates = employee_unique_ids.filter((item, index) => employee_unique_ids.indexOf(item) !== index);
    return { duplicates, employee_unique_ids };
}

const defaultBasicDetailsObj = {
    type: null,
    marital_status: null, ctc: null, gross: null, pt_location: null,
    pt_location_name: null, pan_number: null, pf_number: null, esi_number: null,
    uan_number: null, c_address: null, p_address: null, personal_email: null,
    pf_scheme: null, excess_pf: null,
    excess_eps: null, exist_pf: null, eligible_pt: null,
}

const processFile = (file) => {
    try {
        const fileName = `${__dirname.split('src')[0]}/public/${file}`;
        const workbook = XLSX.readFile(fileName, { cellDates: true });

        const [sheetName] = workbook.SheetNames;
        let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        fs.unlinkSync(fileName);
        return { xlData, fileName };
    } catch (error) {
        throw error
    }
}

const BankDetailsHeaders = {
    employee_unique_id: "EMPLOYEE UNIQUE ID",
    employeeName: "EMPLOYEE NAME",
    bank_name: "BANK NAME",
    ifsc_code: "IFSC",
    bank_address: "ADDRESS",
    account_number: "ACCOUNT NUMBER",
}

const BasicDetailsHeaders = {
    employeeName: "EMPLOYEE NAME",
    marital_status: "MARITAL STATUS",
    phone: "PHONE NUMBER",
    email: "EMAIL",
    personal_email: "PERSONAL EMAIL",
    current_address: "CURRENT ADDRESS",
    permanent_address: "PERMANENT ADDRESS",
    type: "TYPE",
    employee_unique_id: "EMPLOYEE UNIQUE ID"
}

const mapBankDetails = data => {
    try {
        data = data.map(item => ({
            employee_unique_id: item[`${BankDetailsHeaders.employee_unique_id}`] || "",
            employeeName: item[`${BankDetailsHeaders.employeeName}`] || "",
            bank_name: item[`${BankDetailsHeaders.bank_name}`] || "",
            ifsc_code: item[`${BankDetailsHeaders.ifsc_code}`] || "",
            bank_address: item[`${BankDetailsHeaders.bank_address}`] || "",
            account_number: item[`${BankDetailsHeaders.account_number}`] || "",
        }));
        return data;
    } catch (error) {
        throw error;
    }
}

const mapBasicDetails = data => {
    try {
        data = data.map(item => {
            if (item[`${BasicDetailsHeaders.phone}`]) {
                item[`${BasicDetailsHeaders.phone}`] = item[`${BasicDetailsHeaders.phone}`].toString()
            }
            let entity = {
                employeeName: item[`${BasicDetailsHeaders.employeeName}`] || "",
                marital_status: item[`${BasicDetailsHeaders.marital_status}`] || 0,
                phone: item[`${BasicDetailsHeaders.phone}`] || "",
                email: item[`${BasicDetailsHeaders.email}`] || "",
                personal_email: item[`${BasicDetailsHeaders.personal_email}`] || "",
                current_address: item[`${BasicDetailsHeaders.current_address}`] || "",
                permanent_address: item[`${BasicDetailsHeaders.permanent_address}`] || "",
                type: item[`${BasicDetailsHeaders.type}`] || "",
                employee_unique_id: item[`${BasicDetailsHeaders.employee_unique_id}`] || "",
            }
            return entity;
        });
        return data;
    } catch (error) {
        throw error;
    }
}

const addDefaultHeaders = ({ Headers, keys }) => {
    try {

        const notMatched = Object.values(Headers).filter(i => !keys.includes(i));
        if (notMatched.length > 0) keys = [...keys, ...notMatched];
        return keys;

    } catch (error) {
        throw error
    }
}

module.exports = {
    mapBasicDetails,
    processFile,
    mapComplianceData,
    findDuplicateIds,
    Headers,
    upload,
    _,
    defaultBasicDetailsObj,
    BankDetailsHeaders,
    mapBankDetails,
    addDefaultHeaders,
    findDuplicateEmpUniqueId
}