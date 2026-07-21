
const wordToSnakeCase = str => str.toLowerCase().split(' ').join('_');

/**
 * isString - function to check a value is string or not
 * 
 * @param {*} str 
 * @returns Boolean
 * @author Amit Verma <amitverma@globussoft.in>
 */
const isString = str => typeof str == 'string';
exports.isString = isString;

const mapToModuleKey = (data) => {
    const resultObj = {
        basicDetails: [],
        bankDetails: [],
        complianceDetails: [],
        customSalary: []
    };

    if (!data || (data && !data.length)) return resultObj;

    for (const rawData of data) {
        const basicDetailsObj = { ...defaultObj(Object.values(BASIC_DETAILS_KEY_OBJ)) };
        const bankDetailsObj = { ...defaultObj(Object.values(BANK_DETAILS_KEY_OBJ)) };
        const complianceDetailsObj = { ...defaultObj(Object.values(COMPLIANCE_DETAILS_KEY_OBJ)) };
        const customSalaryObj = { ...defaultObj(Object.values(CUSTOM_SALARY_KEY_OBJ)) };
        for (const key in rawData) {
            if (Object.keys(BASIC_DETAILS_KEY_OBJ).some(k => key == k)) {
                basicDetailsObj[BASIC_DETAILS_KEY_OBJ[key]] = rawData[key];
            }
            if (Object.keys(BANK_DETAILS_KEY_OBJ).some(k => key == k)) {
                bankDetailsObj[BANK_DETAILS_KEY_OBJ[key]] = rawData[key];
            }
            if (Object.keys(COMPLIANCE_DETAILS_KEY_OBJ).some(k => key == k)) {
                complianceDetailsObj[COMPLIANCE_DETAILS_KEY_OBJ[key]] = rawData[key];
            }
            if (Object.keys(CUSTOM_SALARY_KEY_OBJ).some(k => key == k)) {
                customSalaryObj[CUSTOM_SALARY_KEY_OBJ[key]] = rawData[key];
            }
        }

        resultObj.basicDetails.push(basicDetailsObj);
        resultObj.bankDetails.push(bankDetailsObj);
        resultObj.complianceDetails.push(complianceDetailsObj);
        resultObj.customSalary.push(customSalaryObj);
    }

    return resultObj;
}
exports.mapToModuleKey = mapToModuleKey;

/**
 * tranformToSnakeCaseKeyValue - function to covert a word into snake case
 * 
 * @param {*} objectArr 
 * @returns
 * @author Amit Verma <amitverma@globussoft.in> 
 */
const tranformToSnakeCaseKeyValue = (objectArr) => objectArr.map(obj => {
    const tempObj = {};
    for (const key in obj) {
        tempObj[wordToSnakeCase(key.trimEnd())] = obj[key];
    }

    return tempObj;
});

const defaultObj = (arr) => {
    const obj = {};
    for (const key of arr) {
        obj[key] = null;
    }
    return obj;
}
exports.tranformToSnakeCaseKeyValue = tranformToSnakeCaseKeyValue;

/**
 * findUniqueAndDuplicates - function to get unique and duplicates
 *
 * @param {*} data
 * @param {*} key
 * @returns
 * @author Amit Verma <amitverma@globussoft.in>
 */
const findUniqueAndDuplicates = async (data, key = 'mail_id') => {
    const resultObj = { duplicates: [], unique: [] };

    const keyValueArr = arrayColumn(data, key);
    if (keyValueArr && !keyValueArr.length) return resultObj;

    const unique = [...new Set(keyValueArr)];
    const duplicates = keyValueArr.filter((value, index) => unique.indexOf(value) !== index);
    resultObj.unique = unique;
    resultObj.duplicates = duplicates;
    return resultObj;
}
exports.findUniqueAndDuplicates = findUniqueAndDuplicates;

/**
 * arrayColumn - function to get a key from array of object
 * 
 * @param {*} objArr 
 * @param {*} column 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
const arrayColumn = (objArr, column) => objArr.length ? objArr.map(obj => obj[column]) : [];
exports.arrayColumn = arrayColumn;

/**
 * difference - function to get difference b/w 2 array
 *
 * @param {*} universalArr
 * @param {*} subArray
 * @returns
 * @author Amit Verma <amitverma@globussoft.in>
 */
const difference = (universalArr, subArray) => {
    const _difference = new Set(universalArr);
    const setB = new Set(subArray);
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return Array.from(_difference)
}
exports.difference = difference;

/**
 * arrayify - function to convert into array
 * 
 * @param {*} a 
 * @returns
 * @author Amit Verma <amitverma@globussoft.in> 
 */
const arrayify = function (a) {
    if (Array.isArray(a)) return a;
    return [a];
    // return [].slice.call(a);
};
exports.arrayify = arrayify;

/**
 *  Basic details, key column mapping
 */
const BASIC_DETAILS_KEY_OBJ = {
    employee_unique_id: "employee_unique_id",
    employee_name: "employee_name",
    type: "type",
    marital_status: "marital_status",
    email: "email",
    phone_number: 'phone',
    personal_email: "personal_email",
    current_address: "current_address",
    permanent_address: "permanent_address",
};
exports.BASIC_DETAILS_KEY_OBJ = BASIC_DETAILS_KEY_OBJ;

/**
 * bank details, key column mapping
 */
const BANK_DETAILS_KEY_OBJ = {
    employee_unique_id: "employee_unique_id",
    employee_name: "employee_name",
    bank_name: "bank_name",
    ifsc: "ifsc_code",
    account_number: "account_number",
    address: "bank_address"
};
exports.BANK_DETAILS_KEY_OBJ = BANK_DETAILS_KEY_OBJ;

/**
 * compliance details, key value mapping
 */
const COMPLIANCE_DETAILS_KEY_OBJ = {
    employee_unique_id: "employee_unique_id",
    employee_name: "employee_name",
    eligible_for_pf: "eligible_pf",
    uan_number: "uan_number",
    pf_number: "pf_number",
    pf_scheme: "pf_scheme",
    pf_joining_date: "pf_joining",
    for_excess_epf_contribution: "excess_pf",
    for_excess_eps_contribution: "excess_eps",
    is_existing_member_of_pf: "exist_pf",
    is_employee_eligible_for_esi: "eligible_esi",
    is_employee_eligible_for_pt: "eligible_pt",
    esi_number: "esi_number",
    pan_number: "pan_number",
    ctc: "ctc",
    gross: "gross",
    effective_date: "effective_date"
};
exports.COMPLIANCE_DETAILS_KEY_OBJ = COMPLIANCE_DETAILS_KEY_OBJ;

/**
 * custom salary, key column mapping
 */
const CUSTOM_SALARY_KEY_OBJ = {
    employee_unique_id: 'mail_id',
    ctc: "annual_ctc",
    monthly_ctc: "monthly_ctc",
    employer_pf: "employer_pf",
    employer_esic: "employer_esic",
    gross_salary: "gross_salary",
    basic_allowance: "basic_allowance",
    hra: "hra",
    telephone_and_internet: "telephone_and_internet",
    medical_allowance: "medical_allowance",
    lunch_allowance: "lunch_allowance",
    special_allowance: "special_allowance"
};
exports.CUSTOM_SALARY_KEY_OBJ = CUSTOM_SALARY_KEY_OBJ;

// Default employee payroll details
const DEAULT_BANK_DETAILS = {
    father_name: null,
    mother_name: null,
    spouse_name: null,
    marital_status: null,
    type: null,
    pt_location: null,
    pt_location_name: null,
    pan_number: null,
    pf_number: null,
    esi_number: null,
    uan_number: null,
    ctc: null,
    eps_number: null,
    c_address: null,
    p_address: null,
    salaryRevision: {
        oldCtc: null,
        effectiveDate: null,
        comment: null
    }
};
exports.DEAULT_BANK_DETAILS = DEAULT_BANK_DETAILS;


const DEFAULT_BASIC_DETAILS_OBJ = {
    type: null,
    marital_status: null, ctc: null, gross: null, pt_location: null,
    pt_location_name: null, pan_number: null, pf_number: null, esi_number: null,
    uan_number: null, c_address: null, p_address: null, personal_email: null,
    pf_scheme: null, excess_pf: null,
    excess_eps: null, exist_pf: null, eligible_pt: null,
};
exports.DEFAULT_BASIC_DETAILS_OBJ = DEFAULT_BASIC_DETAILS_OBJ;

//Default Payroll settings
const DEFAULT_SETTINGS_OBJ = {
    pf_date_joined: null,
    pf_effective_date: null,
    esi_effective_date: null,
    vpf: null,
    pfContribution: {
        employee: {
            is_fixed: false,
            fixed_amount: 0,
            basic: false,
            percentage: 0
        },
        employer: {
            is_fixed: false,
            fixed_amount: 0,
            basic: false,
            percentage: 0
        }

    },
    esiContribution: {
        employee: {
            is_fixed: false,
            fixed_amount: 0,
            gross: false,
            percentage: 0
        },
        employer: {
            is_fixed: false,
            fixed_amount: 0,
            gross: false,
            percentage: 0
        }
    },
    ptSettings: {
        ptEffectiveDate: null,
        location_id: null,//
        ptAllowed: false
    }
}
exports.DEFAULT_SETTINGS_OBJ = DEFAULT_SETTINGS_OBJ;