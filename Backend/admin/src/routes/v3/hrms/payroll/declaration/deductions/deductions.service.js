const moment = require('moment');
const _ = require('underscore');

const { sendResponse } = require(`${utilsFolder}/myService`);
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { commonMessages, locationMessages, declarationMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`);

const { DeductionsValidator } = require('./deductions.validator');
const { DeductionModel } = require('./deductions.model');
const { typeOf } = require('mathjs');
const declarationSettingService = require('../../advancesettings/declaration-settings/declaration-setting.service');

const DEDUCTION_NAME_HRA = 'HRA';
// const DEDUCTION_NAME_LOANS = 'LOANS';
class DeductionsService {

    static async getDeductions(req, res, next) {
        try {
            const { organization_id, language, employee_id: employeeId } = req.decoded;
            const { value, error } = DeductionsValidator.getDeductions(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            let { financialYear, skip, limit, employee_id, search, withOtherDeductions, includeOther } = value;
            employee_id = employeeId ? employeeId : employee_id;
            let [employeeDeductions, totalCount] =

                await Promise.all([
                    DeductionModel.getEmployeeDeductions({
                        withOtherDeductions,
                        organization_id,
                        skip,
                        limit,
                        employee_id,
                        search,
                        financialYear,
                        includeOther
                    }),
                    DeductionModel.distinctEmployeeCount({ includeOther, withOtherDeductions, financialYear, organization_id, employee_id, search })
                ]);


            if (!employeeDeductions.length) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);

            totalCount = totalCount && totalCount.length !== 0 ? totalCount[0]['totalCount'] : 0;
            const employeeIds = _.pluck(employeeDeductions, "employee_id");

            const deductions = await DeductionModel.getDeductionsDetails({ withOtherDeductions, onlyDeduction: !withOtherDeductions, employeeIds, financialYear, organization_id })


            employeeDeductions = employeeDeductions.map(item => {

                const deductionArray = deductions.filter(i => i.employee_id == item.employee_id)

                item = {
                    ...item,
                    declarationCount: deductionArray.length,
                    // deductions: deductions.filter(i => i.employee_id == item.employee_id)
                    deductions: deductionArray
                }

                delete item['id'];
                return item;
            })

            return sendResponse(res, 200,
                {
                    totalCount,
                    deductions: employeeDeductions
                },
                translate(commonMessages, "1", language),
                null
            );

        } catch (err) {
            next(err)
        }
    }

    static async updateDeductions(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = DeductionsValidator.updateDeductions(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            // declaration window and active check
            const isDeclarationWindowOpenAndActive = await this.isDeclarationWindowOpenAndActive(organization_id);
            if (!isDeclarationWindowOpenAndActive) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            const { comment, approved_amount, status, id } = value;

            const updatedData = await DeductionModel.updateDeductions({ organization_id, comment, approved_amount, status, id });
            if (updatedData && updatedData.affectedRows > 0) {
                return sendResponse(res, 200, req.body, translate(commonMessages, "1", language), null);
            }
            return sendResponse(res, 400, null, translate(commonMessages, "4", language), null);
        } catch (err) {
            next(err)
        }
    }

    static async getHra(req, res, next) {
        try {
            const { organization_id, employee_id: employeeId, language } = req.decoded;
            const { value, error } = DeductionsValidator.getDeductions(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            let { financialYear, skip, limit, employee_id, search } = value;
            employee_id = employeeId ? employeeId : employee_id;

            let [EmployeeHra, totalCount] = await Promise.all([
                DeductionModel.getHra({ organization_id, financialYear, skip, limit, employee_id, search }),
                DeductionModel.getHra({ organization_id, isCount: true, financialYear, skip, limit, employee_id, search }),
            ]);


            if (!EmployeeHra.length) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            totalCount = totalCount.length !== 0 ? totalCount[0]['totalCount'] : 0;
            return sendResponse(res, 200, { totalCount, skipCount: skip + limit, EmployeeHra }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }

    static async postHra(req, res, next) {
        try {
            const { organization_id, employee_id: loginEmployeeId, language } = req.decoded;
            const { value, error } = DeductionsValidator.postHraValidation(req.body, loginEmployeeId);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            // declaration window and active check
            const isDeclarationWindowOpenAndActive = await this.isDeclarationWindowOpenAndActive(organization_id);
            if (!isDeclarationWindowOpenAndActive) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            const [declarationComponentObj] = await DeductionModel.getDeclarationComponents({ deduction_name: DEDUCTION_NAME_HRA });

            if (!declarationComponentObj) return (res, 401, null, translate(commonMessages, "3", language), translate(commonMessages, "3", language));

            const declaration_component_id = declarationComponentObj.id;
            const employee_id = loginEmployeeId ? loginEmployeeId : value.employee_id;

            let { landlord_name, monthly_rent, date_range, landlord_pan, address, comments, financial_year, declared_amount, /* approved_amount, */ id } = value;
            let hra = null;
            if (id) {
                hra = await DeductionModel.updateHra({
                    comments, id, financial_year, organization_id, employee_id,
                    information: JSON.stringify({ hra: { landlord_name, address, monthly_rent } }),
                    id, declaration_component_id, declared_amount,
                    /* approved_amount, */  date_range, landlord_pan
                })
            } else {
                hra = await DeductionModel.insertHra({
                    comments, financial_year, organization_id, employee_id,
                    information: JSON.stringify({ hra: { landlord_name, address, monthly_rent } }),
                    declaration_component_id, declared_amount,
                    /* approved_amount, */  date_range, landlord_pan
                })
            }

            if (hra && hra.affectedRows == 0) return sendResponse(res, 400, null, translate(commonMessages, "4", language), null);
            if (hra && hra.insertId) { id = hra.insertId };

            return sendResponse(res, 200, { ...value, id }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }
    static async getLta(req, res, next) {
        try {
            const { organization_id, employee_id: employeeId, language } = req.decoded;
            const { value, error } = DeductionsValidator.getDeductions(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            let { financialYear, skip, limit, employee_id, search } = value;
            employee_id = employeeId ? employeeId : employee_id;

            let [EmployeeLta, totalCount] = await Promise.all([
                DeductionModel.getLta({ organization_id, financialYear, skip, limit, employee_id, search }),
                DeductionModel.getLta({ organization_id, isCount: true, financialYear, skip, limit, employee_id, search }),
            ]);

            if (!EmployeeLta.length) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            totalCount = totalCount.length !== 0 ? totalCount[0]['totalCount'] : 0;
            return sendResponse(res, 200, { totalCount, skipCount: skip + limit, EmployeeLta }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }


    static async getProperty(req, res, next) {
        try {
            const { organization_id, language, employee_id: employeeId } = req.decoded;
            let { value, error } = DeductionsValidator.getDeductions(req.query);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            value.employee_id = employeeId ? employeeId : value.employee_id;
            // let { skip, limit, type } = value;


            let { financialYear, skip, limit, employee_id, search, type } = value;
            employee_id = employeeId ? employeeId : employee_id;
            let [employeeDeductions, totalCount] =

                await Promise.all([
                    DeductionModel.getEmployeeDeductions({
                        organization_id,
                        skip,
                        limit,
                        employee_id,
                        search,
                        financialYear,
                        type
                    }),
                    DeductionModel.distinctEmployeeCount({ type, financialYear, organization_id, employee_id, search })
                ]);

            if (!employeeDeductions.length) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);

            totalCount = totalCount && totalCount.length !== 0 ? totalCount[0]['totalCount'] : 0;
            const employeeIds = _.pluck(employeeDeductions, "employee_id");
            const deductions = await DeductionModel.getDeductionsDetails({ type, employeeIds, financialYear, organization_id })

            employeeDeductions = employeeDeductions.map(item => {
                item = {
                    ...item,
                    deductions: deductions.filter(i => i.employee_id == item.employee_id)
                }
                delete item['id'];
                let documentsCount = 0;
                let totalAmount = 0;

                item.deductions = item.deductions.map(entity => {
                    entity = {
                        ...entity,
                        documents: entity.documents && typeOf(entity.documents) == "string" ? JSON.parse(entity.documents) : entity.documents,
                        information: entity.information && typeOf(entity.information) == "string" ? JSON.parse(entity.information) : entity.information
                    }
                    documentsCount += entity.documents && typeOf(entity.documents) == 'Array' ? entity.documents.length : 0;
                    totalAmount += entity.approved_amount;
                    return entity
                })
                return { totalAmount, documentsCount, ...item };
            })


            // employeeDeductions


            // type = type == 'Income From Previous Employer' ? 'Income From Previous Employer' : 'House Property'
            // let [houseProperty, totalCount] = await Promise.all([
            //     DeductionModel.getLta({ ...value, organization_id, deduction_name: type }),
            //     DeductionModel.getLta({ isCount: true, ...value, organization_id, deduction_name: type })
            // ])
            // if (houseProperty.length == 0) return sendResponse(res, 401, null, translate(commonMessages, "2", language), null);

            // totalCount = totalCount.length != 0 ? totalCount[0]['totalCount'] : 0;
            // houseProperty = houseProperty.map(item => {
            //     return {
            //         ...item,
            //         information: item['information'] ? JSON.parse(item['information']) : {},
            //         documents: item['documents'] ? JSON.parse(item['documents']) : {}
            //     }
            // })
            // return sendResponse(res, 200, { totalCount, skipCount: skip + limit, houseProperty }, translate(commonMessages, "1", language), null);
            return sendResponse(res, 200, { totalCount, skipCount: skip + limit, otherIncome: employeeDeductions }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }

    static async getComponents(req, res, next) {
        try {
            const { language } = req.decoded;

            const components = await DeductionModel.getDeductionComponents({ otherIncome: false });
            if (components.length == 0) return sendResponse(
                res,
                401,
                null,
                translate(commonMessages, "2", language), null
            );

            return sendResponse(
                res,
                200,
                components,
                translate(commonMessages, "1", language), null
            );

        } catch (err) {
            next(err);
        }
    }

    static async addBankInterest(req, res, next) {
        try {
            let { organization_id, language, employee_id } = req.decoded;
            let { value, error } = DeductionsValidator.addBankInterest(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            // declaration window and active check
            const isDeclarationWindowOpenAndActive = await this.isDeclarationWindowOpenAndActive(organization_id);
            if (!isDeclarationWindowOpenAndActive) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            const { financial_year, comment, bankName, id, declaration_component_id, amount } = value;
            const bankInterest = await DeductionModel.upsertBankInterest({
                comment,
                financial_year,
                organization_id,
                employee_id,
                information: JSON.stringify({ bankInterest: { bankName } }),
                id,
                declaration_component_id,
                amount
            });
            if (bankInterest && bankInterest.affectedRows == 0) return sendResponse(
                res,
                400,
                null,
                translate(commonMessages, "4", language),
                null);
            value.id = value.id ? value.id : (bankInterest && bankInterest.insertId ? bankInterest.insertId : null)
            return sendResponse(res, 200, value, translate(commonMessages, "1", language), null);

        } catch (err) {
            return sendResponse(res, 400, null, "Something went wrong", err.message);
        }
    }

    static async addPension(req, res, next) {
        try {
            let { organization_id, language, employee_id } = req.decoded;
            let { value, error } = DeductionsValidator.addPension(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            // declaration window and active check
            const isDeclarationWindowOpenAndActive = await this.isDeclarationWindowOpenAndActive(organization_id);
            if (!isDeclarationWindowOpenAndActive) {
                return res.json({ code: 404, data: null, message: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language), error: translate(declarationMessages, 'DECLARATION_WINDOW_CLOSED', language) });
            }

            let { memberName, relationType, amount, date, id, declaration_component_id, financial_year, comment } = value;

            const pension = await DeductionModel.upsertBankInterest({
                comment,
                financial_year,
                organization_id,
                employee_id,
                information: JSON.stringify({ incomeFromPension: { memberName, relationType, amount, date } }),
                id,
                declaration_component_id,
                amount
            });
            if (pension && pension.affectedRows == 0) return sendResponse(
                res,
                400,
                null,
                translate(commonMessages, "4", language),
                null);
            value.id = value.id ? value.id : (pension && pension.insertId ? pension.insertId : null)
            return sendResponse(res, 200, value, translate(commonMessages, "1", language), null);

        } catch (err) {
            return sendResponse(res, 400, null, "Something went wrong", err.message);
        }
    }


    static async getEmployeeDeduction(req, res, next) {
        try {
            let { organization_id, language, employee_id, first_name, last_name } = req.decoded;

            let { value, error } = DeductionsValidator.getEmployeeDeduction({ ...req.query, employee_id });
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            let deductions = await DeductionModel.getDeductionsDetails({ withOtherDeductions: value.withOtherDeductions, onlyDeduction: true, financialYear: value.financial_year, employeeIds: [employee_id], organization_id });
            let components = await DeductionModel.getDeductionComponents({ otherIncome: true, withOtherDeductions: value.withOtherDeductions })
            let componentIds = [...new Set(_.pluck(deductions, 'declaration_component_id'))]
            components = componentIds.length !== 0 ? components.filter(x => !componentIds.includes(x.id)) : components;
            components = components.map(i => ({
                id: null,
                full_name: first_name + last_name,
                deduction_name: i.name,
                employee_id,
                declared_amount: 0,
                approved_amount: 0,
                date_range: null,
                documents: null,
                status: 0,
                comments: null,
                information: null,
                landlord_pan: null,
                declaration_component_id: i.id,
                section: i.section,
                // allowed_amount: i.section && i.section.toUpperCase() == '80C' ? 0 : i.allowed_amount,
                allowed_amount: i.allowed_amount,
                section_limit: i.section_limit
            }))

            deductions = [...deductions, ...components];
            return sendResponse(res, 200, { deductions }, translate(commonMessages, "1", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, "Something went wrong", err.message);
        }
    }

    static async deleteDeductions(req, res, next) {
        try {
            let { organization_id, language, employee_id } = req.decoded;
            let { value, error } = DeductionsValidator.deleteDeductions(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);
            const { ids } = value;

            const deductions = await DeductionModel.deleteDeductions({ ids, organization_id });
            if (deductions.affectedRows == 0) return sendResponse(res, 400, null, 'Invalid Input', 'Invalid Input');

            return sendResponse(res, 200, deductions, 'Success', 'Success');

        } catch (err) {
            next(err)
        }
    }

    /**
     * @method isDeclarationWindowOpenAndActive
     * @description funtion to check window open and active
     * @param {*} organization_id 
     * @returns {Boolean}
     * @author Amit Verma <amitverma@globussoft.in>
     */
    static async isDeclarationWindowOpenAndActive(organization_id) {
        const { isDeclarationWindowOpen, yearly: yearlyDeclarationWindow } = await declarationSettingService.getDeclarationSettings(organization_id);
        const nowDate = moment().format('YYYY-MM-DD');

        if (
            !isDeclarationWindowOpen ||
            !yearlyDeclarationWindow ||
            (
                yearlyDeclarationWindow &&
                !moment(nowDate).isBetween(
                    moment(yearlyDeclarationWindow.from).format('YYYY-MM-DD'),
                    moment(yearlyDeclarationWindow.to).format('YYYY-MM-DD'),
                    'days',
                    '[]' // including start and end days
                )
            )
        ) {
            return false;
        }
        return true;
    }

    /**
     * @static
     * @method getDeclarationComponents
     * @description funtion to get declaration components
     * 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    static async getDeclarationComponents({ deduction_name }) {
        try {
            return await DeductionModel.getDeclarationComponents({ deduction_name });
        } catch (err) {
            throw err;
        }
    }

    /**
     * @static
     * @method getEmployee
     * @description funtion to get employee
     *
     * @author Amit Verma <amitverma@globussoft.in>
     */
    static async getEmployee({ organization_id, employee_id }) {
        try {
            return await DeductionModel.getEmployee({ organization_id, employee_id });
        } catch (err) {
            throw err;
        }
    }

    static async getReimbursement(req, res, next) {
        try {
            let { organization_id, employee_id: loginEmployeeId, is_manager, is_teamlead, role_id } = req.decoded;

            let { value, error } = DeductionsValidator.getReimbursementValidation({ ...req.query });

            if (error) return sendResponse(res, 401, null, "Validation failed", error.details[0].message);

            const { skip, limit, financialYear, employee_id, search } = value;

            const is_assigned_to = is_manager || is_teamlead ? loginEmployeeId : null;

            let { date = null, startDataFormat = null, endDataFormat = null } = value
            if (date) {
                moment(date.from).format('YYYY-MM-DD')

                let lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                let firstDate = new Date(date.getFullYear(), date.getMonth() + 1, 1).getDate();
                let currentMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getMonth() + 1;
                let currentYear = new Date(date.getFullYear(), date.getMonth() + 1, 0).getFullYear();

                // startDataFormat = moment((currentYear + '-' + currentMonth + '-' + firstDate), "YYYY-MM-DD");
                // endDataFormat = moment((currentYear + '-' + currentMonth + '-' + lastDate), "YYYY-MM-DD");;

                startDataFormat = currentYear + '-' + currentMonth + '-' + firstDate;
                endDataFormat = currentYear + '-' + currentMonth + '-' + lastDate;

            }


            let [reimbursementData, totalCount] = await Promise.all([
                DeductionModel.getReimbursement({ is_assigned_to, role_id, organization_id, skip, limit, financialYear, employee_id, search, startDataFormat, endDataFormat }),
                DeductionModel.getReimbursement({ is_assigned_to, role_id, organization_id, skip, limit, financialYear, employee_id, search, isCount: true, startDataFormat, endDataFormat })
            ]);



            if (reimbursementData.length > 0)
                return sendResponse(res, 200, { totalCount, reimbursementData }, "Details fetched Successfully", null);

            else
                return sendResponse(res, 400, null, "No data found", "No data found");

        } catch (err) {
            console.log("error is---", err.message)
            return sendResponse(res, 401, null, "Error Occured", "Error occured");
        }
    }

    static async upsertReimbursement(req, res, next) {
        try {

            let { organization_id } = req.decoded;

            let { value, error } = DeductionsValidator.postReimbursement(req.body);

            if (error)
                return res.json({ code: 401, data: null, error: error.details[0].message, message: 'Validation failed' });

            let { skip, limit, financial_year, employee_id, search, id, comment, component_name, declared_date, declared_amount } = value;

            const [declarationComponentObj] = await DeductionModel.getDeclarationComponents({ deduction_name: "reimbursement" });

            if (!declarationComponentObj) return (res, 401, null, translate(commonMessages, "3", language), translate(commonMessages, "3", language));

            const declaration_component_id = declarationComponentObj.id;

            let reimbursement = null;

            if (id) {
                reimbursement = await DeductionModel.updateHra({
                    comments: JSON.stringify({ employee_comment: { comment } }), id, organization_id,
                    id, declared_amount
                })
            } else {
                reimbursement = await DeductionModel.insertHra({
                    comments: JSON.stringify({ employee_comment: { comment } }), financial_year, organization_id, employee_id,
                    information: JSON.stringify({ reimbursement: { declared_date, component_name } }),
                    declaration_component_id, declared_amount
                })
            }


            if (reimbursement && reimbursement.affectedRows == 0)
                return res.json({ code: 400, data: null, error: "Data not Updated", message: 'Data not Updated' });
            if (reimbursement && reimbursement.insertId) { id = reimbursement.insertId };

            return res.json({ code: 200, data: { id }, error: null, message: 'Data added Successfully' });

        } catch (err) {

            return res.json({ code: 401, data: null, error: 'Some Error occured.', message: 'Some Error occured.' });

        }
    }

    static async putReimbursement(req, res, next) {
        try {

            let { organization_id } = req.decoded;

            let { value, error } = DeductionsValidator.putReimbursement(req.body);

            if (error)
                return res.json({ code: 401, data: null, error: error.details[0].message, message: 'Validation failed' });

            let { employee_id, id, comment, approved_amount, status } = value;


            let reimbursementData = await DeductionModel.getReimbursement({ organization_id, employee_id, id })


            if (!reimbursementData.length)
                return res.json({ code: 400, data: "No data Found", error: "No data Found", message: 'No data Found' });

            let emp_comments = reimbursementData[0].comments

            let putReimbursement = await DeductionModel.updateDeductions({
                comment: JSON.stringify({ employee_comment: { comment: emp_comments }, admin_comment: { comment } }), id, organization_id,
                id, approved_amount, status
            })



            return res.json({ code: 200, data: "Data Updated", error: null, message: 'Data added Successfully' });

        } catch (err) {
            return res.json({ code: 401, data: null, error: 'Some Error occured.', message: 'Some Error occured.' });

        }
    }


    static async deleteReimbursement(req, res, next) {
        try {

            let { employee_id, organization_id } = req.decoded;

            let { value, error } = DeductionsValidator.deleteReimbursement(req.body);

            if (error)
                return res.json({ code: 401, data: null, error: error.details[0].message, message: 'Validation failed' });

            let { id } = value;


            let reimbursementData = await DeductionModel.getReimbursement({ organization_id, employee_id, id, status: true })


            if (!reimbursementData.length)
                return res.json({ code: 400, data: "Can't Delete request after Approved/Declined", error: "Can't Delete request after Approved/Declined", message: "Can't Delete request after Approved/Declined" });



            let putReimbursement = await DeductionModel.deleteDeductions({
                ids: [id], organization_id
            })



            return res.json({ code: 200, data: "Data Deleted", error: null, message: 'Data Deleted Successfully' });

        } catch (err) {
            return res.json({ code: 401, data: null, error: 'Some Error occured.', message: 'Some Error occured.' });

        }
    }

}
module.exports = { DeductionsService };
