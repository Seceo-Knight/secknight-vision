const router = require('express').Router();

/** Imports */
const OrganizationDetailsRoutes = require('./organizationDetails/organizationDetails.routes');
const AnnouncementsRoutes = require('./announcement/announcements.routes');
const LocationController = require('./location/location.controller');
const DepartmentController = require('./department/department.controller');
const PolicyController = require('./policy/policy.controller');
const ExpenseController = require('./expense/expense.controller');
const TransferController = require('./transfer/transfer.controller');
const AwardController = require('./award/award.controller');
const PromotionController = require('./promotion/promotion.controller');
const TerminationController = require('./termination/termination.controller');
const ComplaintController = require('./complaint/complaint.controller');
const WarningController = require('./warning/warning.controller');
const TravelController = require('./travel/travel.controller');
const BankdetailController = require('./bankdetail/bankdetail.controller');
const HolidayController = require('./holiday/holiday.controller')
const { LeaveController } = require('./leave/leave.controller');
const AttendanceController = require('./attendance/attendance.controller');
const SettingController = require('./setting/setting.controller');
const InformationController = require('./basicInfo/basicInfo.controller');
const PayrollRoutes = require('./payroll/routes');
const EmployeeInfo = require('./basicInfo/employeeInfo/routes');
const CommonBulkRoutes = require('./commonBulk/commonBulk.routes');
const EmployeeShiftsRoutes = require("./employeeShifts/employee_shifts.routes");
const HRMSPasswordRoutes = require("./hrmsPassword/hrmsPassword.routes");
const BasicInfoController = require('./basicInfo/basicInfo.controller');


/**
 * @class HRMSRoutes
 * All HRMS Routes
 */
class HrmsRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {

        //Announcements
        this.myRoutes.use('/announcements', new AnnouncementsRoutes().getRouters());

        //Location
        this.myRoutes.get('/location', LocationController.getLocations);
        this.myRoutes.post('/location', LocationController.createLocation);
        this.myRoutes.put('/location', LocationController.updateLocation);

        //Department
        this.myRoutes.get('/department', DepartmentController.getDepartments);
        this.myRoutes.post('/department', DepartmentController.createDepartment);
        this.myRoutes.put('/department', DepartmentController.updateDepartment);
        this.myRoutes.delete('/department', DepartmentController.deleteDepartment);

        //Policy
        this.myRoutes.get('/policy', PolicyController.getPolicy);
        this.myRoutes.post('/policy', PolicyController.createPolicy);
        this.myRoutes.put('/policy', PolicyController.updatePolicy);
        this.myRoutes.delete('/policy', PolicyController.deletePolicy);

        //Expenses 
        this.myRoutes.get('/get-expenses', ExpenseController.getExpense);
        this.myRoutes.post('/get-expenses', ExpenseController.getExpenseById);
        this.myRoutes.post('/create-expenses', ExpenseController.createExpense);
        this.myRoutes.put('/update-expenses', ExpenseController.updateExpense);
        this.myRoutes.delete('/delete-expenses', ExpenseController.deleteExpense);

        //Transfer
        this.myRoutes.get('/get-transfer', TransferController.getTransferDetails);
        this.myRoutes.post('/get-transfer', TransferController.getTransferDetailsById);
        this.myRoutes.post('/create-transfer', TransferController.createTransfer);
        this.myRoutes.post('/update-transfer', TransferController.updateTransfer);
        this.myRoutes.delete('/delete-transfer', TransferController.deleteTransfer);

        //Award
        this.myRoutes.get('/award', AwardController.getAwards);
        this.myRoutes.post('/award', AwardController.createAward);
        this.myRoutes.put('/award', AwardController.updateAward);
        this.myRoutes.delete('/award', AwardController.deleteAward);

        //Promotion
        this.myRoutes.get('/promotion', PromotionController.getPromotions);
        this.myRoutes.post('/promotion', PromotionController.createPromotion);
        this.myRoutes.put('/promotion', PromotionController.updatePromotion);
        this.myRoutes.delete('/promotion', PromotionController.deletePromotion);

        //Termination
        this.myRoutes.get('/termination', TerminationController.getTerminations);
        this.myRoutes.post('/termination', TerminationController.createTermination);
        this.myRoutes.put('/termination', TerminationController.updateTermination);
        this.myRoutes.delete('/termination', TerminationController.deleteTermination);

        //Travel
        this.myRoutes.get('/travel', TravelController.getTravel);
        this.myRoutes.post('/travel', TravelController.createTravel);
        this.myRoutes.put('/travel', TravelController.updateTravel);
        this.myRoutes.patch('/travel', TravelController.updateTravelStatus);
        this.myRoutes.delete('/travel', TravelController.deleteTravel);

        //Complaints
        this.myRoutes.get('/complaints', ComplaintController.getComplaints);
        this.myRoutes.post('/create-complaints', ComplaintController.createComplaints);
        this.myRoutes.delete('/delete-complaints', ComplaintController.deleteComplaints);

        //Warnings
        this.myRoutes.get('/warnings', WarningController.getWarnings);
        this.myRoutes.post('/create-warnings', WarningController.createWarnings);
        this.myRoutes.delete('/delete-warnings', WarningController.deleteWarnings);

        //Employee Bank Details 
        this.myRoutes.get('/get-bankdetails', BankdetailController.getBankDetails);
        this.myRoutes.post('/create-bankdetails', BankdetailController.createBankDetails);
        this.myRoutes.put('/update-bankdetails', BankdetailController.updateBankDetails);
        this.myRoutes.delete('/delete-bankdetails', BankdetailController.deleteBankDetails);
        this.myRoutes.post('/bank-details/bulk-update', BankdetailController.bulkUpdateBankDetails);

        //Employee Compliance Details 
        this.myRoutes.put('/compliance', BankdetailController.updateCompliance);
        this.myRoutes.post('/compliance', BankdetailController.bulkUpdateCompliance);

        //Holidays
        this.myRoutes.get('/get-holidays', HolidayController.getHolidays);

        this.myRoutes.post('/create-holidays', HolidayController.createHolidays);
        this.myRoutes.put('/holiday', HolidayController.updateHoliday);
        this.myRoutes.delete('/delete-holidays', HolidayController.deleteHolidays);
        this.myRoutes.post('/fetch-holidays', HolidayController.fetchHolidays);

        //Leave
        this.myRoutes.post('/get-geo-field-data', LocationController.getGeoFieldData);
        this.myRoutes.get('/leave', LeaveController.getLeave);
        this.myRoutes.post('/leave', LeaveController.createLeave);
        this.myRoutes.put('/leave', LeaveController.updateLeave);
        this.myRoutes.patch('/leave', LeaveController.updateLeaveStatus);
        this.myRoutes.delete('/leave', LeaveController.deleteLeave);
        this.myRoutes.get('/employee-leave', LeaveController.getLeaveByMonth);
        this.myRoutes.get('/leave-by-status', LeaveController.getLeaveByStatus);
        this.myRoutes.get('/leave-details', LeaveController.getLeaveDetails);
        this.myRoutes.put('/leave-details', LeaveController.approveRejectLeave);
        this.myRoutes.get('/leave-override', LeaveController.getLeaveOverride);
        this.myRoutes.post('/leave-override', LeaveController.addLeaveOverride);
        this.myRoutes.post('/fetch-leaves', LeaveController.fetchLeave);
        this.myRoutes.post('/create-field-leaves',LeaveController.createFieldLeave);
        this.myRoutes.post('/field-leave-type', LeaveController.getFieldLeaveTypes);
        this.myRoutes.post('/update-field-leaves',LeaveController.updateFieldLeave);
        this.myRoutes.post('/delete-field-leaves',LeaveController.deleteFieldLeave);

        //Leave types
        this.myRoutes.get('/leave-type', LeaveController.getLeaveTypes);
        this.myRoutes.post('/leave-type', LeaveController.createLeaveType);
        this.myRoutes.put('/leave-type', LeaveController.updateLeaveType);
        this.myRoutes.delete('/leave-type', LeaveController.deleleLeaveType);

        // Attendance
        this.myRoutes.get('/attendance', AttendanceController.getAttendance);
        this.myRoutes.get('/getAttendanceCustom', AttendanceController.getAttendanceCustom);
        this.myRoutes.post('/attendanceOverride', AttendanceController.attendanceOverride);
        this.myRoutes.get('/requestAttendance', AttendanceController.getRequestAttendance);
        this.myRoutes.post('/requestAttendance', AttendanceController.postRequestAttendance);
        this.myRoutes.get('/attendance/mark', AttendanceController.getMarkAttendance);
        this.myRoutes.post('/attendance/mark', AttendanceController.markAttendance);
        this.myRoutes.post('/attendance-request', AttendanceController.attendanceRequest);
        this.myRoutes.post('/getAttendanceField', AttendanceController.getAttendanceField);
        this.myRoutes.post('/markAttendanceField', AttendanceController.markAttendanceField);
        this.myRoutes.post('/fetch-attendance-field', AttendanceController.fetchAttendance);
        this.myRoutes.post('/attendance-field-request',AttendanceController.attendanceFieldRequest);
        this.myRoutes.post('/attendance-fieldtracking', AttendanceController.getAttendanceFieldTracking);

        // Setting
        this.myRoutes.get('/setting', SettingController.getSetting);
        this.myRoutes.put('/setting', SettingController.updateSetting);

        // Basic Info
        this.myRoutes.get('/basic-info', InformationController.getEmployeeBasicInfo);
        this.myRoutes.put('/basic-info', InformationController.updateEmployeeBasicInfo);
        this.myRoutes.get('/employee-details', InformationController.getEmployeeDetails);

        //BioMetrics Controller
        this.myRoutes.get('/biometrics', InformationController.getEmployeeBioMetricsStatus);
        this.myRoutes.post('/biometrics', InformationController.updateEmployeeBioMetricsStatus);

        this.myRoutes.get('/get-bio-metric-fetch-employee-password-enable-status', InformationController.fetchEmployeePasswordStatusEnable);
        this.myRoutes.post('/update-bio-metrics-fetch-employee-password-status', InformationController.updateEmployeePasswordStatus)

        this.myRoutes.get('/get-biometrics_confirmation_status', InformationController.fetchOrganizationBioMetricsConfirmationStatus);
        this.myRoutes.post('/update-biometrics_confirmation_status', InformationController.updateOrganizationBioMetricsConfirmationStatus);

        this.myRoutes.get('/get-camera-overlay-status', InformationController.fetchOrganizationCameraOverLayStatus);
        this.myRoutes.post('/update-camera-overlay-status', InformationController.updateOrganizationCameraOverLayStatus);

        this.myRoutes.post('/add-biometrics-department', InformationController.addBiometricsDepartment);
        this.myRoutes.get('/get-biometrics-department', InformationController.getBiometricsDepartment);
        this.myRoutes.put('/edit-biometrics-department', InformationController.editDepartmentBioMetrics);
        this.myRoutes.get('/get-access-log', InformationController.getAccessLogs);
        this.myRoutes.post('/import-depatement-emp', InformationController.importEMPDepartment);
        this.myRoutes.get('/get-department-access', InformationController.getDepartmentAccess);
        this.myRoutes.get('/get-total-access-log-count', InformationController.getTotalAccessLogsCount);

        //employee info
        this.myRoutes.use('/employee-details', new EmployeeInfo().getRouters());

        //payroll
        this.myRoutes.use('/payroll', new PayrollRoutes().getRouters());

        //LOP
        this.myRoutes.post('/loss-of-pay', LeaveController.lossOfPay);

        // Organization Details
        this.myRoutes.use('/organizationDetails', new OrganizationDetailsRoutes().getRouters());

        //common bulk
        this.myRoutes.use('/common-bulk', new CommonBulkRoutes().getRouters());


        /** Employee Shifts Routes */
        this.myRoutes.use("/employee-shifts", new EmployeeShiftsRoutes().getRouters());

        // HRMS Password
        this.myRoutes.use("/password", new HRMSPasswordRoutes().getRouters());

        this.myRoutes.post("/add-email-alert-birthday", BasicInfoController.updateBirthdayMailDetail);
        this.myRoutes.get("/get-email-alert-birthday", BasicInfoController.getBirthdayMailDetail);
    }

    getRouters() {
        return this.myRoutes;
    }
}


/** Exports */
module.exports = HrmsRoutes;