// Request Details Controller

const sendResponse = require('../../../../../../utils/myService').sendResponse;
const requestDetailsValidator = require('./requestDetails.validation');
const requestDetailsModel = require('./requestDetails.model');

const details = ['emp_code', 'location', 'date_of_joining', 'date_of_birth', 'department', 'marital_status', 'phone_no', 'email_id', 'current_address', 'permanent_address',
    'bank_name', 'ifsc', 'account_no', 'bank_address',
    'uan_no', 'esi_no', 'pan_no',
    'f_nameOfFamilyMember', 'f_age', 'f_gender', 'f_relationShipWithEmployee', 'f_occupation', 'f_dateOfBirth', 'f_aadharNo', 'f_contactNo', 'f_bloodGroup', 'f_panNo',
    'q_qualificationType', 'q_qualificationDetails', 'q_nameOfInstitute', 'q_universityBoard', 'q_yearOfPassing', 'q_percentageGrade',
    'e_nameOfCompany', 'e_designation', 'e_reportingManager', 'e_contactOfReportingManager', 'e_joiningDate', 'e_leavingDate', 'e_hrName',
    'e_hrMailId', 'e_hrContactNo', 'e_reasonForLeaving', 'e_employeeId'
];

const marital_status = { 1: 'Single', 2: 'Married', 3: 'Widowed', 4: 'Divorced', 5: 'Separated' };


class RequestDetailsController {

    /**
     * Get request Details
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async getRequestDetails(req, res) {
        const { organization_id, employee_id, is_manager, is_teamlead, role_id } = req.decoded;
        try {
            let { value, error } = requestDetailsValidator.getRequestDetails(req.query);
            if (error) return sendResponse(res, 400, null, 'Validation Failed.', error.details[0].message);

            let empIDs = null;
            empIDs = employee_id ? [employee_id] : empIDs;
            empIDs = value.employee_id ? [value.employee_id] : empIDs;
            if (is_manager || is_teamlead) {
                empIDs = await requestDetailsModel.assignedEmployees(employee_id, role_id);
                empIDs = empIDs.map(x => x.employee_id);
            }

            let requestData = await requestDetailsModel.getRequestDetails({ ...value, organization_id, empIDs });
            if (!requestData.length) return sendResponse(res, 400, null, 'No Data Found.', null);

            let data = []
            for (let element of requestData) {
                let location_id = element.module_name == 'location' ? element.value : 0;
                let department_id = element.module_name == 'department' ? element.value : 0;
                let [item] = await requestDetailsModel.getEmployee(element.employee_id, location_id, department_id);
                element.value = element.module_name == 'marital_status' ? marital_status[element.value] : element.value;
                element.value = typeof element.value == 'object' ? element.value.text : element.value;
                if (item) data.push({ ...element._doc, ...item });
            }

            return sendResponse(res, 200, data, 'Success.', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', error);
        }
    }

    /**
     * Create Request Details
     * @param {*} req 
     * @param {*} res 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async createRequestDetails(req, res) {
        const { organization_id, employee_id } = req.decoded;
        try {
            let { value, error } = requestDetailsValidator.createRequestDetails(req.body);
            if (error) return sendResponse(res, 400, null, 'Validation Failed.', error.details[0].message);

            let checkRequests = await requestDetailsModel.getRequestDetails({ ...value, organization_id, employee_id });
            if (checkRequests.length) return sendResponse(res, 400, null, 'Your request is already in pending!', null);

            if (value.id) {
                let [requestData] = await requestDetailsModel.getRequestDetails({ organization_id, id: value.id });
                if (!requestData) return sendResponse(res, 400, null, 'No Data Found with ID given.', null);
                if (!value.delete && (requestData.status == 2 || requestData.status == 3)) return sendResponse(res, 400, null, 'Request is already Accepted/Rejected.', null);

                if (value.delete) {
                    let deleteCount = await requestDetailsModel.deleteRequest({ organization_id, id: value.id });
                    if (!deleteCount) return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', null);
                    return sendResponse(res, 200, null, 'Request Deleted.', null);
                }

                let data = typeof requestData.value == 'object' ? { id: requestData.value.id, text: value.value.text } : value.value;
                let updateData = await requestDetailsModel.updateRequestById({ id: value.id, data });
                if (!updateData) return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', null);
                return sendResponse(res, 200, null, 'Request Updated successfully.', null);
            }

            if (!details.includes(value.module_name)) return sendResponse(res, 400, null, 'Wrong module_name.', null);

            if (['f_nameOfFamilyMember', 'f_age', 'f_gender', 'f_relationShipWithEmployee', 'f_occupation', 'f_dateOfBirth', 'f_aadharNo', 'f_contactNo', 'f_bloodGroup', 'f_panNo',
                'q_qualificationType', 'q_qualificationDetails', 'q_nameOfInstitute', 'q_universityBoard', 'q_yearOfPassing', 'q_percentageGrade', 'e_nameOfCompany', 'e_designation',
                'e_reportingManager', 'e_contactOfReportingManager', 'e_joiningDate', 'e_leavingDate', 'e_hrName',
                'e_hrMailId', 'e_hrContactNo', 'e_reasonForLeaving', 'e_employeeId'].includes(value.module_name)) {
                if (typeof value.value != 'object' || !value.value.id || !value.value.text) return sendResponse(res, 400, null, 'Value should contain id and text.', null);
            }
            else {
                if (typeof value.value == 'object') return sendResponse(res, 400, null, 'Value should not be object.', null);
            }

            let data = await requestDetailsModel.createRequestDetails({ ...value, status: 1, organization_id, employee_id });

            return sendResponse(res, 200, data, 'Request Created successfully.', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', error);
        }
    }

    /**
     * Update Request Details  
     * @param {*} req 
     * @param {*} res 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async updateRequestDetails(req, res) {
        const { organization_id, user_id } = req.decoded;
        try {
            const validation = requestDetailsValidator.updateRequestDetails(req.body);
            if (validation.error) return sendResponse(res, 400, null, 'Validation Failed.', validation.error.details[0].message);

            const { id, status } = validation.value;
            let [data] = await requestDetailsModel.getRequestDetails({ id, organization_id });
            if (!data) return sendResponse(res, 400, null, 'No Data Found.', null);

            if (validation.value.delete) {
                let deleteCount = await requestDetailsModel.deleteRequest({ organization_id, id });
                if (!deleteCount) return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', null);
                return sendResponse(res, 200, null, 'Request Deleted.', null);
            }

            if ([2, 3].includes(Number(data.status))) return sendResponse(res, 400, null, 'Request is already Accepted/Rejected.', null);

            if (status == 3) {
                data.status = 3;
                data.updated_by = user_id;
                data.updated_date = new Date().toISOString();
                await requestDetailsModel.updateRequest(data);
                return sendResponse(res, 200, null, 'Request Rejected Successfully.', null);
            }

            let table_name;
            let { module_name, value, employee_id } = data;
            if (['emp_code', 'location', 'department'].includes(module_name)) {
                module_name = module_name == 'emp_code' ? 'emp_code' : module_name;
                module_name = module_name == 'location' ? 'location_id' : module_name;
                module_name = module_name == 'department' ? 'department_id' : module_name;

                table_name = 'employees';
            }
            else if (['date_of_joining', 'phone_no'].includes(module_name)) {
                module_name = module_name == 'date_of_joining' ? 'date_join' : module_name;
                module_name = module_name == 'phone_no' ? 'contact_number' : module_name;

                table_name = 'users';
            }
            else if (['bank_name', 'ifsc', 'account_no', 'bank_address'].includes(module_name)) {
                module_name = module_name == 'bank_name' ? 'bank_name' : module_name;
                module_name = module_name == 'ifsc' ? 'ifsc_code' : module_name;
                module_name = module_name == 'account_no' ? 'account_number' : module_name;
                module_name = module_name == 'bank_address' ? 'address' : module_name;

                table_name = 'bank_account_details';
            }
            else if (['marital_status', 'current_address', 'date_of_birth', 'permanent_address', 'email_id', 'uan_no', 'esi_no', 'pan_no'].includes(module_name)) {
                let [details] = await requestDetailsModel.getEmployeeDetails(employee_id);
                details = JSON.parse(details.details);

                details.marital_status = module_name == 'marital_status' ? value : details.marital_status;
                details.date_of_birth = module_name == 'date_of_birth' ? value : details.date_of_birth;
                details.c_address = module_name == 'current_address' ? value : details.c_address;
                details.p_address = module_name == 'permanent_address' ? value : details.p_address;
                details.personal_email = module_name == 'email_id' ? value : details.personal_email;
                details.uan_number = module_name == 'uan_no' ? value : details.uan_number;
                details.esi_number = module_name == 'esi_no' ? value : details.esi_number;
                details.pan_number = module_name == 'pan_no' ? value : details.pan_number;

                module_name = 'details';
                value = JSON.stringify(details);
                table_name = 'employee_payroll_settings';
            }
            else if (['f_nameOfFamilyMember', 'f_age', 'f_gender', 'f_relationShipWithEmployee', 'f_occupation', 'f_dateOfBirth', 'f_aadharNo', 'f_contactNo', 'f_bloodGroup', 'f_panNo'].includes(module_name)) {
                let [family] = await requestDetailsModel.getEmployeeDetails(employee_id);
                family = JSON.parse(family.family);

                let { id, text } = value;
                let index = family.findIndex(x => x._id == id);
                if (index < 0) return sendResponse(res, 400, null, 'Something wrong with the request, delete this request and create new request.', null);

                family[index].nameOfFamilyMember = module_name == 'f_nameOfFamilyMember' ? text : family[index].nameOfFamilyMember;
                family[index].age = module_name == 'f_age' ? text : family[index].age;
                family[index].gender = module_name == 'f_gender' ? text : family[index].gender;
                family[index].relationShipWithEmployee = module_name == 'f_relationShipWithEmployee' ? text : family[index].relationShipWithEmployee;
                family[index].occupation = module_name == 'f_occupation' ? text : family[index].occupation;
                family[index].dateOfBirth = module_name == 'f_dateOfBirth' ? text : family[index].dateOfBirth;
                family[index].aadharNo = module_name == 'f_aadharNo' ? text : family[index].aadharNo;
                family[index].contactNo = module_name == 'f_contactNo' ? text : family[index].contactNo;
                family[index].panNo = module_name == 'f_panNo' ? text : family[index].panNo;
                family[index].bloodGroup = module_name == 'f_bloodGroup' ? text : family[index].bloodGroup;

                module_name = 'family';
                value = JSON.stringify(family);
                table_name = 'employee_details';
            }
            else if (['q_qualificationType', 'q_qualificationDetails', 'q_nameOfInstitute', 'q_universityBoard', 'q_yearOfPassing', 'q_percentageGrade'].includes(module_name)) {
                let [qualification] = await requestDetailsModel.getEmployeeDetails(employee_id);
                qualification = JSON.parse(qualification.qualification);

                let { id, text } = value;
                let index = qualification.findIndex(x => x._id == id);
                if (index < 0) return sendResponse(res, 400, null, 'Something wrong with the request, delete this request and create new request.', null);

                qualification[index].qualificationType = module_name == 'q_qualificationType' ? text : qualification[index].qualificationType;
                qualification[index].qualificationDetails = module_name == 'q_qualificationDetails' ? text : qualification[index].qualificationDetails;
                qualification[index].nameOfInstitue = module_name == 'q_nameOfInstitute' ? text : qualification[index].nameOfInstitue;
                qualification[index].universityBoard = module_name == 'q_universityBoard' ? text : qualification[index].universityBoard;
                qualification[index].yearOfPassing = module_name == 'q_yearOfPassing' ? text : qualification[index].yearOfPassing;
                qualification[index].percentageGrade = module_name == 'q_percentageGrade' ? text : qualification[index].percentageGrade;

                module_name = 'qualification';
                value = JSON.stringify(qualification);
                table_name = 'employee_details';
            }
            else if (['e_nameOfCompany', 'e_designation', 'e_reportingManager', 'e_contactOfReportingManager', 'e_joiningDate', 'e_leavingDate', 'e_hrName',
                'e_hrMailId', 'e_hrContactNo', 'e_reasonForLeaving', 'e_employeeId'].includes(module_name)) {

                let [experience] = await requestDetailsModel.getEmployeeDetails(employee_id);
                experience = JSON.parse(experience.experience);

                let { id, text } = value;
                let index = experience.findIndex(x => x._id == id);
                if (index < 0) return sendResponse(res, 400, null, 'Something wrong with the request, delete this request and create new request.', null);

                experience[index].nameOfCompany = module_name == 'e_nameOfCompany' ? text : experience[index].nameOfCompany;
                experience[index].designation = module_name == 'e_designation' ? text : experience[index].designation;
                experience[index].reportingManager = module_name == 'e_reportingManager' ? text : experience[index].reportingManager;
                experience[index].contactOfReportingManager = module_name == 'e_contactOfReportingManager' ? text : experience[index].contactOfReportingManager;
                experience[index].joiningDate = module_name == 'e_joiningDate' ? text : experience[index].joiningDate;
                experience[index].leavingDate = module_name == 'e_leavingDate' ? text : experience[index].leavingDate;
                experience[index].hrName = module_name == 'e_hrName' ? text : experience[index].hrName;
                experience[index].hrMailId = module_name == 'e_hrMailId' ? text : experience[index].hrMailId;
                experience[index].hrContactNo = module_name == 'e_hrContactNo' ? text : experience[index].hrContactNo;
                experience[index].reasonForLeaving = module_name == 'e_reasonForLeaving' ? text : experience[index].reasonForLeaving;
                experience[index].employeeId = module_name == 'e_employeeId' ? text : experience[index].employeeId;

                module_name = 'experience';
                value = JSON.stringify(experience);
                table_name = 'employee_details';
            }

            await requestDetailsModel.UpdateDetails({ module_name, value, employee_id, table_name });

            data.status = 2;
            data.updated_by = user_id;
            data.updated_date = new Date().toISOString();
            await requestDetailsModel.updateRequest(data);

            return sendResponse(res, 200, null, 'Request Accepted successfully.', null);
        } catch (error) {
            return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', error);
        }
    }
}

// exports 
module.exports = new RequestDetailsController();