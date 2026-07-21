// Default employee payroll details
const details = {
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
},
    //Default Payroll settings
    settings = {
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

module.exports = { settings, details }

/**
{
    father_name: "sdfas",
    mother_name: "dasd",
    spouse_name: "asdf",
    marital_status: 1,
    type: 1,
    pt_location: 1
    pt_location_name: "bangalore",
    pan_number: "dgsdfg",
    pf_number: "dsdfgs",
    esi_number: "dsdfs",
    uan_number: "dfgsdfgs",
    ctc: 25000,
    eps_number: "12345698",
    c_address: "asdf",
    p_address: "asdf"
}


{
 pf_date_joined: "2021-06-09",
 pf_effective_date: "2021-06-09",
 esi_effective_date: "2021-06-09",
 vpf: 1200,
 pfContribution: {
     employee: {
         is_fixed: true,
         fixed_amount: 1200,
         basic: true,
         percentage: 12
     },
     employer: {
         is_fixed: true,
         fixed_amount: 1200,
         basic: true,
         percentage: 12
     }

 },
 esiContribution: {
     employee: {
         is_fixed: false,
         fixed_amount: 1200,
         gross: true,
         percentage: 0.75
     },
     employer: {
         is_fixed: false,
         fixed_amount: 1200,
         gross: true,
         percentage: 3.25
     }
 },
       ptSettings: {
            ptEffectiveDate: "2021-06-21",
            location_id: 1 ,//
            ptAllowed: true
        }
}




 */