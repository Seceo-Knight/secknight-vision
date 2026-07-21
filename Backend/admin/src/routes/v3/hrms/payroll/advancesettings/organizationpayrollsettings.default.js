exports.organizationPayrollSettings = {
    payrollAllowed: true,
    pfAllowed: true,
    pfContribution: {
        employee: {
            is_fixed: false,
            fixed_amount: 1500,
            basic: true,
            percentage: 12
        },
        employer: {
            is_fixed: false,
            fixed_amount: 1500,
            basic: true,
            percentage: 12
        }
    },
    includeEdliPfAdminChargesInCtc: true,
    enableStatutoryMinimumCeiling: true,
    employerPfContributionIncludedInCtc: true,
    pfEffectiveDate: "2021-06-02",

    lopDependent: true,
    pfIndividualOverride: true,
    esiIndividualOverride: true,
    pfCeiling: 15000,
    esiAllowed: true,
    esiContribution: {
        employeeEsi: 0.75,//0.75% of gross
        employerEsi: 3.25 // 3.25% of gross
    },
    esiEffectiveDate: "2021-06-02",
    statutoryMaxMonthlyGrossForEsi: 20000,
    includeEmployerEsiContributionInCtc: true,
    payFrequency: "Monthly",
    paycycle: { from: 1, to: 31 },
    payrollLeaveAttendanceCycle: { from: 1, to: 31 },
    payoutDate: 31,
    cutOffDateNewJoinees: 31,
    salaryStructure: "CTC",
    effectiveDate: "2021-06-02",
    includeWeeklyOffs: true,
    includeHolidays: true,
    taxProjectionToEmp: true,
    taxcomputationToEmp: true,
    ptSettings: {
        ptAllowed: true,
        ptStateOverride: true,
        ptEffectiveDate: "2021-06-02",
        allStates: true
    }

}


// { "pfContribution": { "employee": { "basic": true, "percentage": 12 }, "employer": { "basic": true, "percentage": 12 } }, "payrollAllowed": true, "pfAllowed": false, "lopDependent": true, "pfIndividualOverride": true, "esiIndividualOverride": true, "pfCeiling": 15000, "esiAllowed": true, "esiContribution": { "employeeEsi": 0.75, "employerEsi": 3.25 }, "statutoryMaxMonthlyGrossForEsi": 20000, "includeEmployerEsiContributionInCtc": false, "payFrequency": "Monthly", "paycycle": { "from": 1, "to": 31 }, "payrollLeaveAttendanceCycle": { "from": 1, "to": 31 }, "payoutDate": 31, "cutOffDateNewJoinees": 31, "salaryStructure": "CTC", "effectiveDate": "2021-06-21", "includeWeeklyOffs": true, "includeHolidays": true, "taxProjectionToEmp": true, "taxcomputationToEmp": true }