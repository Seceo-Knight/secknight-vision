const _ = require("underscore");
const moment = require('moment-timezone');
const momentPack = require('moment');
const LeaveModel = require('./leave.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const LeaveValidation = require('./leave.validation');
const AttendanceHelper = require('../attendance/attendance.helper');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { leaveMessages } = require("../../../../utils/helpers/LanguageTranslate");
const annualLeaveTypes = [0, 12, 6, 3, 1];

class LeaveController extends AttendanceHelper {

    /**
    * Create Leave
    *
    * @function createLeave
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} created list or error
    */
    createLeave = async (req, res) => {
        const { organization_id, language, timezone } = req.decoded;
        try {
            // validation
            let { value, error } = LeaveValidation.addLeave(req.body);
            if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);

            // get values from validation
            let { employee_id, day_type, leave_type, start_date, end_date, reason, status } = value;
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');

            if ([1, 3].includes(day_type) && !moment(start_date).isSame(end_date)) return sendResponse(res, 400, null, "If leave applied for First/Second Half then dates should be same!", null);

            // if leave already exists for that day
            const leaveExists = await LeaveModel.leaveExists(organization_id, employee_id, moment(start_date).format('YYYY-MM-'), moment(end_date).format('YYYY-MM-'));
            if (leaveExists.length > 0) {
                let existingLeaves = [], applyingFor = getDates(start_date, end_date);
                leaveExists.forEach(x => {
                    let dates = getDates(moment(x.start_date).format('YYYY-MM-DD'), moment(x.end_date).format('YYYY-MM-DD'));
                    existingLeaves.push(...dates);
                });
                if (existingLeaves.find(i => applyingFor.includes(i))) return sendResponse(res, 400, null, translate(leaveMessages, "32", language), null);
            }

            // calculate no of days excluding holidays and week-off
            let betweenDays = await filterLeavesDates({ start_date, end_date, organization_id, employee_id }),
                number_of_days = (day_type == 1 || day_type == 3) ? betweenDays.length - 0.5 : betweenDays.length;

            // number_of_days <= 0 means employee has applied for holidays/week-off
            if (number_of_days <= 0) return sendResponse(res, 400, null, 'You can not apply for leave in week-off/holidays.', null);

            // getting remaining leaves 
            let { total_org_leaves, total_annual_applied, overridden_leaves } = await getRemainingLeaves(leave_type, employee_id, organization_id);

            // remaining leaves
            let remaining_org_leaves = (total_org_leaves - total_annual_applied) > 0 ? (total_org_leaves - total_annual_applied) : 0;

            // check if the no of leaves greater than all allocated leaves to an employee (organization leaves + overridden leaves)
            if (number_of_days > (remaining_org_leaves + overridden_leaves)) {
                let more_than_given_leaves = remaining_org_leaves < 0 ? number_of_days : number_of_days - (remaining_org_leaves + overridden_leaves);
                more_than_given_leaves = `You have applied for ${more_than_given_leaves} days leaves more than you have given.`;
                return sendResponse(res, 400, null, more_than_given_leaves, null);
            }

            // in between days status
            betweenDays = betweenDays.map(x => ({ 'date': x, 'status': 0 }));

            // add leave
            const leave = await LeaveModel.addLeave(employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, JSON.stringify(betweenDays), organization_id, status);
            if (!leave) return sendResponse(res, 400, null, translate(leaveMessages, "4", language), null);

            return sendResponse(res, 200, { leave: { leave_id: leave.insertId || null, ...value, number_of_days, timezone }, }, translate(leaveMessages, "3", language), null)
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "5", language), err);
        }
    }
    // createLeave = async (req, res) => {
    //     const { organization_id, language, timezone } = req.decoded;
    //     try {
    //         let { value, error } = LeaveValidation.addLeave(req.body);
    //         if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);
    //         const { employee_id, day_type, leave_type, start_date, end_date, reason } = value;
    //         const number_of_days = moment(end_date).diff(moment(start_date), 'days') + 1,
    //             start = moment().startOf('year').format('YYYY-MM-DD'),
    //             end = moment().endOf('year').format('YYYY-MM-DD'),
    //             leave_types = await LeaveModel.getLeaveTypes(leave_type, organization_id),
    //             employee_leaves = await LeaveModel.getEmployeeAnnualLeaves(employee_id, leave_type, start, end, organization_id);

    //         let carry_forward = (leave_types[0].carry_forward == 1 ? Math.ceil((new Date().getMonth() + 1) / annualLeaveTypes[leave_types[0].duration]) : 1);
    //         if (number_of_days > (leave_types[0].number_of_days * carry_forward)) return sendResponse(res, 400, null, translate(leaveMessages, "31", language), null);

    //         const leaves = employee_leaves.find(x => x.leave_type == leave_type && (x.total_applied + number_of_days) > (x.leave_type_duration * carry_forward));
    //         if (leaves) return sendResponse(res, 400, null, translate(leaveMessages, "31", language), null);

    //         const leave_exist = await LeaveModel.getEmployeeLeavesById(employee_id, start, end, organization_id);
    //         if (leave_exist) {
    //             let range = this.dateRange(new Date(start_date), new Date(end_date));
    //             range = range.map(date => date.toISOString().slice(0, 10));
    //             range.map(date => {
    //                 leave_exist.map(x => {
    //                     const day_exist = this.checkDateRange(new Date(x.start_date), new Date(x.end_date), new Date(date));
    //                     if (day_exist) return sendResponse(res, 400, null, translate(leaveMessages, "32", language), null);
    //                 });
    //             });
    //         }
    //         let betweenDays = getDates(start_date, end_date);
    //         betweenDays = betweenDays.map(x => ({ 'date': x, 'status': 0 }));
    //         const leave = await LeaveModel.addLeave(employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, JSON.stringify(betweenDays), organization_id);
    //         if (!leave) return sendResponse(res, 400, null, translate(leaveMessages, "4", language), null);

    //         return sendResponse(res, 200, { leave: { leave_id: leave.insertId || null, ...value, number_of_days, timezone }, }, translate(leaveMessages, "3", language), null)
    //     } catch (err) {
    //         return sendResponse(res, 400, null, translate(leaveMessages, "5", language), err);
    //     }
    // }

    /**
    * Get leave
    *
    * @function getLeave
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getLeave(req, res) {
        let { employee_id, is_employee, is_admin, organization_id, language, timezone } = req.decoded;
        try {
            let { leave_id } = req.query;
            if (leave_id) {
                const leaveId = await LeaveModel.checkLeaveById(leave_id, organization_id);
                if (leaveId.length == 0) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);
            }
            let leaves = await LeaveModel.getLeaves(leave_id, employee_id, is_employee, is_admin, organization_id);
            if (leaves.length > 0) return sendResponse(res, 200, { leaves, timezone }, translate(leaveMessages, "7", language), null);

            return sendResponse(res, 400, null, translate(leaveMessages, "8", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "9", language), err);
        }
    }

    /**
    * Get leave by Month
    *
    * @function getLeaveByMonth
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getLeaveByMonth(req, res) {
        let { organization_id, language, timezone } = req.decoded;
        try {
            const { start_date, end_date } = req.query;
            const leaves = await LeaveModel.getLeaveByMonth(start_date, end_date, organization_id);
            if (leaves.length == 0) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);

            return sendResponse(res, 200, leaves, translate(leaveMessages, "8", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "9", language), err);
        }
    }

    /**
    * Updated leave
    *
    * @function updateLeave
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateLeave(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            // validation
            let { value, error } = LeaveValidation.updateLeave(req.body);
            if (error) return sendResponse(res, 404, null, translate(leaveMessages, "2", language), error.details[0].message);

            // data after validation
            let { leave_id, employee_id, day_type, leave_type, start_date, end_date, reason, status } = value;
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');

            if ([1, 3].includes(day_type) && !moment(start_date).isSame(end_date)) return sendResponse(res, 400, null, "If leave applied for First/Second Half then dates should be same!", null);

            // data from leave_id 
            const [leave] = await LeaveModel.checkLeaveById(leave_id, organization_id);
            if (!leave) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);
            if (day_type == leave.day_type && start_date == moment(leave.start_date).format('YYYY-MM-DD') && end_date == moment(leave.end_date).format('YYYY-MM-DD')) return sendResponse(res, 400, null, 'You are Applying for same days.', null);

            // calculate no of days excluding holidays and week-off
            let betweenDays = await filterLeavesDates({ start_date, end_date, organization_id, employee_id }),
                number_of_days = (day_type == 1 || day_type == 3) ? betweenDays.length - 0.5 : betweenDays.length;

            // number_of_days <= 0 means employee has applied for holidays/week-off
            if (number_of_days <= 0) return sendResponse(res, 400, null, 'You can not apply for leave in week-off/holidays.', null);

            // getting leaves details from a function
            let { total_org_leaves, total_annual_applied_except, overridden_leaves } = await getRemainingLeaves(leave_type, employee_id, organization_id, leave_id);

            // remaining leaves
            let remaining_org_leaves = (total_org_leaves - total_annual_applied_except) > 0 ? (total_org_leaves - total_annual_applied_except) : 0;

            // check if the no of leaves greater than all allocated leaves to an employee (organization leaves + overridden leaves)
            if (number_of_days > (remaining_org_leaves + overridden_leaves)) {
                let more_than_given_leaves = remaining_org_leaves < 0 ? number_of_days : number_of_days - (remaining_org_leaves + overridden_leaves);
                more_than_given_leaves = `You have applied for ${more_than_given_leaves} days leaves more than you have given.`;
                return sendResponse(res, 400, null, more_than_given_leaves, null);
            }

            // between days 
            betweenDays = betweenDays.map(x => ({ 'date': x, 'status': 0 }));

            // update leave
            const updateLeave = await LeaveModel.updateLeave(leave_id, employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, JSON.stringify(betweenDays), status, organization_id);
            if (updateLeave.affectedRows !== 0) return sendResponse(res, 200, { leave: { leave_id: leave_id || null, ...value, number_of_days } }, translate(leaveMessages, "10", language), null);

            // returning response
            return sendResponse(res, 400, null, translate(leaveMessages, "11", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "12", language), err);
        }
    }
    // async updateLeave(req, res) {
    //     const { organization_id, language } = req.decoded;
    //     try {
    //         let { value, error } = LeaveValidation.updateLeave(req.body);
    //         if (error) return sendResponse(res, 404, null, translate(leaveMessages, "2", language), error.details[0].message);

    //         const { leave_id, employee_id, day_type, leave_type, start_date, end_date, reason, status } = value;
    //         const leaveId = await LeaveModel.checkLeaveById(leave_id, organization_id);
    //         if (leaveId.length == 0) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);

    //         const number_of_days = moment(end_date).diff(moment(start_date), 'days') + 1,
    //             start = moment().startOf('year').format('YYYY-MM-DD'),
    //             end = moment().endOf('year').format('YYYY-MM-DD'),
    //             leave_types = await LeaveModel.getLeaveTypes(leave_type, organization_id),
    //             employee_leaves = await LeaveModel.getEmployeeAnnualLeavesExept(leave_id, employee_id, leave_type, start, end, organization_id);
    //         let carry_forward = (leave_types[0].carry_forward == 1 ? Math.ceil((new Date().getMonth() + 1) / annualLeaveTypes[leave_types[0].duration]) : 1);
    //         const leaves = employee_leaves.find(x => x.leave_type == leave_type && (x.total_applied + number_of_days) > (x.leave_type_duration * carry_forward));
    //         if (leaves) return sendResponse(res, 400, null, translate(leaveMessages, "31", language), null);

    //         let betweenDays = getDates(start_date, end_date);
    //         betweenDays = betweenDays.map(x => ({ 'date': x, 'status': 0 }));
    //         const leave = await LeaveModel.updateLeave(leave_id, employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, JSON.stringify(betweenDays), status, organization_id);
    //         if (leave.affectedRows !== 0) {
    //             return sendResponse(res, 200, {
    //                 leave: {
    //                     leave_id: leave_id || null,
    //                     ...value, number_of_days
    //                 },
    //             }, translate(leaveMessages, "10", language), null);
    //         }
    //         return sendResponse(res, 400, null, translate(leaveMessages, "11", language), null);
    //     } catch (err) {
    //         return sendResponse(res, 400, null, translate(leaveMessages, "12", language), err);
    //     }
    // }


    /**
    * Update leave status
    *
    * @function updateLeaveStatus
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateLeaveStatus(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { leave_id, status } = req.body;
            const leave = await LeaveModel.updateLeaveStatus(leave_id, status, organization_id);
            if (leave.affectedRows !== 0) return sendResponse(res, 200, {}, translate(leaveMessages, "10", language), null);

            return sendResponse(res, 400, null, translate(leaveMessages, "11", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "12", language), err);
        }
    }

    /**
    * Delete leave
    *
    * @function deleteLeave
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} deleted list or error
    */
    async deleteLeave(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { leave_id } = req.body;
            const leave = await LeaveModel.checkLeaveById(leave_id, organization_id);
            if (leave.length == 0) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);

            let leaves = await LeaveModel.deleteLeave(leave_id, organization_id);
            if (leaves.affectedRows !== 0) return sendResponse(res, 200, [], translate(leaveMessages, "13", language), null);
            return sendResponse(res, 400, null, translate(leaveMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "15", language), null);
        }
    }

    /**
    * Get leave types
    *
    * @function getLeaveTypes
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getLeaveTypes(req, res) {
        let { organization_id, language } = req.decoded;
        let { leave_id } = req.query;
        try {
            let leaves = await LeaveModel.getLeaveTypes(leave_id, organization_id);
            if (leaves.length > 0) return sendResponse(res, 200, leaves, translate(leaveMessages, "16", language), null);

            return sendResponse(res, 400, null, translate(leaveMessages, "17", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "18", language), err);
        }
    }

    /**
    * Create Leave type
    *
    * @function createLeaveType
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} created list or error
    */
    async createLeaveType(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = LeaveValidation.createLeaveType(req.body);
            if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);

            const { name, duration, number_of_days, carry_forward } = value;
            const leaveName = await LeaveModel.checkLeaveTypeByName(name, organization_id);
            if (leaveName.length > 0) return sendResponse(res, 400, null, translate(leaveMessages, "22", language), null);

            let leaves = await LeaveModel.createLeaveType(name, duration, number_of_days, carry_forward, organization_id);
            if (leaves.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    leave_id: leaves.insertId || null,
                    ...value
                }, translate(leaveMessages, "19", language), null);
            }

            return sendResponse(res, 400, null, translate(leaveMessages, "20", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "21", language), err);
        }
    }

    /**
    * Updated leave type
    *
    * @function updateLeaveType
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateLeaveType(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = LeaveValidation.updateLeaveType(req.body);
            if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);

            const { leave_id, name, duration, number_of_days, carry_forward } = value;
            let leaves = await LeaveModel.updateLeaveType(leave_id, name, duration, number_of_days, carry_forward, organization_id);
            if (leaves.affectedRows !== 0) return sendResponse(res, 200, { leave_id: leave_id || null, ...value }, translate(leaveMessages, "25", language), null);

            return sendResponse(res, 400, null, translate(leaveMessages, "26", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "27", language), err);
        }
    }

    /**
    * Delete leave type
    *
    * @function deleleLeaveType
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} deleted list or error
    */
    async deleleLeaveType(req, res) {
        let { organization_id, language } = req.decoded;
        let { leave_id } = req.body;
        try {
            let leaves = await LeaveModel.deleleLeaveType(leave_id, organization_id);
            if (leaves.affectedRows !== 0) return sendResponse(res, 200, leaves, translate(leaveMessages, "28", language), null);

            return sendResponse(res, 400, null, translate(leaveMessages, "29", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "30", language), err);
        }
    }

    async lossOfPay(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            const { LOP, verify = 0 } = req.body;

            let employeeIDs = LOP.map(x => x.employee_id);
            let year = LOP[0].year;
            let month = LOP[0].month;

            let existsEmployees = await LeaveModel.getEmployeeExists(employeeIDs, month, year, organization_id)

            let lossOfPay = null;
            let payroll_lop = [];
            for (let data of LOP) {
                if (existsEmployees && existsEmployees.some(e => e.employee_id == data.employee_id)) {
                    const employeeObj = existsEmployees.find(e => e.employee_id == data.employee_id);
                    // if existing data has changes then update
                    if (
                        +employeeObj.total != +data.total ||
                        +employeeObj.working != +data.working ||
                        +employeeObj.present != +data.present ||
                        +employeeObj.lop != +data.lop
                    ) {
                        await LeaveModel.LossOfPay(data.total, data.working, data.present, data.lop, data.employee_id, data.month, data.year, organization_id);
                    }
                } else {
                    payroll_lop.push([data.employee_id, data.lop, data.present, data.working, data.total, data.month, data.year, organization_id]);
                }
            }

            if (payroll_lop.length) lossOfPay = await LeaveModel.updateLossOfPay(payroll_lop);
            if (+verify == 1) return sendResponse(res, 200, [], "Attendance Re-Verified Successfully", null);
            if (!+verify || (lossOfPay && lossOfPay.affectedRows !== 0)) return sendResponse(res, 200, lossOfPay, "Verified Successfully", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "27", language), err);
        }
    }

    /**
    * Get leave by status
    *
    * @function getLeaveByStatus
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getLeaveByStatus(req, res) {
        let { employee_id, is_employee, role_id, is_manager, is_teamlead, organization_id, language } = req.decoded;
        try {
            let { status, month } = req.query,
                to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            /** Validating month */
            if (month) month = moment(month).format("YYYY-MM%");

            const leaves = await LeaveModel.getLeaveByStatus(status, employee_id, is_employee, organization_id, to_assigned_id, role_id, month);

            return !leaves.length ? sendResponse(res, 400, null, translate(leaveMessages, "6", language), null) : sendResponse(res, 200, leaves, translate(leaveMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "9", language), err);
        }
    }

    /**
    * Get leave details
    *
    * @function getLeaveDetails
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} requested list or error
    */
    async getLeaveDetails(req, res) {
        let { employee_id, is_employee, organization_id, language } = req.decoded;
        try {
            const { leave_id } = req.query,
                leaves = await LeaveModel.getLeaveDetails(leave_id, organization_id);
            if (leaves.length == 0) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);

            leaves[0].day_status = leaves[0].day_status ? JSON.parse(leaves[0].day_status) : null;
            return sendResponse(res, 200, leaves, translate(leaveMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "9", language), err);
        }
    }

    async fetchLeave(req, res) {
        let { employee_id,  organization_id, startDate, endDate } = req.body;
        try {
           
            const leaves = await LeaveModel.getFieldLeaves( employee_id, true, organization_id, null, null, startDate, endDate);
            if (!leaves.length) return sendResponse(res, 400, null, "No Leaves found", null)
           
            let pending,approved,rejected;
            leaves.map(i => {     
                pending = 0, approved = 0, rejected = 0    
               let leaveDetails = JSON.parse(i.day_status)
                leaveDetails.forEach(x => {
                    if(x.status == 0) pending++;
                    if(x.status == 1 ) approved++;
                    if(x.status == 2 ) rejected++;
                })
                i.leave_status = {pending_leaves:pending,approved_leaves:approved,rejected_leaves:rejected}
                return i;
            })
            return  sendResponse(res, 200, leaves, "leaves fetched successfully", null);
        } catch (err) {
            return sendResponse(res, 400, null, "something went wrong", err);
        }
    }

    async getFieldLeaveTypes(req, res) {
        let { organization_id, language } = req.body;
        try {
            const leave_id = null;
            let leaves = await LeaveModel.getLeaveTypes(leave_id, organization_id);
            if (leaves.length > 0) return sendResponse(res, 200, leaves, translate(leaveMessages, "16", language), null);
            return sendResponse(res, 400, null, translate(leaveMessages, "17", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "18", language), err);
        }
    }

    async createFieldLeave(req, res){
        let { organization_id, language, timezone, employee_id, day_type, leave_type, start_date, end_date, reason } = req.body;
        try {
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');
            if ([1, 3].includes(day_type) && !moment(start_date).isSame(end_date)) return sendResponse(res, 400, null, "If leave applied for First/Second Half then dates should be same!", null);
            // if leave already exists for that day
            const leaveExists = await LeaveModel.leaveExists(organization_id, employee_id, moment(start_date).format('YYYY-MM-'), moment(end_date).format('YYYY-MM-'));
            if (leaveExists.length > 0) {
                let existingLeaves = [], applyingFor = getDates(start_date, end_date);
                leaveExists.forEach(x => {
                    let dates = getDates(moment(x.start_date).format('YYYY-MM-DD'), moment(x.end_date).format('YYYY-MM-DD'));
                    existingLeaves.push(...dates);
                });
                if (existingLeaves.find(i => applyingFor.includes(i))) return sendResponse(res, 400, null, translate(leaveMessages, "32", language), null);
            }
            // calculate no of days excluding holidays and week-off
            let betweenDays = await filterLeavesDates({ start_date, end_date, organization_id, employee_id }),
                number_of_days = (day_type == 1 || day_type == 3) ? betweenDays.length - 0.5 : betweenDays.length;
            // number_of_days <= 0 means employee has applied for holidays/week-off
            if (number_of_days <= 0) return sendResponse(res, 400, null, 'You can not apply for leave in week-off/holidays.', null);
            // getting remaining leaves 
            let { total_org_leaves, total_annual_applied, overridden_leaves } = await getRemainingLeaves(leave_type, employee_id, organization_id);
            // remaining leaves
            let remaining_org_leaves = (total_org_leaves - total_annual_applied) > 0 ? (total_org_leaves - total_annual_applied) : 0;
            // check if the no of leaves greater than all allocated leaves to an employee (organization leaves + overridden leaves)
            if (number_of_days > (remaining_org_leaves + overridden_leaves)) {
                let more_than_given_leaves = remaining_org_leaves < 0 ? number_of_days : number_of_days - (remaining_org_leaves + overridden_leaves);
                more_than_given_leaves = `You have applied for ${more_than_given_leaves} days leaves more than you have given.`;
                return sendResponse(res, 400, null, more_than_given_leaves, null);
            }
            // in between days status
            betweenDays = betweenDays.map(x => ({ 'date': x, 'status': 0 }));
            // add leave
            const status = 0;
            const leave = await LeaveModel.addLeave(employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, JSON.stringify(betweenDays), organization_id, status);
            if (!leave) return sendResponse(res, 400, null, translate(leaveMessages, "4", language), null);
            return sendResponse(res, 200, { leave: { leave_id: leave.insertId || null, number_of_days, timezone }, }, translate(leaveMessages, "3", language), null)
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "5", language), err);
        }
    }
    async updateFieldLeave(req, res) {
        let { organization_id, language, leave_id, employee_id, day_type, leave_type, start_date, end_date, reason } = req.body;
        try {
            // data after validation
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');
            if ([1, 3].includes(day_type) && !moment(start_date).isSame(end_date)) return sendResponse(res, 400, null, "If leave applied for First/Second Half then dates should be same!", null);
            // data from leave_id 
            const [leave] = await LeaveModel.checkLeaveById(leave_id, organization_id);
            if (!leave) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);
            if (reason == leave.reason && leave_type == leave.leave_type && day_type == leave.day_type && start_date == moment(leave.start_date).format('YYYY-MM-DD') && end_date == moment(leave.end_date).format('YYYY-MM-DD'))
            {
                return sendResponse(res, 400, null, 'You are Applying for same days', null);
            } 
            // calculate no of days excluding holidays and week-off
            let betweenDays = await filterLeavesDates({ start_date, end_date, organization_id, employee_id }),
                number_of_days = (day_type == 1 || day_type == 3) ? betweenDays.length - 0.5 : betweenDays.length;
            // number_of_days <= 0 means employee has applied for holidays/week-off
            if (number_of_days <= 0) return sendResponse(res, 400, null, 'You can not apply for leave in week-off/holidays.', null);
            // getting leaves details from a function
            let { total_org_leaves, total_annual_applied_except, overridden_leaves } = await getRemainingLeaves(leave_type, employee_id, organization_id, leave_id);
            // remaining leaves
            let remaining_org_leaves = (total_org_leaves - total_annual_applied_except) > 0 ? (total_org_leaves - total_annual_applied_except) : 0;
            // check if the no of leaves greater than all allocated leaves to an employee (organization leaves + overridden leaves)
            if (number_of_days > (remaining_org_leaves + overridden_leaves)) {
                let more_than_given_leaves = remaining_org_leaves < 0 ? number_of_days : number_of_days - (remaining_org_leaves + overridden_leaves);
                more_than_given_leaves = `You have applied for ${more_than_given_leaves} days leaves more than you have given.`;
                return sendResponse(res, 400, null, more_than_given_leaves, null);
            }
            // between days 
            betweenDays = betweenDays.map(x => ({ 'date': x, 'status': 0 }));
            const status = 0;
            // update leave
            const updateLeave = await LeaveModel.updateLeave(leave_id, employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, JSON.stringify(betweenDays), status, organization_id);
            if (updateLeave.affectedRows !== 0) return sendResponse(res, 200, { leave: { leave_id: leave_id || null, number_of_days } }, translate(leaveMessages, "10", language), null);
            // returning response
            return sendResponse(res, 400, null, translate(leaveMessages, "11", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "12", language), err);
        }
    }
    async deleteFieldLeave(req, res) {
        let { organization_id, language, leave_id } = req.body;
        try {
            const leave = await LeaveModel.checkLeaveById(leave_id, organization_id);
            if (leave.length == 0) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);
            let leaves = await LeaveModel.deleteLeave(leave_id, organization_id);
            if (leaves.affectedRows !== 0) return sendResponse(res, 200, [], translate(leaveMessages, "13", language), null);
            return sendResponse(res, 400, null, translate(leaveMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "15", language), null);
        }
    }

    /**
    * Approve or Reject Leaves
    *
    * @function approveRejectLeave
    * @memberof  LeaveController
    * @param {*} req
    * @param {*} res
    * @returns {object} Update list or error
    */
    async approveRejectLeave(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            // validation
            let { value, error } = LeaveValidation.approveRejectLeave(req.body);
            if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);

            // data after validation
            let { leave_id, approved, type } = value;

            // get leave data
            let [getLeave] = await LeaveModel.getLeaveDayStatus(leave_id, organization_id);
            if (!getLeave) return sendResponse(res, 400, null, translate(leaveMessages, "6", language), null);

            // if employee demand unpaid leaves
            let unpaid = getLeave.status == 3 ? 3 : null;

            // getting leaves for the employee
            let { total_org_leaves, total_annual_accepted_except, overridden_leaves, overridden_data } = await getRemainingLeaves(getLeave.leave_type, getLeave.employee_id, organization_id, leave_id);

            // total available leaves for the employee
            let total_available_leaves = (total_org_leaves + overridden_leaves) > total_annual_accepted_except ? (total_org_leaves + overridden_leaves) - total_annual_accepted_except : 0;

            // dates from validation
            approved = approved.map(x => moment(x).format('YYYY-MM-DD'));

            // mapping and calculating leaves taken
            let leaves_taking = 0;
            if (getLeave.day_status != null) {
                getLeave.day_status = JSON.parse(getLeave.day_status)
                getLeave.day_status = getLeave.day_status.map(x => {
                    approved.map(y => {
                        if (x.date == y) {
                            //if (total_available_leaves <= 0 && type == 1) x.unpaid = true;
                            if (unpaid) x.unpaid = true;
                            if (type == 1) getLeave.day_type == 1 || getLeave.day_type == 3 ? (total_available_leaves -= 0.5, leaves_taking += 0.5) : (total_available_leaves -= 1, leaves_taking += 1);
                            x.status = type;
                        }
                    });
                    return x;
                });
            }

            // calculation for overridden leaves
            if (!unpaid && total_org_leaves < (total_annual_accepted_except + leaves_taking) && overridden_leaves > 0) {
                let total_org_available = total_org_leaves > total_annual_accepted_except ? total_org_leaves - total_annual_accepted_except : 0;
                let difference = (total_org_available + overridden_leaves) > leaves_taking ? (total_org_available + overridden_leaves) - leaves_taking : 0;
                let index = overridden_data.findIndex(x => x.leave_id == getLeave.leave_type);
                if (index >= 0) {
                    overridden_data[index].no_of_leaves = difference;
                    let update_overridden_leave = await LeaveModel.updateEmployeeLeave([JSON.stringify(overridden_data), getLeave.employee_id]);
                    if (!update_overridden_leave.affectedRows) return sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", null);
                }
            }

            // sorting and updating leaves
            getLeave.day_status.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

            // updated leaves
            let leaveDetails = await LeaveModel.updateLeaveDayStatus(leave_id, unpaid || type, JSON.stringify(getLeave.day_status), organization_id);

            // sending response
            if (leaveDetails.affectedRows !== 0) return sendResponse(res, 200, {}, "Status Updated Successfully", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(leaveMessages, "27", language), err);
        }
    }
    // async approveRejectLeave(req, res) {
    //     let { organization_id, language } = req.decoded;
    //     try {
    //         let { leave_id, approved, type } = req.body;

    //         let getLeave = await LeaveModel.getLeaveDayStatus(leave_id, organization_id);
    //         approved = approved.map(x => ({ "date": x, "status": type }));
    //         if (getLeave[0].day_status != null) {
    //             getLeave = JSON.parse(getLeave[0].day_status)
    //             getLeave = getLeave.map(x => {
    //                 approved.map(y => {
    //                     if (x.date == y.date) x.status = y.status;
    //                 });
    //                 return x;
    //             });
    //         }
    //         getLeave.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    //         let leavDetails = await LeaveModel.updateLeaveDayStatus(leave_id, type, JSON.stringify(getLeave), organization_id);
    //         if (leavDetails.affectedRows !== 0) return sendResponse(res, 200, {}, "Status Updated Successfully", null);
    //     } catch (err) {
    //         return sendResponse(res, 400, null, translate(leaveMessages, "27", language), err);
    //     }
    // }


    /**
     * get Leaves Overridden 
     * @param {*} req 
     * @param {*} res 
     * @returns
     * @author Akshay Dhood 
     */
    async getLeaveOverride(req, res) {
        const { organization_id, is_manager, is_teamlead, employee_id: loginEmployeeId, role_id, language } = req.decoded;
        try {
            const { value, error } = LeaveValidation.getLeaveOverride(req.query);
            if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);

            let { name, skip, limit, employee_id } = value;
            let is_assigned_to = is_manager || is_teamlead ? loginEmployeeId : null;
            employee_id = loginEmployeeId && !is_assigned_to ? loginEmployeeId : employee_id;
            let [employee_data, [{ total_count }], leave_types, applied_leaves] = await Promise.all([
                LeaveModel.getEmployeeDetails({ organization_id, employee_id, is_assigned_to, role_id, skip, limit, name }),
                LeaveModel.employeeCount({ organization_id, is_assigned_to, role_id }),
                LeaveModel.getLeaveTypes(null, organization_id),
                LeaveModel.getAppliedLeaves(organization_id, employee_id, momentPack().format('YYYY'), is_assigned_to, role_id)
            ]);

            if (!employee_data.length) return sendResponse(res, 400, null, "No Data Found.", null);

            employee_data = employee_data.map(item => {
                let date_of_joining = item.date_join;
                delete item.employee_details_id;
                delete item.date_join;
                item.total_count = total_count;
                let extra_leaves = item.leaves ? JSON.parse(item.leaves) : [];

                item.leaves = leave_types.map(leave => {

                    // 1-Yearly, 2-Half-Yearly, 3-Quarterly, 4-Monthly
                    let non_cf_month = null;
                    if (!leave?.carry_forward) {
                        let current_month = +moment().format("MM");
                        switch (+leave?.duration) {
                            case 2:
                                non_cf_month = current_month > 6 ? 6 : 0;
                                break;
                            case 3:
                                non_cf_month = +moment().startOf('quarter').format('MM') - 1;
                                break;
                            case 4:
                                non_cf_month = current_month;
                                break;
                        }
                    }

                    let accepted_leaves = 0,
                        pending_leaves = 0,
                        no_of_leaves = extra_leaves.find(z => z.leave_id == leave.id)?.no_of_leaves || 0,
                        number_of_days = getOrgLeaves({ date_of_joining, leave_type: leave });

                    applied_leaves
                        .filter(z => z.employee_id == item.employee_id && z.leave_id == leave.id)
                        .forEach(taken => {
                            let day_status = taken.day_status && taken.status != 3 ? JSON.parse(taken.day_status) : [];
                            if (non_cf_month) day_status = day_status.filter(x => +leave?.duration == 4 ? (+moment(x.date).format("MM") == non_cf_month) : (+moment(x.date).format("MM") > non_cf_month));
                            day_status.forEach(z => {
                                if (!z.unpaid && (z.status == 1))
                                    accepted_leaves += taken.day_type == 1 || taken.day_type == 3 ? 0.5 : 1;
                                else if (!z.unpaid && (z.status == 0))
                                    pending_leaves += taken.day_type == 1 || taken.day_type == 3 ? 0.5 : 1;
                            });
                        });

                    let organization_leave = number_of_days > accepted_leaves ? number_of_days - accepted_leaves : 0;
                    let total_leaves = ((organization_leave + no_of_leaves) - pending_leaves) > 0 ? ((organization_leave + no_of_leaves) - pending_leaves) : 0;

                    return {
                        leave_id: leave.id,
                        leave_name: leave.name,
                        no_of_leaves,
                        organization_leave,
                        total_leaves
                    };
                });
                return item;
            });

            return sendResponse(res, 200, employee_data, "Employee Leaves Fetched Successfully", null);
        } catch (err) {
            return sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", err);
        }
    }

    /**
     * Update Leaves for employees
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood
     */
    async addLeaveOverride(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = LeaveValidation.addLeaveOverride(req.body);
            if (error) return sendResponse(res, 400, null, translate(leaveMessages, "2", language), error.details[0].message);
            
            let { employee_id, leaves } = value;
            let [employee_data] = await LeaveModel.getEmployeeDetails({ employee_id, organization_id });
           
            if (!employee_data) return sendResponse(res, 400, null, "Wrong Employee ID", null);
           
            leaves = leaves.map(x => {
                x.no_of_leaves = calculation(x.no_of_leaves);
                return x ;
            });
             leaves = JSON.stringify(leaves);
            if (!employee_data.employee_details_id) {
                let data = await LeaveModel.insertEmployeeLeaves([employee_id, organization_id, leaves]);
                return data.insertId ? sendResponse(res, 200, { id: data.insertId, ...value }, "Leaves Added Successfully", null) : sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", null);
            } else {
                let data = await LeaveModel.updateEmployeeLeave([leaves, employee_id]);
                 return data.affectedRows ? sendResponse(res, 200, null, "Leaves Updated Successfully", null) : sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", null);
           }
        } catch (err) {
           return sendResponse(res, 400, null, 'SOMETHING_WENT_WRONG', err);
        }
    }
}

function getDates(startDate, stopDate) {
    let dates = [];
    for (let m = momentPack(momentPack(startDate)); m.diff(momentPack(stopDate), 'days') <= 0; m.add(1, 'days')) {
        dates.push(m.format('YYYY-MM-DD'));
    }
    return dates;
}



/**
 * calculation for remaining leaves and overridden leaves
 * ! Used in attendance modules, Please make changes accordingly.
 * @param {*} leave_type 
 * @param {*} employee_id 
 * @param {*} organization_id 
 * @param {*} leave_id 
 * @returns total_org_leaves, total_annual_applied, total_annual_accepted, total_annual_applied_except, total_annual_accepted_except, overridden_leaves, overridden_data
 * @author Akshay Dhood
 */
async function getRemainingLeaves(leave_type, employee_id, organization_id, leave_id = null, date = null) {
    try {
        const year = moment().format('YYYY');
        date = date ? moment(date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");

        // getting data from db
        let [[leave_types], [employee_data]] = await Promise.all([
            LeaveModel.getLeaveTypes(leave_type, organization_id),
            LeaveModel.getEmployeeDetails({ employee_id, organization_id }),
        ]);

        // leave_types.duration = 1-Yearly, 2-Half-Yearly, 3-Quarterly, 4-Monthly
        let non_cf_month = null;
        if (!leave_types?.carry_forward) {
            let current_month = +moment(date).format("MM");
            switch (+leave_types?.duration) {
                case 2:
                    non_cf_month = current_month > 6 ? 6 : 0;
                    break;
                case 3:
                    non_cf_month = +moment().startOf('quarter').format('MM') - 1;
                    break;
                case 4:
                    non_cf_month = current_month;
                    break;
            }
        }

        // annual leaves except the leave with id given && if employee applied leaves then no of leaves or 0
        let total_annual_applied_except = 0;
        let total_annual_accepted_except = 0;
        let total_annual_applied = 0;
        let total_annual_accepted = 0;
        if (leave_id) {
            let leaves_except = await LeaveModel.annualLeavesOfEmployee(organization_id, year, employee_id, leave_type, leave_id);
            leaves_except.forEach(element => {
                let day_status = element.day_status && element.status != 3 ? JSON.parse(element.day_status) : [];
                if (non_cf_month) day_status = day_status.filter(x => +leave_types?.duration == 4 ? (+moment(x.date).format("MM") == non_cf_month) : (+moment(x.date).format("MM") > non_cf_month));
                day_status.forEach(x => {
                    if (x.status == 1 && !x.unpaid) element.day_type == 1 || element.day_type == 3 ? total_annual_accepted_except += 0.5 : ++total_annual_accepted_except;
                    if ((x.status == 1 || x.status == 0) && !x.unpaid) element.day_type == 1 || element.day_type == 3 ? total_annual_applied_except += 0.5 : ++total_annual_applied_except;
                });
            });
        }
        else {
            let annual_leaves = await LeaveModel.annualLeavesOfEmployee(organization_id, year, employee_id, leave_type);
            if (annual_leaves.length > 0) {
                annual_leaves.forEach(element => {
                    let day_status = element.day_status && element.status != 3 ? JSON.parse(element.day_status) : [];
                    if (non_cf_month) day_status = day_status.filter(x => +leave_types?.duration == 4 ? (+moment(x.date).format("MM") == non_cf_month) : (+moment(x.date).format("MM") > non_cf_month));
                    day_status.forEach(x => {
                        if (x.status == 1 && !x.unpaid) element.day_type == 1 || element.day_type == 3 ? total_annual_accepted += 0.5 : ++total_annual_accepted;
                        if ((x.status == 1 || x.status == 0) && !x.unpaid) element.day_type == 1 || element.day_type == 3 ? total_annual_applied += 0.5 : ++total_annual_applied;
                    });
                });
            }
        }

        // total organization leaves
        let total_org_leaves = getOrgLeaves({ date_of_joining: employee_data.date_join, leave_type: leave_types });

        // overridden leaves of that employee
        let overridden_data = employee_data.leaves ? JSON.parse(employee_data.leaves) : [];
        let overridden_leaves = overridden_data.find(x => x.leave_id == leave_type);
        overridden_leaves = overridden_leaves && overridden_leaves.no_of_leaves ? overridden_leaves.no_of_leaves : 0;

        return { total_org_leaves, total_annual_applied, total_annual_accepted, total_annual_applied_except, total_annual_accepted_except, overridden_leaves, overridden_data };
    } catch (err) {
        return { total_org_leaves: 0, total_annual_applied: 0, total_annual_accepted: 0, total_annual_applied_except: 0, total_annual_accepted_except: 0, overridden_leaves: 0, overridden_data: [] };
    }
}


function getOrgLeaves({ date_of_joining, leave_type }) {

    let number_of_days = leave_type.number_of_days;
    let duration = leave_type.duration;
    let carry_forward = leave_type.carry_forward;

    if (date_of_joining && moment(date_of_joining).isSame(moment(), "year")) {
        let current_month = Number(moment().format("MM"));
        let joining_month = Number(moment(date_of_joining).format("MM"));

        if (current_month < joining_month) return number_of_days;

        joining_month = joining_month - 1;
        joining_month = joining_month + Number(moment(date_of_joining).format("DD") / moment(date_of_joining).daysInMonth());
        let joining_month_temp_calc = Number(joining_month / annualLeaveTypes[duration]);
        let current_month_temp_calc = Number(current_month / annualLeaveTypes[duration]);
        current_month_temp_calc = Math.ceil(current_month_temp_calc);

        if (carry_forward == 0) {
            if (
                !moment(date_of_joining).isSame(moment(), "month") ||
                ((current_month_temp_calc - joining_month_temp_calc) > 1)
            ) return number_of_days;
        }

        let floor_value = Math.floor(joining_month_temp_calc);
        let decimal_no = joining_month_temp_calc - floor_value;

        let leave_according_joining_month = (number_of_days * floor_value) + (number_of_days * decimal_no);
        leave_according_joining_month = calculation(leave_according_joining_month);

        let leave_according_current_month = number_of_days * current_month_temp_calc;

        number_of_days = leave_according_current_month - leave_according_joining_month;
    }
    else {
        carry_forward = (carry_forward == 1 ? Math.ceil((new Date().getMonth() + 1) / annualLeaveTypes[duration]) : 1);
        number_of_days = number_of_days * carry_forward;
    }

    return number_of_days;
}



function calculation(value) {
    if (value != Math.round(value)) {
        let floor_value = Math.floor(value);
        let decimal_no = value - floor_value;
        value = decimal_no < 0.5 ? floor_value : floor_value + 0.5;
    }
    return value;
}


async function filterLeavesDates({ start_date, end_date, organization_id, employee_id }) {
    try {
        // Shifts and Holidays
        let holiday_shift = await LeaveModel.getHolidayAndShift(organization_id, employee_id),
            shiftsData = await LeaveModel.checkShifts({ organization_id, employee_id }),
            holidays = holiday_shift.map(x => moment(x.holiday_date).format('YYYY-MM-DD')),
            defaultShift = holiday_shift[0]?.data ? JSON.parse(holiday_shift[0].data) : null;

        // calculate no of days excluding holidays and week-off
        return getDates(start_date, end_date)
            .filter(x => !holidays.some(z => z == x))
            .filter(element => {
                let response = null;
                shiftsData.forEach(item => {
                    let data = JSON.parse(item.data);
                    if (moment(element).isBetween(item.start_date, item.end_date)) response = data[moment(element).format("ddd").toLowerCase()].status;
                });
                return response ?? (defaultShift ? defaultShift[moment(element).format("ddd").toLowerCase()].status : true);
            });
    } catch (error) {

        return getDates(start_date, end_date);
    }
}

module.exports = { LeaveController: new LeaveController, getRemainingLeaves };