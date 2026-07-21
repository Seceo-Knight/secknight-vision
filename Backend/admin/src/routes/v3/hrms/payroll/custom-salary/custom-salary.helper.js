const intersection = (arrA, arrB) => {
    const setA = new Set(arrA);
    const setB = new Set(arrB);
    let _intersection = new Set()
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return Array.from(_intersection);
}
exports.intersection = intersection;
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
 * mapCustomSalaryComponents - function to map array of object with  the header
 * 
 * @param {*} objectArr 
 * @param {*} headerArr 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
const mapCustomSalaryComponents = (objectArr, headerArr = []) => {
    const resultObjArr = [];
    if (!headerArr.length) return resultObjArr;
    if (objectArr && objectArr.length) {
        const tempKeyArr = Object.keys(objectArr[0]);
        if (!intersection(tempKeyArr, headerArr).length) return resultObjArr;
    }

    for (const obj of objectArr) {
        const tempObj = {};
        for (const header of headerArr) {
            tempObj[header] = obj[header] || !isNaN(obj[header]) ? obj[header] : null;
        }
        if (Object.keys(tempObj).length) resultObjArr.push(tempObj);
    }
    return resultObjArr;
}
exports.mapCustomSalaryComponents = mapCustomSalaryComponents;

const wordToSnakeCase = str => str.toLowerCase().split(' ').join('_');

/**
 * snakeCaseToWord - functiont to convert snake_case to snake case
 * 
 * @param {*} str 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
const snakeCaseToWord = str => str.split('_').join(' ');
exports.snakeCaseToWord = snakeCaseToWord;

/**
 * wordsToSnakeCase - function to word arr to snake_case_arr
 * 
 * @param {*} strArr 
 * @returns 
 * @author Amit Verma <amitverma@globussoft.in>
 */
const wordsToSnakeCase = (strArr) => strArr.map(str => wordToSnakeCase(str));
exports.wordsToSnakeCase = wordsToSnakeCase;

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
exports.tranformToSnakeCaseKeyValue = tranformToSnakeCaseKeyValue;

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
 * isString - function to check a value is string or not
 * 
 * @param {*} str 
 * @returns Boolean
 * @author Amit Verma <amitverma@globussoft.in>
 */
const isString = str => typeof str == 'string';
exports.isString = isString;

/**
 * MyError - custom error to set code for a error
 * @author Amit Verma <amitverma@globussoft.in>
 */
class MyError extends Error {
    constructor(code, message, defaultMsg = null) {
        super(message);
        this.name = 'MyError';
        this.code = code || 400;
        this.defaultMsg = defaultMsg
    }
}
exports.MyError = MyError;

const arrayToObject = (array) => {
    const resultObj = {};
    for (const key of array) {
        resultObj[key] = null;
    }
    return resultObj;
}
exports.arrayToObject = arrayToObject;