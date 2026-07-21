const { typeOf, number } = require('mathjs');
const _ = require('underscore');
const moment = require('moment');

const { sendResponse } = require(`${utilsFolder}/myService`),
    { translate } = require(`${utilsFolder}/messageTranslation`),
    { commonMessages, locationMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`),
    OverviewValidation = require('./overview.validation'),
    { pfModel } = require('../../advancesettings/pfandesisettings/pfsettings/pf.model'),
    OverviewModel = require('./overview.model'),
    attendanceModel = require('../../../attendance/attendance.model'),
    { PfService } = require('../../advancesettings/pfandesisettings/pfsettings/pf.service'),
    PreviewHelper = require('../preview/preview.helper'),
    PreviewModal = require('../preview/preview.model'),
    PreviewService = require('../preview/preview.service'),
    { details: EmpDefaultDetails } = require('../../../bankdetail/default.payrollsettings'),
    { SettingsModel: PtModel } = require('../../advancesettings/ptsettings/settings.model'),
    RunPayrollPreviewService = require('../run-payroll/pay-register.service');


const isValidNumber = (item) => {
    let itemType = false;

    if (item) {
        itemType = typeOf(+item) == 'number' && !isNaN(+item) ? true : false;
    }
    return itemType;
}

class OverviewService {
    static async getOverview(req, res, nex) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = OverviewValidation.getOverview(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            let totalGross = 0, totalTax = 0, totalPt = 0, totalCtc = 0, totalEmployeePf = 0, totalEmployerPf = 0, totalEmployeeEsi = 0, totalEmployerEsi = 0, totalNetSalary = 0, payrollProcessedCount = 0, employeeCount = 0;
            let employeeTotalDays;

            let { date } = value;
            const startDate = moment(date).clone().startOf('month').format('YYYY-MM-DD hh:mm');
            const endDate = moment(date).clone().endOf('month').format('YYYY-MM-DD hh:mm');
            const totalMonthDays = moment(date, "YYYY-MM").daysInMonth();
            const month = moment(date).format("MM");
            const searchYear = moment(date).format("YYYY");

            const previousOverview = await OverviewModel.getPreviousOverview({ month: +month, year: searchYear, organization_id })
            if (previousOverview.length > 0) {
                let data = previousOverview[0];
                return res.json({
                    code: 200,
                    data: {
                        isOld: true,
                        employeeCount: data.total_employees,
                        payrollProcessedCount: data.processed_employees,
                        totalNetSalary: data.netpay,
                        totalEmployeeEsi: data.employee_esi,
                        totalEmployerEsi: data.employer_esi,
                        totalEmployeePf: data.employee_pf,
                        totalEmployerPf: data.employer_pf,
                        totalGross: data.gross,
                        totalPt: data.pt,
                        totalCtc: data.ctc,
                        totalTax: numToNthPrecision(data.tax, 0),
                    },
                    message: "For This Month Payroll Is Processed",
                    error: null
                })
            }

            const [OrgSettings, EmpSettings, count] = await Promise.all([
                PfService.getOrgPFSettings(organization_id),
                OverviewModel.getEmpSettings({ organization_id }),
                OverviewModel.getOrganizationEmployeesCount({ date, organization_id })
            ])
            employeeCount = count && count.length > 0 ? count[0]['total'] : 0;

            const employeeIds = [...new Set(_.pluck(EmpSettings, "employee_id"))];
            let policyIds = [...new Set(_.pluck(EmpSettings, "payroll_policy_id"))];
            policyIds = policyIds.filter(i => i != null && i)

            if (OrgSettings.length == 0 || employeeIds.length == 0 || policyIds.length == 0) {
                return res.json({
                    code: 200,
                    data: {
                        employeeCount: employeeCount || 0,
                        payrollProcessedCount: 0,
                        totalNetSalary: 0,
                        totalEmployeeEsi: 0,
                        totalEmployeePf: 0,
                        totalEmployerPf,
                        totalEmployerEsi: 0,
                        totalGross: 0,
                        totalPt,
                        totalCtc,
                        totalTax: numToNthPrecision(totalTax, 0),
                    }, message: "no data found", error: null
                })

            }

            let [empProdReports, empLeaves, attendanceHours, totalHolidays, payrollPolicies, ptLocationSettings] = await Promise.all([
                attendanceModel.getAttendance(startDate, endDate, employeeIds, organization_id),
                OverviewModel.getEmpLeaves({ organization_id, startDate, endDate }),
                OverviewModel.getOrgAttendanceHours({ organization_id }),
                OverviewModel.getOrgHolidays({ organization_id, startDate, endDate }),
                OverviewModel.getPayrollPolicy({ organization_id, policyIds }),
                PtModel.getPt({ organization_id })
            ]);

            if ((!empProdReports && empProdReports.length == 0) || (!payrollPolicies && payrollPolicies.length == 0)) {
                return res.json({
                    code: 200,
                    data: {
                        employeeCount: employeeCount || 0,
                        payrollProcessedCount: 0,
                        totalNetSalary: 0,
                        totalEmployeeEsi: 0,
                        totalEmployerEsi: 0,
                        totalEmployeePf: 0,
                        totalEmployerPf,
                        totalEmployerEsi: 0,
                        totalGross: 0,
                        totalPt,
                        totalCtc
                    }, message: "no data found", error: null
                })
            }

            attendanceHours = [{ values: 200, type: 2 }]
            attendanceHours = attendanceHours && attendanceHours.length > 0 && attendanceHours[0]['value'] ? JSON.parse(attendanceHours[0]['value']) : {};
            totalHolidays = totalHolidays && totalHolidays.length != 0 ? +totalHolidays[0]['holidays'] : 0;

            if (attendanceHours && attendanceHours.values && attendanceHours.type) {
                employeeTotalDays = employeeIds.map(item => {
                    let empData = attendanceHours.type == 1 ? empProdReports.filter(i => i.employee_id == item && i.active_time >= attendanceHours.values) : empProdReports.filter(i => i.employee_id == item && i.office_time >= attendanceHours.values)
                    return { employee_id: item, payDays: empData.length }
                })
            }
            else {
                employeeTotalDays = employeeIds.map(item => {
                    let empData = attendanceHours.type == 1 ? empProdReports.filter(i => i.employee_id == item) : empProdReports.filter(i => i.employee_id == item)
                    return { employee_id: item, payDays: empData.length }
                })
            }

            if (empLeaves && empLeaves.length) {
                employeeTotalDays = employeeTotalDays.map(i => {

                    let empLeavesData = empLeaves.filter(itr => itr.employee_id == i.employee_id)
                    let addDays = 0;
                    empLeavesData.map(x => {
                        addDays += x.day_type == 2 ? +x.number_of_days * 1 : +x.number_of_days * 0.5
                    })
                    return { ...i, payDays: +i.payDays + +addDays + +totalHolidays }
                })
            }

            employeeTotalDays = employeeTotalDays.filter(i => i.payDays != 0);
            let newEmployeeIds = _.pluck(employeeTotalDays, "employee_id")

            let employeeSalary = await PreviewService.getPreview({ organization_id });
            employeeSalary = employeeSalary.filter(i => newEmployeeIds.includes(i.employeeId))
            payrollProcessedCount = employeeSalary.length;
            for (let item of employeeSalary) {

                totalTax += item && item.tds && item.tds.taxMonthlyPayable ? (item.tds.taxMonthlyPayable != 'NaN' && typeOf(item.tds.taxMonthlyPayable) == "number" ? +item.tds.taxMonthlyPayable : 0) : 0
                totalCtc += item.ctc ? (+item.ctc / 12 || 0) : 0;
                let empPayDays = employeeTotalDays.find(i => i.employee_id == item.employeeId);
                empPayDays = empPayDays && empPayDays.payDays ? empPayDays.payDays : 0;
                let sumOfAllComponent = 0, sumOfAllDeduction = 0;
                let components = item.salaryComponents.map(i => {

                    let calculatedValue = 0, empDeductions = 0;
                    if (i.componentType == 2) {
                        empDeductions = typeOf((+i.calculatedValue)) == 'number' && !isNaN(+i.calculatedValue) ? +i.calculatedValue / 12 : 0
                    } else {
                        calculatedValue = typeOf((+i.calculatedValue)) == 'number' && !isNaN(+i.calculatedValue) ? +i.calculatedValue / 12 : 0
                    }

                    sumOfAllComponent += calculatedValue;
                    sumOfAllDeduction += empDeductions;
                    return { ...i, calculatedValue }
                })


                let empBasic = components.find(i => i.componentName.toLowerCase() == 'basic');
                empBasic = empBasic && empBasic.calculatedValue && typeOf((+empBasic.calculatedValue)) == 'number' && !isNaN(+empBasic.calculatedValue) ? +empBasic.calculatedValue / 12 : 0

                let empCtc = item.ctc && typeOf((+item.ctc)) == 'number' && !isNaN(+item.ctc) ? (item.ctc / 12) : 0;
                let specialAllowance = empCtc - sumOfAllComponent;

                let empGross = 0, empNetPay = 0;
                if (item.gross && typeOf(+item.gross) == 'number' && !isNaN(+item.gross)) {
                    empGross = +item.gross / 12;
                }

                totalGross += typeOf(+empGross) == 'number' ? +empGross : 0;

                let empSetting = EmpSettings.find(i => i.employee_id == item.employeeId);

                let empSettingObj = empSetting && empSetting.settings ? JSON.parse(empSetting.settings) : {};
                let PTLocationId = empSettingObj && empSettingObj.ptSettings && empSettingObj.ptSettings.location_id ? empSettingObj.ptSettings.location_id : null
                let empPTLocationData;

                if (PTLocationId) {
                    empPTLocationData = ptLocationSettings.find(i => i.location_id == PTLocationId)
                }
                empPTLocationData = empPTLocationData && empPTLocationData.details ? JSON.parse(empPTLocationData.details) : {};
                empPTLocationData = empPTLocationData && empPTLocationData.details ? empPTLocationData.details : [];

                let empPfData = await RunPayrollPreviewService.calculatePF({ orgSetting: OrgSettings[0], empSetting, basic: empBasic || 0, specialAllowance });
                totalEmployeePf += empPfData && empPfData.employee ? empPfData.employee : 0;
                totalEmployerPf += empPfData && empPfData.employer ? empPfData.employer : 0;

                let empEsiData = await RunPayrollPreviewService.calculateESI({ orgSetting: OrgSettings[0], empSetting, gross: empGross })
                totalEmployeeEsi += empEsiData && empEsiData.employee ? empEsiData.employee : 0;
                totalEmployerEsi += empEsiData && empEsiData.employer ? empEsiData.employer : 0;

                let empPtData = await RunPayrollPreviewService.calculatePT({ ptSetting: empPTLocationData, gross: empGross });

                totalPt += empPtData;
                empNetPay = empGross > 0 ? (empGross - (sumOfAllDeduction + totalEmployeeEsi + totalEmployeePf)) : 0
                empNetPay = empNetPay ? ((empNetPay / totalMonthDays) * empPayDays) : 0;
                totalNetSalary += empGross > 0 ? (empGross - (sumOfAllDeduction + totalEmployeeEsi + totalEmployeePf)) : 0;
            }

            totalCtc = totalCtc && typeOf(totalCtc) == 'number' ? totalCtc.toFixed(2) : totalCtc;
            let data = {
                employeeCount,
                totalTax: totalTax ? numToNthPrecision(+totalTax, 0) : totalTax,
                totalPt: totalPt ? +totalPt.toFixed(2) : totalPt,
                totalCtc: +totalCtc,
                totalNetSalary: totalNetSalary ? +totalNetSalary.toFixed(2) : totalNetSalary,
                totalEmployeeEsi: totalEmployeeEsi ? +totalEmployeeEsi.toFixed(2) : totalEmployeeEsi,
                payrollProcessedCount: payrollProcessedCount ? + payrollProcessedCount.toFixed(2) : payrollProcessedCount,
                totalEmployeePf: totalEmployeePf ? +totalEmployeePf.toFixed(2) : totalEmployeePf,
                totalEmployerPf: totalEmployerPf ? + totalEmployerPf.toFixed(2) : totalEmployerPf,
                totalEmployerEsi: totalEmployerEsi ? +totalEmployerEsi.toFixed(2) : totalEmployerEsi,
                totalGross: totalGross ? +totalGross.toFixed(2) : totalGross
            };
            return res.json({ code: 200, data, message: "success", error: null })
        } catch (err) {
            nex(err)
        }

    }

    static async getOverviewNew(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = OverviewValidation.getOverview(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            let totalGross = 0, totalTax = 0, totalPt = 0, totalCtc = 0, totalEmployeePf = 0, totalEmployerPf = 0, totalEmployeeEsi = 0, totalEmployerEsi = 0, totalNetSalary = 0, payrollProcessedCount = 0, employeeCount = 0;
            let totalPf = 0, totalEsi = 0;

            let { date } = value;
            const startDate = moment(date).clone().startOf('month').format('YYYY-MM-DD hh:mm');
            const endDate = moment(date).clone().endOf('month').format('YYYY-MM-DD hh:mm');
            const totalMonthDays = moment(date, "YYYY-MM").daysInMonth();
            const month = moment(date).format("MM");
            const searchYear = moment(date).format("YYYY");

            let [count, payoutDate, employeeSalary, previewedCount] = await Promise.all([
                OverviewModel.getOrganizationEmployeesCount({ date, organization_id }),
                OverviewModel.getPayOutDate(organization_id),
                PreviewService.getPreview({ date, organization_id, ...value }),
                PreviewService.getPreview({ date, isCount: true, organization_id, ...value })
            ])

            // condition added if not setting is applied/presents
            if (!payoutDate || !payoutDate.length) {
                return res.json({ code: 400, data: null, message: "Settings not applied", error: "Settings not applied" });
            }

            payoutDate = JSON.parse(payoutDate[0].settings);
            payoutDate = payoutDate.paycycle.to;

            employeeCount = count && count.length > 0 ? count[0]['total'] : 0;
            if (employeeSalary.length == 0) {
                return res.json({
                    code: 200,
                    data: {
                        employeeCount: employeeCount || 0,
                        payrollProcessedCount: 0,
                        payoutDate: payoutDate || 0,
                        totalNetSalary: 0,
                        totalEmployeeEsi: 0,
                        totalEmployeePf: 0,
                        totalEmployerPf,
                        totalEmployerEsi: 0,
                        totalGross: 0,
                        totalPt,
                        totalCtc,
                        totalTax: numToNthPrecision(totalTax, 0),
                        totalEsi, totalPf
                    }, message: "no data found", error: null
                })
            }

            const data = await processOverView(employeeSalary);

            return res.json({
                code: 200, data: {
                    payrollProcessedCount: previewedCount,
                    employeeCount,
                    payoutDate,
                    ...data,
                }, message: "Success", error: null
            })

        } catch (err) {
            next(err)
        }
    }
    static async getPayout(req, res, next) {
        try {
            const { organization_id, employee_id, role_id, is_manager, is_teamlead, language } = req.decoded;
            const { value, error } = OverviewValidation.getPayout(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            const { month, year, search, skip, limit, employeeId, sortColumn, sortOrder } = value;

            let to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            let [payoutData, count] = await Promise.all([
                OverviewModel.getPayout({ to_assigned_id, role_id, sortColumn, sortOrder, month, year, search, skip, limit, employeeId, organization_id }),
                OverviewModel.getPayout({ to_assigned_id, role_id, month, year, search, employeeId, organization_id, isCount: true })
            ])

            if (payoutData.length == 0) return res.json({ code: 400, data: null, message: 'No data found', error: null })
            count = count && count.length != 0 ? count[0]['totalCount'] : 0
            payoutData = payoutData.map(item => {
                let details = item.details ? JSON.parse(item.details) : {};
                details = { ...EmpDefaultDetails, ...details }
                return { ...item, details };
            })
            return res.json({ code: 200, data: { count, skipCount: (skip + limit) || 0, payoutData }, message: 'Success', error: null })
        } catch (err) {
            next(err)
        }
    }

    static async updateOverview(req, res, next) {
        try {
            let currentYear = moment().format('YYYY');
            const { organization_id, language } = req.decoded;
            const { value, error } = OverviewValidation.updateOverview({ ...req.body }, +currentYear);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            let {
                employeeCount: total_employees,
                totalTax: tax,
                totalPt: pt,
                totalCtc: ctc,
                totalNetSalary: netpay,
                totalEmployeeEsi: employee_esi,
                payrollProcessedCount: processed_employees,
                totalEmployerEsi: employer_esi,
                totalEmployeePf: employee_pf,
                totalEmployerPf: employer_pf,
                totalGross: gross,
                month,
                year
            } = value;
            tax = numToNthPrecision(tax, 0);

            const overview = await OverviewModel.getPayrollOverview({ organization_id, month, year });
            if (overview && overview.length !== 0) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Payroll overview already exists',
                    error: null
                });
            }

            await OverviewModel.addPayrollOverview({
                total_employees, pt, ctc, gross,
                netpay, employee_esi, processed_employees,
                employer_esi, employee_pf, employer_pf,
                month, year, organization_id, tax
            })

            return res.json({
                code: 200,
                data: { ...value },
                message: 'Success',
                error: null
            });

        } catch (err) {
            console.log(err, '=========error=-========');
            next(err)
        }

    }

    static async getOverviewMonths(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = OverviewValidation.getOverview(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            let { date } = value
            date = moment(date).format("YYYY");
            let currentDay = new Date().getDate();
            let currentMonth = new Date().getMonth() + 1;
            let currentYear = new Date().getFullYear();

            // let months = await OverviewModel.getOverviewMonths({ year: date, organization_id })

            let [months, [settings]] = await Promise.all([
                await OverviewModel.getOverviewMonths({ year: date, organization_id }),
                await OverviewModel.getOrganizationSettings(organization_id)
            ])
            let monthsIds = _.pluck(months, "month")
            let pendingMonths = Array(12).fill(1).map((_, i) => i + 1).filter(i => !monthsIds.includes("" + i))

            pendingMonths = pendingMonths.map(i => ({ month: "" + i, year: +date, status: 0 }))
            months = [...months, ...pendingMonths]
            settings = settings || {};
            let { payCycleEnd, payoutDate } = settings;
            payoutDate = payoutDate ? +payoutDate : 28;
            if (currentYear == date) {
                let paidMonths = months.filter(i => i.month < currentMonth);
                if (currentDay >= +payoutDate) {
                    let monthStatus = months.find(i => i.month == currentMonth);
                    if (monthStatus) paidMonths.push(monthStatus)
                }
                months = paidMonths;
            }

            months = months.sort((a, b) => +a.month - +b.month);
            let data = Array(12).fill(1).map((_, i) => i + 1).map(x => {
                let index = months.findIndex(i => +i.month == x);
                if (index >= 0) return months[index];
                else return {
                    month: x,
                    year: date,
                    status: 0
                }
            });

            // if (currentYear < date) months = [];

            return res.json({
                code: 200,
                data,
                message: "Success",
                error: null
            })

        } catch (err) {
            next(err)
        }
    }
}


const processOverView = async (employeeData) => {
    try {
        const ESIC_STR = "Employee ESIC"
        const PF_STR = 'Employee PF';
        const PT_STR = 'PT';
        const rule = 'SYS_CALC'

        let totalGross = 0, totalTax = 0, totalPt = 0, totalCtc = 0, totalEmployeePf = 0, totalEmployerPf = 0, totalEmployeeEsi = 0, totalEmployerEsi = 0, totalNetSalary = 0;
        let totalPf = 0, totalEsi = 0;

        for (let item of employeeData) {

            const { gross, ctc, netSalary, tds } = item
            let salaryComponents = item.salaryComponents ? item.salaryComponents : null

            // salaryComponents = !salaryComponents && item.details.salaryComponents ? item.details.salaryComponents : []

            if (!item.isSalaryHold) {
                totalGross += isValidNumber(gross) ? +gross : 0;
                totalCtc += isValidNumber(ctc) ? +ctc : 0;
                totalNetSalary += isValidNumber(netSalary) ? +netSalary : 0;
            }
            // else {

            //     let salaryHoldDetails = await PreviewModal.getEmployeeSalaryHoldData({ employee_id: item.employeeId })

            //     salaryHoldDetails.map(data => {
            //         if (data) {
            //             // data.details = JSON.parse(data)
            //             totalGross += isValidNumber(data.gross) ? +data.gross : 0;
            //             totalCtc += isValidNumber(data.ctc) ? +data.ctc : 0;
            //             totalNetSalary += isValidNumber(data.netSalary) ? +data.netSalary : 0;
            //         }
            //     })
            // }

            totalTax += isValidNumber(tds) ? numToNthPrecision(+tds, 0) : 0;

            if (!salaryComponents || salaryComponents.length == 0) continue;
            const empPt = findComponent(PT_STR, rule, salaryComponents);
            if (empPt) {
                const { calculatedValue: PT } = empPt
                totalPt += PT != 'NA' && isValidNumber(PT) ? +PT : 0;
            }

            const empPf = findComponent(PF_STR, rule, salaryComponents);
            if (empPf) {
                const { calculatedValue: PfObj } = empPf;
                if (PfObj && PfObj != 'NA') {
                    totalEmployeePf += PfObj.employee && isValidNumber(PfObj.employee) ? +PfObj.employee : 0
                    totalEmployerPf += PfObj.employer && isValidNumber(PfObj.employer) ? +PfObj.employer : 0
                }
            }

            const empEsi = findComponent(ESIC_STR, rule, salaryComponents);
            if (empEsi) {
                const { calculatedValue: ESIObj } = empEsi;
                if (ESIObj && ESIObj != 'NA') {
                    totalEmployeeEsi += ESIObj.employee && isValidNumber(ESIObj.employee) ? +ESIObj.employee : 0
                    totalEmployerEsi += ESIObj.employer && isValidNumber(ESIObj.employer) ? +ESIObj.employer : 0
                }
            }
        }

        // total netsalary, esic, pf, gross and ctc calc
        totalNetSalary = Math.round(totalNetSalary);
        totalPf = totalEmployeePf + totalEmployerPf;
        totalEsi = totalEmployeeEsi + totalEmployerEsi;
        totalCtc = Math.round(totalNetSalary + totalTax + totalEsi + totalPf + totalPt);
        totalGross = Math.round(totalGross);

        return {
            totalNetSalary,
            totalCtc,
            totalGross,
            totalTax,
            totalEmployeePf,
            totalEmployerPf,
            totalEmployeeEsi,
            totalEmployerEsi,
            totalPt,
            totalEsi,
            totalPf
        }
    } catch (err) {
        throw err;
    }
}

const findComponent = (name, rule, components) => {
    try {
        return components.find(i => i.rule == rule && i.componentName == name)
    } catch (err) {
        throw err
    }
}

const numToNthPrecision = (num, precision = 2) => {
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}

module.exports = OverviewService;

