const houseProperty = {
    type: 'selfOccupiedProperty',//  selfOccupiedProperty, letOutProperty
    hasLoan: false,
    details: {
        type: "apartment",//["apartment", "house", "plot", "others"]
        propertyValue: 250000,
        address: "5th block KHB colony banglore karnataka",
        address_2: "5th block KHB colony banglore karnataka",
        city: "banglore",
        pinCode: "584123",
    },

    // allow all null details if has loan false
    loanDetails: {
        loanAmount: 100000,
        sanctionedDate: '2020-12-01',//not req
        occupancyDate: '2021-12-01',//not req
        AnnualInterest: 10,
        landerDetails: {
            name: 'chanti',
            landerPan: '12312331232',
            type: "employer",//one of this ["employer", "financialInstitution", "others"]
            address: "5th block KHB colony banglore karnataka",
            address_2: "5th block KHB colony banglore karnataka",
            city: "banglore",
            pinCode: "584123",
        }
    },
    rentalIncome: {
        netAnnualValue: 2500,
        receivable: 2500,
        municipalTaxPaid: 250,
        standardDeduction: 652
    },
    lossAmount: 20000,

}

const IncomeFromPreviousEmployer = {
    startDate: "2021-07-26",
    endDate: "2021-07-26",
    employerName: "admin",
    income: 250000,
    pf: 250,
    pt: 250,
    taxDeduction: 1200
}

const incomeFromPension = {
    amount: 100,
    relationType: "Father",
    dat: "2021-01-30",
    memberName: "name"
}

exports.information = { houseProperty, incomeFromPension, IncomeFromPreviousEmployer }