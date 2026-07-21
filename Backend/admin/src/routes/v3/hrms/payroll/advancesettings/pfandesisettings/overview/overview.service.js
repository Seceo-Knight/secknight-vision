const { sendResponse } = require(`${utilsFolder}/myService`),
    { translate } = require(`${utilsFolder}/messageTranslation`),
    { commonMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`),
    { OverviewValidator } = require('./overview.validator'),
    { OverviewModel } = require('./overview.model'),
    { details, settings } = require('../../../../bankdetail/default.payrollsettings'),
    { orgDefaultSettings } = require('../../organizationpayrollsettings.default'),
    { PfService } = require('../pfsettings/pf.service');

const defaultPFSettings = {
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
    }
}

class OverviewService {
    /**
     * A function for get pt and est overview
     * @function getEmployees
     * @param {*} req 
     * @param {*} res 
     * @param {*} next
     *   
     */
    static getEmployees = async (req, res, next) => {
        const { organization_id, language, employee_id: employeeId, role_id, is_manager, is_teamlead } = req.decoded;
        try {
            const { value, error } = OverviewValidator.getEmployees(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            const { skip, limit } = value;

            let to_assigned_id = is_manager || is_teamlead ? employeeId : null;

            let [EmployeeData, count, orgSettings] = await
                Promise.all([
                    OverviewModel.getEmployees({ ...value, organization_id, to_assigned_id, role_id }),
                    OverviewModel.getEmployees({ ...value, organization_id, countQuery: true, to_assigned_id, role_id }),
                    PfService.getOrgPFSettings(organization_id)
                ])
            count = count.length > 0 ? count[0].totalCount : 0
            if (!count || EmployeeData.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            let { pfIndividualOverride = false, esiIndividualOverride = false, salaryStructure = null } = orgSettings.length > 0 && orgSettings[0]['settings'] ? JSON.parse(orgSettings[0]['settings']) : {};

            EmployeeData = this.processOverviewData({ EmployeeData, orgSettings });

            return sendResponse(res, 200, { pfIndividualOverride, esiIndividualOverride, salaryStructure, count, EmployeeData, skipCount: skip + limit }, translate(commonMessages, "1", language), null);

        } catch (err) {
            next(err)
        }
    }

    /**
     * A function for process overview data
     * @function processData
     * @param {Array} data 
     * @returns {Array} 
     */
    static processOverviewData = ({ EmployeeData, orgSettings }) => {
        return EmployeeData.map(item => {
            try {
                orgSettings = orgSettings.length > 0 && orgSettings[0]['settings'] ? JSON.parse(orgSettings[0]['settings']) : null;

                let includeEdliPfAdminChargesInCtc = orgSettings && orgSettings.includeEdliPfAdminChargesInCtc ? orgSettings.includeEdliPfAdminChargesInCtc : false;
                let employeeEsiAmount = 0, employerEsiAmount = 0, employeePFAmount = 0, employerPFAmount = 0, adminCharges = 0;
                let settingData = !item['settings'] || item['settings'] == null ? null : JSON.parse(item['settings']);
                let datailsData = !item['details'] || item['details'] == null ? null : JSON.parse(item['details']);
                let salaryComponents = !item['salary_components'] || item['salary_components'] == null ? null : JSON.parse(item['salary_components']);

                const [pf_override, esi_override, pf_applicable, esi_applicable, adminCharges_applicable, adminChargesIndividualOverride] = [
                    orgSettings && orgSettings.pfIndividualOverride && item.pf_override ? true : false,
                    orgSettings && orgSettings.esiIndividualOverride && item.esi_override ? true : false,
                    // orgSettings && orgSettings.pfAllowed && item.pf_applicable ? true : false,
                    item.pf_applicable && item.pf_applicable == 1 ? true : false,
                    orgSettings && orgSettings.esiAllowed && item.esi_applicable ? true : false,
                    orgSettings && orgSettings.admin_charges && orgSettings.admin_charges.adminChargesAllowed ? true : false,
                    orgSettings && settingData && orgSettings.admin_charges && orgSettings.admin_charges.adminChargesIndividualOverride && settingData.admin_charges && settingData.admin_charges.adminCharges_override ? true : false,
                ];


                if (orgSettings) {

                    //============ESI calculation starts here===========
                    // checking is esi allowed or not for organization
                    if (orgSettings.esiAllowed) {
                        // if organization esi override is true check for employee override settings
                        if (orgSettings.esiIndividualOverride) {

                            /** If esi override from employee apply employee custom esi calculation
                             *  else consider organization settings
                             */
                            if (item.esi_override && item.esi_applicable) {

                                let isEmployeeESI = settingData && settingData.esiContribution && settingData.esiContribution.employee ? true : false
                                let isEmployerESI = settingData && settingData.esiContribution && settingData.esiContribution.employer ? true : false
                                settingData = {
                                    ...settingData,
                                    esiContribution: {
                                        employee: {
                                            is_fixed: isEmployeeESI && settingData.esiContribution.employee.is_fixed ? settingData.esiContribution.employee.is_fixed : false,
                                            fixed_amount: isEmployeeESI && settingData.esiContribution.employee.fixed_amount ? settingData.esiContribution.employee.fixed_amount : 0,
                                            gross: isEmployeeESI && settingData.esiContribution.employee.gross ? settingData.esiContribution.employee.gross : false,
                                            percentage: isEmployeeESI && settingData.esiContribution.employee.percentage ? settingData.esiContribution.employee.percentage : 0,
                                        },
                                        employer: {
                                            is_fixed: isEmployerESI && settingData.esiContribution.employer.is_fixed ? settingData.esiContribution.employer.is_fixed : false,
                                            fixed_amount: isEmployerESI && settingData.esiContribution.employer.fixed_amount ? settingData.esiContribution.employer.fixed_amount : 0,
                                            gross: isEmployerESI && settingData.esiContribution.employer.gross ? settingData.esiContribution.employer.gross : false,
                                            percentage: isEmployerESI && settingData.esiContribution.employer.percentage ? settingData.esiContribution.employer.percentage : 0,
                                        }
                                    },

                                }

                            } else if (item.esi_override && !item.esi_applicable) {
                                // when employee override is false
                                settingData = {
                                    ...settingData,
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
                                    // ...settingData,
                                }
                            } else {
                                // when employee override is false
                                settingData = {
                                    ...settingData,
                                    esiContribution: {
                                        employee: {
                                            is_fixed: false,
                                            fixed_amount: 0,
                                            gross: true,
                                            percentage: orgSettings.esiContribution && orgSettings.esiContribution.employeeEsi ? orgSettings.esiContribution.employeeEsi : 0
                                        },
                                        employer: {
                                            is_fixed: false,
                                            fixed_amount: 0,
                                            gross: true,
                                            percentage: orgSettings.esiContribution && orgSettings.esiContribution.employerEsi ? orgSettings.esiContribution.employerEsi : 0

                                        }
                                    },
                                    // ...settingData,
                                }

                            }
                        } else {

                            settingData = {
                                ...settingData,
                                esiContribution: {
                                    employee: {
                                        is_fixed: false,
                                        fixed_amount: 0,
                                        gross: true,
                                        percentage: orgSettings.esiContribution && orgSettings.esiContribution.employeeEsi ? orgSettings.esiContribution.employeeEsi : 0
                                    },
                                    employer: {
                                        is_fixed: false,
                                        fixed_amount: 0,
                                        gross: true,
                                        percentage: orgSettings.esiContribution && orgSettings.esiContribution.employerEsi ? orgSettings.esiContribution.employerEsi : 0

                                    }
                                },

                            }
                        }
                    } else {
                        settingData = {
                            ...settingData,
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

                        }
                    }

                    //===============ESI calculation ends here===============


                    // ===========PF formula customization starts here==========

                    /** Checking PF is allowed or not for the organization,
                     *  if allowed add formula for calculate PF else add default settings
                     */
                    if (orgSettings.pfAllowed) {

                        // Organization PF settings
                        const isOrgEmployeePF = orgSettings.pfContribution && orgSettings.pfContribution.employee ? orgSettings.pfContribution.employee : false;
                        const isOrgEmployerPF = orgSettings.pfContribution && orgSettings.pfContribution.employer ? orgSettings.pfContribution.employer : false;

                        // employee PF settings
                        const isEmpEmployeePF = settingData && settingData.pfContribution && settingData.pfContribution.employee ? settingData.pfContribution.employee : false;
                        const isEmpEmployerPF = settingData && settingData.pfContribution && settingData.pfContribution.employer ? settingData.pfContribution.employer : false;

                        if (orgSettings.pfIndividualOverride) {

                            if (item.pf_override && item.pf_applicable) {
                                // if pf override is allowed and pf is applicable for this employee side

                                settingData = {
                                    ...settingData,
                                    pfContribution: {
                                        employee: {
                                            is_fixed: isEmpEmployeePF.is_fixed ? isEmpEmployeePF.is_fixed : false,
                                            fixed_amount: isEmpEmployeePF.fixed_amount ? isEmpEmployeePF.fixed_amount : 0,
                                            basic: isEmpEmployeePF.basic ? isEmpEmployeePF.basic : false,
                                            percentage: isEmpEmployeePF.percentage ? isEmpEmployeePF.percentage : 0,
                                        },
                                        employer: {
                                            is_fixed: isEmpEmployerPF.is_fixed ? isEmpEmployerPF.is_fixed : false,
                                            fixed_amount: isEmpEmployerPF.fixed_amount ? isEmpEmployerPF.fixed_amount : 0,
                                            basic: isEmpEmployerPF.basic ? isEmpEmployerPF.basic : false,
                                            percentage: isEmpEmployerPF.percentage ? isEmpEmployerPF.percentage : 0,
                                        }
                                    }

                                }

                            } else if (item.pf_override && !item.pf_applicable) {
                                // if pf override is allowed and pf is not applicable for this employee side
                                settingData = {
                                    ...settingData,
                                    ...defaultPFSettings
                                }

                            } else {
                                /**if pf override is not allowed and pf is not applicable for this employee side ,
                                 * than adding organization PF settings
                                */
                                settingData = {
                                    ...settingData,
                                    pfContribution: {
                                        employee: {
                                            is_fixed: isOrgEmployeePF.is_fixed ? isOrgEmployeePF.is_fixed : false,
                                            fixed_amount: isOrgEmployeePF.fixed_amount ? isOrgEmployeePF.fixed_amount : 0,
                                            basic: isOrgEmployeePF.basic ? isOrgEmployeePF.basic : false,
                                            percentage: isOrgEmployeePF.percentage ? isOrgEmployeePF.percentage : 0,
                                        },
                                        employer: {
                                            is_fixed: isOrgEmployerPF.is_fixed ? isOrgEmployerPF.is_fixed : false,
                                            fixed_amount: isOrgEmployerPF.fixed_amount ? isOrgEmployerPF.fixed_amount : 0,
                                            basic: isOrgEmployerPF.basic ? isOrgEmployerPF.basic : false,
                                            percentage: isOrgEmployerPF.percentage ? isOrgEmployerPF.percentage : 0,
                                        }
                                    }

                                }
                            }

                        } else {
                            // if PF override is false add organization settings for the all employees
                            settingData = {
                                ...settingData,
                                pfContribution: {
                                    employee: {
                                        is_fixed: isOrgEmployeePF.is_fixed ? isOrgEmployeePF.is_fixed : false,
                                        fixed_amount: isOrgEmployeePF.fixed_amount ? isOrgEmployeePF.fixed_amount : 0,
                                        basic: isOrgEmployeePF.basic ? isOrgEmployeePF.basic : false,
                                        percentage: isOrgEmployeePF.percentage ? isOrgEmployeePF.percentage : 0,
                                    },
                                    employer: {
                                        is_fixed: isOrgEmployerPF.is_fixed ? isOrgEmployerPF.is_fixed : false,
                                        fixed_amount: isOrgEmployerPF.fixed_amount ? isOrgEmployerPF.fixed_amount : 0,
                                        basic: isOrgEmployerPF.basic ? isOrgEmployerPF.basic : false,
                                        percentage: isOrgEmployerPF.percentage ? isOrgEmployerPF.percentage : 0,
                                    }
                                }

                            }
                        }

                    } else {
                        // Adding default settings
                        settingData = {
                            ...settingData,
                            ...defaultPFSettings
                        }
                    }
                    // ===========PF formula customization ends here==========


                    //=====START:--- checking ESI is fixed true or not====
                    //Fetching fixed ESI amount for settings if is_fixed is true  otherwise need to be calculate from the settings
                    let isEmployeeEsiFixed = settingData && settingData.esiContribution && settingData.esiContribution.employee && settingData.esiContribution.employee.is_fixed ? true : false;
                    let isEmployerEsiFixed = settingData && settingData.esiContribution && settingData.esiContribution.employer && settingData.esiContribution.employer.is_fixed ? true : false;


                    let orgEmployeeEsi = orgSettings && orgSettings.esiContribution && orgSettings.esiContribution.employeeEsi ? orgSettings.esiContribution.employeeEsi : 0;
                    let orgEmployerEsi = orgSettings && orgSettings.esiContribution && orgSettings.esiContribution.employeeEsi ? orgSettings.esiContribution.employerEsi : 0;

                    if (salaryComponents != null && item.esi_applicable) {
                        employeeEsiAmount = isEmployeeEsiFixed ? (parseInt(settingData.esiContribution.employee.fixed_amount) || 0) : Math.round(((salaryComponents.gross_salary) * orgEmployeeEsi) / 100);
                        employerEsiAmount = isEmployerEsiFixed ? (parseInt(settingData.esiContribution.employer.fixed_amount) || 0) : Math.round(((salaryComponents.gross_salary) * orgEmployerEsi) / 100);

                    }
                    else if (datailsData != null && item.esi_applicable) {
                        employeeEsiAmount = isEmployeeEsiFixed ? (parseInt(settingData.esiContribution.employee.fixed_amount) || 0) : Math.round(((datailsData.gross) * orgEmployeeEsi) / 100);
                        employerEsiAmount = isEmployerEsiFixed ? (parseInt(settingData.esiContribution.employer.fixed_amount) || 0) : Math.round(((datailsData.gross) * orgEmployerEsi) / 100);
                        //=====END:--- checking ESI is fixed true or not====    
                    }


                    //====START:--Fetching PF fixed amount from the settings if is_fixed is true=====
                    let isEmployeePFFixed = settingData && settingData.pfContribution && settingData.pfContribution.employee && settingData.pfContribution.employee.is_fixed ? true : false;
                    let isEmployerPFFixed = settingData && settingData.pfContribution && settingData.pfContribution.employer && settingData.pfContribution.employer.is_fixed ? true : false;

                    employeePFAmount = isEmployeePFFixed ? (parseInt(settingData.pfContribution.employee.fixed_amount) || 0) : 0;
                    employerPFAmount = isEmployerPFFixed ? (parseInt(settingData.pfContribution.employer.fixed_amount) || 0) : 0;
                    //==== END:--Fetching PF fixed amount from the settings if is_fixed is true=====
                }

                //===START -> Calculate Admin charges=====//
                // ***if employee have custom admin charges*** //
                if (!pf_applicable && !esi_applicable) adminCharges_applicable = false, adminCharges = 0;
                else if (!adminCharges_applicable) adminCharges = 0;
                else if (adminCharges_applicable && adminChargesIndividualOverride) {
                    // fixed amount
                    if (settingData.admin_charges.is_fixed) adminCharges = settingData.admin_charges.fixed_amount;

                    // as per basic percentage Math.round((settingData.admin_charges.percentage * 100)/salaryComponents.basic_allowance)
                    else if (settingData && settingData.admin_charges.basic && settingData.admin_charges.percentage) {
                        adminCharges = Math.round((settingData.admin_charges.percentage / 100) * salaryComponents.basic_allowance);
                    }
                }
                // ***for all other employees*** //
                else if (adminCharges_applicable) {
                    // above ceiling with basic
                    if (!orgSettings.admin_charges.enableStatutoryCeiling && orgSettings.admin_charges.contribution && orgSettings.admin_charges.contribution.basic) {
                        adminCharges = orgSettings.admin_charges.contribution.percentage ? Math.round((orgSettings.admin_charges.contribution.percentage / 100) * salaryComponents.basic_allowance) : Math.round((1 / 100) * salaryComponents.basic_allowance);
                    }
                    // for fixed
                    else if (orgSettings.admin_charges.enableStatutoryCeiling && orgSettings.admin_charges.contribution && orgSettings.admin_charges.contribution.belowCeilingAmount) {
                        // above ceiling fixed    
                        if (orgSettings.admin_charges.contribution.is_fixed && salaryComponents.basic_allowance > orgSettings.admin_charges.adminChargesCeiling) adminCharges = orgSettings.admin_charges.contribution.fixed_amount;
                        // below ceiling fixed   
                        else if (orgSettings.admin_charges.contribution.belowCeilingAmount.is_fixed && salaryComponents.basic_allowance <= orgSettings.admin_charges.adminChargesCeiling) adminCharges = orgSettings.admin_charges.contribution.belowCeilingAmount.fixed_amount;
                        // below ceiling basic    
                        else if (orgSettings.admin_charges.contribution.belowCeilingAmount.basic && salaryComponents.basic_allowance <= orgSettings.admin_charges.adminChargesCeiling) adminCharges = Math.round((orgSettings.admin_charges.contribution.belowCeilingAmount.percentage / 100) * salaryComponents.basic_allowance);
                    }
                }
                //===END -> Calculate Admin charges=====//


                //adding  date default values
                settingData = {
                    pf_date_joined: null,
                    pf_effective_date: null,
                    esi_effective_date: null,
                    vpf: 0,
                    ...settingData
                }
                item = {
                    ...item,
                    settings: settingData,
                    details: item['details'] == null ? details : JSON.parse(item['details']),
                    pf_override,
                    esi_override,
                    pf_applicable,
                    esi_applicable,
                    adminCharges_applicable,
                    adminCharges,
                    employeeEsiAmount,
                    employerEsiAmount,
                    employeePFAmount,
                    employerPFAmount,
                    includeEdliPfAdminChargesInCtc,
                }

                return item;
            } catch (err) {
                item = {
                    ...item,
                    settings: !item['settings'] || item['settings'] == null ? settings : JSON.parse(item['settings']),
                    details: item['details'] || item['details'] == null ? details : JSON.parse(item['details']),
                    includeEdliPfAdminChargesInCtc: false,
                }
                return item;
            }
        });
    }

    /**
     * A function for update payroll settings and employee payroll details
     * @function updateSettings
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static updateSettings = async (req, res, next) => {
        const { organization_id, language, employee_id: employeeId } = req.decoded;
        try {
            const { value, error } = OverviewValidator.updateSettings(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);



            let { employee_id,
                pf_override, esi_override, pf_applicable,
                esi_applicable, adminChargesContribution,
                adminCharges_effective_date, adminCharges_override } = value,
                payrollDetails = {
                    pf_number: value['pf_number'] || null,
                    esi_number: value['esi_number'] || null,
                    uan_number: value['uan_number'] || null,
                    eps_number: value['eps_number'] || null,
                },
                payrollSettings = {

                    pf_date_joined: value['pf_date_joined'] || null,
                    pf_effective_date: value['pf_effective_date'] || null,
                    esi_effective_date: value['esi_effective_date'] || null,
                    vpf: value['vpf'] || 0,
                    pfContribution: value['pfContribution'] || null,
                    esiContribution: value['esiContribution'] || null
                },

                [User, payrollData, organizationSetting] = await Promise.all([
                    OverviewModel.getUser(employee_id, organization_id),
                    OverviewModel.getPayrollSettings(employee_id, organization_id),
                    PfService.getOrgPFSettings(organization_id)
                ]);

            let organizationEsiValue = organizationSetting.length > 0 && organizationSetting[0]['settings'] ? JSON.parse(organizationSetting[0]['settings']) : 0;




            //Checking user exist or not
            if (User.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "4", language), null);



            let oldDetails = payrollData.length > 0 && payrollData[0]['details'] ? JSON.parse(payrollData[0]['details']) : {};

            let employeeCtc = oldDetails['ctc'] ? oldDetails['ctc'] : 0

            if (employeeCtc > 0 && esi_applicable) {
                employeeCtc = employeeCtc / 12;
                if (employeeCtc > organizationEsiValue['statutoryMaxMonthlyGrossForEsi'])
                    return res.json({ code: 400, message: "ESI is not applicable for Employee CTC.", error: "ESI is not applicable for Employee CTC.", data: null })
                // return sendResponse(res, 400, null, translate("ESI is not applicable for Employee CTC", "4", language), null);

            }



            payrollSettings = {
                pf_date_joined: payrollSettings['pf_date_joined'] || null,
                pf_effective_date: payrollSettings['pf_effective_date'] || null,
                esi_effective_date: payrollSettings['esi_effective_date'] || null,
                vpf: payrollSettings['vpf'] || 0,

                admin_charges: {
                    adminCharges_override,
                    adminCharges_effective_date,
                    is_fixed: adminChargesContribution.is_fixed ?? false,
                    fixed_amount: adminChargesContribution.fixed_amount ?? 0,
                    basic: adminChargesContribution.basic ?? false,
                    percentage: adminChargesContribution.percentage ?? 0,
                },

                pfContribution: {
                    employee: {
                        // is_fixed: payrollSettings?.pfContribution?.employee?.is_fixed || false,
                        // fixed_amount: payrollSettings?.pfContribution?.employee?.fixed_amount || 0,
                        // basic: payrollSettings?.pfContribution?.employee?.basic || false,
                        // percentage: payrollSettings?.pfContribution?.employee?.percentage || 0,
                        is_fixed: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employee && payrollSettings.pfContribution.employee.is_fixed) ? payrollSettings.pfContribution.employee.is_fixed : false,
                        fixed_amount: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employee && payrollSettings.pfContribution.employee.fixed_amount) ? payrollSettings.pfContribution.employee.fixed_amount : 0,
                        basic: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employee && payrollSettings.pfContribution.employee.basic) ? payrollSettings.pfContribution.employee.basic : false,
                        percentage: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employee && payrollSettings.pfContribution.employee.percentage) ? payrollSettings.pfContribution.employee.percentage : 0,
                    },
                    employer: {
                        // is_fixed: payrollSettings?.pfContribution?.employer?.is_fixed || false,
                        // fixed_amount: payrollSettings?.pfContribution?.employer?.fixed_amount || 0,
                        // basic: payrollSettings?.pfContribution?.employer?.basic || false,
                        // percentage: payrollSettings?.pfContribution?.employer?.percentage || 0,
                        is_fixed: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employer && payrollSettings.pfContribution.employer.is_fixed) ? payrollSettings.pfContribution.employer.is_fixed : false,
                        fixed_amount: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employer && payrollSettings.pfContribution.employer.fixed_amount) ? payrollSettings.pfContribution.employer.fixed_amount : 0,
                        basic: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employer && payrollSettings.pfContribution.employer.basic) ? payrollSettings.pfContribution.employer.basic : false,
                        percentage: (payrollSettings && payrollSettings.pfContribution && payrollSettings.pfContribution.employer && payrollSettings.pfContribution.employer.percentage) ? payrollSettings.pfContribution.employer.percentage : 0,
                    }
                },
                esiContribution: {
                    employee: {
                        // is_fixed: payrollSettings?.esiContribution?.employee?.is_fixed || false,
                        // fixed_amount: payrollSettings?.esiContribution?.employee?.fixed_amount || 0,
                        // gross: payrollSettings?.esiContribution?.employee?.gross || false,
                        // percentage: payrollSettings?.esiContribution?.employee?.percentage || 0,

                        is_fixed: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employee && payrollSettings.esiContribution.employee.is_fixed) ? payrollSettings.esiContribution.employee.is_fixed : false,
                        fixed_amount: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employee && payrollSettings.esiContribution.employee.fixed_amount) ? payrollSettings.esiContribution.employee.fixed_amount : 0,
                        gross: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employee && payrollSettings.esiContribution.employee.gross) ? payrollSettings.esiContribution.employee.gross : false,
                        percentage: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employee && payrollSettings.esiContribution.employee.percentage) ? payrollSettings.esiContribution.employee.percentage : 0,

                    },
                    employer: {
                        // is_fixed: payrollSettings?.esiContribution?.employer?.is_fixed || false,
                        // fixed_amount: payrollSettings?.esiContribution?.employer?.fixed_amount || 0,
                        // gross: payrollSettings?.esiContribution?.employer?.gross || false,
                        // percentage: payrollSettings?.esiContribution?.employer?.percentage || 0,
                        is_fixed: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employer && payrollSettings.esiContribution.employer.is_fixed) ? payrollSettings.esiContribution.employer.is_fixed : false,
                        fixed_amount: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employer && payrollSettings.esiContribution.employer.fixed_amount) ? payrollSettings.esiContribution.employer.fixed_amount : 0,
                        gross: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employer && payrollSettings.esiContribution.employer.gross) ? payrollSettings.esiContribution.employer.gross : false,
                        percentage: (payrollSettings && payrollSettings.esiContribution && payrollSettings.esiContribution.employer && payrollSettings.esiContribution.employer.percentage) ? payrollSettings.esiContribution.employer.percentage : 0,

                    }
                }
            }

            payrollDetails = {
                // father_name: payrollDetails['father_name'] || null,
                // mother_name: payrollDetails['mother_name'] || null,
                // marital_status: payrollDetails['marital_status'] || null,
                // govt_id: payrollDetails['govt_id'] || null,
                // pt_location: payrollDetails['pt_location'] || null,
                // pan_number: payrollDetails['pan_number'] || null,
                // ctc: payrollDetails['ctc'] || null,

                father_name: oldDetails['father_name'] || null,
                mother_name: oldDetails['mother_name'] || null,
                marital_status: oldDetails['marital_status'] || null,
                govt_id: oldDetails['govt_id'] || null,
                pt_location: oldDetails['pt_location'] || null,
                pan_number: oldDetails['pan_number'] || null,
                ctc: oldDetails['ctc'] || null,
                gross: oldDetails['gross'] || null,

                pf_number: payrollDetails['pf_number'] || null,
                esi_number: payrollDetails['esi_number'] || null,
                uan_number: payrollDetails['uan_number'] || null,
                eps_number: payrollDetails['eps_number'] || null,
            }
            console.log(payrollSettings, payrollDetails)
            let paramObject = {
                settings: JSON.stringify(payrollSettings),
                details: JSON.stringify(payrollDetails),
                employee_id, pf_override, esi_override,
                pf_applicable, esi_applicable, organization_id
            }
            if (payrollData.length == 0) {
                await OverviewModel.addSettings(paramObject);
            } else {
                await OverviewModel.updateSettings(paramObject);
            }
            return sendResponse(res, 200, { pf_override, esi_override, pf_applicable, esi_applicable, payrollDetails, payrollSettings }, translate(commonMessages, "1", language), null);
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, translate(commonMessages, "4", language), err.message);
        }
    }


}
module.exports = { OverviewService };