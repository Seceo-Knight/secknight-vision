const Joi = require('joi');
const { bool, obj, num, str, strRequired } = require('../advancesettings/pfandesisettings/overview/overview.validator')
const Common = require(`${utilsFolder}/helpers/Common`);

class DeclarationValidation {
    /**
     * postDeclarationValidation - function to validate postDeclaration request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    postDeclarationValidation(params) {
        const schema = Joi.object().keys({
            financial_year: Joi.string().max(50).required(),
            declaration_id: Joi.number().allow(0).positive().required(),
            declared_amount: Joi.number().allow(0).optional(),
            comments: Joi.string().optional()
        });
        return Joi.validate(params, schema);
    }

    /**
     * postDeclarationUploadValidation - function to validate postDeclarationUpload request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    postDeclarationUploadValidation(params) {
        const schema = Joi.object().keys({
            employee_declaration_id: Joi.number().positive().required(),
        });
        return Joi.validate(params, schema);
    }

    /**
     * postDeclarationValidation - function to validate postDeclaration request
     * 
     * @param {*} params 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    postDeclarationDataValidation(params, isEmployeeLogin) {

        let validationSchemaObj = {
            financial_year: Joi.string().max(50).required(),
            declaration_id: Joi.number().allow(0).positive().required(),
            declared_amount: Joi.number().allow(0).optional(),
            comments: Joi.string().optional(),
            type: Joi.string().max(30).optional(),
            component_name: Joi.string().when(
                'type',
                { is: 'LTA', then: Joi.string().max(20).required() }
            ),
            travel_date: Joi.string().when(
                'type',
                { is: 'LTA', then: Joi.string().raw().required() }
            ),
        };

        //for admin 
        if (!isEmployeeLogin) {
            validationSchemaObj = {
                ...validationSchemaObj,
                employee_id: Joi.number().positive().required()
            }
        }
        const schema = Joi.object().keys(validationSchemaObj);
        return Joi.validate(params, schema);
    }

    /**
     * Employees tax schemes - function to validate employeesTaxSchemes request
     *
     * @param {*} params
     * @returns
     * @author basavaraj shiralashetti <basavarajshiralashetti@globussoft.in>
     */
    employeesTaxSchemes(params) {
        const schema = Joi.object().keys({
            skip: Joi.number().optional().default(0),
            limit: Joi.number().optional().default(10),
            employee_type: Joi.number().allow([1, 2, "1", "2"]).default(null),
            sortColumn: Joi.string().allow(['name', 'location', 'email']).optional(),
            name: Joi.string().optional(),
            sortOrder: Joi.string().allow(['DESC', 'ASC']).optional().default('DESC'),
            employeeId: Joi.number().optional(),
            financial_year: Joi.string().optional().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),

        });
        return Joi.validate(params, schema);
    }

    /**
     * Employees tax schemes - function to validate employeesTaxSchemes details
     *
     * @function updateEmployeesTaxSchemes
     * @param {*} params
     * @returns
     * @author basavaraj shiralashetti <basavarajshiralashetti@globussoft.in>
     */
    updateEmployeesTaxSchemes(params) {
        const schema = Joi.object().keys({
            schemeData: Joi.array().items(
                Joi.object().keys({
                    employeeId: Joi.number().positive().required(),
                    adminApprovedBchemeId: Joi.number().required()
                    // employeeApprovedSchemeId: Joi.number().optional().default(null),
                    // schemeStatus: Joi.number().required().allow([0, 1, 2]),
                })
            ).required().min(1)
        })
        return Joi.validate(params, schema);
    }

    createHouseProperty(params) {
        return Joi.validate(
            params,
            Joi.object().keys({
                // comments: Joi.string().optional(),
                id: num().integer().default(null),
                financial_year: Joi.string().max(50).required(),
                declaration_id: Joi.number().positive().required(),
                houseProperty: Joi.object().keys({
                    // type: str().valid('selfOccupiedProperty', 'letOutProperty').required(),
                    // hasLoan: bool().valid(true, false).default(false),
                    details: Joi.object().keys({
                        type: str().valid("apartment", "house", "plot", "others").required(),
                        propertyValue: num().required(),
                        // address: str().required(),
                        // address_2: str().default(null),
                        // city: str().required(),
                        // pinCode: num().min(3),
                    }),
                    // loanDetails: Joi.object().keys({
                    //     loanAmount: num().default(0),
                    //     sanctionedDate: Joi.date().default(null),
                    //     occupancyDate: Joi.date().default(null),
                    //     annualInterest: num().default(0),
                    //     landerDetails: Joi.object().keys({
                    //         name: str().default(null),
                    //         landerPan: str().default(null),
                    //         type: str().valid("employer", "financialInstitution", "others").default(null),
                    //         address: str().default(null),
                    //         address_2: str().default(null),
                    //         city: str().default(null),
                    //         pinCode: num().default(null),
                    //     }).default({
                    //         name: null,
                    //         landerPan: null,
                    //         type: null,//one of this
                    //         address: null,
                    //         city: null,
                    //         pinCode: null,
                    //     })
                    // }).default({
                    //     loanAmount: 0,
                    //     sanctionedDate: null,//not req
                    //     occupancyDate: null,//not req
                    //     landerDetails: {
                    //         name: null,
                    //         landerPan: null,
                    //         type: null,//one of this
                    //         address: null,
                    //         city: null,
                    //         pinCode: null,
                    //     }
                    // }),
                    // rentalIncome: Joi.object().keys({
                    //     receivable: num().default(0),
                    //     municipalTaxPaid: num().default(0),
                    //     standardDeduction: num().default(0),
                    //     netAnnualValue: num().default(0),
                    // }).default({
                    //     receivable: 0,
                    //     municipalTaxPaid: 0,
                    //     standardDeduction: 0
                    // }),
                    // lossAmount: num().default(0),
                })
            })
        )
    }


    createIncomeFromPreviousEmployer(params) {
        return Joi.validate(params, Joi.object().keys({
            comments: Joi.string().optional(),
            id: num().integer().default(null),
            financial_year: Joi.string().max(50).required(),
            declaration_id: Joi.number().positive().required(),
            incomeFromPreviousEmployer: Joi.object().keys({
                startDate: Joi.date().required(),
                endDate: Joi.date().required(),
                employerName: strRequired().required(),
                income: num().integer().allow(0).required(),
                // pf: num().integer().allow(0).required(),
                // pt: num().integer().allow(0).required(),
                taxDeduction: num().integer().allow(0).required(),
            })
        }))
    }

    taxSchemes(params) {
        const schema = Joi.object().keys({
            employee_type: Joi.number().optional().default(null),
        });
        return Joi.validate(params, schema);
    }

    getTaxCorrectionData(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().optional().default(null),
            name: Joi.string().optional().default(null),
            date: Joi.date().required(),
            employee_type: Joi.number().valid(1, 2, 3, 4, 5).default(null),
            skip: Joi.number().optional().default(null),
            limit: Joi.number().optional().default(10),
        });

        return Joi.validate(params, schema);
    }

    postTaxCorrectionData(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required(),
            date: Joi.date().required(),
            gross: Joi.number().positive().default(null),
            tds: Joi.when('gross', { is: null, then: Joi.number().positive().required(), otherwise: Joi.number().positive().default(null) })
        }).or('gross', 'tds');

        return Joi.validate(params, schema);
    }
}

module.exports = new DeclarationValidation();

